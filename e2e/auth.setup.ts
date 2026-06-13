import { expect, test as setup } from "@playwright/test";

// Authenticated-tier setup (runs only when E2E_SUPABASE_URL is configured —
// see playwright.config.ts). Logs in once through the real UI and saves the
// session (cookies + localStorage) so the game-page specs start signed in.
// Requires a pre-existing, email-confirmed test account:
//   E2E_USER_EMAIL, E2E_USER_PASSWORD
const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Authenticated e2e tier needs E2E_USER_EMAIL and E2E_USER_PASSWORD " +
        "(a confirmed Supabase test account). See e2e/README.md.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();

  // A successful sign-in routes to /play.
  await page.waitForURL(/\/play(\?.*)?$/);
  await expect(
    page.getByRole("heading", { name: "Welcome, Beyonder", level: 1 }),
  ).toBeVisible();

  await page.context().storageState({ path: authFile });
});
