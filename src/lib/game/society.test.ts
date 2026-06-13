import { describe, expect, it } from "vitest";

import {
  canConvene,
  canFoundSociety,
  foundSociety,
  holdGathering,
  isValidSocietyShape,
  recruitMember,
  resolveMemberArc,
  societyKindForPathway,
  GATHERING_COOLDOWN_TURNS,
  SOCIETY_KIND_LABELS,
  type SocietyState,
} from "./society";

const lowRoll = (): number => 0; // always shares intel, always advances arcs
const highRoll = (): number => 0.99; // never shares, never trades

function club(memberCount = 2): SocietyState {
  let society = foundSociety(1, 7, "The Tarot Club");
  for (let i = 0; i < memberCount; i++) {
    society = recruitMember(society, lowRoll, `m${i}`);
  }
  return society;
}

describe("societyKindForPathway", () => {
  it("gives the Fool the Tarot Club and others their own halls", () => {
    expect(societyKindForPathway(1)).toBe("tarot-club");
    expect(societyKindForPathway(4)).toBe("nighthawk-squad");
    expect(societyKindForPathway(5)).toBe("nighthawk-squad");
    expect(societyKindForPathway(3)).toBe("church-division");
    expect(societyKindForPathway(6)).toBe("pirate-crew");
    expect(societyKindForPathway(2)).toBe("scholars-circle");
    for (const label of Object.values(SOCIETY_KIND_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe("foundSociety", () => {
  it("is gated at Sequence 7", () => {
    expect(canFoundSociety(9)).toBe(false);
    expect(canFoundSociety(7)).toBe(true);
    expect(() => foundSociety(1, 9, undefined)).toThrow(/Sequence 7/);
    const society = foundSociety(1, 6, undefined);
    expect(society.name).toBe("The Tarot Club");
    expect(society.members).toEqual([]);
  });
});

describe("recruitMember", () => {
  it("recruits unique code names until the table is full", () => {
    let society = club(0);
    for (let i = 0; i < 10; i++) society = recruitMember(society, lowRoll, `m${i}`);
    const names = society.members.map((m) => m.codeName);
    expect(new Set(names).size).toBe(10);
    expect(() => recruitMember(society, lowRoll)).toThrow(/seat at the long table/);
    expect(society.members[0]).toMatchObject({ disposition: 10, arcStage: 0 });
  });
});

describe("holdGathering", () => {
  it("requires members and respects the cooldown", () => {
    const empty = foundSociety(1, 7, undefined);
    expect(canConvene(empty, 100)).toBe(false);
    const society = club();
    expect(canConvene(society, 0)).toBe(true);
    const { society: after } = holdGathering(society, 10, lowRoll);
    expect(canConvene(after, 10 + GATHERING_COOLDOWN_TURNS - 1)).toBe(false);
    expect(canConvene(after, 10 + GATHERING_COOLDOWN_TURNS)).toBe(true);
    expect(() => holdGathering(after, 11, lowRoll)).toThrow(/will not open again/);
  });

  it("yields intel facts, disposition drift, arc creep, and a narrative seed", () => {
    const outcome = holdGathering(club(), 10, lowRoll);
    expect(outcome.facts).toHaveLength(2);
    expect(outcome.facts[0].description).toContain("At the gathering,");
    expect(outcome.items).toHaveLength(1); // lowRoll < 0.34 trade chance
    for (const member of outcome.society.members) {
      expect(member.disposition).toBe(13);
      expect(member.arcStage).toBe(1);
    }
    expect(outcome.narrativeSeed).toContain("Above the gray fog");
    expect(outcome.society.gatheringCount).toBe(1);
  });

  it("a cold table can yield nothing — and that is fine", () => {
    const outcome = holdGathering(club(), 10, highRoll);
    expect(outcome.facts).toHaveLength(0);
    expect(outcome.items).toHaveLength(0);
    expect(outcome.society.members[0].arcStage).toBe(0);
  });
});

describe("resolveMemberArc", () => {
  it("resolves only fully-advanced arcs, rewarding trust", () => {
    let society = club(1);
    expect(resolveMemberArc(society, "m0").fact).toBeNull();
    for (const turn of [10, 20, 30]) {
      society = holdGathering(society, turn, lowRoll).society;
    }
    expect(society.members[0].arcStage).toBe(3);
    const { society: resolved, fact } = resolveMemberArc(society, "m0");
    expect(fact?.description).toContain("has come to a head");
    expect(resolved.members[0].arcStage).toBe(0);
    expect(resolved.members[0].disposition).toBeGreaterThan(
      society.members[0].disposition,
    );
    expect(resolveMemberArc(society, "nope").fact).toBeNull();
  });
});

describe("isValidSocietyShape", () => {
  it("accepts persisted state and rejects junk", () => {
    expect(isValidSocietyShape(club())).toBe(true);
    expect(isValidSocietyShape(null)).toBe(false);
    expect(isValidSocietyShape({ kind: "tarot-club" })).toBe(false);
    expect(
      isValidSocietyShape({
        kind: "tarot-club",
        name: "x",
        gatheringCount: 0,
        lastGatheringTurn: 0,
        members: [{ id: 1 }],
      }),
    ).toBe(false);
  });
});
