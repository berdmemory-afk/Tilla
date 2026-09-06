import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId, assertVoucherBalanced } from "../helpers/db";

/**
 * J3 (E4/E5) — inter-state GST sales: IGST only
 */
test.describe("J3 inter sales IGST", () => {
  test("J3 create inter-state sale with IGST only", async ({ page, request }) => {
    const narration = "E2E-J3-" + Date.now();
    const prisma = getPrisma();
    let delhiId = "";
    try {
      const companyId = await getAcmeCompanyId(prisma);
      const delhi = await prisma.party.findFirst({
        where: { companyId, name: "Delhi Buyer" },
      });
      expect(delhi).toBeTruthy();
      delhiId = delhi!.id;
    } finally {
      await prisma.$disconnect();
    }

    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/sales/new");
    await expect(page.getByTestId("sales-form")).toBeVisible();
    await page.getByTestId("sales-party").selectOption(delhiId);
    await page.getByTestId("sales-inter").check();
    await page.getByTestId("sales-qty").fill("2");
    await page.getByTestId("sales-narration").fill(narration);

    const apiPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await page.getByTestId("sales-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    await expect(page).toHaveURL(/\/vouchers\/sales$/);

    await apiSignIn(request, "demo@tilla.app");
    const api = await request.get("/api/vouchers/sales");
    const { vouchers } = await api.json();
    const hit = vouchers.find((v: { narration?: string }) => v.narration === narration);
    expect(hit).toBeTruthy();
    expect(Number(hit.igstAmount)).toBeGreaterThan(0);
    expect(Number(hit.cgstAmount)).toBe(0);
    expect(Number(hit.sgstAmount)).toBe(0);

    const prisma2 = getPrisma();
    try {
      const companyId = await getAcmeCompanyId(prisma2);
      const dbV = await prisma2.voucher.findFirst({ where: { companyId, narration } });
      expect(dbV).toBeTruthy();
      expect(Number(dbV!.igstAmount)).toBeGreaterThan(0);
      expect(Number(dbV!.cgstAmount)).toBe(0);
      expect(Number(dbV!.sgstAmount)).toBe(0);
      await assertVoucherBalanced(prisma2, dbV!.id);
    } finally {
      await prisma2.$disconnect();
    }
  });
});
