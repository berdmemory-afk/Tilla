/**
 * Market pricing config (INR / month). Seed mirrors these codes.
 * Starter ₹399 · Growth ₹599 · Business ₹1,199
 */

export type PlanConfig = {
  code: "starter" | "growth" | "business";
  name: string;
  priceInrMonthly: number;
  description: string;
  features: string[];
  sortOrder: number;
};

export const PRICING_PLANS: PlanConfig[] = [
  {
    code: "starter",
    name: "Starter",
    priceInrMonthly: 399,
    description: "Solo traders & micro GST dealers",
    features: [
      "1 company",
      "Sales & purchase vouchers",
      "GSTR-1 / 3B stub exports",
      "Email support",
    ],
    sortOrder: 1,
  },
  {
    code: "growth",
    name: "Growth",
    priceInrMonthly: 599,
    description: "Growing SMEs with inventory",
    features: [
      "Everything in Starter",
      "Inventory & godown balances",
      "Payment / receipt / journal",
      "CA viewer invites",
      "E-invoice / e-way stubs",
    ],
    sortOrder: 2,
  },
  {
    code: "business",
    name: "Business",
    priceInrMonthly: 1199,
    description: "Multi-user teams & CA practices",
    features: [
      "Everything in Growth",
      "Priority support",
      "Affiliate earnings dashboard",
      "Postgres-ready multi-company (roadmap)",
      "Live GSTN adapters (roadmap)",
    ],
    sortOrder: 3,
  },
];

export function getPlanByCode(code: string): PlanConfig | undefined {
  return PRICING_PLANS.find((p) => p.code === code);
}
