import { auth } from "@/lib/auth";
import { getStockBalances } from "@/lib/inventory/stock";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const [balances, recent] = await Promise.all([
    getStockBalances(companyId),
    prisma.stockEntry.findMany({
      where: { companyId },
      include: { item: true, godown: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="inventory-heading">Inventory / Godown stock</h1>
      <p className="mt-1 text-sm text-slate-500">
        Balances update when sales (qty out) and purchases (qty in) are posted
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm" data-testid="inventory-balances">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Godown</th>
              <th className="px-4 py-3 font-medium text-right">In</th>
              <th className="px-4 py-3 font-medium text-right">Out</th>
              <th className="px-4 py-3 font-medium text-right">Balance</th>
              <th className="px-4 py-3 font-medium">Unit</th>
            </tr>
          </thead>
          <tbody>
            {balances.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No stock movements yet.
                </td>
              </tr>
            ) : (
              balances.map((b) => (
                <tr key={`${b.itemId}-${b.godownId}`} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{b.itemName}</td>
                  <td className="px-4 py-3">{b.sku ?? "—"}</td>
                  <td className="px-4 py-3">{b.godownName}</td>
                  <td className="px-4 py-3 text-right">{b.qtyIn}</td>
                  <td className="px-4 py-3 text-right">{b.qtyOut}</td>
                  <td className="px-4 py-3 text-right font-semibold text-tilla-800">
                    {b.balance}
                  </td>
                  <td className="px-4 py-3">{b.unit}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-medium">Recent movements</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Godown</th>
              <th className="px-4 py-3 font-medium text-right">In</th>
              <th className="px-4 py-3 font-medium text-right">Out</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((e) => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  {e.createdAt.toISOString().slice(0, 19).replace("T", " ")} UTC
                </td>
                <td className="px-4 py-3">{e.item.name}</td>
                <td className="px-4 py-3">{e.godown.name}</td>
                <td className="px-4 py-3 text-right">{Number(e.qtyIn)}</td>
                <td className="px-4 py-3 text-right">{Number(e.qtyOut)}</td>
                <td className="px-4 py-3 text-slate-500">{e.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
