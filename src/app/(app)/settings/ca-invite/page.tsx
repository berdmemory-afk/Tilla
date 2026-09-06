import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InviteForm } from "./invite-form";

export default async function CaInvitePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const invites = await prisma.companyInvite.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">CA invite / share</h1>
      <p className="mt-1 text-sm text-slate-500">
        Invite a CA with <code>ca_viewer</code> role (read-only books)
      </p>
      <div className="mt-6">
        <InviteForm />
      </div>
      <h2 className="mt-10 font-medium">Invites</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Token</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {invites.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No invites yet.
                </td>
              </tr>
            ) : (
              invites.map((i) => (
                <tr key={i.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{i.email}</td>
                  <td className="px-4 py-3">{i.role}</td>
                  <td className="px-4 py-3">{i.status}</td>
                  <td className="px-4 py-3 font-mono text-xs">{i.token.slice(0, 12)}…</td>
                  <td className="px-4 py-3">
                    {i.createdAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
