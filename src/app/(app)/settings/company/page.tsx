import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FyLockClient } from "./fy-lock-client";

export default async function CompanySettingsPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: companyId },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="company-settings-heading">
        Company / FY lock
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Multi-company switch is in the sidebar. Lock books for the active FY to
        block new voucher posts (CA period close).
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Name</dt>
            <dd className="font-medium" data-testid="company-name">
              {company.name}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">GSTIN</dt>
            <dd className="font-mono">{company.gstin ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">State</dt>
            <dd>
              {company.stateName} ({company.stateCode})
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">FY</dt>
            <dd data-testid="company-fy">{company.fyLabel}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <FyLockClient
            booksLocked={company.booksLocked}
            fyLabel={company.fyLabel}
            canLock={session!.user.role === "owner"}
          />
        </div>
      </div>
    </div>
  );
}
