import { auth } from "@/lib/auth";
import { getTrialBalance } from "@/lib/accounting/reports";

export default async function TrialBalancePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const tb = await getTrialBalance(companyId);

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="tb-heading">Trial Balance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ledger balances (opening + movements).{" "}
        {tb.balanced ? (
          <span className="text-emerald-700" data-testid="tb-balanced">Balanced</span>
        ) : (
          <span className="text-red-600" data-testid="tb-unbalanced">Out of balance</span>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm" data-testid="tb-table">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Ledger</th>
              <th className="px-4 py-3 font-medium text-right">Debit</th>
              <th className="px-4 py-3 font-medium text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {tb.rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5 text-right">
                  {r.debit ? `₹${r.debit.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.credit ? `₹${r.credit.toFixed(2)}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
              <td className="px-4 py-3">Total</td>
              <td className="px-4 py-3 text-right" data-testid="tb-total-debit">₹{tb.totalDebit.toFixed(2)}</td>
              <td className="px-4 py-3 text-right" data-testid="tb-total-credit">₹{tb.totalCredit.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
