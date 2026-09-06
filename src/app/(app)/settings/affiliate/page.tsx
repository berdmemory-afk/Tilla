import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AffiliatePage() {
  const session = await auth();
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

  return (
    <div>
      <h1 className="text-2xl font-semibold">Affiliate / referrals</h1>
      <p className="mt-1 text-sm text-slate-500">
        Models only — no live payouts or payment gateway
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Your referral code</div>
          <div className="mt-2 font-mono text-xl font-semibold text-tilla-800">
            {user.referralCode ?? "—"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">Accrued earnings (stub)</div>
          <div className="mt-2 text-xl font-semibold">₹{accrued.toFixed(2)}</div>
        </div>
      </div>

      <h2 className="mt-10 font-medium">Referrals</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
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
    </div>
  );
}
