import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AuditTrailPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const logs = await prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="audit-heading">
        Audit trail
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Company-scoped activity for CA review (vouchers, invites, FY lock, import stubs)
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm" data-testid="audit-table">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">When (UTC)</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Summary</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No audit entries yet.
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">
                    {l.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                  <td className="px-4 py-3">{l.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
