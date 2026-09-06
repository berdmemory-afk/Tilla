import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEWayBill } from "@/lib/gstn/e-way";

export async function GET() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const records = await prisma.eWayBillRecord.findMany({
    where: { companyId: session.user.companyId },
    include: { voucher: { include: { party: true, voucherType: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json({ records });
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
  const { voucherId, vehicleNumber, distanceKm } = body;
  if (!voucherId) {
    return NextResponse.json({ error: "voucherId required" }, { status: 400 });
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: session.user.companyId },
  });
  const voucher = await prisma.voucher.findFirstOrThrow({
    where: { id: voucherId, companyId: session.user.companyId },
    include: { party: true, voucherType: true },
  });

  const result = await generateEWayBill({
    companyGstin: company.gstin ?? "",
    consigneeGstin: voucher.party?.gstin ?? undefined,
    documentNumber: `${voucher.voucherType.name}-${voucher.number}`,
    documentDate: voucher.date.toISOString().slice(0, 10),
    vehicleNumber,
    distanceKm: distanceKm ? Number(distanceKm) : undefined,
    totalAmount: Number(voucher.totalAmount),
  });

  const record = await prisma.eWayBillRecord.create({
    data: {
      companyId: company.id,
      voucherId: voucher.id,
      status: result.ok ? "stub_ok" : "stub_failed",
      ewayBillNo: result.ewayBillNo,
      vehicleNumber: vehicleNumber ?? null,
      distanceKm: distanceKm ? Number(distanceKm) : null,
      message: result.message,
    },
  });

  return NextResponse.json({ record, result }, { status: 201 });
}
