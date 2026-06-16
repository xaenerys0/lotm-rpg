import { describe, it, expect } from "vitest";
import type { DigestionState } from "@/lib/ai";
import {
  DIGESTION_MIN,
  DIGESTION_MAX,
  NEUTRAL_ALIGNMENT,
  CONTRADICTION_THRESHOLD,
  MAX_PROGRESS_PER_EVAL,
  MAX_REVERSE_PER_EVAL,
  MIN_PROGRESS_PER_SESSION,
  createDigestionState,
  computeProgressDelta,
  applyDigestionProgress,
  isDigestionComplete,
  digestionFeedback,
} from "./digestion";

function makeDigestion(overrides: Partial<DigestionState> = {}): DigestionState {
  return {
    pathwayId: 1,
    sequenceLevel: 9,
    progress: 0,
    complete: false,
    ...overrides,
  };
}

// ─── createDigestionState ──────────────────────────────────────────

describe("createDigestionState", () => {
  it("starts at zero progress, incomplete", () => {
    const state = createDigestionState(2, 7);
    expect(state.pathwayId).toBe(2);
    expect(state.sequenceLevel).toBe(7);
    expect(state.progress).toBe(DIGESTION_MIN);
    expect(state.complete).toBe(false);
  });
});

// ─── computeProgressDelta ──────────────────────────────────────────

describe("computeProgressDelta", () => {
  it("returns max progress for perfect alignment", () => {
    expect(computeProgressDelta(1)).toBe(MAX_PROGRESS_PER_EVAL);
  });

  it("returns the anti-stagnation floor at the neutral point", () => {
    expect(computeProgressDelta(NEUTRAL_ALIGNMENT)).toBe(MIN_PROGRESS_PER_SESSION);
  });

  it("scales forward progress between neutral and perfect", () => {
    const delta = computeProgressDelta(0.75);
    expect(delta).toBeGreaterThan(MIN_PROGRESS_PER_SESSION);
    expect(delta).toBeLessThan(MAX_PROGRESS_PER_EVAL);
  });

  it("applies the floor for mediocre but non-contradictory acting", () => {
    expect(computeProgressDelta(0.4)).toBe(MIN_PROGRESS_PER_SESSION);
    expect(computeProgressDelta(CONTRADICTION_THRESHOLD)).toBe(MIN_PROGRESS_PER_SESSION);
  });

  it("reverses progress for contradictory acting", () => {
    expect(computeProgressDelta(0)).toBe(-MAX_REVERSE_PER_EVAL);
  });

  it("scales reverse progress for partially contradictory acting", () => {
    const delta = computeProgressDelta(0.2);
    expect(delta).toBeLessThan(0);
    expect(delta).toBeGreaterThan(-MAX_REVERSE_PER_EVAL);
  });

  it("clamps alignment above 1", () => {
    expect(computeProgressDelta(5)).toBe(MAX_PROGRESS_PER_EVAL);
  });

  it("clamps alignment below 0", () => {
    expect(computeProgressDelta(-5)).toBe(-MAX_REVERSE_PER_EVAL);
  });

  it("never reverses for any alignment at or above the contradiction threshold", () => {
    for (let a = CONTRADICTION_THRESHOLD; a <= 1; a += 0.05) {
      expect(computeProgressDelta(a)).toBeGreaterThanOrEqual(MIN_PROGRESS_PER_SESSION);
    }
  });
});

// ─── applyDigestionProgress ────────────────────────────────────────

describe("applyDigestionProgress", () => {
  it("advances progress for in-character acting", () => {
    const { state, delta } = applyDigestionProgress(makeDigestion({ progress: 20 }), 1);
    expect(delta).toBe(MAX_PROGRESS_PER_EVAL);
    expect(state.progress).toBe(20 + MAX_PROGRESS_PER_EVAL);
    expect(state.complete).toBe(false);
  });

  it("reverses progress for out-of-character acting", () => {
    const { state, delta } = applyDigestionProgress(makeDigestion({ progress: 50 }), 0);
    expect(delta).toBe(-MAX_REVERSE_PER_EVAL);
    expect(state.progress).toBe(50 - MAX_REVERSE_PER_EVAL);
  });

  it("clamps progress at the maximum and marks complete", () => {
    const { state, delta } = applyDigestionProgress(makeDigestion({ progress: 95 }), 1);
    expect(state.progress).toBe(DIGESTION_MAX);
    expect(state.complete).toBe(true);
    // Applied delta is clamped to the distance to the ceiling.
    expect(delta).toBe(5);
  });

  it("clamps progress at the minimum (cannot go negative)", () => {
    const { state, delta } = applyDigestionProgress(makeDigestion({ progress: 3 }), 0);
    expect(state.progress).toBe(DIGESTION_MIN);
    expect(delta).toBe(-3);
  });

  it("reports zero applied delta when already at the floor and reversing", () => {
    const { state, delta } = applyDigestionProgress(makeDigestion({ progress: 0 }), 0);
    expect(state.progress).toBe(DIGESTION_MIN);
    expect(delta).toBe(0);
  });

  it("does not mutate the input state", () => {
    const input = makeDigestion({ progress: 40 });
    applyDigestionProgress(input, 1);
    expect(input.progress).toBe(40);
    expect(input.complete).toBe(false);
  });

  it("stays complete once at the maximum", () => {
    const { state } = applyDigestionProgress(makeDigestion({ progress: 100 }), 1);
    expect(state.progress).toBe(DIGESTION_MAX);
    expect(state.complete).toBe(true);
  });
});

