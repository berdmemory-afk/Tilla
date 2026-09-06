import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { PRICING_PLANS } from "../src/lib/pricing/plans";
import { postSalesVoucher } from "../src/lib/accounting/post-sales-voucher";
import { postPurchaseVoucher } from "../src/lib/accounting/post-purchase-voucher";

const prisma = new PrismaClient();

function d(n: number) {
  return new Prisma.Decimal(n);
}

async function seedCompanyBooks(opts: {
  name: string;
  legalName: string;
  gstin: string;
  stateCode: string;
  stateName: string;
  city: string;
  pincode: string;
  fyLabel?: string;
}) {
  const company = await prisma.company.create({
    data: {
      name: opts.name,
      legalName: opts.legalName,
      gstin: opts.gstin,
      stateCode: opts.stateCode,
      stateName: opts.stateName,
      addressLine1: "12 Demo Street",
      city: opts.city,
      pincode: opts.pincode,
      fyLabel: opts.fyLabel ?? "2025-26",
      financialYearStartMonth: 4,
      booksLocked: false,
    },
  });

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
    o: { gstRole?: string; openingDr?: number; openingCr?: number } = {}
  ) {
    return prisma.ledger.create({
      data: {
        companyId: company.id,
        groupId: groupMap[groupName],
        name,
        gstRole: o.gstRole,
        isSystem: true,
        openingDr: d(o.openingDr ?? 0),
        openingCr: d(o.openingCr ?? 0),
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
  const igstDebtor = await ledger("Delhi Buyer", "Sundry Debtors");

  const customer = await prisma.party.create({
    data: {
      companyId: company.id,
      name: "Retail Customer",
      gstin: `${opts.stateCode}AADCR1234A1Z5`.slice(0, 15),
      stateCode: opts.stateCode,
      stateName: opts.stateName,
      partyType: "customer",
      ledgerId: debtorLedger.id,
    },
  });
  const supplier = await prisma.party.create({
    data: {
      companyId: company.id,
      name: "Local Supplier",
      gstin: `${opts.stateCode}AADCS5678B1Z9`.slice(0, 15),
      stateCode: opts.stateCode,
      stateName: opts.stateName,
      partyType: "supplier",
      ledgerId: creditorLedger.id,
    },
  });
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
      { companyId: company.id, name: "Contra", abbreviation: "Cntr" },
      { companyId: company.id, name: "Credit Note", abbreviation: "CN" },
      { companyId: company.id, name: "Debit Note", abbreviation: "DN" },
    ],
  });

  const godown = await prisma.godown.create({
    data: { companyId: company.id, name: "Main Godown", isPrimary: true },
  });

  const itemA = await prisma.item.create({
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

  await prisma.stockEntry.createMany({
    data: [
      {
        companyId: company.id,
        itemId: itemA.id,
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

  return { company, customer, supplier, itemA, itemB, cash, bank };
}

async function main() {
  console.log("Seeding Tilla demo data (CA-coherent)...");

  await prisma.affiliateEarning.deleteMany();
  await prisma.affiliateReferral.deleteMany();
  await prisma.companySubscription.deleteMany();
  await prisma.pricingPlan.deleteMany();
  await prisma.companyInvite.deleteMany();
  await prisma.auditLog.deleteMany();
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

  const owner = await prisma.user.create({
    data: {
      name: "Demo Owner",
      email: "demo@tilla.app",
      passwordHash,
      referralCode: "TILLA-DEMO",
    },
  });
  const ca = await prisma.user.create({
    data: {
      name: "CA Viewer",
      email: "ca@tilla.app",
      passwordHash,
      referralCode: "TILLA-CA",
    },
  });
  const other = await prisma.user.create({
    data: {
      name: "Other Owner",
      email: "other@tilla.app",
      passwordHash,
      referralCode: "TILLA-OTHER",
    },
  });

  const acme = await seedCompanyBooks({
    name: "Acme Traders",
    legalName: "Acme Traders Private Limited",
    gstin: "27AABCT1332L1ZV",
    stateCode: "27",
    stateName: "Maharashtra",
    city: "Pune",
    pincode: "411001",
  });

  const beta = await seedCompanyBooks({
    name: "Beta Retail",
    legalName: "Beta Retail LLP",
    gstin: "27AABCB9999B1Z1",
    stateCode: "27",
    stateName: "Maharashtra",
    city: "Mumbai",
    pincode: "400001",
  });

  const secret = await seedCompanyBooks({
    name: "Secret Co",
    legalName: "Secret Co Private Limited",
    gstin: "29AABCS0000S1Z9",
    stateCode: "29",
    stateName: "Karnataka",
    city: "Bengaluru",
    pincode: "560001",
  });

  await prisma.membership.createMany({
    data: [
      { userId: owner.id, companyId: acme.company.id, role: "owner" },
      { userId: owner.id, companyId: beta.company.id, role: "owner" },
      { userId: ca.id, companyId: acme.company.id, role: "ca_viewer" },
      { userId: other.id, companyId: secret.company.id, role: "owner" },
    ],
  });

  await prisma.user.update({
    where: { id: owner.id },
    data: { activeCompanyId: acme.company.id },
  });
  await prisma.user.update({
    where: { id: ca.id },
    data: { activeCompanyId: acme.company.id },
  });
  await prisma.user.update({
    where: { id: other.id },
    data: { activeCompanyId: secret.company.id },
  });

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
      companyId: acme.company.id,
      planId: growth.id,
      status: "trial",
      currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // Sample vouchers for Acme (CA demo coherent)
  const saleDate = "2025-09-01";
  await postPurchaseVoucher({
    companyId: acme.company.id,
    partyId: acme.supplier.id,
    date: saleDate,
    isIntraState: true,
    placeOfSupply: "27",
    narration: "Opening purchase for demo",
    items: [
      { itemId: acme.itemA.id, quantity: 10, rate: 700, gstRatePct: 18 },
    ],
  });
  await postSalesVoucher({
    companyId: acme.company.id,
    partyId: acme.customer.id,
    date: saleDate,
    isIntraState: true,
    placeOfSupply: "27",
    narration: "Demo intra-state sale",
    items: [
      { itemId: acme.itemA.id, quantity: 2, rate: 1000, gstRatePct: 18 },
    ],
  });

  // Secret company has its own sale — must not leak to Acme session
  await postSalesVoucher({
    companyId: secret.company.id,
    partyId: secret.customer.id,
    date: saleDate,
    isIntraState: true,
    placeOfSupply: "29",
    narration: "SECRET voucher — tenancy isolation",
    items: [
      { itemId: secret.itemA.id, quantity: 1, rate: 9999, gstRatePct: 18 },
    ],
  });

  const referral = await prisma.affiliateReferral.create({
    data: {
      referrerId: owner.id,
      refereeEmail: "prospect@example.com",
      code: "TILLA-DEMO",
      status: "converted",
      refereeId: other.id,
    },
  });
  await prisma.affiliateEarning.createMany({
    data: [
      {
        referralId: referral.id,
        amountInr: d(599),
        planCode: "growth",
        status: "accrued",
        note: "First month commission (stub)",
      },
      {
        referralId: referral.id,
        amountInr: d(200),
        planCode: "growth",
        status: "paid_stub",
        note: "Prior stub payout (not live PG)",
      },
    ],
  });

  await prisma.companyInvite.create({
    data: {
      companyId: acme.company.id,
      email: "ca@tilla.app",
      role: "ca_viewer",
      token: "demo-ca-invite-token",
      status: "accepted",
      invitedById: owner.id,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        companyId: acme.company.id,
        userId: owner.id,
        action: "seed.complete",
        entityType: "Company",
        entityId: acme.company.id,
        summary: "Demo seed completed for Acme Traders FY 2025-26",
      },
      {
        companyId: acme.company.id,
        userId: owner.id,
        action: "voucher.posted",
        entityType: "Voucher",
        summary: "Seeded demo sales + purchase vouchers",
      },
    ],
  });

  console.log("Seed complete.");
  console.log("  Owner: demo@tilla.app / demo1234 (Acme Traders + Beta Retail)");
  console.log("  CA:    ca@tilla.app / demo1234 (Acme, ca_viewer)");
  console.log("  Other: other@tilla.app / demo1234 (Secret Co only)");
  console.log(`  Acme: ${acme.company.id}`);
  console.log(`  Secret (isolation): ${secret.company.id}`);
  console.log("  Referral code: TILLA-DEMO");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
