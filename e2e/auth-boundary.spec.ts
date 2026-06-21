import { expect, test } from "@playwright/test";

// The game pages are gated server-side: an unauthenticated visitor is bounced
// to /login (proxy middleware + the (game) layout's getUser check). This both
// documents the protected boundary and confirms why the authenticated UI
// (e.g. the character-delete flow) can only be exercised end-to-end against a
// real Supabase backend — see e2e/README.md.

const PROTECTED_ROUTES = [
  "/play",
  "/character",
  "/journal",
  "/map",
  "/glossary",
  "/market",
  "/profile",
  "/leaderboard",
  "/society",
  "/settings",
];

for (const path of PROTECTED_ROUTES) {
  test(`${path} redirects unauthenticated visitors to /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
    // The login page actually rendered — assert the form's submit control rather
    // than copy-sensitive heading text.
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
}
