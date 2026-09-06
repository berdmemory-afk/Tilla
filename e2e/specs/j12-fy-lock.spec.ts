import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId } from "../helpers/db";

/**
 * J12 (E9) — FY lock blocks posting when locked
 */
test.describe("J12 FY lock", () => {
  test.afterEach(async () => {
    const prisma = getPrisma();
    try {
      const companyId = await getAcmeCompanyId(prisma);
      await prisma.company.update({
        where: { id: companyId },
        data: { booksLocked: false, booksLockedAt: null },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  test("J12 lock blocks payment post; unlock restores", async ({ page }) => {
    const prisma0 = getPrisma();
    const companyId = await getAcmeCompanyId(prisma0);
    const supplier = await prisma0.party.findFirstOrThrow({
      where: { companyId, name: "Local Supplier" },
    });
    const cash = await prisma0.ledger.findFirstOrThrow({
      where: { companyId, name: "Cash" },
    });
    // Ensure open before start
    await prisma0.company.update({
      where: { id: companyId },
      data: { booksLocked: false, booksLockedAt: null },
    });
    await prisma0.$disconnect();

    await loginAs(page, "demo@tilla.app");
    await page.goto("/settings/company");
    await expect(page.getByTestId("fy-lock-panel")).toBeVisible();
    await expect(page.getByTestId("fy-lock-status")).toContainText(/Open/i);

    const lockPromise = page.waitForResponse(
      (r) => r.url().includes("/api/company/fy-lock") && r.request().method() === "POST"
    );
    await page.getByTestId("fy-lock-toggle").click();
    const lockRes = await lockPromise;
    expect(lockRes.status()).toBe(200);
    expect((await lockRes.json()).booksLocked).toBe(true);
    await expect(page.getByTestId("fy-lock-status")).toContainText(/Locked/i);

    const prismaLock = getPrisma();
    try {
      const co = await prismaLock.company.findUniqueOrThrow({ where: { id: companyId } });
      expect(co.booksLocked).toBe(true);
    } finally {
      await prismaLock.$disconnect();
    }

    // UI path blocked
    await page.goto("/vouchers/payment/new");
    await page.getByTestId("payment-party").selectOption(supplier.id);
    await page.getByTestId("payment-cash").selectOption(cash.id);
    await page.getByTestId("payment-amount").fill("10");
    await page.getByTestId("payment-narration").fill("E2E-J12-BLOCK-" + Date.now());
    const payPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/payment") && r.request().method() === "POST"
    );
    await page.getByTestId("payment-submit").click();
    const payRes = await payPromise;
    expect(payRes.status()).toBe(400);
    expect(String((await payRes.json()).error)).toMatch(/locked/i);
    await expect(page.getByTestId("payment-error")).toContainText(/locked/i);

    // Same-session API path blocked (page.request shares cookies)
    const apiPay = await page.request.post("/api/vouchers/payment", {
      headers: { "Content-Type": "application/json" },
      data: {
        partyId: supplier.id,
        cashLedgerId: cash.id,
        date: new Date().toISOString().slice(0, 10),
        amount: 11,
        narration: "E2E-J12-API-BLOCK",
      },
    });
    expect(apiPay.status()).toBe(400);
    expect(String((await apiPay.json()).error)).toMatch(/locked/i);

    // Unlock
    await page.goto("/settings/company");
    const unlockPromise = page.waitForResponse(
      (r) => r.url().includes("/api/company/fy-lock") && r.request().method() === "POST"
    );
    await page.getByTestId("fy-lock-toggle").click();
    expect((await unlockPromise).status()).toBe(200);
    await expect(page.getByTestId("fy-lock-status")).toContainText(/Open/i);

    await page.goto("/vouchers/payment/new");
    const okNarr = "E2E-J12-OK-" + Date.now();
    await page.getByTestId("payment-party").selectOption(supplier.id);
    await page.getByTestId("payment-cash").selectOption(cash.id);
    await page.getByTestId("payment-amount").fill("12");
    await page.getByTestId("payment-narration").fill(okNarr);
    const okPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/payment") && r.request().method() === "POST"
    );
    await page.getByTestId("payment-submit").click();
    expect((await okPromise).status()).toBe(201);
    await expect(page).toHaveURL(/\/reports\/day-book/);
  });
});
