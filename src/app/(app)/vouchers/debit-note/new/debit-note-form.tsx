"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";

type PartyOpt = { id: string; name: string; stateCode: string | null };
type ItemOpt = { id: string; name: string; gstRatePct: number; purchasePrice: number };
type AgainstOpt = { id: string; number: string; label: string };

export function NewDebitNoteForm({
  parties,
  items,
  companyStateCode,
  againstOptions,
}: {
  parties: PartyOpt[];
  items: ItemOpt[];
  companyStateCode: string;
  againstOptions: AgainstOpt[];
}) {
  const router = useRouter();
  const [partyId, setPartyId] = useState(parties[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [narration, setNarration] = useState("");
  const [againstVoucherId, setAgainstVoucherId] = useState("");
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [rate, setRate] = useState(items[0]?.purchasePrice ?? 0);
  const [gstRate, setGstRate] = useState(items[0]?.gstRatePct ?? 18);
  const [forceIntra, setForceIntra] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [dirtyGuardOpen, setDirtyGuardOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const itemRef = useRef<HTMLSelectElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const narrationRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  const party = parties.find((p) => p.id === partyId);
  const inferredIntra =
    !party?.stateCode || party.stateCode === companyStateCode;
  const isIntraState = forceIntra ?? inferredIntra;

  const taxable = round2(qty * rate);
  const split = useMemo(
    () => computeGst(taxable, gstRate, isIntraState),
    [taxable, gstRate, isIntraState]
  );
  const total = invoiceTotal(taxable, split);

  function markDirty() {
    setDirty(true);
  }

  function onItemChange(id: string) {
    setItemId(id);
    markDirty();
    const item = items.find((i) => i.id === id);
    if (item) {
      setRate(item.purchasePrice);
      setGstRate(item.gstRatePct);
    }
  }

  const submitForm = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submitForm();
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        submitForm();
        return;
      }
      if (e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        itemRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (dirtyGuardOpen) {
          setDirtyGuardOpen(false);
          return;
        }
        if (dirty) {
          e.preventDefault();
          setDirtyGuardOpen(true);
          return;
        }
      }
      const target = e.target as HTMLElement | null;
      if (e.key === "Enter" && target?.getAttribute("data-testid") === "dn-narration") {
        e.preventDefault();
        submitRef.current?.focus();
        return;
      }
      if (e.key === "Enter" && target?.getAttribute("data-testid") === "dn-qty") {
        e.preventDefault();
        narrationRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dirty, dirtyGuardOpen, submitForm]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/vouchers/debit-note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partyId,
        date,
        narration: narration || undefined,
        isIntraState,
        placeOfSupply: party?.stateCode ?? companyStateCode,
        againstVoucherId: againstVoucherId || undefined,
        items: [{ itemId, quantity: qty, rate, gstRatePct: gstRate }],
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to post debit note");
      return;
    }
    setDirty(false);
    setDirtyGuardOpen(false);
    router.push(`/vouchers/${data.voucher.id}`);
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      data-testid="debit-note-form"
      data-dirty={dirty ? "true" : "false"}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div
        className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
        data-testid="dn-keyboard-hints"
      >
        Keyboard: Enter advances · F2 / Ctrl+S save · Alt+I item · Esc dirty-guard
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select
            data-testid="dn-party"
            value={partyId}
            onChange={(e) => {
              setPartyId(e.target.value);
              markDirty();
            }}
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
            data-testid="dn-date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              markDirty();
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Against purchase (optional)</label>
        <select
          data-testid="dn-against"
          value={againstVoucherId}
          onChange={(e) => {
            setAgainstVoucherId(e.target.value);
            markDirty();
          }}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {againstOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Supply type</label>
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              data-testid="dn-intra"
              type="radio"
              checked={isIntraState}
              onChange={() => {
                setForceIntra(true);
                markDirty();
              }}
            />
            Intra-state (CGST + SGST)
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              data-testid="dn-inter"
              type="radio"
              checked={!isIntraState}
              onChange={() => {
                setForceIntra(false);
                markDirty();
              }}
            />
            Inter-state (IGST)
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Item</label>
          <select
            ref={itemRef}
            data-testid="dn-item"
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
            ref={qtyRef}
            data-testid="dn-qty"
            type="number"
            min={0.01}
            step="0.01"
            value={qty}
            onChange={(e) => {
              setQty(Number(e.target.value));
              markDirty();
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Rate</label>
          <input
            data-testid="dn-rate"
            type="number"
            min={0}
            step="0.01"
            value={rate}
            onChange={(e) => {
              setRate(Number(e.target.value));
              markDirty();
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">GST %</label>
        <input
          data-testid="dn-gst-rate"
          type="number"
          min={0}
          step="0.01"
          value={gstRate}
          onChange={(e) => {
            setGstRate(Number(e.target.value));
            markDirty();
          }}
          className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Narration</label>
        <input
          ref={narrationRef}
          type="text"
          value={narration}
          onChange={(e) => {
            setNarration(e.target.value);
            markDirty();
          }}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          data-testid="dn-narration"
          placeholder="Optional"
        />
      </div>

      <div className="rounded-lg bg-slate-50 p-4 text-sm" data-testid="tax-preview">
        <div className="font-medium text-slate-800">Tax preview (ITC reverse)</div>
        <dl className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div>
            <dt className="text-slate-500">Taxable</dt>
            <dd className="font-medium" data-testid="dn-taxable">
              ₹{taxable.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">CGST</dt>
            <dd className="font-medium" data-testid="dn-cgst">
              ₹{split.cgst.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">SGST</dt>
            <dd className="font-medium" data-testid="dn-sgst">
              ₹{split.sgst.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">IGST</dt>
            <dd className="font-medium" data-testid="dn-igst">
              ₹{split.igst.toFixed(2)}
            </dd>
          </div>
        </dl>
        <div className="mt-3 text-base font-semibold text-tilla-800" data-testid="dn-total">
          Debit note total: ₹{total.toFixed(2)}
        </div>
      </div>

      <div
        data-testid="gst-strip"
        data-blocks-save="false"
        className="rounded-md border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500"
      >
        GST compliance (e-invoice / e-way) is post-save — never blocks voucher post.
      </div>

      {dirtyGuardOpen ? (
        <div
          role="dialog"
          data-testid="dirty-guard"
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p data-testid="dirty-guard-message">
            Unsaved changes. Press Esc again to dismiss, or save with Ctrl+S / F2.
          </p>
          <button
            type="button"
            data-testid="dirty-guard-dismiss"
            className="mt-2 rounded border border-amber-400 px-2 py-1 text-xs"
            onClick={() => setDirtyGuardOpen(false)}
          >
            Keep editing
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600" data-testid="dn-error">
          {error}
        </p>
      ) : null}

      <button
        ref={submitRef}
        type="submit"
        data-testid="dn-submit"
        disabled={loading || !partyId || !itemId}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Posting…" : "Post debit note"}
      </button>
    </form>
  );
}
