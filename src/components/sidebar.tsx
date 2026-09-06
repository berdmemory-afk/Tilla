"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SignOutButton } from "./sign-out-button";
import { CompanySwitcher } from "./company-switcher";

const nav = [
  { href: "/dashboard", label: "Dashboard", write: false, referral: false },
  { href: "/vouchers/sales", label: "Sales", write: false, referral: false },
  { href: "/vouchers/sales/new", label: "New Sales", write: true, referral: false },
  { href: "/vouchers/purchase", label: "Purchase", write: false, referral: false },
  { href: "/vouchers/purchase/new", label: "New Purchase", write: true, referral: false },
  { href: "/vouchers/payment/new", label: "Payment", write: true, referral: false },
  { href: "/vouchers/receipt/new", label: "Receipt", write: true, referral: false },
  { href: "/vouchers/journal/new", label: "Journal", write: true, referral: false },
  { href: "/vouchers/contra/new", label: "Contra", write: true, referral: false },
  { href: "/inventory", label: "Inventory", write: false, referral: false },
  { href: "/reports/day-book", label: "Day Book", write: false, referral: false },
  { href: "/reports/trial-balance", label: "Trial Balance", write: false, referral: false },
  { href: "/reports/gstr-1", label: "GSTR-1", write: false, referral: false },
  { href: "/reports/gstr-3b", label: "GSTR-3B", write: false, referral: false },
  { href: "/compliance/e-invoice", label: "E-invoice", write: false, referral: false },
  { href: "/compliance/e-way", label: "E-way", write: false, referral: false },
  { href: "/settings/company", label: "Company / FY", write: false, referral: false },
  { href: "/settings/audit", label: "Audit trail", write: false, referral: false },
  { href: "/settings/import", label: "Tally import", write: true, referral: false },
  { href: "/settings/ca-invite", label: "CA Invite", write: true, referral: false },
  { href: "/settings/pricing", label: "Pricing", write: false, referral: false },
  { href: "/settings/affiliate", label: "Affiliate", write: false, referral: true },
];

export function Sidebar({
  companyName,
  userEmail,
  role,
  companies,
  activeCompanyId,
}: {
  companyName?: string;
  userEmail?: string;
  role?: string;
  companies?: { id: string; name: string; role: string; booksLocked: boolean; fyLabel: string }[];
  activeCompanyId?: string;
}) {
  const pathname = usePathname();
  const isCaViewer = role === "ca_viewer";
  const visibleNav = nav.filter((item) => {
    if (isCaViewer && item.write) return false;
    if (isCaViewer && item.referral) return false;
    return true;
  });

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-tilla-950 text-white" data-testid="sidebar">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-lg font-semibold tracking-tight">Tilla</div>
        <div className="mt-1 text-xs text-tilla-200">Indian GST books</div>
        {companyName ? (
          <div className="mt-3 rounded-md bg-white/10 px-2 py-1.5 text-xs" data-testid="active-company">
            <div className="font-medium">{companyName}</div>
            {role ? <div className="text-tilla-200" data-testid="active-role">{role}</div> : null}
          </div>
        ) : null}
        {companies ? (
          <CompanySwitcher companies={companies} activeCompanyId={activeCompanyId} />
        ) : null}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" data-testid="sidebar-nav">
        {visibleNav.map((item) => {
          const active =
            item.href === "/vouchers/sales"
              ? pathname === "/vouchers/sales"
              : item.href === "/vouchers/purchase"
                ? pathname === "/vouchers/purchase"
                : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-testid={`nav-${item.href.replace(/\//g, "-").slice(1)}`}
              className={clsx(
                "block rounded-md px-3 py-1.5 text-sm transition",
                active
                  ? "bg-tilla-600 text-white"
                  : "text-tilla-100 hover:bg-white/10"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 px-4 py-4 text-xs text-tilla-200">
        <div data-testid="user-email">{userEmail}</div>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
