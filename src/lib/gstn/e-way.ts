/**
 * Stub e-way bill client — no live GSTN calls.
 */

export type EWayPayload = {
  companyGstin: string;
  consignorGstin?: string;
  consigneeGstin?: string;
  documentNumber: string;
  documentDate: string;
  vehicleNumber?: string;
  distanceKm?: number;
  totalAmount: number;
};

export type EWayResult = {
  ok: boolean;
  ewayBillNo?: string;
  message: string;
  mode: "stub";
};

export async function generateEWayBill(payload: EWayPayload): Promise<EWayResult> {
  const stubNo = `STUB${Date.now().toString().slice(-10)}`;
  return {
    ok: true,
    ewayBillNo: stubNo,
    message: `E-way stub OK for doc ${payload.documentNumber} — not submitted to GSTN`,
    mode: "stub",
  };
}
