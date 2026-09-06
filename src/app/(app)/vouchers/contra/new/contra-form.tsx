"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LedgerOpt = { id: string; name: string };

export function NewContraForm({ cashLedgers }: { cashLedgers: LedgerOpt[] }) {
  const router = useRouter();
  const [fromLedgerId, setFrom] = useState(cashLedgers[0]?.id ?? "");
  const [toLedgerId, setTo] = useState(cashLedgers[1]?.id ?? cashLedgers[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(1000);
  const [narration, setNarration] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vouchers/contra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromLedgerId,
        toLedgerId,
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
      data-testid="contra-form"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">From</label>
          <select
            data-testid="contra-from"
            value={fromLedgerId}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {cashLedgers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <select
            data-testid="contra-to"
            value={toLedgerId}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Amount</label>
          <input
            data-testid="contra-amount"
            type="number"
            min={0.01}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium">Narration</label>
        <input
          data-testid="contra-narration"
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {error ? <p className="text-sm text-red-600" data-testid="contra-error">{error}</p> : null}
      <button
        type="submit"
        data-testid="contra-submit"
        disabled={loading}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Posting…" : "Post contra"}
      </button>
    </form>
  );
}
