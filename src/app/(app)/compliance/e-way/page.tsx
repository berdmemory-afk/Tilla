import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EWayClient } from "./e-way-client";

export default async function EWayPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;

  const [vouchers, records] = await Promise.all([
    prisma.voucher.findMany({
      where: {
        companyId,
        status: "posted",
        voucherType: { name: { in: ["Sales", "Purchase"] } },
      },
      include: { party: true, voucherType: true },
      orderBy: [{ date: "desc" }, { number: "desc" }],
      take: 50,
    }),
    prisma.eWayBillRecord.findMany({
      where: { companyId },
      include: { voucher: { include: { voucherType: true } } },
      orderBy: { requestedAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">E-way bill</h1>
      <p className="mt-1 text-sm text-slate-500">Stub e-way generation + status store</p>
      <div className="mt-6">
        <EWayClient
          vouchers={vouchers.map((v) => ({
            id: v.id,
            label: `${v.voucherType.name} #${v.number} · ${v.date
              .toISOString()
              .slice(0, 10)} · ${v.party?.name ?? "—"} · ₹${Number(v.totalAmount).toFixed(2)}`,
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
              <th className="px-4 py-3">E-way no.</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No e-way requests yet.
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {r.requestedAt.toISOString().slice(0, 19).replace("T", " ")} UTC
                  </td>
                  <td className="px-4 py-3">
                    {r.voucher.voucherType.name} #{r.voucher.number}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{r.status}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.ewayBillNo ?? "—"}</td>
                  <td className="px-4 py-3">{r.vehicleNumber ?? "—"}</td>
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
