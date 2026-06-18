import { describe, expect, it } from "vitest";

import { consecrateAnchor, emptyAnchorState } from "./anchors";
import { sequenceAbilities, uniquenessItemFor } from "./apotheosis";
import {
  attemptPillarAscension,
  canAttemptPillarAscension,
  pillarAscensionSuccessChance,
  pillarName,
  pillarRequirements,
  PILLAR_ABILITIES,
  PILLAR_ACTING,
  PILLAR_SEQUENCE,
} from "./pillars";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A Sequence 0 True God of the Fool pathway who meets every Pillar requirement,
// so each test can knock out exactly one prerequisite and observe the verdict.
// The Fool's own Uniqueness was consumed at apotheosis; the ascent needs the
// sibling pathways' Uniquenesses (Door = 7, Error = 8).
function readyPillarSession(pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const gameState = {
    ...base,
    sequenceLevel: 0,
    sanity: 100,
    maxSanity: 100,
    inventory: [uniquenessItemFor(7), uniquenessItemFor(8)],
    digestion: { pathwayId, sequenceLevel: 0, progress: 100, complete: true },
  };
  // Four congregations (weight 1 × 100 each = 400) clear the 300 Pillar floor
  // with surplus to spare.
  let anchors = emptyAnchorState();
  for (const name of ["First Church", "Second Church", "Third Church", "Fourth Church"]) {
    anchors = consecrateAnchor(anchors, { kind: "congregation", name });
  }
  return { ...createSession(gameState, "session-1"), anchorState: anchors };
}

describe("PILLAR_SEQUENCE", () => {
  it("is the negative sentinel above Sequence 0", () => {
    expect(PILLAR_SEQUENCE).toBe(-1);
    expect(PILLAR_SEQUENCE).toBeLessThan(0);
  });
});

describe("pillarName", () => {
  it("names the family Pillar, with a generic fallback off-family", () => {
    expect(pillarName(1)).toBe("Lord of Mysteries");
    expect(pillarName(17)).toBe("Mother Goddess of Depravity");
    expect(pillarName(20)).toBe("the Pillar"); // Wheel of Fortune — no Pillar
  });
});

describe("sequenceAbilities at the Pillar tier", () => {
  it("returns the Pillar framing, not a True God's or a Sequence's", () => {
    const { abilities, acting } = sequenceAbilities(1, PILLAR_SEQUENCE);
    expect(abilities).toEqual([...PILLAR_ABILITIES]);
    expect(acting).toEqual([...PILLAR_ACTING]);
  });
});

describe("pillarRequirements", () => {
  it("passes every gate for a ready True God of a Pillar family", () => {
    expect(canAttemptPillarAscension(readyPillarSession())).toBe(true);
  });

  it("fails when not yet a True God", () => {
    const s = readyPillarSession();
    const session = { ...s, gameState: { ...s.gameState, sequenceLevel: 1 } };
    const req = pillarRequirements(session).find((r) => r.id === "sequence")!;
    expect(req.met).toBe(false);
    expect(canAttemptPillarAscension(session)).toBe(false);
  });

  it("fails when the pathway has no Pillar above Sequence 0", () => {
    // Wheel of Fortune (20) is a True God but caps there.
    const s = readyPillarSession(20);
    const family = pillarRequirements(s).find((r) => r.id === "family")!;
    const integration = pillarRequirements(s).find((r) => r.id === "integration")!;
    expect(family.met).toBe(false);
    expect(integration.met).toBe(false);
    expect(canAttemptPillarAscension(s)).toBe(false);
  });

  it("fails when a sibling Uniqueness is missing", () => {
    const s = readyPillarSession();
    const session = {
      ...s,
      gameState: { ...s.gameState, inventory: [uniquenessItemFor(7)] }, // missing Error (8)
    };
    const req = pillarRequirements(session).find((r) => r.id === "integration")!;
    expect(req.met).toBe(false);
    expect(canAttemptPillarAscension(session)).toBe(false);
  });

  it("fails when anchors fall short of the Pillar floor", () => {
    const s = readyPillarSession();
    // One congregation (100) is far below the 300 floor.
    let anchors = emptyAnchorState();
    anchors = consecrateAnchor(anchors, { kind: "congregation", name: "Lone Church" });
    const session = { ...s, anchorState: anchors };
    const req = pillarRequirements(session).find((r) => r.id === "anchors")!;
    expect(req.met).toBe(false);
    expect(canAttemptPillarAscension(session)).toBe(false);
  });

  it("fails when sanity is below three-quarters", () => {
    const s = readyPillarSession();
    const session = { ...s, gameState: { ...s.gameState, sanity: 70 } };
    const req = pillarRequirements(session).find((r) => r.id === "sanity")!;
    expect(req.met).toBe(false);
    expect(canAttemptPillarAscension(session)).toBe(false);
  });
});

describe("pillarAscensionSuccessChance", () => {
  it("is bounded between the base and the 0.9 cap", () => {
    const chance = pillarAscensionSuccessChance(readyPillarSession());
    expect(chance).toBeGreaterThanOrEqual(0.5);
    expect(chance).toBeLessThanOrEqual(0.9);
  });

  it("rises with anchor surplus and sanity", () => {
    const lean = readyPillarSession();
    const leanLowSanity = { ...lean, gameState: { ...lean.gameState, sanity: 75 } };
    expect(pillarAscensionSuccessChance(lean)).toBeGreaterThan(
      pillarAscensionSuccessChance(leanLowSanity),
    );
  });
});

describe("attemptPillarAscension", () => {
  it("enthrones on success — writes PILLAR_SEQUENCE and consumes sibling Uniquenesses", () => {
    const result = attemptPillarAscension(readyPillarSession(), () => 0);
    expect(result.outcome).toBe("enthroned");
    if (result.outcome !== "enthroned") return;
    expect(result.session.gameState.sequenceLevel).toBe(PILLAR_SEQUENCE);
    expect(result.pillarName).toBe("Lord of Mysteries");
    // Both sibling Uniquenesses are consumed.
    expect(result.session.gameState.inventory).toHaveLength(0);
    // Digestion is reset to a fresh state for the new existence.
    expect(result.session.gameState.digestion).toEqual({
      pathwayId: 1,
      sequenceLevel: PILLAR_SEQUENCE,
      progress: expect.any(Number),
      complete: false,
    });
    // Memory records the ascent + the tease.
    expect(result.session.memory.sessionFacts.length).toBeGreaterThanOrEqual(2);
  });

  it("is unmade (permadeath) on a failed roll", () => {
    const result = attemptPillarAscension(readyPillarSession(), () => 1);
    expect(result.outcome).toBe("unmade");
    if (result.outcome !== "unmade") return;
    expect(result.verdict.outcome).toBe("permadeath");
  });

  it("refuses (catastrophically) when requirements are unmet", () => {
    const s = readyPillarSession();
    const notReady = { ...s, gameState: { ...s.gameState, sequenceLevel: 1 } };
    // Even a winning roll cannot ascend an ineligible character.
    const result = attemptPillarAscension(notReady, () => 0);
    expect(result.outcome).toBe("unmade");
    if (result.outcome !== "unmade") return;
    expect(result.verdict.outcome).toBe("permadeath");
  });

  it("is deterministic under injected randomness (just below the chance succeeds)", () => {
    const session = readyPillarSession();
    const chance = pillarAscensionSuccessChance(session);
    expect(attemptPillarAscension(session, () => chance - 0.01).outcome).toBe(
      "enthroned",
    );
    expect(attemptPillarAscension(session, () => chance + 0.01).outcome).toBe("unmade");
  });
});
