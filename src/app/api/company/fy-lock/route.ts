import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  locked: z.boolean(),
  fyLabel: z.string().min(4).max(16).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "owner") {
    return NextResponse.json({ error: "Only owner can lock/unlock books" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const company = await prisma.company.update({
    where: { id: session.user.companyId },
    data: {
      booksLocked: parsed.data.locked,
      booksLockedAt: parsed.data.locked ? new Date() : null,
      ...(parsed.data.fyLabel ? { fyLabel: parsed.data.fyLabel } : {}),
    },
  });

  await writeAudit({
    companyId: company.id,
    userId: session.user.id,
    action: parsed.data.locked ? "fy.locked" : "fy.unlocked",
    entityType: "Company",
    entityId: company.id,
    summary: parsed.data.locked
      ? `Financial year ${company.fyLabel} books locked`
      : `Financial year ${company.fyLabel} books unlocked`,
  });

  return NextResponse.json({
    booksLocked: company.booksLocked,
    fyLabel: company.fyLabel,
    booksLockedAt: company.booksLockedAt,
  });
}
