import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewContraForm } from "./contra-form";

export default async function NewContraPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const ledgers = await prisma.ledger.findMany({
    where: { companyId, name: { in: ["Cash", "Bank"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="contra-heading">
        New contra voucher
      </h1>
      <p className="mt-1 text-sm text-slate-500">Transfer between Cash and Bank</p>
      <div className="mt-6">
        <NewContraForm
          cashLedgers={ledgers.map((l) => ({ id: l.id, name: l.name }))}
        />
      </div>
    </div>
  );
}
