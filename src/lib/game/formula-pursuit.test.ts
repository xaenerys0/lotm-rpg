import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";
import type { Item } from "@/lib/types/rules";

import { targetSequence } from "./advancement";
import {
  advanceFormulaPursuit,
  beginFormulaPursuit,
  clearFormulaPursuit,
  formulaPursuitQuestLabel,
  formulaPursuitTurns,
  isFormulaPursuitReady,
  isValidFormulaPursuitShape,
  secureFormulaThroughStory,
  FORMULA_PURSUIT_BASE_TURNS,
  type FormulaPursuitState,
} from "./formula-pursuit";
import { acquisitionDepthFactor } from "./potion-preparation";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A fully-digested Beyonder on `sequenceLevel` with an empty satchel (mirrors
// hunt.test / potion-preparation.test).
function stuck(sequenceLevel: number, pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const gameState = {
    ...base,
    sequenceLevel,
    inventory: [] as Item[],
    digestion: { pathwayId, sequenceLevel, progress: 100, complete: true },
  };
  return createSession(gameState, "session-1");
}

function formulaItem(sequenceLevel: number, pathwayId = 1): Item {
  const target = targetSequence(sequenceLevel);
  const items = getSequence(pathwayId, target)?.prerequisiteItems ?? [];
  const formula = items.find((i) => i.category === "potion-formula");
  if (!formula) throw new Error("expected a formula prerequisite for the test");
  return formula;
}

function sample(over: Partial<FormulaPursuitState> = {}): FormulaPursuitState {
  return {
    targetItemName: "Clown Potion Formula",
    targetSeq: 8,
    turnsRemaining: 3,
    totalTurns: 3,
    ...over,
  };
}

describe("formulaPursuitTurns", () => {
  it("uses the base at the shallowest rung and deepens with the depth factor", () => {
    expect(formulaPursuitTurns(8)).toBe(FORMULA_PURSUIT_BASE_TURNS);
    expect(formulaPursuitTurns(6)).toBe(
      Math.round(FORMULA_PURSUIT_BASE_TURNS * acquisitionDepthFactor(6)),
    );
  });

  it("grows monotonically toward the deeper rungs and never drops below one", () => {
    expect(formulaPursuitTurns(2)).toBeGreaterThan(formulaPursuitTurns(8));
    expect(formulaPursuitTurns(8)).toBeGreaterThanOrEqual(1);
  });
});

describe("formulaPursuitQuestLabel / isFormulaPursuitReady", () => {
  it("derives a stable quest label", () => {
    expect(formulaPursuitQuestLabel(sample({ targetSeq: 6 }))).toBe(
      "Seek the formula for the Sequence 6 potion",
    );
  });

  it("reports readiness only at zero turns remaining", () => {
    expect(isFormulaPursuitReady(sample({ turnsRemaining: 1 }))).toBe(false);
    expect(isFormulaPursuitReady(sample({ turnsRemaining: 0 }))).toBe(true);
  });
});

describe("beginFormulaPursuit", () => {
  it("starts a pursuit for the next potion's missing formula", () => {
    const session = stuck(9);
    const formula = formulaItem(9);

    const result = beginFormulaPursuit(session);
    expect(result.outcome).toBe("started");
    const next = result.session!;
    expect(next.formulaPursuit?.targetItemName).toBe(formula.name);
    expect(next.formulaPursuit?.targetSeq).toBe(targetSequence(9));
    // The AI-visible quest label is added and a quest-progress fact seeded.
    expect(next.gameState.activeQuests).toContain(
      formulaPursuitQuestLabel(next.formulaPursuit!),
    );
    expect(next.memory.sessionFacts.some((f) => f.type === "quest-progress")).toBe(true);
    // Purity — the input session is untouched.
    expect(session.formulaPursuit).toBeUndefined();
  });

  it("refuses when the sequence cannot advance (not-required)", () => {
    expect(beginFormulaPursuit(stuck(1)).outcome).toBe("not-required");
  });

  it("refuses when the formula is already in hand (already-owned)", () => {
    const formula = formulaItem(9);
    const session = stuck(9);
    const owned = {
      ...session,
      gameState: { ...session.gameState, inventory: [formula] },
    };
    expect(beginFormulaPursuit(owned).outcome).toBe("already-owned");
  });

  it("refuses a second pursuit while one is under way (already-pursuing)", () => {
    const first = beginFormulaPursuit(stuck(9)).session!;
    expect(beginFormulaPursuit(first).outcome).toBe("already-pursuing");
  });

  it("does not duplicate a quest label that is already present", () => {
    const session = stuck(9);
    const label = formulaPursuitQuestLabel({
      targetItemName: formulaItem(9).name,
      targetSeq: targetSequence(9),
      turnsRemaining: 0,
      totalTurns: 1,
    });
    const seeded = {
      ...session,
      gameState: { ...session.gameState, activeQuests: [label] },
    };
    const next = beginFormulaPursuit(seeded).session!;
    expect(next.gameState.activeQuests.filter((q) => q === label)).toHaveLength(1);
  });
});

describe("advanceFormulaPursuit", () => {
  it("is a no-op when no pursuit is under way", () => {
    const session = stuck(9);
    expect(advanceFormulaPursuit(session)).toBe(session);
  });

  it("decrements the pursuit and floors at zero", () => {
    const started = beginFormulaPursuit(stuck(9)).session!;
    const total = started.formulaPursuit!.totalTurns;
    let cur = started;
    for (let i = 0; i < total; i++) cur = advanceFormulaPursuit(cur);
    expect(cur.formulaPursuit!.turnsRemaining).toBe(0);
    // One more advance cannot go negative.
    expect(advanceFormulaPursuit(cur).formulaPursuit!.turnsRemaining).toBe(0);
  });

  it("re-adds a dropped quest label as it advances", () => {
    const started = beginFormulaPursuit(stuck(9)).session!;
    const tampered = {
      ...started,
      gameState: { ...started.gameState, activeQuests: [] as string[] },
    };
    const advanced = advanceFormulaPursuit(tampered);
    expect(advanced.gameState.activeQuests).toContain(
      formulaPursuitQuestLabel(advanced.formulaPursuit!),
    );
  });
});

describe("secureFormulaThroughStory", () => {
  function ready(session: GameSession): GameSession {
    const started = beginFormulaPursuit(session).session!;
    let cur = started;
    for (let i = 0; i < started.formulaPursuit!.totalTurns; i++) {
      cur = advanceFormulaPursuit(cur);
    }
    return cur;
  }

  it("delivers the formula for free and clears the pursuit when ready", () => {
    const formula = formulaItem(9);
    const cur = ready(stuck(9));
    const fundsBefore = cur.gameState.funds;

    const result = secureFormulaThroughStory(cur);
    expect(result.outcome).toBe("secured");
    const next = result.session!;
    expect(next.formulaPursuit).toBeUndefined();
    expect(next.gameState.inventory.some((i) => i.name === formula.name)).toBe(true);
    // Earned through the story — no funds change (the trade route is what costs).
    expect(next.gameState.funds).toBe(fundsBefore);
    // The quest label is dropped and a memory fact recorded.
    expect(next.gameState.activeQuests).not.toContain(
      formulaPursuitQuestLabel(cur.formulaPursuit!),
    );
    expect(next.memory.sessionFacts.some((f) => f.type === "event")).toBe(true);
  });

  it("refuses when no pursuit is under way (no-pursuit)", () => {
    expect(secureFormulaThroughStory(stuck(9)).outcome).toBe("no-pursuit");
  });

  it("refuses while the pursuit is still running (not-ready)", () => {
    const started = beginFormulaPursuit(stuck(9)).session!;
    expect(secureFormulaThroughStory(started).outcome).toBe("not-ready");
  });

  it("clears the pursuit but reports already-owned if the formula slipped in", () => {
    const formula = formulaItem(9);
    const cur = ready(stuck(9));
    const owned = {
      ...cur,
      gameState: { ...cur.gameState, inventory: [formula] },
    };
    const result = secureFormulaThroughStory(owned);
    expect(result.outcome).toBe("already-owned");
    expect(result.session!.formulaPursuit).toBeUndefined();
  });
});

describe("clearFormulaPursuit", () => {
  it("removes the pursuit and its quest label", () => {
    const started = beginFormulaPursuit(stuck(9)).session!;
    const cleared = clearFormulaPursuit(started);
    expect(cleared.formulaPursuit).toBeUndefined();
    expect(cleared.gameState.activeQuests).not.toContain(
      formulaPursuitQuestLabel(started.formulaPursuit!),
    );
  });

  it("is a no-op when no pursuit is under way", () => {
    const session = stuck(9);
    expect(clearFormulaPursuit(session)).toBe(session);
  });
});

describe("shape validation", () => {
  it("accepts a well-formed pursuit", () => {
    expect(isValidFormulaPursuitShape(sample())).toBe(true);
  });

  it("rejects malformed pursuits", () => {
    expect(isValidFormulaPursuitShape(null)).toBe(false);
    expect(isValidFormulaPursuitShape([])).toBe(false);
    expect(isValidFormulaPursuitShape(sample({ targetItemName: "" }))).toBe(false);
    expect(isValidFormulaPursuitShape({ ...sample(), targetSeq: "x" as never })).toBe(
      false,
    );
    expect(isValidFormulaPursuitShape(sample({ turnsRemaining: -1 }))).toBe(false);
    expect(isValidFormulaPursuitShape(sample({ totalTurns: 0 }))).toBe(false);
  });
});
