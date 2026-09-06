import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function d(n: number) {
  return new Prisma.Decimal(n);
}

async function main() {
  console.log("Seeding Tilla demo data...");

  // Clean slate for idempotent local demo
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

  await ledger("Capital", "Capital Account", { openingCr: 50000 });
  const cash = await ledger("Cash", "Current Assets", { openingDr: 50000 });
  await ledger("Sales", "Sales Accounts", { gstRole: "sales" });
  await ledger("Output CGST", "Duties & Taxes", { gstRole: "output_cgst" });
  await ledger("Output SGST", "Duties & Taxes", { gstRole: "output_sgst" });
  await ledger("Output IGST", "Duties & Taxes", { gstRole: "output_igst" });
  await ledger("Input CGST", "Duties & Taxes", { gstRole: "input_cgst" });
  await ledger("Input SGST", "Duties & Taxes", { gstRole: "input_sgst" });
  await ledger("Input IGST", "Duties & Taxes", { gstRole: "input_igst" });
  await ledger("Purchase", "Purchase Accounts");

  const debtorLedger = await ledger("Retail Customer", "Sundry Debtors");

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

  await prisma.voucherType.createMany({
    data: [
      { companyId: company.id, name: "Sales", abbreviation: "Sls" },
      { companyId: company.id, name: "Purchase", abbreviation: "Pur" },
      { companyId: company.id, name: "Payment", abbreviation: "Pmt" },
      { companyId: company.id, name: "Receipt", abbreviation: "Rcpt" },
      { companyId: company.id, name: "Journal", abbreviation: "Jrnl" },
    ],
  });

  await prisma.godown.create({
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
    },
  });

  await prisma.item.create({
    data: {
      companyId: company.id,
      name: "Widget B",
      sku: "WGT-B",
      hsnSac: "847130",
      unit: "NOS",
      gstRatePct: d(18),
      salesPrice: d(500),
    },
  });

  console.log("Seed complete.");
  console.log("  Login: demo@tilla.app / demo1234");
  console.log(`  Company: ${company.name} (${company.id})`);
  console.log(`  Party: ${party.name} (${party.id})`);
  console.log(`  Item: ${item.name} (${item.id})`);
  console.log(`  Cash ledger: ${cash.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
