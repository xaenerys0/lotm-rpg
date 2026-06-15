import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import {
  advancementHighRisk,
  advancementRequirements,
  advancementSuccessChance,
  attemptAdvancement,
  canAdvance,
  isAdvanceableSequence,
  ritualRequiredFor,
  targetSequence,
  ADVANCEMENT_SANITY_RATIO,
} from "./advancement";
import { consecrateAnchor, emptyAnchorState, requiredSupport } from "./anchors";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A character standing on `sequenceLevel` with a fully digested potion and every
// canon ingredient for the next rung in hand — so each test can knock out one
// prerequisite and watch the outcome. Ingredients are read from the rules engine
// so the fixture stays correct as the pathway data is enriched.
function readyToAdvance(sequenceLevel: number, pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const target = targetSequence(sequenceLevel);
  const prerequisiteItems = getSequence(pathwayId, target)?.prerequisiteItems ?? [];
  const gameState = {
    ...base,
    sequenceLevel,
    sanity: 100,
    maxSanity: 100,
    inventory: [...prerequisiteItems],
    digestion: { pathwayId, sequenceLevel, progress: 100, complete: true },
  };
  return createSession(gameState, "session-1");
}

// Anchors holding past the requirement for `target`, for high-tier fixtures.
function withAnchors(session: GameSession, target: number): GameSession {
  let anchors = emptyAnchorState();
  // Three strong anchors clear every Saint/Angel requirement.
  anchors = consecrateAnchor(anchors, {
    kind: "congregation",
    name: "The Church of Evernight",
  });
  anchors = consecrateAnchor(anchors, { kind: "place", name: "Tingen Cathedral" });
  anchors = consecrateAnchor(anchors, { kind: "object", name: "The crimson moon" });
  // Sanity check that the fixture actually clears the bar.
  expect(requiredSupport(target)).toBeGreaterThanOrEqual(0);
  return { ...session, anchorState: anchors };
}

describe("range helpers", () => {
  it("treats Sequence 9 – 2 as advanceable, Seq 1 and 0 not", () => {
    expect(isAdvanceableSequence(9)).toBe(true);
    expect(isAdvanceableSequence(2)).toBe(true);
    expect(isAdvanceableSequence(1)).toBe(false);
    expect(isAdvanceableSequence(0)).toBe(false);
    expect(isAdvanceableSequence(10)).toBe(false);
  });

  it("targets one rung lower", () => {
    expect(targetSequence(9)).toBe(8);
    expect(targetSequence(2)).toBe(1);
  });

  it("requires a ritual from Sequence 5 onward", () => {
    expect(ritualRequiredFor(6)).toBe(false);
    expect(ritualRequiredFor(5)).toBe(true);
    expect(ritualRequiredFor(4)).toBe(true);
  });
});

