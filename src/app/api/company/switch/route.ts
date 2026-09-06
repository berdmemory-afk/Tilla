import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({ companyId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid companyId" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId: parsed.data.companyId,
      },
    },
    include: { company: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not a member of that company" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { activeCompanyId: membership.companyId },
  });

  await writeAudit({
    companyId: membership.companyId,
    userId: session.user.id,
    action: "company.switched",
    entityType: "Company",
    entityId: membership.companyId,
    summary: `Switched active company to ${membership.company.name}`,
  });

  return NextResponse.json({
    companyId: membership.companyId,
    companyName: membership.company.name,
    role: membership.role,
    fyLabel: membership.company.fyLabel,
    booksLocked: membership.company.booksLocked,
  });
}
