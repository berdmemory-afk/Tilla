import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { journalVoucherSchema } from "@/lib/validations/money-voucher";
import { postJournalVoucher } from "@/lib/accounting/post-money-voucher";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "ca_viewer") {
    return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = journalVoucherSchema.safeParse({
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
    const result = await postJournalVoucher(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post journal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
