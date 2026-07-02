import { describe, expect, it } from "vitest";

import {
  applyGatheringNarration,
  canConvene,
  canFoundSociety,
  canonCandidateSeeds,
  commitInvitedMember,
  foundSociety,
  holdGathering,
  invitedCanonIds,
  isValidSocietyShape,
  memberArc,
  memberPathwayHint,
  migrateSocietyState,
  recruitMember,
  resolveMemberArc,
  seedCanonSociety,
  seedSocietyMembership,
  societyKindForPathway,
  commitAndIntegrateMember,
  GATHERING_COOLDOWN_TURNS,
  MAX_SOCIETY_MEMBERS,
  RESOLVED_ARC_ID,
  SOCIETY_KIND_LABELS,
  type SocietyMemberCommit,
  type SocietyState,
} from "./society";
import { createDefaultGameState, createSession } from "./session";
import { resolveTrackedNpcState } from "./tracked-npcs";
import { resolveCodexState } from "./codex";
import type { GameSession } from "./types";

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

// --- AI society overhaul --------------------------------------------------

function commit(overrides: Partial<SocietyMemberCommit> = {}): SocietyMemberCommit {
  return {
    codeName: "Justice",
    realName: "Audrey Hall",
    pathwayHintProse: "reads the hearts of others",
    arcProse: "are quietly building a following of their own",
    origin: "canon",
    canonId: "audrey-hall",
    ...overrides,
  };
}

describe("seedCanonSociety", () => {
  it("gives Klein a pre-founded, empty Tarot Club with fiction", () => {
    const state = seedCanonSociety("klein-moretti");
    expect(state).not.toBeNull();
    expect(state?.kind).toBe("tarot-club");
    expect(state?.name).toBe("The Tarot Club");
    expect(state?.members).toEqual([]);
    expect(state?.description).toBeTruthy();
    expect(state?.ethos).toBeTruthy();
    expect(state?.meetingPlace).toBeTruthy();
    // Seeded so a gathering is immediately possible once members exist.
    expect(state?.lastGatheringTurn).toBe(-GATHERING_COOLDOWN_TURNS);
    expect(isValidSocietyShape(state)).toBe(true);
  });

  it("returns null for a canon figure who is not a founder (e.g. Audrey)", () => {
    expect(seedCanonSociety("audrey-hall")).toBeNull();
    expect(seedCanonSociety("unknown-person")).toBeNull();
  });

  it("returns a fresh copy each call (no shared mutable template)", () => {
    const a = seedCanonSociety("klein-moretti");
    const b = seedCanonSociety("klein-moretti");
    expect(a).not.toBe(b);
    expect(a?.members).not.toBe(b?.members);
  });
});

describe("canonCandidateSeeds", () => {
  it("returns the corpus tarot roster for the tarot-club kind", () => {
    const seeds = canonCandidateSeeds("tarot-club");
    const ids = seeds.map((s) => s.canonId);
    expect(ids).toContain("audrey-hall");
    expect(ids).toContain("alger-wilson");
    expect(ids).toContain("xio-derecha");
    // Canon caution: neither the false "Death" rumour nor "The World" is a member.
    expect(ids).not.toContain("azik-eggers");
    expect(seeds.every((s) => s.codeName && s.realName && s.roleHint)).toBe(true);
  });

  it("excludes already-seated ids and the player's own canon id", () => {
    const seeds = canonCandidateSeeds("tarot-club", {
      excludeCanonIds: ["audrey-hall"],
      excludeSelfId: "klein-moretti",
    });
    const ids = seeds.map((s) => s.canonId);
    expect(ids).not.toContain("audrey-hall");
    expect(ids).not.toContain("klein-moretti");
  });

  it("returns an empty roster for kinds with no canon seeds", () => {
    expect(canonCandidateSeeds("church-division")).toEqual([]);
    expect(canonCandidateSeeds("scholars-circle")).toEqual([]);
  });
});

describe("commitInvitedMember", () => {
  it("commits a canon candidate with its canonId, prose, and origin", () => {
    const society = seedCanonSociety("klein-moretti")!;
    const next = commitInvitedMember(society, commit(), "m-audrey");
    expect(next.members).toHaveLength(1);
    const member = next.members[0];
    expect(member.id).toBe("m-audrey");
    expect(member.codeName).toBe("Justice");
    expect(member.realName).toBe("Audrey Hall");
    expect(member.canonId).toBe("audrey-hall");
    expect(member.origin).toBe("canon");
    expect(member.disposition).toBe(10);
    expect(memberPathwayHint(member)).toBe("reads the hearts of others");
    expect(isValidSocietyShape(next)).toBe(true);
  });

  it("drops an unrecognized canonId and commits as an original", () => {
    const society = seedCanonSociety("klein-moretti")!;
    const next = commitInvitedMember(
      society,
      commit({ canonId: "totally-made-up", origin: "canon" }),
    );
    expect(next.members[0].canonId).toBeUndefined();
    expect(next.members[0].origin).toBe("original");
  });

  it("rejects a duplicate canon figure already seated", () => {
    let society = seedCanonSociety("klein-moretti")!;
    society = commitInvitedMember(society, commit(), "m1");
    expect(() => commitInvitedMember(society, commit(), "m2")).toThrow(/seat/i);
  });

  it("rejects a member with no code name", () => {
    const society = seedCanonSociety("klein-moretti")!;
    expect(() => commitInvitedMember(society, commit({ codeName: "  " }))).toThrow(
      /code name/i,
    );
  });

  it("honours an explicit disposition and an original candidate", () => {
    const society = foundSociety(2, 7, "A Circle");
    const next = commitInvitedMember(society, {
      codeName: "The Whisper",
      pathwayHintProse: "keeps to the shadows",
      arcProse: "seek a lost sibling",
      origin: "original",
      disposition: -20,
    });
    expect(next.members[0].origin).toBe("original");
    expect(next.members[0].disposition).toBe(-20);
    expect(next.members[0].canonId).toBeUndefined();
  });
});

