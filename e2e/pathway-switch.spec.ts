import { expect, test } from "@playwright/test";
import { getSequence } from "@/lib/rules";
import {
  consecrateAnchor,
  createDefaultGameState,
  createSession,
  emptyAnchorState,
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
// Pathway switching (issue #211): a switch is an advancement along a neighbouring
// line — you drink the neighbour's NEXT-rung potion. We seed a Visionary (2) at
// Sequence 5, fully digested, carrying the neighbouring Sun (3) Sequence-4 potion
// (the next rung) with anchors held, so the climb cluster's PathwaySwitchPanel
// offers the exchange into Sun, Sequence 4. (Confirming the exchange fires a
// narrated turn that needs a provider, so this spec checks the surfaces.)

function switchReadySession(id: string): GameSession {
  const sunPotion = getSequence(3, 4)?.prerequisiteItems ?? [];
  let anchors = emptyAnchorState();
  anchors = consecrateAnchor(anchors, { kind: "congregation", name: "The Flock" });
  anchors = consecrateAnchor(anchors, { kind: "place", name: "A shrine" });
  anchors = consecrateAnchor(anchors, { kind: "object", name: "A relic" });
  const base = createSession(
    {
      ...createDefaultGameState(2, `${id}-char`, "Klein Switch"),
      sequenceLevel: 5,
      sanity: 100,
      maxSanity: 100,
      inventory: [...sunPotion],
      digestion: { pathwayId: 2, sequenceLevel: 5, progress: 100, complete: true },
    },
    id,
  );
  return {
    ...base,
    anchorState: anchors,
    phase: "choices",
    turnCount: 1,
    currentNarrative: "Two roads open before you: climb, or exchange.",
    currentChoices: [{ id: "c1", text: "Weigh the pathways", type: "action" }],
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
  await page.getByRole("button", { name: /Resume Klein Switch/ }).click();
}

test("the switch panel offers a ready neighbouring exchange and a gated poison option", async ({
  page,
}) => {
  await seed(page, switchReadySession("e2e-switch-ready"));

  // The exchange panel is a collapsed, advanced disclosure in the climb cluster —
  // switching is a rare choice, so it stays out of the way until opened.
  const switchSummary = page.getByText("Exchange your pathway", { exact: false });
  await expect(switchSummary).toBeVisible();
  await switchSummary.click();

  // Sun is the prepared neighbour: its card shows, and — every requirement met —
  // the two-step "Prepare to exchange" affordance is offered.
  await expect(
    page.getByRole("button", { name: /Prepare to exchange into Sun/ }),
  ).toBeVisible();

  // The unrelated (poison) options live behind an explicit disclosure, not a
  // one-click hazard.
  await expect(page.getByText(/Drink an unrelated potion \(poison\)/)).toBeVisible();

  // Arming the exchange reveals the confirm/cancel step (no immediate commit).
  await page.getByRole("button", { name: /Prepare to exchange into Sun/ }).click();
  await expect(page.getByRole("button", { name: /Confirm the exchange/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Not yet$/ })).toBeVisible();
});