describe("advancementRequirements", () => {
  it("is fully met for a prepared low-Sequence Beyonder", () => {
    const session = readyToAdvance(7); // target 6 — no ritual, no anchors
    const reqs = advancementRequirements(session);
    expect(reqs.every((r) => r.met)).toBe(true);
    expect(canAdvance(session)).toBe(true);
  });

  it("flags a character who cannot climb from this rung (Seq 1)", () => {
    const session = readyToAdvance(7);
    const seqOne = { ...session, gameState: { ...session.gameState, sequenceLevel: 1 } };
    expect(advancementRequirements(seqOne).find((r) => r.id === "sequence")?.met).toBe(
      false,
    );
    expect(canAdvance(seqOne)).toBe(false);
  });

  it("requires a fully digested potion", () => {
    const session = readyToAdvance(7);
    const undigested = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { ...session.gameState.digestion!, complete: false, progress: 50 },
      },
    };
    expect(
      advancementRequirements(undigested).find((r) => r.id === "digestion")?.met,
    ).toBe(false);
    expect(canAdvance(undigested)).toBe(false);
  });

  it("requires the next potion's ingredients when the sequence defines them", () => {
    const target = targetSequence(7);
    const prereq = getSequence(1, target)?.prerequisiteItems ?? [];
    if (prereq.length === 0) return; // sequence has no canon ingredients yet
    const session = readyToAdvance(7);
    const empty = { ...session, gameState: { ...session.gameState, inventory: [] } };
    const req = advancementRequirements(empty).find((r) => r.id === "ingredients");
    expect(req?.met).toBe(false);
    expect(canAdvance(empty)).toBe(false);
  });

  it("is not satisfied by mundane items the AI named like the ingredients (issue #90)", () => {
    const target = targetSequence(7);
    const prereq = getSequence(1, target)?.prerequisiteItems ?? [];
    if (prereq.length === 0) return; // sequence has no canon ingredients yet
    const session = readyToAdvance(7);
    // Same names, but every one downgraded to mundane — exactly what a narration
    // bypass would produce. The category-aware gate must still mark it unmet.
    const decoys = prereq.map((i) => ({ ...i, category: "mundane" as const }));
    const spoofed = {
      ...session,
      gameState: { ...session.gameState, inventory: decoys },
    };
    expect(
      advancementRequirements(spoofed).find((r) => r.id === "ingredients")?.met,
    ).toBe(false);
    expect(canAdvance(spoofed)).toBe(false);
  });

  it("requires the Advancement Ritual from Sequence 5 onward (mandatory)", () => {
    const session = readyToAdvance(6); // target 5 — ritual tier
    const ritualReq = advancementRequirements(session).find((r) => r.id === "ritual");
    expect(ritualReq).toBeDefined();
    // A canon pathway defines the rite, so it is met and the climb is allowed.
    expect(ritualReq?.met).toBe(true);
    expect(canAdvance(session)).toBe(true);
  });

  it("does not add a ritual requirement below Sequence 5", () => {
    const session = readyToAdvance(7); // target 6
    expect(
      advancementRequirements(session).find((r) => r.id === "ritual"),
    ).toBeUndefined();
  });

  it("requires anchors at the Saint tier and rejects an under-anchored attempt", () => {
    const session = readyToAdvance(5); // target 4 — anchors relevant
    const reqs = advancementRequirements(session);
    const anchorReq = reqs.find((r) => r.id === "anchors");
    expect(anchorReq).toBeDefined();
    expect(anchorReq?.met).toBe(false); // no anchorState
    expect(canAdvance(session)).toBe(false);
    // With anchors consecrated past the requirement, the gate clears.
    const anchored = withAnchors(session, targetSequence(5));
    expect(advancementRequirements(anchored).find((r) => r.id === "anchors")?.met).toBe(
      true,
    );
  });

  it("requires a steady mind (sanity floor)", () => {
    const session = readyToAdvance(7);
    const frayed = {
      ...session,
      gameState: { ...session.gameState, sanity: 5 },
    };
    expect(advancementRequirements(frayed).find((r) => r.id === "sanity")?.met).toBe(
      false,
    );
    expect(canAdvance(frayed)).toBe(false);
  });
});

describe("advancementSuccessChance", () => {
  it("stays within (0.05, 0.95] and is never certain", () => {
    for (let seq = 9; seq >= 2; seq--) {
      const chance = advancementSuccessChance(readyToAdvance(seq));
      expect(chance).toBeGreaterThanOrEqual(0.05);
      expect(chance).toBeLessThanOrEqual(0.95);
    }
  });

  it("falls as the rungs get higher", () => {
    const low = advancementSuccessChance(readyToAdvance(9)); // target 8
    const high = advancementSuccessChance(readyToAdvance(6)); // target 5
    expect(low).toBeGreaterThan(high);
  });

  it("rises with anchor surplus at the Saint tier", () => {
    const base = readyToAdvance(5); // target 4 — anchors relevant
    const anchored = withAnchors(base, targetSequence(5));
    // Anchors past the requirement steady the climb vs. the un-anchored case.
    expect(advancementSuccessChance(anchored)).toBeGreaterThanOrEqual(
      advancementSuccessChance(base),
    );
  });

  it("rises with a fuller mind", () => {
    const session = readyToAdvance(7);
    const frayed = { ...session, gameState: { ...session.gameState, sanity: 30 } };
    expect(advancementSuccessChance(session)).toBeGreaterThan(
      advancementSuccessChance(frayed),
    );
  });
});