describe("invitedCanonIds", () => {
  it("lists the canon ids currently seated", () => {
    let society = seedCanonSociety("klein-moretti")!;
    society = commitInvitedMember(society, commit(), "m1");
    society = recruitMember(society, lowRoll, "m2"); // a catalog member, no canonId
    expect(invitedCanonIds(society)).toEqual(["audrey-hall"]);
  });
});

describe("memberPathwayHint / memberArc prose preference", () => {
  it("prefers persisted prose over the catalog index for AI members", () => {
    const society = commitInvitedMember(
      seedCanonSociety("klein-moretti")!,
      commit({ pathwayHintProse: "hums forbidden hymns", arcProse: "hunt a traitor" }),
    );
    const member = society.members[0];
    expect(memberPathwayHint(member)).toBe("hums forbidden hymns");
    expect(memberArc(member)).toBe("hunt a traitor");
  });

  it("falls back to the catalog for a legacy/deterministic member", () => {
    const society = recruitMember(foundSociety(1, 7, "Club"), lowRoll, "m1");
    expect(memberPathwayHint(society.members[0]).length).toBeGreaterThan(0);
    expect(memberArc(society.members[0]).length).toBeGreaterThan(0);
  });
});

describe("holdGathering sharers", () => {
  it("reports the code names of members who shared, one per fact", () => {
    const society = club(2);
    const outcome = holdGathering(society, 100, lowRoll);
    expect(outcome.sharers).toHaveLength(outcome.facts.length);
    expect(outcome.sharers.length).toBeGreaterThan(0);
    for (const codeName of outcome.sharers) {
      expect(society.members.map((m) => m.codeName)).toContain(codeName);
    }
  });

  it("reports no sharers when the table stays quiet", () => {
    const outcome = holdGathering(club(2), 100, highRoll);
    expect(outcome.sharers).toEqual([]);
    expect(outcome.facts).toEqual([]);
  });
});

describe("applyGatheringNarration", () => {
  it("overlays AI narrative + intel + traded name, keeping the mechanics", () => {
    const base = holdGathering(club(2), 100, lowRoll);
    const intel = base.facts.map((_, i) => `AI intel line ${i}`);
    const next = applyGatheringNarration(base, {
      narrative: "The bronze table gleams in the fog.",
      intel,
      tradedItemName: "A sealed confession",
    });
    expect(next.narrativeSeed).toBe("The bronze table gleams in the fog.");
    next.facts.forEach((fact, i) => expect(fact.description).toBe(`AI intel line ${i}`));
    // Mechanics unchanged: same society, same fact count, same item count.
    expect(next.society).toBe(base.society);
    expect(next.facts).toHaveLength(base.facts.length);
    if (base.items.length > 0) {
      expect(next.items[0].name).toBe("A sealed confession");
    }
  });

  it("never mints an item the engine withheld", () => {
    const base = holdGathering(club(2), 100, highRoll); // no item traded
    const next = applyGatheringNarration(base, {
      tradedItemName: "A phantom relic",
    });
    expect(next.items).toEqual([]);
  });

  it("keeps deterministic prose when narration fields are blank/absent", () => {
    const base = holdGathering(club(2), 100, lowRoll);
    const next = applyGatheringNarration(base, { narrative: "   " });
    expect(next.narrativeSeed).toBe(base.narrativeSeed);
    expect(next.facts).toEqual(base.facts);
  });
});

describe("isValidSocietyShape — AI fields", () => {
  it("accepts a society with AI fiction and a pure-prose member", () => {
    const society = commitInvitedMember(seedCanonSociety("klein-moretti")!, commit());
    expect(isValidSocietyShape(society)).toBe(true);
  });

  it("rejects a non-string society description", () => {
    const bad = { ...foundSociety(1, 7, "Club"), description: 42 };
    expect(isValidSocietyShape(bad)).toBe(false);
  });

  it("rejects a member with an invalid origin literal", () => {
    const society = commitInvitedMember(seedCanonSociety("klein-moretti")!, commit());
    const bad = {
      ...society,
      members: [{ ...society.members[0], origin: "bogus" }],
    };
    expect(isValidSocietyShape(bad)).toBe(false);
  });

  it("rejects a member with a non-string canonId", () => {
    const society = commitInvitedMember(seedCanonSociety("klein-moretti")!, commit());
    const bad = {
      ...society,
      members: [{ ...society.members[0], canonId: 7 }],
    };
    expect(isValidSocietyShape(bad)).toBe(false);
  });
});

