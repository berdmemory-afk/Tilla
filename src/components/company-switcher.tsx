"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CompanyOpt = {
  id: string;
  name: string;
  role: string;
  booksLocked: boolean;
  fyLabel: string;
};

export function CompanySwitcher({
  companies,
  activeCompanyId,
}: {
  companies: CompanyOpt[];
  activeCompanyId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (companies.length <= 1) {
    return null;
  }

  async function onChange(companyId: string) {
    if (companyId === activeCompanyId) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/company/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Switch failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3" data-testid="company-switcher">
      <label className="mb-1 block text-[10px] uppercase tracking-wide text-tilla-200">
        Company
      </label>
      <select
        data-testid="company-switch-select"
        disabled={loading}
        value={activeCompanyId ?? companies[0]?.id}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-xs text-white outline-none"
      >
        {companies.map((c) => (
          <option key={c.id} value={c.id} className="text-slate-900">
            {c.name}
            {c.booksLocked ? " (locked)" : ""}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-[10px] text-red-300">{error}</p> : null}
    </div>
  );
}
