"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VoucherOpt = {
  id: string;
  label: string;
};

export function EWayClient({ vouchers }: { vouchers: VoucherOpt[] }) {
  const router = useRouter();
  const [voucherId, setVoucherId] = useState(vouchers[0]?.id ?? "");
  const [vehicleNumber, setVehicleNumber] = useState("MH12AB1234");
  const [distanceKm, setDistanceKm] = useState(120);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function request() {
    if (!voucherId) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/gstn/e-way", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voucherId, vehicleNumber, distanceKm }),
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
      <h2 className="font-medium">Generate e-way bill (stub)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <label className="block text-sm font-medium">Voucher</label>
          <select
            value={voucherId}
            onChange={(e) => setVoucherId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {vouchers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Vehicle</label>
          <input
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Distance (km)</label>
          <input
            type="number"
            value={distanceKm}
            onChange={(e) => setDistanceKm(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={request}
            disabled={loading || !voucherId}
            className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
          >
            {loading ? "Requesting…" : "Request stub e-way"}
          </button>
        </div>
      </div>
      {msg ? <p className="mt-3 text-sm text-slate-700">{msg}</p> : null}
    </div>
  );
}
