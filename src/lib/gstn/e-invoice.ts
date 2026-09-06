/**
 * Stub e-invoice (IRN) client — no live GSTN calls.
 * Replace with NIC/GSTN adapter when credentials are available.
 */

export type EInvoicePayload = {
  companyGstin: string;
  buyerGstin?: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
};

export type EInvoiceResult = {
  ok: boolean;
  irn?: string;
  qrCode?: string;
  message: string;
};

export async function generateEInvoice(
  _payload: EInvoicePayload
): Promise<EInvoiceResult> {
  return {
    ok: false,
    message: "E-invoice stub: GSTN integration not configured (foundation)",
  };
}
