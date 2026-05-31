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

// ─── digestionFeedback ─────────────────────────────────────────────

describe("digestionFeedback", () => {
  it("describes completion", () => {
    const msg = digestionFeedback(
      "Clown",
      makeDigestion({ progress: 100, complete: true }),
      5,
    );
    expect(msg).toContain("fully digested");
    expect(msg).toContain("Clown");
  });

  it("describes near-complete forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 80 }), 4);
    expect(msg).toContain("mask feels almost");
  });

  it("describes mid forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 50 }), 4);
    expect(msg).toContain("mannerisms");
  });

  it("describes early forward progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 10 }), 2);
    expect(msg).toContain("settles a little deeper");
  });

  it("describes reverse progress", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 30 }), -4);
    expect(msg).toContain("resists you");
  });

  it("describes no change", () => {
    const msg = digestionFeedback("Clown", makeDigestion({ progress: 0 }), 0);
    expect(msg).toContain("does not settle");
  });

  it("falls back to a generic role name when empty", () => {
    const msg = digestionFeedback("", makeDigestion({ progress: 10 }), 2);
    expect(msg).toContain("Beyonder");
  });
});
