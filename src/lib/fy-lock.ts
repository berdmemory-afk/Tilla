import { prisma } from "@/lib/prisma";

/** Throw if company books are FY-locked (no new voucher posts). */
export async function assertBooksOpen(companyId: string) {
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
    select: { booksLocked: true, fyLabel: true, name: true },
  });
  if (company.booksLocked) {
    throw new Error(
      `Books locked for FY ${company.fyLabel} (${company.name}). Unlock in Settings → Company to post vouchers.`
    );
  }
}

/** Indian FY label helper: Apr 2025 → "2025-26" */
export function currentIndianFyLabel(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const startYear = m >= 4 ? y : y - 1;
  const endYY = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${endYY}`;
}
