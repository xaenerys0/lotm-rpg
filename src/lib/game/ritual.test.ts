import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import {
  advanceRitual,
  beginRitual,
  clearRitual,
  isRitualComplete,
  isValidRitualStateShape,
  ritualFidelity,
  ritualInProgress,
  ritualProgress,
  ritualQuestLabel,
  ritualStepsFor,
  ritualTurns,
  skipRitual,
} from "./ritual";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A Fool at Sequence 6 — the target rung (Seq 5, Marionettist) carries a canon
// Advancement Ritual, so the rite has turns to live out.
function sessionAt(sequenceLevel = 6, pathwayId = 1): GameSession {
  const gameState = {
    ...createDefaultGameState(pathwayId, "char-1", "Klein"),
    sequenceLevel,
  };
  return createSession(gameState, "session-1");
}

// Run the rite all the way to completion (the turn-based per-turn tick).
function performRitual(session: GameSession): GameSession {
  let s = session;
  let guard = 0;
  while (s.ritualState && !s.ritualState.complete && guard++ < 100) {
    s = advanceRitual(s);
  }
  return s;
}

const TARGET = 5;

describe("ritualStepsFor / ritualTurns", () => {
  it("derives tagged steps (materials + conditions) from the target ritual", () => {
    const steps = ritualStepsFor(sessionAt(), TARGET);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.some((s) => s.kind === "material")).toBe(true);
    expect(steps.some((s) => s.kind === "condition")).toBe(true);
  });

  it("returns nothing when the target sequence has no ritual (Seq 9-6)", () => {
    expect(ritualStepsFor(sessionAt(9), 8)).toEqual([]);
  });

  it("treats a hand-authored fallback ritual's flat requirements as conditions", () => {
    // White Tower (#10) has no corpus ritual, so its Seq 5 rung keeps the
    // hand-authored `requirements` prose (no tagged `steps`) — all conditions.
    const steps = ritualStepsFor(sessionAt(6, 10), 5);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((s) => s.kind === "condition")).toBe(true);
  });

  it("scales turns with rung depth (a deeper rite is a longer ordeal)", () => {
    // Fool Seq 5 vs Seq 1 — the deeper rung spans more turns.
    const shallow = ritualTurns(5, getSequence(1, 5)?.advancementRitual);
    const deep = ritualTurns(1, getSequence(1, 1)?.advancementRitual);
    expect(deep).toBeGreaterThan(shallow);
    expect(shallow).toBeGreaterThanOrEqual(2);
  });
});

describe("beginRitual", () => {
  it("seeds a turn-based rite, a quest label, and a quest-progress fact", () => {
    const session = beginRitual(sessionAt(), TARGET);
    const total = ritualTurns(TARGET, getSequence(1, TARGET)?.advancementRitual);
    expect(session.ritualState).toEqual({
      pathwayId: 1,
      targetSeq: TARGET,
      totalTurns: total,
      turnsRemaining: total,
      fidelityScore: 0,
      skipped: false,
      complete: false,
    });
    expect(session.gameState.activeQuests).toContain(ritualQuestLabel(TARGET));
    expect(
      session.memory.sessionFacts.some(
        (f) =>
          f.type === "quest-progress" &&
          /Began the Advancement Ritual/.test(f.description),
      ),
    ).toBe(true);
  });

  it("is idempotent for the same target", () => {
    const once = beginRitual(sessionAt(), TARGET);
    const twice = beginRitual(once, TARGET);
    expect(twice).toBe(once);
  });

  it("re-targets (resets) when the target changed", () => {
    const begun = advanceRitual(beginRitual(sessionAt(), TARGET));
    const retargeted = beginRitual(begun, 4);
    expect(retargeted.ritualState?.targetSeq).toBe(4);
    expect(retargeted.ritualState?.turnsRemaining).toBe(
      retargeted.ritualState?.totalTurns,
    );
  });

  it("re-seeds a FINISHED same-target rite so it can be performed again (issue #209)", () => {
    // A survived advancement setback can leave a complete/skipped rite stranded;
    // beginning the rite again must reset it rather than short-circuit.
    const skipped = skipRitual(sessionAt(), TARGET); // complete + skipped
    const reBegun = beginRitual(skipped, TARGET);
    expect(reBegun).not.toBe(skipped);
    expect(reBegun.ritualState?.skipped).toBe(false);
    expect(reBegun.ritualState?.complete).toBe(false);
    expect(reBegun.ritualState?.turnsRemaining).toBe(reBegun.ritualState?.totalTurns);
    // …but an IN-PROGRESS same-target rite is still left untouched (idempotent).
    const inProgress = advanceRitual(beginRitual(sessionAt(), TARGET));
    expect(beginRitual(inProgress, TARGET)).toBe(inProgress);
  });
});

