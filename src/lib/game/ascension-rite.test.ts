import { describe, expect, it } from "vitest";

import {
  advanceAscensionRite,
  ascensionRiteFidelity,
  ascensionRiteInProgress,
  ascensionRiteNarratorContext,
  ascensionRiteQuestLabel,
  ascensionRiteReady,
  ascensionTierFor,
  beginAscensionRite,
  clearAscensionRite,
  isValidAscensionRiteShape,
  ASCENSION_FIDELITY_CAP,
} from "./ascension-rite";
import {
  createDefaultGameState,
  createSession,
  serializeSession,
  deserializeSession,
} from "./session";
import type { GameSession } from "./types";

// A ready session at a given rung, in a private, unhurt scene so the rite's
// circumstance fidelity is a clean 1 (predictable accrual per turn).
function sessionAt(sequenceLevel: number, pathwayId = 1): GameSession {
  const base = createDefaultGameState(pathwayId, "char-1", "Klein Moretti");
  const gameState = {
    ...base,
    sequenceLevel,
    npcsPresent: [],
    injuries: [],
  };
  return createSession(gameState, "session-1");
}

describe("ascensionTierFor", () => {
  it("is 'true-god' for a Sequence 1 King of Angels (any pathway)", () => {
    expect(ascensionTierFor(sessionAt(1, 1))).toBe("true-god");
    expect(ascensionTierFor(sessionAt(1, 20))).toBe("true-god"); // Wheel of Fortune too
  });

  it("is 'pillar' for a Sequence 0 True God of a Pillar family", () => {
    expect(ascensionTierFor(sessionAt(0, 1))).toBe("pillar"); // Fool → Lord of Mysteries
    expect(ascensionTierFor(sessionAt(0, 16))).toBe("pillar"); // Mother → Mother Goddess
  });

  it("is null for a Sequence 0 True God whose pathway has no Pillar", () => {
    expect(ascensionTierFor(sessionAt(0, 20))).toBeNull(); // Wheel of Fortune caps at True God
  });

  it("is null below Seq 1 (nothing to ascend into yet)", () => {
    expect(ascensionTierFor(sessionAt(2, 1))).toBeNull();
    expect(ascensionTierFor(sessionAt(9, 1))).toBeNull();
  });

  it("is null above the sequences (a Pillar has nowhere higher)", () => {
    expect(ascensionTierFor(sessionAt(-1, 1))).toBeNull();
  });
});

describe("beginAscensionRite", () => {
  it("seeds the true-god rite with a first slice of progress, a label, and a fact", () => {
    const s = beginAscensionRite(sessionAt(1), 1000);
    expect(s.ascensionRite).toEqual({ tier: "true-god", pathwayId: 1, fidelity: 0.2 });
    expect(s.gameState.activeQuests).toContain(ascensionRiteQuestLabel("true-god"));
    expect(
      s.memory.sessionFacts.some((f) => /rite of apotheosis/i.test(f.description)),
    ).toBe(true);
  });

  it("seeds the pillar rite for a Seq 0 True God of a family", () => {
    const s = beginAscensionRite(sessionAt(0, 1), 1000);
    expect(s.ascensionRite?.tier).toBe("pillar");
    expect(s.gameState.activeQuests).toContain(ascensionRiteQuestLabel("pillar"));
    expect(
      s.memory.sessionFacts.some((f) => /above the sequences/i.test(f.description)),
    ).toBe(true);
  });

  it("is a no-op when no apex is available", () => {
    const s = sessionAt(5); // mid-ladder — nothing to ascend into
    expect(beginAscensionRite(s)).toBe(s);
  });

  it("is idempotent once a rite for the tier is under way (does not reset progress)", () => {
    const first = beginAscensionRite(sessionAt(1), 1000);
    const matured = advanceAscensionRite(first, 1001);
    const again = beginAscensionRite(matured, 1002);
    expect(again).toBe(matured); // unchanged — progress preserved
  });

  it("drops a stale rite's quest label when the tier changes", () => {
    // A true-god rite carried into a Seq 0 state (its label lingering): beginning
    // the pillar rite re-keys and clears the superseded label.
    const trueGod = beginAscensionRite(sessionAt(1), 1000);
    const nowPillar: GameSession = {
      ...trueGod,
      gameState: { ...trueGod.gameState, sequenceLevel: 0 },
    };
    const pillar = beginAscensionRite(nowPillar, 1001);
    expect(pillar.ascensionRite?.tier).toBe("pillar");
    expect(pillar.gameState.activeQuests).not.toContain(
      ascensionRiteQuestLabel("true-god"),
    );
    expect(pillar.gameState.activeQuests).toContain(ascensionRiteQuestLabel("pillar"));
  });
});

