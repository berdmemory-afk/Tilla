"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";

type PartyOpt = { id: string; name: string; stateCode: string | null };
type ItemOpt = {
  id: string;
  name: string;
  gstRatePct: number;
  purchasePrice: number;
};

export function NewPurchaseForm({
  parties,
  items,
  companyStateCode,
}: {
  parties: PartyOpt[];
  items: ItemOpt[];
  companyStateCode: string;
}) {
  const router = useRouter();
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(items[0]?.purchasePrice ?? 0);
  const [gstRate, setGstRate] = useState(items[0]?.gstRatePct ?? 18);
  const [forceIntra, setForceIntra] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const party = parties.find((p) => p.id === partyId);
  const inferredIntra = !party?.stateCode || party.stateCode === companyStateCode;
  const isIntraState = forceIntra ?? inferredIntra;

  const taxable = round2(qty * rate);
  const split = useMemo(
    () => computeGst(taxable, gstRate, isIntraState),
    [taxable, gstRate, isIntraState]
  );
  const total = invoiceTotal(taxable, split);

  function onItemChange(id: string) {
    setItemId(id);
    const item = items.find((i) => i.id === id);
    if (item) {
      setRate(item.purchasePrice);
      setGstRate(item.gstRatePct);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vouchers/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyId,
        date,
        narration: narration || undefined,
        isIntraState,
        placeOfSupply: party?.stateCode ?? companyStateCode,
        items: [{ itemId, quantity: qty, rate, gstRatePct: gstRate }],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to post voucher");
      return;
    }
    router.push("/vouchers/purchase");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      data-testid="purchase-form"
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select
            data-testid="purchase-party"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.stateCode ? ` (${p.stateCode})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Supply type</label>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              data-testid="purchase-intra"
              type="radio"
              checked={isIntraState}
              onChange={() => setForceIntra(true)}
            />
            Intra-state (Input CGST + SGST)
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="radio"
              checked={!isIntraState}
              onChange={() => setForceIntra(false)}
            />
            Inter-state (Input IGST)
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Item</label>
          <select
            data-testid="purchase-item"
            value={itemId}
            onChange={(e) => onItemChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Qty</label>
          <input
            data-testid="purchase-qty"
            type="number"
            min={0.01}
            step="0.01"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Rate</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">GST %</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={gstRate}
          onChange={(e) => setGstRate(Number(e.target.value))}
          className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Narration</label>
        <input
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          data-testid="purchase-narration"
          placeholder="Optional"
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-sm" data-testid="purchase-tax-preview">
        <div className="font-medium text-slate-800">Tax / ITC preview</div>
        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Taxable</dt>
            <dd className="font-medium">₹{taxable.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Input CGST</dt>
            <dd className="font-medium">₹{split.cgst.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Input SGST</dt>
            <dd className="font-medium">₹{split.sgst.toFixed(2)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Input IGST</dt>
            <dd className="font-medium">₹{split.igst.toFixed(2)}</dd>
          </div>
        </dl>
        <div className="mt-3 text-base font-semibold text-tilla-800">
          Bill total: ₹{total.toFixed(2)}
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        data-testid="purchase-submit"
        disabled={loading || !partyId || !itemId}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Posting…" : "Post purchase voucher"}
      </button>
    </form>
  );
}
