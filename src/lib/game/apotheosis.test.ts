import { describe, expect, it } from "vitest";

import type { Item } from "@/lib/types/rules";

import {
  ABOVE_SEQUENCE_TEASE,
  apotheosisRequirements,
  apotheosisSuccessChance,
  attemptApotheosis,
  canAttemptApotheosis,
  drawPetition,
  sequenceAbilities,
  trueGodName,
  uniquenessItemFor,
} from "./apotheosis";
import { consecrateAnchor, emptyAnchorState } from "./anchors";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A Sequence 1 King of Angels who meets every apotheosis requirement, so each
// test can knock out exactly one prerequisite and observe the verdict.
function readySession(pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const uniqueness = uniquenessItemFor(pathwayId);
  const gameState = {
    ...base,
    sequenceLevel: 1,
    sanity: 100,
    maxSanity: 100,
    inventory: [uniqueness],
    digestion: {
      pathwayId,
      sequenceLevel: 1,
      progress: 100,
      complete: true,
    },
  };
  // Anchors holding well past the Seq 0 requirement.
  let anchors = emptyAnchorState();
  anchors = consecrateAnchor(anchors, {
    kind: "congregation",
    name: "The Church of Evernight",
  });
  anchors = consecrateAnchor(anchors, { kind: "place", name: "Tingen Cathedral" });
  anchors = consecrateAnchor(anchors, { kind: "object", name: "The crimson moon" });
  return { ...createSession(gameState, "session-1"), anchorState: anchors };
}

describe("trueGodName", () => {
  it("maps the nine pathways to their honorifics", () => {
    expect(trueGodName(1)).toBe("The Fool");
    expect(trueGodName(9)).toBe("Hanged Man");
  });

  it("falls back to the pathway name (or a generic) for unknown ids", () => {
    expect(trueGodName(999)).toBe("True God");
  });
});

describe("uniquenessItemFor", () => {
  it("names the pathway's singular characteristic", () => {
    const item = uniquenessItemFor(1);
    expect(item.name).toBe("Fool Uniqueness");
    // Its own category — not a reagent and not lumped with mundane loot; the
    // narrator may grant it (issue #90) but it is never sold.
    expect(item.category).toBe("uniqueness");
    expect(item.description).toContain("exactly one");
  });
});

describe("apotheosisRequirements", () => {
  it("is fully met for a prepared King of Angels", () => {
    const reqs = apotheosisRequirements(readySession());
    expect(reqs.every((r) => r.met)).toBe(true);
    expect(canAttemptApotheosis(readySession())).toBe(true);
  });

  it("flags a character who is not yet Sequence 1", () => {
    const session = readySession();
    const lower = {
      ...session,
      gameState: { ...session.gameState, sequenceLevel: 2 },
    };
    const reqs = apotheosisRequirements(lower);
    expect(reqs.find((r) => r.id === "sequence")?.met).toBe(false);
    expect(canAttemptApotheosis(lower)).toBe(false);
  });

  it("requires a fully digested potion", () => {
    const session = readySession();
    const undigested = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { ...session.gameState.digestion!, complete: false },
      },
    };
    expect(
      apotheosisRequirements(undigested).find((r) => r.id === "digestion")?.met,
    ).toBe(false);
  });

  it("requires the Uniqueness in inventory", () => {
    const session = readySession();
    const empty = { ...session, gameState: { ...session.gameState, inventory: [] } };
    expect(apotheosisRequirements(empty).find((r) => r.id === "uniqueness")?.met).toBe(
      false,
    );
  });

  it("requires sufficient anchor support and minimum sanity", () => {
    const session = readySession();
    const unanchored = { ...session, anchorState: undefined };
    expect(apotheosisRequirements(unanchored).find((r) => r.id === "anchors")?.met).toBe(
      false,
    );
    const shaken = {
      ...session,
      gameState: { ...session.gameState, sanity: 40 },
    };
    expect(apotheosisRequirements(shaken).find((r) => r.id === "sanity")?.met).toBe(
      false,
    );
  });
});

describe("apotheosisSuccessChance", () => {
  it("is strong but capped below certainty", () => {
    const chance = apotheosisSuccessChance(readySession());
    expect(chance).toBeGreaterThan(0.6);
    expect(chance).toBeLessThanOrEqual(0.95);
  });

  it("rises with anchor surplus and sanity", () => {
    const strong = readySession();
    const weaker = {
      ...strong,
      gameState: { ...strong.gameState, sanity: 55 },
    };
    expect(apotheosisSuccessChance(strong)).toBeGreaterThan(
      apotheosisSuccessChance(weaker),
    );
  });
});

