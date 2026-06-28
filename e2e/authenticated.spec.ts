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
  { path: "/map", heading: "The Gazetteer" },
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

test("the settings narration-length control selects and persists a verbosity preset", async ({
  page,
}) => {
  await page.goto("/settings");

  const group = page.getByRole("radiogroup", { name: "Narration length" });
  await expect(group).toBeVisible();

  const standard = group.getByRole("radio", { name: "Standard" });
  const concise = group.getByRole("radio", { name: "Concise" });
  // Standard is the default.
  await expect(standard).toHaveAttribute("aria-checked", "true");

  // Selecting Concise checks it and unchecks Standard.
  await concise.click();
  await expect(concise).toHaveAttribute("aria-checked", "true");
  await expect(standard).toHaveAttribute("aria-checked", "false");

  // The choice persists across a reload (localStorage-backed).
  await page.reload();
  await expect(
    page
      .getByRole("radiogroup", { name: "Narration length" })
      .getByRole("radio", { name: "Concise" }),
  ).toHaveAttribute("aria-checked", "true");
});

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

test("a Beyonder climbing into the Saint tier can consecrate an anchor", async ({
  page,
}) => {
  // The Anchors section appears when the NEXT advancement leads into the Saint
  // tier or deeper (target Seq <= 4). Seed a Sequence-5 Beyonder (about to become
  // a Seq-4 Saint) — the exact case that was previously hidden — then consecrate
  // an object anchor and confirm its support clears the requirement (object
  // weight 0.5 × full integrity 100 = 50 >= the 40 the climb needs).
  const gameState = {
    ...createDefaultGameState(1, "e2e-saint", "Klein Climber"),
    sequenceLevel: 5,
  };
  const session = createSession(gameState, "e2e-anchor-1");
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

  const anchors = page.getByRole("region", { name: "Anchors" });
  await expect(anchors).toBeVisible();
  // Before consecrating anything, support falls short of the requirement.
  await expect(
    anchors.getByText(/fall short of what the climb to .+ demands/),
  ).toBeVisible();

  await anchors.getByRole("button", { name: "Consecrate an anchor" }).click();
  await anchors.getByLabel("Its name").fill("Mother's pocket watch");
  await anchors.getByRole("button", { name: "Consecrate the anchor" }).click();

  // The anchor is recorded and its support now meets the climb requirement.
  await expect(anchors.getByText("Mother's pocket watch")).toBeVisible();
  await expect(anchors.getByText(/enough to hold the shape of /)).toBeVisible();
});
