import { describe, expect, it } from "vitest";

import {
  buildGatheringPrompt,
  buildInvitationOutcomePrompt,
  buildSocietyCandidatesPrompt,
  buildSocietyIdentityPrompt,
  parseGatheringNarration,
  parseInvitationOutcome,
  parseSocietyCandidates,
  parseSocietyIdentity,
  MAX_SOCIETY_CANDIDATES,
  MAX_GATHERING_INTEL,
  type CanonSeedLite,
} from "./society-generation";

const seed: CanonSeedLite = {
  canonId: "audrey-hall",
  codeName: "Justice",
  realName: "Audrey Hall",
  roleHint: "a Visionary noblewoman of Backlund",
};

// --- Society identity -----------------------------------------------------

describe("buildSocietyIdentityPrompt", () => {
  it("includes the grounding lines and the optional context", () => {
    const [system, user] = buildSocietyIdentityPrompt({
      kindLabel: "The Tarot Club",
      pathwayName: "Fool",
      sequenceName: "Seer",
      epochLabel: "The Fifth Epoch",
      cityName: "Tingen City",
      canonKindReference: "convene above the gray fog",
      variety: 7,
    });
    expect(system.role).toBe("system");
    expect(user.content).toContain("The Tarot Club");
    expect(user.content).toContain("Fool");
    expect(user.content).toContain("Seer");
    expect(user.content).toContain("Tingen City");
    expect(user.content).toContain("The Fifth Epoch");
    expect(user.content).toContain("gray fog");
    expect(user.content).toContain("Variety token");
  });

  it("drops optional lines when absent", () => {
    const [, user] = buildSocietyIdentityPrompt({
      kindLabel: "A Circle of Scholars",
      pathwayName: "Visionary",
      sequenceName: "Spectator",
    });
    expect(user.content).not.toContain("City:");
    expect(user.content).not.toContain("Era:");
    expect(user.content).not.toContain("Variety token");
  });
});

describe("parseSocietyIdentity", () => {
  it("parses a clean identity and clamps nothing short", () => {
    const out = parseSocietyIdentity(
      JSON.stringify({
        name: "The Tarot Club",
        description: "A circle of hidden faces.",
        ethos: "Mutual benefit.",
        meetingPlace: "Above the gray fog.",
      }),
    );
    expect(out).toEqual({
      name: "The Tarot Club",
      description: "A circle of hidden faces.",
      ethos: "Mutual benefit.",
      meetingPlace: "Above the gray fog.",
    });
  });

  it("extracts JSON wrapped in a fence or prose", () => {
    expect(parseSocietyIdentity('```json\n{"name":"X"}\n```')?.name).toBe("X");
    expect(
      parseSocietyIdentity('Here you go: {"name":"Y","ethos":"e"} — enjoy')?.name,
    ).toBe("Y");
  });

  it("returns null without a usable name, and defaults prose to empty", () => {
    expect(parseSocietyIdentity("not json at all")).toBeNull();
    expect(parseSocietyIdentity(JSON.stringify({ description: "x" }))).toBeNull();
    const out = parseSocietyIdentity(JSON.stringify({ name: "Only a name" }));
    expect(out).toEqual({
      name: "Only a name",
      description: "",
      ethos: "",
      meetingPlace: "",
    });
  });
});

// --- Candidate slate ------------------------------------------------------

describe("buildSocietyCandidatesPrompt", () => {
  it("lists canon seeds to include and the invent count", () => {
    const [, user] = buildSocietyCandidatesPrompt({
      societyName: "The Tarot Club",
      kindLabel: "The Tarot Club",
      pathwayName: "Fool",
      sequenceLevel: 9,
      canonSeeds: [seed],
      inventCount: 3,
    });
    expect(user.content).toContain("canonId=audrey-hall");
    expect(user.content).toContain("Justice");
    expect(user.content).toContain("Original candidates to invent: 3");
  });

  it("notes when there are no canon seeds", () => {
    const [, user] = buildSocietyCandidatesPrompt({
      societyName: "A Circle",
      kindLabel: "A Circle of Scholars",
      pathwayName: "Visionary",
      sequenceLevel: 7,
      canonSeeds: [],
      inventCount: 4,
    });
    expect(user.content).toContain("none");
  });
});

