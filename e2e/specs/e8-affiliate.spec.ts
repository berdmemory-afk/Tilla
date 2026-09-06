import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

/**
 * E8 — affiliate earnings pending; no Paid/checkout CTAs
 * Maestro: e2e/flows/e8-affiliate-pending.yaml
 */
test.describe("E8 affiliate pending no payout CTAs", () => {
  test("E8 shows accrued earnings without Pay/Checkout CTAs", async ({ page }) => {
    await loginAs(page, "demo@tilla.app");
    await page.goto("/settings/affiliate");

    await expect(page.getByTestId("affiliate-heading")).toBeVisible();
    await expect(page.getByTestId("referral-code")).toContainText("TILLA-DEMO");
    await expect(page.getByTestId("earnings-table")).toBeVisible();
    await expect(page.getByTestId("earnings-accrued")).toBeVisible();

    // Seeded accrued row present (pending payout)
    await expect(page.getByTestId("earnings-table")).toContainText("accrued");

    // No live payout / checkout CTAs (stub only — see security checkout stub)
    await expect(page.getByTestId("pay-now-cta")).toHaveCount(0);
    await expect(page.getByTestId("checkout-cta")).toHaveCount(0);
    await expect(page.getByTestId("mark-paid-cta")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Pay now$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Checkout$/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /^Checkout$/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Mark as Paid$/i })).toHaveCount(0);

    // Copy clarifies models/stub — no live PG
    await expect(page.getByText(/no live payouts|payment gateway/i)).toBeVisible();
  });
});
