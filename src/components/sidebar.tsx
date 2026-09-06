"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SignOutButton } from "./sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vouchers/sales", label: "Sales" },
  { href: "/vouchers/sales/new", label: "New Sales" },
  { href: "/vouchers/purchase", label: "Purchase" },
  { href: "/vouchers/purchase/new", label: "New Purchase" },
  { href: "/vouchers/payment/new", label: "Payment" },
  { href: "/vouchers/receipt/new", label: "Receipt" },
  { href: "/vouchers/journal/new", label: "Journal" },
  { href: "/inventory", label: "Inventory" },
  { href: "/reports/day-book", label: "Day Book" },
  { href: "/reports/trial-balance", label: "Trial Balance" },
  { href: "/reports/gstr-1", label: "GSTR-1" },
  { href: "/reports/gstr-3b", label: "GSTR-3B" },
  { href: "/compliance/e-invoice", label: "E-invoice" },
  { href: "/compliance/e-way", label: "E-way" },
  { href: "/settings/ca-invite", label: "CA Invite" },
  { href: "/settings/pricing", label: "Pricing" },
  { href: "/settings/affiliate", label: "Affiliate" },
];

export function Sidebar({
  companyName,
  userEmail,
  role,
}: {
  companyName?: string;
  userEmail?: string;
  role?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-tilla-950 text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="text-lg font-semibold tracking-tight">Tilla</div>
        <div className="mt-1 text-xs text-tilla-200">Indian GST books</div>
        {companyName ? (
          <div className="mt-3 rounded-md bg-white/10 px-2 py-1.5 text-xs">
            <div className="font-medium">{companyName}</div>
            {role ? <div className="text-tilla-200">{role}</div> : null}
          </div>
        ) : null}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
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
        <div>{userEmail}</div>
        <div className="mt-2">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
