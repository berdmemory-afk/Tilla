import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const { id } = await params;
  const voucher = await prisma.voucher.findFirst({
    where: { id, companyId },
    include: {
      voucherType: true,
      party: true,
      lines: { include: { ledger: true } },
      items: { include: { item: true } },
    },
  });
  if (!voucher) notFound();

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/reports/day-book" className="hover:underline">
              Day Book
            </Link>{" "}
            / Voucher
          </p>
          <h1 className="text-2xl font-semibold" data-testid="voucher-detail-heading">
            {voucher.voucherType.name} {voucher.number}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {voucher.date.toISOString().slice(0, 10)} ·{" "}
            <span data-testid="voucher-status">{voucher.status}</span>
            {voucher.party ? ` · ${voucher.party.name}` : ""}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold" data-testid="voucher-total">
            ₹{Number(voucher.totalAmount).toFixed(2)}
          </div>
        </div>
      </div>

      {voucher.narration ? (
        <p className="mt-4 text-sm text-slate-600" data-testid="voucher-narration">
          {voucher.narration}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm" data-testid="voucher-lines">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">Ledger</th>
              <th className="px-4 py-2 text-right">Debit</th>
              <th className="px-4 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {voucher.lines.map((line) => (
              <tr key={line.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{line.ledger.name}</td>
                <td className="px-4 py-2 text-right">
                  {Number(line.debit) > 0 ? Number(line.debit).toFixed(2) : ""}
                </td>
                <td className="px-4 py-2 text-right">
                  {Number(line.credit) > 0 ? Number(line.credit).toFixed(2) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {voucher.items.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm" data-testid="voucher-items">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {voucher.items.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{row.item.name}</td>
                  <td className="px-4 py-2 text-right">{Number(row.quantity)}</td>
                  <td className="px-4 py-2 text-right">{Number(row.rate).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">{Number(row.taxableAmount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-3" data-testid="voucher-gst">
        <div>
          <dt className="text-slate-500">CGST</dt>
          <dd className="font-medium">₹{Number(voucher.cgstAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">SGST</dt>
          <dd className="font-medium">₹{Number(voucher.sgstAmount).toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">IGST</dt>
          <dd className="font-medium">₹{Number(voucher.igstAmount).toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
