import { expect, test } from "@playwright/test";
import { PROVIDER_CONFIG_KEY } from "@/lib/game";

// Authenticated-tier spec (runs only with a Supabase backend; gated in
// playwright.config.ts and seeded with a signed-in storageState). It exercises
// the canon-character TAKEOVER guided prologue (issue #92): naming a character
// after a known novel figure surfaces an opt-in affordance that locks the
// figure's pathway and runs a canon-faithful, AI-driven prologue ending in the
// chronicle proper. The AI provider is route-intercepted so the flow is
// deterministic and needs no real key.

// A configured OpenAI provider (browser-direct → api.openai.com). The
// interceptor below answers every chat completion, so the key is never used.
const PROVIDER = {
  providerId: "openai",
  apiKey: "sk-e2e-not-real",
  routineModel: "gpt-4o-mini",
  premiumModel: "gpt-4o",
};

// A canon scene with stable choice text we can click repeatedly. `readyToConclude`
// is advisory — the engine still requires the minimum scene count before the
// finale, so we can return it on every scene safely.
const sceneBody = JSON.stringify({
  narrative:
    "The grey fog still rings in your bones as Tingen wakes around you, gaslight guttering in the damp.",
  choices: [
    { id: "a", text: "Guard your secret and move on quietly." },
    { id: "b", text: "Test the new sight at the edge of your vision." },
  ],
  readyToConclude: true,
});

const finaleBody = JSON.stringify({
  narrative:
    "The Seer potion is the colour of dark water. You speak the rite, and you drink — and the world is never quite opaque again.",
});

function openAiEnvelope(content: string): string {
  return JSON.stringify({
    choices: [{ message: { content } }],
    model: "gpt-4o-mini",
    usage: { prompt_tokens: 80, completion_tokens: 40, total_tokens: 120 },
  });
}

test("a canon takeover runs the guided prologue and opens the chronicle", async ({
  page,
}) => {
  // Seed the BYOK provider config before the app's scripts run.
  await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), {
    key: PROVIDER_CONFIG_KEY,
    value: JSON.stringify(PROVIDER),
  });

  // Deterministic AI: the first N calls are prologue scenes, the rest finales.
  // The engine concludes after the minimum scene count, so a fixed threshold of
  // 6 scenes resolves to the finale regardless of exact ordering.
  let calls = 0;
  await page.route("**/chat/completions**", async (route) => {
    calls += 1;
    const body = calls <= 6 ? sceneBody : finaleBody;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: openAiEnvelope(body),
    });
  });

  await page.goto("/play");

  // Begin a new chronicle → the AI-prologue path → character setup.
  await page.getByRole("button", { name: /Begin journey/i }).click();
  await page.getByRole("button", { name: /Begin the Prologue/i }).click();

  // Naming the character after a canon figure surfaces the takeover affordance.
  await page.getByLabel(/Character Name/i).fill("Klein Moretti");
  await expect(page.getByText(/Take over Klein Moretti/i)).toBeVisible();
  await page.getByRole("button", { name: /Become Klein Moretti/i }).click();

  // Walk the canon prologue: pick a choice each scene until the finale arrives.
  // The minimum scene count gates the finale, so click through several scenes.
  for (let i = 0; i < 8; i++) {
    const beginChronicle = page.getByRole("button", { name: /Begin Your Chronicle/i });
    if (await beginChronicle.isVisible().catch(() => false)) break;
    await page
      .getByRole("button", { name: /Guard your secret and move on quietly\./i })
      .first()
      .click();
  }

  // The finale (the becoming) renders; finishing opens the chronicle proper.
  await expect(page.getByText(/the colour of dark water/i)).toBeVisible();
  await page.getByRole("button", { name: /Begin Your Chronicle/i }).click();

  // The game loop is live for the taken-over figure.
  await expect(page.getByText(/Klein Moretti/i).first()).toBeVisible();
});
