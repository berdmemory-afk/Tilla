import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { getPrisma, getAcmeCompanyId, assertVoucherBalanced } from "../helpers/db";

async function ensureAcmeUnlocked() {
  const prisma = getPrisma();
  try {
    const companyId = await getAcmeCompanyId(prisma);
    await prisma.company.update({
      where: { id: companyId },
      data: { booksLocked: false, booksLockedAt: null },
    });
    return companyId;
  } finally {
    await prisma.$disconnect();
  }
}

test.describe("J5 payment + receipt", () => {
  test.beforeEach(async () => {
    await ensureAcmeUnlocked();
  });

  test("J5 payment posts balanced Dr Party Cr Cash", async ({ page }) => {
    const narration = "E2E-J5-PMT-" + Date.now();
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
    await expect(page.getByTestId("payment-form")).toBeVisible();
    await page.getByTestId("payment-party").selectOption(supplier.id);
    await page.getByTestId("payment-cash").selectOption(cash.id);
    await page.getByTestId("payment-amount").fill("250");
    await page.getByTestId("payment-narration").fill(narration);
    const apiPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/payment") && r.request().method() === "POST"
    );
    await page.getByTestId("payment-submit").click();
    const apiRes = await apiPromise;
    if (apiRes.status() !== 201) {
      console.log("payment fail", await apiRes.json());
    }
    expect(apiRes.status()).toBe(201);
    const body = await apiRes.json();
    const voucherId = body.voucher?.id as string;
    expect(voucherId).toBeTruthy();
    await expect(page).toHaveURL(/\/reports\/day-book/);

    const prisma2 = getPrisma();
    try {
      const bal = await assertVoucherBalanced(prisma2, voucherId);
      expect(bal.debit).toBe(250);
      const v = await prisma2.voucher.findUniqueOrThrow({
        where: { id: voucherId },
        include: { voucherType: true, lines: { include: { ledger: true } } },
      });
      expect(v.voucherType.name).toBe("Payment");
      expect(v.lines.find((l) => Number(l.debit) > 0)?.ledger.name).toMatch(/Local Supplier/i);
      expect(v.lines.find((l) => Number(l.credit) > 0)?.ledger.name).toBe("Cash");
    } finally {
      await prisma2.$disconnect();
    }
  });

  test("J5 receipt posts balanced Dr Cash Cr Party", async ({ page }) => {
    const narration = "E2E-J5-RCP-" + Date.now();
    const prisma = getPrisma();
    const companyId = await getAcmeCompanyId(prisma);
    const customer = await prisma.party.findFirstOrThrow({
      where: { companyId, name: "Retail Customer" },
    });
    const bank = await prisma.ledger.findFirstOrThrow({
      where: { companyId, name: "Bank" },
    });
    await prisma.$disconnect();

    await loginAs(page, "demo@tilla.app");
    await page.goto("/vouchers/receipt/new");
    await expect(page.getByTestId("receipt-form")).toBeVisible();
    await page.getByTestId("receipt-party").selectOption(customer.id);
    await page.getByTestId("receipt-cash").selectOption(bank.id);
    await page.getByTestId("receipt-amount").fill("400");
    await page.getByTestId("receipt-narration").fill(narration);
    const apiPromise = page.waitForResponse(
      (r) => r.url().includes("/api/vouchers/receipt") && r.request().method() === "POST"
    );
    await page.getByTestId("receipt-submit").click();
    const apiRes = await apiPromise;
    if (apiRes.status() !== 201) {
      console.log("receipt fail", await apiRes.json());
    }
    expect(apiRes.status()).toBe(201);
    const body = await apiRes.json();
    const voucherId = body.voucher?.id as string;
    await expect(page).toHaveURL(/\/reports\/day-book/);

    const prisma2 = getPrisma();
    try {
      const bal = await assertVoucherBalanced(prisma2, voucherId);
      expect(bal.debit).toBe(400);
      const v = await prisma2.voucher.findUniqueOrThrow({
        where: { id: voucherId },
        include: { voucherType: true, lines: { include: { ledger: true } } },
      });
      expect(v.voucherType.name).toBe("Receipt");
      expect(v.lines.find((l) => Number(l.debit) > 0)?.ledger.name).toBe("Bank");
      expect(v.lines.find((l) => Number(l.credit) > 0)?.ledger.name).toMatch(/Retail Customer/i);
    } finally {
      await prisma2.$disconnect();
    }
  });
});
