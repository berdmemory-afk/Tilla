"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PartyOpt = { id: string; name: string };
type LedgerOpt = { id: string; name: string };

export function NewPaymentForm({
  parties,
  cashLedgers,
}: {
  parties: PartyOpt[];
  cashLedgers: LedgerOpt[];
}) {
  const router = useRouter();
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [cashLedgerId, setCashLedgerId] = useState(cashLedgers[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(1000);
  const [narration, setNarration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vouchers/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyId,
        cashLedgerId,
        date,
        amount,
        narration: narration || undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    router.push("/reports/day-book");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Party</label>
          <select
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Pay from</label>
          <select
            value={cashLedgerId}
            onChange={(e) => setCashLedgerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {cashLedgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
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
        <div>
          <label className="block text-sm font-medium">Amount (₹)</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Narration</label>
        <input
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <p className="text-xs text-slate-500">Posts Dr Party · Cr Cash/Bank</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Posting…" : "Post payment"}
      </button>
    </form>
  );
}