describe("advanceAscensionRite", () => {
  it("matures the rite toward a faithful state over turns", () => {
    let s = beginAscensionRite(sessionAt(1), 1000);
    const start = s.ascensionRite!.fidelity;
    s = advanceAscensionRite(s, 1001);
    expect(s.ascensionRite!.fidelity).toBeGreaterThan(start);
    // Many turns push it toward (but never past) 1.
    for (let i = 0; i < 40; i++) s = advanceAscensionRite(s, 1002 + i);
    expect(s.ascensionRite!.fidelity).toBeGreaterThanOrEqual(ASCENSION_FIDELITY_CAP);
    expect(s.ascensionRite!.fidelity).toBeLessThanOrEqual(1);
  });

  it("is a no-op when no rite is under way", () => {
    const s = sessionAt(1);
    expect(advanceAscensionRite(s)).toBe(s);
  });

  it("does not churn once the rite has fully matured", () => {
    let s = beginAscensionRite(sessionAt(1), 1000);
    for (let i = 0; i < 60; i++) s = advanceAscensionRite(s, 1001 + i);
    const settled = s;
    expect(advanceAscensionRite(settled, 9999)).toBe(settled);
  });

  it("stalls (no progress) when the scene is too hostile", () => {
    // Injuries + witnesses drive circumstance to 0, so the rite cannot form.
    const begun = beginAscensionRite(sessionAt(1), 1000);
    const hostile: GameSession = {
      ...begun,
      gameState: {
        ...begun.gameState,
        injuries: [
          { id: "i1", description: "a deep wound", severity: "major", recoveryTurns: 3 },
        ],
        npcsPresent: ["a jeering crowd"],
      },
      // Injuries (−0.4) + witnesses (−0.3) + an active pursuer (−0.4) drive the
      // circumstance fidelity to 0, so the rite cannot form this turn.
      trackedNpcState: {
        roster: [{ name: "a relentless hunter", disposition: "hostile", follows: true }],
      },
    };
    const after = advanceAscensionRite(hostile, 1001);
    expect(after.ascensionRite!.fidelity).toBe(begun.ascensionRite!.fidelity);
  });
});

describe("ascensionRiteFidelity / inProgress / ready", () => {
  it("reports 0 fidelity and not-in-progress before the rite is begun", () => {
    const s = sessionAt(1);
    expect(ascensionRiteFidelity(s)).toBe(0);
    expect(ascensionRiteInProgress(s)).toBe(false);
    expect(ascensionRiteReady(s)).toBe(false);
  });

  it("reports the accrued fidelity once begun", () => {
    const s = beginAscensionRite(sessionAt(1), 1000);
    expect(ascensionRiteFidelity(s)).toBeCloseTo(0.2, 5);
    expect(ascensionRiteInProgress(s)).toBe(true);
  });

  it("ignores a rite whose tier does not match the current apex", () => {
    // A true-god rite still attached after the character reached Seq 0.
    const begun = beginAscensionRite(sessionAt(1), 1000);
    const mismatched: GameSession = {
      ...begun,
      gameState: { ...begun.gameState, sequenceLevel: 0 },
    };
    expect(ascensionRiteFidelity(mismatched)).toBe(0);
    expect(ascensionRiteInProgress(mismatched)).toBe(false);
  });

  it("reports 0 when there is no apex to ascend into", () => {
    expect(ascensionRiteFidelity(sessionAt(5))).toBe(0);
    expect(ascensionRiteInProgress(sessionAt(5))).toBe(false);
  });

  it("is ready only once fidelity crosses the cap", () => {
    let s = beginAscensionRite(sessionAt(1), 1000);
    expect(ascensionRiteReady(s)).toBe(false);
    for (let i = 0; i < 60; i++) s = advanceAscensionRite(s, 1001 + i);
    expect(ascensionRiteReady(s)).toBe(true);
  });
});

