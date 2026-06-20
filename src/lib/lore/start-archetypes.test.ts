import { describe, expect, it } from "vitest";

import {
  START_ARCHETYPES,
  startArchetypesForEpoch,
  getStartArchetype,
  archetypeGrounding,
  type ArchetypeRelationship,
} from "./start-archetypes";
import { NPC_LORE } from "./npcs";
import { ORGANIZATION_LORE } from "./organizations";
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

  it("every anchor NPC references a real NPC name", () => {
    for (const a of START_ARCHETYPES) {
      expect(a.anchorNpcs.length).toBeGreaterThan(0);
      for (const name of a.anchorNpcs) {
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

  it("every anchor org and society seed references a real org slug", () => {
    for (const a of START_ARCHETYPES) {
      if (a.anchorOrg !== undefined) {
        expect(KNOWN_ORG_SLUGS.has(a.anchorOrg)).toBe(true);
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
