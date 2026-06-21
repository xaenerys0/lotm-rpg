import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Real-browser accessibility. The jsdom axe suite (src/test/a11y.test.tsx) can't
// compute layout or colour, so it disables `color-contrast` (see
// docs/rules/accessibility.md). Here axe runs in a real engine — re-enabling
// contrast and catching focus-order/visibility issues jsdom misses.
//
// axe-core is already a dependency (used by the jsdom suite), so no new package
// is needed: we read its bundle and evaluate it in the page. `page.evaluate`
// runs via the debugger, which is not subject to the app's strict CSP, so the
// nonce/strict-dynamic policy doesn't block the injection.

// axe-core is loaded as a string and evaluated in the page (CSP-safe via
// page.evaluate). require.resolve works because Playwright loads specs as CJS.
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

const PUBLIC_PAGES = ["/login", "/signup"] as const;

for (const path of PUBLIC_PAGES) {
  test(`${path} has no WCAG A/AA violations in a real browser (incl. contrast)`, async ({
    page,
  }) => {
    await page.goto(path);
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
}
