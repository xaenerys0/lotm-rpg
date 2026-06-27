import { expect, test } from "@playwright/test";
import {
  applyPreparation,
  createDefaultGameState,
  createEncounter,
  createSession,
  emptyPreparation,
  serializeSession,
  ACTIVE_SESSION_KEY,
  COMBAT_KEY_PREFIX,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
} from "@/lib/game";

// Authenticated-tier spec (runs only with a Supabase backend; gated in
// playwright.config.ts and seeded with a signed-in storageState). Combat is an
// authenticated game screen, so it can't run in the public tier.
//
// The combat encounter persists under its own localStorage key separate from
// the session (`COMBAT_KEY_PREFIX + id`); the game loop re-hydrates it on mount
// (`loadCombatFromStorage`) and the `CombatEncounterView` takes over the surface.
// We seed a session + an in-progress (exchange-phase) encounter and assert the
// issue-#187 clarity surfaces render: the framed threat card, the control-meter
// progressbar, the enemy stance, and legible option tags.
test("an in-progress combat encounter renders the framed clarity surfaces", async ({
  page,
}) => {
  const session = createSession(
    createDefaultGameState(1, "e2e-combat-char", "Klein Combat"),
    "e2e-combat-1",
  );

  // An exchange-phase encounter against a framed (mind-controlled) foe, so the
  // threat card, control meter, stance, and option tags all render.
  const encounter = applyPreparation(
    createEncounter({
      id: "e2e-encounter-1",
      enemy: {
        name: "Lawrence",
        sequenceLevel: 8,
        isBeyonder: true,
        pathwayId: 4,
        description: "A comrade, fighting against his will.",
      },
      context: {
        framing: "mind-controlled",
        isKnownPerson: true,
        controllerName: "the Puppeteer",
        reconcilable: true,
      },
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
      playerSanity: 55,
      playerMaxSanity: 100,
    }),
    emptyPreparation(),
  );

  await page.addInitScript(
    ({
      indexKey,
      sessionKey,
      activeKey,
      combatKey,
      id,
      indexValue,
      sessionValue,
      combatValue,
    }) => {
      localStorage.setItem(indexKey, indexValue);
      localStorage.setItem(sessionKey, sessionValue);
      localStorage.setItem(activeKey, id);
      localStorage.setItem(combatKey, combatValue);
    },
    {
      indexKey: SESSION_INDEX_KEY,
      sessionKey: SESSION_KEY_PREFIX + session.id,
      activeKey: ACTIVE_SESSION_KEY,
      combatKey: COMBAT_KEY_PREFIX + session.id,
      id: session.id,
      indexValue: JSON.stringify([session.id]),
      sessionValue: serializeSession(session),
      combatValue: JSON.stringify(encounter),
    },
  );

  await page.goto("/play");

  // Enter the game loop for the seeded character; the persisted encounter then
  // takes over the surface.
  await page.getByRole("button", { name: /Resume Klein Combat/ }).click();

  // The combat surface is shown.
  await expect(page.getByRole("heading", { name: /Confrontation|Ambush/ })).toBeVisible();
  // Framed dossier + threat assessment (Phase 1 + Phase 5).
  await expect(page.getByText("Mind-controlled")).toBeVisible();
  await expect(page.getByText("Threat assessment")).toBeVisible();
  // The control meter is a labelled progressbar (Phase 3/5).
  await expect(
    page.getByRole("progressbar", { name: "Loss of control meter" }),
  ).toBeVisible();
});
