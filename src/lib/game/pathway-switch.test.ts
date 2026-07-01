import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import { consecrateAnchor, emptyAnchorState } from "./anchors";
import {
  attemptPathwaySwitch,
  canAttemptSwitch,
  neighboringSwitchTargets,
  pathwaySwitchSuccessChance,
  switchHighRisk,
  switchRelation,
  switchRequirements,
  switchTargetSequence,
  switchUnlockSequence,
} from "./pathway-switch";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// Anchors holding past the Saint/Angel requirement — a switch ADVANCES into the
// Saint tier (target Seq ≤ 4), which needs them, exactly like a normal climb.
function withAnchors(session: GameSession): GameSession {
  let anchors = emptyAnchorState();
  anchors = consecrateAnchor(anchors, { kind: "congregation", name: "The Flock" });
  anchors = consecrateAnchor(anchors, { kind: "place", name: "A shrine" });
  anchors = consecrateAnchor(anchors, { kind: "object", name: "A relic" });
  return { ...session, anchorState: anchors };
}

// A character on `sequenceLevel` of `currentPathwayId`, fully digested, carrying
// every ingredient for the TARGET pathway's NEXT-rung potion (a switch advances
// one rung), with anchors held. Ingredients read from the rules engine.
function readyToSwitch(
  sequenceLevel: number,
  currentPathwayId: number,
  targetPathwayId: number,
  anchors = true,
): GameSession {
  const target = sequenceLevel - 1;
  const potionItems = getSequence(targetPathwayId, target)?.prerequisiteItems ?? [];
  const gameState = {
    ...createDefaultGameState(currentPathwayId, "char-1", "Klein Moretti"),
    sequenceLevel,
    sanity: 100,
    maxSanity: 100,
    inventory: [...potionItems],
    digestion: {
      pathwayId: currentPathwayId,
      sequenceLevel,
      progress: 100,
      complete: true,
    },
  };
  const session = createSession(gameState, "session-1");
  return anchors ? withAnchors(session) : session;
}

describe("switchUnlockSequence / switchTargetSequence", () => {
  it("the target threshold is Sequence 3 for Mysteries, 4 otherwise", () => {
    expect(switchUnlockSequence(1)).toBe(3); // Fool (Mysteries)
    expect(switchUnlockSequence(7)).toBe(3); // Door (Mysteries)
    expect(switchUnlockSequence(2)).toBe(4); // Visionary (God Almighty)
  });

  it("a switch advances one rung (target = current - 1)", () => {
    expect(switchTargetSequence(readyToSwitch(5, 2, 3))).toBe(4);
    expect(switchTargetSequence(readyToSwitch(4, 1, 8))).toBe(3);
  });
});

describe("switchRelation", () => {
  it("is neighboring for adjacent same-group pathways, unrelated otherwise", () => {
    expect(switchRelation(7, 1)).toBe("neighboring"); // Door ↔ Fool
    expect(switchRelation(2, 3)).toBe("neighboring"); // Visionary ↔ Sun
    expect(switchRelation(2, 4)).toBe("unrelated"); // Visionary → Death
  });
});

describe("neighboringSwitchTargets", () => {
  it("lists the current pathway's adjacent pathways", () => {
    const targets = neighboringSwitchTargets(readyToSwitch(4, 7, 1)); // Door
    expect(targets).toContain(1); // Fool
    expect(targets).toContain(8); // Error
    expect(targets).not.toContain(7);
  });

  it("is empty for a pathway with no neighbour (Wheel of Fortune) or an unknown one", () => {
    expect(neighboringSwitchTargets(readyToSwitch(4, 20, 20))).toEqual([]);
    const broken = readyToSwitch(4, 2, 3);
    expect(
      neighboringSwitchTargets({
        ...broken,
        gameState: { ...broken.gameState, pathwayId: 999 },
      }),
    ).toEqual([]);
  });
});

