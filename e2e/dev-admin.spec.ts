import { expect, test } from "@playwright/test";

// Authenticated-tier spec (runs only with a Supabase backend). The dev/admin
// test-utilities surface is gated on `profiles.is_admin`, which a freshly
// signed-up user does NOT have (the column defaults false and a trigger blocks
// client self-escalation). So the default signed-in e2e user is a NON-admin —
// the exact case that must be denied: the page 404s and the sidebar offers no
// link to it. (The panel's own rendering + the isAdmin allow path are covered by
// the jsdom axe suite and the Vitest unit tests.)

test("a non-admin signed-in user is denied the dev admin page (404)", async ({
  page,
}) => {
  const response = await page.goto("/dev/admin");
  expect(response?.status()).toBe(404);
});

test("the sidebar offers no Dev Admin link to a non-admin", async ({ page }) => {
  await page.goto("/play");
  await expect(
    page.getByRole("heading", { name: "Welcome, Beyonder", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Dev Admin" })).toHaveCount(0);
});