// ─── isDigestionComplete ───────────────────────────────────────────

describe("isDigestionComplete", () => {
  it("is false below the maximum", () => {
    expect(isDigestionComplete(makeDigestion({ progress: 99 }))).toBe(false);
  });

  it("is true at the maximum", () => {
    expect(isDigestionComplete(makeDigestion({ progress: 100 }))).toBe(true);
  });
});

// ─── slowed pacing constants (issue #95) ───────────────────────────

describe("digestion pacing constants (issue #95)", () => {
  it("slows the max forward progress and lowers the anti-stagnation floor", () => {
    expect(MAX_PROGRESS_PER_EVAL).toBe(10);
    expect(MIN_PROGRESS_PER_SESSION).toBe(1);
  });
});

// ─── digestionFeedback ─────────────────────────────────────────────

describe("digestionFeedback — post-discovery (knowsMethod = true)", () => {
  it("describes completion", () => {
    const msg = digestionFeedback(
      "Clown",
      makeDigestion({ progress: 100, complete: true }),
      5,
      true,
    );
    expect(msg).toContain("fully digested");
    expect(msg).toContain("Clown");
  });

  it("describes near-complete forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 80 }), 4, true);
    expect(msg).toContain("mask feels almost");
  });

  it("describes mid forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 50 }), 4, true);
    expect(msg).toContain("mannerisms");
  });

  it("describes early forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 10 }), 2, true);
    expect(msg).toContain("settles a little deeper");
  });

  it("describes reverse progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 30 }), -4, true);
    expect(msg).toContain("resists you");
  });

  it("describes no change", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 0 }), 0, true);
    expect(msg).toContain("does not settle");
  });

  it("falls back to a generic role name when empty", () => {
    const msg = digestionFeedback("", makeDigestion({ progress: 10 }), 2, true);
    expect(msg).toContain("Beyonder");
  });
});

describe("digestionFeedback — pre-discovery (knowsMethod = false)", () => {
  const FORBIDDEN = /digest|potion|%/i;

  it("names no mechanic, number, or percent in any direction", () => {
    const cases: Array<[ReturnType<typeof makeDigestion>, number]> = [
      [makeDigestion({ progress: 100, complete: true }), 5],
      [makeDigestion({ progress: 80 }), 4],
      [makeDigestion({ progress: 30 }), -4],
      [makeDigestion({ progress: 0 }), 0],
    ];
    for (const [state, delta] of cases) {
      const msg = digestionFeedback("Clown", state, delta, false);
      expect(msg).not.toMatch(FORBIDDEN);
      // No role name leak either — the prose is purely internal/diegetic.
      expect(msg).not.toContain("Clown");
    }
  });

  it("does not branch on the progress band (no magnitude leak)", () => {
    const early = digestionFeedback("Clown", makeDigestion({ progress: 5 }), 4, false);
    const late = digestionFeedback("Clown", makeDigestion({ progress: 90 }), 4, false);
    expect(early).toBe(late);
  });

  it("gives one distinct line per direction, differing from post-discovery", () => {
    const complete = makeDigestion({ progress: 100, complete: true });
    const forward = makeDigestion({ progress: 40 });
    const reverse = makeDigestion({ progress: 40 });
    const none = makeDigestion({ progress: 40 });

    const preComplete = digestionFeedback("Clown", complete, 5, false);
    const preForward = digestionFeedback("Clown", forward, 4, false);
    const preReverse = digestionFeedback("Clown", reverse, -4, false);
    const preNone = digestionFeedback("Clown", none, 0, false);

    // Four distinct directional lines.
    expect(new Set([preComplete, preForward, preReverse, preNone]).size).toBe(4);
    // Each differs from its post-discovery counterpart.
    expect(preComplete).not.toBe(digestionFeedback("Clown", complete, 5, true));
    expect(preForward).not.toBe(digestionFeedback("Clown", forward, 4, true));
    expect(preReverse).not.toBe(digestionFeedback("Clown", reverse, -4, true));
    expect(preNone).not.toBe(digestionFeedback("Clown", none, 0, true));
  });
});
