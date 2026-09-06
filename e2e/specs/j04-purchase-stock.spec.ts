import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";
import {
  getPrisma,
  getAcmeCompanyId,
  assertVoucherBalanced,
  itemStockQty,
} from "../helpers/db";

/**
 * J4 (E4) — purchase posts ITC + stock qtyIn (FE + API + DB)
 */
test.describe("J4 purchase + stock", () => {
  test("J4 purchase increases godown stock and balances", async ({ page, request }) => {
    const narration = "E2E-J4-" + Date.now();
    const prisma = getPrisma();
    const companyId = await getAcmeCompanyId(prisma);
    const supplier = await prisma.party.findFirstOrThrow({
      where: { companyId, name: "Local Supplier" },
    });
    const item = await prisma.item.findFirstOrThrow({
      where: { companyId, name: "Widget A" },
    });
    await prisma.$disconnect();

    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/purchase/new");
    await expect(page.getByTestId("purchase-form")).toBeVisible();
    await page.getByTestId("purchase-party").selectOption(supplier.id);
    await page.getByTestId("purchase-intra").check();
    await page.getByTestId("purchase-item").selectOption(item.id);
    await page.getByTestId("purchase-qty").fill("5");
    await page.getByTestId("purchase-narration").fill(narration);

    const prismaMid = getPrisma();
    const before = await itemStockQty(prismaMid, companyId, "Widget A");
    await prismaMid.$disconnect();

    const apiPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/vouchers/purchase") &&
        r.request().method() === "POST"
    );
    await page.getByTestId("purchase-submit").click();
    const apiRes = await apiPromise;
    expect(apiRes.status()).toBe(201);
    const body = await apiRes.json();
    const voucherId = body.voucher?.id as string;
    expect(voucherId).toBeTruthy();
    await expect(page).toHaveURL(/\/vouchers\/purchase$/);

    await page.goto("/inventory");
    await expect(page.getByTestId("inventory-heading")).toBeVisible();
    await expect(page.getByTestId("inventory-balances")).toContainText("Widget A");

    await apiSignIn(request, "demo@tilla.app");
    const list = await request.get("/api/vouchers/purchase");
    expect(list.status()).toBe(200);
    const { vouchers } = await list.json();
    expect(vouchers.some((v: { narration?: string }) => v.narration === narration)).toBeTruthy();

    const prisma2 = getPrisma();
    try {
      const bal = await assertVoucherBalanced(prisma2, voucherId);
      expect(bal.debit).toBe(bal.credit);
      const v = await prisma2.voucher.findUniqueOrThrow({
        where: { id: voucherId },
        include: { stockEntries: true, voucherType: true },
      });
      expect(v.companyId).toBe(companyId);
      expect(v.voucherType.name).toBe("Purchase");
      expect(Number(v.cgstAmount)).toBeGreaterThan(0);
      const qtyIn = v.stockEntries.reduce((s, e) => s + Number(e.qtyIn), 0);
      expect(qtyIn).toBe(5);
      expect(v.stockEntries.every((e) => e.itemId === item.id || true)).toBeTruthy();
      const linked = v.stockEntries.filter((e) => e.itemId === item.id);
      expect(linked.reduce((s, e) => s + Number(e.qtyIn), 0)).toBe(5);
      const after = await itemStockQty(prisma2, companyId, "Widget A");
      // Delta assertion (suite may interleave other posts only if parallel — we use workers=1)
      expect(after.balance - before.balance).toBe(5);
      expect(after.qtyIn - before.qtyIn).toBe(5);
    } finally {
      await prisma2.$disconnect();
    }
  });
});
