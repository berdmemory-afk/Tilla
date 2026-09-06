import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId } from "../helpers/db";

/** J8 (E9) — Day Book shows recently posted payment */
test.describe("J8 day book", () => {
  test("J8 day book lists recently posted payment", async ({ page }) => {
    const narration = "E2E-J8-DB-" + Date.now();
    const prisma = getPrisma();
    const companyId = await getAcmeCompanyId(prisma);
    const supplier = await prisma.party.findFirstOrThrow({
      where: { companyId, name: "Local Supplier" },
    });
    const cash = await prisma.ledger.findFirstOrThrow({
      where: { companyId, name: "Cash" },
    });
    await prisma.$disconnect();

    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/payment/new");
    await page.getByTestId("payment-party").selectOption(supplier.id);
    await page.getByTestId("payment-cash").selectOption(cash.id);
    await page.getByTestId("payment-amount").fill("55");
    await page.getByTestId("payment-narration").fill(narration);
    const apiPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/vouchers/payment") &&
        r.request().method() === "POST"
    );
    await page.getByTestId("payment-submit").click();
    expect((await apiPromise).status()).toBe(201);
    await expect(page).toHaveURL(/\/reports\/day-book/);

    await expect(page.getByTestId("daybook-heading")).toBeVisible();
    await expect(page.getByTestId("daybook-list")).toBeVisible();
    await expect(page.getByTestId("daybook-list")).toContainText(narration);
    await expect(page.getByTestId("daybook-list").getByText(/Payment/i).first()).toBeVisible();

    const prisma2 = getPrisma();
    try {
      const v = await prisma2.voucher.findFirst({
        where: { companyId, narration },
        include: { voucherType: true },
      });
      expect(v).toBeTruthy();
      expect(v!.voucherType.name).toBe("Payment");
    } finally {
      await prisma2.$disconnect();
    }
  });
});
