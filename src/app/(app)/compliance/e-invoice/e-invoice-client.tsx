"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VoucherOpt = {
  id: string;
  number: string;
  date: string;
  party: string;
  total: number;
};

export function EInvoiceClient({ vouchers }: { vouchers: VoucherOpt[] }) {
  const router = useRouter();
  const [voucherId, setVoucherId] = useState(vouchers[0]?.id ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function request() {
    if (!voucherId) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/gstn/e-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg(data.result?.message ?? "Stored stub status");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-medium">Generate e-invoice (stub)</h2>
      <p className="mt-1 text-xs text-slate-500">
        Calls local stub client and stores IRN/status — no live GSTN/NIC.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium">Sales voucher</label>
          <select
            value={voucherId}
            onChange={(e) => setVoucherId(e.target.value)}
            className="mt-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {vouchers.map((v) => (
              <option key={v.id} value={v.id}>
                #{v.number} · {v.date} · {v.party} · ₹{v.total.toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={request}
          disabled={loading || !voucherId}
          className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
        >
          {loading ? "Requesting…" : "Request stub IRN"}
        </button>
      </div>
      {msg ? <p className="mt-3 text-sm text-slate-700">{msg}</p> : null}
    </div>
  );
}