describe("parseSocietyCandidates", () => {
  it("parses canon + original candidates, carrying canonId only for canon", () => {
    const out = parseSocietyCandidates(
      JSON.stringify({
        candidates: [
          {
            origin: "canon",
            canonId: "audrey-hall",
            codeName: "Justice",
            realName: "Audrey Hall",
            pathwayHint: "reads hearts",
            arc: "build a following",
            dossier: "She would answer.",
          },
          {
            origin: "original",
            canonId: "should-be-dropped",
            codeName: "The Whisper",
            pathwayHint: "keeps to shadows",
            arc: "seek a sibling",
            dossier: "A wary informant.",
          },
        ],
      }),
    );
    expect(out).toHaveLength(2);
    expect(out[0].origin).toBe("canon");
    expect(out[0].canonId).toBe("audrey-hall");
    // An original never carries a canonId, even if the model supplied one.
    expect(out[1].origin).toBe("original");
    expect(out[1].canonId).toBeUndefined();
  });

  it("accepts a bare array and drops items with no code name", () => {
    const out = parseSocietyCandidates(
      JSON.stringify([
        { codeName: "", dossier: "no name" },
        { codeName: "The Owl", dossier: "kept" },
      ]),
    );
    expect(out).toHaveLength(1);
    expect(out[0].codeName).toBe("The Owl");
  });

  it("caps the slate and returns [] on garbage", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ codeName: `C${i}` }));
    expect(parseSocietyCandidates(JSON.stringify(many)).length).toBe(
      MAX_SOCIETY_CANDIDATES,
    );
    expect(parseSocietyCandidates("nonsense")).toEqual([]);
    expect(parseSocietyCandidates(JSON.stringify({ nope: 1 }))).toEqual([]);
  });
});

// --- Invitation outcome ---------------------------------------------------

describe("buildInvitationOutcomePrompt", () => {
  it("names the candidate and inviter and includes the dossier", () => {
    const [, user] = buildInvitationOutcomePrompt({
      societyName: "The Tarot Club",
      kindLabel: "The Tarot Club",
      meetingPlace: "Above the gray fog",
      inviterRoleName: "Seer",
      candidate: {
        codeName: "Justice",
        realName: "Audrey Hall",
        dossier: "A Visionary noble.",
        origin: "canon",
      },
    });
    expect(user.content).toContain("Justice (Audrey Hall)");
    expect(user.content).toContain("Seer");
    expect(user.content).toContain("A Visionary noble.");
    expect(user.content).toContain("Above the gray fog");
  });
});

describe("parseInvitationOutcome", () => {
  it("defaults accepted to true and requires a narrative", () => {
    expect(parseInvitationOutcome(JSON.stringify({ narrative: "She answers." }))).toEqual(
      { accepted: true, narrative: "She answers." },
    );
    expect(
      parseInvitationOutcome(JSON.stringify({ accepted: false, narrative: "No." }))
        ?.accepted,
    ).toBe(false);
    expect(parseInvitationOutcome(JSON.stringify({ accepted: true }))).toBeNull();
    expect(parseInvitationOutcome("garbage")).toBeNull();
  });
});

// --- Gathering narration --------------------------------------------------

describe("buildGatheringPrompt", () => {
  it("lists the members and the sharers and the trade flag", () => {
    const [, user] = buildGatheringPrompt({
      societyName: "The Tarot Club",
      kindLabel: "The Tarot Club",
      meetingPlace: "Above the gray fog",
      members: [
        {
          codeName: "Justice",
          pathwayHint: "reads hearts",
          arc: "build power",
          disposition: 20,
        },
      ],
      sharerCodeNames: ["Justice"],
      itemTraded: true,
      locationName: "Tingen City",
      epochLabel: "The Fifth Epoch",
    });
    expect(user.content).toContain("Justice");
    expect(user.content).toContain("sharing intel");
    expect(user.content).toContain("An item is traded");
  });

  it("handles a quiet, itemless gathering", () => {
    const [, user] = buildGatheringPrompt({
      societyName: "A Circle",
      kindLabel: "A Circle of Scholars",
      members: [],
      sharerCodeNames: [],
      itemTraded: false,
    });
    expect(user.content).toContain("No member shares intel");
    expect(user.content).toContain("No item is traded");
  });
});

describe("parseGatheringNarration", () => {
  it("parses narrative + intel + traded name", () => {
    const out = parseGatheringNarration(
      JSON.stringify({
        narrative: "The table gleams.",
        intel: ["A warehouse", "A name"],
        tradedItemName: "A sealed letter",
      }),
    );
    expect(out?.narrative).toBe("The table gleams.");
    expect(out?.intel).toEqual(["A warehouse", "A name"]);
    expect(out?.tradedItemName).toBe("A sealed letter");
  });

  it("coerces intel POSITIONALLY (blank/non-string → '') and omits a blank trade name", () => {
    const out = parseGatheringNarration(
      JSON.stringify({
        narrative: "n",
        intel: ["a", 5, "", "b"],
        tradedItemName: "   ",
      }),
    );
    // Positions are preserved so intel[i] stays aligned with the i-th sharer.
    expect(out?.intel).toEqual(["a", "", "", "b"]);
    expect(out?.tradedItemName).toBeUndefined();
    const many = parseGatheringNarration(
      JSON.stringify({ narrative: "n", intel: Array(20).fill("x") }),
    );
    expect(many?.intel.length).toBe(MAX_GATHERING_INTEL);
  });

  it("returns null without a usable narrative", () => {
    expect(parseGatheringNarration(JSON.stringify({ intel: ["a"] }))).toBeNull();
    expect(parseGatheringNarration("nope")).toBeNull();
  });
});
