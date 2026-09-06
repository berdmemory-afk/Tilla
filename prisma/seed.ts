import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { PRICING_PLANS } from "../src/lib/pricing/plans";

const prisma = new PrismaClient();

function d(n: number) {
  return new Prisma.Decimal(n);
}

async function main() {
  console.log("Seeding Tilla demo data...");

  // Clean slate for idempotent local demo
  await prisma.affiliateEarning.deleteMany();
  await prisma.affiliateReferral.deleteMany();
  await prisma.companySubscription.deleteMany();
  await prisma.pricingPlan.deleteMany();
  await prisma.companyInvite.deleteMany();
  await prisma.eInvoiceRecord.deleteMany();
  await prisma.eWayBillRecord.deleteMany();
  await prisma.voucherItem.deleteMany();
  await prisma.voucherLine.deleteMany();
  await prisma.stockEntry.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.voucherType.deleteMany();
  await prisma.item.deleteMany();
  await prisma.godown.deleteMany();
  await prisma.party.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.ledgerGroup.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("demo1234", 10);

  const user = await prisma.user.create({
    data: {
      name: "Demo Owner",
      email: "demo@tilla.app",
      passwordHash,
      referralCode: "TILLA-DEMO",
    },
  });

  const company = await prisma.company.create({
    data: {
      name: "Acme Traders",
      legalName: "Acme Traders Private Limited",
      gstin: "27AABCT1332L1ZV",
      stateCode: "27",
      stateName: "Maharashtra",
      addressLine1: "12 MG Road",
      city: "Pune",
      pincode: "411001",
    },
  });

  await prisma.membership.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: "owner",
    },
  });

  // Indian-style CoA groups (simplified)
  const groups = [
    { name: "Capital Account", nature: "equity" },
    { name: "Current Assets", nature: "asset" },
    { name: "Sundry Debtors", nature: "asset" },
    { name: "Sundry Creditors", nature: "liability" },
    { name: "Current Liabilities", nature: "liability" },
    { name: "Duties & Taxes", nature: "liability" },
    { name: "Sales Accounts", nature: "income" },
    { name: "Purchase Accounts", nature: "expense" },
    { name: "Indirect Expenses", nature: "expense" },
  ];

  const groupMap: Record<string, string> = {};
  for (const g of groups) {
    const created = await prisma.ledgerGroup.create({
      data: { companyId: company.id, name: g.name, nature: g.nature },
    });
    groupMap[g.name] = created.id;
  }

  async function ledger(
    name: string,
    groupName: string,
    opts: { gstRole?: string; isSystem?: boolean; openingDr?: number; openingCr?: number } = {}
  ) {
    return prisma.ledger.create({
      data: {
        companyId: company.id,
        groupId: groupMap[groupName],
        name,
        gstRole: opts.gstRole,
        isSystem: opts.isSystem ?? true,
        openingDr: d(opts.openingDr ?? 0),
        openingCr: d(opts.openingCr ?? 0),
      },
    });
  }

  await ledger("Capital", "Capital Account", { openingCr: 100000 });
  const cash = await ledger("Cash", "Current Assets", { openingDr: 70000 });
  const bank = await ledger("Bank", "Current Assets", { openingDr: 30000 });
  await ledger("Sales", "Sales Accounts", { gstRole: "sales" });
  await ledger("Output CGST", "Duties & Taxes", { gstRole: "output_cgst" });
  await ledger("Output SGST", "Duties & Taxes", { gstRole: "output_sgst" });
  await ledger("Output IGST", "Duties & Taxes", { gstRole: "output_igst" });
  await ledger("Input CGST", "Duties & Taxes", { gstRole: "input_cgst" });
  await ledger("Input SGST", "Duties & Taxes", { gstRole: "input_sgst" });
  await ledger("Input IGST", "Duties & Taxes", { gstRole: "input_igst" });
  await ledger("Purchase", "Purchase Accounts", { gstRole: "purchase" });

  const debtorLedger = await ledger("Retail Customer", "Sundry Debtors");
  const creditorLedger = await ledger("Local Supplier", "Sundry Creditors");

  const party = await prisma.party.create({
    data: {
      companyId: company.id,
      name: "Retail Customer",
      gstin: "27AADCR1234A1Z5",
      stateCode: "27",
      stateName: "Maharashtra",
      partyType: "customer",
      ledgerId: debtorLedger.id,
    },
  });

  const supplier = await prisma.party.create({
    data: {
      companyId: company.id,
      name: "Local Supplier",
      gstin: "27AADCS5678B1Z9",
      stateCode: "27",
      stateName: "Maharashtra",
      partyType: "supplier",
      ledgerId: creditorLedger.id,
    },
  });

  // Inter-state customer for IGST demos
  const igstDebtor = await ledger("Delhi Buyer", "Sundry Debtors");
  await prisma.party.create({
    data: {
      companyId: company.id,
      name: "Delhi Buyer",
      gstin: "07AABCD9999C1Z0",
      stateCode: "07",
      stateName: "Delhi",
      partyType: "customer",
      ledgerId: igstDebtor.id,
    },
  });

  await prisma.voucherType.createMany({
    data: [
      { companyId: company.id, name: "Sales", abbreviation: "Sls" },
      { companyId: company.id, name: "Purchase", abbreviation: "Pur" },
      { companyId: company.id, name: "Payment", abbreviation: "Pmt" },
      { companyId: company.id, name: "Receipt", abbreviation: "Rcpt" },
      { companyId: company.id, name: "Journal", abbreviation: "Jrnl" },
    ],
  });

  const godown = await prisma.godown.create({
    data: { companyId: company.id, name: "Main Godown", isPrimary: true },
  });

  const item = await prisma.item.create({
    data: {
      companyId: company.id,
      name: "Widget A",
      sku: "WGT-A",
      hsnSac: "847130",
      unit: "NOS",
      gstRatePct: d(18),
      salesPrice: d(1000),
      purchasePrice: d(700),
    },
  });

  const itemB = await prisma.item.create({
    data: {
      companyId: company.id,
      name: "Widget B",
      sku: "WGT-B",
      hsnSac: "847130",
      unit: "NOS",
      gstRatePct: d(18),
      salesPrice: d(500),
      purchasePrice: d(350),
    },
  });

  // Opening stock
  await prisma.stockEntry.createMany({
    data: [
      {
        companyId: company.id,
        itemId: item.id,
        godownId: godown.id,
        qtyIn: d(100),
        qtyOut: d(0),
        note: "Opening stock",
      },
      {
        companyId: company.id,
        itemId: itemB.id,
        godownId: godown.id,
        qtyIn: d(50),
        qtyOut: d(0),
        note: "Opening stock",
      },
    ],
  });

  // Pricing plans
  for (const p of PRICING_PLANS) {
    await prisma.pricingPlan.create({
      data: {
        code: p.code,
        name: p.name,
        priceInrMonthly: p.priceInrMonthly,
        description: p.description,
        featuresJson: JSON.stringify(p.features),
        sortOrder: p.sortOrder,
      },
    });
  }

  const growth = await prisma.pricingPlan.findUniqueOrThrow({
    where: { code: "growth" },
  });
  await prisma.companySubscription.create({
    data: {
      companyId: company.id,
      planId: growth.id,
      status: "trial",
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seed complete.");
  console.log("  Login: demo@tilla.app / demo1234");
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Customer: ${party.name} · Supplier: ${supplier.name}`);
  console.log(`  Item: ${item.name} · Cash: ${cash.name} · Bank: ${bank.name}`);
  console.log(`  Referral code: TILLA-DEMO`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
