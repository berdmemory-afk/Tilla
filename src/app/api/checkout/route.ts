import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlanByCode } from "@/lib/pricing/plans";
import { getPaymentProvider } from "@/lib/payments/provider";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";

/**
 * Checkout stub — does NOT charge. Creates/updates subscription as checkout_stub.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role === "ca_viewer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { planCode } = await req.json();
  const planCfg = getPlanByCode(planCode);
  if (!planCfg) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const plan = await prisma.pricingPlan.findUnique({ where: { code: planCfg.code } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not seeded" }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const checkout = await provider.createCheckoutSession({
    companyId: session.user.companyId,
    planCode: plan.code,
    amountInr: plan.priceInrMonthly,
    customerEmail: session.user.email ?? undefined,
  });

  await prisma.companySubscription.upsert({
    where: { companyId: session.user.companyId },
    create: {
      companyId: session.user.companyId,
      planId: plan.id,
      status: "checkout_stub",
      paymentProviderRef: checkout.providerRef,
    },
    update: {
      planId: plan.id,
      status: "checkout_stub",
      paymentProviderRef: checkout.providerRef,
    },
  });

  await writeAudit({
    companyId: session.user.companyId,
    userId: session.user.id,
    action: "checkout.stub",
    entityType: "CompanySubscription",
    summary: `Checkout stub for plan ${plan.code} (no live PG charge)`,
    meta: { planCode: plan.code, providerRef: checkout.providerRef },
  });

  return NextResponse.json({ checkout, plan: planCfg });
}
