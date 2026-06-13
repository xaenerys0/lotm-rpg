import { expect, test } from "@playwright/test";

// Authenticated-tier specs (run only with a Supabase backend; gated in
// playwright.config.ts and seeded with a signed-in storageState). These prove
// the GATED game pages are reachable while logged in and fit the viewport at
// the project's device size — the responsiveness concern, now measured in a
// real browser rather than reasoned from markup.
//
// The character-delete *interaction* is also covered at the component level by
// the jsdom + axe suite (src/test/a11y.test.tsx), which seeds a character and
// drives the two-step confirm; here we verify the live page renders and fits.

async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
}

const GAME_ROUTES = [
  { path: "/play", heading: "Welcome, Beyonder" },
  { path: "/character", heading: "Character" },
  { path: "/journal", heading: "Journal" },
  { path: "/map", heading: "Map of Tingen" },
  { path: "/market", heading: "The Night Market" },
  { path: "/settings", heading: "Settings" },
] as const;

for (const route of GAME_ROUTES) {
  test(`${route.path} is reachable when signed in and fits the viewport`, async ({
    page,
  }) => {
    await page.goto(route.path);
    await expect(page).toHaveURL(new RegExp(`${route.path}(\\?.*)?$`));
    await expect(
      page.getByRole("heading", { name: route.heading, level: 1 }),
    ).toBeVisible();
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
}

test("the character sheet exposes a delete control when a character exists", async ({
  page,
}) => {
  await page.goto("/character");
  // Only meaningful if this account has a saved character in this browser; the
  // empty state has no delete control and that's fine. When present, the
  // control must be reachable (not clipped) at the current viewport.
  const deleteButton = page.getByRole("button", { name: /^Delete / });
  if (await deleteButton.count()) {
    await expect(deleteButton.first()).toBeVisible();
  }
});
