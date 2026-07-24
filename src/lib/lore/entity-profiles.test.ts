import { describe, expect, it } from "vitest";

import { getSequence } from "@/lib/rules";

import { getBestiaryFoe, BESTIARY } from "./bestiary";
import { CANON_PLAYABLE_CHARACTERS } from "./canon-characters";
import {
  CANON_DEATH_SOURCES,
  CANON_MORTALITY_POLICIES,
  CURATED_ENTITY_PROFILES,
  canonMortalityPolicy,
  curatedProfileForBestiaryId,
  getCuratedEntityProfile,
  protectedBestiaryIds,
} from "./entity-profiles";

describe("curated entity profiles — data integrity", () => {
  it("has a unique catalogue id and a corpus citation for every entry", () => {
    const ids = CURATED_ENTITY_PROFILES.map((p) => p.catalogId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const profile of CURATED_ENTITY_PROFILES) {
      expect(profile.profileVersion).toBeGreaterThanOrEqual(1);
      expect(profile.sourceRef.length).toBeGreaterThan(10);
      expect(profile.sourceRef).toMatch(/wiki:/);
    }
  });

  it("points every profile at a real bestiary entry", () => {
    for (const profile of CURATED_ENTITY_PROFILES) {
      expect(getBestiaryFoe(profile.bestiaryId), profile.catalogId).toBeDefined();
    }
  });

  it("agrees with its bestiary entry's pathway and canon Sequence band", () => {
    for (const profile of CURATED_ENTITY_PROFILES) {
      if (profile.characteristicOwnership.status !== "known") continue;
      const foe = getBestiaryFoe(profile.bestiaryId);
      expect(foe).toBeDefined();
      for (const stack of profile.characteristicOwnership.stacks) {
        // The characteristic's pathway must be the foe's canon pathway…
        expect(stack.pathwayId, profile.catalogId).toBe(foe?.pathwayId);
        // …and its rung must lie inside the foe's canon band (strongest..weakest).
        const [strongest, weakest] = foe!.sequenceBand;
        expect(stack.sequenceLevel).toBeGreaterThanOrEqual(strongest);
        expect(stack.sequenceLevel).toBeLessThanOrEqual(weakest);
        // A stack is a whole positive count of a REAL canon rung.
        expect(Number.isSafeInteger(stack.quantity)).toBe(true);
        expect(stack.quantity).toBeGreaterThan(0);
        expect(getSequence(stack.pathwayId, stack.sequenceLevel)).toBeDefined();
      }
    }
  });

  it("pins the Devil Dog's characteristic to Abyss Sequence 6 (its canon rung)", () => {
    const profile = curatedProfileForBestiaryId("backlund-devil-dog");
    expect(profile?.characteristicOwnership).toEqual({
      status: "known",
      stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
    });
    // Its encounter band spans 6-7, so the drop must NOT follow the fight rung.
    expect(getBestiaryFoe("backlund-devil-dog")?.sequenceBand).toEqual([6, 7]);
    expect(getSequence(21, 6)?.name).toBe("Devil");
  });

  it("renders Hood Eugen's rung as the Visionary Psychiatrist", () => {
    const profile = curatedProfileForBestiaryId("backlund-hood-eugen");
    expect(profile?.characteristicOwnership).toEqual({
      status: "known",
      stacks: [{ pathwayId: 2, sequenceLevel: 7, quantity: 1 }],
    });
    expect(getSequence(2, 7)?.name).toBe("Psychiatrist");
  });

  it("carries the remaining corpus-confirmed carriers at their canon rungs", () => {
    expect(
      curatedProfileForBestiaryId("tingen-sirius-arapis")?.characteristicOwnership,
    ).toEqual({
      status: "known",
      stacks: [{ pathwayId: 9, sequenceLevel: 9, quantity: 1 }],
    });
    expect(
      curatedProfileForBestiaryId("backlund-meursault")?.characteristicOwnership,
    ).toEqual({
      status: "known",
      stacks: [{ pathwayId: 14, sequenceLevel: 9, quantity: 1 }],
    });
    expect(
      curatedProfileForBestiaryId("backlund-rosago")?.characteristicOwnership,
    ).toEqual({
      status: "known",
      stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity: 1 }],
    });
  });

  it("gives the Antigonus Family Puppet no characteristic despite its Fool framing", () => {
    const profile = curatedProfileForBestiaryId("tingen-antigonus-puppet");
    expect(profile?.characteristicOwnership).toEqual({ status: "known-none" });
    expect(profile?.kind).toBe("construct");
    // The Fool pathway stays a combat/intelligence fact on the bestiary entry.
    expect(getBestiaryFoe("tingen-antigonus-puppet")?.pathwayId).toBe(1);
  });

  it("authors no materials it cannot cite", () => {
    for (const profile of CURATED_ENTITY_PROFILES) {
      expect(profile.harvestableMaterials).toEqual([]);
    }
  });

  it("looks up by catalogue id and misses cleanly", () => {
    expect(getCuratedEntityProfile("profile-rosago")?.bestiaryId).toBe("backlund-rosago");
    expect(getCuratedEntityProfile("profile-nobody")).toBeUndefined();
    expect(curatedProfileForBestiaryId("generic-desperate-thugs")).toBeUndefined();
  });
});

