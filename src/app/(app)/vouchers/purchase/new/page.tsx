import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewPurchaseForm } from "./purchase-form";

export default async function NewPurchasePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;

  const [parties, items, company] = await Promise.all([
    prisma.party.findMany({
      where: { companyId, partyType: { in: ["supplier", "both"] } },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">New GST purchase voucher</h1>
      <p className="mt-1 text-sm text-slate-500">
        Posts Dr Purchase + Input tax / Cr Supplier. Updates godown stock (qty in).
        Company state: {company.stateName} ({company.stateCode})
      </p>
      <div className="mt-6">
        <NewPurchaseForm
          parties={parties.map((p) => ({
            id: p.id,
            name: p.name,
            stateCode: p.stateCode,
          }))}
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            gstRatePct: Number(i.gstRatePct),
            purchasePrice: Number(i.purchasePrice),
          }))}
          companyStateCode={company.stateCode}
        />
      </div>
    </div>
  );
}
