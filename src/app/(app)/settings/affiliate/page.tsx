import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AffiliatePage() {
  const session = await auth();
  if (session!.user.role === "ca_viewer") {
    redirect("/dashboard");
  }
  const userId = session!.user.id;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const referrals = await prisma.affiliateReferral.findMany({
    where: { referrerId: userId },
    include: { earnings: true },
    orderBy: { createdAt: "desc" },
  });

  const earnings = referrals.flatMap((r) => r.earnings);
  const accrued = earnings
    .filter((e) => e.status === "accrued" || e.status === "payout_pending")
    .reduce((s, e) => s + Number(e.amountInr), 0);
  const paidStub = earnings
    .filter((e) => e.status === "paid_stub")
    .reduce((s, e) => s + Number(e.amountInr), 0);
  const lifetime = earnings.reduce((s, e) => s + Number(e.amountInr), 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="affiliate-heading">
        Affiliate / referrals
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Models only — no live payouts or payment gateway
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Your referral code</div>
          <div
            className="mt-2 font-mono text-xl font-semibold text-tilla-800"
            data-testid="referral-code"
          >
            {user.referralCode ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Accrued (stub)</div>
          <div className="mt-2 text-xl font-semibold" data-testid="earnings-accrued">
            ₹{accrued.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Paid stub / lifetime</div>
          <div className="mt-2 text-xl font-semibold" data-testid="earnings-lifetime">
            ₹{paidStub.toFixed(2)} / ₹{lifetime.toFixed(2)}
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-medium">Referrals</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm" data-testid="referrals-table">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Referee email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No referrals yet. Share code {user.referralCode} when signup
                  attribution is wired.
                </td>
              </tr>
            ) : (
              referrals.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3">{r.refereeEmail ?? "—"}</td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="px-4 py-3">
                    ₹
                    {r.earnings
                      .reduce((s, e) => s + Number(e.amountInr), 0)
                      .toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-medium">Earnings detail</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm" data-testid="earnings-table">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No earnings rows yet.
                </td>
              </tr>
            ) : (
              earnings.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">
                    {e.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-3">{e.planCode ?? "—"}</td>
                  <td className="px-4 py-3">₹{Number(e.amountInr).toFixed(2)}</td>
                  <td className="px-4 py-3">{e.status}</td>
                  <td className="px-4 py-3 text-slate-600">{e.note ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
