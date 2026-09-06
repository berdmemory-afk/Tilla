import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRICING_PLANS } from "@/lib/pricing/plans";
import { PricingClient } from "./pricing-client";

export default async function PricingPage() {
  const session = await auth();
  const companyId = session!.user.companyId!;
  const sub = await prisma.companySubscription.findUnique({
    where: { companyId },
    include: { plan: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold">Pricing plans</h1>
      <p className="mt-1 text-sm text-slate-500">
        Starter ₹399 · Growth ₹599 · Business ₹1,199 — checkout stubbed (no live PG)
      </p>
      {sub ? (
        <p className="mt-3 text-sm">
          Current: <strong>{sub.plan.name}</strong> · status{" "}
          <code>{sub.status}</code>
          {sub.paymentProviderRef ? (
            <>
              {" "}
              · ref <code>{sub.paymentProviderRef}</code>
            </>
          ) : null}
        </p>
      ) : null}
      <div className="mt-6">
        <PricingClient
          plans={PRICING_PLANS.map((p) => ({
            code: p.code,
            name: p.name,
            priceInrMonthly: p.priceInrMonthly,
            description: p.description,
            features: p.features,
          }))}
          currentPlanCode={sub?.plan.code}
        />
      </div>
    </div>
  );
}
