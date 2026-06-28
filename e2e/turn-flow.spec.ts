import { expect, test } from "@playwright/test";
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
// Action-assumption fix: a normal player turn resolves the action AND presents
// the resolution's OWN choices inline — one narration per action. There is NO
// separate "Continue → another forward-looking narration" beat that could assume
// actions the player never chose. We seed a session parked in the `choices` phase
// with a `lastResolution` (a just-resolved turn), so the merged screen renders
// WITHOUT any live AI call, and assert the outcome recap + the next choices both
// show and that there is no Continue step.
const OUTCOME =
  "You ease the drawer shut. The clerk has not looked up, and the ledger sits back in its place.";

const NEXT_CHOICES = [
  { id: "c1", text: "Slip out before he turns around", type: "action" as const },
  { id: "c2", text: "Ask the clerk about the missing pages", type: "dialogue" as const },
];

test("a resolved turn presents its next choices inline, with no Continue/forward-narration step", async ({
  page,
}) => {
  const base = createSession(
    createDefaultGameState(1, "e2e-turnflow-char", "Klein TurnFlow"),
    "e2e-turnflow-1",
  );

  // A normal turn that has just resolved: phase `choices`, the resolution kept in
  // `lastResolution` (so the recap renders) and its own choices presented as the
  // next decision. This is exactly the state PRESENT_NEXT_CHOICES produces.
  const session: GameSession = {
    ...base,
    phase: "choices",
    turnCount: 2,
    currentNarrative: OUTCOME,
    currentChoices: NEXT_CHOICES,
    lastResolution: {
      response: { narrative: OUTCOME, choices: NEXT_CHOICES },
      validation: { valid: true, violations: [] },
    },
  };

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
  await page.getByRole("button", { name: /Resume Klein TurnFlow/ }).click();

  // The resolution outcome recap renders (the "what just happened" beat).
  await expect(page.getByText(/ledger sits back in its place/)).toBeVisible();

  // Its OWN next choices render inline as the next decision point...
  await expect(
    page.getByRole("button", { name: /Slip out before he turns around/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Ask the clerk about the missing pages/ }),
  ).toBeVisible();

  // ...and there is NO "Continue" step — the merged single-narration screen does
  // not gate the next choices behind a button that would trigger a second,
  // forward-looking narration.
  await expect(page.getByRole("button", { name: /^Continue$/ })).toHaveCount(0);
});
