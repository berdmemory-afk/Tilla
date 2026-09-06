import { test, expect } from "@playwright/test";
import { apiSignIn } from "../helpers/auth";

/** Security smoke (ship gate): 401 unauth; CA 403 write; no live PG */
test.describe("security smoke", () => {
  test("unauthenticated API 401", async ({ request }) => {
    expect((await request.get("/api/vouchers/sales")).status()).toBe(401);
  });

  test("ca_viewer cannot post sales", async ({ request }) => {
    await apiSignIn(request, "ca@tilla.app");
    const res = await request.post("/api/vouchers/sales", {
      data: {
        partyId: "x",
        date: "2025-09-01",
        isIntraState: true,
        items: [{ itemId: "x", quantity: 1, rate: 100, gstRatePct: 18 }],
      },
    });
    expect(res.status()).toBe(403);
  });

  test("checkout remains stub (no live PG)", async ({ request }) => {
    await apiSignIn(request, "demo@tilla.app");
    const res = await request.post("/api/checkout", { data: { planCode: "starter" } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.checkout.provider).toBe("stub");
    expect(String(body.checkout.message || "")).toMatch(/not configured|stub/i);
  });
});
