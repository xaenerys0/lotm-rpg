// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { expectNoAxeViolations } from "@/test/axe";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ProviderConfig } from "@/components/game/provider-config";
import { SanityPreferences } from "@/components/game/sanity-preferences";
import { CharacterCreation } from "@/components/game/character-creation";
import { GameSidebar } from "@/components/game/game-sidebar";
import { GameLoop } from "@/components/game/game-loop";
import CharacterPage from "@/app/(game)/character/page";
import JournalPage from "@/app/(game)/journal/page";

import {
  createSession,
  createDefaultGameState,
  serializeSession,
  SESSION_KEY_PREFIX,
} from "@/lib/game";

// Components reach for the Next router; stub it so they render in isolation.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/play",
}));

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("accessibility — auth", () => {
  it("login form has no violations", async () => {
    await expectNoAxeViolations(<LoginForm />);
  });

  it("signup form has no violations", async () => {
    await expectNoAxeViolations(<SignupForm />);
  });
});

describe("accessibility — game shell", () => {
  it("sidebar has no violations", async () => {
    await expectNoAxeViolations(<GameSidebar userEmail="beyonder@tingen.city" />);
  });

  it("settings provider config has no violations", async () => {
    await expectNoAxeViolations(<ProviderConfig />);
  });

  it("sanity preferences toggle has no violations", async () => {
    await expectNoAxeViolations(<SanityPreferences />);
  });
});

describe("accessibility — character creation", () => {
  it("mode select step has no violations", async () => {
    await expectNoAxeViolations(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
  });
});

describe("accessibility — game loop", () => {
  it("idle phase (seeded session) has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-1", "Klein"),
      "a11y-session",
    );
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId={session.id} />);
  });

  it("session-not-found state has no violations", async () => {
    await expectNoAxeViolations(<GameLoop sessionId="missing" />);
  });
});

describe("accessibility — stub pages", () => {
  it("character page has no violations", async () => {
    await expectNoAxeViolations(<CharacterPage />);
  });

  it("journal page has no violations", async () => {
    await expectNoAxeViolations(<JournalPage />);
  });
});
