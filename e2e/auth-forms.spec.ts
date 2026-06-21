import { expect, test, type Page } from "@playwright/test";

// Functional coverage of the public auth forms — behaviour, not just layout.
// These run on the backend-free public tier: the dummy Supabase URL has nothing
// listening, so a submit's network call fails closed and the form surfaces its
// error state (an `aria-live` alert + `aria-invalid` fields), which is exactly
// the path we want to exercise. No real account or backend required.

/** Make the Supabase auth endpoint reject with a terminal 400, so the form's
 *  error path runs deterministically — independent of the dummy backend's
 *  network-failure timing, which exceeded the assertion timeout in CI.
 *
 *  The app origin (localhost) and the Supabase URL (127.0.0.1) differ, so the
 *  auth POST is cross-origin. WebKit strictly enforces CORS on a fulfilled
 *  response (Chromium does not), so without these headers WebKit blocks the 400,
 *  supabase-js sees a *retryable* network error and backs off/retries past the
 *  timeout. Answering the preflight (204) and setting `Access-Control-Allow-*`
 *  on the 400 makes the rejection terminal (no retry) on every engine, so the
 *  alert renders at once. The error is a `role="alert"` under `<form>`; assert it
 *  there, since Next also renders a page-level
 *  `<div role="alert" id="__next-route-announcer__">` that makes a bare
 *  `getByRole("alert")` ambiguous. */
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "*",
  "access-control-allow-headers": "*",
};

async function rejectAuth(page: Page, body: Record<string, unknown>): Promise<void> {
  await page.route("**/auth/v1/**", (route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    return route.fulfill({
      status: 400,
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  });
}

test.describe("signup form", () => {
  test("labels its fields and sets paste-friendly autocomplete (accessibility)", async ({
    page,
  }) => {
    await page.goto("/signup");

    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("autocomplete", "email");
    // new-password (not a paste-blocked field) — WCAG 1.3.5 / 3.3.8.
    await expect(password).toHaveAttribute("autocomplete", "new-password");
    await expect(password).toHaveAttribute("minlength", "6");

    // The field accepts (pasted-style) input — nothing strips or blocks it.
    await password.fill("a-pasted-passphrase");
    await expect(password).toHaveValue("a-pasted-passphrase");
  });

  test("blocks submission of an empty form via native validation", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create Account" }).click();
    // Required fields keep the browser on the page (no success panel appears).
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText("Check your email to confirm")).toHaveCount(0);
  });

  test("surfaces an accessible error when sign-up is rejected", async ({ page }) => {
    await rejectAuth(page, { code: 400, error_code: "weak_password", msg: "boom" });
    await page.goto("/signup");
    await page.getByLabel("Email").fill("beyonder@tingen.city");
    await page.getByLabel("Password").fill("klein-moretti");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator("form").getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("login form", () => {
  test("surfaces an accessible error on a failed sign-in", async ({ page }) => {
    await rejectAuth(page, {
      code: 400,
      error_code: "invalid_credentials",
      msg: "Invalid login credentials",
    });
    await page.goto("/login");
    await page.getByLabel("Email").fill("beyonder@tingen.city");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.locator("form").getByRole("alert")).toBeVisible();
    await expect(page.getByLabel("Password")).toHaveAttribute("aria-invalid", "true");
    // A failed sign-in never leaves the login page.
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("uses current-password autocomplete on the password field", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });
});
