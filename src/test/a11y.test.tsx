// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { expectNoAxeViolations, expectNoAxeViolationsInContainer } from "@/test/axe";

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { ProviderConfig } from "@/components/game/provider-config";
import { ImageProviderConfig } from "@/components/game/image-provider-config";
import { SanityPreferences } from "@/components/game/sanity-preferences";
import { DevSceneArtHarness } from "@/components/game/dev-scene-art-harness";
import { CharacterCreation } from "@/components/game/character-creation";
import { PlayDashboard } from "@/components/game/play-dashboard";
import { GameSidebar } from "@/components/game/game-sidebar";
import { CloudHydrationGate } from "@/components/game/cloud-hydration-gate";
import { MobileNav } from "@/components/game/mobile-nav";
import { GameLoop } from "@/components/game/game-loop";
import { CombatEncounterView } from "@/components/game/combat-encounter";
import { StoryChronicle } from "@/components/game/story-chronicle";
import { ArtificePanel } from "@/components/game/artifice-panel";
import { AdminToolsPanel } from "@/components/game/admin-tools-panel";
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
  PROVIDER_CONFIG_KEY,
  createEncounter,
  applyPreparation,
  chooseOption,
  isExchangeComplete,
  resolveEncounter,
  emptyPreparation,
} from "@/lib/game";
import type { GameState } from "@/lib/ai";
import { getSequence } from "@/lib/rules";

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

  it("sidebar with the admin link has no violations", async () => {
    await expectNoAxeViolations(<GameSidebar userEmail="beyonder@tingen.city" isAdmin />);
  });

  it("dev admin tools panel has no violations", async () => {
    await expectNoAxeViolations(<AdminToolsPanel />);
  });

  it("dev admin tools panel (with an active character) has no violations", async () => {
    const session = createSession(
      createDefaultGameState(1, "admin-active", "Klein"),
      "admin-active",
    );
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify([session.id]));
    localStorage.setItem(SESSION_KEY_PREFIX + session.id, serializeSession(session));
    await expectNoAxeViolations(<AdminToolsPanel />);
  });

  it("settings provider config has no violations", async () => {
    await expectNoAxeViolations(<ProviderConfig />);
  });

  it("settings image provider config has no violations", async () => {
    await expectNoAxeViolations(<ImageProviderConfig />);
  });

  it("sanity preferences toggle has no violations", async () => {
    await expectNoAxeViolations(<SanityPreferences />);
  });

  it("artifice crafting panel has no violations", async () => {
    // A Paragon (id 19) with a fuseable Characteristic so the form renders.
    const gs = createDefaultGameState(19, "char-artisan", "Artisan");
    const session = createSession(
      {
        ...gs,
        sequenceLevel: 6,
        funds: 100_000,
        inventory: [
          {
            name: "Sequence 6 Paragon Beyonder Characteristic",
            description: "A precipitated characteristic.",
            category: "main-ingredient",
          },
        ],
      },
      "artisan-1",
    );
    await expectNoAxeViolations(<ArtificePanel session={session} onUpdate={() => {}} />);
  });

  it("dev scene-art harness has no violations", async () => {
    await expectNoAxeViolations(<DevSceneArtHarness />);
  });
});

