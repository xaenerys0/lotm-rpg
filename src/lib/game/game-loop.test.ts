import { describe, it, expect } from "vitest";
import { transition, isValidTransition, InvalidTransitionError } from "./state-machine";
import {
  applyWorldStateChanges,
  applySanityImpact,
  addDiscoveredItems,
  partitionDiscoveredItems,
  discoveredItemLeadFact,
  applyDigestion,
  applyResolution,
  narrationOnly,
  gateLocationChange,
  isInvoluntaryMoveCause,
  INVOLUNTARY_MOVE_CAUSES,
  type ApplyWorldStateOptions,
} from "./world-state";
import { createDigestionState } from "./digestion";
import { createActingMethodState, type ActingMethodState } from "./acting-method";
import { emptyTrackedNpcState } from "./tracked-npcs";
import { FUNDS_DISCOVERED_CAP } from "./marketplace";
import {
  advanceCanonPosition,
  createSession,
  DEFAULT_CANON_POSITION,
  createDefaultGameState,
  sessionToSummary,
  serializeSession,
  deserializeSession,
  isValidSessionShape,
  isValidDigestionShape,
  isValidInjuriesShape,
} from "./session";
import { selectStartScenario } from "@/lib/lore";
import { VALID_TRANSITIONS, PILLAR_INSTRUCTION_MAP, CHOICE_PILLAR_MAP } from "./types";
import type { GameSession, GamePhase, GameplayPillar } from "./types";
import type {
  GameState,
  Choice,
  ValidatedAIResponse,
  StateChange,
  MemoryState,
} from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import { createMemoryState, DEFAULT_EMBEDDING_MODEL_ID } from "@/lib/ai";

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
    canonPosition: 1,
    embeddingModelId: DEFAULT_EMBEDDING_MODEL_ID,
    phase: "idle",
    currentNarrative: null,
    currentChoices: null,
    selectedChoiceId: null,
    lastResolution: null,
    activePillar: null,
    errorMessage: null,
    errorCode: null,
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

