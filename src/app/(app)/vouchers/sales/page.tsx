import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SalesVouchersPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;

  const vouchers = await prisma.voucher.findMany({
    where: { companyId, voucherType: { name: "Sales" } },
    include: { party: true },
    orderBy: [{ date: "desc" }, { number: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Vouchers</h1>
          <p className="mt-1 text-sm text-slate-500">GST outward supplies</p>
        </div>
        <Link
          href="/vouchers/sales/new"
          className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700"
        >
          New sales
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">No.</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Party</th>
              <th className="px-4 py-3 font-medium">Taxable</th>
              <th className="px-4 py-3 font-medium">CGST</th>
              <th className="px-4 py-3 font-medium">SGST</th>
              <th className="px-4 py-3 font-medium">IGST</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No sales vouchers yet. Post an intra-state GST sale to begin.
                </td>
              </tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{v.number}</td>
                  <td className="px-4 py-3">
                    {v.date.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{v.party?.name ?? "—"}</td>
                  <td className="px-4 py-3">₹{Number(v.taxableAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">₹{Number(v.cgstAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">₹{Number(v.sgstAmount).toFixed(2)}</td>
                  <td className="px-4 py-3">₹{Number(v.igstAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-medium">
                    ₹{Number(v.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
