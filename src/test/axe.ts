import { render } from "@testing-library/react";
import axe, { type RunOptions, type AxeResults, type Result } from "axe-core";
import { expect } from "vitest";
import type { ReactElement } from "react";

/**
 * Accessibility test helper (WCAG 2.2 AA).
 *
 * Renders a React element into the jsdom document and runs axe-core against it.
 * Tests using this helper must opt into the jsdom environment with a docblock:
 *
 *   // @vitest-environment jsdom
 *
 * Caveat: jsdom does not lay elements out or compute real colours, so axe's
 * `color-contrast` rule cannot run here — it is disabled below. Contrast is
 * guaranteed by the design tokens (see docs/rules/styling.md) and should be
 * spot-checked with a real-browser tool (axe DevTools / Lighthouse). What these
 * tests *do* cover is the structural layer: roles, names, labels, ARIA state,
 * and duplicate ids — the regressions most likely to slip back in when editing
 * markup.
 */

// Scope axe to the WCAG 2.0/2.1/2.2 level A + AA rule tags.
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const DEFAULT_OPTIONS: RunOptions = {
  runOnly: { type: "tag", values: WCAG_TAGS },
  // jsdom has no layout engine, so colour-contrast can't be evaluated reliably.
  rules: { "color-contrast": { enabled: false } },
};

function formatViolations(violations: Result[]): string {
  return violations
    .map((v) => {
      const targets = v.nodes.map((n) => `      - ${n.target.join(" ")}`).join("\n");
      return `  • [${v.id}] ${v.help} (${v.impact ?? "n/a"})\n    ${v.helpUrl}\n${targets}`;
    })
    .join("\n");
}

/** Render `ui`, run axe, and assert there are no accessibility violations. */
export async function expectNoAxeViolations(
  ui: ReactElement,
  options: RunOptions = DEFAULT_OPTIONS,
): Promise<void> {
  const { container, unmount } = render(ui);
  try {
    const results: AxeResults = await axe.run(container, options);
    if (results.violations.length > 0) {
      throw new Error(
        `Found ${results.violations.length} accessibility violation(s):\n` +
          formatViolations(results.violations),
      );
    }
    expect(results.violations).toHaveLength(0);
  } finally {
    unmount();
  }
}
