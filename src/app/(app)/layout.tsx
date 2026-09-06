import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { listUserCompanies } from "@/lib/company-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const memberships = await listUserCompanies(session.user.id);
  const companies = memberships.map((m) => ({
    id: m.company.id,
    name: m.company.name,
    role: m.role,
    booksLocked: m.company.booksLocked,
    fyLabel: m.company.fyLabel,
  }));

  return (
    <div className="flex min-h-screen">
      <Sidebar
        companyName={session.user.companyName}
        userEmail={session.user.email ?? undefined}
        role={session.user.role}
        companies={companies}
        activeCompanyId={session.user.companyId}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