// Thin wrapper so the existing applyResolution cases (which predate the
// issue-#95 acting-method param) keep their positional calls; the param has no
// default in the engine itself (the compiler must flag callers there).
function applyRes(
  state: GameState,
  memory: MemoryState,
  result: ValidatedAIResponse,
  turn: number,
  action: string,
  acting: ActingMethodState = createActingMethodState(),
  epoch: number | undefined = undefined,
  trackedNpcState = emptyTrackedNpcState(),
  movementGateEnabled = true,
): ReturnType<typeof applyResolution> {
  return applyResolution(
    state,
    memory,
    result,
    turn,
    action,
    acting,
    epoch,
    trackedNpcState,
    movementGateEnabled,
  );
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

  it("idle can transition to situation or error", () => {
    expect(VALID_TRANSITIONS.idle).toEqual(["situation", "error"]);
  });

  it("situation can transition to choices or error", () => {
    expect(VALID_TRANSITIONS.situation).toEqual(["choices", "error"]);
  });

  it("choices can transition to resolution, consequences, or error", () => {
    expect(VALID_TRANSITIONS.choices).toEqual(["resolution", "consequences", "error"]);
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
    expect(isValidTransition("idle", "error")).toBe(true);
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

    it("throws from situation phase", () => {
      const session = makeSession({ phase: "situation" });
      expect(() =>
        transition(
          session,
          { type: "RESOLUTION_READY", result: makeValidatedResponse() },
          NOW,
        ),
      ).toThrow(InvalidTransitionError);
    });
  });

  describe("ENGINE_RESOLUTION", () => {
    it("carries an engine-decided narration straight from choices into consequences", () => {
      const result = makeValidatedResponse();
      const session = makeSession({ phase: "choices", selectedChoiceId: "c1" });
      const next = transition(
        session,
        { type: "ENGINE_RESOLUTION", result, playerAction: "I drink and advance." },
        NOW,
      );

      expect(next.phase).toBe("consequences");
      expect(next.lastResolution).toEqual(result);
      expect(next.currentNarrative).toBe(result.response.narrative);
      expect(next.selectedChoiceId).toBeNull();
      expect(next.pendingPlayerAction).toBe("I drink and advance.");
      expect(next.updatedAt).toBe(NOW);
    });

    it("throws from situation phase", () => {
      const session = makeSession({ phase: "situation" });
      expect(() =>
        transition(
          session,
          {
            type: "ENGINE_RESOLUTION",
            result: makeValidatedResponse(),
            playerAction: "x",
          },
          NOW,
        ),
      ).toThrow(InvalidTransitionError);
    });
  });

  describe("APPLY_CONSEQUENCES", () => {
    it("transitions from consequences to situation, increments turn, clears activePillar", () => {
      const session = makeSession({
        phase: "consequences",
        turnCount: 3,
        lastResolution: makeValidatedResponse(),
        activePillar: "combat",
        pendingPlayerAction: "I drink and advance.",
      });
      const next = transition(session, { type: "APPLY_CONSEQUENCES" }, NOW);

      expect(next.phase).toBe("situation");
      expect(next.turnCount).toBe(4);
      expect(next.currentNarrative).toBeNull();
      expect(next.currentChoices).toBeNull();
      expect(next.selectedChoiceId).toBeNull();
      expect(next.lastResolution).toBeNull();
      expect(next.activePillar).toBeNull();
      expect(next.pendingPlayerAction).toBeNull();
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
        expect(next.errorCode).toBeNull();
        expect(next.updatedAt).toBe(NOW);
      }
    });

    it("stores errorCode when provided", () => {
      const session = makeSession({ phase: "situation" });
      const next = transition(
        session,
        { type: "ERROR", message: "Invalid key", errorCode: "AUTH_ERROR" },
        NOW,
      );
      expect(next.errorCode).toBe("AUTH_ERROR");
    });

    it("stores CONFIG_MISSING errorCode", () => {
      const session = makeSession({ phase: "situation" });
      const next = transition(
        session,
        { type: "ERROR", message: "No config", errorCode: "CONFIG_MISSING" },
        NOW,
      );
      expect(next.errorCode).toBe("CONFIG_MISSING");
    });

    it("can transition from error to error", () => {
      const session = makeSession({
        phase: "error",
        errorMessage: "first error",
        errorCode: "AUTH_ERROR",
      });
      const next = transition(session, { type: "ERROR", message: "second error" }, NOW);
      expect(next.phase).toBe("error");
      expect(next.errorMessage).toBe("second error");
      expect(next.errorCode).toBeNull();
    });
  });

  describe("RETRY", () => {
    it("transitions from error to situation and clears stale fields", () => {
      const session = makeSession({
        phase: "error",
        errorMessage: "AI failed",
        errorCode: "AUTH_ERROR",
        currentNarrative: "stale narrative",
        currentChoices: makeChoices(),
        selectedChoiceId: "c1",
        lastResolution: makeValidatedResponse(),
        activePillar: "combat",
      });
      const next = transition(session, { type: "RETRY" }, NOW);

      expect(next.phase).toBe("situation");
      expect(next.errorMessage).toBeNull();
      expect(next.errorCode).toBeNull();
      expect(next.currentNarrative).toBeNull();
      expect(next.currentChoices).toBeNull();
      expect(next.selectedChoiceId).toBeNull();
      expect(next.lastResolution).toBeNull();
      expect(next.activePillar).toBeNull();
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

// Legacy field-allowlist cases predate the issue-#101 movement gate; the gate is
// exercised by its own describe block below. Here we run with the gate OFF and an
// empty roster, so the helper just returns the mutated state (the prior shape).
function applyWSC(
  state: GameState,
  changes: StateChange[],
  opts: Partial<ApplyWorldStateOptions> = {},
): GameState {
  return applyWorldStateChanges(state, changes, {
    epoch: undefined,
    gateEnabled: false,
    trackedNpcState: emptyTrackedNpcState(),
    turnNumber: 0,
    ...opts,
  }).state;
}

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
    const next = applyWSC(state, changes);
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
    const next = applyWSC(state, changes);
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
    const next = applyWSC(state, changes);
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
    const next = applyWSC(state, changes);
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
    const next = applyWSC(state, changes);
    expect(next.location).toBe("Chanis Gate");
    expect(next.npcsPresent).toEqual(["Old Neil"]);
  });

  it("handles empty changes array", () => {
    const state = makeGameState();
    const next = applyWSC(state, []);
    expect(next).toEqual(state);
  });

  it("does not mutate the original state", () => {
    const state = makeGameState({ location: "Tingen City" });
    applyWSC(state, [
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
    const next = applyWSC(state, changes);
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
    const next = applyWSC(state, changes);
    expect(next.npcsPresent).toEqual(["npc1"]);
  });

  it("ignores location change when newValue is not a string", () => {
    const state = makeGameState({ location: "Tingen City" });
    const changes: StateChange[] = [
      {
        field: "location",
        oldValue: "Tingen City",
        newValue: { city: "Backlund" },
        reason: "Bad data",
      },
    ];
    const next = applyWSC(state, changes);
    expect(next.location).toBe("Tingen City");
  });
});

// ─── movement gate (issue #101) ────────────────────────────────────

function locationChange(to: string, involuntaryCause?: string): StateChange {
  return {
    field: "location",
    oldValue: "from",
    newValue: to,
    reason: "the narrator moved you",
    ...(involuntaryCause ? { involuntaryCause } : {}),
  };
}

describe("isInvoluntaryMoveCause", () => {
  it("accepts each known cause and rejects anything else", () => {
    for (const cause of INVOLUNTARY_MOVE_CAUSES) {
      expect(isInvoluntaryMoveCause(cause)).toBe(true);
    }
    expect(isInvoluntaryMoveCause("teleport")).toBe(false);
    expect(isInvoluntaryMoveCause(42)).toBe(false);
    expect(isInvoluntaryMoveCause(undefined)).toBe(false);
  });
});

describe("gateLocationChange", () => {
  const base = { epoch: undefined, turnNumber: 3 };

  it("allows any move when the gate is disabled (still reports crossCity)", () => {
    const r = gateLocationChange({
      ...base,
      from: "Tingen City",
      to: "Bayam",
      gateEnabled: false,
    });
    expect(r).toEqual({ location: "Bayam", blocked: false, crossCity: true });
  });

  it("allows a within-city move (district → landmark)", () => {
    const r = gateLocationChange({
      ...base,
      from: "Zouteland Street",
      to: "The Tussock River docks",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(false);
    expect(r.location).toBe("The Tussock River docks");
    expect(r.fact).toBeUndefined();
  });

  it("allows a move when either endpoint is unrecognised (provisional)", () => {
    const r = gateLocationChange({
      ...base,
      from: "Tingen City",
      to: "A nameless moor",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(false);
    expect(r.location).toBe("A nameless moor");
  });

  it("blocks a cross-city teleport with no cause and keeps the origin", () => {
    const r = gateLocationChange({
      ...base,
      from: "Tingen City",
      to: "Bayam",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(true);
    expect(r.location).toBe("Tingen City");
    expect(r.fact?.type).toBe("event");
    expect(r.fact?.description).toContain("Tingen City");
    expect(r.fact?.turnNumber).toBe(3);
  });

  it("permits a cross-city move with a valid involuntary cause", () => {
    const r = gateLocationChange({
      ...base,
      from: "Tingen City",
      to: "Bayam",
      cause: "abduction",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(false);
    expect(r.location).toBe("Bayam");
    expect(r.fact?.description).toContain("Against your will");
  });

  it("blocks a teleport out of a bare district using the tracked city", () => {
    // The location string names no city (a district), but the engine-tracked
    // currentCity anchors the origin so the teleport is still refused.
    const r = gateLocationChange({
      ...base,
      from: "the harbour quarter",
      to: "Bayam",
      fromCity: "tingen",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(true);
    expect(r.location).toBe("the harbour quarter");
    expect(r.fact?.description).toContain("the harbour quarter");
  });

  it("allows a within-city nudge from a district when the tracked city matches", () => {
    const r = gateLocationChange({
      ...base,
      from: "the harbour quarter",
      to: "Tingen City",
      fromCity: "tingen",
      gateEnabled: true,
    });
    expect(r.blocked).toBe(false);
    expect(r.location).toBe("Tingen City");
  });
});

describe("applyWorldStateChanges — movement gate", () => {
  const opts = {
    epoch: undefined,
    gateEnabled: true,
    trackedNpcState: emptyTrackedNpcState(),
    turnNumber: 1,
  };

  it("refuses a cross-city teleport and emits a redirect fact", () => {
    const state = makeGameState({ location: "Tingen City" });
    const { state: next, facts } = applyWorldStateChanges(
      state,
      [locationChange("Bayam")],
      opts,
    );
    expect(next.location).toBe("Tingen City");
    expect(facts).toHaveLength(1);
    expect(facts[0].description).toContain("deliberately");
  });

  it("refuses a teleport out of a bare district by using the tracked currentCity", () => {
    // The character is mid-scene in a district (location names no city), but
    // currentCity still records the city they are actually in — so the narrator
    // cannot teleport them to another city just because the string is a district.
    const state = makeGameState({
      location: "the harbour quarter",
      currentCity: "tingen",
    });
    const { state: next, facts } = applyWorldStateChanges(
      state,
      [locationChange("Bayam")],
      opts,
    );
    expect(next.location).toBe("the harbour quarter");
    expect(next.currentCity).toBe("tingen");
    expect(facts).toHaveLength(1);
    expect(facts[0].description).toContain("deliberately");
  });

  it("applies an against-the-will cross-city move with the cause", () => {
    const state = makeGameState({ location: "Tingen City" });
    const { state: next, facts } = applyWorldStateChanges(
      state,
      [locationChange("Bayam", "abduction")],
      opts,
    );
    expect(next.location).toBe("Bayam");
    expect(facts[0].description).toContain("Against your will");
  });

  it("ignores an unknown involuntary cause (still blocked)", () => {
    const state = makeGameState({ location: "Tingen City" });
    const { state: next } = applyWorldStateChanges(
      state,
      [locationChange("Bayam", "because-i-said-so")],
      opts,
    );
    expect(next.location).toBe("Tingen City");
  });

  it("leaves the origin scene behind on a cross-city move, keeping only followers", () => {
    const state = makeGameState({
      location: "Tingen City",
      npcsPresent: ["A passerby"],
    });
    const roster = {
      roster: [
        { name: "Old Neil", disposition: "ally" as const, follows: true },
        { name: "A rival", disposition: "hostile" as const, follows: false },
      ],
    };
    const { state: next } = applyWorldStateChanges(
      state,
      [locationChange("Bayam", "forced-passage")],
      { ...opts, trackedNpcState: roster },
    );
    expect(next.location).toBe("Bayam");
    expect(next.npcsPresent).toEqual(["Old Neil"]);
  });

  it("preserves the scene cast on a within-city move, adding followers", () => {
    const state = makeGameState({
      location: "Zouteland Street",
      npcsPresent: ["A passerby"],
    });
    const roster = {
      roster: [{ name: "Old Neil", disposition: "ally" as const, follows: true }],
    };
    const { state: next } = applyWorldStateChanges(
      state,
      [
        {
          field: "location",
          oldValue: "Zouteland Street",
          newValue: "The Tussock docks",
          reason: "walked over",
        },
      ],
      { ...opts, epoch: 5, trackedNpcState: roster },
    );
    expect(next.location).toBe("The Tussock docks");
    // The passerby is NOT wiped by a local nudge; the follower is ensured present.
    expect(next.npcsPresent).toEqual(["A passerby", "Old Neil"]);
  });

  it("updates currentCity on a cross-city move but preserves it on a local nudge", () => {
    const state = makeGameState({
      location: "Backlund",
      currentCity: "backlund",
      epoch: 5,
    });
    // Involuntary cross-city move → currentCity follows to the new city.
    const moved = applyWorldStateChanges(state, [locationChange("Bayam", "abduction")], {
      ...opts,
      epoch: 5,
    }).state;
    expect(moved.currentCity).toBe("bayam");

    // A within-city nudge to a bare district string keeps the tracked city.
    const local = applyWorldStateChanges(
      state,
      [
        {
          field: "location",
          oldValue: "Backlund",
          newValue: "The East Borough",
          reason: "walked over",
        },
      ],
      { ...opts, epoch: 5 },
    ).state;
    expect(local.location).toBe("The East Borough");
    expect(local.currentCity).toBe("backlund");
  });

  it("keeps followers authoritative over an AI npcsPresent wipe", () => {
    const state = makeGameState({ npcsPresent: ["Old Neil"] });
    const roster = {
      roster: [{ name: "Old Neil", disposition: "ally" as const, follows: true }],
    };
    const { state: next } = applyWorldStateChanges(
      state,
      [
        {
          field: "npcsPresent",
          oldValue: ["Old Neil"],
          newValue: [],
          reason: "the AI tried to clear the scene",
        },
      ],
      { ...opts, trackedNpcState: roster },
    );
    expect(next.npcsPresent).toEqual(["Old Neil"]);
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

// ─── partitionDiscoveredItems / discoveredItemLeadFact ─────────────

describe("partitionDiscoveredItems", () => {
  const mundane: Item = { name: "Coat", description: "warm", category: "mundane" };
  const formula: Item = {
    name: "Seer Potion Formula",
    description: "recipe",
    category: "potion-formula",
  };
  const main: Item = {
    name: "Crystal",
    description: "characteristic",
    category: "main-ingredient",
  };
  const supp: Item = {
    name: "Herb",
    description: "reagent",
    category: "supplementary-ingredient",
  };

  it("returns empty buckets for no items", () => {
    expect(partitionDiscoveredItems([])).toEqual({ carried: [], blocked: [] });
  });

  it("carries mundane and uniqueness items (narrator-grantable, not reagents)", () => {
    const uniqueness: Item = {
      name: "Fool Uniqueness",
      description: "singular",
      category: "uniqueness",
    };
    expect(partitionDiscoveredItems([mundane, uniqueness])).toEqual({
      carried: [mundane, uniqueness],
      blocked: [],
    });
  });

  it("blocks every advancement-critical category", () => {
    const { carried, blocked } = partitionDiscoveredItems([formula, main, supp]);
    expect(carried).toEqual([]);
    expect(blocked).toEqual([formula, main, supp]);
  });

  it("splits a mixed batch", () => {
    const { carried, blocked } = partitionDiscoveredItems([mundane, formula]);
    expect(carried).toEqual([mundane]);
    expect(blocked).toEqual([formula]);
  });
});

describe("discoveredItemLeadFact", () => {
  it("phrases a formula lead and tags it quest-progress with the turn", () => {
    const fact = discoveredItemLeadFact(
      { name: "Seer Formula", description: "d", category: "potion-formula" },
      3,
    );
    expect(fact.type).toBe("quest-progress");
    expect(fact.turnNumber).toBe(3);
    expect(fact.description).toContain("formula");
    expect(fact.description).toContain("Seer Formula");
  });

  it("phrases a main-ingredient (Characteristic) lead", () => {
    const fact = discoveredItemLeadFact(
      { name: "Devil Eye", description: "d", category: "main-ingredient" },
      0,
    );
    expect(fact.description).toContain("Beyonder Characteristic");
    expect(fact.description).toContain("Devil Eye");
  });

  it("phrases a supplementary-ingredient lead", () => {
    const fact = discoveredItemLeadFact(
      { name: "Rabies Virus", description: "d", category: "supplementary-ingredient" },
      0,
    );
    expect(fact.description).toContain("Rabies Virus");
  });
});

// ─── applyResolution ───────────────────────────────────────────────

describe("applyResolution", () => {
  it("applies the residual sanity impact from resolution (within ±5)", () => {
    const state = makeGameState({ sanity: 80 });
    const memory = createMemoryState();
    const result = makeValidatedResponse({ sanityImpact: -4 });

    const { gameState, sanity } = applyRes(state, memory, result, 0, "Look around");
    expect(gameState.sanity).toBe(76);
    expect(sanity).toEqual({ tagDelta: 0, residual: -4, total: -4 });
  });

  it("clamps the residual sanity impact to ±5 (issue #95)", () => {
    const memory = createMemoryState();
    const drained = applyRes(
      makeGameState({ sanity: 80 }),
      memory,
      makeValidatedResponse({ sanityImpact: -20 }),
      0,
      "Stare into the dark",
    );
    expect(drained.sanity.residual).toBe(-5);
    expect(drained.gameState.sanity).toBe(75);

    const soothed = applyRes(
      makeGameState({ sanity: 80 }),
      memory,
      makeValidatedResponse({ sanityImpact: 99 }),
      0,
      "Bask",
    );
    expect(soothed.sanity.residual).toBe(5);
    expect(soothed.gameState.sanity).toBe(85);
  });

  it("scores tagged sanity events with the engine, summed with the residual", () => {
    const state = makeGameState({ sanity: 50, sequenceLevel: 9 });
    const memory = createMemoryState();
    // rest (+8) + a residual of -1 → +7 total at Seq 9.
    const result = makeValidatedResponse({
      sanityEventTags: ["rest"],
      sanityImpact: -1,
    });
    const { gameState, sanity } = applyRes(state, memory, result, 0, "Sleep");
    expect(sanity.tagDelta).toBe(8);
    expect(sanity.residual).toBe(-1);
    expect(sanity.total).toBe(7);
    expect(gameState.sanity).toBe(57);
  });

  it("scores ability-use/horror tags against the pre-mutation Sequence", () => {
    const state = makeGameState({ sanity: 80, sequenceLevel: 5 });
    const memory = createMemoryState();
    const result = makeValidatedResponse({ sanityEventTags: ["ability-use"] });
    const { sanity } = applyRes(state, memory, result, 0, "Channel power");
    // ability-use at Seq 5 = -(2 + 4*1.5) = -8.
    expect(sanity.tagDelta).toBe(-8);
    expect(sanity.total).toBe(-8);
  });

  it("drops unknown sanity tags rather than scoring them", () => {
    const state = makeGameState({ sanity: 80 });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      sanityEventTags: ["rest", "made-up-tag"],
    });
    const { sanity } = applyRes(state, memory, result, 0, "Rest");
    expect(sanity.tagDelta).toBe(8);
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

    const { gameState } = applyRes(state, memory, result, 0, "Go to Chanis Gate");
    expect(gameState.location).toBe("Chanis Gate");
  });

  it("adds discovered mundane items from resolution", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      itemsDiscovered: [
        {
          name: "Ancient Diary",
          description: "A dusty leather-bound diary",
          category: "mundane",
        },
      ],
    });

    const { gameState } = applyRes(state, memory, result, 0, "Search the desk");
    expect(gameState.inventory).toHaveLength(1);
    expect(gameState.inventory[0].name).toBe("Ancient Diary");
  });

  it("does not add advancement-critical items the AI tried to grant", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      itemsDiscovered: [
        {
          name: "Spectator Potion Formula",
          description: "The recipe for the next potion",
          category: "potion-formula",
        },
        {
          name: "Eyeball of a Devil",
          description: "A Beyonder Characteristic",
          category: "main-ingredient",
        },
        {
          name: "Rabies Virus",
          description: "A supplementary reagent",
          category: "supplementary-ingredient",
        },
      ],
    });

    const { gameState, memory: newMemory } = applyRes(
      state,
      memory,
      result,
      4,
      "Demand the formula",
    );

    // None reached inventory — narration cannot bypass the framework (issue #90).
    expect(gameState.inventory).toHaveLength(0);
    // Each became a quest-progress lead fact instead of a "Discovered" fact.
    const leads = newMemory.sessionFacts.filter((f) => f.type === "quest-progress");
    expect(leads).toHaveLength(3);
    expect(
      newMemory.sessionFacts.some((f) => f.description.startsWith("Discovered")),
    ).toBe(false);
    expect(leads.every((f) => f.turnNumber === 4)).toBe(true);
  });

  it("carries only the mundane items in a mixed discovery and leads the rest", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      itemsDiscovered: [
        { name: "Brass Key", description: "A small key", category: "mundane" },
        {
          name: "Spectator Potion Formula",
          description: "The recipe",
          category: "potion-formula",
        },
      ],
    });

    const { gameState, memory: newMemory } = applyRes(
      state,
      memory,
      result,
      0,
      "Loot the study",
    );

    expect(gameState.inventory.map((i) => i.name)).toEqual(["Brass Key"]);
    expect(
      newMemory.sessionFacts.filter((f) => f.type === "quest-progress"),
    ).toHaveLength(1);
  });

  it("credits money found in the fiction to the wallet", () => {
    const state = makeGameState({ funds: 100 });
    const memory = createMemoryState();
    const result = makeValidatedResponse({ fundsDiscovered: 60 });
    const { gameState } = applyRes(state, memory, result, 0, "Pocket the purse");
    expect(gameState.funds).toBe(160);
  });

  it("clamps a single turn's funds find and floors the wallet at zero on a loss", () => {
    const memory = createMemoryState();
    const huge = applyRes(
      makeGameState({ funds: 0 }),
      memory,
      makeValidatedResponse({ fundsDiscovered: 999999 }),
      0,
      "Claim a fortune",
    );
    expect(huge.gameState.funds).toBe(FUNDS_DISCOVERED_CAP);

    const robbed = applyRes(
      makeGameState({ funds: 50 }),
      memory,
      makeValidatedResponse({ fundsDiscovered: -999999 }),
      0,
      "Get robbed",
    );
    expect(robbed.gameState.funds).toBe(0);
  });

  it("leaves the wallet untouched when no money is found", () => {
    const { gameState } = applyRes(
      makeGameState({ funds: 75 }),
      createMemoryState(),
      makeValidatedResponse({ fundsDiscovered: 0 }),
      0,
      "Wait",
    );
    expect(gameState.funds).toBe(75);
  });

  it("updates memory with the new turn", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse();

    const { memory: newMemory } = applyRes(state, memory, result, 0, "Look around");
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
          category: "mundane",
        },
      ],
    });

    const { gameState, memory: newMemory } = applyRes(
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

    const { gameState, memory: newMemory } = applyRes(state, memory, result, 0, "Wait");
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

    applyRes(state, memory, result, 0, "Search");
    expect(state.sanity).toBe(80);
    expect(state.inventory).toHaveLength(0);
    expect(memory.immediateTurns).toHaveLength(0);
  });

  it("handles empty worldStateChanges array", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({ worldStateChanges: [] });

    const { gameState } = applyRes(state, memory, result, 0, "Wait");
    expect(gameState).toEqual(state);
  });

  it("handles empty itemsDiscovered array", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({ itemsDiscovered: [] });

    const { gameState } = applyRes(state, memory, result, 0, "Wait");
    expect(gameState.inventory).toEqual([]);
  });

  it("advances digestion from an in-character acting evaluation", () => {
    const state = makeGameState({ digestion: createDigestionState(1, 9) });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 1, reasoning: "Perfectly in character" },
    });

    const { gameState, digestionDelta } = applyRes(
      state,
      memory,
      result,
      0,
      "Perform a divination",
    );
    expect(digestionDelta).toBeGreaterThan(0);
    expect(gameState.digestion!.progress).toBe(digestionDelta);
  });

  it("reverses digestion from an out-of-character acting evaluation", () => {
    const state = makeGameState({
      digestion: createDigestionState(1, 9),
    });
    state.digestion!.progress = 40;
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 0, reasoning: "Wholly out of character" },
    });

    const { gameState, digestionDelta } = applyRes(
      state,
      memory,
      result,
      0,
      "Betray the role",
    );
    expect(digestionDelta).toBeLessThan(0);
    expect(gameState.digestion!.progress).toBeLessThan(40);
  });

  it("reports zero digestion delta when there is no acting evaluation", () => {
    const state = makeGameState({ digestion: createDigestionState(1, 9) });
    const memory = createMemoryState();
    const result = makeValidatedResponse();

    const { digestionDelta } = applyRes(state, memory, result, 0, "Wait");
    expect(digestionDelta).toBe(0);
  });

  it("heals combat injuries by one turn of normal play (issue #10)", () => {
    const state = makeGameState({
      injuries: [
        { id: "a", description: "cut", severity: "minor", recoveryTurns: 1 },
        { id: "b", description: "wound", severity: "major", recoveryTurns: 4 },
      ],
    });
    const memory = createMemoryState();
    const result = makeValidatedResponse();

    const { gameState } = applyRes(state, memory, result, 0, "Rest");
    // The 1-turn injury fully recovers and is dropped; the other ticks down.
    expect(gameState.injuries).toEqual([
      { id: "b", description: "wound", severity: "major", recoveryTurns: 3 },
    ]);
  });

  // ─── acting-method discovery (issue #95) ──────────────────────────

  it("discovers the acting method when the AI flags it as taught", () => {
    const state = makeGameState();
    const memory = createMemoryState();
    const result = makeValidatedResponse({ actingMethodTaught: true });
    const out = applyRes(state, memory, result, 0, "Listen to the old Seer");
    expect(out.discovery).toEqual({ discoveredThisTurn: true, trigger: "taught" });
    expect(out.actingMethodState.knowsMethod).toBe(true);
    // A diegetic discovery fact is recorded.
    expect(out.memory.sessionFacts.some((f) => /Acting Method/.test(f.description))).toBe(
      true,
    );
  });

  it("discovers the acting method by repetition after a sustained aligned run", () => {
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 0.9, reasoning: "In role" },
    });
    // One aligned turn short of the threshold.
    const out = applyRes(makeGameState(), memory, result, 0, "Act in character", {
      knowsMethod: false,
      alignedStreak: 5,
    });
    expect(out.discovery).toEqual({ discoveredThisTurn: true, trigger: "repetition" });
    expect(out.actingMethodState.knowsMethod).toBe(true);
  });

  it("does not discover on a low-alignment 'scare' and resets the streak", () => {
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 0.1, reasoning: "Betrayed the role" },
    });
    const out = applyRes(makeGameState(), memory, result, 0, "Break character", {
      knowsMethod: false,
      alignedStreak: 5,
    });
    expect(out.discovery.discoveredThisTurn).toBe(false);
    expect(out.actingMethodState).toEqual({ knowsMethod: false, alignedStreak: 0 });
    expect(out.memory.sessionFacts.some((f) => /Acting Method/.test(f.description))).toBe(
      false,
    );
  });

  it("discovers the method as a backstop when digestion completes", () => {
    // One strong turn finishes a nearly-digested potion with a cold streak.
    const state = makeGameState({
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 95, complete: false },
    });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 1, reasoning: "In role" },
    });
    const out = applyRes(state, memory, result, 0, "Finish the role", {
      knowsMethod: false,
      alignedStreak: 0,
    });
    expect(out.gameState.digestion!.complete).toBe(true);
    expect(out.discovery).toEqual({ discoveredThisTurn: true, trigger: "completion" });
    expect(out.actingMethodState.knowsMethod).toBe(true);
  });

  it("leaves an already-known method untouched and records no fact", () => {
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      actingEvaluation: { alignment: 0.9, reasoning: "In role" },
    });
    const out = applyRes(makeGameState(), memory, result, 0, "Act", {
      knowsMethod: true,
      alignedStreak: 3,
    });
    expect(out.discovery.discoveredThisTurn).toBe(false);
    expect(out.actingMethodState).toEqual({ knowsMethod: true, alignedStreak: 3 });
  });

  it("folds a blocked-teleport redirect fact into memory and keeps the origin", () => {
    const state = makeGameState({ location: "Tingen City" });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      worldStateChanges: [locationChange("Bayam")],
    });
    const out = applyRes(state, memory, result, 0, "Will myself to Bayam");
    // The gate refused the cross-city teleport — origin unchanged.
    expect(out.gameState.location).toBe("Tingen City");
    const descriptions = out.memory.sessionFacts.map((f) => f.description);
    expect(descriptions.some((d) => d.includes("deliberately"))).toBe(true);
  });

  it("lets a within-city move through and brings followers along", () => {
    const state = makeGameState({
      location: "Zouteland Street",
      npcsPresent: ["A passerby"],
    });
    const memory = createMemoryState();
    const result = makeValidatedResponse({
      worldStateChanges: [
        {
          field: "location",
          oldValue: "Zouteland Street",
          newValue: "The Tussock docks",
          reason: "walked over",
        },
      ],
    });
    const roster = {
      roster: [{ name: "Old Neil", disposition: "ally" as const, follows: true }],
    };
    const out = applyRes(
      state,
      memory,
      result,
      0,
      "Walk to the docks",
      createActingMethodState(),
      5,
      roster,
      true,
    );
    expect(out.gameState.location).toBe("The Tussock docks");
    // Within-city nudge preserves the scene cast and ensures the follower.
    expect(out.gameState.npcsPresent).toEqual(["A passerby", "Old Neil"]);
  });
});

