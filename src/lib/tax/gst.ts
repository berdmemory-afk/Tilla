/**
 * Indian GST tax helpers for Tilla.
 * Intra-state => CGST + SGST (split equally).
 * Inter-state => IGST (full rate).
 * Amounts rounded to 2 decimal places (paisa).
 */

export type GstSplit =
  | { kind: "intra"; cgst: number; sgst: number; igst: 0; totalTax: number }
  | { kind: "inter"; cgst: 0; sgst: 0; igst: number; totalTax: number };

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Compute GST components for a taxable (ex-GST) amount.
 * @param taxableAmount amount before tax
 * @param gstRatePct total GST rate e.g. 18 for 18%
 * @param isIntraState true => CGST+SGST; false => IGST
 */
export function computeGst(
  taxableAmount: number,
  gstRatePct: number,
  isIntraState: boolean
): GstSplit {
  if (taxableAmount < 0) {
    throw new Error("taxableAmount must be >= 0");
  }
  if (gstRatePct < 0) {
    throw new Error("gstRatePct must be >= 0");
  }

  const totalTax = round2((taxableAmount * gstRatePct) / 100);

  if (isIntraState) {
    // Split evenly; adjust SGST so cgst+sgst === totalTax (handles odd paisa)
    const cgst = round2(totalTax / 2);
    const sgst = round2(totalTax - cgst);
    return { kind: "intra", cgst, sgst, igst: 0, totalTax: round2(cgst + sgst) };
  }

  return { kind: "inter", cgst: 0, sgst: 0, igst: totalTax, totalTax };
}

export function invoiceTotal(taxableAmount: number, split: GstSplit): number {
  return round2(taxableAmount + split.totalTax);
}

/** Half-rate for CGST or SGST display (e.g. 18% => 9%). */
export function halfRate(gstRatePct: number): number {
  return round2(gstRatePct / 2);
}
