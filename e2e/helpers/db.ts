import { PrismaClient } from "@prisma/client";
import path from "path";

/** Prisma against SQLite demo DB (schema-relative file:./dev.db => prisma/dev.db). */
export function getPrisma() {
  const raw = process.env.DATABASE_URL || "file:./prisma/dev.db";
  let url = raw;
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    const rel = raw.replace(/^file:/, "");
    // Prisma schema lives in prisma/; cwd-relative ./dev.db means prisma/dev.db
    const candidates = [
      path.resolve(process.cwd(), rel),
      path.resolve(process.cwd(), "prisma", rel.replace(/^\.\//, "")),
      path.resolve(process.cwd(), "prisma/dev.db"),
    ];
    const fs = require("fs") as typeof import("fs");
    const hit = candidates.find((p) => fs.existsSync(p));
    url = "file:" + (hit || candidates[2]);
  }
  return new PrismaClient({ datasources: { db: { url } } });
}

export async function getAcmeCompanyId(prisma: PrismaClient) {
  const c = await prisma.company.findFirst({ where: { name: "Acme Traders" } });
  if (!c) throw new Error("Acme Traders not seeded");
  return c.id;
}

export async function assertVoucherBalanced(prisma: PrismaClient, voucherId: string) {
  const lines = await prisma.voucherLine.findMany({ where: { voucherId } });
  const debit = lines.reduce((s, l) => s + Number(l.debit), 0);
  const credit = lines.reduce((s, l) => s + Number(l.credit), 0);
  const round = (n: number) => Math.round(n * 100) / 100;
  if (round(debit) !== round(credit)) {
    throw new Error(`Unbalanced voucher ${voucherId}: Dr ${debit} != Cr ${credit}`);
  }
  return { debit: round(debit), credit: round(credit), lines };
}

export async function itemStockQty(prisma: PrismaClient, companyId: string, itemName: string) {
  const item = await prisma.item.findFirst({ where: { companyId, name: itemName } });
  if (!item) throw new Error(`Item ${itemName} missing`);
  const entries = await prisma.stockEntry.findMany({ where: { companyId, itemId: item.id } });
  const qtyIn = entries.reduce((s, e) => s + Number(e.qtyIn), 0);
  const qtyOut = entries.reduce((s, e) => s + Number(e.qtyOut), 0);
  return { itemId: item.id, balance: Math.round((qtyIn - qtyOut) * 100) / 100, qtyIn, qtyOut };
}

export async function getTrialBalanceTotals(prisma: PrismaClient, companyId: string) {
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    include: { lines: true },
  });
  const round = (n: number) => Math.round(n * 100) / 100;
  let totalDebit = 0;
  let totalCredit = 0;
  for (const ledger of ledgers) {
    const netDr = Number(ledger.openingDr) + ledger.lines.reduce((s, l) => s + Number(l.debit), 0);
    const netCr = Number(ledger.openingCr) + ledger.lines.reduce((s, l) => s + Number(l.credit), 0);
    if (netDr > netCr) totalDebit += round(netDr - netCr);
    else if (netCr > netDr) totalCredit += round(netCr - netDr);
  }
  totalDebit = round(totalDebit);
  totalCredit = round(totalCredit);
  return { totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}

export async function sumSalesTaxBooks(
  prisma: PrismaClient,
  companyId: string,
  from: Date,
  to: Date
) {
  const vouchers = await prisma.voucher.findMany({
    where: {
      companyId,
      status: "posted",
      voucherType: { name: "Sales" },
      date: { gte: from, lte: to },
    },
  });
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    taxable: round(vouchers.reduce((s, v) => s + Number(v.taxableAmount), 0)),
    cgst: round(vouchers.reduce((s, v) => s + Number(v.cgstAmount), 0)),
    sgst: round(vouchers.reduce((s, v) => s + Number(v.sgstAmount), 0)),
    igst: round(vouchers.reduce((s, v) => s + Number(v.igstAmount), 0)),
    total: round(vouchers.reduce((s, v) => s + Number(v.totalAmount), 0)),
    count: vouchers.length,
  };
}