// ─── narrationOnly ─────────────────────────────────────────────────

describe("narrationOnly", () => {
  it("keeps only the narrative (and a journal flag), stripping mechanical fields", () => {
    const stripped = narrationOnly({
      narrative: "The role sinks into your bones.",
      journalEntry: { summary: "Advanced.", eventType: "advancement" },
      sanityImpact: -5,
      sanityEventTags: ["horror-encounter"],
      actingEvaluation: { alignment: 1, reasoning: "x" },
      itemsDiscovered: [{ name: "Loot", description: "", category: "mundane" }],
      fundsDiscovered: 999,
      worldStateChanges: [
        { field: "location", oldValue: "Here", newValue: "Elsewhere", reason: "moved" },
      ],
      proposedSelfChange: { field: "name", value: "X" },
    });
    expect(stripped).toEqual({
      narrative: "The role sinks into your bones.",
      journalEntry: { summary: "Advanced.", eventType: "advancement" },
    });
  });

  it("omits the journal flag when the response carries none", () => {
    expect(narrationOnly({ narrative: "Just prose." })).toEqual({
      narrative: "Just prose.",
    });
  });
});

// ─── applyDigestion ────────────────────────────────────────────────

describe("applyDigestion", () => {
  it("seeds digestion when missing on the game state", () => {
    const state = makeGameState();
    expect(state.digestion).toBeUndefined();

    const { state: next, delta } = applyDigestion(state, {
      alignment: 1,
      reasoning: "",
    });
    expect(next.digestion).toBeDefined();
    expect(next.digestion!.pathwayId).toBe(state.pathwayId);
    expect(next.digestion!.sequenceLevel).toBe(state.sequenceLevel);
    expect(delta).toBeGreaterThan(0);
  });

  it("re-seeds digestion when it no longer matches the current potion", () => {
    // Stale digestion from a previous sequence still at high progress.
    const state = makeGameState({
      sequenceLevel: 8,
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 90, complete: false },
    });

    const { state: next } = applyDigestion(state, { alignment: 1, reasoning: "" });
    expect(next.digestion!.sequenceLevel).toBe(8);
    // Re-seeded from zero, so progress is just this turn's gain (not 90+).
    expect(next.digestion!.progress).toBeLessThan(90);
  });

  it("continues an existing matching digestion", () => {
    const state = makeGameState({
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 30, complete: false },
    });

    const { state: next } = applyDigestion(state, { alignment: 1, reasoning: "" });
    expect(next.digestion!.progress).toBeGreaterThan(30);
  });

  it("does not mutate the input state", () => {
    const state = makeGameState({
      digestion: { pathwayId: 1, sequenceLevel: 9, progress: 30, complete: false },
    });
    applyDigestion(state, { alignment: 1, reasoning: "" });
    expect(state.digestion!.progress).toBe(30);
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

// ─── canon position & embedding model lock (issue #63) ─────────────

describe("createSession RAG fields (issue #63)", () => {
  it("seeds the default canon position and locked embedding model", () => {
    const session = createSession(makeGameState(), "id", 1000);
    expect(session.canonPosition).toBe(DEFAULT_CANON_POSITION);
    expect(session.embeddingModelId).toBe(DEFAULT_EMBEDDING_MODEL_ID);
  });

  it("locks an explicitly chosen approved model and start position", () => {
    const session = createSession(makeGameState(), "id", 1000, undefined, {
      embeddingModelId: "bge-m3",
      canonPosition: 250,
    });
    expect(session.embeddingModelId).toBe("bge-m3");
    expect(session.canonPosition).toBe(250);
  });

  it("rejects locking a model that is not on the approved list", () => {
    expect(() =>
      createSession(makeGameState(), "id", 1000, undefined, {
        embeddingModelId: "text-embedding-3-large",
      }),
    ).toThrow(/Unknown embedding model/);
  });
});

describe("advanceCanonPosition", () => {
  it("advances the timeline position and touches updatedAt", () => {
    const session = createSession(makeGameState(), "id", 1000);
    const advanced = advanceCanonPosition(session, 42, 2000);
    expect(advanced.canonPosition).toBe(42);
    expect(advanced.updatedAt).toBe(2000);
    // Pure: the original session is untouched.
    expect(session.canonPosition).toBe(DEFAULT_CANON_POSITION);
  });

  it("is monotonic: regressions and non-finite positions are ignored", () => {
    const session = advanceCanonPosition(
      createSession(makeGameState(), "id", 1000),
      100,
      2000,
    );
    expect(advanceCanonPosition(session, 99, 3000)).toBe(session);
    expect(advanceCanonPosition(session, 100, 3000)).toBe(session);
    expect(advanceCanonPosition(session, Number.NaN, 3000)).toBe(session);
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
    // The tracked current city is seeded from a city-named start (issue #101).
    expect(state.currentCity).toBe("tingen");
    expect(state.activeQuests).toEqual([]);
    expect(state.npcsPresent).toEqual([]);
  });

  it("seeds a fresh digestion state for the starting potion", () => {
    const state = createDefaultGameState(3, "char-test");
    expect(state.digestion).toEqual({
      pathwayId: 3,
      sequenceLevel: 9,
      progress: 0,
      complete: false,
    });
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

  it("stores characterName when provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein Moretti");
    expect(state.characterName).toBe("Klein Moretti");
  });

  it("stores characterBackground when provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "A postal worker.");
    expect(state.characterBackground).toBe("A postal worker.");
  });

  it("omits characterName when not provided", () => {
    const state = createDefaultGameState(1, "c1");
    expect(state.characterName).toBeUndefined();
  });

  it("omits characterBackground when not provided", () => {
    const state = createDefaultGameState(1, "c1");
    expect(state.characterBackground).toBeUndefined();
  });

  it("omits characterName when empty string provided", () => {
    const state = createDefaultGameState(1, "c1", "");
    expect(state.characterName).toBeUndefined();
  });

  it("omits characterBackground when empty string provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "");
    expect(state.characterBackground).toBeUndefined();
  });

  it("stores prologueRecap when provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "", 5, "A vivid recap.");
    expect(state.prologueRecap).toBe("A vivid recap.");
  });

  it("omits prologueRecap when not provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "", 5);
    expect(state.prologueRecap).toBeUndefined();
  });

  it("omits prologueRecap when empty string provided", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "", 5, "");
    expect(state.prologueRecap).toBeUndefined();
  });

  it("applies a start scenario's location and opening beat", () => {
    const scenario = selectStartScenario(5, () => 0.5);
    const state = createDefaultGameState(1, "c1", "Klein", "", 5, "", scenario);
    expect(state.location).toBe(scenario.location);
    expect(state.openingBeat).toBe(scenario.openingBeat);
  });

  it("falls back to the epoch's default location and no opening beat without a scenario", () => {
    const state = createDefaultGameState(1, "c1", "Klein", "", 5);
    expect(state.location).toBe("Tingen City");
    expect(state.openingBeat).toBeUndefined();
  });
});

