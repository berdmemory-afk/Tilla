import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";

/**
 * E7 / J10 — CA viewer read-only; no referral UI on ca_viewer seat
 */
test.describe("E7 CA view read-only no referral", () => {
  test("E7 ca_viewer has no affiliate/referral nav and cannot write", async ({
    page,
    request,
  }) => {
    await loginAs(page, "ca@tilla.app");
    await expect(page.getByTestId("active-role")).toContainText("ca_viewer");
    await expect(page.getByTestId("user-email")).toContainText("ca@tilla.app");

    // No referral / affiliate UI on CA seat
    await expect(page.getByTestId("nav-settings-affiliate")).toHaveCount(0);
    await expect(page.getByTestId("sidebar-nav")).not.toContainText("Affiliate");
    await expect(page.getByTestId("sidebar-nav")).not.toContainText(/referral/i);

    // Write voucher entry points hidden
    await expect(page.getByTestId("nav-vouchers-sales-new")).toHaveCount(0);
    await expect(page.getByTestId("nav-vouchers-purchase-new")).toHaveCount(0);

    // Read paths still available
    await expect(page.getByTestId("nav-dashboard")).toBeVisible();
    await expect(page.getByTestId("nav-vouchers-sales")).toBeVisible();
    await expect(page.getByTestId("nav-inventory")).toBeVisible();

    // Direct affiliate URL should not expose partner referral CTAs for CA seat —
    // product hides nav; if page still loads, assert no checkout CTAs at minimum.
    await page.goto("/settings/affiliate");
    // Prefer redirect or empty; if page renders, no Pay/Checkout CTAs
    const payCta = page.getByRole("button", { name: /pay now|checkout|mark as paid/i });
    await expect(payCta).toHaveCount(0);

    await apiSignIn(request, "ca@tilla.app");
    const write = await request.post("/api/vouchers/purchase", {
      data: {
        partyId: "x",
        date: "2025-09-01",
        isIntraState: true,
        items: [{ itemId: "x", quantity: 1, rate: 100, gstRatePct: 18 }],
      },
    });
    expect(write.status()).toBe(403);
  });
});
