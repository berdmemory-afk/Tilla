"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type LedgerOpt = { id: string; name: string };

export function NewJournalForm({ ledgers }: { ledgers: LedgerOpt[] }) {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [drLedgerId, setDrLedgerId] = useState(ledgers[0]?.id ?? "");
  const [crLedgerId, setCrLedgerId] = useState(ledgers[1]?.id ?? ledgers[0]?.id ?? "");
  const [amount, setAmount] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vouchers/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        narration: narration || undefined,
        lines: [
          { ledgerId: drLedgerId, debit: amount, credit: 0 },
          { ledgerId: crLedgerId, debit: 0, credit: amount },
        ],
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
      data-testid="journal-form"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
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
            data-testid="journal-amount"
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Debit ledger</label>
          <select
            data-testid="journal-dr"
            value={drLedgerId}
            onChange={(e) => setDrLedgerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Credit ledger</label>
          <select
            data-testid="journal-cr"
            value={crLedgerId}
            onChange={(e) => setCrLedgerId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          >
            {ledgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Narration</label>
        <input
          data-testid="journal-narration"
          type="text"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600" data-testid="journal-error">{error}</p> : null}
      <button
        type="submit"
        data-testid="journal-submit"
        disabled={loading || drLedgerId === crLedgerId}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Posting…" : "Post journal"}
      </button>
    </form>
  );
}