describe("switchRequirements / canAttemptSwitch", () => {
  it("is fully met for a prepared neighboring switch advancing into the threshold rung", () => {
    // Door Seq 4 → Fool Seq 3 (Scholar of Yore): the first safe Mysteries rung.
    const session = readyToSwitch(4, 7, 1);
    expect(switchRequirements(session, 1).every((r) => r.met)).toBe(true);
    expect(canAttemptSwitch(session, 1)).toBe(true);
  });

  it("gates a neighboring switch on the TARGET rung, not the current one", () => {
    // Visionary Seq 6 → target Seq 5 is above the general threshold (4).
    const tooShallow = readyToSwitch(6, 2, 3);
    const threshold = switchRequirements(tooShallow, 3).find((r) => r.id === "threshold");
    expect(threshold?.met).toBe(false);
    expect(canAttemptSwitch(tooShallow, 3)).toBe(false);
    // Visionary Seq 5 → target Seq 4 is exactly the first allowed rung.
    expect(canAttemptSwitch(readyToSwitch(5, 2, 3), 3)).toBe(true);
  });

  it("enforces the deeper Mysteries target threshold (Seq 3)", () => {
    // Fool Seq 5 → target Seq 4 is too shallow for Mysteries (needs ≤ 3).
    expect(canAttemptSwitch(readyToSwitch(5, 1, 8), 8)).toBe(false);
    // Fool Seq 4 → target Seq 3 is the first allowed Mysteries rung.
    expect(canAttemptSwitch(readyToSwitch(4, 1, 8), 8)).toBe(true);
  });

  it("has NO threshold gate for an unrelated (poison) switch", () => {
    const session = readyToSwitch(6, 2, 4); // Visionary → Death, unrelated
    const ids = switchRequirements(session, 4).map((r) => r.id);
    expect(ids).not.toContain("threshold");
    expect(canAttemptSwitch(session, 4)).toBe(true);
  });

  it("requires anchors when advancing into the Saint tier", () => {
    const noAnchors = readyToSwitch(4, 7, 1, false); // no anchorState
    const anchors = switchRequirements(noAnchors, 1).find((r) => r.id === "anchors");
    expect(anchors?.met).toBe(false);
    expect(canAttemptSwitch(noAnchors, 1)).toBe(false);
  });

  it("rejects the apex, a same/unknown target, missing potion, undigested, low sanity", () => {
    const apex = readyToSwitch(1, 2, 3);
    expect(canAttemptSwitch(apex, 3)).toBe(false); // Seq 1 cannot climb
    const base = readyToSwitch(5, 2, 3);
    expect(canAttemptSwitch(base, 2)).toBe(false); // same pathway
    expect(canAttemptSwitch(base, 999)).toBe(false); // unknown pathway
    expect(
      canAttemptSwitch({ ...base, gameState: { ...base.gameState, inventory: [] } }, 3),
    ).toBe(false); // missing potion
    expect(
      canAttemptSwitch(
        {
          ...base,
          gameState: {
            ...base.gameState,
            digestion: { ...base.gameState.digestion!, complete: false },
          },
        },
        3,
      ),
    ).toBe(false); // undigested
    expect(
      canAttemptSwitch({ ...base, gameState: { ...base.gameState, sanity: 5 } }, 3),
    ).toBe(false); // frayed mind
  });
});

describe("pathwaySwitchSuccessChance", () => {
  it("keeps a neighboring switch strong (0.4–0.9), a poison one low (0.05–0.4)", () => {
    const session = readyToSwitch(5, 2, 3);
    const neighbor = pathwaySwitchSuccessChance(session, 3);
    const poison = pathwaySwitchSuccessChance(readyToSwitch(5, 2, 4), 4);
    expect(neighbor).toBeGreaterThanOrEqual(0.4);
    expect(neighbor).toBeLessThanOrEqual(0.9);
    expect(poison).toBeGreaterThanOrEqual(0.05);
    expect(poison).toBeLessThanOrEqual(0.4);
    expect(neighbor).toBeGreaterThan(poison);
  });

  it("handles a zero-max-sanity save without dividing by zero", () => {
    const session = readyToSwitch(5, 2, 3);
    const broken = { ...session, gameState: { ...session.gameState, maxSanity: 0 } };
    expect(pathwaySwitchSuccessChance(broken, 3)).toBeGreaterThanOrEqual(0.4);
  });
});

describe("switchHighRisk", () => {
  it("is true only for a poison switch (a neighbouring switch is never eligible while frayed)", () => {
    expect(switchHighRisk("unrelated")).toBe(true);
    expect(switchHighRisk("neighboring")).toBe(false);
  });
});

