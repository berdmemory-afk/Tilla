import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ca_viewer", "accountant"]).default("ca_viewer"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const invites = await prisma.companyInvite.findMany({
    where: { companyId: session.user.companyId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ invites });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "owner" && session.user.role !== "accountant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const invite = await prisma.companyInvite.create({
    data: {
      companyId: session.user.companyId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token,
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      status: "pending",
    },
  });

  // Stub: no email send — share link locally
  const shareUrl = `/login?invite=${invite.token}`;

  return NextResponse.json({ invite, shareUrl }, { status: 201 });
}
