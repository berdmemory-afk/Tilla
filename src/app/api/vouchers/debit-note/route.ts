import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { noteVoucherSchema } from "@/lib/validations/note-voucher";
import { postDebitNote } from "@/lib/accounting/post-debit-note";
import { writeAudit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "ca_viewer") {
    return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = noteVoucherSchema.safeParse({
    ...body,
    companyId: session.user.companyId,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  try {
    const result = await postDebitNote(parsed.data);
    await writeAudit({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: "voucher.posted",
      entityType: "Voucher",
      entityId: result.voucher.id,
      summary: `Posted Debit Note ${result.voucher.number} ₹${Number(result.voucher.totalAmount).toFixed(2)}`,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post debit note";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
