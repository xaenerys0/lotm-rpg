import { describe, expect, it } from "vitest";

import {
  canConvene,
  canFoundSociety,
  foundSociety,
  holdGathering,
  isValidSocietyShape,
  memberArc,
  memberPathwayHint,
  migrateSocietyState,
  recruitMember,
  resolveMemberArc,
  seedSocietyMembership,
  societyKindForPathway,
  GATHERING_COOLDOWN_TURNS,
  RESOLVED_ARC_ID,
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
    // The hidden-face narrator uses singular "they", which takes plural verb
    // agreement — never "they is/owes/suspects". (Regression guard for the
    // society-page grammar fix.)
    expect(fact?.description).toContain("they are hunting");
    expect(fact?.description).not.toMatch(/they (is|owes|suspects|wants|knows)\b/);
    expect(resolved.members[0].arcId).toBe(RESOLVED_ARC_ID);
    expect(memberArc(resolved.members[0])).toBe("owe you a debt they intend to honor");
    expect(resolved.members[0].arcStage).toBe(0);
    expect(resolved.members[0].disposition).toBeGreaterThan(
      society.members[0].disposition,
    );
    expect(resolveMemberArc(society, "nope").fact).toBeNull();
  });
});

describe("member phrasing", () => {
  it("every derived arc agrees with the singular 'they' the card renders", () => {
    // The card renders "This one {hint}. They {arc}." Singular "they" takes
    // plural verb agreement, so a derived arc must never begin with a singular
    // verb (is/owes/suspects/wants) when prefixed by "They".
    for (let i = 0; i < 6; i++) {
      const pick = (i + 0.5) / 6; // hits arc/hint index i deterministically
      const society = recruitMember(foundSociety(1, 7, undefined), () => pick, `m${i}`);
      const member = society.members[0];
      expect(`They ${memberArc(member)}`).not.toMatch(
        /They (is|owes|suspects|wants|knows)\b/,
      );
      expect(memberPathwayHint(member).length).toBeGreaterThan(0);
    }
  });

  it("derives prose from ids and clamps unknown ids to the first entry", () => {
    const base = recruitMember(foundSociety(1, 7, undefined), () => 0, "m0");
    const member = base.members[0];
    // Recruited deterministically at index 0 of each catalog.
    expect(memberArc(member)).toBe(
      "are hunting the counterfeiter who ruined their family",
    );
    expect(memberPathwayHint(member)).toBe("reads people a little too easily");
    // Out-of-range ids (e.g. a shrunken catalog) fall back, never undefined.
    expect(memberArc({ ...member, arcId: 999 })).toBe(memberArc({ ...member, arcId: 0 }));
    expect(memberPathwayHint({ ...member, pathwayHintId: 999 })).toBe(
      memberPathwayHint({ ...member, pathwayHintId: 0 }),
    );
  });
});

describe("migrateSocietyState", () => {
  const legacyMember = (over: Record<string, unknown> = {}) =>
    ({
      id: "m0",
      codeName: "Justice",
      disposition: 13,
      arcStage: 2,
      ...over,
    }) as unknown as SocietyState["members"][number];

  function legacyClub(members: SocietyState["members"]): SocietyState {
    return { ...foundSociety(1, 7, undefined), members };
  }

  it("maps pre-fix singular-verb prose back to its stable id", () => {
    const state = legacyClub([
      legacyMember({
        arc: "is hunting the counterfeiter who ruined their family",
        pathwayHint: "asks careful questions about the dead",
      }),
    ]);
    const migrated = migrateSocietyState(state);
    const member = migrated.members[0];
    // Prose is now derived in code — and grammatical.
    expect(memberArc(member)).toBe(
      "are hunting the counterfeiter who ruined their family",
    );
    expect(memberPathwayHint(member)).toBe("asks careful questions about the dead");
    expect(member.arcStage).toBe(2);
    // Legacy prose fields are dropped from the migrated member.
    expect((member as unknown as Record<string, unknown>).arc).toBeUndefined();
    expect((member as unknown as Record<string, unknown>).pathwayHint).toBeUndefined();
  });

  it("maps both spellings of the resolved arc to the reserved id", () => {
    for (const arc of [
      "owe you a debt they intend to honor",
      "owes you a debt they intend to honor",
    ]) {
      const migrated = migrateSocietyState(legacyClub([legacyMember({ arc })]));
      expect(migrated.members[0].arcId).toBe(RESOLVED_ARC_ID);
      expect(memberArc(migrated.members[0])).toBe("owe you a debt they intend to honor");
    }
  });

  it("clamps unknown or missing prose to id 0 rather than crashing", () => {
    const migrated = migrateSocietyState(
      legacyClub([legacyMember({ arc: "something nobody ever wrote" })]),
    );
    expect(migrated.members[0].arcId).toBe(0);
    expect(migrated.members[0].pathwayHintId).toBe(0);
    expect(migrated.members[0].arcStage).toBe(2);
  });

  it("returns id-shaped state untouched (idempotent)", () => {
    const fresh = recruitMember(foundSociety(1, 7, undefined), () => 0.5, "m0");
    expect(migrateSocietyState(fresh)).toBe(fresh);
  });
});

describe("isValidSocietyShape", () => {
  it("accepts persisted state and rejects junk", () => {
    expect(isValidSocietyShape(club())).toBe(true);
    expect(isValidSocietyShape(null)).toBe(false);
    expect(isValidSocietyShape({ kind: "tarot-club" })).toBe(false);
    // Non-finite counters are rejected.
    expect(
      isValidSocietyShape({
        kind: "tarot-club",
        name: "x",
        gatheringCount: Number.NaN,
        lastGatheringTurn: 0,
        members: [],
      }),
    ).toBe(false);
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

  it("accepts both legacy prose and id-shaped members", () => {
    const base = {
      kind: "tarot-club",
      name: "x",
      gatheringCount: 0,
      lastGatheringTurn: 0,
    };
    const legacy = { id: "m0", codeName: "Justice", disposition: 5, arc: "is hunting" };
    const idShaped = { id: "m1", codeName: "The Moon", disposition: 5, arcId: 2 };
    expect(isValidSocietyShape({ ...base, members: [legacy] })).toBe(true);
    expect(isValidSocietyShape({ ...base, members: [idShaped] })).toBe(true);
    // A member with neither arc form is rejected.
    expect(
      isValidSocietyShape({
        ...base,
        members: [{ id: "m2", codeName: "x", disposition: 5 }],
      }),
    ).toBe(false);
  });
});

describe("seedSocietyMembership (issue #131)", () => {
  it("maps a known org slug to its society kind and display name", () => {
    const state = seedSocietyMembership("nighthawks-tingen-team");
    expect(state.kind).toBe("nighthawk-squad");
    expect(state.name).toBe("The Tingen Nighthawks");
    expect(state.members).toEqual([]);
    expect(state.gatheringCount).toBe(0);
    // Seeded so the first gathering is immediately allowed once members exist.
    expect(state.lastGatheringTurn).toBe(-GATHERING_COOLDOWN_TURNS);
  });

  it("falls back to a neutral scholars' circle for an unknown org slug", () => {
    const state = seedSocietyMembership("some-unmapped-org");
    expect(state.kind).toBe("scholars-circle");
    expect(state.name).toBe(SOCIETY_KIND_LABELS["scholars-circle"]);
  });

  it("produces a state that passes strict validation", () => {
    expect(isValidSocietyShape(seedSocietyMembership("nighthawks-tingen-team"))).toBe(
      true,
    );
  });
});
