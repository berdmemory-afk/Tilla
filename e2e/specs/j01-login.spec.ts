import { test, expect } from "@playwright/test";
import { loginAs, apiSignIn } from "../helpers/auth";

/**
 * J1 (E1) — demo login to dashboard + session
 * Maestro steps:
 * - launch /login
 * - enter demo credentials
 * - assert dashboard + active company session
 * - assert unauth redirect
 */
test.describe("J1 login + session", () => {
  test("J1 demo login reaches dashboard with Acme session", async ({ page }) => {
    await loginAs(page, "demo@tilla.app");
    await expect(page.getByRole("heading", { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByTestId("active-company")).toContainText("Acme Traders");
    await expect(page.getByTestId("user-email")).toContainText("demo@tilla.app");
    await expect(page.getByTestId("active-role")).toContainText("owner");
  });

  test("J1 unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
    await expect(page.getByTestId("login-email")).toBeVisible();
  });

  test("J1 session cookie enables authenticated API", async ({ request }) => {
    const sign = await apiSignIn(request, "demo@tilla.app");
    expect(sign.ok()).toBeTruthy();
    const res = await request.get("/api/vouchers/sales");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.vouchers)).toBeTruthy();
  });
});
