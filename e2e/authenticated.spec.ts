import { expect, test } from "@playwright/test";
import {
  createDefaultGameState,
  createSession,
  serializeSession,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
} from "@/lib/game";

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

test("the character sheet's delete control runs the two-step confirm", async ({
  page,
}) => {
  // Characters live in browser localStorage, not Supabase, so a freshly
  // signed-in session has none. Seed one before the app's scripts run so the
  // full sheet (and its delete danger zone) renders.
  const session = createSession(
    createDefaultGameState(1, "e2e-char", "Klein E2E"),
    "e2e-delete-1",
  );
  await page.addInitScript(
    ({ indexKey, sessionKey, indexValue, sessionValue }) => {
      localStorage.setItem(indexKey, indexValue);
      localStorage.setItem(sessionKey, sessionValue);
    },
    {
      indexKey: SESSION_INDEX_KEY,
      sessionKey: SESSION_KEY_PREFIX + session.id,
      indexValue: JSON.stringify([session.id]),
      sessionValue: serializeSession(session),
    },
  );

  await page.goto("/character");

  // Step 1: the delete control is present and reachable (not clipped).
  const deleteButton = page.getByRole("button", { name: "Delete Klein E2E" });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();

  // Step 2: the confirm appears, then deleting removes the sheet.
  await expect(page.getByText("Delete permanently?")).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText(/No Beyonder has been recorded yet/)).toBeVisible();
});
