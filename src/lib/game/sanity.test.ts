import { describe, it, expect } from "vitest";
import type { GameState } from "@/lib/ai";
import {
  SANITY_MIN,
  SANITY_TIER_THRESHOLDS,
  SANITY_EFFECTS,
  ABILITY_USE_BASE_DRAIN,
  ABILITY_USE_PER_SEQUENCE,
  HORROR_BASE_DRAIN,
  HORROR_PER_GAP,
  MAX_HORROR_DRAIN,
  ADVANCEMENT_DRAIN,
  OUTER_DEITY_DRAIN,
  ACTING_SUCCESS_RECOVERY,
  REST_RECOVERY,
  HUMAN_CONNECTION_RECOVERY,
  ROUTINE_RECOVERY,
  ACTING_NEGLECT_DECAY,
  sanityPercent,
  classifySanityTier,
  sanityEffects,
  sanityDelta,
  isLossOfControl,
  evaluateLossOfControl,
  type SanityTier,
} from "./sanity";

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    characterId: "c1",
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

describe("sanity", () => {
  describe("sanityPercent", () => {
    it("computes a percentage of max sanity", () => {
      expect(sanityPercent(50, 100)).toBe(50);
      expect(sanityPercent(30, 120)).toBe(25);
    });

    it("clamps to [0, 100]", () => {
      expect(sanityPercent(-10, 100)).toBe(0);
      expect(sanityPercent(150, 100)).toBe(100);
    });

    it("returns 0 when max sanity is non-positive", () => {
      expect(sanityPercent(50, 0)).toBe(0);
      expect(sanityPercent(50, -5)).toBe(0);
    });
  });

  describe("classifySanityTier", () => {
    it("classifies high at and above 75%", () => {
      expect(classifySanityTier(100, 100)).toBe("high");
      expect(classifySanityTier(75, 100)).toBe("high");
    });

    it("classifies medium in [40, 75)", () => {
      expect(classifySanityTier(74, 100)).toBe("medium");
      expect(classifySanityTier(40, 100)).toBe("medium");
    });

    it("classifies low in [15, 40)", () => {
      expect(classifySanityTier(39, 100)).toBe("low");
      expect(classifySanityTier(15, 100)).toBe("low");
    });

    it("classifies critical below 15%", () => {
      expect(classifySanityTier(14, 100)).toBe("critical");
      expect(classifySanityTier(0, 100)).toBe("critical");
    });

    it("uses thresholds relative to max sanity", () => {
      expect(classifySanityTier(150, 200)).toBe("high"); // 75%
      expect(classifySanityTier(80, 200)).toBe("medium"); // 40%
      expect(classifySanityTier(79, 200)).toBe("low"); // 39.5%
    });
  });

  describe("SANITY_TIER_THRESHOLDS", () => {
    it("matches the design spec boundaries", () => {
      expect(SANITY_TIER_THRESHOLDS.high).toBe(75);
      expect(SANITY_TIER_THRESHOLDS.medium).toBe(40);
      expect(SANITY_TIER_THRESHOLDS.low).toBe(15);
    });
  });

  describe("SANITY_EFFECTS", () => {
    const tiers: SanityTier[] = ["high", "medium", "low", "critical"];

    it("defines a profile for every tier keyed to itself", () => {
      for (const tier of tiers) {
        expect(SANITY_EFFECTS[tier].tier).toBe(tier);
        expect(SANITY_EFFECTS[tier].className).toContain("sanity-fx-");
        expect(SANITY_EFFECTS[tier].label.length).toBeGreaterThan(0);
      }
    });

    it("escalates distortion as sanity falls", () => {
      expect(SANITY_EFFECTS.high.distortion).toBe(0);
      expect(SANITY_EFFECTS.medium.distortion).toBeGreaterThan(
        SANITY_EFFECTS.high.distortion,
      );
      expect(SANITY_EFFECTS.low.distortion).toBeGreaterThan(
        SANITY_EFFECTS.medium.distortion,
      );
      expect(SANITY_EFFECTS.critical.distortion).toBe(1);
    });

    it("gates narrative degradations to the lower tiers", () => {
      expect(SANITY_EFFECTS.high.unreliableNarration).toBe(false);
      expect(SANITY_EFFECTS.medium.unreliableNarration).toBe(false);
      expect(SANITY_EFFECTS.low.unreliableNarration).toBe(true);
      expect(SANITY_EFFECTS.low.falseChoices).toBe(true);
      expect(SANITY_EFFECTS.low.hallucinations).toBe(false);
      expect(SANITY_EFFECTS.critical.hallucinations).toBe(true);
    });
  });

  describe("sanityEffects", () => {
    it("returns the profile for the current sanity tier", () => {
      expect(sanityEffects(100, 100)).toBe(SANITY_EFFECTS.high);
      expect(sanityEffects(10, 100)).toBe(SANITY_EFFECTS.critical);
    });
  });

  describe("sanityDelta — drains", () => {
    it("drains more for higher-sequence ability use", () => {
      const weak = sanityDelta({ type: "ability-use", sequenceLevel: 9 });
      const strong = sanityDelta({ type: "ability-use", sequenceLevel: 5 });
      expect(weak).toBe(-ABILITY_USE_BASE_DRAIN);
      expect(strong).toBeLessThan(weak);
      expect(strong).toBe(
        -Math.round(ABILITY_USE_BASE_DRAIN + 4 * ABILITY_USE_PER_SEQUENCE),
      );
    });

    it("clamps ability sequence level to the valid range", () => {
      const overHigh = sanityDelta({ type: "ability-use", sequenceLevel: 99 });
      const atMin = sanityDelta({ type: "ability-use", sequenceLevel: 0 });
      // Above-range clamps to 9 (weakest), below-range clamps to 0 (strongest).
      expect(overHigh).toBe(-ABILITY_USE_BASE_DRAIN);
      expect(atMin).toBe(
        -Math.round(ABILITY_USE_BASE_DRAIN + 9 * ABILITY_USE_PER_SEQUENCE),
      );
    });

    it("scales horror drain to the sequence gap", () => {
      // Horror is stronger (lower number) -> positive gap -> more drain.
      const stronger = sanityDelta({
        type: "horror-encounter",
        playerSequence: 9,
        horrorSequence: 7,
      });
      expect(stronger).toBe(-(HORROR_BASE_DRAIN + 2 * HORROR_PER_GAP));
    });

    it("applies only the base drain when the horror is weaker", () => {
      const weaker = sanityDelta({
        type: "horror-encounter",
        playerSequence: 5,
        horrorSequence: 9,
      });
      expect(weaker).toBe(-HORROR_BASE_DRAIN);
    });

    it("caps horror drain at the maximum", () => {
      const overwhelming = sanityDelta({
        type: "horror-encounter",
        playerSequence: 9,
        horrorSequence: 0,
      });
      expect(overwhelming).toBe(-MAX_HORROR_DRAIN);
    });

    it("applies a large advancement drain", () => {
      expect(sanityDelta({ type: "advancement" })).toBe(-ADVANCEMENT_DRAIN);
    });

    it("applies a massive Outer Deity drain", () => {
      expect(sanityDelta({ type: "outer-deity" })).toBe(-OUTER_DEITY_DRAIN);
    });
  });

  describe("sanityDelta — recovery and decay", () => {
    it("recovers from successful acting scaled by alignment", () => {
      expect(sanityDelta({ type: "acting-success", alignment: 1 })).toBe(
        ACTING_SUCCESS_RECOVERY,
      );
      expect(sanityDelta({ type: "acting-success", alignment: 0.75 })).toBe(
        Math.round(ACTING_SUCCESS_RECOVERY / 2),
      );
    });

    it("does not recover when acting is below neutral", () => {
      expect(sanityDelta({ type: "acting-success", alignment: 0.5 })).toBe(0);
      expect(sanityDelta({ type: "acting-success", alignment: 0.2 })).toBe(0);
    });

    it("clamps acting alignment to [0, 1]", () => {
      expect(sanityDelta({ type: "acting-success", alignment: 5 })).toBe(
        ACTING_SUCCESS_RECOVERY,
      );
      expect(sanityDelta({ type: "acting-success", alignment: -5 })).toBe(0);
    });

    it("recovers from rest, connection, and routine", () => {
      expect(sanityDelta({ type: "rest" })).toBe(REST_RECOVERY);
      expect(sanityDelta({ type: "human-connection" })).toBe(HUMAN_CONNECTION_RECOVERY);
      expect(sanityDelta({ type: "routine" })).toBe(ROUTINE_RECOVERY);
    });

    it("decays slowly from neglecting the acting method", () => {
      expect(sanityDelta({ type: "acting-neglect" })).toBe(-ACTING_NEGLECT_DECAY);
    });
  });

  describe("isLossOfControl", () => {
    it("is true at or below the sanity floor", () => {
      expect(isLossOfControl(makeState({ sanity: 0 }))).toBe(true);
      expect(isLossOfControl(makeState({ sanity: SANITY_MIN }))).toBe(true);
    });

    it("is false while sanity remains", () => {
      expect(isLossOfControl(makeState({ sanity: 1 }))).toBe(false);
      expect(isLossOfControl(makeState({ sanity: 100 }))).toBe(false);
    });
  });

  describe("evaluateLossOfControl", () => {
    it("is a setback for low sequences", () => {
      expect(evaluateLossOfControl({ sequenceLevel: 9 })).toBe("setback");
      expect(evaluateLossOfControl({ sequenceLevel: 6 })).toBe("setback");
    });

    it("is a transformation for mid sequences", () => {
      expect(evaluateLossOfControl({ sequenceLevel: 5 })).toBe("transformation");
      expect(evaluateLossOfControl({ sequenceLevel: 3 })).toBe("transformation");
    });

    it("is fatal for high sequences", () => {
      expect(evaluateLossOfControl({ sequenceLevel: 2 })).toBe("fatal");
      expect(evaluateLossOfControl({ sequenceLevel: 0 })).toBe("fatal");
    });

    it("escalates severity by one step under high risk", () => {
      expect(evaluateLossOfControl({ sequenceLevel: 9, highRisk: true })).toBe(
        "transformation",
      );
      expect(evaluateLossOfControl({ sequenceLevel: 5, highRisk: true })).toBe("fatal");
    });

    it("does not escalate past fatal", () => {
      expect(evaluateLossOfControl({ sequenceLevel: 0, highRisk: true })).toBe("fatal");
    });
  });
});
