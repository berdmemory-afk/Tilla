import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGstr1, toCsv } from "@/lib/gst/gstr-reports";

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

  const report = await buildGstr1(session.user.companyId, { from, to });

  if (format === "csv") {
    const rows = [
      ...report.b2b.map((r) => ({ section: "B2B", ...r })),
      ...report.b2c.map((r) => ({
        section: "B2C",
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate,
        partyName: r.partyName,
        partyGstin: "",
        placeOfSupply: "",
        taxableAmount: r.taxableAmount,
        cgst: r.cgst,
        sgst: r.sgst,
        igst: r.igst,
        total: r.total,
        isIntraState: "",
      })),
    ];
    const csv = toCsv(rows as Record<string, string | number | boolean>[]);
    return new NextResponse(csv || "section\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="gstr1-${report.meta.from}-${report.meta.to}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