describe("createSession with initialMemory", () => {
  it("uses provided initialMemory instead of empty memory", () => {
    const gameState = makeGameState();
    const customMemory = {
      immediateTurns: [],
      recentSummaries: [],
      sessionFacts: [{ type: "event" as const, description: "test", turnNumber: 0 }],
    };
    const session = createSession(gameState, "id", 1000, customMemory);
    expect(session.memory.sessionFacts).toHaveLength(1);
    expect(session.memory.sessionFacts[0].description).toBe("test");
  });

  it("falls back to empty memory when initialMemory is undefined", () => {
    const gameState = makeGameState();
    const session = createSession(gameState, "id", 1000, undefined);
    expect(session.memory.sessionFacts).toHaveLength(0);
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
      gameState: makeGameState({
        // currentCity present so the legacy backfill is a no-op and the round
        // trip is exact (the backfill is covered separately below).
        currentCity: "tingen",
        digestion: { pathwayId: 1, sequenceLevel: 9, progress: 0, complete: false },
      }),
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

  it("seeds canon position and the default model lock for legacy sessions", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    delete modified.canonPosition;
    delete modified.embeddingModelId;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored?.canonPosition).toBe(DEFAULT_CANON_POSITION);
    expect(restored?.embeddingModelId).toBe(DEFAULT_EMBEDDING_MODEL_ID);
  });

  it("backfills currentCity from a city-naming location for legacy saves", () => {
    const modified = JSON.parse(
      serializeSession(
        makeSession({ gameState: makeGameState({ location: "Backlund" }) }),
      ),
    );
    delete modified.gameState.currentCity;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored?.gameState.currentCity).toBe("backlund");
  });

  it("leaves currentCity unset when the location names no known city", () => {
    const modified = JSON.parse(
      serializeSession(
        makeSession({ gameState: makeGameState({ location: "Empress Borough" }) }),
      ),
    );
    delete modified.gameState.currentCity;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored?.gameState.currentCity).toBeUndefined();
  });

  it("preserves an existing currentCity rather than re-resolving it", () => {
    const modified = JSON.parse(
      serializeSession(
        makeSession({
          gameState: makeGameState({ location: "Backlund", currentCity: "bayam" }),
        }),
      ),
    );
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored?.gameState.currentCity).toBe("bayam");
  });

  it("preserves an explicit canon position and approved model lock", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.canonPosition = 333;
    modified.embeddingModelId = "bge-m3";
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored?.canonPosition).toBe(333);
    expect(restored?.embeddingModelId).toBe("bge-m3");
  });

  it("returns null for an unapproved model lock or invalid canon position", () => {
    const withModel = JSON.parse(serializeSession(makeSession()));
    withModel.embeddingModelId = "not-a-real-model";
    expect(deserializeSession(JSON.stringify(withModel))).toBeNull();

    const withPosition = JSON.parse(serializeSession(makeSession()));
    withPosition.canonPosition = -5;
    expect(deserializeSession(JSON.stringify(withPosition))).toBeNull();
    withPosition.canonPosition = "soon";
    expect(deserializeSession(JSON.stringify(withPosition))).toBeNull();
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

  it("seeds digestion for legacy sessions saved without it", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    expect(modified.gameState.digestion).toBeUndefined();

    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.gameState.digestion).toEqual({
      pathwayId: modified.gameState.pathwayId,
      sequenceLevel: modified.gameState.sequenceLevel,
      progress: 0,
      complete: false,
    });
  });

  it("preserves a valid digestion state on round-trip", () => {
    const session = makeSession({
      gameState: makeGameState({
        digestion: { pathwayId: 1, sequenceLevel: 9, progress: 45, complete: false },
      }),
    });
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.gameState.digestion!.progress).toBe(45);
  });

  it("returns null for a malformed digestion state", () => {
    const session = makeSession();
    const json = serializeSession(session);
    const modified = JSON.parse(json);
    modified.gameState.digestion = { pathwayId: 1, sequenceLevel: 9, progress: 150 };
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("preserves the durable running summary on round-trip", () => {
    const session = makeSession();
    session.memory.runningSummary = "Klein is hunting a rogue Beyonder in the East End.";
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.memory.runningSummary).toBe(
      "Klein is hunting a rogue Beyonder in the East End.",
    );
  });

  it("returns null when the running summary is not a string", () => {
    const session = makeSession();
    const modified = JSON.parse(serializeSession(session));
    modified.memory.runningSummary = 123;
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("accepts a legacy save with no running summary", () => {
    const session = makeSession();
    const modified = JSON.parse(serializeSession(session));
    delete modified.memory.runningSummary;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.memory.runningSummary).toBeUndefined();
  });

  it("round-trips the true-self profile state", () => {
    const session = makeSession({
      profileState: {
        profile: {
          gender: "woman",
          pronouns: "she/her",
          demeanor: [{ id: "a", label: "allure" }],
          notes: [{ id: "n", text: "Took a new name.", at: 1 }],
          formerNames: ["Sean"],
        },
        recognition: { pendingNpcs: ["Audrey"], priorName: "Sean", openedAt: 1 },
      },
    });
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.profileState).toEqual(session.profileState);
  });

  it("accepts a legacy save with no profile state", () => {
    const session = makeSession();
    const modified = JSON.parse(serializeSession(session));
    delete modified.profileState;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.profileState).toBeUndefined();
  });

  it("returns null for a malformed profile state", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.profileState = {
      profile: { demeanor: [], notes: [], formerNames: [5] },
      recognition: null,
    };
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("round-trips the acting-method state (issue #95)", () => {
    const session = makeSession({
      actingMethodState: { knowsMethod: true, alignedStreak: 4 },
    });
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.actingMethodState).toEqual({
      knowsMethod: true,
      alignedStreak: 4,
    });
  });

  it("accepts a legacy save with no acting-method state", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    delete modified.actingMethodState;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.actingMethodState).toBeUndefined();
  });

  it("returns null for a malformed acting-method state", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.actingMethodState = { knowsMethod: "yes", alignedStreak: -1 };
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("round-trips active hunt quests", () => {
    const session = makeSession({
      hunts: [
        {
          targetItemName: "Spectator Characteristic",
          targetSeq: 6,
          turnsRemaining: 2,
          totalTurns: 3,
        },
      ],
    });
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.hunts).toEqual(session.hunts);
  });

  it("accepts a legacy save with no hunts", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    delete modified.hunts;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.hunts).toBeUndefined();
  });

  it("returns null for a malformed hunts list", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.hunts = [
      { targetItemName: "", targetSeq: 6, turnsRemaining: 1, totalTurns: 2 },
    ];
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("round-trips a tracked-NPC roster (issue #101)", () => {
    const session = makeSession({
      trackedNpcState: {
        roster: [{ name: "Old Neil", disposition: "ally", follows: true }],
      },
    });
    const restored = deserializeSession(serializeSession(session));
    expect(restored!.trackedNpcState).toEqual(session.trackedNpcState);
  });

  it("accepts a legacy save with no tracked-NPC roster", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    delete modified.trackedNpcState;
    const restored = deserializeSession(JSON.stringify(modified));
    expect(restored).not.toBeNull();
    expect(restored!.trackedNpcState).toBeUndefined();
  });

  it("returns null for a malformed tracked-NPC roster", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.trackedNpcState = { roster: [{ name: "X", disposition: "friend" }] };
    expect(deserializeSession(JSON.stringify(modified))).toBeNull();
  });

  it("round-trips a pending engine-turn action and accepts null/absent", () => {
    const withAction = makeSession({ pendingPlayerAction: "I drink and advance." });
    expect(deserializeSession(serializeSession(withAction))!.pendingPlayerAction).toBe(
      "I drink and advance.",
    );
    const cleared = JSON.parse(serializeSession(makeSession()));
    cleared.pendingPlayerAction = null;
    expect(deserializeSession(JSON.stringify(cleared))).not.toBeNull();
  });

  it("returns null for a non-string pending engine-turn action", () => {
    const modified = JSON.parse(serializeSession(makeSession()));
    modified.pendingPlayerAction = 123;
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

  it("rejects NaN for numeric fields", () => {
    const session = makeSession();
    expect(isValidSessionShape({ ...session, turnCount: NaN })).toBe(false);
    expect(
      isValidSessionShape({
        ...session,
        gameState: { ...session.gameState, maxSanity: NaN },
      }),
    ).toBe(false);
    expect(
      isValidSessionShape({
        ...session,
        gameState: { ...session.gameState, sanity: NaN },
      }),
    ).toBe(false);
    expect(
      isValidSessionShape({
        ...session,
        gameState: { ...session.gameState, pathwayId: NaN },
      }),
    ).toBe(false);
    expect(isValidSessionShape({ ...session, createdAt: NaN })).toBe(false);
  });

  it("rejects maxSanity of zero", () => {
    const session = makeSession();
    expect(
      isValidSessionShape({
        ...session,
        gameState: { ...session.gameState, maxSanity: 0 },
      }),
    ).toBe(false);
  });

  it("rejects Infinity for numeric fields", () => {
    const session = makeSession();
    expect(
      isValidSessionShape({
        ...session,
        gameState: { ...session.gameState, sanity: Infinity },
      }),
    ).toBe(false);
  });

  it("accepts a session with a valid digestion state", () => {
    const session = makeSession({
      gameState: makeGameState({
        digestion: { pathwayId: 1, sequenceLevel: 9, progress: 50, complete: false },
      }),
    });
    expect(isValidSessionShape(session)).toBe(true);
  });

  it("rejects a session with a malformed digestion state", () => {
    const session = makeSession();
    const invalid = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { pathwayId: 1, sequenceLevel: 9, progress: "half" },
      },
    };
    expect(isValidSessionShape(invalid)).toBe(false);
  });
});

