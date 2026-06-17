import { describe, expect, it } from "vitest";
import { createMemoryState, DEFAULT_EMBEDDING_MODEL_ID } from "@/lib/ai";
import type { GameState } from "@/lib/ai";
import {
  companionsPresentOnMove,
  emptyTrackedNpcState,
  followers,
  isValidTrackedNpcShape,
  isValidTrackedNpcStateShape,
  joinRoster,
  leaveRoster,
  reassertFollowersAt,
  resolveTrackedNpcState,
  shakeOff,
  type TrackedNpc,
  type TrackedNpcState,
} from "./tracked-npcs";
import type { GameSession } from "./types";

function makeGameState(): GameState {
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
  };
}

function makeSession(roster?: TrackedNpc[]): GameSession {
  return {
    id: "s1",
    gameState: makeGameState(),
    memory: createMemoryState(),
    turnCount: 4,
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
    createdAt: 1,
    updatedAt: 1,
    ...(roster ? { trackedNpcState: { roster } } : {}),
  };
}

const ally: TrackedNpc = { name: "Old Neil", disposition: "ally", follows: true };
const pursuer: TrackedNpc = { name: "The Hunter", disposition: "hostile", follows: true };
const bystander: TrackedNpc = { name: "A Clerk", disposition: "neutral", follows: false };

describe("state helpers", () => {
  it("empty + resolve", () => {
    expect(emptyTrackedNpcState()).toEqual({ roster: [] });
    expect(resolveTrackedNpcState(undefined)).toEqual({ roster: [] });
    const state: TrackedNpcState = { roster: [ally] };
    expect(resolveTrackedNpcState(state)).toBe(state);
  });

  it("followers / companionsPresentOnMove select only the follows flag", () => {
    const state: TrackedNpcState = { roster: [ally, pursuer, bystander] };
    expect(followers(state)).toEqual([ally, pursuer]);
    expect(companionsPresentOnMove(state)).toEqual(["Old Neil", "The Hunter"]);
  });
});

describe("reassertFollowersAt", () => {
  it("unions followers into the present list without duplicating", () => {
    const state: TrackedNpcState = { roster: [ally, pursuer] };
    expect(reassertFollowersAt([], state)).toEqual(["Old Neil", "The Hunter"]);
    expect(reassertFollowersAt(["Old Neil", "A Stranger"], state)).toEqual([
      "Old Neil",
      "A Stranger",
      "The Hunter",
    ]);
  });

  it("returns the present list unchanged with an empty roster", () => {
    expect(reassertFollowersAt(["X"], emptyTrackedNpcState())).toEqual(["X"]);
  });
});

describe("joinRoster", () => {
  it("adds an ally and appends an npc-encounter fact", () => {
    const next = joinRoster(makeSession(), ally, 99);
    expect(next.trackedNpcState?.roster).toEqual([ally]);
    const fact = next.memory.sessionFacts.at(-1)!;
    expect(fact.type).toBe("npc-encounter");
    expect(fact.description).toContain("Old Neil");
    expect(fact.turnNumber).toBe(4);
    expect(next.updatedAt).toBe(99);
  });

  it("words hostile and neutral joins distinctly", () => {
    const hostile = joinRoster(makeSession(), pursuer);
    expect(hostile.memory.sessionFacts.at(-1)!.description).toContain("trail");
    const neutral = joinRoster(makeSession(), bystander);
    expect(neutral.memory.sessionFacts.at(-1)!.description).toContain("alongside");
  });

  it("is idempotent on name (no duplicate, no extra fact)", () => {
    const once = joinRoster(makeSession(), ally);
    const twice = joinRoster(once, { ...ally, disposition: "neutral" });
    expect(twice).toBe(once);
  });
});

describe("leaveRoster / shakeOff", () => {
  it("leaveRoster drops the member with an event fact", () => {
    const next = leaveRoster(makeSession([ally, pursuer]), "Old Neil", 7);
    expect(next.trackedNpcState?.roster).toEqual([pursuer]);
    const fact = next.memory.sessionFacts.at(-1)!;
    expect(fact.type).toBe("event");
    expect(fact.description).toContain("parts ways");
    expect(next.updatedAt).toBe(7);
  });

  it("shakeOff drops the pursuer with an event fact", () => {
    const next = shakeOff(makeSession([pursuer]), "The Hunter");
    expect(next.trackedNpcState?.roster).toEqual([]);
    expect(next.memory.sessionFacts.at(-1)!.description).toContain("shake off");
  });

  it("both are no-ops for an absent name", () => {
    const session = makeSession([ally]);
    expect(leaveRoster(session, "Nobody")).toBe(session);
    expect(shakeOff(session, "Nobody")).toBe(session);
  });
});

describe("shape validation", () => {
  it("accepts a well-formed npc and rejects malformed ones", () => {
    expect(isValidTrackedNpcShape(ally)).toBe(true);
    expect(isValidTrackedNpcShape(null)).toBe(false);
    expect(isValidTrackedNpcShape([])).toBe(false);
    expect(isValidTrackedNpcShape({ name: "", disposition: "ally", follows: true })).toBe(
      false,
    );
    expect(
      isValidTrackedNpcShape({ name: "X", disposition: "friendly", follows: true }),
    ).toBe(false);
    expect(
      isValidTrackedNpcShape({ name: "X", disposition: "ally", follows: "yes" }),
    ).toBe(false);
  });

  it("validates the roster wrapper", () => {
    expect(isValidTrackedNpcStateShape({ roster: [] })).toBe(true);
    expect(isValidTrackedNpcStateShape({ roster: [ally, pursuer] })).toBe(true);
    expect(isValidTrackedNpcStateShape(null)).toBe(false);
    expect(isValidTrackedNpcStateShape([])).toBe(false);
    expect(isValidTrackedNpcStateShape({ roster: "nope" })).toBe(false);
    expect(isValidTrackedNpcStateShape({ roster: [{ bad: true }] })).toBe(false);
  });
});