describe("attemptApotheosis", () => {
  it("ascends to Sequence 0 on a passing roll, consuming the Uniqueness", () => {
    const result = attemptApotheosis(readySession(), () => 0, 5000);
    expect(result.outcome).toBe("ascended");
    if (result.outcome !== "ascended") return;
    expect(result.session.gameState.sequenceLevel).toBe(0);
    expect(result.honorific).toBe("The Fool");
    expect(result.tease).toBe(ABOVE_SEQUENCE_TEASE);
    expect(
      result.session.gameState.inventory.some((i: Item) => i.name.includes("Uniqueness")),
    ).toBe(false);
    expect(result.session.gameState.digestion?.complete).toBe(false);
    expect(result.session.updatedAt).toBe(5000);
    expect(
      result.session.memory.sessionFacts.some((f) =>
        f.description.includes("apotheosis ritual"),
      ),
    ).toBe(true);
  });

  it("is unmade on a failing roll — a fatal ritual failure", () => {
    const result = attemptApotheosis(readySession(), () => 0.99);
    expect(result.outcome).toBe("unmade");
    if (result.outcome !== "unmade") return;
    expect(result.verdict.outcome).toBe("permadeath");
    expect(result.verdict.severity).toBe("fatal");
    expect(result.verdict.cause).toBe("ritual-failure");
  });

  it("refuses (catastrophically) when requirements are unmet", () => {
    const session = readySession();
    const notReady = { ...session, gameState: { ...session.gameState, inventory: [] } };
    // Even a perfect roll cannot save an unprepared attempt.
    const result = attemptApotheosis(notReady, () => 0);
    expect(result.outcome).toBe("unmade");
    if (result.outcome !== "unmade") return;
    expect(result.verdict.outcome).toBe("permadeath");
  });

  it("handles a ready attempt with no anchor state on failure", () => {
    // Construct a ready session whose anchors requirement is met another way is
    // impossible (Seq 0 needs support), so this exercises the highRisk-undefined
    // branch via the unmet-requirements path instead.
    const session = readySession();
    const noAnchors = { ...session, anchorState: undefined };
    const result = attemptApotheosis(noAnchors, () => 0);
    expect(result.outcome).toBe("unmade");
  });
});

describe("sequenceAbilities", () => {
  it("returns the True God framing at Sequence 0", () => {
    const { abilities, acting } = sequenceAbilities(1, 0);
    expect(abilities.length).toBeGreaterThan(0);
    expect(abilities[0]).toContain("Absolute authority");
    expect(acting.length).toBeGreaterThan(0);
  });

  it("returns the rules-engine sequence's ability/acting names below Seq 0", () => {
    const { abilities, acting } = sequenceAbilities(1, 9);
    expect(abilities).toContain("Spirit Vision");
    expect(acting.length).toBe(3);
  });

  it("accumulates earlier-rung abilities, tagging them enhanced, at deeper rungs", () => {
    const seq9 = sequenceAbilities(1, 9).abilities;
    const { abilities, acting } = sequenceAbilities(1, 7);
    // Every Sequence 9 power is retained at Sequence 7, marked enhanced.
    for (const name of seq9) {
      expect(abilities).toContain(`${name} (enhanced)`);
    }
    // The current rung's powers are present without the enhanced tag.
    expect(abilities.some((a) => !a.endsWith("(enhanced)"))).toBe(true);
    // Acting requirements stay scoped to the current rung (the role being acted).
    expect(acting).toEqual(sequenceAbilities(1, 7).acting);
    expect(acting.length).toBe(3);
  });

  it("is empty for an unknown sequence", () => {
    expect(sequenceAbilities(1, 99)).toEqual({ abilities: [], acting: [] });
  });
});

describe("drawPetition", () => {
  it("returns null when no petition arrives", () => {
    expect(drawPetition(1, 7, () => 0.99)).toBeNull();
  });

  it("draws a deterministic petition addressed to the god", () => {
    const fact = drawPetition(1, 7, () => 0);
    expect(fact).not.toBeNull();
    expect(fact?.type).toBe("event");
    expect(fact?.turnNumber).toBe(7);
    expect(fact?.description).toContain("The Fool");
  });
});
