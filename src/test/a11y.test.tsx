// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { expectNoAxeViolations, expectNoAxeViolationsInContainer } from "@/test/axe";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ProviderConfig } from "@/components/game/provider-config";
import { SanityPreferences } from "@/components/game/sanity-preferences";
import { CharacterCreation } from "@/components/game/character-creation";
import { PlayDashboard } from "@/components/game/play-dashboard";
import { GameSidebar } from "@/components/game/game-sidebar";
import { CloudHydrationGate } from "@/components/game/cloud-hydration-gate";
import { MobileNav } from "@/components/game/mobile-nav";
import { GameLoop } from "@/components/game/game-loop";
import { CombatEncounterView } from "@/components/game/combat-encounter";
import CharacterPage from "@/app/(game)/character/page";
import JournalPage from "@/app/(game)/journal/page";
import MapPage from "@/app/(game)/map/page";
import GlossaryPage from "@/app/(game)/glossary/page";
import MarketPage from "@/app/(game)/market/page";
import ProfilePage from "@/app/(game)/profile/page";
import LeaderboardPage from "@/app/(game)/leaderboard/page";
import SocietyPage from "@/app/(game)/society/page";
import GuidePage from "@/app/(game)/guide/page";

import {
  buildLegacy,
  endSession,
  createIdentity,
  createIdentityState,
  switchIdentity,
  addAnnotation,
  addJournalEntries,
  createJournal,
  serializeJournal,
  createSession,
  createDefaultGameState,
  serializeSession,
  SESSION_INDEX_KEY,
  SESSION_KEY_PREFIX,
  JOURNAL_KEY_PREFIX,
  createEncounter,
  applyPreparation,
  chooseOption,
  isExchangeComplete,
  resolveEncounter,
  emptyPreparation,
} from "@/lib/game";
import type { GameState } from "@/lib/ai";

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
  it("mobile bottom navigation has no violations", async () => {
    await expectNoAxeViolations(<MobileNav />);
  });

  it("sidebar has no violations", async () => {
    await expectNoAxeViolations(<GameSidebar userEmail="beyonder@tingen.city" />);
  });

  it("sidebar character switcher (multiple characters) has no violations", async () => {
    const a = createSession(createDefaultGameState(1, "char-a", "Klein"), "switch-a");
    const b = createSession(createDefaultGameState(2, "char-b", "Audrey"), "switch-b");
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["switch-b", "switch-a"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "switch-a", serializeSession(a));
    localStorage.setItem(SESSION_KEY_PREFIX + "switch-b", serializeSession(b));
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

  it("death screen (ended session) has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-d", "Klein"),
      sanity: 0,
    };
    const session = createSession(gameState, "ended-1", 1000);
    const legacy = buildLegacy(session, "fatal", 2000);
    const ended = endSession(session, legacy, "The last thread snaps.", 3000);
    localStorage.setItem(SESSION_KEY_PREFIX + "ended-1", serializeSession(ended));
    await expectNoAxeViolations(<GameLoop sessionId="ended-1" />);
  });

  it("choices phase with free-text input has no violations", async () => {
    const gameState: GameState = createDefaultGameState(1, "char-c", "Klein");
    const session = {
      ...createSession(gameState, "choices-1", 1000),
      phase: "choices" as const,
      currentNarrative: "The fog parts around a narrow door.",
      currentChoices: [
        { id: "c1", text: "Knock twice", type: "action" as const },
        { id: "c2", text: "Listen first", type: "investigation" as const },
      ],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "choices-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="choices-1" />);
  });

  it("assume-identity panel (prepared persona, active) has no violations", async () => {
    const gameState: GameState = createDefaultGameState(1, "char-id", "Klein");
    const session = {
      ...createSession(gameState, "identity-1", 1000),
      phase: "choices" as const,
      currentNarrative: "The crowd swallows you whole.",
      currentChoices: [{ id: "c1", text: "Move through it", type: "action" as const }],
      identityState: switchIdentity(
        createIdentity(
          createIdentityState(),
          {
            name: "Sherlock Moriarty",
            appearance: "A lean detective",
            socialClass: "middle",
          },
          "full",
          1000,
          "id-1",
        ),
        "id-1",
      ),
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "identity-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="identity-1" />);
  });

  it("quest log (general quests + hunt tracking) has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-q", "Klein"),
      activeQuests: ["Find the missing sailor"],
    };
    const session = {
      ...createSession(gameState, "quests-1", 1000),
      phase: "choices" as const,
      currentNarrative: "Rumours of a fled creature drift through the harbour.",
      currentChoices: [{ id: "c1", text: "Ask around", type: "investigation" as const }],
      hunts: [
        // One still tracking, one cornered (shows the Engage button + progressbar).
        {
          targetItemName: "Spectator Characteristic",
          targetSeq: 6,
          turnsRemaining: 2,
          totalTurns: 3,
        },
        {
          targetItemName: "Marauder Characteristic",
          targetSeq: 7,
          turnsRemaining: 0,
          totalTurns: 2,
        },
      ],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "quests-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="quests-1" />);
  });

  it("apotheosis panel (Sequence 1 choices phase) has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-a", "Klein"),
      sequenceLevel: 1,
    };
    const session = {
      ...createSession(gameState, "apo-1", 1000),
      phase: "choices" as const,
      currentNarrative: "The throne of The Fool stands empty before you.",
      currentChoices: [{ id: "c1", text: "Approach it", type: "action" as const }],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "apo-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="apo-1" />);
  });

  it("failure panel (zero sanity) has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-f", "Klein"),
      sanity: 0,
    };
    const session = createSession(gameState, "fail-1", 1000);
    localStorage.setItem(SESSION_KEY_PREFIX + "fail-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="fail-1" />);
  });

  it("session-not-found state has no violations", async () => {
    await expectNoAxeViolations(<GameLoop sessionId="missing" />);
  });
});

