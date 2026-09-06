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
};

export async function generateEWayBill(_payload: EWayPayload): Promise<EWayResult> {
  return {
    ok: false,
    message: "E-way bill stub: GSTN integration not configured (foundation)",
  };
}
