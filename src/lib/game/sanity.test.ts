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
  HORROR_TAG_GAP,
  SANITY_EVENT_TAGS,
  SANITY_DESCRIPTORS,
  SANITY_DRAIN_INROLE_RELIEF,
  IN_ROLE_RECOVERY_MAX,
  sanityPercent,
  classifySanityTier,
  sanityEffects,
  sanityDescriptor,
  sanityDelta,
  sanityDeltaForTags,
  inRoleDrainMultiplier,
  inRoleRecovery,
  previewSanityImpact,
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
  });

  describe("sanityEffects", () => {
    it("returns the profile for the current sanity tier", () => {
      expect(sanityEffects(100, 100)).toBe(SANITY_EFFECTS.high);
      expect(sanityEffects(10, 100)).toBe(SANITY_EFFECTS.critical);
    });
  });

  describe("SANITY_DESCRIPTORS / sanityDescriptor", () => {
    const tiers: SanityTier[] = ["high", "medium", "low", "critical"];

    it("defines a non-empty in-world descriptor for every tier", () => {
      for (const tier of tiers) {
        expect(SANITY_DESCRIPTORS[tier].length).toBeGreaterThan(0);
      }
    });

    it("maps a sanity value to its tier descriptor", () => {
      expect(sanityDescriptor(100, 100)).toBe(SANITY_DESCRIPTORS.high);
      expect(sanityDescriptor(50, 100)).toBe(SANITY_DESCRIPTORS.medium);
      expect(sanityDescriptor(20, 100)).toBe(SANITY_DESCRIPTORS.low);
      expect(sanityDescriptor(5, 100)).toBe(SANITY_DESCRIPTORS.critical);
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

  describe("sanityDeltaForTags (issue #95)", () => {
    it("returns 0 for an empty tag list", () => {
      expect(sanityDeltaForTags([], 9)).toBe(0);
    });

    it("matches sanityDelta for each flat recovery tag", () => {
      expect(sanityDeltaForTags(["rest"], 9)).toBe(sanityDelta({ type: "rest" }));
      expect(sanityDeltaForTags(["human-connection"], 9)).toBe(
        sanityDelta({ type: "human-connection" }),
      );
      expect(sanityDeltaForTags(["routine"], 9)).toBe(sanityDelta({ type: "routine" }));
    });

    it("resolves ability-use against the player's Sequence", () => {
      expect(sanityDeltaForTags(["ability-use"], 9)).toBe(
        sanityDelta({ type: "ability-use", sequenceLevel: 9 }),
      );
      const strong = sanityDeltaForTags(["ability-use"], 4);
      expect(strong).toBe(sanityDelta({ type: "ability-use", sequenceLevel: 4 }));
      // A stronger Beyonder (lower number) pays more.
      expect(strong).toBeLessThan(sanityDeltaForTags(["ability-use"], 9));
    });

    it("models a horror tag as one rung above the player (HORROR_TAG_GAP)", () => {
      expect(sanityDeltaForTags(["horror-encounter"], 7)).toBe(
        sanityDelta({
          type: "horror-encounter",
          playerSequence: 7,
          horrorSequence: 7 - HORROR_TAG_GAP,
        }),
      );
    });

    it("sums multiple tags", () => {
      const total = sanityDeltaForTags(["rest", "routine"], 9);
      expect(total).toBe(REST_RECOVERY + ROUTINE_RECOVERY);
    });

    it("exposes exactly the five known tags", () => {
      expect([...SANITY_EVENT_TAGS].sort()).toEqual(
        ["ability-use", "horror-encounter", "human-connection", "rest", "routine"].sort(),
      );
      expect(HORROR_TAG_GAP).toBe(1);
    });
  });

  describe("in-role drain dampening (acting alignment)", () => {
    it("gives no relief at or below neutral acting, or with no score", () => {
      expect(inRoleDrainMultiplier(undefined)).toBe(1);
      expect(inRoleDrainMultiplier(0.5)).toBe(1);
      expect(inRoleDrainMultiplier(0.2)).toBe(1);
      expect(inRoleDrainMultiplier(0)).toBe(1);
    });

    it("scales drains down as acting rises from neutral to fully in-role", () => {
      expect(inRoleDrainMultiplier(1)).toBeCloseTo(1 - SANITY_DRAIN_INROLE_RELIEF);
      // Halfway in-role (0.75) gets half the relief.
      expect(inRoleDrainMultiplier(0.75)).toBeCloseTo(1 - SANITY_DRAIN_INROLE_RELIEF / 2);
      // Monotonic: more in-role → smaller multiplier.
      expect(inRoleDrainMultiplier(1)).toBeLessThan(inRoleDrainMultiplier(0.75));
    });

    it("clamps an out-of-range alignment before scaling", () => {
      expect(inRoleDrainMultiplier(2)).toBe(inRoleDrainMultiplier(1));
      expect(inRoleDrainMultiplier(-1)).toBe(1);
    });

    it("dampens horror/ability drains for an in-role turn but never recoveries", () => {
      const baseHorror = sanityDeltaForTags(["horror-encounter"], 9);
      const dampened = sanityDeltaForTags(["horror-encounter"], 9, 1);
      expect(dampened).toBe(Math.round(baseHorror * inRoleDrainMultiplier(1)));
      expect(dampened).toBeGreaterThan(baseHorror); // less negative
      // Neutral acting leaves the drain untouched.
      expect(sanityDeltaForTags(["horror-encounter"], 9, 0.5)).toBe(baseHorror);
      // Recovery tags are never dampened.
      expect(sanityDeltaForTags(["routine"], 9, 1)).toBe(
        sanityDelta({ type: "routine" }),
      );
    });

    it("dampens only the drain half of a mixed turn", () => {
      const baseHorror = sanityDeltaForTags(["horror-encounter"], 9);
      const routine = sanityDelta({ type: "routine" });
      const mixed = sanityDeltaForTags(["horror-encounter", "routine"], 9, 1);
      expect(mixed).toBe(routine + Math.round(baseHorror * inRoleDrainMultiplier(1)));
    });

    it("flows alignment through previewSanityImpact: dampened drain + recovery + dampened residual", () => {
      const raw = previewSanityImpact(["horror-encounter"], -4, 9);
      expect(raw).toEqual({
        tagDelta: -8,
        actingRecovery: 0,
        residual: -4,
        total: -12,
      });

      const inRole = previewSanityImpact(["horror-encounter"], -4, 9, 1);
      expect(inRole.tagDelta).toBe(sanityDeltaForTags(["horror-encounter"], 9, 1));
      expect(inRole.actingRecovery).toBe(inRoleRecovery(1));
      // A negative residual is dampened like a drain.
      expect(inRole.residual).toBe(Math.round(-4 * inRoleDrainMultiplier(1)));
      expect(inRole.total).toBe(
        inRole.tagDelta + inRole.actingRecovery + inRole.residual,
      );
      // An in-role turn is far less punishing than the same turn played flat.
      expect(inRole.total).toBeGreaterThan(raw.total);
    });

    it("does not dampen a positive (soothing) residual", () => {
      const inRole = previewSanityImpact([], 4, 9, 1);
      expect(inRole.actingRecovery).toBe(inRoleRecovery(1));
      expect(inRole.residual).toBe(4);
      expect(inRole.total).toBe(inRoleRecovery(1) + 4);
    });

    it("normalises a fully-dampened small negative residual to +0 (never -0)", () => {
      // -1 * 0.25 = -0.25 → Math.round → -0; the `|| 0` keeps the field +0.
      const inRole = previewSanityImpact([], -1, 9, 1);
      expect(Object.is(inRole.residual, -0)).toBe(false);
      expect(inRole.residual).toBe(0);
    });
  });

  describe("in-role recovery (acting alignment)", () => {
    it("gives no recovery at or below neutral acting, or with no score", () => {
      expect(inRoleRecovery(undefined)).toBe(0);
      expect(inRoleRecovery(0.5)).toBe(0);
      expect(inRoleRecovery(0.2)).toBe(0);
      expect(inRoleRecovery(0)).toBe(0);
    });

    it("rises from 0 at neutral to the cap at full in-role acting", () => {
      expect(inRoleRecovery(1)).toBe(IN_ROLE_RECOVERY_MAX);
      expect(inRoleRecovery(0.75)).toBe(Math.round(IN_ROLE_RECOVERY_MAX / 2));
      expect(inRoleRecovery(1)).toBeGreaterThan(inRoleRecovery(0.75));
    });

    it("clamps an out-of-range alignment", () => {
      expect(inRoleRecovery(2)).toBe(IN_ROLE_RECOVERY_MAX);
      expect(inRoleRecovery(-1)).toBe(0);
    });

    it("stays gentle — a single in-role turn heals less than a deliberate rest", () => {
      expect(inRoleRecovery(1)).toBeLessThan(sanityDelta({ type: "rest" }));
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
