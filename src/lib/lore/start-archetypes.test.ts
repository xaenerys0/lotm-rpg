import { describe, expect, it } from "vitest";

import {
  START_ARCHETYPES,
  startArchetypesForEpoch,
  forsakenLandArchetypesForEpoch,
  getStartArchetype,
  archetypeGrounding,
  buildCustomArchetype,
  circleNpcSuggestions,
  type ArchetypeRelationship,
} from "./start-archetypes";
import { NPC_LORE } from "./npcs";
import { ORGANIZATION_LORE } from "./organizations";
import { getEpoch } from "./epochs";
import { ALL_PATHWAYS } from "@/lib/rules";

// Every NPC name the lore knows (flattened from each entry's `npcs` list).
const KNOWN_NPC_NAMES = new Set(NPC_LORE.flatMap((entry) => entry.npcs));
// Every organization slug the lore knows.
const KNOWN_ORG_SLUGS = new Set(ORGANIZATION_LORE.map((entry) => entry.slug));
const PLAYABLE_PATHWAY_IDS = new Set(ALL_PATHWAYS.map((p) => p.id));

const RELATIONSHIPS: ArchetypeRelationship[] = [
  "classmate",
  "assistant",
  "subordinate",
  "circle-member",
  "family-friend",
];

describe("START_ARCHETYPES data integrity", () => {
  it("has at least one archetype", () => {
    expect(START_ARCHETYPES.length).toBeGreaterThan(0);
  });

  it("has unique ids", () => {
    const ids = START_ARCHETYPES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every archetype has a valid epoch, location, label, blurb, and opening beat", () => {
    for (const a of START_ARCHETYPES) {
      expect(Number.isInteger(a.epoch)).toBe(true);
      expect(a.location.trim().length).toBeGreaterThan(0);
      expect(a.label.trim().length).toBeGreaterThan(0);
      expect(a.blurb.trim().length).toBeGreaterThan(0);
      expect(a.openingBeat.trim().length).toBeGreaterThan(0);
      expect(RELATIONSHIPS).toContain(a.relationship);
    }
  });

  it("the opening beat never names the pathway and ends with the scene cue", () => {
    for (const a of START_ARCHETYPES) {
      expect(a.openingBeat).toContain("Describe the opening scene and give me choices.");
      for (const pathway of ALL_PATHWAYS) {
        expect(a.openingBeat.toLowerCase()).not.toContain(
          `${pathway.name.toLowerCase()} pathway`,
        );
      }
    }
  });

  it("every circle NPC references a real NPC name", () => {
    for (const a of START_ARCHETYPES) {
      expect(a.circleNpcs.length).toBeGreaterThan(0);
      for (const name of a.circleNpcs) {
        expect(KNOWN_NPC_NAMES.has(name)).toBe(true);
      }
    }
  });

  it("every tracked ally seed references a real NPC name", () => {
    for (const a of START_ARCHETYPES) {
      for (const name of a.seeds.trackedAllies ?? []) {
        expect(KNOWN_NPC_NAMES.has(name)).toBe(true);
      }
    }
  });

  it("every affiliation org and society seed references a real org slug", () => {
    for (const a of START_ARCHETYPES) {
      if (a.affiliationOrg !== undefined) {
        expect(KNOWN_ORG_SLUGS.has(a.affiliationOrg)).toBe(true);
      }
      if (a.seeds.society) {
        expect(KNOWN_ORG_SLUGS.has(a.seeds.society.orgSlug)).toBe(true);
        expect(a.seeds.society.role.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("every pathway affinity is a playable pathway id", () => {
    for (const a of START_ARCHETYPES) {
      for (const id of a.pathwayAffinity ?? []) {
        expect(PLAYABLE_PATHWAY_IDS.has(id)).toBe(true);
      }
    }
  });

  it("every relationship fact is a non-empty string", () => {
    for (const a of START_ARCHETYPES) {
      for (const fact of a.seeds.facts ?? []) {
        expect(typeof fact).toBe("string");
        expect(fact.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("ships the Tingen archetypes the issue calls for", () => {
    const ids = START_ARCHETYPES.map((a) => a.id);
    expect(ids).toContain("tingen-klein-classmate");
    expect(ids).toContain("tingen-junior-nighthawk");
  });

  it("ships the Backlund circle archetypes (issue #133)", () => {
    const backlund = START_ARCHETYPES.filter((a) => a.location === "Backlund");
    expect(backlund.length).toBeGreaterThanOrEqual(2);
    const ids = backlund.map((a) => a.id);
    expect(ids).toContain("backlund-hall-attendant");
    expect(ids).toContain("backlund-detective-assistant");
    // Each is a default (non-origin) Fifth-Epoch archetype tied to a Backlund NPC.
    for (const a of backlund) {
      expect(a.epoch).toBe(5);
      expect(a.origin).toBeUndefined();
      expect(a.circleNpcs.length).toBeGreaterThan(0);
    }
    // They appear in the default picker alongside Tingen's.
    expect(startArchetypesForEpoch(5).map((a) => a.id)).toEqual(
      expect.arrayContaining(["backlund-hall-attendant", "backlund-detective-assistant"]),
    );
  });

  it("ships the wider Loen Kingdom circle archetypes (issue #134)", () => {
    const ids = START_ARCHETYPES.map((a) => a.id);
    expect(ids).toContain("constant-mcgovern-friend");
    expect(ids).toContain("loen-foundation-clerk");
    // The Constant friend opens in the Wind City; the Foundation clerk in Stoen
    // City. Both are default (non-origin) Fifth-Epoch starts tied to Loen NPCs.
    const constant = getStartArchetype("constant-mcgovern-friend")!;
    expect(constant.epoch).toBe(5);
    expect(constant.origin).toBeUndefined();
    expect(constant.location).toBe("Constant City");
    expect(constant.circleNpcs).toContain("Welch McGovern");
    const clerk = getStartArchetype("loen-foundation-clerk")!;
    expect(clerk.location).toBe("Stoen City");
    expect(clerk.affiliationOrg).toBe("loen-relic-foundation-overview");
    expect(clerk.circleNpcs).toContain("Pacheco Dwayne");
    // Both surface in the default picker (non-origin).
    expect(startArchetypesForEpoch(5).map((a) => a.id)).toEqual(
      expect.arrayContaining(["constant-mcgovern-friend", "loen-foundation-clerk"]),
    );
  });

  it("ships the Intis Republic circle archetypes (issue #135)", () => {
    const intis = START_ARCHETYPES.filter((a) => a.location === "Trier");
    expect(intis.length).toBeGreaterThanOrEqual(2);
    const ids = intis.map((a) => a.id);
    expect(ids).toContain("trier-blazing-sun-acolyte");
    expect(ids).toContain("trier-inquisition-initiate");
    // Each is a default (non-origin) Fifth-Epoch start tied to a Trier NPC and
    // affiliated with the Blazing Sun church org.
    for (const a of intis) {
      expect(a.epoch).toBe(5);
      expect(a.origin).toBeUndefined();
      expect(a.circleNpcs.length).toBeGreaterThan(0);
      expect(a.affiliationOrg).toBe("blazing-sun-church-members");
    }
    expect(getStartArchetype("trier-blazing-sun-acolyte")!.circleNpcs).toContain(
      "Plessy Descartes",
    );
    expect(getStartArchetype("trier-inquisition-initiate")!.circleNpcs).toContain(
      "Angoulême de François",
    );
    expect(startArchetypesForEpoch(5).map((a) => a.id)).toEqual(
      expect.arrayContaining(["trier-blazing-sun-acolyte", "trier-inquisition-initiate"]),
    );
  });
});

describe("startArchetypesForEpoch", () => {
  it("returns only archetypes of the requested epoch", () => {
    const fifth = startArchetypesForEpoch(5);
    expect(fifth.length).toBeGreaterThan(0);
    expect(fifth.every((a) => a.epoch === 5)).toBe(true);
  });

  it("defaults an absent epoch to the Fifth", () => {
    expect(startArchetypesForEpoch(undefined)).toEqual(startArchetypesForEpoch(5));
  });

  it("returns an empty list for an epoch with no archetypes yet", () => {
    expect(startArchetypesForEpoch(1)).toEqual([]);
  });
});

describe("getStartArchetype", () => {
  it("looks up an archetype by id", () => {
    expect(getStartArchetype("tingen-klein-classmate")?.label).toContain("Klein");
  });

  it("returns undefined for an unknown id", () => {
    expect(getStartArchetype("nope")).toBeUndefined();
  });
});

describe("archetypeGrounding", () => {
  it("produces a durable grounding line lowercasing the leading article", () => {
    const a = getStartArchetype("tingen-klein-classmate")!;
    const line = archetypeGrounding(a);
    expect(line).toBe(
      "You begin your chronicle as a classmate of Klein Moretti at Khoy University.",
    );
  });

  it("handles an 'An …' label", () => {
    const a = getStartArchetype("tingen-neil-assistant")!;
    expect(archetypeGrounding(a)).toBe(
      "You begin your chronicle as an assistant to Old Neil, the Nighthawks' artificer.",
    );
  });
});

describe("buildCustomArchetype (player-authored circles)", () => {
  it("turns a tie + companions into a normal archetype with seeds", () => {
    const a = buildCustomArchetype(
      {
        tie: "a fence who owes the Tingen Nighthawks",
        companions: ["Leonard Mitchell", "Mara"],
        location: "Tingen City",
      },
      5,
    );
    expect(a.id).toBe("custom");
    expect(a.epoch).toBe(5);
    expect(a.location).toBe("Tingen City");
    expect(a.label).toBe("a fence who owes the Tingen Nighthawks");
    expect(a.relationship).toBe("circle-member");
    // Companions (canon AND invented) become tracked allies.
    expect(a.seeds.trackedAllies).toEqual(["Leonard Mitchell", "Mara"]);
    expect(a.circleNpcs).toEqual(["Leonard Mitchell", "Mara"]);
    // The tie + companions are recorded as durable grounding facts.
    expect(a.seeds.facts?.[0]).toContain("a fence who owes the Tingen Nighthawks");
    expect(a.seeds.facts?.some((f) => f.includes("Mara"))).toBe(true);
    // The grounding line reads naturally and the opening beat names the place.
    expect(archetypeGrounding(a)).toBe(
      "You begin your chronicle as a fence who owes the Tingen Nighthawks.",
    );
    expect(a.openingBeat).toContain("Tingen City");
    expect(a.openingBeat).toContain("Describe the opening scene and give me choices.");
    // Custom circles never seed a canon-org society pre-membership.
    expect(a.seeds.society).toBeUndefined();
  });

  it("accepts an invented-only circle (no canon NPC required)", () => {
    const a = buildCustomArchetype(
      { tie: "the last heir of a drowned house", companions: ["Captain Rell"] },
      5,
    );
    expect(a.seeds.trackedAllies).toEqual(["Captain Rell"]);
  });

  it("falls back to the epoch default location when none is given", () => {
    const a = buildCustomArchetype({ tie: "a wanderer", companions: [] }, 5);
    expect(a.location).toBe(getEpoch(5).startingLocation);
    // No companions → no trackedAllies seed.
    expect(a.seeds.trackedAllies).toBeUndefined();
  });

  it("handles a blank circle with a neutral label and no seeds", () => {
    const a = buildCustomArchetype({ tie: "   ", companions: ["  "] }, 5);
    expect(a.label).toBe("an outsider with ties of their own");
    expect(a.seeds.trackedAllies).toBeUndefined();
    expect(a.seeds.facts).toBeUndefined();
    expect(a.circleNpcs).toEqual([]);
  });

  it("trims, de-duplicates, and bounds the free text", () => {
    const a = buildCustomArchetype(
      {
        tie: "x".repeat(500),
        companions: ["Klein Moretti", "klein moretti", "A", "B", "C", "D", "E", "F"],
        location: "L".repeat(500),
      },
      5,
    );
    expect(a.label.length).toBeLessThanOrEqual(200);
    // Case-insensitive de-dupe keeps the first spelling; max 5 companions.
    expect(a.seeds.trackedAllies).toEqual(["Klein Moretti", "A", "B", "C", "D"]);
    // A free-text location is length-bounded too (prompt-budget guarantee).
    expect(a.location.length).toBeLessThanOrEqual(80);
  });

  it("resolves an unknown epoch to the Fifth", () => {
    const a = buildCustomArchetype({ tie: "a stranger", companions: [] }, undefined);
    expect(a.epoch).toBe(5);
  });
});

describe("circleNpcSuggestions", () => {
  it("suggests canon NPC names for the epoch", () => {
    const fifth = circleNpcSuggestions(5);
    expect(fifth).toContain("Klein Moretti");
    expect(fifth).toContain("Dunn Smith");
    // Sorted and de-duplicated.
    expect([...fifth].sort((a, b) => a.localeCompare(b))).toEqual(fifth);
    expect(new Set(fifth).size).toBe(fifth.length);
  });

  it("does not leak Fifth-Epoch NPCs into an earlier epoch", () => {
    expect(circleNpcSuggestions(1)).not.toContain("Klein Moretti");
  });
});

describe("origin archetypes (issue #132)", () => {
  it("excludes origin archetypes from the default picker", () => {
    expect(startArchetypesForEpoch(5).every((a) => a.origin === undefined)).toBe(true);
    expect(
      startArchetypesForEpoch(5).some((a) => a.id === "forsaken-silver-knight"),
    ).toBe(false);
  });

  it("surfaces the Forsaken origin archetype only behind the affordance", () => {
    const origins = forsakenLandArchetypesForEpoch(5);
    expect(origins.length).toBeGreaterThan(0);
    expect(origins.every((a) => a.origin === "forsaken-land")).toBe(true);
    const knight = origins.find((a) => a.id === "forsaken-silver-knight");
    expect(knight?.location).toBe("Silver City");
    // Resolvable by id (the picker passes the id through the archetype path).
    expect(getStartArchetype("forsaken-silver-knight")?.origin).toBe("forsaken-land");
  });

  it("has no origin archetypes for epochs without them", () => {
    expect(forsakenLandArchetypesForEpoch(1)).toEqual([]);
  });
});