describe("ascensionRiteNarratorContext (issue #220)", () => {
  it("is null when no apex rite is under way", () => {
    expect(ascensionRiteNarratorContext(sessionAt(1))).toBeNull();
  });

  it("frames a true-god rite as beginning, not accomplished", () => {
    const ctx = ascensionRiteNarratorContext(beginAscensionRite(sessionAt(1)));
    expect(ctx).not.toBeNull();
    expect(ctx).toContain("apotheosis");
    expect(ctx).toContain("a True God");
    expect(ctx).toMatch(/does NOT complete the ascension/);
    expect(ctx).toMatch(/never narrate the ascension as/);
  });

  it("frames a pillar rite as beginning, not accomplished", () => {
    const ctx = ascensionRiteNarratorContext(beginAscensionRite(sessionAt(0, 1)));
    expect(ctx).not.toBeNull();
    expect(ctx).toContain("above the Sequences");
    expect(ctx).toContain("a Pillar");
  });

  it("is null for a stale rite whose tier no longer matches the current apex", () => {
    // A true-god rite begun at Seq 1, then the character somehow sits at a rung
    // with no apex — the rite must not steer narration.
    const begun = beginAscensionRite(sessionAt(1));
    const drifted: GameSession = {
      ...begun,
      gameState: { ...begun.gameState, sequenceLevel: 3 },
    };
    expect(ascensionRiteNarratorContext(drifted)).toBeNull();
  });
});

describe("clearAscensionRite", () => {
  it("drops the rite and its quest label", () => {
    const begun = beginAscensionRite(sessionAt(1), 1000);
    const cleared = clearAscensionRite(begun, 1001);
    expect(cleared.ascensionRite).toBeUndefined();
    expect(cleared.gameState.activeQuests).not.toContain(
      ascensionRiteQuestLabel("true-god"),
    );
  });

  it("is a no-op when no rite is under way", () => {
    const s = sessionAt(1);
    expect(clearAscensionRite(s)).toBe(s);
  });
});

describe("isValidAscensionRiteShape", () => {
  it("accepts a well-formed rite of either tier", () => {
    expect(
      isValidAscensionRiteShape({ tier: "true-god", pathwayId: 1, fidelity: 0 }),
    ).toBe(true);
    expect(
      isValidAscensionRiteShape({ tier: "pillar", pathwayId: 16, fidelity: 1 }),
    ).toBe(true);
  });

  it("rejects a bad tier, non-finite pathway, or out-of-range fidelity", () => {
    expect(
      isValidAscensionRiteShape({ tier: "demigod", pathwayId: 1, fidelity: 0 }),
    ).toBe(false);
    expect(
      isValidAscensionRiteShape({ tier: "true-god", pathwayId: NaN, fidelity: 0 }),
    ).toBe(false);
    expect(
      isValidAscensionRiteShape({ tier: "true-god", pathwayId: 1, fidelity: 1.5 }),
    ).toBe(false);
    expect(
      isValidAscensionRiteShape({ tier: "true-god", pathwayId: 1, fidelity: -0.1 }),
    ).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isValidAscensionRiteShape(null)).toBe(false);
    expect(isValidAscensionRiteShape([])).toBe(false);
    expect(isValidAscensionRiteShape("rite")).toBe(false);
  });
});

describe("session (de)serialization with an ascension rite", () => {
  it("round-trips a valid rite on the session", () => {
    const begun = beginAscensionRite(sessionAt(1), 1000);
    const restored = deserializeSession(serializeSession(begun));
    expect(restored?.ascensionRite).toEqual(begun.ascensionRite);
  });

  it("rejects a save carrying a malformed rite", () => {
    const begun = beginAscensionRite(sessionAt(1), 1000);
    const json = JSON.parse(serializeSession(begun));
    json.ascensionRite = { tier: "nonsense", pathwayId: 1, fidelity: 0 };
    expect(deserializeSession(JSON.stringify(json))).toBeNull();
  });
});
