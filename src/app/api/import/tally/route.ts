import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  fileName: z.string().min(1).max(255),
  format: z.enum(["xml", "csv", "json", "unknown"]).default("unknown"),
  previewRows: z
    .array(
      z.object({
        voucherType: z.string().optional(),
        party: z.string().optional(),
        amount: z.number().optional(),
        date: z.string().optional(),
        raw: z.string().optional(),
      })
    )
    .max(50)
    .default([]),
  confirm: z.boolean().default(false),
});

/**
 * Tally import STUB — parses client-provided preview only.
 * Does NOT mutate ledgers/vouchers. Stores an audit row when confirmed.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "ca_viewer") {
    return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fileName, format, previewRows, confirm } = parsed.data;

  if (!confirm) {
    return NextResponse.json({
      mode: "stub_preview",
      message:
        "Preview only — no books changed. Confirm to record an import stub audit entry.",
      fileName,
      format,
      rowCount: previewRows.length,
      previewRows,
    });
  }

  await writeAudit({
    companyId: session.user.companyId,
    userId: session.user.id,
    action: "import.tally_stub",
    entityType: "Import",
    summary: `Tally import stub: ${fileName} (${format}, ${previewRows.length} preview rows) — not applied to books`,
    meta: { fileName, format, rowCount: previewRows.length, previewRows: previewRows.slice(0, 10) },
  });

  return NextResponse.json({
    mode: "stub_recorded",
    message:
      "Import stub recorded in audit trail. Live Tally XML/CSV apply is not enabled yet.",
    fileName,
    format,
    rowCount: previewRows.length,
  });
}
