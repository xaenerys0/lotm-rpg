import { describe, expect, it } from "vitest";

import type { GameState } from "@/lib/ai";

import {
  applySetback,
  buildLegacy,
  deserializeLegacies,
  endSession,
  evaluateFailure,
  fallbackDescentScene,
  legaciesToFacts,
  serializeLegacies,
  SETBACK_SANITY_RATIO,
} from "./death";
import { createDefaultGameState, createSession } from "./session";

const state = (overrides: Partial<GameState> = {}): GameState => ({
  ...createDefaultGameState(1, "char-1", "Klein"),
  sanity: 0,
  inventory: [
    { name: "Silver dagger", description: "", category: "supplementary-ingredient" },
    { name: "Lavos squid blood", description: "", category: "main-ingredient" },
    { name: "Seer formula", description: "", category: "potion-formula" },
    { name: "Copper whistle", description: "", category: "supplementary-ingredient" },
  ],
  ...overrides,
});

describe("evaluateFailure", () => {
  it("defers loss of control to the sanity engine's severity ladder", () => {
    expect(evaluateFailure({ cause: "loss-of-control", sequenceLevel: 9 })).toEqual({
      cause: "loss-of-control",
      severity: "setback",
      outcome: "setback",
    });
    expect(evaluateFailure({ cause: "loss-of-control", sequenceLevel: 5 }).outcome).toBe(
      "permadeath",
    );
    expect(evaluateFailure({ cause: "loss-of-control", sequenceLevel: 1 }).severity).toBe(
      "fatal",
    );
    // High-risk escalates one step: a Seq 9 mid-advancement transforms.
    expect(
      evaluateFailure({ cause: "loss-of-control", sequenceLevel: 9, highRisk: true })
        .severity,
    ).toBe("transformation");
  });

  it("treats non-catastrophic combat and ritual failures as setbacks", () => {
    for (const cause of ["combat-defeat", "ritual-failure"] as const) {
      expect(evaluateFailure({ cause, sequenceLevel: 5 })).toEqual({
        cause,
        severity: "setback",
        outcome: "setback",
      });
    }
  });

  it("escalates catastrophic failures on the sequence-scaled ladder", () => {
    expect(
      evaluateFailure({ cause: "combat-defeat", sequenceLevel: 9, catastrophic: true })
        .severity,
    ).toBe("transformation");
    expect(
      evaluateFailure({ cause: "ritual-failure", sequenceLevel: 4, catastrophic: true })
        .outcome,
    ).toBe("permadeath");
  });
});

describe("applySetback", () => {
  // A fixed random source makes the consequence deterministic.
  const firstAlways = (): number => 0;

  it("restores a sliver of sanity, never zero", () => {
    const { state: next } = applySetback(state(), firstAlways);
    expect(next.sanity).toBe(Math.ceil(100 * SETBACK_SANITY_RATIO));
    const tiny = applySetback(state({ maxSanity: 2, sanity: 0 }), firstAlways);
    expect(tiny.state.sanity).toBeGreaterThanOrEqual(1);
  });

  it("loses half the inventory and names the missing items", () => {
    const result = applySetback(state(), firstAlways);
    expect(result.state.inventory).toHaveLength(2);
    expect(result.notes.join("\n")).toContain("Silver dagger");
  });

  it("displaces the character to an unknown corner of the city", () => {
    const result = applySetback(state(), firstAlways);
    expect(result.state.location).toBe("A fog-choked alley in Tingen");
    expect(result.notes.join("\n")).toContain("no memory of how you got there");
  });

  it("records the reputation cost as a memory fact for the narrator", () => {
    const result = applySetback(state(), firstAlways, 7);
    expect(result.notes.join("\n")).toContain("standing suffers");
    expect(result.facts).toEqual([
      expect.objectContaining({ type: "event", turnNumber: 7 }),
    ]);
    expect(result.facts[0].description).toContain("reputation damaged");
  });

  it("handles an empty inventory gracefully", () => {
    const result = applySetback(state({ inventory: [] }), firstAlways);
    expect(result.state.inventory).toEqual([]);
    expect(result.notes.join("\n")).not.toContain("Missing from your pockets");
  });
});

