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

  // The sheet is tabbed (history-context sheet UI): the delete danger zone lives
  // on the "Holdings" tab.
  await page.getByRole("tab", { name: "Holdings" }).click();

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

  // Anchors live on the "Powers" tab (history-context sheet UI).
  await page.getByRole("tab", { name: "Powers" }).click();

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

test("the character sheet tabs switch sections and the Codex tab browses entities", async ({
  page,
}) => {
  // Seed a save with a populated Codex (history-context Codex) so the new tab
  // renders its entity cards and filters. The Codex registry serializes inside
  // the session blob, so it round-trips through the same seed path.
  const session = {
    ...createSession(createDefaultGameState(1, "e2e-cx", "Klein Codex"), "e2e-codex-1"),
    codexState: {
      entities: [
        {
          id: "cx-1",
          kind: "person" as const,
          name: "Audrey Hall",
          status: "a steadfast ally in Backlund",
          importance: "pivotal" as const,
          firstSeenTurn: 3,
          lastSeenTurn: 42,
        },
        {
          id: "cx-2",
          kind: "location" as const,
          name: "The Tarot Club",
          status: "your secret circle's meeting ground",
          importance: "standard" as const,
          firstSeenTurn: 5,
          lastSeenTurn: 40,
        },
      ],
    },
  };
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

  // The Overview tab is selected by default; the Codex panel is hidden.
  const tablist = page.getByRole("tablist", { name: "Character sheet sections" });
  await expect(tablist).toBeVisible();
  const codexTab = tablist.getByRole("tab", { name: /Codex/ });
  await expect(codexTab).toHaveAttribute("aria-selected", "false");

  // Activating the Codex tab reveals its registry of entities.
  await codexTab.click();
  await expect(codexTab).toHaveAttribute("aria-selected", "true");
  const codex = page.getByRole("region", { name: "Codex" });
  await expect(codex.getByText("Audrey Hall")).toBeVisible();
  await expect(codex.getByText("The Tarot Club")).toBeVisible();

  // The search filters the registry by name.
  await codex.getByLabel("Search the Codex").fill("Audrey");
  await expect(codex.getByText("Audrey Hall")).toBeVisible();
  await expect(codex.getByText("The Tarot Club")).toHaveCount(0);

  // Curation: pin the standard entity (The Tarot Club) and confirm it sticks.
  await codex.getByLabel("Search the Codex").fill("Tarot");
  const pin = codex.getByRole("button", { name: /Pin The Tarot Club as pivotal/ });
  await pin.click();
  await expect(
    codex.getByRole("button", { name: /Unpin The Tarot Club/ }),
  ).toHaveAttribute("aria-pressed", "true");

  // Manual add: a character the AI rebuild might miss can be added by hand.
  await codex.getByLabel("Search the Codex").fill("");
  await codex.getByRole("button", { name: /Add entry/ }).click();
  await codex.getByLabel("Name").fill("Fors");
  await codex.getByLabel("Status").fill("a guarded ally");
  await codex.getByRole("button", { name: "Add to Codex" }).click();
  await codex.getByLabel("Search the Codex").fill("Fors");
  await expect(codex.getByText("Fors", { exact: true })).toBeVisible();
});
