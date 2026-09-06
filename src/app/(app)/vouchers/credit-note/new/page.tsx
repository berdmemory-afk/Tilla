import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewCreditNoteForm } from "./credit-note-form";

export default async function NewCreditNotePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const parties = await prisma.party.findMany({
    where: { companyId, partyType: { in: ["customer", "both"] } },
    orderBy: { name: "asc" },
  });
  const items = await prisma.item.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
  const sales = await prisma.voucher.findMany({
    where: { companyId, status: "posted", voucherType: { name: "Sales" } },
    include: { party: true },
    orderBy: [{ date: "desc" }, { number: "desc" }],
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="cn-heading">
        New Credit Note
      </h1>
      <p className="mt-1 text-sm text-slate-500">GST sales return — reverses output tax</p>
      <div className="mt-6">
        <NewCreditNoteForm
          companyStateCode={company.stateCode}
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
          againstOptions={sales.map((v) => ({
            id: v.id,
            number: v.number,
            label: `${v.number} · ${v.party?.name ?? "—"} · ₹${Number(v.totalAmount).toFixed(2)}`,
          }))}
        />
      </div>
    </div>
  );
}
