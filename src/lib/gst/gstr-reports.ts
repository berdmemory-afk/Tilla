import { prisma } from "@/lib/prisma";
import { round2 } from "@/lib/tax/gst";

export type PeriodFilter = { from: Date; to: Date };

function periodWhere(from: Date, to: Date) {
  return { gte: from, lte: to };
}

/**
 * GSTR-1 style outward supply summary (B2B / B2C stub aggregation).
 * JSON/CSV-ready; no live GSTN push.
 */
export async function buildGstr1(companyId: string, period: PeriodFilter) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "posted",
      voucherType: { name: "Sales" },
      date: periodWhere(period.from, period.to),
    },
    include: {
      party: true,
      items: { include: { item: true } },
    },
    orderBy: [{ date: "asc" }, { number: "asc" }],
  });

  const b2b = vouchers
    .filter((v) => !!v.party?.gstin)
    .map((v) => ({
      invoiceNumber: v.number,
      invoiceDate: v.date.toISOString().slice(0, 10),
      partyName: v.party?.name ?? "",
      partyGstin: v.party?.gstin ?? "",
      placeOfSupply: v.placeOfSupply ?? company.stateCode,
      taxableAmount: Number(v.taxableAmount),
      cgst: Number(v.cgstAmount),
      sgst: Number(v.sgstAmount),
      igst: Number(v.igstAmount),
      total: Number(v.totalAmount),
      isIntraState: v.isIntraState,
    }));

  const b2c = vouchers
    .filter((v) => !v.party?.gstin)
    .map((v) => ({
      invoiceNumber: v.number,
      invoiceDate: v.date.toISOString().slice(0, 10),
      partyName: v.party?.name ?? "",
      taxableAmount: Number(v.taxableAmount),
      cgst: Number(v.cgstAmount),
      sgst: Number(v.sgstAmount),
      igst: Number(v.igstAmount),
      total: Number(v.totalAmount),
    }));

  const summary = {
    taxableAmount: round2(vouchers.reduce((s, v) => s + Number(v.taxableAmount), 0)),
    cgst: round2(vouchers.reduce((s, v) => s + Number(v.cgstAmount), 0)),
    sgst: round2(vouchers.reduce((s, v) => s + Number(v.sgstAmount), 0)),
    igst: round2(vouchers.reduce((s, v) => s + Number(v.igstAmount), 0)),
    total: round2(vouchers.reduce((s, v) => s + Number(v.totalAmount), 0)),
    invoiceCount: vouchers.length,
  };

  return {
    meta: {
      report: "GSTR-1",
      companyName: company.name,
      gstin: company.gstin,
      from: period.from.toISOString().slice(0, 10),
      to: period.to.toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      note: "Stub export — not filed to GSTN",
    },
    summary,
    b2b,
    b2c,
  };
}

/**
 * GSTR-3B style liability summary: outward tax − ITC from purchases.
 */
export async function buildGstr3b(companyId: string, period: PeriodFilter) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  const sales = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "posted",
      voucherType: { name: "Sales" },
      date: periodWhere(period.from, period.to),
    },
  });

  const purchases = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "posted",
      voucherType: { name: "Purchase" },
      date: periodWhere(period.from, period.to),
    },
  });

  const outward = {
    taxable: round2(sales.reduce((s, v) => s + Number(v.taxableAmount), 0)),
    cgst: round2(sales.reduce((s, v) => s + Number(v.cgstAmount), 0)),
    sgst: round2(sales.reduce((s, v) => s + Number(v.sgstAmount), 0)),
    igst: round2(sales.reduce((s, v) => s + Number(v.igstAmount), 0)),
  };

  const itc = {
    taxable: round2(purchases.reduce((s, v) => s + Number(v.taxableAmount), 0)),
    cgst: round2(purchases.reduce((s, v) => s + Number(v.cgstAmount), 0)),
    sgst: round2(purchases.reduce((s, v) => s + Number(v.sgstAmount), 0)),
    igst: round2(purchases.reduce((s, v) => s + Number(v.igstAmount), 0)),
  };

  const net = {
    cgst: round2(outward.cgst - itc.cgst),
    sgst: round2(outward.sgst - itc.sgst),
    igst: round2(outward.igst - itc.igst),
  };

  return {
    meta: {
      report: "GSTR-3B",
      companyName: company.name,
      gstin: company.gstin,
      from: period.from.toISOString().slice(0, 10),
      to: period.to.toISOString().slice(0, 10),
      generatedAt: new Date().toISOString(),
      note: "Stub summary — not filed to GSTN",
    },
    outwardSupplies: outward,
    eligibleItc: itc,
    netTaxPayable: net,
    salesCount: sales.length,
    purchaseCount: purchases.length,
  };
}

export function toCsv(rows: Record<string, string | number | boolean>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | boolean) => {
    const s = String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ].join("\n");
}