describe("accessibility — combat", () => {
  const gameState: GameState = {
    ...createDefaultGameState(1, "char-1", "Klein"),
    inventory: [
      { name: "Corpse Grass", description: "A grave herb.", category: "main-ingredient" },
      {
        name: "Sealed Charm",
        description: "A bound trinket.",
        category: "supplementary-ingredient",
      },
    ],
  };
  const abilities = ["Spirit Vision", "Divination"];
  const noop = () => {};

  function view(encounter: Parameters<typeof CombatEncounterView>[0]["encounter"]) {
    return (
      <CombatEncounterView
        encounter={encounter}
        gameState={gameState}
        abilities={abilities}
        config={null}
        onUpdate={noop}
        onApplyResult={noop}
        onExit={noop}
      />
    );
  }

  it("preparation phase has no violations", async () => {
    const encounter = createEncounter({
      id: "a11y-combat",
      enemy: {
        name: "a lurking Beyonder",
        sequenceLevel: 8,
        isBeyonder: true,
        pathwayId: 4,
      },
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    await expectNoAxeViolations(view(encounter));
  });

  it("exchange phase has no violations", async () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "a11y-combat-2",
        enemy: { name: "a lurking Beyonder", sequenceLevel: 8, isBeyonder: false },
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      emptyPreparation(),
    );
    await expectNoAxeViolations(view(prepared));
  });

  it("enemy dossier at thorough intelligence (full reveal) has no violations", async () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "a11y-combat-intel",
        enemy: {
          name: "The Pale Visitor",
          description: "A figure wrapped in fog.",
          sequenceLevel: 7,
          isBeyonder: true,
          pathwayId: 4,
          knownAbilities: ["Command the spirits", "Walk the boundary"],
        },
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
        availableAbilities: abilities,
      }),
      {
        intelligence: "thorough",
        ritualMaterials: [],
        sealedArtifacts: [],
        readiedAbilities: [],
        terrain: "none",
      },
    );
    await expectNoAxeViolations(view(prepared));
  });

  it("resolution phase has no violations", async () => {
    let encounter = applyPreparation(
      createEncounter({
        id: "a11y-combat-3",
        enemy: {
          name: "a lurking Beyonder",
          sequenceLevel: 8,
          isBeyonder: true,
          pathwayId: 4,
        },
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      emptyPreparation(),
    );
    while (!isExchangeComplete(encounter)) {
      encounter = chooseOption(
        encounter,
        encounter.decisionPoints[encounter.decisionIndex].options[0].id,
      );
    }
    encounter = resolveEncounter(encounter);
    await expectNoAxeViolations(view(encounter));
  });
});

describe("accessibility — manage characters", () => {
  it("manage view (and delete confirmation) has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-m", "Klein"),
      "manage-1",
    );
    localStorage.setItem(SESSION_KEY_PREFIX + "manage-1", serializeSession(session));
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["manage-1"]));

    const { container } = render(<PlayDashboard />);
    fireEvent.click(screen.getByRole("button", { name: "Manage characters" }));
    await expectNoAxeViolationsInContainer(container);

    // Open the two-step confirm and re-check the live region + button group.
    fireEvent.click(screen.getByRole("button", { name: /Delete .*pathway/ }));
    await expectNoAxeViolationsInContainer(container);
  });
});

