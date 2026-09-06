import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EInvoiceClient } from "./e-invoice-client";

export default async function EInvoicePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;

  const [vouchers, records] = await Promise.all([
    prisma.voucher.findMany({
      where: { companyId, voucherType: { name: "Sales" }, status: "posted" },
      include: { party: true },
      orderBy: [{ date: "desc" }, { number: "desc" }],
      take: 50,
    }),
    prisma.eInvoiceRecord.findMany({
      where: { companyId },
      include: { voucher: true },
      orderBy: { requestedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">E-invoice</h1>
      <p className="mt-1 text-sm text-slate-500">Stub IRN generation + status store</p>
      <div className="mt-6">
        <EInvoiceClient
          vouchers={vouchers.map((v) => ({
            id: v.id,
            number: v.number,
            date: v.date.toISOString().slice(0, 10),
            party: v.party?.name ?? "—",
            total: Number(v.totalAmount),
          }))}
        />
      </div>

      <h2 className="mt-10 font-medium">Stored status</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Voucher</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">IRN</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No e-invoice requests yet.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {r.requestedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
                  </td>
                  <td className="px-4 py-3">#{r.voucher.number}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.irn ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.message}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
