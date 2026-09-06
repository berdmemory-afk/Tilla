import { prisma } from "@/lib/prisma";
import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";
import type { NoteVoucherInput } from "@/lib/validations/note-voucher";
import { assertBalanced, nextVoucherNumber } from "./balance";
import { d } from "./decimal";
import { getPrimaryGodown, recordStockMovements } from "@/lib/inventory/stock";
import { assertBooksOpen } from "@/lib/fy-lock";

/**
 * Debit Note (purchase return) — reverse of purchase GST posting:
 *   Dr Party
 *   Cr Purchase (taxable)
 *   Cr Input CGST/SGST or Input IGST
 * Stock qtyOut (goods returned to supplier).
 */
export async function postDebitNote(input: NoteVoucherInput) {
  await assertBooksOpen(input.companyId);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: input.companyId },
  });
  const party = await prisma.party.findFirstOrThrow({
    where: { id: input.partyId, companyId: input.companyId },
  });
  if (!party.ledgerId) throw new Error("Party has no linked creditor ledger");

  const purchaseLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "purchase" },
  });
  const cgstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "input_cgst" },
  });
  const sgstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "input_sgst" },
  });
  const igstLedger = await prisma.ledger.findFirstOrThrow({
    where: { companyId: input.companyId, gstRole: "input_igst" },
  });

  const voucherType = await prisma.voucherType.findFirstOrThrow({
    where: { companyId: input.companyId, name: "Debit Note" },
  });

  if (input.againstVoucherId) {
    const against = await prisma.voucher.findFirst({
      where: {
        id: input.againstVoucherId,
        companyId: input.companyId,
        status: "posted",
        voucherType: { name: "Purchase" },
      },
    });
    if (!against) throw new Error("Against purchase voucher not found");
  }

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
      narration: "Debit note to party",
    },
    {
      ledgerId: purchaseLedger.id,
      debit: 0,
      credit: taxableTotal,
      narration: "Purchase return",
    },
  ];
  if (input.isIntraState) {
    if (cgstTotal > 0) {
      lines.push({ ledgerId: cgstLedger.id, debit: 0, credit: cgstTotal, narration: "Input CGST reverse" });
    }
    if (sgstTotal > 0) {
      lines.push({ ledgerId: sgstLedger.id, debit: 0, credit: sgstTotal, narration: "Input SGST reverse" });
    }
  } else if (igstTotal > 0) {
    lines.push({ ledgerId: igstLedger.id, debit: 0, credit: igstTotal, narration: "Input IGST reverse" });
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
        narration: input.narration ?? `Debit note to ${party.name}`,
        placeOfSupply: input.placeOfSupply ?? company.stateCode,
        isIntraState: input.isIntraState,
        taxableAmount: d(taxableTotal),
        cgstAmount: d(cgstTotal),
        sgstAmount: d(sgstTotal),
        igstAmount: d(igstTotal),
        totalAmount: d(totalAmount),
        status: "posted",
        againstVoucherId: input.againstVoucherId,
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
      note: `Debit Note #${number}`,
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
