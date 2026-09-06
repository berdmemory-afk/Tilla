import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const companyId = session?.user.companyId;
  if (!companyId) {
    return <p>No company membership found. Re-seed the database.</p>;
  }

  const [voucherCount, partyCount, itemCount] = await Promise.all([
    prisma.voucher.count({ where: { companyId } }),
    prisma.party.count({ where: { companyId } }),
    prisma.item.count({ where: { companyId } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Foundation vertical slice: GST sales voucher → Day Book / Trial Balance
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Posted vouchers", value: voucherCount },
          { label: "Parties", value: partyCount },
          { label: "Items", value: itemCount },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="mt-2 text-3xl font-semibold text-tilla-800">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-slate-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/vouchers/sales/new"
            className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700"
          >
            New GST sales voucher
          </Link>
          <Link
            href="/reports/day-book"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Day Book
          </Link>
          <Link
            href="/reports/trial-balance"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Trial Balance
          </Link>
        </div>
      </div>
    </div>
  );
}
