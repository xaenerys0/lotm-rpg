import { expect, test } from "@playwright/test";

// Functional coverage of the public auth forms — behaviour, not just layout.
// These run on the backend-free public tier: the dummy Supabase URL has nothing
// listening, so a submit's network call fails closed and the form surfaces its
// error state (an `aria-live` alert + `aria-invalid` fields), which is exactly
// the path we want to exercise. No real account or backend required.

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

  test("surfaces an accessible error when the backend is unreachable", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.getByLabel("Email").fill("beyonder@tingen.city");
    await page.getByLabel("Password").fill("klein-moretti");
    await page.getByRole("button", { name: "Create Account" }).click();

    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  });
});

test.describe("login form", () => {
  test("surfaces an accessible error on a failed sign-in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("beyonder@tingen.city");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
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
