import { expect, test } from "@playwright/test";
import { createDefaultGameState, createSession, type GameSession } from "@/lib/game";
import { seedActiveSession } from "./seed";

// Authenticated-tier spec (runs only with a Supabase backend; gated in
// playwright.config.ts and seeded with a signed-in storageState). The /society
// page is an authenticated screen, so it can't run in the public tier.
//
// This guards the NO-PROVIDER deterministic path (no BYOK provider configured):
// found a society, extend an invitation (the random-recruit fallback), and
// convene — the fully-working floor the AI affordances layer on top of. The
// AI paths (Suggest an identity / candidate slate / summoning narration) each
// require a provider + a live model call, so they are not exercised here.

// A Fool at Seq 7 — eligible to found the Tarot Club — parked with no society yet.
function founderSession(id: string): GameSession {
  return createSession(
    {
      ...createDefaultGameState(1, `${id}-char`, "Klein Society"),
      sequenceLevel: 7,
    },
    id,
  );
}

async function seed(
  page: import("@playwright/test").Page,
  session: GameSession,
): Promise<void> {
  await seedActiveSession(page, session);
  await page.goto("/society");
}

test("found, invite (no-provider fallback), and convene end-to-end", async ({ page }) => {
  await seed(page, founderSession("e2e-society-found"));

  // The founding form is shown (eligible founder, no society yet).
  await expect(page.getByRole("button", { name: /Found it/ })).toBeVisible();
  await page.getByRole("button", { name: /Found it/ }).click();

  // The founded society header + its two actions render.
  await expect(
    page.getByRole("button", { name: /Seek someone to invite/ }),
  ).toBeVisible();

  // No provider configured → "Seek someone to invite" runs the deterministic
  // recruit, seating one member at the long table.
  await page.getByRole("button", { name: /Seek someone to invite/ }).click();
  await expect(page.getByRole("heading", { name: /The long table/ })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /Trust/ })).toHaveCount(1);

  // With a member seated, the fog opens — convene.
  const convene = page.getByRole("button", { name: /Convene the gathering/ });
  await expect(convene).toBeEnabled();
  await convene.click();

  // A gathering played out — the latest-gathering parchment renders.
  await expect(page.getByRole("region", { name: /Latest gathering/ })).toBeVisible();
});
