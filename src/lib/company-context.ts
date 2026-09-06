import { prisma } from "@/lib/prisma";

export type CompanyContext = {
  companyId: string;
  companyName: string;
  role: string;
  booksLocked: boolean;
  fyLabel: string;
};

/**
 * Resolve the user's active company from User.activeCompanyId (or first membership).
 * Used by Auth session callback and server pages that need fresh company state.
 */
export async function resolveCompanyContext(
  userId: string
): Promise<CompanyContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeCompanyId: true },
  });
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: "asc" },
  });
  if (memberships.length === 0) return null;

  const preferred =
    memberships.find((m) => m.companyId === user?.activeCompanyId) ??
    memberships[0];

  return {
    companyId: preferred.companyId,
    companyName: preferred.company.name,
    role: preferred.role,
    booksLocked: preferred.company.booksLocked,
    fyLabel: preferred.company.fyLabel,
  };
}

export async function listUserCompanies(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          stateName: true,
          gstin: true,
          fyLabel: true,
          booksLocked: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
