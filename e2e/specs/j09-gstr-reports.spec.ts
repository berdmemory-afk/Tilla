import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId, sumSalesTaxBooks } from "../helpers/db";

test.describe("J9 GSTR drafts vs books", () => {
  test("J9 GSTR-1 API summary matches sales books", async ({ page, request }) => {
    const narration = "E2E-J9-GSTR-" + Date.now();
    const prisma = getPrisma();
    const companyId = await getAcmeCompanyId(prisma);
    const party = await prisma.party.findFirstOrThrow({
      where: { companyId, name: "Retail Customer" },
    });
    await prisma.$disconnect();

    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/sales/new");
    await page.getByTestId("sales-party").selectOption(party.id);
    await page.getByTestId("sales-intra").check();
    await page.getByTestId("sales-qty").fill("2");
    await page.getByTestId("sales-narration").fill(narration);
    const salesPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/sales") && r.request().method() === "POST"
    );
    await page.getByTestId("sales-submit").click();
    expect((await salesPromise).status()).toBe(201);

    const from = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    await page.goto(`/reports/gstr-1?from=${from}&to=${to}`);
    await expect(page.getByTestId("gstr1-heading")).toBeVisible();
    await expect(page.getByTestId("gstr1-stub-note")).toBeVisible();
    await expect(page.getByTestId("gstr1-summary")).toBeVisible();

    await apiSignIn(request, "demo@tilla.app");
    const api = await request.get(`/api/reports/gstr1?from=${from}&to=${to}`);
    expect(api.status()).toBe(200);
    const report = await api.json();
    expect(report.meta.report).toBe("GSTR-1");
    expect(report.meta.note).toMatch(/stub/i);

    const prisma2 = getPrisma();
    try {
      const books = await sumSalesTaxBooks(
        prisma2,
        companyId,
        new Date(from),
        new Date(to + "T23:59:59.999Z")
      );
      expect(report.summary.taxableAmount).toBe(books.taxable);
      expect(report.summary.cgst).toBe(books.cgst);
      expect(report.summary.sgst).toBe(books.sgst);
      expect(report.summary.igst).toBe(books.igst);
      expect(report.summary.total).toBe(books.total);
      expect(report.summary.invoiceCount).toBe(books.count);
      expect(books.count).toBeGreaterThan(0);
    } finally {
      await prisma2.$disconnect();
    }
  });

  test("J9 GSTR-3B draft outward matches sales books", async ({ page, request }) => {
    await loginAs(page, "demo@tilla.app");
    const from = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    await page.goto(`/reports/gstr-3b?from=${from}&to=${to}`);
    await expect(page.getByTestId("gstr3b-heading")).toBeVisible();
    await expect(page.getByTestId("gstr3b-stub-note")).toBeVisible();
    await expect(page.getByTestId("gstr3b-summary")).toBeVisible();

    await apiSignIn(request, "demo@tilla.app");
    const api = await request.get(`/api/reports/gstr3b?from=${from}&to=${to}`);
    expect(api.status()).toBe(200);
    const report = await api.json();
    expect(report.meta.report).toBe("GSTR-3B");

    const prisma = getPrisma();
    try {
      const companyId = await getAcmeCompanyId(prisma);
      const books = await sumSalesTaxBooks(
        prisma,
        companyId,
        new Date(from),
        new Date(to + "T23:59:59.999Z")
      );
      expect(report.outwardSupplies.taxable).toBe(books.taxable);
      expect(report.outwardSupplies.cgst).toBe(books.cgst);
      expect(report.outwardSupplies.sgst).toBe(books.sgst);
      expect(report.outwardSupplies.igst).toBe(books.igst);
      expect(report.salesCount).toBe(books.count);
    } finally {
      await prisma.$disconnect();
    }
  });
});
