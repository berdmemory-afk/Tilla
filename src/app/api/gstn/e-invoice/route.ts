import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEInvoice } from "@/lib/gstn/e-invoice";

export async function GET() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const records = await prisma.eInvoiceRecord.findMany({
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

  const { voucherId } = await req.json();
  if (!voucherId) {
    return NextResponse.json({ error: "voucherId required" }, { status: 400 });
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: session.user.companyId },
  });
  const voucher = await prisma.voucher.findFirstOrThrow({
    where: {
      id: voucherId,
      companyId: session.user.companyId,
      voucherType: { name: "Sales" },
    },
    include: { party: true },
  });

  const result = await generateEInvoice({
    companyGstin: company.gstin ?? "",
    buyerGstin: voucher.party?.gstin ?? undefined,
    invoiceNumber: voucher.number,
    invoiceDate: voucher.date.toISOString().slice(0, 10),
    taxableAmount: Number(voucher.taxableAmount),
    cgst: Number(voucher.cgstAmount),
    sgst: Number(voucher.sgstAmount),
    igst: Number(voucher.igstAmount),
    totalAmount: Number(voucher.totalAmount),
  });

  const record = await prisma.eInvoiceRecord.create({
    data: {
      companyId: company.id,
      voucherId: voucher.id,
      status: result.ok ? "stub_ok" : "stub_failed",
      irn: result.irn,
      qrCode: result.qrCode,
      message: result.message,
    },
  });

  return NextResponse.json({ record, result }, { status: 201 });
}
