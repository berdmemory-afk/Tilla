import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewJournalForm } from "./journal-form";

export default async function NewJournalPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const ledgers = await prisma.ledger.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">New journal voucher</h1>
      <p className="mt-1 text-sm text-slate-500">Simple two-line balanced adjustment</p>
      <div className="mt-6">
        <NewJournalForm ledgers={ledgers.map((l) => ({ id: l.id, name: l.name }))} />
      </div>
    </div>
  );
}
