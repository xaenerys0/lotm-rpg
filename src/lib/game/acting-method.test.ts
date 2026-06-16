import { describe, it, expect } from "vitest";
import {
  ACTING_ALIGNED_THRESHOLD,
  ACTING_DISCOVERY_STREAK,
  createActingMethodState,
  evaluateActingDiscovery,
  isValidActingMethodStateShape,
  resolveActingMethodState,
  type ActingMethodState,
} from "./acting-method";

describe("acting-method discovery (issue #95)", () => {
  describe("createActingMethodState", () => {
    it("starts unknown with a zero streak", () => {
      expect(createActingMethodState()).toEqual({
        knowsMethod: false,
        alignedStreak: 0,
      });
    });
  });

  describe("resolveActingMethodState", () => {
    it("returns the stored state when present", () => {
      const state: ActingMethodState = { knowsMethod: true, alignedStreak: 2 };
      expect(resolveActingMethodState(state)).toBe(state);
    });

    it("creates a fresh state when absent", () => {
      expect(resolveActingMethodState()).toEqual(createActingMethodState());
      expect(resolveActingMethodState(undefined)).toEqual(createActingMethodState());
    });
  });

  describe("isValidActingMethodStateShape", () => {
    it("accepts a well-formed state", () => {
      expect(
        isValidActingMethodStateShape({ knowsMethod: false, alignedStreak: 0 }),
      ).toBe(true);
      expect(isValidActingMethodStateShape({ knowsMethod: true, alignedStreak: 6 })).toBe(
        true,
      );
    });

    it("rejects non-objects and arrays", () => {
      expect(isValidActingMethodStateShape(null)).toBe(false);
      expect(isValidActingMethodStateShape("x")).toBe(false);
      expect(isValidActingMethodStateShape(3)).toBe(false);
      expect(isValidActingMethodStateShape([])).toBe(false);
    });

    it("rejects wrong field types and negative streaks", () => {
      expect(
        isValidActingMethodStateShape({ knowsMethod: "yes", alignedStreak: 0 }),
      ).toBe(false);
      expect(
        isValidActingMethodStateShape({ knowsMethod: true, alignedStreak: "two" }),
      ).toBe(false);
      expect(
        isValidActingMethodStateShape({ knowsMethod: true, alignedStreak: -1 }),
      ).toBe(false);
      expect(isValidActingMethodStateShape({ knowsMethod: true })).toBe(false);
    });
  });

  describe("evaluateActingDiscovery", () => {
    it("short-circuits when already known", () => {
      const state: ActingMethodState = { knowsMethod: true, alignedStreak: 3 };
      const out = evaluateActingDiscovery({ state, alignment: 1, taughtFlag: true });
      expect(out).toEqual({ state, discoveredThisTurn: false, trigger: null });
      // Identity preserved (no new object work needed).
      expect(out.state).toBe(state);
    });

    it("discovers immediately on the taught flag, whatever the streak", () => {
      const out = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 0 },
        taughtFlag: true,
      });
      expect(out.discoveredThisTurn).toBe(true);
      expect(out.trigger).toBe("taught");
      expect(out.state.knowsMethod).toBe(true);
    });

    it("increments the streak on aligned acting below the threshold", () => {
      const out = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 2 },
        alignment: ACTING_ALIGNED_THRESHOLD,
        taughtFlag: false,
      });
      expect(out.discoveredThisTurn).toBe(false);
      expect(out.state).toEqual({ knowsMethod: false, alignedStreak: 3 });
    });

    it("resets the streak on a lapse (below threshold or no alignment)", () => {
      const lapsed = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 4 },
        alignment: ACTING_ALIGNED_THRESHOLD - 0.01,
        taughtFlag: false,
      });
      expect(lapsed.state).toEqual({ knowsMethod: false, alignedStreak: 0 });

      const noAlignment = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 4 },
        taughtFlag: false,
      });
      expect(noAlignment.state).toEqual({ knowsMethod: false, alignedStreak: 0 });
    });

    it("discovers by repetition once the streak reaches the threshold", () => {
      const out = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: ACTING_DISCOVERY_STREAK - 1 },
        alignment: 0.8,
        taughtFlag: false,
      });
      expect(out.discoveredThisTurn).toBe(true);
      expect(out.trigger).toBe("repetition");
      expect(out.state).toEqual({
        knowsMethod: true,
        alignedStreak: ACTING_DISCOVERY_STREAK,
      });
    });

    it("discovers via completion when digestion finishes, even with a cold streak", () => {
      const out = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 0 },
        alignment: 0.4,
        taughtFlag: false,
        digestionComplete: true,
      });
      expect(out.discoveredThisTurn).toBe(true);
      expect(out.trigger).toBe("completion");
      expect(out.state.knowsMethod).toBe(true);
    });

    it("prefers the taught trigger over completion when both fire", () => {
      const out = evaluateActingDiscovery({
        state: { knowsMethod: false, alignedStreak: 0 },
        taughtFlag: true,
        digestionComplete: true,
      });
      expect(out.trigger).toBe("taught");
    });

    it("does not mutate the input state", () => {
      const state: ActingMethodState = { knowsMethod: false, alignedStreak: 1 };
      evaluateActingDiscovery({ state, alignment: 0.9, taughtFlag: false });
      expect(state).toEqual({ knowsMethod: false, alignedStreak: 1 });
    });
  });
});
