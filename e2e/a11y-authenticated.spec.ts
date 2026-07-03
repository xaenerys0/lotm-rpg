import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createDefaultGameState, createSession, type GameSession } from "@/lib/game";
import { seedActiveSession } from "./seed";

// Authenticated-tier real-browser accessibility (issue #197). The jsdom axe
// suite disables `color-contrast` (no layout/colour engine) and the public
// a11y spec can't reach the game loop, so the always-shown normal-turn
// ResolutionRecap — which renders meaningful text at reduced foreground
// opacity (`text-foreground/70`–`/90`) — had no contrast guard. We seed a
// `choices`-phase session with a `lastResolution` exercising every recap
// surface (outcome narrative, world-change reasons, a discovered item, a
// blocked-reagent story lead, the vague sanity line) and run axe with the
// WCAG AA tags — `color-contrast` included — against the merged screen.

const axeSource = readFileSync(require.resolve("axe-core"), "utf8");

const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

interface AxeNode {
  target: string[];
}
interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
}
interface AxeResults {
  violations: AxeViolation[];
}

const OUTCOME =
  "You ease the ledger back into the drawer. Behind you, the gas lamp gutters once — and holds.";

const NEXT_CHOICES = [
  { id: "c1", text: "Slip out through the reading room", type: "action" as const },
  { id: "c2", text: "Question the night clerk", type: "dialogue" as const },
];

// A just-resolved normal turn (the state PRESENT_NEXT_CHOICES produces), with a
// resolution rich enough to render every recap text style the contrast audit
// flagged: the /90 narrative, a /70 world-change reason, a /80 blocked-reagent
// lead, a discovered item row, and the /70 vague sanity line (the sanity meter
// is hidden by default, so the qualitative descriptor shows).
function recapSession(id: string): GameSession {
  const base = createSession(createDefaultGameState(1, `${id}-char`, "Klein Recap"), id);
  return {
    ...base,
    phase: "choices",
    turnCount: 2,
    lastResolutionTurn: 1,
    currentNarrative: null,
    currentChoices: NEXT_CHOICES,
    lastResolution: {
      response: {
        narrative: OUTCOME,
        choices: NEXT_CHOICES,
        worldStateChanges: [
          {
            field: "location",
            oldValue: "Tingen City",
            newValue: "Tingen City — Zouteland Street",
            reason: "You slipped down Zouteland Street ahead of the patrol.",
          },
        ],
        itemsDiscovered: [
          {
            name: "A brass pocketwatch",
            description: "Still ticking, though its owner is not.",
            category: "mundane",
          },
          {
            // A reagent the AI may not mint — rendered as a story lead (the
            // `text-foreground/80` line the audit flagged).
            name: "Formula of the Clown potion",
            description: "A page of the Seer pathway's next recipe.",
            category: "potion-formula",
          },
        ],
        sanityImpact: -2,
      },
      validation: { valid: true, violations: [] },
    },
  };
}

test("the merged recap screen has no WCAG A/AA violations in a real browser (incl. contrast)", async ({
  page,
}) => {
  await seedActiveSession(page, recapSession("e2e-a11y-recap"));
  await page.goto("/play");
  await page.getByRole("button", { name: /Resume Klein Recap/ }).click();

  // The recap surfaces under audit are all on screen before axe runs.
  await expect(page.getByText(/the gas lamp gutters once/)).toBeVisible();
  await expect(page.getByText(/ahead of the patrol/)).toBeVisible();
  await expect(page.getByText(/A brass pocketwatch/)).toBeVisible();
  await expect(page.getByText(/your mind frays a little/)).toBeVisible();

  await page.evaluate(axeSource);
  const results = (await page.evaluate(async (tags) => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
            options: { runOnly: { type: string; values: string[] } },
          ) => Promise<{ violations: unknown[] }>;
        };
      }
    ).axe;
    return axe.run(document, { runOnly: { type: "tag", values: tags } });
  }, WCAG_AA_TAGS)) as AxeResults;

  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} node(s)`,
  );
  expect(summary, summary.join("\n")).toEqual([]);
});
