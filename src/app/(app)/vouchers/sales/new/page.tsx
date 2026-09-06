import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewSalesForm } from "./sales-form";

export default async function NewSalesPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;

  const [parties, items, company] = await Promise.all([
    prisma.party.findMany({
      where: { companyId, partyType: { in: ["customer", "both"] } },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({ where: { companyId }, orderBy: { name: "asc" } }),
    prisma.company.findUniqueOrThrow({ where: { id: companyId } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold">New GST sales voucher</h1>
      <p className="mt-1 text-sm text-slate-500">
        Intra-state posts Sales + Output CGST/SGST; inter-state posts Output IGST.
        Company state: {company.stateName} ({company.stateCode})
      </p>
      <div className="mt-6">
        <NewSalesForm
          parties={parties.map((p) => ({
            id: p.id,
            name: p.name,
            stateCode: p.stateCode,
          }))}
          items={items.map((i) => ({
            id: i.id,
            name: i.name,
            gstRatePct: Number(i.gstRatePct),
            salesPrice: Number(i.salesPrice),
          }))}
          companyStateCode={company.stateCode}
        />
      </div>
    </div>
  );
}
