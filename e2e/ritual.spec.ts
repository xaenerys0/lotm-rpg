import { expect, test } from "@playwright/test";
import { getSequence } from "@/lib/rules";
import {
  createDefaultGameState,
  createSession,
  serializeSession,
  ACTIVE_SESSION_KEY,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  type GameSession,
} from "@/lib/game";

// Authenticated-tier spec (runs only with a Supabase backend; gated in
// playwright.config.ts and seeded with a signed-in storageState). The game loop
// is an authenticated screen, so it can't run in the public tier.
//
// Faithful Sequence ≤5 advancement rituals (issue #209): the rite is ONE trigger
// that spans turns, not a per-step click list. We seed a Fool at Seq 6 with the
// next potion (Seq 5, Marionettist) fully in hand and digested, so the climb
// cluster renders the RitualPerformancePanel. We assert: the single "Perform the
// rite" / "Skip the rite" surface shows (no per-step "Enact this step" buttons),
// the climb attempt waits on the rite, beginning it shows a progressbar, and
// skipping it unlocks the climb attempt. No live AI call is involved.

// A Fool at Seq 6, advancement-ready into Seq 5 (Marionettist): every Seq 5
// prerequisite carried (so `potionPreparationPlan` reads allOwned + the formula
// secured) and the current potion fully digested. Parked in the choices phase so
// the climb cluster renders without an AI turn.
function readySession(id: string): GameSession {
  const prereqs = getSequence(1, 5)?.prerequisiteItems ?? [];
  const base = createSession(
    {
      ...createDefaultGameState(1, `${id}-char`, "Klein Rite"),
      sequenceLevel: 6,
      inventory: [...prereqs],
      digestion: { pathwayId: 1, sequenceLevel: 6, progress: 100, complete: true },
    },
    id,
  );
  return {
    ...base,
    phase: "choices",
    turnCount: 1,
    currentNarrative: "The potion is brewed. The rite remains.",
    currentChoices: [{ id: "c1", text: "Steady yourself", type: "action" }],
  };
}

async function seed(page: import("@playwright/test").Page, session: GameSession) {
  await page.addInitScript(
    ({ indexKey, sessionKey, activeKey, id, indexValue, sessionValue }) => {
      localStorage.setItem(indexKey, indexValue);
      localStorage.setItem(sessionKey, sessionValue);
      localStorage.setItem(activeKey, id);
    },
    {
      indexKey: SESSION_INDEX_KEY,
      sessionKey: SESSION_KEY_PREFIX + session.id,
      activeKey: ACTIVE_SESSION_KEY,
      id: session.id,
      indexValue: JSON.stringify([session.id]),
      sessionValue: serializeSession(session),
    },
  );
  await page.goto("/play");
  await page.getByRole("button", { name: /Resume Klein Rite/ }).click();
}

test("the rite is one trigger (Perform / Skip), not a per-step click list", async ({
  page,
}) => {
  await seed(page, readySession("e2e-ritual-perform"));

  // The pathway-specific rite renders with its canon heading + a single
  // "Perform the rite" trigger and a "Skip the rite" hatch — no "Enact this step".
  await expect(
    page.getByRole("heading", { name: /Perform the rite to become a Marionettist/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Perform the rite$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Skip the rite/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enact this step/ })).toHaveCount(0);

  // The climb attempt waits on the rite — it is not offered until the rite is
  // performed or deliberately forgone.
  await expect(page.getByRole("button", { name: /Prepare to advance/ })).toHaveCount(0);

  // Beginning the rite shows its progress meter (it then plays out over turns).
  await page.getByRole("button", { name: /^Perform the rite$/ }).click();
  await expect(
    page.getByRole("progressbar", { name: /Advancement ritual progress/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Skip the rite/ })).toBeVisible();
});

test("skipping the rite unlocks the climb attempt", async ({ page }) => {
  await seed(page, readySession("e2e-ritual-skip"));

  await page
    .getByRole("button", { name: /Skip the rite/ })
    .first()
    .click();

  // The rite panel resolves and the advancement attempt is now offered.
  await expect(
    page.getByRole("heading", { name: /The next rung: Sequence 5, Marionettist/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Prepare to advance/ })).toBeVisible();
});
