import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { purchaseVoucherSchema } from "@/lib/validations/purchase-voucher";
import { postPurchaseVoucher } from "@/lib/accounting/post-purchase-voucher";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const vouchers = await prisma.voucher.findMany({
    where: { companyId: session.user.companyId, voucherType: { name: "Purchase" } },
    include: { party: true, voucherType: true },
    orderBy: [{ date: "desc" }, { number: "desc" }],
  });
  return NextResponse.json({ vouchers });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "ca_viewer") {
    return NextResponse.json({ error: "Read-only role" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = purchaseVoucherSchema.safeParse({
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
    const result = await postPurchaseVoucher(parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to post voucher";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
