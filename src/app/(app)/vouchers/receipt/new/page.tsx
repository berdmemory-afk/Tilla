import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewReceiptForm } from "./receipt-form";

export default async function NewReceiptPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const [parties, ledgers] = await Promise.all([
    prisma.party.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.ledger.findMany({
      where: { companyId, name: { in: ["Cash", "Bank"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">New receipt voucher</h1>
      <p className="mt-1 text-sm text-slate-500">Record collections into Cash or Bank</p>
      <div className="mt-6">
        <NewReceiptForm
          parties={parties.map((p) => ({ id: p.id, name: p.name }))}
          cashLedgers={ledgers.map((l) => ({ id: l.id, name: l.name }))}
        />
      </div>
    </div>
  );
}
