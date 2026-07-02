import { describe, expect, it } from "vitest";

import {
  advanceRitual,
  beginRitual,
  clearRitual,
  isValidRitualStateShape,
  ritualCircumstanceFidelity,
  ritualFidelity,
  ritualInProgress,
  ritualNarratorContext,
  ritualQuestLabel,
  ritualStepsFor,
  RITUAL_FIDELITY_CAP,
  RITUAL_WITNESS_PENALTY,
} from "./ritual";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A Fool at Sequence 6 — the target rung (Seq 5, Marionettist) carries a canon
// Advancement Ritual, so the rite has materials/conditions and matures over play.
function sessionAt(sequenceLevel = 6, pathwayId = 1): GameSession {
  const gameState = {
    ...createDefaultGameState(pathwayId, "char-1", "Klein"),
    sequenceLevel,
  };
  return createSession(gameState, "session-1");
}

// Mature the rite over `n` turns of play (the per-turn tick).
function matureRitual(session: GameSession, n: number): GameSession {
  let s = session;
  for (let i = 0; i < n; i++) s = advanceRitual(s);
  return s;
}

const TARGET = 5;

describe("ritualStepsFor", () => {
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
});

describe("ritualCircumstanceFidelity", () => {
  it("is 1 in a private, unhurt, unhunted moment", () => {
    expect(ritualCircumstanceFidelity(sessionAt())).toBe(1);
  });

  it("drops with witnesses present (a crowd)", () => {
    const session = sessionAt();
    session.gameState.npcsPresent = ["A curious onlooker"];
    expect(ritualCircumstanceFidelity(session)).toBeCloseTo(
      1 - RITUAL_WITNESS_PENALTY,
      5,
    );
  });

  it("stalls (toward 0) amid wounds + pursuers + witnesses", () => {
    const session = sessionAt();
    session.gameState.npcsPresent = ["A crowd"];
    session.gameState.injuries = [
      { id: "i1", description: "A gash", severity: "major", recoveryTurns: 3 },
    ];
    session.trackedNpcState = {
      roster: [{ name: "A Nighthawk", disposition: "hostile", follows: true }],
    };
    expect(ritualCircumstanceFidelity(session)).toBe(0);
  });
});

describe("beginRitual", () => {
  it("opens the rite with a first turn of progress, a quest label, and a fact", () => {
    const session = beginRitual(sessionAt(), TARGET);
    expect(session.ritualState?.pathwayId).toBe(1);
    expect(session.ritualState?.targetSeq).toBe(TARGET);
    // A private opening accrues the first slice of fidelity (0 < f < 1).
    expect(session.ritualState!.fidelity).toBeGreaterThan(0);
    expect(session.ritualState!.fidelity).toBeLessThan(1);
    expect(session.gameState.activeQuests).toContain(ritualQuestLabel(TARGET));
    expect(
      session.memory.sessionFacts.some(
        (f) => f.type === "event" && /Began the Advancement Ritual/.test(f.description),
      ),
    ).toBe(true);
  });

  it("is idempotent once a rite for the target is under way", () => {
    const once = beginRitual(sessionAt(), TARGET);
    expect(beginRitual(once, TARGET)).toBe(once);
  });

  it("re-targets (resets progress) when the target changed", () => {
    const begun = matureRitual(beginRitual(sessionAt(), TARGET), 3);
    const retargeted = beginRitual(begun, 4);
    expect(retargeted.ritualState?.targetSeq).toBe(4);
    expect(retargeted.ritualState!.fidelity).toBeLessThan(begun.ritualState!.fidelity);
  });
});

