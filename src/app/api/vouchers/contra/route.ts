import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { postContraVoucher } from "@/lib/accounting/post-money-voucher";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  date: z.string().min(8),
  amount: z.number().positive(),
  fromLedgerId: z.string().min(1),
  toLedgerId: z.string().min(1),
  narration: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
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
  try {
    const result = await postContraVoucher({
      ...parsed.data,
      companyId: session.user.companyId,
    });
    await writeAudit({
      companyId: session.user.companyId,
      userId: session.user.id,
      action: "voucher.posted",
      entityType: "Voucher",
      entityId: result.voucher.id,
      summary: `Posted Contra ${result.voucher.number} ₹${Number(result.voucher.totalAmount).toFixed(2)}`,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post contra";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
