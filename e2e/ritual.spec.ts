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
// Faithful Sequence ≤5 advancement rituals (issue #209): the rite is begun by a
// single "Perform the rite" trigger and then matures naturally over play — it is
// NOT a per-step click list and NOT a fixed number of turns, and the climb is
// always the player's call. We seed a Fool at Seq 6 with the next potion (Seq 5,
// Marionettist) in hand and digested, so the climb cluster renders the
// RitualPerformancePanel + the always-available AdvancementPanel. (Beginning the
// rite fires a narrated turn that needs a provider, so this spec checks the
// surfaces, not the AI turn.)

// A Fool at Seq 6, advancement-ready into Seq 5 (Marionettist): every Seq 5
// prerequisite carried (so `potionPreparationPlan` reads allOwned + the formula
// secured) and the current potion fully digested. Parked in the choices phase so
// the climb cluster renders without an AI turn.
function readySession(id: string, ritualBegun = false): GameSession {
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
    // Optionally seed a rite already maturing to exercise the progress meter.
    ...(ritualBegun
      ? { ritualState: { pathwayId: 1, targetSeq: 5, fidelity: 0.5 } }
      : {}),
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

test("the rite is one trigger, not a per-step click list, and never gates the climb", async ({
  page,
}) => {
  await seed(page, readySession("e2e-ritual-perform"));

  // The pathway-specific rite renders with its canon heading + a single
  // "Perform the rite" trigger — no "Enact this step" list, no "Skip" button.
  await expect(
    page.getByRole("heading", { name: /Perform the rite to become a Marionettist/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Perform the rite$/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Enact this step/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Skip the rite/ })).toHaveCount(0);

  // The climb attempt is ALWAYS the player's call — offered alongside the rite,
  // never gated behind it (issue #209).
  await expect(
    page.getByRole("heading", { name: /The next rung: Sequence 5, Marionettist/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Prepare to advance/ })).toBeVisible();
});

test("a rite already under way shows its maturing-progress meter", async ({ page }) => {
  await seed(page, readySession("e2e-ritual-progress", true));

  // With a rite begun, the panel shows the fidelity progress meter (no begin
  // button), and the climb attempt remains available.
  await expect(
    page.getByRole("progressbar", { name: /Advancement ritual fidelity/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Perform the rite$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Prepare to advance/ })).toBeVisible();
});
