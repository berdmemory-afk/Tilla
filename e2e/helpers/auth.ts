import { Page, expect, APIRequestContext } from "@playwright/test";

/** Maestro-style: launch login, fill, submit, assert dashboard */
export async function loginAs(page: Page, email: string, password = "demo1234") {
  await page.goto("/login");
  await expect(page.getByTestId("login-email")).toBeVisible();
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId("sidebar")).toBeVisible();
}

export async function apiSignIn(
  request: APIRequestContext,
  email: string,
  password = "demo1234"
) {
  const csrfRes = await request.get("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  return request.post("/api/auth/callback/credentials", {
    form: {
      csrfToken,
      email,
      password,
      redirect: "false",
      json: "true",
    },
  });
}
