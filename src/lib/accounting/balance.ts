import { round2 } from "@/lib/tax/gst";

export type JournalLineInput = {
  ledgerId: string;
  debit: number;
  credit: number;
  narration?: string;
};

/** Ensure Dr === Cr (to 2 decimals). Throws if unbalanced. */
export function assertBalanced(lines: JournalLineInput[]): {
  debitSum: number;
  creditSum: number;
} {
  const debitSum = round2(lines.reduce((s, l) => s + l.debit, 0));
  const creditSum = round2(lines.reduce((s, l) => s + l.credit, 0));
  if (debitSum !== creditSum) {
    throw new Error(`Unbalanced voucher: Dr ${debitSum} != Cr ${creditSum}`);
  }
  if (lines.length < 2) {
    throw new Error("Voucher needs at least two ledger lines");
  }
  for (const l of lines) {
    if (l.debit < 0 || l.credit < 0) {
      throw new Error("Debit/credit amounts must be >= 0");
    }
    if (l.debit > 0 && l.credit > 0) {
      throw new Error("A line cannot have both debit and credit");
    }
  }
  return { debitSum, creditSum };
}

export function nextVoucherNumber(count: number): string {
  return String(count + 1).padStart(4, "0");
}
