"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ca_viewer" | "accountant">("ca_viewer");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShareUrl(null);
    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setShareUrl(data.shareUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">CA / viewer email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="ca@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "ca_viewer" | "accountant")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="ca_viewer">CA viewer (read-only)</option>
            <option value="accountant">Accountant</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        Email send is stubbed — copy the share link and send it yourself.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {shareUrl ? (
        <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Invite created. Share path: <code>{shareUrl}</code>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create invite"}
      </button>
    </form>
  );
}
