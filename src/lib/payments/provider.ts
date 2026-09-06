/**
 * PaymentProvider stub — NO live payment gateway.
 * Wire Razorpay/Cashfree/etc. later; keep checkout UI calling these stubs only.
 */

export type CheckoutSessionInput = {
  companyId: string;
  planCode: string;
  amountInr: number;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type CheckoutSessionResult = {
  ok: boolean;
  provider: "stub";
  checkoutUrl?: string;
  providerRef?: string;
  message: string;
};

export type PaymentProvider = {
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  verifyWebhook?(payload: unknown): Promise<{ ok: boolean; message: string }>;
};

export const stubPaymentProvider: PaymentProvider = {
  async createCheckoutSession(input) {
    // TODO: Replace with live PG (Razorpay / Cashfree) after credentials + webhook URL ready.
    return {
      ok: false,
      provider: "stub",
      providerRef: `stub_${input.planCode}_${Date.now()}`,
      message:
        "Payment gateway not configured. Checkout stub only — do not collect cards yet.",
    };
  },
  async verifyWebhook() {
    return {
      ok: false,
      message: "TODO: implement PG webhook verification when live gateway is enabled",
    };
  },
};

export function getPaymentProvider(): PaymentProvider {
  // Feature-flag later: if (process.env.PAYMENT_PROVIDER === "razorpay") ...
  return stubPaymentProvider;
}
