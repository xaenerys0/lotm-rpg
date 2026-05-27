import { describe, it, expect } from "vitest";
import { transition, isValidTransition, InvalidTransitionError } from "./state-machine";
import {
  applyWorldStateChanges,
  applySanityImpact,
  addDiscoveredItems,
  applyResolution,
} from "./world-state";
import {
  createSession,
  createDefaultGameState,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  isValidSessionShape,
} from "./session";
import { VALID_TRANSITIONS, PILLAR_INSTRUCTION_MAP, CHOICE_PILLAR_MAP } from "./types";
import type { GameSession, GamePhase, GameplayPillar } from "./types";
import type { GameState, Choice, ValidatedAIResponse, StateChange } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import { createMemoryState } from "@/lib/ai";

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    characterId: "char-1",
    pathwayId: 1,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location: "Tingen City",
    activeQuests: [],
    npcsPresent: [],
    ...overrides,
  };
}

function makeSession(overrides: Partial<GameSession> = {}): GameSession {
  return {
    id: "session-1",
    gameState: makeGameState(),
    memory: createMemoryState(),
    turnCount: 0,
    phase: "idle",
    currentNarrative: null,
    currentChoices: null,
    selectedChoiceId: null,
    lastResolution: null,
    activePillar: null,
    errorMessage: null,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeChoices(): Choice[] {
  return [
    { id: "c1", text: "Investigate the alley", type: "investigation" },
    { id: "c2", text: "Talk to the stranger", type: "dialogue" },
    { id: "c3", text: "Perform a ritual", type: "ritual" },
  ];
}

function makeValidatedResponse(
  overrides: Partial<ValidatedAIResponse["response"]> = {},
): ValidatedAIResponse {
  return {
    response: {
      narrative: "The fog thickens around you.",
      ...overrides,
    },
    validation: { valid: true, violations: [] },
  };
}

// ─── VALID_TRANSITIONS ─────────────────────────────────────────────

describe("VALID_TRANSITIONS", () => {
  it("defines transitions for all phases", () => {
    const phases: GamePhase[] = [
      "idle",
      "situation",
      "choices",
      "resolution",
      "consequences",
      "error",
    ];
    for (const phase of phases) {
      expect(VALID_TRANSITIONS[phase]).toBeDefined();
      expect(Array.isArray(VALID_TRANSITIONS[phase])).toBe(true);
    }
  });

  it("idle can only transition to situation", () => {
    expect(VALID_TRANSITIONS.idle).toEqual(["situation"]);
  });

  it("situation can transition to choices or error", () => {
    expect(VALID_TRANSITIONS.situation).toEqual(["choices", "error"]);
  });

  it("choices can transition to resolution or error", () => {
    expect(VALID_TRANSITIONS.choices).toEqual(["resolution", "error"]);
  });

  it("resolution can transition to consequences or error", () => {
    expect(VALID_TRANSITIONS.resolution).toEqual(["consequences", "error"]);
  });

  it("consequences can transition to situation or error", () => {
    expect(VALID_TRANSITIONS.consequences).toEqual(["situation", "error"]);
  });

  it("error can transition to situation or idle", () => {
    expect(VALID_TRANSITIONS.error).toEqual(["situation", "idle"]);
  });
});

// ─── PILLAR & CHOICE MAPS ──────────────────────────────────────────

describe("PILLAR_INSTRUCTION_MAP", () => {
  it("maps all pillars to instruction types", () => {
    const pillars: GameplayPillar[] = ["investigation", "social", "divination", "combat"];
    for (const pillar of pillars) {
      expect(PILLAR_INSTRUCTION_MAP[pillar]).toBeDefined();
    }
  });

  it("maps investigation to narrative", () => {
    expect(PILLAR_INSTRUCTION_MAP.investigation).toBe("narrative");
  });

  it("maps social to narrative", () => {
    expect(PILLAR_INSTRUCTION_MAP.social).toBe("narrative");
  });

  it("maps divination to evaluation", () => {
    expect(PILLAR_INSTRUCTION_MAP.divination).toBe("evaluation");
  });

  it("maps combat to combat", () => {
    expect(PILLAR_INSTRUCTION_MAP.combat).toBe("combat");
  });
});

describe("CHOICE_PILLAR_MAP", () => {
  it("maps investigation choice to investigation pillar", () => {
    expect(CHOICE_PILLAR_MAP.investigation).toBe("investigation");
  });

  it("maps dialogue choice to social pillar", () => {
    expect(CHOICE_PILLAR_MAP.dialogue).toBe("social");
  });

  it("maps ritual choice to divination pillar", () => {
    expect(CHOICE_PILLAR_MAP.ritual).toBe("divination");
  });

  it("maps action choice to combat pillar", () => {
    expect(CHOICE_PILLAR_MAP.action).toBe("combat");
  });
});

// ─── isValidTransition ─────────────────────────────────────────────

describe("isValidTransition", () => {
  it("returns true for valid transitions", () => {
    expect(isValidTransition("idle", "situation")).toBe(true);
    expect(isValidTransition("situation", "choices")).toBe(true);
    expect(isValidTransition("choices", "resolution")).toBe(true);
    expect(isValidTransition("resolution", "consequences")).toBe(true);
    expect(isValidTransition("consequences", "situation")).toBe(true);
    expect(isValidTransition("error", "situation")).toBe(true);
    expect(isValidTransition("error", "idle")).toBe(true);
  });

  it("returns false for invalid transitions", () => {
    expect(isValidTransition("idle", "choices")).toBe(false);
    expect(isValidTransition("idle", "resolution")).toBe(false);
    expect(isValidTransition("idle", "consequences")).toBe(false);
    expect(isValidTransition("idle", "error")).toBe(false);
    expect(isValidTransition("situation", "idle")).toBe(false);
    expect(isValidTransition("choices", "situation")).toBe(false);
    expect(isValidTransition("consequences", "idle")).toBe(false);
  });
});

// ─── transition (state machine) ────────────────────────────────────

describe("transition", () => {
  const NOW = 2000;

  describe("START_SITUATION", () => {
    it("transitions from idle to situation", () => {
      const session = makeSession({ phase: "idle" });
      const next = transition(session, { type: "START_SITUATION" }, NOW);

      expect(next.phase).toBe("situation");
      expect(next.currentNarrative).toBeNull();
      expect(next.currentChoices).toBeNull();
      expect(next.selectedChoiceId).toBeNull();
      expect(next.lastResolution).toBeNull();
      expect(next.errorMessage).toBeNull();
      expect(next.updatedAt).toBe(NOW);
    });

    it("clears previous state when starting new situation", () => {
      const session = makeSession({
        phase: "consequences",
        currentNarrative: "old",
        currentChoices: makeChoices(),
        selectedChoiceId: "c1",
        lastResolution: makeValidatedResponse(),
        errorMessage: "old error",
      });
      const afterConsequences = transition(session, { type: "APPLY_CONSEQUENCES" }, NOW);
      expect(afterConsequences.currentNarrative).toBeNull();
      expect(afterConsequences.currentChoices).toBeNull();
      expect(afterConsequences.selectedChoiceId).toBeNull();
      expect(afterConsequences.lastResolution).toBeNull();
    });

    it("throws InvalidTransitionError from choices phase", () => {
      const session = makeSession({ phase: "choices" });
      expect(() => transition(session, { type: "START_SITUATION" }, NOW)).toThrow(
        InvalidTransitionError,
      );
    });

    it("throws InvalidTransitionError from resolution phase", () => {
      const session = makeSession({ phase: "resolution" });
      expect(() => transition(session, { type: "START_SITUATION" }, NOW)).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe("SITUATION_READY", () => {
    it("transitions from situation to choices with narrative and choices", () => {
      const choices = makeChoices();
      const session = makeSession({ phase: "situation" });
      const next = transition(
        session,
        {
          type: "SITUATION_READY",
          narrative: "A dark alley stretches before you.",
          choices,
        },
        NOW,
      );

      expect(next.phase).toBe("choices");
      expect(next.currentNarrative).toBe("A dark alley stretches before you.");
      expect(next.currentChoices).toEqual(choices);
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws from idle phase", () => {
      const session = makeSession({ phase: "idle" });
      expect(() =>
        transition(
          session,
          {
            type: "SITUATION_READY",
            narrative: "test",
            choices: makeChoices(),
          },
          NOW,
        ),
      ).toThrow(InvalidTransitionError);
    });
  });

  describe("SELECT_CHOICE", () => {
    it("transitions from choices to resolution with valid choice", () => {
      const choices = makeChoices();
      const session = makeSession({
        phase: "choices",
        currentChoices: choices,
      });
      const next = transition(session, { type: "SELECT_CHOICE", choiceId: "c2" }, NOW);

      expect(next.phase).toBe("resolution");
      expect(next.selectedChoiceId).toBe("c2");
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws for invalid choice ID", () => {
      const session = makeSession({
        phase: "choices",
        currentChoices: makeChoices(),
      });
      expect(() =>
        transition(session, { type: "SELECT_CHOICE", choiceId: "nonexistent" }, NOW),
      ).toThrow("Invalid choice ID: nonexistent");
    });

    it("throws for null choices", () => {
      const session = makeSession({
        phase: "choices",
        currentChoices: null,
      });
      expect(() =>
        transition(session, { type: "SELECT_CHOICE", choiceId: "c1" }, NOW),
      ).toThrow("Invalid choice ID: c1");
    });

    it("throws from idle phase", () => {
      const session = makeSession({ phase: "idle" });
      expect(() =>
        transition(session, { type: "SELECT_CHOICE", choiceId: "c1" }, NOW),
      ).toThrow(InvalidTransitionError);
    });
  });

  describe("RESOLUTION_READY", () => {
    it("transitions from resolution to consequences", () => {
      const result = makeValidatedResponse();
      const session = makeSession({ phase: "resolution" });
      const next = transition(session, { type: "RESOLUTION_READY", result }, NOW);

      expect(next.phase).toBe("consequences");
      expect(next.lastResolution).toEqual(result);
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws from choices phase", () => {
      const session = makeSession({ phase: "choices" });
      expect(() =>
        transition(
          session,
          { type: "RESOLUTION_READY", result: makeValidatedResponse() },
          NOW,
        ),
      ).toThrow(InvalidTransitionError);
    });
  });

  describe("APPLY_CONSEQUENCES", () => {
    it("transitions from consequences to situation and increments turn", () => {
      const session = makeSession({
        phase: "consequences",
        turnCount: 3,
        lastResolution: makeValidatedResponse(),
      });
      const next = transition(session, { type: "APPLY_CONSEQUENCES" }, NOW);

      expect(next.phase).toBe("situation");
      expect(next.turnCount).toBe(4);
      expect(next.currentNarrative).toBeNull();
      expect(next.currentChoices).toBeNull();
      expect(next.selectedChoiceId).toBeNull();
      expect(next.lastResolution).toBeNull();
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws from idle phase", () => {
      const session = makeSession({ phase: "idle" });
      expect(() => transition(session, { type: "APPLY_CONSEQUENCES" }, NOW)).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe("ERROR", () => {
    it("transitions to error from any phase", () => {
      const phases: GamePhase[] = [
        "idle",
        "situation",
        "choices",
        "resolution",
        "consequences",
      ];
      for (const phase of phases) {
        const session = makeSession({ phase });
        const next = transition(
          session,
          { type: "ERROR", message: "Something broke" },
          NOW,
        );
        expect(next.phase).toBe("error");
        expect(next.errorMessage).toBe("Something broke");
        expect(next.updatedAt).toBe(NOW);
      }
    });

    it("can transition from error to error", () => {
      const session = makeSession({
        phase: "error",
        errorMessage: "first error",
      });
      const next = transition(session, { type: "ERROR", message: "second error" }, NOW);
      expect(next.phase).toBe("error");
      expect(next.errorMessage).toBe("second error");
    });
  });

  describe("RETRY", () => {
    it("transitions from error to situation", () => {
      const session = makeSession({
        phase: "error",
        errorMessage: "AI failed",
      });
      const next = transition(session, { type: "RETRY" }, NOW);

      expect(next.phase).toBe("situation");
      expect(next.errorMessage).toBeNull();
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws from idle phase", () => {
      const session = makeSession({ phase: "idle" });
      expect(() => transition(session, { type: "RETRY" }, NOW)).toThrow(
        InvalidTransitionError,
      );
    });

    it("throws from choices phase", () => {
      const session = makeSession({ phase: "choices" });
      expect(() => transition(session, { type: "RETRY" }, NOW)).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe("immutability", () => {
    it("does not mutate the original session", () => {
      const session = makeSession({ phase: "idle" });
      const original = { ...session };
      transition(session, { type: "START_SITUATION" }, NOW);

      expect(session.phase).toBe(original.phase);
      expect(session.updatedAt).toBe(original.updatedAt);
    });
  });

  describe("InvalidTransitionError", () => {
    it("includes from and to phases in the error", () => {
      const err = new InvalidTransitionError("idle", "consequences");
      expect(err.from).toBe("idle");
      expect(err.to).toBe("consequences");
      expect(err.name).toBe("InvalidTransitionError");
      expect(err.message).toContain("idle");
      expect(err.message).toContain("consequences");
    });
  });

  describe("full game loop cycle", () => {
    it("completes a full loop: idle → situation → choices → resolution → consequences → situation", () => {
      const choices = makeChoices();
      const result = makeValidatedResponse();

      let session = makeSession({ phase: "idle" });

      session = transition(session, { type: "START_SITUATION" }, 1000);
      expect(session.phase).toBe("situation");

      session = transition(
        session,
        { type: "SITUATION_READY", narrative: "The street is dark.", choices },
        2000,
      );
      expect(session.phase).toBe("choices");

      session = transition(session, { type: "SELECT_CHOICE", choiceId: "c1" }, 3000);
      expect(session.phase).toBe("resolution");

      session = transition(session, { type: "RESOLUTION_READY", result }, 4000);
      expect(session.phase).toBe("consequences");

      session = transition(session, { type: "APPLY_CONSEQUENCES" }, 5000);
      expect(session.phase).toBe("situation");
      expect(session.turnCount).toBe(1);
    });

    it("handles error and retry mid-loop", () => {
      let session = makeSession({ phase: "situation" });

      session = transition(session, { type: "ERROR", message: "Network failed" }, 1000);
      expect(session.phase).toBe("error");

      session = transition(session, { type: "RETRY" }, 2000);
      expect(session.phase).toBe("situation");
      expect(session.errorMessage).toBeNull();
    });
  });
});

// ─── applyWorldStateChanges ────────────────────────────────────────

describe("applyWorldStateChanges", () => {
  it("updates location", () => {
    const state = makeGameState({ location: "Tingen City" });
    const changes: StateChange[] = [
      {
        field: "location",
        oldValue: "Tingen City",
        newValue: "Backlund",
        reason: "Traveled",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.location).toBe("Backlund");
  });

  it("updates activeQuests", () => {
    const state = makeGameState({ activeQuests: ["quest-1"] });
    const changes: StateChange[] = [
      {
        field: "activeQuests",
        oldValue: ["quest-1"],
        newValue: ["quest-1", "quest-2"],
        reason: "New quest",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.activeQuests).toEqual(["quest-1", "quest-2"]);
  });

  it("updates npcsPresent", () => {
    const state = makeGameState({ npcsPresent: [] });
    const changes: StateChange[] = [
      {
        field: "npcsPresent",
        oldValue: [],
        newValue: ["Dunn Smith", "Leonard Mitchell"],
        reason: "NPCs arrived",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.npcsPresent).toEqual(["Dunn Smith", "Leonard Mitchell"]);
  });

  it("ignores non-mutable fields", () => {
    const state = makeGameState({
      pathwayId: 1,
      sequenceLevel: 9,
      maxSanity: 100,
    });
    const changes: StateChange[] = [
      {
        field: "pathwayId",
        oldValue: 1,
        newValue: 2,
        reason: "Hack attempt",
      },
      {
        field: "sequenceLevel",
        oldValue: 9,
        newValue: 1,
        reason: "Hack attempt",
      },
      {
        field: "maxSanity",
        oldValue: 100,
        newValue: 999,
        reason: "Hack attempt",
      },
      {
        field: "characterId",
        oldValue: "char-1",
        newValue: "hacked",
        reason: "Hack attempt",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.pathwayId).toBe(1);
    expect(next.sequenceLevel).toBe(9);
    expect(next.maxSanity).toBe(100);
    expect(next.characterId).toBe("char-1");
  });

  it("handles multiple changes", () => {
    const state = makeGameState();
    const changes: StateChange[] = [
      {
        field: "location",
        oldValue: "Tingen City",
        newValue: "Chanis Gate",
        reason: "Moved",
      },
      {
        field: "npcsPresent",
        oldValue: [],
        newValue: ["Old Neil"],
        reason: "Met NPC",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.location).toBe("Chanis Gate");
    expect(next.npcsPresent).toEqual(["Old Neil"]);
  });

  it("handles empty changes array", () => {
    const state = makeGameState();
    const next = applyWorldStateChanges(state, []);
    expect(next).toEqual(state);
  });

  it("does not mutate the original state", () => {
    const state = makeGameState({ location: "Tingen City" });
    applyWorldStateChanges(state, [
      {
        field: "location",
        oldValue: "Tingen City",
        newValue: "Backlund",
        reason: "Moved",
      },
    ]);
    expect(state.location).toBe("Tingen City");
  });

  it("ignores activeQuests change when newValue is not an array", () => {
    const state = makeGameState({ activeQuests: ["q1"] });
    const changes: StateChange[] = [
      {
        field: "activeQuests",
        oldValue: ["q1"],
        newValue: "not-an-array",
        reason: "Bad data",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.activeQuests).toEqual(["q1"]);
  });

  it("ignores npcsPresent change when newValue is not an array", () => {
    const state = makeGameState({ npcsPresent: ["npc1"] });
    const changes: StateChange[] = [
      {
        field: "npcsPresent",
        oldValue: ["npc1"],
        newValue: "not-an-array",
        reason: "Bad data",
      },
    ];
    const next = applyWorldStateChanges(state, changes);
    expect(next.npcsPresent).toEqual(["npc1"]);
  });
});

// ─── applySanityImpact ─────────────────────────────────────────────

describe("applySanityImpact", () => {
  it("applies negative sanity impact", () => {
    const state = makeGameState({ sanity: 80, maxSanity: 100 });
    const next = applySanityImpact(state, -15);
    expect(next.sanity).toBe(65);
  });

  it("applies positive sanity impact", () => {
    const state = makeGameState({ sanity: 60, maxSanity: 100 });
    const next = applySanityImpact(state, 10);
    expect(next.sanity).toBe(70);
  });

  it("clamps sanity to zero", () => {
    const state = makeGameState({ sanity: 5, maxSanity: 100 });
    const next = applySanityImpact(state, -20);
    expect(next.sanity).toBe(0);
  });

  it("clamps sanity to maxSanity", () => {
    const state = makeGameState({ sanity: 95, maxSanity: 100 });
    const next = applySanityImpact(state, 20);
    expect(next.sanity).toBe(100);
  });

  it("handles zero impact", () => {
    const state = makeGameState({ sanity: 50, maxSanity: 100 });
    const next = applySanityImpact(state, 0);
    expect(next.sanity).toBe(50);
  });

  it("does not mutate the original state", () => {
    const state = makeGameState({ sanity: 80 });
    applySanityImpact(state, -10);
    expect(state.sanity).toBe(80);
  });
});

// ─── addDiscoveredItems ────────────────────────────────────────────

describe("addDiscoveredItems", () => {
  const potionFormula: Item = {
    name: "Seer Potion Formula",
    description: "Formula for the Sequence 9 Seer potion",
    category: "potion-formula",
  };

  const mainIngredient: Item = {
    name: "Stellar Aqua Crystal",
    description: "A crystal infused with stellar energy",
    category: "main-ingredient",
  };

  it("adds items to empty inventory", () => {
    const state = makeGameState({ inventory: [] });
    const next = addDiscoveredItems(state, [potionFormula]);
    expect(next.inventory).toHaveLength(1);
    expect(next.inventory[0]).toEqual(potionFormula);
  });

  it("appends items to existing inventory", () => {
    const state = makeGameState({ inventory: [potionFormula] });
    const next = addDiscoveredItems(state, [mainIngredient]);
    expect(next.inventory).toHaveLength(2);
    expect(next.inventory[0]).toEqual(potionFormula);
    expect(next.inventory[1]).toEqual(mainIngredient);
  });

  it("handles empty items array", () => {
    const state = makeGameState({ inventory: [potionFormula] });
    const next = addDiscoveredItems(state, []);
    expect(next.inventory).toHaveLength(1);
  });

  it("does not mutate the original state", () => {
    const state = makeGameState({ inventory: [] });
    addDiscoveredItems(state, [potionFormula]);
    expect(state.inventory).toHaveLength(0);
  });
});

// ─── applyResolution ───────────────────────────────────────────────

describe("applyResolution", () => {
  it("applies sanity impact from resolution", () => {
    const state = makeGameState({ sanity: 80 });
    const memory = createMemoryState();
    const result = makeValidatedResponse({ sanityImpact: -10 });

    const { gameState } = applyResolution(state, memory, result, 0, "Look around");
    expect(gameState.sanity).toBe(70);
  });

  it("applies world state changes from resolution", () => {
    const state = makeGameState({ location: "Tingen City" });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      worldStateChanges: [
        {
          field: "location",
          oldValue: "Tingen City",
          newValue: "Chanis Gate",
          reason: "Walked to Chanis Gate",
        },
      ],
    });

    const { gameState } = applyResolution(state, memory, result, 0, "Go to Chanis Gate");
    expect(gameState.location).toBe("Chanis Gate");
  });

  it("adds discovered items from resolution", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      itemsDiscovered: [
        {
          name: "Ancient Diary",
          description: "A dusty leather-bound diary",
          category: "supplementary-ingredient",
        },
      ],
    });

    const { gameState } = applyResolution(state, memory, result, 0, "Search the desk");
    expect(gameState.inventory).toHaveLength(1);
    expect(gameState.inventory[0].name).toBe("Ancient Diary");
  });

  it("updates memory with the new turn", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse();

    const { memory: newMemory } = applyResolution(
      state,
      memory,
      result,
      0,
      "Look around",
    );
    expect(newMemory.immediateTurns).toHaveLength(1);
    expect(newMemory.immediateTurns[0].turnNumber).toBe(0);
    expect(newMemory.immediateTurns[0].playerAction).toBe("Look around");
  });

  it("applies all changes together", () => {
    const state = makeGameState({
      sanity: 90,
      location: "Tingen City",
      inventory: [],
    });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      sanityImpact: -5,
      worldStateChanges: [
        {
          field: "location",
          oldValue: "Tingen City",
          newValue: "Blackthorn Security Company",
          reason: "Walked there",
        },
        {
          field: "npcsPresent",
          oldValue: [],
          newValue: ["Dunn Smith"],
          reason: "Captain is present",
        },
      ],
      itemsDiscovered: [
        {
          name: "Case File",
          description: "A mysterious case file",
          category: "supplementary-ingredient",
        },
      ],
    });

    const { gameState, memory: newMemory } = applyResolution(
      state,
      memory,
      result,
      1,
      "Enter the office",
    );
    expect(gameState.sanity).toBe(85);
    expect(gameState.location).toBe("Blackthorn Security Company");
    expect(gameState.npcsPresent).toEqual(["Dunn Smith"]);
    expect(gameState.inventory).toHaveLength(1);
    expect(newMemory.immediateTurns).toHaveLength(1);
  });

  it("handles response with no optional fields", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse();

    const { gameState, memory: newMemory } = applyResolution(
      state,
      memory,
      result,
      0,
      "Wait",
    );
    expect(gameState.sanity).toBe(state.sanity);
    expect(gameState.location).toBe(state.location);
    expect(gameState.inventory).toEqual([]);
    expect(newMemory.immediateTurns).toHaveLength(1);
  });

  it("does not mutate original gameState or memory", () => {
    const state = makeGameState({ sanity: 80, inventory: [] });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      sanityImpact: -10,
      itemsDiscovered: [
        {
          name: "Key",
          description: "Rusty key",
          category: "supplementary-ingredient",
        },
      ],
    });

    applyResolution(state, memory, result, 0, "Search");
    expect(state.sanity).toBe(80);
    expect(state.inventory).toHaveLength(0);
    expect(memory.immediateTurns).toHaveLength(0);
  });

  it("handles empty worldStateChanges array", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({ worldStateChanges: [] });

    const { gameState } = applyResolution(state, memory, result, 0, "Wait");
    expect(gameState).toEqual(state);
  });

  it("handles empty itemsDiscovered array", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({ itemsDiscovered: [] });

    const { gameState } = applyResolution(state, memory, result, 0, "Wait");
    expect(gameState.inventory).toEqual([]);
  });
});

// ─── createSession ─────────────────────────────────────────────────

describe("createSession", () => {
  it("creates a session with defaults", () => {
    const gameState = makeGameState();
    const session = createSession(gameState, "test-id", 5000);

    expect(session.id).toBe("test-id");
    expect(session.gameState).toEqual(gameState);
    expect(session.memory.immediateTurns).toEqual([]);
    expect(session.memory.recentSummaries).toEqual([]);
    expect(session.memory.sessionFacts).toEqual([]);
    expect(session.turnCount).toBe(0);
    expect(session.phase).toBe("idle");
    expect(session.currentNarrative).toBeNull();
    expect(session.currentChoices).toBeNull();
    expect(session.selectedChoiceId).toBeNull();
    expect(session.lastResolution).toBeNull();
    expect(session.activePillar).toBeNull();
    expect(session.errorMessage).toBeNull();
    expect(session.createdAt).toBe(5000);
    expect(session.updatedAt).toBe(5000);
  });

  it("generates a UUID if no id provided", () => {
    const gameState = makeGameState();
    const session = createSession(gameState);
    expect(session.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});

// ─── createDefaultGameState ────────────────────────────────────────

describe("createDefaultGameState", () => {
  it("creates a default game state for a pathway", () => {
    const state = createDefaultGameState(1, "char-test");

    expect(state.characterId).toBe("char-test");
    expect(state.pathwayId).toBe(1);
    expect(state.sequenceLevel).toBe(9);
    expect(state.sanity).toBe(100);
    expect(state.maxSanity).toBe(100);
    expect(state.inventory).toEqual([]);
    expect(state.location).toBe("Tingen City");
    expect(state.activeQuests).toEqual([]);
    expect(state.npcsPresent).toEqual([]);
  });

  it("generates a UUID characterId if none provided", () => {
    const state = createDefaultGameState(2);
    expect(state.characterId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("works with different pathway IDs", () => {
    expect(createDefaultGameState(1, "c1").pathwayId).toBe(1);
    expect(createDefaultGameState(2, "c2").pathwayId).toBe(2);
    expect(createDefaultGameState(3, "c3").pathwayId).toBe(3);
    expect(createDefaultGameState(4, "c4").pathwayId).toBe(4);
  });
});

// ─── sessionToSummary ──────────────────────────────────────────────

describe("sessionToSummary", () => {
  it("extracts summary from session", () => {
    const session = makeSession({
      turnCount: 5,
      phase: "choices",
      gameState: makeGameState({
        location: "Backlund",
        pathwayId: 2,
        sequenceLevel: 7,
      }),
      updatedAt: 9999,
    });
    const summary = sessionToSummary(session);

    expect(summary.id).toBe("session-1");
    expect(summary.turnCount).toBe(5);
    expect(summary.phase).toBe("choices");
    expect(summary.location).toBe("Backlund");
    expect(summary.pathwayId).toBe(2);
    expect(summary.sequenceLevel).toBe(7);
    expect(summary.updatedAt).toBe(9999);
  });
});

// ─── serializeSession / deserializeSession ─────────────────────────

describe("serializeSession", () => {
  it("produces valid JSON", () => {
    const session = makeSession();
    const json = serializeSession(session);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("round-trips correctly", () => {
    const session = makeSession({
      turnCount: 3,
      phase: "choices",
      currentNarrative: "A foggy night.",
      currentChoices: makeChoices(),
    });
    const json = serializeSession(session);
    const restored = deserializeSession(json);
    expect(restored).toEqual(session);
  });
});

describe("deserializeSession", () => {
  it("returns null for invalid JSON", () => {
    expect(deserializeSession("not json")).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(deserializeSession('"string"')).toBeNull();
    expect(deserializeSession("42")).toBeNull();
    expect(deserializeSession("null")).toBeNull();
    expect(deserializeSession("[]")).toBeNull();
  });

  it("returns null for missing required fields", () => {
    expect(deserializeSession("{}")).toBeNull();
    expect(deserializeSession('{"id": "x"}')).toBeNull();
  });

  it("returns null for invalid phase", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.phase = "invalid-phase";
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null for negative turnCount", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.turnCount = -1;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null for missing gameState fields", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    delete modified.gameState.characterId;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null for missing memory fields", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    delete modified.memory.immediateTurns;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null when gameState is null", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.gameState = null;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null when memory is null", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.memory = null;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("returns null for empty id", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.id = "";
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });
});

// ─── isValidSessionShape ───────────────────────────────────────────

describe("isValidSessionShape", () => {
  it("returns true for valid session object", () => {
    expect(isValidSessionShape(makeSession())).toBe(true);
  });

  it("returns false for null", () => {
    expect(isValidSessionShape(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isValidSessionShape([])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isValidSessionShape("string")).toBe(false);
    expect(isValidSessionShape(42)).toBe(false);
    expect(isValidSessionShape(true)).toBe(false);
    expect(isValidSessionShape(undefined)).toBe(false);
  });

  it("validates gameState required fields", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, pathwayId: "not-a-number" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState array fields", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, inventory: "not-an-array" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState activeQuests is array", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, activeQuests: "not-array" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState npcsPresent is array", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, npcsPresent: "not-array" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates memory required fields", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      memory: { immediateTurns: [], recentSummaries: [], sessionFacts: 42 },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates memory recentSummaries is array", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      memory: {
        immediateTurns: [],
        recentSummaries: "not-array",
        sessionFacts: [],
      },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates memory is an object", () => {
    const session = makeSession();
    const invalid = { ...session, memory: "not-object" };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState sanity is number", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, sanity: "high" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState maxSanity is number", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, maxSanity: null },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState location is string", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, location: 42 },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates gameState sequenceLevel is number", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: { ...session.gameState, sequenceLevel: "nine" },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates id is string", () => {
    const session = makeSession();
    const invalid = { ...session, id: 42 };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates createdAt is number", () => {
    const session = makeSession();
    const invalid = { ...session, createdAt: "today" };
    expect(isValidSessionShape(invalid)).toBe(false);
  });

  it("validates updatedAt is number", () => {
    const session = makeSession();
    const invalid = { ...session, updatedAt: "now" };
    expect(isValidSessionShape(invalid)).toBe(false);
  });
});
