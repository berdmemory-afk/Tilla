import { prisma } from "@/lib/prisma";

export type AuditInput = {
  companyId: string;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  meta?: Record<string, unknown>;
};

/** Persist an audit row; never throws to callers (best-effort). */
export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: input.companyId,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        metaJson: JSON.stringify(input.meta ?? {}),
      },
    });
  } catch (e) {
    console.error("writeAudit failed", e);
  }
}
