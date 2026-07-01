import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import {
  attemptPathwaySwitch,
  canAttemptSwitch,
  neighboringSwitchTargets,
  pathwaySwitchSuccessChance,
  switchHighRisk,
  switchRelation,
  switchRequirements,
  switchUnlockSequence,
} from "./pathway-switch";
import { createDefaultGameState, createSession } from "./session";
import type { GameSession } from "./types";

// A character standing on `sequenceLevel` of `currentPathwayId`, fully digested,
// carrying every ingredient for the TARGET pathway's same-rung potion — poised to
// switch. Ingredients are read from the rules engine so the fixture stays correct.
function readyToSwitch(
  sequenceLevel: number,
  currentPathwayId: number,
  targetPathwayId: number,
): GameSession {
  const base = createDefaultGameState(currentPathwayId, "char-1", "Klein Moretti");
  const potionItems =
    getSequence(targetPathwayId, sequenceLevel)?.prerequisiteItems ?? [];
  const gameState = {
    ...base,
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
  return createSession(gameState, "session-1");
}

describe("switchUnlockSequence", () => {
  it("is Sequence 3 for the Lord of Mysteries group, 4 otherwise", () => {
    expect(switchUnlockSequence(1)).toBe(3); // Fool (Mysteries)
    expect(switchUnlockSequence(7)).toBe(3); // Door (Mysteries)
    expect(switchUnlockSequence(8)).toBe(3); // Error (Mysteries)
    expect(switchUnlockSequence(2)).toBe(4); // Visionary (God Almighty)
    expect(switchUnlockSequence(4)).toBe(4); // Death (Eternal Darkness)
  });
});

describe("switchRelation", () => {
  it("is neighboring for adjacent same-group pathways", () => {
    expect(switchRelation(1, 8)).toBe("neighboring"); // Fool ↔ Error
    expect(switchRelation(2, 3)).toBe("neighboring"); // Visionary ↔ Sun
  });

  it("is unrelated for non-adjacent pathways", () => {
    expect(switchRelation(1, 4)).toBe("unrelated"); // Fool → Death
    expect(switchRelation(2, 4)).toBe("unrelated"); // Visionary → Death
  });
});

describe("neighboringSwitchTargets", () => {
  it("lists the current pathway's adjacent pathways", () => {
    const session = readyToSwitch(4, 1, 8);
    const targets = neighboringSwitchTargets(session);
    expect(targets).toContain(7);
    expect(targets).toContain(8);
    expect(targets).not.toContain(1);
  });

  it("is empty for a pathway with no neighbour (Wheel of Fortune)", () => {
    const session = readyToSwitch(4, 20, 20);
    expect(neighboringSwitchTargets(session)).toEqual([]);
  });

  it("is empty for an unknown current pathway", () => {
    const session = readyToSwitch(4, 2, 3);
    const broken = { ...session, gameState: { ...session.gameState, pathwayId: 999 } };
    expect(neighboringSwitchTargets(broken)).toEqual([]);
  });
});

describe("switchRequirements / canAttemptSwitch", () => {
  it("is fully met for a prepared neighboring switch at the threshold", () => {
    const session = readyToSwitch(4, 2, 3); // Visionary → Sun at Seq 4 (threshold 4)
    expect(switchRequirements(session, 3).every((r) => r.met)).toBe(true);
    expect(canAttemptSwitch(session, 3)).toBe(true);
  });

  it("enforces the neighboring threshold (Seq 4 general)", () => {
    const session = readyToSwitch(5, 2, 3); // Seq 5 is above the general threshold
    const threshold = switchRequirements(session, 3).find((r) => r.id === "threshold");
    expect(threshold?.met).toBe(false);
    expect(canAttemptSwitch(session, 3)).toBe(false);
  });

  it("enforces the deeper Mysteries threshold (Seq 3)", () => {
    const atFour = readyToSwitch(4, 1, 8); // Fool → Error at Seq 4 — too shallow
    expect(canAttemptSwitch(atFour, 8)).toBe(false);
    const atThree = readyToSwitch(3, 1, 8);
    expect(canAttemptSwitch(atThree, 8)).toBe(true);
  });

  it("has NO threshold gate for an unrelated (poison) switch", () => {
    const session = readyToSwitch(5, 2, 4); // Visionary → Death, unrelated, Seq 5
    const ids = switchRequirements(session, 4).map((r) => r.id);
    expect(ids).not.toContain("threshold");
    expect(canAttemptSwitch(session, 4)).toBe(true);
  });

  it("rejects the apex, a same/unknown target, missing potion, undigested, low sanity", () => {
    // Apex (Seq 1) cannot switch.
    const apex = readyToSwitch(1, 2, 3);
    expect(canAttemptSwitch(apex, 3)).toBe(false);
    // Same pathway target.
    const same = readyToSwitch(4, 2, 3);
    expect(canAttemptSwitch(same, 2)).toBe(false);
    // Unknown target pathway.
    expect(canAttemptSwitch(same, 999)).toBe(false);
    // Missing the cross-pathway potion.
    expect(
      canAttemptSwitch({ ...same, gameState: { ...same.gameState, inventory: [] } }, 3),
    ).toBe(false);
    // Undigested current potion.
    expect(
      canAttemptSwitch(
        {
          ...same,
          gameState: {
            ...same.gameState,
            digestion: { ...same.gameState.digestion!, complete: false },
          },
        },
        3,
      ),
    ).toBe(false);
    // Frayed mind below the sanity floor.
    expect(
      canAttemptSwitch({ ...same, gameState: { ...same.gameState, sanity: 5 } }, 3),
    ).toBe(false);
  });
});

describe("pathwaySwitchSuccessChance", () => {
  it("keeps a neighboring switch strong (0.4–0.9)", () => {
    const session = readyToSwitch(4, 2, 3);
    const chance = pathwaySwitchSuccessChance(session, 3);
    expect(chance).toBeGreaterThanOrEqual(0.4);
    expect(chance).toBeLessThanOrEqual(0.9);
  });

  it("caps an unrelated (poison) switch low (0.05–0.4)", () => {
    const session = readyToSwitch(4, 2, 4);
    const chance = pathwaySwitchSuccessChance(session, 4);
    expect(chance).toBeGreaterThanOrEqual(0.05);
    expect(chance).toBeLessThanOrEqual(0.4);
  });

  it("makes a neighboring switch likelier than a poison one at equal sanity", () => {
    const session = readyToSwitch(4, 2, 3);
    expect(pathwaySwitchSuccessChance(session, 3)).toBeGreaterThan(
      pathwaySwitchSuccessChance(session, 4),
    );
  });

  it("handles a zero-max-sanity save without dividing by zero", () => {
    const session = readyToSwitch(4, 2, 3);
    const broken = { ...session, gameState: { ...session.gameState, maxSanity: 0 } };
    expect(pathwaySwitchSuccessChance(broken, 3)).toBeGreaterThanOrEqual(0.4);
  });
});

describe("switchHighRisk", () => {
  it("is always true for an unrelated (poison) switch", () => {
    const session = readyToSwitch(4, 2, 4);
    expect(switchHighRisk(session, "unrelated")).toBe(true);
  });

  it("is false for a neighboring switch with a steady mind, true when frayed", () => {
    const session = readyToSwitch(4, 2, 3);
    expect(switchHighRisk(session, "neighboring")).toBe(false);
    const frayed = { ...session, gameState: { ...session.gameState, sanity: 5 } };
    expect(switchHighRisk(frayed, "neighboring")).toBe(true);
  });
});

describe("attemptPathwaySwitch", () => {
  it("adopts the new pathway, keeps the rung, fuses retained powers, consumes the potion", () => {
    const session = readyToSwitch(4, 2, 3);
    const result = attemptPathwaySwitch(session, 3, () => 0); // always succeeds
    expect(result.outcome).toBe("switched");
    if (result.outcome !== "switched") return;
    expect(result.session.gameState.pathwayId).toBe(3);
    expect(result.session.gameState.sequenceLevel).toBe(4); // rung unchanged
    // The cross-pathway potion's ingredients are consumed.
    expect(result.session.gameState.inventory).toHaveLength(0);
    // Digestion re-seeds for the new pathway, fresh.
    expect(result.session.gameState.digestion?.pathwayId).toBe(3);
    expect(result.session.gameState.digestion?.complete).toBe(false);
    // The outgoing pathway is recorded with a frozen retained snapshot.
    const [entry] = result.session.pathwayLineage!.switches;
    expect(entry.fromPathwayId).toBe(2);
    expect(entry.atSequence).toBe(4);
    expect(entry.kind).toBe("neighboring");
    expect(entry.retained.length).toBeGreaterThan(0);
    expect(entry.retained.every((a) => a.sourceLevel > 4)).toBe(true);
    // Sanity drained; a memory fact recorded.
    expect(result.session.gameState.sanity).toBeLessThan(100);
    expect(result.session.memory.sessionFacts.length).toBeGreaterThan(
      session.memory.sessionFacts.length,
    );
  });

  it("drains more sanity for a poison (unrelated) switch than a neighboring one", () => {
    const neighbor = attemptPathwaySwitch(readyToSwitch(4, 2, 3), 3, () => 0);
    const poison = attemptPathwaySwitch(readyToSwitch(4, 2, 4), 4, () => 0);
    if (neighbor.outcome !== "switched" || poison.outcome !== "switched") {
      throw new Error("expected both to succeed");
    }
    expect(poison.session.gameState.sanity).toBeLessThan(
      neighbor.session.gameState.sanity,
    );
  });

  it("resolves a failed switch as a loss of control", () => {
    const session = readyToSwitch(4, 2, 3);
    const result = attemptPathwaySwitch(session, 3, () => 1); // always fails
    expect(result.outcome).toBe("lost-control");
    if (result.outcome !== "lost-control") return;
    expect(result.verdict.cause).toBe("loss-of-control");
  });

  it("makes a failed poison switch high-risk (escalated) versus a neighboring one", () => {
    // At a Saint rung a high-risk loss of control escalates in severity.
    const neighbor = attemptPathwaySwitch(readyToSwitch(4, 2, 3), 3, () => 1);
    const poison = attemptPathwaySwitch(readyToSwitch(4, 2, 4), 4, () => 1);
    if (neighbor.outcome !== "lost-control" || poison.outcome !== "lost-control") {
      throw new Error("expected both to fail");
    }
    const order = ["setback", "transformation", "fatal"];
    expect(order.indexOf(poison.verdict.severity)).toBeGreaterThanOrEqual(
      order.indexOf(neighbor.verdict.severity),
    );
  });

  it("treats a flagrantly ineligible attempt as a high-risk loss of control", () => {
    const session = readyToSwitch(4, 2, 3);
    const undigested = {
      ...session,
      gameState: {
        ...session.gameState,
        digestion: { ...session.gameState.digestion!, complete: false },
      },
    };
    const result = attemptPathwaySwitch(undigested, 3, () => 0);
    expect(result.outcome).toBe("lost-control");
  });

  it("sheds the old pathway's ritual / formula / hunt pursuits on a successful switch", () => {
    const session = readyToSwitch(4, 2, 3);
    const withPursuits: GameSession = {
      ...session,
      ritualState: { pathwayId: 2, targetSeq: 3, fidelity: 0.5 },
      formulaPursuit: {
        targetItemName: "Old Formula",
        targetSeq: 3,
        turnsRemaining: 2,
        totalTurns: 4,
      },
      hunts: [
        {
          targetItemName: "Old Characteristic",
          targetSeq: 3,
          turnsRemaining: 1,
          totalTurns: 3,
        },
      ],
    };
    const result = attemptPathwaySwitch(withPursuits, 3, () => 0);
    if (result.outcome !== "switched") throw new Error("expected success");
    expect(result.session.ritualState).toBeUndefined();
    expect(result.session.formulaPursuit).toBeUndefined();
    expect(result.session.hunts ?? []).toHaveLength(0);
  });

  it("does not mutate the input session", () => {
    const session = readyToSwitch(4, 2, 3);
    const before = JSON.stringify(session);
    attemptPathwaySwitch(session, 3, () => 0);
    expect(JSON.stringify(session)).toBe(before);
  });
});
