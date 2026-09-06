import { prisma } from "@/lib/prisma";
import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";
import type { SalesVoucherInput } from "@/lib/validations/sales-voucher";
import { assertBalanced, nextVoucherNumber } from "./balance";
import { d } from "./decimal";
import { getPrimaryGodown, recordStockMovements } from "@/lib/inventory/stock";
import { assertBooksOpen } from "@/lib/fy-lock";

/**
 * Post an intra/inter-state GST sales voucher with double-entry lines:
 *   Dr Party (Sundry Debtors)
 *   Cr Sales
 *   Cr Output CGST / SGST (intra) or Output IGST (inter)
 * Also records stock qtyOut at primary (or given) godown.
 */
export async function postSalesVoucher(input: SalesVoucherInput) {
  await assertBooksOpen(input.companyId);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: input.companyId },
  });
  const party = await prisma.party.findFirstOrThrow({
    where: { id: input.partyId, companyId: input.companyId },
  });
  if (!party.ledgerId) {
    throw new Error("Party has no linked debtor ledger");
  }

  const salesLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "sales" },
  });
  const cgstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "output_cgst" },
  });
  const sgstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "output_sgst" },
  });
  const igstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "output_igst" },
  });

  const voucherType = await prisma.voucherType.findFirstOrThrow({
    where: { companyId: input.companyId, name: "Sales" },
  });

  const count = await prisma.voucher.count({
    where: { companyId: input.companyId, voucherTypeId: voucherType.id },
  });
  const number = nextVoucherNumber(count);

  type LineItem = {
    itemId: string;
    quantity: number;
    rate: number;
    gstRatePct: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
  };

  const lineItems: LineItem[] = [];
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  for (const row of input.items) {
    const item = await prisma.item.findFirstOrThrow({
      where: { id: row.itemId, companyId: input.companyId },
    });
    const qty = row.quantity;
    const rate = row.rate;
    const gstRate = row.gstRatePct ?? Number(item.gstRatePct);
    const taxable = round2(qty * rate);
    const split = computeGst(taxable, gstRate, input.isIntraState);
    lineItems.push({
      itemId: item.id,
      quantity: qty,
      rate,
      gstRatePct: gstRate,
      taxableAmount: taxable,
      cgstAmount: split.cgst,
      sgstAmount: split.sgst,
      igstAmount: split.igst,
    });
    taxableTotal = round2(taxableTotal + taxable);
    cgstTotal = round2(cgstTotal + split.cgst);
    sgstTotal = round2(sgstTotal + split.sgst);
    igstTotal = round2(igstTotal + split.igst);
  }

  const totalTax = round2(cgstTotal + sgstTotal + igstTotal);
  const totalAmount = round2(taxableTotal + totalTax);

  const lines: { ledgerId: string; debit: number; credit: number; narration?: string }[] = [
    {
      ledgerId: party.ledgerId,
      debit: totalAmount,
      credit: 0,
      narration: "Sales invoice receivable",
    },
    {
      ledgerId: salesLedger.id,
      debit: 0,
      credit: taxableTotal,
      narration: "Sales",
    },
  ];

  if (input.isIntraState) {
    if (cgstTotal > 0) {
      lines.push({ ledgerId: cgstLedger.id, debit: 0, credit: cgstTotal, narration: "Output CGST" });
    }
    if (sgstTotal > 0) {
      lines.push({ ledgerId: sgstLedger.id, debit: 0, credit: sgstTotal, narration: "Output SGST" });
    }
  } else if (igstTotal > 0) {
    lines.push({ ledgerId: igstLedger.id, debit: 0, credit: igstTotal, narration: "Output IGST" });
  }

  assertBalanced(lines);

  const godown = input.godownId
    ? await prisma.godown.findFirstOrThrow({
        where: { id: input.godownId, companyId: input.companyId },
      })
    : await getPrimaryGodown(input.companyId);

  const voucher = await prisma.$transaction(async (tx) => {
    const v = await tx.voucher.create({
      data: {
        companyId: input.companyId,
        voucherTypeId: voucherType.id,
        number,
        date: new Date(input.date),
        partyId: party.id,
        narration: input.narration ?? `Sales to ${party.name}`,
        placeOfSupply: input.placeOfSupply ?? company.stateCode,
        isIntraState: input.isIntraState,
        taxableAmount: d(taxableTotal),
        cgstAmount: d(cgstTotal),
        sgstAmount: d(sgstTotal),
        igstAmount: d(igstTotal),
        totalAmount: d(totalAmount),
        status: "posted",
        lines: {
          create: lines.map((l) => ({
            ledgerId: l.ledgerId,
            debit: d(l.debit),
            credit: d(l.credit),
            narration: l.narration,
          })),
        },
        items: {
          create: lineItems.map((li) => ({
            itemId: li.itemId,
            quantity: d(li.quantity),
            rate: d(li.rate),
            taxableAmount: d(li.taxableAmount),
            gstRatePct: d(li.gstRatePct),
            cgstAmount: d(li.cgstAmount),
            sgstAmount: d(li.sgstAmount),
            igstAmount: d(li.igstAmount),
          })),
        },
      },
      include: {
        lines: { include: { ledger: true } },
        items: { include: { item: true } },
        party: true,
        voucherType: true,
      },
    });

    await recordStockMovements(tx, {
      companyId: input.companyId,
      voucherId: v.id,
      godownId: godown.id,
      movements: lineItems.map((li) => ({
        itemId: li.itemId,
        quantity: li.quantity,
        direction: "out" as const,
      })),
      note: `Sales #${number}`,
    });

    return v;
  });

  return {
    voucher,
    totals: {
      taxableAmount: taxableTotal,
      cgstAmount: cgstTotal,
      sgstAmount: sgstTotal,
      igstAmount: igstTotal,
      totalAmount,
      invoiceTotal: invoiceTotal(taxableTotal, {
        kind: input.isIntraState ? "intra" : "inter",
        cgst: cgstTotal,
        sgst: sgstTotal,
        igst: igstTotal,
        totalTax,
      } as never),
    },
  };
}