describe("accessibility — character creation", () => {
  it("mode select step has no violations", async () => {
    await expectNoAxeViolations(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
  });

  it("the start chooser (place / circle / origin cards) has no violations (issues #131/#132)", async () => {
    // Drive the manual path to the first-potion step, where the start chooser —
    // now a two-level card picker (opening families + browsable option cards)
    // that replaced the single crammed <select> — renders, and assert each
    // revealed family is clean.
    const { container } = render(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Choose Your Path/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Fool/ }));
    fireEvent.change(screen.getByLabelText(/Character Name/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    // The chooser is present (its fieldset legend) and the opening families are
    // selectable toggle cards (aria-pressed).
    screen.getByText(/Where Your Chronicle Begins/i);

    // "Within someone's circle" reveals the start-archetype cards (begin in an
    // NPC's circle) — each card shows its label AND blurb inline (no dropdown).
    fireEvent.click(screen.getByRole("button", { name: /Within someone's circle/i }));
    screen.getByRole("button", { name: /junior Nighthawk/i });
    await expectNoAxeViolationsInContainer(container);

    // "Author your own circle" reveals the custom inputs (tie, companions
    // add-control + chips, location) — all must be accessible too.
    fireEvent.click(screen.getByRole("button", { name: /Author your own circle/i }));
    screen.getByLabelText(/Your tie to this world/i);
    const companion = screen.getByLabelText(/Who stands with you/i);
    fireEvent.change(companion, { target: { value: "Mara" } });
    fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));
    screen.getByRole("button", { name: /Remove Mara/i });
    await expectNoAxeViolationsInContainer(container);

    // Reveal the gated origin starts (issue #132): the affordance checkbox
    // surfaces the "A sealed origin" family, whose cards must be accessible too.
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Begin as a native of a sealed/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /A sealed origin/i }));
    screen.getByRole("button", { name: /Born in the City of Silver/i });
    await expectNoAxeViolationsInContainer(container);
  });

  it("the per-archetype starting-sequence picker has no violations", async () => {
    // Drive to the first-potion step and reveal the archetype cards, then select
    // archetypes that carry sequence data so the picker (the <fieldset>/<legend>
    // of aria-pressed buttons) actually renders — both a full-range archetype
    // (9 → floor) and a born-but-climbable one whose ceiling caps below 9.
    const { container } = render(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Choose Your Path/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Fool/ }));
    fireEvent.change(screen.getByLabelText(/Character Name/i), {
      target: { value: "Test" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Within someone's circle/i }));

    // A full-range archetype → the selectable sequence picker (9 → minStartSequence).
    fireEvent.click(
      screen.getByRole("button", { name: /attendant to Lady Audrey Hall/i }),
    );
    screen.getByRole("button", { name: /Sequence 9/i });
    screen.getByRole("button", { name: /Sequence 7/i });
    await expectNoAxeViolationsInContainer(container);

    // A born-but-climbable archetype (Sanguine) → the picker is capped at the
    // born ceiling (Seq 7), offering 7 → 5 but never the impossible Seq 8/9.
    fireEvent.click(screen.getByRole("button", { name: /A Sanguine in Emlyn White's/i }));
    screen.getByRole("button", { name: /Sequence 7/i });
    screen.getByRole("button", { name: /Sequence 5/i });
    expect(screen.queryByRole("button", { name: /Sequence 8/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sequence 9/i })).toBeNull();
    await expectNoAxeViolationsInContainer(container);
  });

  it("backstory sequence-violation error state has no violations", async () => {
    // Drive to the character-sheet step (manual path), type a backstory that
    // claims a more-powerful sequence, then proceed to first-potion where the
    // role="alert" error div mounts, aria-invalid is set, and the Begin button
    // is disabled with aria-describedby.
    const { container } = render(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Choose Your Path/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Fool/ }));
    // On character-sheet step: type a violating backstory before advancing.
    fireEvent.change(screen.getByLabelText(/Your Story/i), {
      target: { value: "I am already a Sequence 7 Zombie." },
    });
    fireEvent.change(screen.getByLabelText(/Character Name/i), {
      target: { value: "Test" },
    });
    // Navigate to first-potion step — error alert and disabled button now render.
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    screen.getByRole("alert");
    await expectNoAxeViolationsInContainer(container);
  });

  it("the canon-takeover affordance (issue #92) has no violations", async () => {
    // A configured provider enables the AI-prologue path; typing a canon name in
    // character-setup surfaces the opt-in "Take over {name}'s story" card.
    localStorage.setItem(PROVIDER_CONFIG_KEY, JSON.stringify({ providerId: "ollama" }));
    const { container } = render(
      <CharacterCreation onComplete={vi.fn()} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Begin the Prologue/i }));
    fireEvent.change(screen.getByLabelText(/Character Name/i), {
      target: { value: "Klein Moretti" },
    });
    // The affordance and its action button render for a matched canon figure.
    screen.getByText(/Take over Klein Moretti/i);
    screen.getByRole("button", { name: /Become Klein Moretti/i });
    await expectNoAxeViolationsInContainer(container);
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

  it("merged choices screen (resolution recap + inline next choices) has no violations", async () => {
    // The action-assumption fix: after a normal turn the choices screen renders a
    // ResolutionRecap (outcome narrative + consequences summary) above the next
    // choices, driven by `lastResolution`. `currentNarrative` is cleared (the
    // recap owns the prose). knowsMethod=true exercises the acting/digestion prose.
    const gameState: GameState = createDefaultGameState(1, "char-recap", "Klein");
    const session = {
      ...createSession(gameState, "recap-1", 1000),
      phase: "choices" as const,
      turnCount: 2,
      currentNarrative: null,
      currentChoices: [
        { id: "c1", text: "Slip out quietly", type: "action" as const },
        { id: "c2", text: "Ask the clerk about the ledger", type: "dialogue" as const },
      ],
      actingMethodState: { knowsMethod: true, alignedStreak: 3 },
      lastResolution: {
        response: {
          narrative: "You ease the drawer shut; the ledger sits back in its place.",
          choices: [
            { id: "c1", text: "Slip out quietly", type: "action" as const },
            {
              id: "c2",
              text: "Ask the clerk about the ledger",
              type: "dialogue" as const,
            },
          ],
          actingEvaluation: { alignment: 0.7, reasoning: "You stayed in character." },
          sanityEventTags: ["routine"],
          itemsDiscovered: [
            {
              name: "Brass key",
              description: "A small tarnished key.",
              category: "mundane" as const,
            },
          ],
        },
        validation: { valid: true, violations: [] },
      },
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "recap-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="recap-1" />);
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

  it("ritual performance panel (Seq 5 rite, choices phase) has no violations", async () => {
    // A Fool at Seq 6 with the next potion fully prepared — the target (Seq 5)
    // needs an Advancement Ritual, so the RitualPerformancePanel renders with the
    // single "Perform the rite" + "Skip the rite" controls (issue #209).
    const prereqs = getSequence(1, 5)?.prerequisiteItems ?? [];
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-r", "Klein"),
      sequenceLevel: 6,
      inventory: [...prereqs],
      digestion: { pathwayId: 1, sequenceLevel: 6, progress: 100, complete: true },
    };
    const session = {
      ...createSession(gameState, "ritual-1", 1000),
      phase: "choices" as const,
      currentNarrative: "The potion is brewed. The rite remains.",
      currentChoices: [{ id: "c1", text: "Steady yourself", type: "action" as const }],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "ritual-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="ritual-1" />);
  });

  it("ritual performance panel (rite maturing, progressbar) has no violations", async () => {
    // The rite begun and maturing — the panel shows the fidelity progressbar
    // (issue #209). Seeds a `fidelity`-based ritualState.
    const prereqs = getSequence(1, 5)?.prerequisiteItems ?? [];
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-rip", "Klein"),
      sequenceLevel: 6,
      inventory: [...prereqs],
      digestion: { pathwayId: 1, sequenceLevel: 6, progress: 100, complete: true },
    };
    const session = {
      ...createSession(gameState, "ritual-ip", 1000),
      phase: "choices" as const,
      currentNarrative: "The rite is under way.",
      currentChoices: [{ id: "c1", text: "Endure", type: "action" as const }],
      ritualState: { pathwayId: 1, targetSeq: 5, fidelity: 0.5 },
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "ritual-ip", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="ritual-ip" />);
  });

  it("potion prep panel (unsecured formula) offers trade/seek with no violations", async () => {
    // A Fool at Seq 9, potion digested, empty satchel — the formula is not yet
    // secured, so the PotionPreparationPanel offers the recipe via "Trade for it"
    // or "Seek it through the story" and the ingredients render sealed (issue #171).
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-prep", "Klein"),
      sequenceLevel: 9,
      inventory: [],
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 100, complete: true },
    };
    const session = {
      ...createSession(gameState, "prep-1", 1000),
      phase: "choices" as const,
      currentNarrative: "The potion is digested. The next recipe is closely guarded.",
      currentChoices: [{ id: "c1", text: "Consider the climb", type: "action" as const }],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "prep-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="prep-1" />);
  });

  it("potion prep panel (formula pursuit ready) offers secure with no violations", async () => {
    // The same Beyonder mid-climb with a completed formula pursuit — the panel
    // shows the "Secure the recipe" control (issue #171).
    const formula = getSequence(1, 8)?.prerequisiteItems?.find(
      (i) => i.category === "potion-formula",
    );
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-seek", "Klein"),
      sequenceLevel: 9,
      inventory: [],
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 100, complete: true },
    };
    const session = {
      ...createSession(gameState, "seek-1", 1000),
      formulaPursuit: {
        targetItemName: formula?.name ?? "Clown Potion Formula",
        targetSeq: 8,
        turnsRemaining: 0,
        totalTurns: 3,
      },
      phase: "choices" as const,
      currentNarrative: "Your search for the recipe is over — it is within reach.",
      currentChoices: [{ id: "c1", text: "Claim it", type: "action" as const }],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "seek-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="seek-1" />);
  });

  it("pillar ascension panel (Sequence 0 choices phase) has no violations", async () => {
    // A True God of a Pillar family (Fool) — the PillarAscensionPanel renders
    // above Sequence 0 (issue #99 Part B).
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-p", "Klein"),
      sequenceLevel: 0,
    };
    const session = {
      ...createSession(gameState, "pillar-1", 1000),
      phase: "choices" as const,
      currentNarrative:
        "You are a True God. Above you, the sequences end — and something more begins.",
      currentChoices: [{ id: "c1", text: "Look up", type: "action" as const }],
    };
    localStorage.setItem(SESSION_KEY_PREFIX + "pillar-1", serializeSession(session));
    await expectNoAxeViolations(<GameLoop sessionId="pillar-1" />);
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
      // A real Sealed Artifact + an ordinary belonging so the preparation form
      // renders BOTH the (artifact-only) sealed-artifacts picker and the
      // ritual-materials picker for the axe pass.
      {
        name: "Sealed Artifact 3-0782 — Mutated Sun Sacred Emblem",
        description: "A purifying badge with a Sun-worship drawback.",
        category: "sealed-artifact",
      },
      { name: "Tarnished Locket", description: "A bit of loot.", category: "mundane" },
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
        sessionId="a11y-session"
        imageConfig={null}
        sceneArtEnabled={false}
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

  it("exchange phase with a slipping control meter + enemy stance has no violations", async () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "a11y-combat-control",
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
    // Force the control meter into a slipping state so the progressbar + warning
    // render for the axe pass.
    const slipping = {
      ...prepared,
      controlStrain: 0.78,
      controlTier: "slipping" as const,
    };
    await expectNoAxeViolations(view(slipping));
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

  it("exchange phase with a mind-controlled (reconcilable) framing has no violations", async () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "a11y-combat-framed",
        enemy: {
          name: "Lawrence",
          sequenceLevel: 8,
          isBeyonder: true,
          pathwayId: 4,
        },
        context: {
          framing: "mind-controlled",
          isKnownPerson: true,
          controllerName: "the Puppeteer",
          reconcilable: true,
        },
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      emptyPreparation(),
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

  it("after-action report on a control spiral has no violations", async () => {
    let encounter = applyPreparation(
      createEncounter({
        id: "a11y-combat-spiral",
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
    // Drive the meter to spiral so the resolution reports the lost-control outcome.
    encounter = { ...encounter, controlStrain: 0.95, controlTier: "spiral" };
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

describe("accessibility — story chronicle", () => {
  it("renders a mixed story/combat/ascension transcript with no violations", async () => {
    const turn = (turnNumber: number, playerAction: string, narrative: string) => ({
      turnNumber,
      playerAction,
      aiResponse: { narrative },
      timestamp: 1000 + turnNumber,
    });
    const memory = {
      immediateTurns: [
        turn(1, "Examine the locked door", "The brass handle is cold under your palm."),
        turn(
          2,
          "I faced a lurking Beyonder in combat; it ended in victory.",
          "You leave the wraith dispersing into the fog.",
        ),
        turn(
          3,
          "I drink the Sequence 8 potion and undergo the advancement.",
          "The role settles into your bones; you are a Clown now.",
        ),
      ],
      recentSummaries: [],
      sessionFacts: [],
      runningSummary: "You arrived in Tingen and began to walk the Fool's path.",
    };
    await expectNoAxeViolations(<StoryChronicle memory={memory} />);
  });

  it("styles beats from the structured turn kind when present (issue #171)", async () => {
    const memory = {
      immediateTurns: [
        {
          turnNumber: 1,
          // Action text that the string classifier would NOT flag — the
          // structured `kind` drives the styling instead.
          playerAction: "I confront the figure",
          aiResponse: { narrative: "Steel meets shadow." },
          timestamp: 1001,
          kind: "combat" as const,
        },
        {
          turnNumber: 2,
          playerAction: "I take up the mantle",
          aiResponse: { narrative: "The power settles into you." },
          timestamp: 1002,
          kind: "advancement" as const,
        },
      ],
      recentSummaries: [],
      sessionFacts: [],
    };
    await expectNoAxeViolations(<StoryChronicle memory={memory} />);
  });

  it("renders nothing before any beats exist", async () => {
    const memory = { immediateTurns: [], recentSummaries: [], sessionFacts: [] };
    await expectNoAxeViolations(<StoryChronicle memory={memory} />);
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

  it("populated 'Your Characters' roster (paginated) has no violations", async () => {
    // A provider config flips `hasConfig` so the home dashboard renders the
    // Start New Game CTA and the resume roster (not the configure banner).
    localStorage.setItem(PROVIDER_CONFIG_KEY, JSON.stringify({ provider: "ollama" }));
    // Seed more than one page (PAGE_SIZE is 6) so the pagination controls render.
    const ids: string[] = [];
    for (let i = 0; i < 7; i++) {
      const id = `roster-${i}`;
      ids.push(id);
      const session = createSession(
        createDefaultGameState((i % 9) + 1, `char-${i}`, `Beyonder ${i}`),
        id,
      );
      localStorage.setItem(SESSION_KEY_PREFIX + id, serializeSession(session));
    }
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(ids));

    const { container } = render(<PlayDashboard />);
    // Page 1: clickable resume cards + pagination controls.
    await expectNoAxeViolationsInContainer(container);
    // Page 2 surfaces the remaining character(s).
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
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
        {
          name: "Sealed Artifact 2-049 — Antigonus Family Puppet",
          description:
            "A jointed clown puppet that slows everyone nearby. (Grade 2. Drawback: it spares no one, the wielder included.)",
          category: "sealed-artifact",
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

    // The sheet is tabbed (history-context sheet UI). The True Self editor lives
    // on the "Self & Allies" tab — activate it first.
    fireEvent.click(screen.getByRole("tab", { name: "Self & Allies" }));
    // Open the True Self editor and re-check the form fields + recognition toggle.
    fireEvent.click(screen.getByRole("button", { name: "Edit true self" }));
    await expectNoAxeViolationsInContainer(container);

    // The delete danger zone lives on the "Holdings" tab.
    fireEvent.click(screen.getByRole("tab", { name: "Holdings" }));
    // Open the two-step delete confirm and re-check the live region + buttons.
    fireEvent.click(screen.getByRole("button", { name: /Delete Klein/ }));
    await expectNoAxeViolationsInContainer(container);
  });

  it("character sheet acquired-powers add + edit forms have no violations", async () => {
    // An Error Beyonder at Sequence 6 (Prometheus) HAS a power-acquisition
    // capability, so the interactive "Take a power" form renders; seed one
    // recorded power so the per-power edit form (with its select + number
    // inputs) renders too. This covers the form fields the read-only sheet test
    // (a Fool with no capability) cannot reach.
    const base = createDefaultGameState(8, "char-ap", "The Thief");
    const session = {
      ...createSession({ ...base, sequenceLevel: 6 }, "ap-1", 1000),
      acquiredPowers: [
        {
          id: "ap-power-1",
          name: "Borrowed Flame",
          description: "A copied gout of red-priest fire.",
          method: "prometheus-theft" as const,
          permanence: "temporary" as const,
          turnsRemaining: 3,
          acquiredAtTurn: 0,
        },
      ],
    };
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["ap-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "ap-1", serializeSession(session));
    const { container } = render(<CharacterPage />);
    await expectNoAxeViolationsInContainer(container);

    // Acquired powers live on the "Powers" tab (history-context sheet UI).
    fireEvent.click(screen.getByRole("tab", { name: "Powers" }));
    const region = screen.getByRole("region", { name: "Acquired powers" });
    // Open the per-power edit form (name/description/source + permanence select
    // + turns-left number input).
    fireEvent.click(within(region).getByRole("button", { name: "Edit" }));
    await expectNoAxeViolationsInContainer(container);

    // Open the "Take a power" form (method select + the text/textarea fields).
    fireEvent.click(within(region).getByRole("button", { name: "Take a power" }));
    await expectNoAxeViolationsInContainer(container);
  });

  it("character sheet anchors section (climbing into Saint tier) has no violations", async () => {
    // A Beyonder whose next climb leads into the Saint tier (here Sequence 5 →
    // target 4) sees the Anchors section: DEMIGOD_TRAITS flavour, the support
    // progressbar, a seeded anchor (its integrity bar + Strengthen/Release), and
    // the consecrate form (kind select + name input). The seeded anchor sits
    // below full integrity so the "Strengthen" branch renders too.
    const gameState: GameState = {
      ...createDefaultGameState(1, "char-anchor", "Klein"),
      sequenceLevel: 5,
    };
    const session = {
      ...createSession(gameState, "anchor-1", 1000),
      anchorState: {
        anchors: [
          {
            id: "anchor-watch",
            kind: "object" as const,
            name: "Mother's pocket watch",
            integrity: 60,
          },
        ],
      },
    };
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["anchor-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "anchor-1", serializeSession(session));
    const { container } = render(<CharacterPage />);
    await expectNoAxeViolationsInContainer(container);

    // Anchors live on the "Powers" tab (history-context sheet UI).
    fireEvent.click(screen.getByRole("tab", { name: "Powers" }));
    const region = screen.getByRole("region", { name: "Anchors" });
    // Open the consecrate form and select the congregation kind so its
    // following-required hint renders.
    fireEvent.click(within(region).getByRole("button", { name: "Consecrate an anchor" }));
    fireEvent.change(within(region).getByLabelText("What you anchor on"), {
      target: { value: "congregation" },
    });
    await expectNoAxeViolationsInContainer(container);
  });

  it("character sheet Codex tab (filters + entity cards) has no violations", async () => {
    // A seeded Codex (history-context Codex) so the tab renders its search,
    // kind-filter chips, the resolved-threads checkbox, and grouped entity cards
    // (one pivotal person, one open thread) — the new interactive surface.
    const session = {
      ...createSession(createDefaultGameState(1, "char-cx", "Klein"), "cx-1", 1000),
      codexState: {
        entities: [
          {
            id: "cx-person",
            kind: "person" as const,
            name: "Audrey Hall",
            status: "a steadfast ally in Backlund",
            importance: "pivotal" as const,
            firstSeenTurn: 3,
            lastSeenTurn: 42,
            aliases: ["Miss Hall"],
          },
          {
            id: "cx-thread",
            kind: "thread" as const,
            name: "A debt owed to Dunn Smith",
            status: "unpaid",
            importance: "standard" as const,
            firstSeenTurn: 10,
            lastSeenTurn: 10,
          },
        ],
      },
    };
    localStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(["cx-1"]));
    localStorage.setItem(SESSION_KEY_PREFIX + "cx-1", serializeSession(session));
    // A provider config so the "Rebuild from history" affordance renders.
    localStorage.setItem(
      "lotm-rpg-provider-config",
      JSON.stringify({
        providerId: "openai",
        apiKey: "sk-test",
        routineModel: "gpt-4o-mini",
        premiumModel: "gpt-4o",
      }),
    );
    const { container } = render(<CharacterPage />);
    await expectNoAxeViolationsInContainer(container);

    // Activate the Codex tab and exercise its controls.
    fireEvent.click(screen.getByRole("tab", { name: /Codex/ }));
    const region = screen.getByRole("region", { name: "Codex" });
    fireEvent.change(within(region).getByLabelText("Search the Codex"), {
      target: { value: "Audrey" },
    });
    fireEvent.click(within(region).getByLabelText("Show settled threads"));
    await expectNoAxeViolationsInContainer(container);

    // Open the per-entity curation editor (name/status/merge/forget), then close
    // it so its toggle reverts from "Close" to "Edit".
    fireEvent.click(within(region).getByRole("button", { name: "Edit" }));
    await expectNoAxeViolationsInContainer(container);
    fireEvent.click(within(region).getByRole("button", { name: "Close" }));

    // Open the manual "Add entry" form (name/kind/status/pivotal), then close it.
    fireEvent.click(within(region).getByRole("button", { name: /Add entry/ }));
    await expectNoAxeViolationsInContainer(container);
    fireEvent.click(within(region).getByRole("button", { name: "Close" }));

    // Open the rebuild confirm panel.
    fireEvent.click(within(region).getByRole("button", { name: /Rebuild from history/ }));
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