describe("migrateSocietyState — AI members", () => {
  it("preserves an AI member's prose fields unchanged (idempotent)", () => {
    const society = commitInvitedMember(seedCanonSociety("klein-moretti")!, commit());
    const migrated = migrateSocietyState(society);
    expect(migrated).toBe(society); // no change → same reference
    expect(migrated.members[0].pathwayHintProse).toBe("reads the hearts of others");
  });
});

describe("commitInvitedMember — full table cap", () => {
  it("rejects a commit once MAX_SOCIETY_MEMBERS seats are filled", () => {
    let society = seedCanonSociety("klein-moretti")!;
    for (let i = 0; i < MAX_SOCIETY_MEMBERS; i++) {
      society = commitInvitedMember(
        society,
        commit({ codeName: `Member ${i}`, origin: "original", canonId: undefined }),
        `m${i}`,
      );
    }
    expect(society.members).toHaveLength(MAX_SOCIETY_MEMBERS);
    expect(() =>
      commitInvitedMember(
        society,
        commit({ codeName: "One too many", origin: "original", canonId: undefined }),
      ),
    ).toThrow(/seat at the long table is filled/i);
  });
});

describe("canonCandidateSeeds — nighthawk code names are the real names (not invented canon)", () => {
  it("uses each Nighthawk's real name as the code name (no fabricated card)", () => {
    const seeds = canonCandidateSeeds("nighthawk-squad");
    for (const seed of seeds) {
      expect(seed.codeName).toBe(seed.realName);
    }
    expect(seeds.map((s) => s.realName)).toContain("Dunn Smith");
    // No invented card-style monikers.
    expect(seeds.map((s) => s.codeName)).not.toContain("The Captain");
  });
});

describe("commitAndIntegrateMember — full-world integration", () => {
  function baseSession(): GameSession {
    return {
      ...createSession(createDefaultGameState(1, "char-int", "Klein"), "s-int", 1000),
      societyState: seedCanonSociety("klein-moretti")!,
    };
  }

  it("seats the member AND rosters them as an ally AND files a Codex person", () => {
    const next = commitAndIntegrateMember(
      baseSession(),
      {
        codeName: "Justice",
        realName: "Audrey Hall",
        pathwayHintProse: "reads the hearts of others",
        arcProse: "are building a following",
        origin: "canon",
        canonId: "audrey-hall",
        note: "A Visionary noble who would answer the call.",
      },
      () => "m-int-1",
    );
    // Seated in the society.
    expect(next.societyState?.members.map((m) => m.realName)).toContain("Audrey Hall");
    // Rostered as a following ally.
    const roster = resolveTrackedNpcState(next.trackedNpcState).roster;
    expect(roster).toContainEqual(
      expect.objectContaining({
        name: "Audrey Hall",
        disposition: "ally",
        follows: true,
      }),
    );
    // Filed as a Codex person, code name as an alias, dossier as the note.
    const person = resolveCodexState(next.codexState).entities.find(
      (e) => e.name === "Audrey Hall",
    );
    expect(person?.kind).toBe("person");
    expect(person?.aliases).toContain("Justice");
    expect(person?.note).toContain("Visionary");
  });

  it("propagates a commit failure (duplicate canon) without partial integration", () => {
    let session = baseSession();
    session = commitAndIntegrateMember(
      session,
      {
        codeName: "Justice",
        realName: "Audrey Hall",
        pathwayHintProse: "reads hearts",
        arcProse: "build power",
        origin: "canon",
        canonId: "audrey-hall",
      },
      () => "m1",
    );
    expect(() =>
      commitAndIntegrateMember(session, {
        codeName: "Justice",
        realName: "Audrey Hall",
        pathwayHintProse: "reads hearts",
        arcProse: "build power",
        origin: "canon",
        canonId: "audrey-hall",
      }),
    ).toThrow(/seat/i);
    // Only one member + one roster entry — no duplicate integration.
    expect(session.societyState?.members).toHaveLength(1);
    expect(resolveTrackedNpcState(session.trackedNpcState).roster).toHaveLength(1);
  });

  it("is a no-op when the session has no society", () => {
    const noSociety = createSession(
      createDefaultGameState(1, "char-none", "Klein"),
      "s-none",
      1000,
    );
    const result = commitAndIntegrateMember(noSociety, {
      codeName: "Nobody",
      pathwayHintProse: "x",
      arcProse: "y",
      origin: "original",
    });
    expect(result).toBe(noSociety);
  });
});
