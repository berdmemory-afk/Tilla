import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

/**
 * E3 — keyboard: Enter / F2 / Alt+I / Ctrl+S / Esc dirty-guard on sales voucher
 */
test.describe("E3 sales keyboard UX", () => {
  test("E3 Enter Alt+I Esc dirty-guard and Ctrl+S / F2 save hooks", async ({ page }) => {
    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/sales/new");
    await expect(page.getByTestId("sales-form")).toBeVisible();
    await expect(page.getByTestId("sales-keyboard-hints")).toBeVisible();

    // Enter on qty → narration
    await page.getByTestId("sales-qty").fill("2");
    await page.getByTestId("sales-qty").press("Enter");
    await expect(page.getByTestId("sales-narration")).toBeFocused();

    // Alt+I → item
    await page.keyboard.press("Alt+i");
    await expect(page.getByTestId("sales-item")).toBeFocused();

    // Dirty + Esc → dirty-guard
    await page.getByTestId("sales-narration").fill("E2E-E3-dirty-" + Date.now());
    await expect(page.getByTestId("sales-form")).toHaveAttribute("data-dirty", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("dirty-guard")).toBeVisible();
    await expect(page.getByTestId("dirty-guard-message")).toContainText(/Unsaved changes/i);
    await page.getByTestId("dirty-guard-dismiss").click();
    await expect(page.getByTestId("dirty-guard")).toHaveCount(0);

    // Ctrl+S triggers submit (intercept network; do not require navigation if validation fails)
    const narration = "E2E-E3-Ctrls-" + Date.now();
    await page.getByTestId("sales-narration").fill(narration);
    await page.getByTestId("sales-party").selectOption({ index: 0 });
    await page.getByTestId("sales-intra").check();

    const ctrlPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await page.keyboard.press("Control+s");
    const ctrlRes = await ctrlPromise;
    expect(ctrlRes.status()).toBe(201);
    await expect(page).toHaveURL(/\/vouchers\/sales$/);

    // Fresh form for F2
    await page.goto("/vouchers/sales/new");
    await expect(page.getByTestId("sales-form")).toBeVisible();
    const narration2 = "E2E-E3-F2-" + Date.now();
    await page.getByTestId("sales-party").selectOption({ index: 0 });
    await page.getByTestId("sales-qty").fill("1");
    await page.getByTestId("sales-narration").fill(narration2);
    const f2Promise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await page.keyboard.press("F2");
    const f2Res = await f2Promise;
    expect(f2Res.status()).toBe(201);
    await expect(page).toHaveURL(/\/vouchers\/sales$/);
  });
});