describe("buildLegacy / endSession", () => {
  it("a transformation leaves a monster in the world", () => {
    const session = createSession(state({ sequenceLevel: 5 }), "s1", 1000);
    const legacy = buildLegacy(session, "transformation", 2000);
    expect(legacy).toMatchObject({
      fate: "transformed",
      role: "monster",
      characterName: "Klein",
      location: "Tingen City",
      timestamp: 2000,
    });
    expect(legacy.epitaph).toContain("something monstrous");
  });

  it("a powerful death becomes a legend; a humble one a cautionary tale", () => {
    const mighty = createSession(state({ sequenceLevel: 4 }), "s1", 1000);
    expect(buildLegacy(mighty, "fatal").role).toBe("legend");
    const humble = createSession(state({ sequenceLevel: 9 }), "s2", 1000);
    const legacy = buildLegacy(humble, "fatal");
    expect(legacy.role).toBe("cautionary-tale");
    expect(legacy.epitaph).toContain("warning");
  });

  it("an unnamed character still gets an epitaph", () => {
    const session = createSession(
      { ...state({ sequenceLevel: 9 }), characterName: undefined },
      "s1",
      1000,
    );
    const legacy = buildLegacy(session, "fatal");
    expect(legacy.characterName).toBeUndefined();
    expect(legacy.epitaph).toContain("A nameless Beyonder");
  });

  it("endSession marks the session ended and preserves everything else", () => {
    const session = createSession(state(), "s1", 1000);
    const legacy = buildLegacy(session, "fatal", 2000);
    const ended = endSession(session, legacy, "The last thread snaps.", 3000);
    expect(ended.ended).toEqual({
      fate: "dead",
      severity: "fatal",
      scene: "The last thread snaps.",
      at: 3000,
    });
    expect(ended.gameState.inventory).toEqual(session.gameState.inventory);
    expect(session.ended).toBeUndefined();
  });
});

describe("legaciesToFacts", () => {
  it("turns legacies into narrator memory facts, flagging loose monsters", () => {
    const session = createSession(state({ sequenceLevel: 5 }), "s1", 1000);
    const monster = buildLegacy(session, "transformation");
    const legend = buildLegacy(
      createSession(state({ sequenceLevel: 3 }), "s2", 1000),
      "fatal",
    );
    const facts = legaciesToFacts([monster, legend]);
    expect(facts).toHaveLength(2);
    expect(facts[0].description).toContain("has not been dealt with");
    expect(facts[1].description).toBe(legend.epitaph);
    expect(facts.every((f) => f.type === "event" && f.turnNumber === 0)).toBe(true);
  });
});

describe("serializeLegacies / deserializeLegacies", () => {
  it("round-trips and rejects malformed payloads", () => {
    const session = createSession(state(), "s1", 1000);
    const legacies = [buildLegacy(session, "fatal", 2000)];
    expect(deserializeLegacies(serializeLegacies(legacies))).toEqual(legacies);
    expect(deserializeLegacies("not json")).toBeNull();
    expect(deserializeLegacies("{}")).toBeNull();
    expect(deserializeLegacies('[{"characterId":"x"}]')).toBeNull();
  });
});

describe("fallbackDescentScene", () => {
  it("narrates a fatal end and a transformation distinctly", () => {
    const fatal = fallbackDescentScene("fatal", state());
    const transformed = fallbackDescentScene("transformation", state());
    expect(fatal).toContain("Klein");
    expect(fatal).toContain("No body is ever found");
    expect(transformed).toContain("the thing that remains");
    expect(
      fallbackDescentScene("fatal", { ...state(), characterName: undefined }),
    ).toContain("the Beyonder");
  });
});