// ─── isValidDigestionShape ─────────────────────────────────────────

describe("isValidDigestionShape", () => {
  const valid = { pathwayId: 1, sequenceLevel: 9, progress: 50, complete: false };

  it("accepts a well-formed digestion state", () => {
    expect(isValidDigestionShape(valid)).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isValidDigestionShape(null)).toBe(false);
    expect(isValidDigestionShape([])).toBe(false);
    expect(isValidDigestionShape("x")).toBe(false);
  });

  it("rejects a non-numeric pathwayId", () => {
    expect(isValidDigestionShape({ ...valid, pathwayId: "one" })).toBe(false);
  });

  it("rejects a non-numeric sequenceLevel", () => {
    expect(isValidDigestionShape({ ...valid, sequenceLevel: null })).toBe(false);
  });

  it("rejects a non-numeric progress", () => {
    expect(isValidDigestionShape({ ...valid, progress: "half" })).toBe(false);
  });

  it("rejects progress below 0", () => {
    expect(isValidDigestionShape({ ...valid, progress: -1 })).toBe(false);
  });

  it("rejects progress above 100", () => {
    expect(isValidDigestionShape({ ...valid, progress: 101 })).toBe(false);
  });

  it("rejects a non-boolean complete", () => {
    expect(isValidDigestionShape({ ...valid, complete: "yes" })).toBe(false);
  });
});