describe("canon mortality policies", () => {
  it("authors a policy for every curated carrier", () => {
    for (const profile of CURATED_ENTITY_PROFILES) {
      const policy = canonMortalityPolicy(profile.bestiaryId);
      expect(policy, profile.bestiaryId).toBeDefined();
      expect(policy?.kind).toBe("mortal-after");
    }
  });

  it("derives every playable canon preset's policy from its introduction", () => {
    for (const preset of CANON_PLAYABLE_CHARACTERS) {
      const policy = canonMortalityPolicy(preset.id);
      expect(policy, preset.id).toBeDefined();
      if (policy?.kind !== "mortal-after") throw new Error("expected mortal-after");
      expect(policy.minCanonPosition).toBe(preset.canonPosition);
      expect(policy.activeEpochs).toEqual([preset.epoch]);
    }
  });

  it("never allows a canon death from narrator intent", () => {
    for (const entry of CANON_MORTALITY_POLICIES) {
      if (entry.policy.kind !== "mortal-after") continue;
      expect(entry.policy.allowedSources).not.toContain("narrative-intent");
      expect(entry.policy.allowedSources).toEqual([...CANON_DEATH_SOURCES]);
    }
  });

  it("keys each policy uniquely and cites its source", () => {
    const refs = CANON_MORTALITY_POLICIES.map((e) => e.canonRef);
    expect(new Set(refs).size).toBe(refs.length);
    const policyIds = CANON_MORTALITY_POLICIES.map((e) => e.policy.policyId);
    expect(new Set(policyIds).size).toBe(policyIds.length);
    for (const entry of CANON_MORTALITY_POLICIES) {
      expect(entry.sourceRef.length).toBeGreaterThan(10);
      expect(entry.policy.version).toBeGreaterThanOrEqual(1);
    }
  });

  it("places every carrier's threshold at or before its canon death chapter", () => {
    // Corpus-cited kill chapters: Sirius 103-104, Puppet 70-75, Devil Dog 327,
    // Meursault 228, Hood Eugen 186, Rosago 250. A threshold after the kill would
    // make the canon event itself unreachable.
    const killChapters: Record<string, number> = {
      "tingen-sirius-arapis": 103,
      "tingen-antigonus-puppet": 75,
      "backlund-devil-dog": 327,
      "backlund-meursault": 228,
      "backlund-hood-eugen": 186,
      "backlund-rosago": 250,
    };
    for (const [canonRef, chapter] of Object.entries(killChapters)) {
      const policy = canonMortalityPolicy(canonRef);
      if (policy?.kind !== "mortal-after") throw new Error(`no policy for ${canonRef}`);
      expect(policy.minCanonPosition, canonRef).toBeLessThanOrEqual(chapter);
      expect(policy.minCanonPosition).toBeGreaterThan(0);
    }
  });

  it("fails closed for an unknown canon reference", () => {
    expect(canonMortalityPolicy("canon:nobody")).toBeUndefined();
    expect(canonMortalityPolicy("")).toBeUndefined();
  });

  it("reports the bestiary entries left protected for want of a policy", () => {
    const unprotected = CURATED_ENTITY_PROFILES.map((p) => p.bestiaryId);
    const gaps = protectedBestiaryIds();
    // Every carrier is killable…
    for (const id of unprotected) expect(gaps).not.toContain(id);
    // …and every other catalogued foe is reported, not silently unkillable.
    for (const foe of BESTIARY) {
      if (!unprotected.includes(foe.id)) expect(gaps).toContain(foe.id);
    }
    expect(gaps.length).toBe(BESTIARY.length - unprotected.length);
  });
});
