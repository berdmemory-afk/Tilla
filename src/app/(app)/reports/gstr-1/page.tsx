import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildGstr1 } from "@/lib/gst/gstr-reports";

export default async function Gstr1Page({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const sp = await searchParams;
  const now = new Date();
  const from = sp.from ? new Date(sp.from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = sp.to ? new Date(sp.to) : now;
  const report = await buildGstr1(companyId, { from, to });

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">GSTR-1 summary</h1>
          <p className="mt-1 text-sm text-slate-500">
            Outward supplies stub export — not filed to GSTN
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/reports/gstr1?from=${fromStr}&to=${toStr}&format=json`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Download JSON
          </a>
          <a
            href={`/api/reports/gstr1?from=${fromStr}&to=${toStr}&format=csv`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Download CSV
          </a>
        </div>
      </div>

      <form className="mt-4 flex flex-wrap gap-3 text-sm" method="get">
        <label>
          From{" "}
          <input
            type="date"
            name="from"
            defaultValue={fromStr}
            className="ml-1 rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <label>
          To{" "}
          <input
            type="date"
            name="to"
            defaultValue={toStr}
            className="ml-1 rounded border border-slate-300 px-2 py-1"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-tilla-600 px-3 py-1.5 text-white hover:bg-tilla-700"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-5">
        {[
          ["Invoices", report.summary.invoiceCount],
          ["Taxable", `₹${report.summary.taxableAmount.toFixed(2)}`],
          ["CGST", `₹${report.summary.cgst.toFixed(2)}`],
          ["SGST", `₹${report.summary.sgst.toFixed(2)}`],
          ["IGST", `₹${report.summary.igst.toFixed(2)}`],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 text-lg font-semibold text-tilla-800">{value}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-medium">B2B ({report.b2b.length})</h2>
      <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Invoice</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Party / GSTIN</th>
              <th className="px-3 py-2 text-right">Taxable</th>
              <th className="px-3 py-2 text-right">Tax</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {report.b2b.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  No B2B sales in period.{" "}
                  <Link href="/vouchers/sales/new" className="text-tilla-700 underline">
                    Post a sale
                  </Link>
                </td>
              </tr>
            ) : (
              report.b2b.map((r) => (
                <tr key={r.invoiceNumber + r.invoiceDate} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{r.invoiceNumber}</td>
                  <td className="px-3 py-2">{r.invoiceDate}</td>
                  <td className="px-3 py-2">
                    {r.partyName}
                    <div className="text-xs text-slate-500">{r.partyGstin}</div>
                  </td>
                  <td className="px-3 py-2 text-right">₹{r.taxableAmount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">
                    ₹{(r.cgst + r.sgst + r.igst).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">₹{r.total.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 font-medium">B2C ({report.b2c.length})</h2>
      <p className="text-sm text-slate-500">
        Invoices without party GSTIN appear here.
      </p>
    </div>
  );
}
