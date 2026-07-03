import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

// The shared real-browser axe harness (issue #197 follow-up to the seed.ts
// fixture pattern): one copy of the WCAG tag list, the injection, and the
// violation-summary format, so the public (a11y.spec.ts) and authenticated
// (a11y-authenticated.spec.ts) passes can't drift apart.
//
// axe-core is already a dependency (used by the jsdom suite), so no new
// package is needed: its bundle is read lazily (once per process, on first
// use) and evaluated in the page. `page.evaluate` runs via the debugger,
// which is not subject to the app's strict CSP, so the nonce/strict-dynamic
// policy doesn't block the injection. require.resolve works because
// Playwright loads specs as CJS.
let axeSource: string | null = null;

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

/**
 * Inject axe into the current page, run the WCAG A/AA pass — `color-contrast`
 * included, which the jsdom suite must disable — and assert no violations.
 */
export async function expectNoAxeViolations(page: Page): Promise<void> {
  axeSource ??= readFileSync(require.resolve("axe-core"), "utf8");
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
}