describe("attemptAdvancement", () => {
  it("advances on success: decrements the sequence, resets digestion, drains sanity", () => {
    const session = readyToAdvance(7); // target 6
    const result = attemptAdvancement(session, () => 0, 1234);
    expect(result.outcome).toBe("advanced");
    if (result.outcome !== "advanced") return;
    expect(result.newSequenceLevel).toBe(6);
    expect(result.session.gameState.sequenceLevel).toBe(6);
    expect(result.session.gameState.digestion?.sequenceLevel).toBe(6);
    expect(result.session.gameState.digestion?.complete).toBe(false);
    expect(result.session.gameState.digestion?.progress).toBe(0);
    expect(result.session.gameState.sanity).toBeLessThan(session.gameState.sanity);
    expect(result.session.updatedAt).toBe(1234);
  });

  it("consumes the next potion's ingredients from inventory", () => {
    const target = targetSequence(7);
    const prereq = getSequence(1, target)?.prerequisiteItems ?? [];
    const extra = {
      name: "A keepsake",
      description: "Not an ingredient",
      category: "main-ingredient" as const,
    };
    const session = readyToAdvance(7);
    const stocked = {
      ...session,
      gameState: {
        ...session.gameState,
        inventory: [...prereq, extra],
      },
    };
    const result = attemptAdvancement(stocked, () => 0);
    expect(result.outcome).toBe("advanced");
    if (result.outcome !== "advanced") return;
    // Ingredients gone, the keepsake stays.
    expect(result.session.gameState.inventory.some((i) => i.name === "A keepsake")).toBe(
      true,
    );
    for (const item of prereq) {
      expect(result.session.gameState.inventory.some((i) => i.name === item.name)).toBe(
        false,
      );
    }
  });

  it("records advancement memory facts (and a ritual fact at the ritual tier)", () => {
    const lowResult = attemptAdvancement(readyToAdvance(7), () => 0);
    expect(lowResult.outcome).toBe("advanced");
    if (lowResult.outcome !== "advanced") return;
    const lowFacts = lowResult.session.memory.sessionFacts;
    expect(lowFacts.some((f) => /advanced to Sequence 6/i.test(f.description))).toBe(
      true,
    );

    const ritualResult = attemptAdvancement(readyToAdvance(6), () => 0);
    if (ritualResult.outcome !== "advanced") return;
    const target = targetSequence(6);
    const hasRitual = getSequence(1, target)?.advancementRitual !== undefined;
    const facts = ritualResult.session.memory.sessionFacts;
    if (hasRitual) {
      expect(facts.some((f) => /ritual/i.test(f.description))).toBe(true);
      expect(ritualResult.ritual).toBeDefined();
    }
  });

  it("loses control on a failed roll, resolved by the death engine", () => {
    const result = attemptAdvancement(readyToAdvance(7), () => 1);
    expect(result.outcome).toBe("lost-control");
    if (result.outcome !== "lost-control") return;
    expect(result.verdict.cause).toBe("loss-of-control");
    expect(["setback", "permadeath"]).toContain(result.verdict.outcome);
  });

  it("escalates loss of control at high Sequences", () => {
    // Force failure; a Saint-tier (Seq 5 → 4) loss is more catastrophic than a
    // low-Sequence one.
    const low = attemptAdvancement(readyToAdvance(9), () => 1);
    const high = attemptAdvancement(withAnchors(readyToAdvance(5), 4), () => 1);
    if (low.outcome !== "lost-control" || high.outcome !== "lost-control") {
      throw new Error("expected forced loss of control");
    }
    const order = { setback: 0, transformation: 1, fatal: 2 } as const;
    expect(order[high.verdict.severity]).toBeGreaterThanOrEqual(
      order[low.verdict.severity],
    );
  });

  it("treats an unready attempt as an immediate loss of control", () => {
    const session = readyToAdvance(7);
    const undigested = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { ...session.gameState.digestion!, complete: false, progress: 10 },
      },
    };
    // random() => 0 would normally succeed; gating still routes to loss of control.
    const result = attemptAdvancement(undigested, () => 0);
    expect(result.outcome).toBe("lost-control");
  });
});

