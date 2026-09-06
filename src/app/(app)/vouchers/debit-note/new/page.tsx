import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewDebitNoteForm } from "./debit-note-form";

export default async function NewDebitNotePage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const company = await prisma.company.findUniqueOrThrow({ where: { id: companyId } });
  const parties = await prisma.party.findMany({
    where: { companyId, partyType: { in: ["supplier", "both"] } },
    orderBy: { name: "asc" },
  });
  const items = await prisma.item.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
  const purchases = await prisma.voucher.findMany({
    where: { companyId, status: "posted", voucherType: { name: "Purchase" } },
    include: { party: true },
    orderBy: [{ date: "desc" }, { number: "desc" }],
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="dn-heading">
        New Debit Note
      </h1>
      <p className="mt-1 text-sm text-slate-500">GST purchase return — reverses ITC</p>
      <div className="mt-6">
        <NewDebitNoteForm
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
            purchasePrice: Number(i.purchasePrice),
          }))}
          againstOptions={purchases.map((v) => ({
            id: v.id,
            number: v.number,
            label: `${v.number} · ${v.party?.name ?? "—"} · ₹${Number(v.totalAmount).toFixed(2)}`,
          }))}
        />
      </div>
    </div>
  );
}
