import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

/**
 * E5 — GST strip never blocks save (post-save e-invoice/e-way)
 */
test.describe("E5 GST strip non-blocking", () => {
  test("E5 gst-strip present and does not disable save", async ({ page }) => {
    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/sales/new");
    await expect(page.getByTestId("sales-form")).toBeVisible();

    const strip = page.getByTestId("gst-strip");
    await expect(strip).toBeVisible();
    await expect(strip).toHaveAttribute("data-blocks-save", "false");
    await expect(strip).toContainText(/post-save|never blocks/i);

    const submit = page.getByTestId("sales-submit");
    await expect(submit).toBeEnabled();

    const narration = "E2E-E5-" + Date.now();
    await page.getByTestId("sales-party").selectOption({ index: 0 });
    await page.getByTestId("sales-qty").fill("1");
    await page.getByTestId("sales-narration").fill(narration);

    const apiPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await submit.click();
    const res = await apiPromise;
    expect(res.status()).toBe(201);
    await expect(page).toHaveURL(/\/vouchers\/sales$/);
  });
});