describe("accessibility — cloud hydration gate", () => {
  it("loading state has no violations", async () => {
    await expectNoAxeViolations(
      <CloudHydrationGate>
        <p>hidden during sync</p>
      </CloudHydrationGate>,
    );
  });
});

describe("accessibility — stub pages", () => {
  it("character page (empty state) has no violations", async () => {
    await expectNoAxeViolations(<CharacterPage />);
  });

  it("character sheet with a recorded Beyonder has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-s", "Klein"),
      inventory: [
        {
          name: "Lavos squid blood",
          description: "A vial.",
          category: "main-ingredient",
        },
        {
          name: "Brass Key",
          description: "A small tarnished key.",
          category: "mundane",
        },
      ],
    };
    const session = {
      ...createSession(gameState, "sheet-1", 1000),
      identityState: switchIdentity(
        createIdentity(
          createIdentityState(),
          {
            name: "Sherlock Moriarty",
            appearance: "A lean detective",
            socialClass: "middle",
          },
          "full",
          1000,
          "id-1",
        ),
        "id-1",
      ),
    };
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["sheet-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "sheet-1", serializeSession(session));
    const { container } = render(<CharacterPage />);
    await expectNoAxeViolationsInContainer(container);

    // Open the True Self editor and re-check the form fields + recognition toggle.
    fireEvent.click(screen.getByRole("button", { name: "Edit true self" }));
    await expectNoAxeViolationsInContainer(container);

    // Open the two-step delete confirm and re-check the live region + buttons.
    fireEvent.click(screen.getByRole("button", { name: /Delete Klein/ }));
    await expectNoAxeViolationsInContainer(container);
  });

  it("map page has no violations", async () => {
    await expectNoAxeViolations(<MapPage />);
  });

  it("glossary page has no violations", async () => {
    await expectNoAxeViolations(<GlossaryPage />);
  });

  it("guide page has no violations", async () => {
    // Native <details> render their content in the DOM regardless of open
    // state, so axe sees every disclosure's blurb and deep link here.
    await expectNoAxeViolations(<GuidePage />);
  });

  it("profile page (with session) has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-p", "Klein"),
      "prof-1",
      1000,
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["prof-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "prof-1", serializeSession(session));
    await expectNoAxeViolations(<ProfilePage />);
  });

  it("leaderboard page has no violations", async () => {
    await expectNoAxeViolations(<LeaderboardPage />);
  });

  it("society page (eligible founder) has no violations", async () => {
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-soc", "Klein"),
      sequenceLevel: 7,
    };
    const session = createSession(gameState, "soc-1", 1000);
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["soc-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "soc-1", serializeSession(session));
    await expectNoAxeViolations(<SocietyPage />);
  });

  it("market page has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-m", "Klein"),
      "mkt-1",
      1000,
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["mkt-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "mkt-1", serializeSession(session));
    await expectNoAxeViolations(<MarketPage />);
  });

  it("journal page has no violations", async () => {
    await expectNoAxeViolations(<JournalPage />);
  });

  it("journal panel with recorded entries and notes has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-1", "Klein"),
      "jrnl-1",
      1000,
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["jrnl-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "jrnl-1", serializeSession(session));
    const journal = addAnnotation(
      addJournalEntries(createJournal(), [
        {
          id: "e1",
          turnNumber: 1,
          createdAt: 1000,
          location: "Tingen City",
          eventType: "discovery",
          summary: "Found the red chapel.",
          narrative: "A long account of the chapel.",
          involvedNpcs: ["Dunn Smith"],
          arc: "Sequence 9 — Seer",
          characterId: "char-1",
          characterName: "Klein",
        },
      ]),
      "e1",
      "My note.",
      2000,
      "a1",
    );
    localStorage.setItem(JOURNAL_KEY_PREFIX + "jrnl-1", serializeJournal(journal));
    await expectNoAxeViolations(<JournalPage />);
  });

  it("map page (active session, travel controls) has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "char-map", "Klein"),
      "map-1",
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["map-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "map-1", serializeSession(session));
    await expectNoAxeViolations(<MapPage />);
  });

  it("map page for a non-Fifth epoch (region list, no travel) has no violations", async () => {
    // A First-Epoch character sees the Age-of-Chaos gazetteer with no inter-city
    // travel section — exercise that render path for accessibility.
    const session = createSession(
      createDefaultGameState(1, "char-map2", "Survivor", undefined, 1),
      "map-2",
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["map-2"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "map-2", serializeSession(session));
    await expectNoAxeViolations(<MapPage />);
  });
});
