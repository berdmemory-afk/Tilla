import { auth } from "@/lib/auth";
import { getDayBook } from "@/lib/accounting/reports";

export default async function DayBookPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const entries = await getDayBook(companyId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Day Book</h1>
      <p className="mt-1 text-sm text-slate-500">
        Chronological register of posted vouchers with ledger lines
      </p>

      <div className="mt-6 space-y-4">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            No vouchers yet. Post a sales voucher to populate the Day Book.
          </div>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="font-medium">
                    {e.type} #{e.number}
                  </span>
                  <span className="ml-2 text-sm text-slate-500">
                    {new Date(e.date).toISOString().slice(0, 10)}
                  </span>
                </div>
                <div className="text-sm font-semibold text-tilla-800">
                  ₹{e.totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {e.party ? `Party: ${e.party}` : null}
                {e.narration ? ` — ${e.narration}` : null}
              </div>
              <table className="mt-3 min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1 font-medium">Ledger</th>
                    <th className="py-1 font-medium text-right">Debit</th>
                    <th className="py-1 font-medium text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {e.lines.map((l, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="py-1.5">{l.ledger}</td>
                      <td className="py-1.5 text-right">
                        {l.debit ? `₹${l.debit.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-1.5 text-right">
                        {l.credit ? `₹${l.credit.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-xs text-slate-500">
                Taxable ₹{e.taxableAmount.toFixed(2)} · CGST ₹{e.cgstAmount.toFixed(2)} ·
                SGST ₹{e.sgstAmount.toFixed(2)} · IGST ₹{e.igstAmount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