describe("advanceRitual / ritualFidelity", () => {
  it("matures the rite toward 1 over turns of play (no fixed length)", () => {
    let session = beginRitual(sessionAt(), TARGET);
    const start = ritualFidelity(session, TARGET);
    session = advanceRitual(session);
    expect(ritualFidelity(session, TARGET)).toBeGreaterThan(start);
    // Many turns asymptotically approach a fully-formed rite.
    session = matureRitual(session, 40);
    expect(ritualFidelity(session, TARGET)).toBeGreaterThanOrEqual(RITUAL_FIDELITY_CAP);
    expect(ritualFidelity(session, TARGET)).toBeLessThanOrEqual(1);
  });

  it("matures slower in poor circumstances than in solitude", () => {
    const privateRite = advanceRitual(beginRitual(sessionAt(), TARGET));

    const crowded = sessionAt();
    crowded.gameState.npcsPresent = ["A crowd"];
    const crowdedRite = advanceRitual(beginRitual(crowded, TARGET));

    expect(ritualFidelity(crowdedRite, TARGET)).toBeLessThan(
      ritualFidelity(privateRite, TARGET),
    );
  });

  it("is a no-op when no rite is under way, matured, or stalled by danger", () => {
    const none = sessionAt();
    expect(advanceRitual(none)).toBe(none);
    const matured = matureRitual(beginRitual(sessionAt(), TARGET), 50);
    expect(advanceRitual(matured)).toBe(matured); // fully formed + already labelled

    // A scene hostile enough to stall the rite (circumstance 0) makes no progress
    // and must not churn a new session each turn.
    const stalled = beginRitual(sessionAt(), TARGET);
    stalled.gameState.npcsPresent = ["A crowd"];
    stalled.gameState.injuries = [
      { id: "i1", description: "A wound", severity: "major", recoveryTurns: 2 },
    ];
    stalled.trackedNpcState = {
      roster: [{ name: "A hunter", disposition: "hostile", follows: true }],
    };
    expect(advanceRitual(stalled)).toBe(stalled);
  });

  it("ritualFidelity is 1 when the rung needs no rite, 0 when not begun", () => {
    expect(ritualFidelity(sessionAt(9), 8)).toBe(1); // no rite at Seq 9→8
    expect(ritualFidelity(sessionAt(), TARGET)).toBe(0); // not begun = forgone
    expect(ritualFidelity(beginRitual(sessionAt(), 4), TARGET)).toBe(0); // wrong target
  });
});

describe("ritualInProgress", () => {
  it("is true once a rite for the target is begun, false otherwise", () => {
    expect(ritualInProgress(sessionAt(), TARGET)).toBe(false);
    expect(ritualInProgress(beginRitual(sessionAt(), TARGET), TARGET)).toBe(true);
    expect(ritualInProgress(beginRitual(sessionAt(), TARGET), 4)).toBe(false);
  });
});

describe("ritualNarratorContext (issue #220)", () => {
  it("is null when no advancement rite is under way", () => {
    expect(ritualNarratorContext(sessionAt())).toBeNull();
  });

  it("names the target + current role and forbids narrating the ascension", () => {
    const ctx = ritualNarratorContext(beginRitual(sessionAt(6, 1), TARGET));
    expect(ctx).not.toBeNull();
    // Fool Seq 6 → 5: current "Clown", target "Magician" (Marionettist family).
    expect(ctx).toContain(`Sequence ${TARGET}`);
    expect(ctx).toMatch(/NOT the advancement itself/);
    expect(ctx).toMatch(/has NOT ascended/);
    expect(ctx).toMatch(/when they drink the potion and the game commits/);
  });

  it("is null for a stale rite whose target is not one rung below now", () => {
    // A rite begun for Seq 5, but the character has since drifted to Seq 4 — the
    // rite no longer feeds this advancement, so it must not steer narration.
    const begun = beginRitual(sessionAt(6, 1), TARGET);
    const drifted: GameSession = {
      ...begun,
      gameState: { ...begun.gameState, sequenceLevel: 4 },
    };
    expect(ritualNarratorContext(drifted)).toBeNull();
  });
});

describe("clearRitual", () => {
  it("drops a rite under way and its quest label", () => {
    const begun = beginRitual(sessionAt(), TARGET);
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
  const ok = { pathwayId: 1, targetSeq: 5, fidelity: 0.4 };

  it("accepts a well-formed state", () => {
    expect(isValidRitualStateShape(ok)).toBe(true);
  });

  it("rejects malformed states", () => {
    expect(isValidRitualStateShape(null)).toBe(false);
    expect(isValidRitualStateShape([])).toBe(false);
    expect(isValidRitualStateShape({ pathwayId: 1 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, pathwayId: "x" })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, targetSeq: Infinity })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, fidelity: -0.1 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, fidelity: 1.1 })).toBe(false);
    expect(isValidRitualStateShape({ ...ok, fidelity: "high" })).toBe(false);
    // The legacy turn-based shape is rejected (no `fidelity`).
    expect(
      isValidRitualStateShape({
        pathwayId: 1,
        targetSeq: 5,
        totalTurns: 5,
        turnsRemaining: 2,
        complete: false,
      }),
    ).toBe(false);
  });
});
