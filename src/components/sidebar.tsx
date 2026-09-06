"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SignOutButton } from "./sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/vouchers/sales", label: "Sales Vouchers" },
  { href: "/vouchers/sales/new", label: "New Sales (GST)" },
  { href: "/reports/day-book", label: "Day Book" },
  { href: "/reports/trial-balance", label: "Trial Balance" },
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
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const active =
            item.href === "/vouchers/sales"
              ? pathname === "/vouchers/sales"
              : pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "block rounded-md px-3 py-2 text-sm transition",
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
