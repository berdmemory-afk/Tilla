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
  mode: "stub";
};

export async function generateEInvoice(
  payload: EInvoicePayload
): Promise<EInvoiceResult> {
  // Deterministic stub IRN for local QA (not a real IRN).
  const stubIrn = `STUBIRN${payload.invoiceNumber}${payload.invoiceDate.replace(/-/g, "")}`.slice(
    0,
    64
  );
  return {
    ok: true,
    irn: stubIrn,
    qrCode: `stub-qr://${stubIrn}`,
    message: "E-invoice stub OK — not submitted to GSTN/NIC",
    mode: "stub",
  };
}
