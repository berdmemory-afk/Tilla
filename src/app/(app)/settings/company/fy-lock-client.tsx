"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FyLockClient({
  booksLocked,
  fyLabel,
  canLock,
}: {
  booksLocked: boolean;
  fyLabel: string;
  canLock: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/company/fy-lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !booksLocked, fyLabel }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    setMsg(data.booksLocked ? "Books locked" : "Books unlocked");
    router.refresh();
  }

  return (
    <div data-testid="fy-lock-panel">
      <p className="text-sm">
        Status:{" "}
        <span
          className={booksLocked ? "font-semibold text-amber-700" : "font-semibold text-emerald-700"}
          data-testid="fy-lock-status"
        >
          {booksLocked ? `Locked (${fyLabel})` : `Open (${fyLabel})`}
        </span>
      </p>
      {canLock ? (
        <button
          type="button"
          data-testid="fy-lock-toggle"
          disabled={loading}
          onClick={toggle}
          className="mt-3 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? "…" : booksLocked ? "Unlock books" : "Lock books for FY"}
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Only company owner can lock/unlock.</p>
      )}
      {msg ? <p className="mt-2 text-sm text-slate-600">{msg}</p> : null}
    </div>
  );
}