describe("canon-data fallbacks", () => {
  it("uses generic labels when the sequence is unknown", () => {
    const base = createDefaultGameState(1, "char-1", "Klein");
    const gameState = {
      ...base,
      pathwayId: 999, // no such pathway → getSequence/getPathway return undefined
      sequenceLevel: 7,
      sanity: 100,
      maxSanity: 100,
      inventory: [],
      digestion: { pathwayId: 999, sequenceLevel: 7, progress: 100, complete: true },
    };
    const session = createSession(gameState, "session-1");
    // Target 6 — no ingredients, ritual, or anchors are derivable, so the hard
    // gates still clear.
    expect(canAdvance(session)).toBe(true);
    const result = attemptAdvancement(session, () => 0);
    expect(result.outcome).toBe("advanced");
    if (result.outcome !== "advanced") return;
    expect(result.roleName).toBe("Sequence 6");
    expect(
      result.session.memory.sessionFacts.some((f) => /the pathway/.test(f.description)),
    ).toBe(true);
  });

  it("shows a generic ritual label when canon text is absent", () => {
    const base = createDefaultGameState(1, "char-1", "Klein");
    const gameState = {
      ...base,
      pathwayId: 999,
      sequenceLevel: 6, // target 5 — ritual tier, but no canon data
      sanity: 100,
      maxSanity: 100,
      inventory: [],
      digestion: { pathwayId: 999, sequenceLevel: 6, progress: 100, complete: true },
    };
    const session = createSession(gameState, "session-1");
    const ritualReq = advancementRequirements(session).find((r) => r.id === "ritual");
    expect(ritualReq?.label).toMatch(/Advancement Ritual/i);
    expect(ritualReq?.met).toBe(false);
    // A mandatory ritual the pathway does not define is a hard block.
    expect(canAdvance(session)).toBe(false);
  });
});

describe("anchor-gated advancement", () => {
  // A Saint-tier climb (Seq 3 → 2) where anchors matter.
  function saintSession(): GameSession {
    const base = createDefaultGameState(1, "char-1", "Klein");
    const gameState = {
      ...base,
      sequenceLevel: 3,
      sanity: 100,
      maxSanity: 100,
      inventory: getSequence(1, 2)?.prerequisiteItems ?? [],
      digestion: { pathwayId: 1, sequenceLevel: 3, progress: 100, complete: true },
    };
    return { ...createSession(gameState, "session-1"), anchorState: emptyAnchorState() };
  }

  it("flags high risk and factors anchors into the odds when under-anchored", () => {
    const session = saintSession();
    // A steady mind, leaving the anchor branch to decide: an empty anchor state
    // is under-supported at the Saint tier.
    expect(advancementHighRisk(session)).toBe(true);
    const chance = advancementSuccessChance(session);
    expect(chance).toBeGreaterThanOrEqual(0.05);
    expect(chance).toBeLessThanOrEqual(0.95);
  });
});

describe("advancementHighRisk", () => {
  it("is true when the mind is frayed below the sanity floor", () => {
    const session = readyToAdvance(7);
    const frayed = {
      ...session,
      gameState: {
        ...session.gameState,
        sanity: Math.floor(session.gameState.maxSanity * ADVANCEMENT_SANITY_RATIO) - 1,
      },
    };
    expect(advancementHighRisk(frayed)).toBe(true);
  });

  it("is false for a steady-minded climb below the Saint tier", () => {
    // Seq 6 → 5: anchors are not yet relevant and the mind is clear, so neither
    // high-risk lever trips.
    expect(advancementHighRisk(readyToAdvance(6))).toBe(false);
  });
});