describe("isValidInjuriesShape", () => {
  const valid = { id: "i1", description: "a cut", severity: "minor", recoveryTurns: 3 };

  it("accepts an empty array", () => {
    expect(isValidInjuriesShape([])).toBe(true);
  });

  it("accepts an array of well-formed injuries", () => {
    expect(isValidInjuriesShape([valid])).toBe(true);
  });

  it("rejects a non-array", () => {
    expect(isValidInjuriesShape({})).toBe(false);
    expect(isValidInjuriesShape(null)).toBe(false);
  });

  it("rejects an entry that is not an object", () => {
    expect(isValidInjuriesShape(["nope"])).toBe(false);
  });

  it("rejects a missing or empty id", () => {
    expect(isValidInjuriesShape([{ ...valid, id: "" }])).toBe(false);
    expect(isValidInjuriesShape([{ ...valid, id: 5 }])).toBe(false);
  });

  it("rejects a non-string description", () => {
    expect(isValidInjuriesShape([{ ...valid, description: 1 }])).toBe(false);
  });

  it("rejects an unknown severity", () => {
    expect(isValidInjuriesShape([{ ...valid, severity: "fatal" }])).toBe(false);
  });

  it("rejects a non-numeric recoveryTurns", () => {
    expect(isValidInjuriesShape([{ ...valid, recoveryTurns: "soon" }])).toBe(false);
  });
});

describe("isValidSessionShape with injuries", () => {
  it("accepts a session whose game state carries well-formed injuries", () => {
    const session = makeSession({
      gameState: makeGameState({
        injuries: [{ id: "i1", description: "cut", severity: "minor", recoveryTurns: 2 }],
      }),
    });
    expect(isValidSessionShape(session)).toBe(true);
  });

  it("rejects a session whose injuries are malformed", () => {
    const session = makeSession({
      gameState: makeGameState({
        // @ts-expect-error — intentionally malformed for the test
        injuries: [{ id: "i1", severity: "fatal" }],
      }),
    });
    expect(isValidSessionShape(session)).toBe(false);
  });
});
