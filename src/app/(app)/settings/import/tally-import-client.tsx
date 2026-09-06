"use client";

import { useState } from "react";

type PreviewRow = {
  voucherType?: string;
  party?: string;
  amount?: number;
  date?: string;
  raw?: string;
};

function parsePreview(text: string, fileName: string): {
  format: "csv" | "xml" | "json" | "unknown";
  rows: PreviewRow[];
} {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      return {
        format: "json",
        rows: arr.slice(0, 20).map((r: Record<string, unknown>) => ({
          voucherType: String(r.voucherType ?? r.type ?? ""),
          party: String(r.party ?? r.partyName ?? ""),
          amount: Number(r.amount ?? r.total ?? 0) || undefined,
          date: String(r.date ?? ""),
          raw: JSON.stringify(r).slice(0, 120),
        })),
      };
    } catch {
      /* fall through */
    }
  }
  if (lower.endsWith(".xml") || text.includes("<VOUCHER") || text.includes("<ENVELOPE")) {
    const rows: PreviewRow[] = [];
    const re = /<VOUCHER[^>]*>[\s\S]*?<\/VOUCHER>/gi;
    const matches = text.match(re) ?? [];
    for (const m of matches.slice(0, 20)) {
      rows.push({
        voucherType: (m.match(/VCHTYPE="([^"]+)"/i) ?? [])[1],
        party: (m.match(/<PARTYNAME>([^<]+)/i) ?? [])[1],
        amount: Number((m.match(/<AMOUNT>([^<]+)/i) ?? [])[1]) || undefined,
        raw: m.replace(/\s+/g, " ").slice(0, 120),
      });
    }
    if (rows.length === 0) {
      rows.push({ raw: text.slice(0, 120), voucherType: "xml_stub" });
    }
    return { format: "xml", rows };
  }
  // CSV-ish: type,party,amount,date
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: PreviewRow[] = [];
  for (const line of lines.slice(0, 21)) {
    if (/voucher|type/i.test(line) && /party/i.test(line)) continue;
    const parts = line.split(",").map((p) => p.trim());
    rows.push({
      voucherType: parts[0],
      party: parts[1],
      amount: Number(parts[2]) || undefined,
      date: parts[3],
      raw: line.slice(0, 120),
    });
  }
  return { format: "csv", rows: rows.slice(0, 20) };
}

export function TallyImportClient() {
  const [fileName, setFileName] = useState("demo-export.csv");
  const [text, setText] = useState(
    "Sales,Retail Customer,1180,2025-09-01\nPurchase,Local Supplier,826,2025-09-01"
  );
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [format, setFormat] = useState<"csv" | "xml" | "json" | "unknown">("csv");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? "");
      setText(content);
      const parsed = parsePreview(content, file.name);
      setFormat(parsed.format);
      setPreview(parsed.rows);
    };
    reader.readAsText(file);
  }

  function runPreview() {
    const parsed = parsePreview(text, fileName);
    setFormat(parsed.format);
    setPreview(parsed.rows);
    setMessage(`Preview ${parsed.rows.length} rows (${parsed.format})`);
  }

  async function confirmStub() {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/import/tally", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        format,
        previewRows: preview,
        confirm: true,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Failed");
      return;
    }
    setMessage(data.message);
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="block text-sm font-medium">File (optional)</label>
        <input
          data-testid="tally-file-input"
          type="file"
          accept=".csv,.xml,.json,.txt"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Paste / edit content</label>
        <textarea
          data-testid="tally-paste"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-xs"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          data-testid="tally-preview-btn"
          onClick={runPreview}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Preview
        </button>
        <button
          type="button"
          data-testid="tally-confirm-btn"
          disabled={loading || preview.length === 0}
          onClick={confirmStub}
          className="rounded-md bg-tilla-600 px-4 py-2 text-sm font-medium text-white hover:bg-tilla-700 disabled:opacity-60"
        >
          {loading ? "…" : "Confirm import stub"}
        </button>
      </div>
      {message ? (
        <p className="text-sm text-slate-700" data-testid="tally-message">
          {message}
        </p>
      ) : null}
      {preview.length > 0 ? (
        <table className="min-w-full text-left text-sm" data-testid="tally-preview-table">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Party</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {preview.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-3 py-2">{r.voucherType ?? "—"}</td>
                <td className="px-3 py-2">{r.party ?? "—"}</td>
                <td className="px-3 py-2">{r.amount ?? "—"}</td>
                <td className="px-3 py-2">{r.date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
