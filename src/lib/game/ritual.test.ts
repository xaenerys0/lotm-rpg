import { describe, expect, it } from "vitest";

import {
  advanceRitualStep,
  beginRitual,
  clearRitual,
  currentRitualStep,
  isRitualComplete,
  isValidRitualStateShape,
  ritualStepsFor,
} from "./ritual";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A Fool at Sequence 6 — the target rung (Seq 5, Marionettist) carries a canon
// Advancement Ritual, so the rite has steps to perform.
function sessionAt(sequenceLevel = 6, pathwayId = 1): GameSession {
  const gameState = {
    ...createDefaultGameState(pathwayId, "char-1", "Klein"),
    sequenceLevel,
  };
  return createSession(gameState, "session-1");
}

const TARGET = 5;

describe("ritualStepsFor", () => {
  it("derives the steps from the target sequence's ritual requirements", () => {
    const steps = ritualStepsFor(sessionAt(), TARGET);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("returns nothing when the target sequence has no ritual (Seq 9-6)", () => {
    // Advancing from Seq 9 → 8: no ritual above Sequence 5.
    expect(ritualStepsFor(sessionAt(9), 8)).toEqual([]);
  });
});

describe("beginRitual", () => {
  it("starts a rite tracking the target, with no steps performed yet", () => {
    const session = beginRitual(sessionAt(), TARGET);
    expect(session.ritualState).toEqual({
      pathwayId: 1,
      targetSeq: TARGET,
      stepsCompleted: 0,
      totalSteps: ritualStepsFor(sessionAt(), TARGET).length,
      complete: false,
    });
  });

  it("is idempotent for the same target", () => {
    const once = beginRitual(sessionAt(), TARGET);
    const twice = beginRitual(once, TARGET);
    expect(twice).toBe(once);
  });

  it("re-targets (resets) when the target changed", () => {
    const begun = advanceRitualStep(sessionAt(), TARGET); // 1 step into Seq 5
    const retargeted = beginRitual(begun, 4);
    expect(retargeted.ritualState?.targetSeq).toBe(4);
    expect(retargeted.ritualState?.stepsCompleted).toBe(0);
  });
});

describe("advanceRitualStep / isRitualComplete / currentRitualStep", () => {
  it("performs the rite step by step until complete", () => {
    let session = sessionAt();
    const steps = ritualStepsFor(session, TARGET);
    expect(isRitualComplete(session, TARGET)).toBe(false);

    for (let i = 0; i < steps.length; i++) {
      expect(currentRitualStep(session, TARGET)).toBe(steps[i]);
      session = advanceRitualStep(session, TARGET);
      expect(session.ritualState?.stepsCompleted).toBe(i + 1);
    }

    expect(isRitualComplete(session, TARGET)).toBe(true);
    expect(currentRitualStep(session, TARGET)).toBeNull();
  });

  it("is a no-op once complete (cannot over-advance)", () => {
    let session = sessionAt();
    const steps = ritualStepsFor(session, TARGET);
    for (let i = 0; i < steps.length; i++) session = advanceRitualStep(session, TARGET);
    const done = session;
    expect(advanceRitualStep(done, TARGET)).toBe(done);
    expect(done.ritualState?.stepsCompleted).toBe(steps.length);
  });

  it("is not complete for a different target than the one tracked", () => {
    let session = sessionAt();
    const steps = ritualStepsFor(session, TARGET);
    for (let i = 0; i < steps.length; i++) session = advanceRitualStep(session, TARGET);
    expect(isRitualComplete(session, TARGET)).toBe(true);
    expect(isRitualComplete(session, 4)).toBe(false); // performed Seq 5's rite, not Seq 4's
    expect(currentRitualStep(session, 4)).toBe(ritualStepsFor(session, 4)[0]);
  });
});

describe("clearRitual", () => {
  it("drops a rite in progress", () => {
    const begun = advanceRitualStep(sessionAt(), TARGET);
    expect(begun.ritualState).toBeDefined();
    expect(clearRitual(begun).ritualState).toBeUndefined();
  });

  it("is a no-op when there is no rite", () => {
    const session = sessionAt();
    expect(clearRitual(session)).toBe(session);
  });
});

describe("isValidRitualStateShape", () => {
  it("accepts a well-formed state", () => {
    expect(
      isValidRitualStateShape({
        pathwayId: 1,
        targetSeq: 5,
        stepsCompleted: 1,
        totalSteps: 3,
        complete: false,
      }),
    ).toBe(true);
  });

  it("rejects malformed states", () => {
    expect(isValidRitualStateShape(null)).toBe(false);
    expect(isValidRitualStateShape([])).toBe(false);
    expect(isValidRitualStateShape({ pathwayId: 1, targetSeq: 5 })).toBe(false);
    const ok = {
      pathwayId: 1,
      targetSeq: 5,
      stepsCompleted: 0,
      totalSteps: 3,
      complete: false,
    };
    expect(isValidRitualStateShape({ ...ok, pathwayId: "x" })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, targetSeq: Infinity })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, totalSteps: 1.5 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, stepsCompleted: -1 })).toBe(false);
    // stepsCompleted exceeds totalSteps
    expect(
      isValidRitualStateShape({
        pathwayId: 1,
        targetSeq: 5,
        stepsCompleted: 4,
        totalSteps: 3,
        complete: true,
      }),
    ).toBe(false);
    // complete must be boolean
    expect(
      isValidRitualStateShape({
        pathwayId: 1,
        targetSeq: 5,
        stepsCompleted: 0,
        totalSteps: 3,
        complete: "yes",
      }),
    ).toBe(false);
  });
});
