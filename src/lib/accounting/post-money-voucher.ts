import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/tax/gst";
import type {
  JournalVoucherInput,
  PaymentReceiptInput,
} from "@/lib/validations/money-voucher";
import { assertBalanced, nextVoucherNumber } from "./balance";
import { d } from "./decimal";

/**
 * Payment: Dr Party, Cr Cash/Bank
 */
export async function postPaymentVoucher(input: PaymentReceiptInput) {
  const party = await prisma.party.findFirstOrThrow({
    where: { id: input.partyId, companyId: input.companyId },
  });
  if (!party.ledgerId) throw new Error("Party has no linked ledger");

  const cash = await prisma.ledger.findFirstOrThrow({
    where: { id: input.cashLedgerId, companyId: input.companyId },
  });

  const voucherType = await prisma.voucherType.findFirstOrThrow({
    where: { companyId: input.companyId, name: "Payment" },
  });
  const count = await prisma.voucher.count({
    where: { companyId: input.companyId, voucherTypeId: voucherType.id },
  });
  const amount = round2(input.amount);
  const lines = [
    {
      ledgerId: party.ledgerId,
      debit: amount,
      credit: 0,
      narration: "Payment to party",
    },
    {
      ledgerId: cash.id,
      debit: 0,
      credit: amount,
      narration: `Paid from ${cash.name}`,
    },
  ];
  assertBalanced(lines);

  const voucher = await prisma.voucher.create({
    data: {
      companyId: input.companyId,
      voucherTypeId: voucherType.id,
      number: nextVoucherNumber(count),
      date: new Date(input.date),
      partyId: party.id,
      narration: input.narration ?? `Payment to ${party.name}`,
      totalAmount: d(amount),
      status: "posted",
      lines: {
        create: lines.map((l) => ({
          ledgerId: l.ledgerId,
          debit: d(l.debit),
          credit: d(l.credit),
          narration: l.narration,
        })),
      },
    },
    include: {
      lines: { include: { ledger: true } },
      party: true,
      voucherType: true,
    },
  });

  return { voucher };
}

/**
 * Receipt: Dr Cash/Bank, Cr Party
 */
export async function postReceiptVoucher(input: PaymentReceiptInput) {
  const party = await prisma.party.findFirstOrThrow({
    where: { id: input.partyId, companyId: input.companyId },
  });
  if (!party.ledgerId) throw new Error("Party has no linked ledger");

  const cash = await prisma.ledger.findFirstOrThrow({
    where: { id: input.cashLedgerId, companyId: input.companyId },
  });

  const voucherType = await prisma.voucherType.findFirstOrThrow({
    where: { companyId: input.companyId, name: "Receipt" },
  });
  const count = await prisma.voucher.count({
    where: { companyId: input.companyId, voucherTypeId: voucherType.id },
  });
  const amount = round2(input.amount);
  const lines = [
    {
      ledgerId: cash.id,
      debit: amount,
      credit: 0,
      narration: `Received in ${cash.name}`,
    },
    {
      ledgerId: party.ledgerId,
      debit: 0,
      credit: amount,
      narration: "Receipt from party",
    },
  ];
  assertBalanced(lines);

  const voucher = await prisma.voucher.create({
    data: {
      companyId: input.companyId,
      voucherTypeId: voucherType.id,
      number: nextVoucherNumber(count),
      date: new Date(input.date),
      partyId: party.id,
      narration: input.narration ?? `Receipt from ${party.name}`,
      totalAmount: d(amount),
      status: "posted",
      lines: {
        create: lines.map((l) => ({
          ledgerId: l.ledgerId,
          debit: d(l.debit),
          credit: d(l.credit),
          narration: l.narration,
        })),
      },
    },
    include: {
      lines: { include: { ledger: true } },
      party: true,
      voucherType: true,
    },
  });

  return { voucher };
}

/**
 * Journal: arbitrary balanced lines
 */
export async function postJournalVoucher(input: JournalVoucherInput) {
  const lines = input.lines.map((l) => ({
    ledgerId: l.ledgerId,
    debit: round2(l.debit),
    credit: round2(l.credit),
    narration: l.narration,
  }));
  const { debitSum } = assertBalanced(lines);

  for (const l of lines) {
    const led = await prisma.ledger.findFirst({
      where: { id: l.ledgerId, companyId: input.companyId },
    });
    if (!led) throw new Error(`Ledger not found: ${l.ledgerId}`);
  }

  const voucherType = await prisma.voucherType.findFirstOrThrow({
    where: { companyId: input.companyId, name: "Journal" },
  });
  const count = await prisma.voucher.count({
    where: { companyId: input.companyId, voucherTypeId: voucherType.id },
  });

  const voucher = await prisma.voucher.create({
    data: {
      companyId: input.companyId,
      voucherTypeId: voucherType.id,
      number: nextVoucherNumber(count),
      date: new Date(input.date),
      narration: input.narration ?? "Journal entry",
      totalAmount: d(debitSum),
      status: "posted",
      lines: {
        create: lines.map((l) => ({
          ledgerId: l.ledgerId,
          debit: d(l.debit),
          credit: d(l.credit),
          narration: l.narration,
        })),
      },
    },
    include: {
      lines: { include: { ledger: true } },
      voucherType: true,
    },
  });

  return { voucher };
}
