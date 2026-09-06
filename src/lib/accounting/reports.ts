import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/tax/gst";

export async function getDayBook(companyId: string, from?: Date, to?: Date) {
  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "posted",
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    include: {
      voucherType: true,
      party: true,
      lines: { include: { ledger: true } },
    },
    orderBy: [{ date: "asc" }, { number: "asc" }],
  });

  return vouchers.map((v) => ({
    id: v.id,
    date: v.date,
    type: v.voucherType.name,
    number: v.number,
    party: v.party?.name ?? null,
    narration: v.narration,
    taxableAmount: Number(v.taxableAmount),
    cgstAmount: Number(v.cgstAmount),
    sgstAmount: Number(v.sgstAmount),
    igstAmount: Number(v.igstAmount),
    totalAmount: Number(v.totalAmount),
    lines: v.lines.map((l) => ({
      ledger: l.ledger.name,
      debit: Number(l.debit),
      credit: Number(l.credit),
    })),
  }));
}

export async function getTrialBalance(companyId: string) {
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { lines: true },
    orderBy: { name: "asc" },
  });

  const rows = ledgers.map((ledger) => {
    const openingDr = Number(ledger.openingDr);
    const openingCr = Number(ledger.openingCr);
    const movementDr = ledger.lines.reduce((s, l) => s + Number(l.debit), 0);
    const movementCr = ledger.lines.reduce((s, l) => s + Number(l.credit), 0);
    const netDr = round2(openingDr + movementDr);
    const netCr = round2(openingCr + movementCr);
    const balanceDr = netDr > netCr ? round2(netDr - netCr) : 0;
    const balanceCr = netCr > netDr ? round2(netCr - netDr) : 0;
    return {
      id: ledger.id,
      name: ledger.name,
      gstRole: ledger.gstRole,
      debit: balanceDr,
      credit: balanceCr,
    };
  }).filter((r) => r.debit !== 0 || r.credit !== 0);

  const totalDebit = round2(rows.reduce((s, r) => s + r.debit, 0));
  const totalCredit = round2(rows.reduce((s, r) => s + r.credit, 0));

  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}