describe("attemptPathwaySwitch", () => {
  it("ADVANCES a rung into the new pathway, fuses the old kit, consumes the potion", () => {
    const session = readyToSwitch(5, 2, 3); // Visionary Seq 5 → Sun Seq 4
    const result = attemptPathwaySwitch(session, 3, () => 0);
    expect(result.outcome).toBe("switched");
    if (result.outcome !== "switched") return;
    expect(result.session.gameState.pathwayId).toBe(3); // adopted Sun
    expect(result.session.gameState.sequenceLevel).toBe(4); // ADVANCED 5 → 4
    expect(result.newSequenceLevel).toBe(4);
    expect(result.session.gameState.inventory).toHaveLength(0); // potion consumed
    expect(result.session.gameState.digestion?.pathwayId).toBe(3);
    expect(result.session.gameState.digestion?.complete).toBe(false);
    // The outgoing pathway is recorded with its FULL frozen kit (left at Seq 5).
    const [entry] = result.session.pathwayLineage!.switches;
    expect(entry.fromPathwayId).toBe(2);
    expect(entry.atSequence).toBe(5);
    expect(entry.kind).toBe("neighboring");
    expect(entry.retained.some((a) => a.sourceLevel === 5)).toBe(true);
    expect(result.session.gameState.sanity).toBeLessThan(100);
    expect(result.session.memory.sessionFacts.length).toBeGreaterThan(
      session.memory.sessionFacts.length,
    );
  });

  it("drains more sanity for a poison switch than a neighboring one", () => {
    const neighbor = attemptPathwaySwitch(readyToSwitch(5, 2, 3), 3, () => 0);
    const poison = attemptPathwaySwitch(readyToSwitch(5, 2, 4), 4, () => 0);
    if (neighbor.outcome !== "switched" || poison.outcome !== "switched") {
      throw new Error("expected both to succeed");
    }
    expect(poison.session.gameState.sanity).toBeLessThan(
      neighbor.session.gameState.sanity,
    );
  });

  it("resolves a failed switch as a loss of control (poison escalated vs neighboring)", () => {
    const neighbor = attemptPathwaySwitch(readyToSwitch(5, 2, 3), 3, () => 1);
    const poison = attemptPathwaySwitch(readyToSwitch(5, 2, 4), 4, () => 1);
    if (neighbor.outcome !== "lost-control" || poison.outcome !== "lost-control") {
      throw new Error("expected both to fail");
    }
    expect(neighbor.verdict.cause).toBe("loss-of-control");
    const order = ["setback", "transformation", "fatal"];
    expect(order.indexOf(poison.verdict.severity)).toBeGreaterThanOrEqual(
      order.indexOf(neighbor.verdict.severity),
    );
  });

  it("treats a flagrantly ineligible attempt as a high-risk loss of control", () => {
    const session = readyToSwitch(5, 2, 3);
    const undigested = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { ...session.gameState.digestion!, complete: false },
      },
    };
    expect(attemptPathwaySwitch(undigested, 3, () => 0).outcome).toBe("lost-control");
  });

  it("sheds the old pathway's ritual / formula / hunt pursuits on a successful switch", () => {
    const session = readyToSwitch(5, 2, 3);
    const withPursuits: GameSession = {
      ...session,
      ritualState: { pathwayId: 2, targetSeq: 4, fidelity: 0.5 },
      formulaPursuit: {
        targetItemName: "Old Formula",
        targetSeq: 4,
        turnsRemaining: 2,
        totalTurns: 4,
      },
      hunts: [
        { targetItemName: "Old Char", targetSeq: 4, turnsRemaining: 1, totalTurns: 3 },
      ],
    };
    const result = attemptPathwaySwitch(withPursuits, 3, () => 0);
    if (result.outcome !== "switched") throw new Error("expected success");
    expect(result.session.ritualState).toBeUndefined();
    expect(result.session.formulaPursuit).toBeUndefined();
    expect(result.session.hunts ?? []).toHaveLength(0);
  });

  it("does not mutate the input session", () => {
    const session = readyToSwitch(5, 2, 3);
    const before = JSON.stringify(session);
    attemptPathwaySwitch(session, 3, () => 0);
    expect(JSON.stringify(session)).toBe(before);
  });
});