describe("advanceRitual / isRitualComplete", () => {
  it("lives the rite out one turn per call until complete", () => {
    let session = beginRitual(sessionAt(), TARGET);
    const total = session.ritualState!.totalTurns;
    expect(isRitualComplete(session, TARGET)).toBe(false);

    for (let i = 0; i < total; i++) {
      expect(ritualProgress(session, TARGET)).toBe(i);
      session = advanceRitual(session);
    }

    expect(isRitualComplete(session, TARGET)).toBe(true);
    expect(session.ritualState?.turnsRemaining).toBe(0);
    expect(ritualProgress(session, TARGET)).toBe(total);
  });

  it("accrues full fidelity with a steady mind and drains a little sanity", () => {
    const session = performRitual(beginRitual(sessionAt(), TARGET));
    expect(ritualFidelity(session, TARGET)).toBeCloseTo(1, 5);
    // The grueling rite costs sanity (the survival pressure).
    expect(session.gameState.sanity).toBeLessThan(100);
  });

  it("botches beats and lowers fidelity when the mind is frayed", () => {
    const frayed = beginRitual(sessionAt(), TARGET);
    frayed.gameState.sanity = 10; // below RITUAL_BEAT_SANITY_RATIO * 100
    const done = performRitual(frayed);
    expect(ritualFidelity(done, TARGET)).toBeLessThan(1);
    expect(ritualFidelity(done, TARGET)).toBeGreaterThan(0);
  });

  it("seeds a completion fact and drops the quest label on the finishing turn", () => {
    const done = performRitual(beginRitual(sessionAt(), TARGET));
    expect(done.gameState.activeQuests).not.toContain(ritualQuestLabel(TARGET));
    expect(
      done.memory.sessionFacts.some((f) =>
        /Completed the Advancement Ritual/.test(f.description),
      ),
    ).toBe(true);
  });

  it("is a no-op when no rite is under way, complete, or skipped", () => {
    const none = sessionAt();
    expect(advanceRitual(none)).toBe(none);
    const done = performRitual(beginRitual(sessionAt(), TARGET));
    expect(advanceRitual(done)).toBe(done);
    const skipped = skipRitual(sessionAt(), TARGET);
    expect(advanceRitual(skipped)).toBe(skipped);
  });
});

describe("ritualInProgress / ritualProgress", () => {
  it("reports a begun-but-unresolved rite as in progress", () => {
    expect(ritualInProgress(sessionAt(), TARGET)).toBe(false); // not begun
    const begun = advanceRitual(beginRitual(sessionAt(), TARGET));
    expect(ritualInProgress(begun, TARGET)).toBe(true);
    expect(ritualProgress(begun, TARGET)).toBe(1);
    expect(ritualProgress(begun, 4)).toBe(0); // different target
    const done = performRitual(begun);
    expect(ritualInProgress(done, TARGET)).toBe(false); // resolved
  });
});

describe("ritualFidelity", () => {
  it("is 1 when the rung needs no rite", () => {
    expect(ritualFidelity(sessionAt(9), 8)).toBe(1);
  });

  it("is 0 when no rite was begun for the target, or it was skipped", () => {
    expect(ritualFidelity(sessionAt(), TARGET)).toBe(0);
    expect(ritualFidelity(skipRitual(sessionAt(), TARGET), TARGET)).toBe(0);
  });

  it("is partial for a rushed (part-performed) rite", () => {
    const partial = advanceRitual(beginRitual(sessionAt(), TARGET));
    const fidelity = ritualFidelity(partial, TARGET);
    expect(fidelity).toBeGreaterThan(0);
    expect(fidelity).toBeLessThan(1);
  });
});

describe("skipRitual", () => {
  it("marks the rite skipped + complete with zero fidelity and drops the label", () => {
    const skipped = skipRitual(sessionAt(), TARGET);
    expect(skipped.ritualState?.skipped).toBe(true);
    expect(skipped.ritualState?.complete).toBe(true);
    expect(isRitualComplete(skipped, TARGET)).toBe(true);
    expect(ritualFidelity(skipped, TARGET)).toBe(0);
    expect(skipped.gameState.activeQuests).not.toContain(ritualQuestLabel(TARGET));
    expect(
      skipped.memory.sessionFacts.some((f) =>
        /Forwent the Advancement Ritual/.test(f.description),
      ),
    ).toBe(true);
  });

  it("can skip a rite already in progress", () => {
    const begun = advanceRitual(beginRitual(sessionAt(), TARGET));
    const skipped = skipRitual(begun, TARGET);
    expect(skipped.ritualState?.skipped).toBe(true);
    expect(ritualFidelity(skipped, TARGET)).toBe(0);
  });
});

describe("clearRitual", () => {
  it("drops a rite in progress and its quest label", () => {
    const begun = advanceRitual(beginRitual(sessionAt(), TARGET));
    expect(begun.ritualState).toBeDefined();
    const cleared = clearRitual(begun);
    expect(cleared.ritualState).toBeUndefined();
    expect(cleared.gameState.activeQuests).not.toContain(ritualQuestLabel(TARGET));
  });

  it("is a no-op when there is no rite", () => {
    const session = sessionAt();
    expect(clearRitual(session)).toBe(session);
  });
});

describe("isValidRitualStateShape", () => {
  const ok = {
    pathwayId: 1,
    targetSeq: 5,
    totalTurns: 4,
    turnsRemaining: 2,
    fidelityScore: 2,
    skipped: false,
    complete: false,
  };

  it("accepts a well-formed state", () => {
    expect(isValidRitualStateShape(ok)).toBe(true);
  });

  it("rejects malformed states", () => {
    expect(isValidRitualStateShape(null)).toBe(false);
    expect(isValidRitualStateShape([])).toBe(false);
    expect(isValidRitualStateShape({ pathwayId: 1, targetSeq: 5 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, pathwayId: "x" })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, targetSeq: Infinity })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, totalTurns: 1.5 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, turnsRemaining: -1 })).toBe(false);
    // turnsRemaining exceeds totalTurns
    expect(isValidRitualStateShape({ ...ok, turnsRemaining: 5 })).toBe(false);
    // fidelityScore out of bounds
    expect(isValidRitualStateShape({ ...ok, fidelityScore: -1 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, fidelityScore: 5 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, skipped: "no" })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, complete: "yes" })).toBe(false);
    // legacy step-counting shape is rejected (no turnsRemaining/fidelityScore)
    expect(
      isValidRitualStateShape({
        pathwayId: 1,
        targetSeq: 5,
        stepsCompleted: 0,
        totalSteps: 3,
        complete: false,
      }),
    ).toBe(false);
  });
});
