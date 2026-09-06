import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";
import { getPrisma } from "../helpers/db";

/**
 * J11 (Tenancy) — Secret Co hidden from Acme session
 * Maestro steps:
 * - login as demo (Acme)
 * - API sales list must not include Secret Co voucher
 * - company switch to Secret Co id must 403
 * - switcher options must not list Secret Co
 * - DB confirms Secret Co voucher exists for other tenant only
 */
test.describe("J11 tenancy isolation", () => {
  test("J11 cannot read other company vouchers", async ({ page, request }) => {
    const prisma = getPrisma();
    let secretCompanyId = "";
    let secretNarration = "";
    try {
      const secret = await prisma.company.findFirst({ where: { name: "Secret Co" } });
      expect(secret).toBeTruthy();
      secretCompanyId = secret!.id;
      const secretV = await prisma.voucher.findFirst({
        where: { companyId: secret!.id, voucherType: { name: "Sales" } },
        orderBy: { createdAt: "desc" },
      });
      expect(secretV).toBeTruthy();
      secretNarration = secretV!.narration || "";
      expect(secretNarration).toMatch(/SECRET/i);
    } finally {
      await prisma.$disconnect();
    }

    await loginAs(page, "demo@tilla.app");
    await expect(page.getByTestId("active-company")).toContainText("Acme Traders");

    const switcher = page.getByTestId("company-switch-select");
    if (await switcher.count()) {
      const options = await switcher.locator("option").allTextContents();
      expect(options.join(" | ")).not.toMatch(/Secret Co/);
    }

    await apiSignIn(request, "demo@tilla.app");
    const list = await request.get("/api/vouchers/sales");
    expect(list.status()).toBe(200);
    const { vouchers } = await list.json();
    const leaked = vouchers.filter(
      (v: { narration?: string; totalAmount?: number }) =>
        (v.narration || "").includes("SECRET") || Number(v.totalAmount) === 11798.82
    );
    expect(leaked.length).toBe(0);

    const switchRes = await request.post("/api/company/switch", {
      data: { companyId: secretCompanyId },
    });
    expect(switchRes.status()).toBe(403);
  });
});
