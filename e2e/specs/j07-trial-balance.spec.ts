import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import {
  getPrisma,
  getAcmeCompanyId,
  getTrialBalanceTotals,
  assertVoucherBalanced,
} from "../helpers/db";

/**
 * J7 (E9) — Trial Balance still balances after posts
 */
test.describe("J7 trial balance", () => {
  test("J7 TB UI Balanced and DB totals match after journal", async ({ page }) => {
    const narration = "E2E-J7-TB-" + Date.now();
    await loginAs(page, "demo@tilla.app");

    // Post a small journal so we assert after a fresh movement
    await page.goto("/vouchers/journal/new");
    await page.getByTestId("journal-dr").selectOption({ label: "Cash" });
    await page.getByTestId("journal-cr").selectOption({ label: "Bank" });
    await page.getByTestId("journal-amount").fill("33");
    await page.getByTestId("journal-narration").fill(narration);
    const apiPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/vouchers/journal") &&
        r.request().method() === "POST"
    );
    await page.getByTestId("journal-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    const { voucher } = await apiRes.json();

    await page.goto("/reports/trial-balance");
    await expect(page.getByTestId("tb-heading")).toBeVisible();
    await expect(page.getByTestId("tb-balanced")).toBeVisible();
    await expect(page.getByTestId("tb-table")).toBeVisible();

    const uiDr = await page.getByTestId("tb-total-debit").innerText();
    const uiCr = await page.getByTestId("tb-total-credit").innerText();
    expect(uiDr.replace(/[₹,\s]/g, "")).toBe(uiCr.replace(/[₹,\s]/g, ""));

    const prisma = getPrisma();
    try {
      await assertVoucherBalanced(prisma, voucher.id);
      const companyId = await getAcmeCompanyId(prisma);
      const tb = await getTrialBalanceTotals(prisma, companyId);
      expect(tb.balanced).toBe(true);
      expect(tb.totalDebit).toBe(tb.totalCredit);
      expect(tb.totalDebit).toBeGreaterThan(0);
      const parseMoney = (s: string) => Number(s.replace(/[₹,\s]/g, ""));
      expect(parseMoney(uiDr)).toBe(tb.totalDebit);
      expect(parseMoney(uiCr)).toBe(tb.totalCredit);
    } finally {
      await prisma.$disconnect();
    }
  });
});
