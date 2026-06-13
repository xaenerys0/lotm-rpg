import { expect, test } from "@playwright/test";

// Responsiveness regression tests. The core assertion is that a page never
// forces horizontal scrolling — the concrete, measurable form of "the screen
// fits naturally". jsdom can't compute layout, so this only works in a real
// browser, which is the whole point of the Playwright suite.

/** Pixels the document scrolls horizontally. 0 (±1 for sub-pixel rounding)
 *  means everything fits within the viewport. */
async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
}

/** Public, unauthenticated routes — reachable without a Supabase session. */
const PUBLIC_ROUTES = [
  { path: "/login", heading: "Lord of the Mysteries" },
  { path: "/signup", heading: "Lord of the Mysteries" },
] as const;

for (const route of PUBLIC_ROUTES) {
  test(`${route.path} fits the viewport with no horizontal scroll`, async ({ page }) => {
    await page.goto(route.path);

    // The branded card must actually render (not an error page).
    await expect(
      page.getByRole("heading", { name: route.heading, level: 1 }),
    ).toBeVisible();

    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

    // The card itself must sit inside the viewport — this is what regressed
    // before the px-4 wrapper / responsive padding fix (it bled to the edge).
    const viewport = page.viewportSize();
    const card = page.locator("main > div").first();
    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    }
  });
}

test("login page survives a 320px-wide screen (smallest common phone)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Lord of the Mysteries", level: 1 }),
  ).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

test("can navigate between login and signup, both fitting the viewport", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});
