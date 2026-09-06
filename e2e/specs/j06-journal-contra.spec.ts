import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { getPrisma, assertVoucherBalanced } from "../helpers/db";

/**
 * J6 (E9) — journal + contra balanced posting
 */
test.describe("J6 journal + contra", () => {
  test("J6 journal posts balanced two-line entry", async ({ page }) => {
    const narration = "E2E-J6-JRN-" + Date.now();
    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/journal/new");
    await expect(page.getByTestId("journal-form")).toBeVisible();
    await page.getByTestId("journal-dr").selectOption({ label: "Cash" });
    await page.getByTestId("journal-cr").selectOption({ label: "Bank" });
    await page.getByTestId("journal-amount").fill("75");
    await page.getByTestId("journal-narration").fill(narration);

    const apiPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/vouchers/journal") &&
        r.request().method() === "POST"
    );
    await page.getByTestId("journal-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    const body = await apiRes.json();
    const voucherId = body.voucher?.id as string;
    expect(voucherId).toBeTruthy();
    await expect(page).toHaveURL(/\/reports\/day-book/);

    const prisma = getPrisma();
    try {
      const bal = await assertVoucherBalanced(prisma, voucherId);
      expect(bal.debit).toBe(bal.credit);
      expect(bal.debit).toBe(75);
      const v = await prisma.voucher.findUniqueOrThrow({
        where: { id: voucherId },
        include: { voucherType: true },
      });
      expect(v.voucherType.name).toBe("Journal");
      expect(v.narration).toBe(narration);
    } finally {
      await prisma.$disconnect();
    }
  });

  test("J6 contra posts balanced Cash↔Bank transfer", async ({ page }) => {
    const narration = "E2E-J6-CTR-" + Date.now();
    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/contra/new");
    await expect(page.getByTestId("contra-form")).toBeVisible();
    await page.getByTestId("contra-from").selectOption({ label: "Cash" });
    await page.getByTestId("contra-to").selectOption({ label: "Bank" });
    await page.getByTestId("contra-amount").fill("120");
    await page.getByTestId("contra-narration").fill(narration);

    const apiPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/vouchers/contra") &&
        r.request().method() === "POST"
    );
    await page.getByTestId("contra-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    const body = await apiRes.json();
    const voucherId = body.voucher?.id as string;
    expect(voucherId).toBeTruthy();
    await expect(page).toHaveURL(/\/reports\/day-book/);

    const prisma = getPrisma();
    try {
      const bal = await assertVoucherBalanced(prisma, voucherId);
      expect(bal.debit).toBe(bal.credit);
      expect(bal.debit).toBe(120);
      const v = await prisma.voucher.findUniqueOrThrow({
        where: { id: voucherId },
        include: { voucherType: true, lines: { include: { ledger: true } } },
      });
      expect(v.voucherType.name).toBe("Contra");
      expect(v.narration).toBe(narration);
      const names = v.lines.map((l) => l.ledger.name).sort();
      expect(names).toEqual(["Bank", "Cash"]);
    } finally {
      await prisma.$disconnect();
    }
  });
});
