import { auth } from "@/lib/auth";
import { buildGstr3b } from "@/lib/gst/gstr-reports";

export default async function Gstr3bPage({
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
  const report = await buildGstr3b(companyId, { from, to });

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">GSTR-3B summary</h1>
          <p className="mt-1 text-sm text-slate-500">
            Outward liability − ITC from purchases (stub — not filed to GSTN)
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/reports/gstr3b?from=${fromStr}&to=${toStr}&format=json`}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Download JSON
          </a>
          <a
            href={`/api/reports/gstr3b?from=${fromStr}&to=${toStr}&format=csv`}
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Section
          title="3.1 Outward supplies"
          rows={[
            ["Taxable", report.outwardSupplies.taxable],
            ["CGST", report.outwardSupplies.cgst],
            ["SGST", report.outwardSupplies.sgst],
            ["IGST", report.outwardSupplies.igst],
          ]}
          footnote={`${report.salesCount} sales vouchers`}
        />
        <Section
          title="4. Eligible ITC"
          rows={[
            ["Taxable (purchases)", report.eligibleItc.taxable],
            ["Input CGST", report.eligibleItc.cgst],
            ["Input SGST", report.eligibleItc.sgst],
            ["Input IGST", report.eligibleItc.igst],
          ]}
          footnote={`${report.purchaseCount} purchase vouchers`}
        />
        <Section
          title="Net tax payable"
          rows={[
            ["CGST", report.netTaxPayable.cgst],
            ["SGST", report.netTaxPayable.sgst],
            ["IGST", report.netTaxPayable.igst],
          ]}
          footnote="Outward − ITC (can be negative in stub)"
          emphasize
        />
      </div>
    </div>
  );
}

function Section({
  title,
  rows,
  footnote,
  emphasize,
}: {
  title: string;
  rows: [string, number][];
  footnote: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        emphasize ? "border-tilla-300" : "border-slate-200"
      }`}
    >
      <h2 className="font-medium text-slate-900">{title}</h2>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between">
            <dt className="text-slate-500">{k}</dt>
            <dd className="font-medium">₹{v.toFixed(2)}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-slate-400">{footnote}</p>
    </div>
  );
}
