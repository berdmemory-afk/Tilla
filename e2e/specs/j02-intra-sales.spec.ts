import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";
import {
  getPrisma,
  getAcmeCompanyId,
  assertVoucherBalanced,
} from "../helpers/db";

/**
 * J2 (E4/E5) — intra-state GST sales: UI + API + DB Dr/Cr balance
 * Maestro steps:
 * - login as demo
 * - open New Sales
 * - select Retail Customer (intra), qty 3, unique narration
 * - assert tax preview shows CGST+SGST
 * - post voucher
 * - assert sales list UI
 * - assert API lists voucher
 * - assert DB lines balanced and CGST/SGST > 0, IGST = 0
 */
test.describe("J2 intra sales CGST+SGST", () => {
  test("J2 create intra sales and assert UI API DB", async ({ page, request }) => {
    const narration = "E2E-J2-" + Date.now();
    await loginAs(page, "demo@tilla.app");

    await page.goto("/vouchers/sales/new");
    await expect(page.getByTestId("sales-form")).toBeVisible();
    await page.getByTestId("sales-party").selectOption({ label: "Retail Customer (27)" });
    await page.getByTestId("sales-intra").check();
    await page.getByTestId("sales-qty").fill("3");
    await page.getByTestId("sales-narration").fill(narration);

    const preview = page.getByTestId("tax-preview");
    await expect(preview).toContainText("CGST");
    await expect(preview).toContainText("SGST");

    const apiPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await page.getByTestId("sales-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    await expect(page).toHaveURL(/\/vouchers\/sales$/);
    await expect(page.getByRole("heading", { name: /Sales Vouchers/i })).toBeVisible();

    await apiSignIn(request, "demo@tilla.app");
    const api = await request.get("/api/vouchers/sales");
    expect(api.status()).toBe(200);
    const { vouchers } = await api.json();
    const hit = vouchers.find((v: { narration?: string }) => v.narration === narration);
    expect(hit).toBeTruthy();
    expect(Number(hit.cgstAmount)).toBeGreaterThan(0);
    expect(Number(hit.sgstAmount)).toBeGreaterThan(0);
    expect(Number(hit.igstAmount)).toBe(0);

    const prisma = getPrisma();
    try {
      const companyId = await getAcmeCompanyId(prisma);
      const dbV = await prisma.voucher.findFirst({
        where: { companyId, narration },
        include: { lines: true, voucherType: true },
      });
      expect(dbV).toBeTruthy();
      expect(dbV!.voucherType.name).toBe("Sales");
      expect(Number(dbV!.cgstAmount)).toBeGreaterThan(0);
      expect(Number(dbV!.sgstAmount)).toBeGreaterThan(0);
      expect(Number(dbV!.igstAmount)).toBe(0);
      const bal = await assertVoucherBalanced(prisma, dbV!.id);
      expect(bal.debit).toBe(bal.credit);
      expect(bal.debit).toBe(Number(dbV!.totalAmount));
    } finally {
      await prisma.$disconnect();
    }
  });
});
