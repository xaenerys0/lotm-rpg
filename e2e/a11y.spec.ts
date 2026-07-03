import { test } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

// Real-browser accessibility. The jsdom axe suite (src/test/a11y.test.tsx) can't
// compute layout or colour, so it disables `color-contrast` (see
// docs/rules/accessibility.md). Here axe runs in a real engine — re-enabling
// contrast and catching focus-order/visibility issues jsdom misses. The
// injection/run/assert harness is shared with the authenticated pass in
// e2e/axe.ts.

const PUBLIC_PAGES = ["/login", "/signup"] as const;

for (const path of PUBLIC_PAGES) {
  test(`${path} has no WCAG A/AA violations in a real browser (incl. contrast)`, async ({
    page,
  }) => {
    await page.goto(path);
    await expectNoAxeViolations(page);
  });
}
