"use client";

import { useState } from "react";

type Plan = {
  code: string;
  name: string;
  priceInrMonthly: number;
  description: string;
  features: string[];
};

export function PricingClient({
  plans,
  currentPlanCode,
}: {
  plans: Plan[];
  currentPlanCode?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(planCode: string) {
    setLoading(planCode);
    setMessage(null);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planCode }),
    });
    const data = await res.json();
    setLoading(null);
    if (!res.ok) {
      setMessage(data.error ?? "Checkout failed");
      return;
    }
    setMessage(
      data.checkout?.message ??
        "Checkout stubbed — no charge. Wire your PG later."
    );
  }

  return (
    <div>
      {message ? (
        <p data-testid="checkout-message"
          className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {message}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div
            key={p.code}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              currentPlanCode === p.code ? "border-tilla-400 ring-1 ring-tilla-200" : "border-slate-200"
            }`}
          >
            <div className="text-sm font-medium text-tilla-700">{p.name}</div>
            <div className="mt-2 text-3xl font-semibold">
              ₹{p.priceInrMonthly}
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{p.description}</p>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              {p.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            <button
              type="button"
              data-testid={`checkout-stub-btn-${p.code}`}
              onClick={() => checkout(p.code)}
              disabled={loading === p.code}
              className="mt-5 w-full rounded-md bg-tilla-600 px-3 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
            >
              {loading === p.code ? "…" : "Select (checkout stub)"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
