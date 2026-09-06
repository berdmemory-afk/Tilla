import { prisma } from "@/lib/prisma";
import { d } from "@/lib/accounting/decimal";
import { round2 } from "@/lib/tax/gst";
import type { Prisma } from "@prisma/client";

export type StockMovement = {
  itemId: string;
  quantity: number;
  direction: "in" | "out";
};

/** Resolve primary godown or throw. */
export async function getPrimaryGodown(companyId: string, tx?: Prisma.TransactionClient) {
  const db = tx ?? prisma;
  const godown = await db.godown.findFirst({
    where: { companyId, isPrimary: true },
  });
  if (!godown) {
    throw new Error("No primary godown configured");
  }
  return godown;
}

export async function recordStockMovements(
  tx: Prisma.TransactionClient,
  opts: {
    companyId: string;
    voucherId: string;
    godownId: string;
    movements: StockMovement[];
    note?: string;
  }
) {
  for (const m of opts.movements) {
    if (m.quantity <= 0) continue;
    await tx.stockEntry.create({
      data: {
        companyId: opts.companyId,
        itemId: m.itemId,
        godownId: opts.godownId,
        voucherId: opts.voucherId,
        qtyIn: m.direction === "in" ? d(m.quantity) : d(0),
        qtyOut: m.direction === "out" ? d(m.quantity) : d(0),
        note: opts.note,
      },
    });
  }
}

export async function getStockBalances(companyId: string) {
  const entries = await prisma.stockEntry.findMany({
    where: { companyId },
    include: { item: true, godown: true },
  });

  type Key = string;
  const map = new Map<
    Key,
    {
      itemId: string;
      itemName: string;
      sku: string | null;
      unit: string;
      godownId: string;
      godownName: string;
      qtyIn: number;
      qtyOut: number;
      balance: number;
    }
  >();

  for (const e of entries) {
    const key = `${e.itemId}:${e.godownId}`;
    const row = map.get(key) ?? {
      itemId: e.itemId,
      itemName: e.item.name,
      sku: e.item.sku,
      unit: e.item.unit,
      godownId: e.godownId,
      godownName: e.godown.name,
      qtyIn: 0,
      qtyOut: 0,
      balance: 0,
    };
    row.qtyIn = round2(row.qtyIn + Number(e.qtyIn));
    row.qtyOut = round2(row.qtyOut + Number(e.qtyOut));
    row.balance = round2(row.qtyIn - row.qtyOut);
    map.set(key, row);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.itemName.localeCompare(b.itemName)
  );
}
