import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId } from "../helpers/db";

/**
 * E6 — Tally import smoke (stub). Live ledger apply is a documented product gap.
 * AC wants reconcile + first sales <30m post-import; stub records audit only.
 */
test.describe("E6 Tally import smoke", () => {
  test("E6 preview + confirm stub records audit; does not mutate vouchers", async ({
    page,
  }) => {
    await loginAs(page, "demo@tilla.app");
    await page.goto("/settings/import");
    await expect(page.getByTestId("tally-import-heading")).toBeVisible();

    const prisma = getPrisma();
    let companyId = "";
    let voucherCountBefore = 0;
    try {
      companyId = await getAcmeCompanyId(prisma);
      voucherCountBefore = await prisma.voucher.count({ where: { companyId } });
    } finally {
      await prisma.$disconnect();
    }

    await page.getByTestId("tally-paste").fill(
      "Sales,Retail Customer,1180,2025-09-01\nPurchase,Local Supplier,826,2025-09-01"
    );
    await page.getByTestId("tally-preview-btn").click();
    await expect(page.getByTestId("tally-preview-table")).toBeVisible();
    await expect(page.getByTestId("tally-preview-table")).toContainText("Sales");
    await expect(page.getByTestId("tally-message")).toContainText(/Preview/i);

    const confirmPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/import/tally") && r.request().method() === "POST"
    );
    await page.getByTestId("tally-confirm-btn").click();
    const res = await confirmPromise;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("stub_recorded");
    expect(String(body.message)).toMatch(/not enabled|stub|audit/i);
    await expect(page.getByTestId("tally-message")).toContainText(/stub|audit|not enabled/i);

    const prisma2 = getPrisma();
    try {
      const voucherCountAfter = await prisma2.voucher.count({
        where: { companyId },
      });
      expect(voucherCountAfter).toBe(voucherCountBefore);
      const audit = await prisma2.auditLog.findFirst({
        where: { companyId, action: "import.tally_stub" },
        orderBy: { createdAt: "desc" },
      });
      expect(audit).toBeTruthy();
      expect(audit!.summary).toMatch(/stub/i);
    } finally {
      await prisma2.$disconnect();
    }
  });
});
