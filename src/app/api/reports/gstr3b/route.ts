import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGstr3b, toCsv } from "@/lib/gst/gstr-reports";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const format = url.searchParams.get("format") ?? "json";

  const now = new Date();
  const from = fromStr
    ? new Date(fromStr)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = toStr ? new Date(toStr) : now;

  const report = await buildGstr3b(session.user.companyId, { from, to });

  if (format === "csv") {
    const rows = [
      {
        section: "outward",
        taxable: report.outwardSupplies.taxable,
        cgst: report.outwardSupplies.cgst,
        sgst: report.outwardSupplies.sgst,
        igst: report.outwardSupplies.igst,
      },
      {
        section: "itc",
        taxable: report.eligibleItc.taxable,
        cgst: report.eligibleItc.cgst,
        sgst: report.eligibleItc.sgst,
        igst: report.eligibleItc.igst,
      },
      {
        section: "net_payable",
        taxable: 0,
        cgst: report.netTaxPayable.cgst,
        sgst: report.netTaxPayable.sgst,
        igst: report.netTaxPayable.igst,
      },
    ];
    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gstr3b-${report.meta.from}-${report.meta.to}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
