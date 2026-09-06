import { getPrisma, getAcmeCompanyId } from "./helpers/db";

async function globalSetup() {
  const prisma = getPrisma();
  try {
    const companyId = await getAcmeCompanyId(prisma);
    await prisma.company.update({
      where: { id: companyId },
      data: { booksLocked: false, booksLockedAt: null },
    });
  } catch (e) {
    console.warn("globalSetup unlock skipped", e);
  } finally {
    await prisma.$disconnect();
  }
}

export default globalSetup;
