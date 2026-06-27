import { describe, it, expect } from "vitest";
import {
  BESTIARY,
  getBestiaryFoe,
  bestiaryFor,
  bestiaryForPathwaySequence,
  bestiaryFoeSequence,
} from "./bestiary";
import type { EncounterFraming } from "@/lib/types/combat";

const FRAMINGS: EncounterFraming[] = [
  "hostile-beyonder",
  "mundane-threat",
  "mind-controlled",
  "lost-control",
  "rival-motive",
  "coerced",
  "beast",
];

describe("BESTIARY data integrity", () => {
  it("has unique ids", () => {
    const ids = BESTIARY.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has well-formed entries", () => {
    for (const foe of BESTIARY) {
      expect(foe.id.length).toBeGreaterThan(0);
      expect(foe.name.length).toBeGreaterThan(0);
      expect(FRAMINGS).toContain(foe.framing);
      expect(typeof foe.isBeyonder).toBe("boolean");
      expect(foe.description.length).toBeGreaterThan(0);
      expect(foe.signatureAbilities.length).toBeGreaterThan(0);
      expect(foe.sourceRef.length).toBeGreaterThan(0);
      // Band is [strongest, weakest] with strong <= weak (lower = stronger).
      const [strong, weak] = foe.sequenceBand;
      expect(strong).toBeLessThanOrEqual(weak);
      expect(strong).toBeGreaterThanOrEqual(0);
      expect(weak).toBeLessThanOrEqual(9);
      if (foe.pathwayId !== undefined) {
        expect(foe.pathwayId).toBeGreaterThanOrEqual(1);
        expect(foe.pathwayId).toBeLessThanOrEqual(22);
      }
    }
  });

  it("a Beyonder foe with a pathway is flagged isBeyonder where canon (data sanity)", () => {
    const sirius = getBestiaryFoe("tingen-sirius-arapis");
    expect(sirius?.isBeyonder).toBe(true);
    expect(sirius?.pathwayId).toBe(9);
  });

  it("covers each of the four travel cities with at least one region-specific foe", () => {
    for (const city of ["tingen", "backlund", "trier", "bayam"]) {
      const regional = BESTIARY.filter((f) => f.regions?.includes(city));
      expect(regional.length).toBeGreaterThan(0);
    }
  });

  it("includes generic (regionless) foes as universal filler", () => {
    expect(BESTIARY.some((f) => f.regions === undefined)).toBe(true);
  });
});

describe("getBestiaryFoe", () => {
  it("resolves a known id and returns undefined for an unknown one", () => {
    expect(getBestiaryFoe("backlund-devil-dog")?.name).toContain("Devil Dog");
    expect(getBestiaryFoe("nope")).toBeUndefined();
  });
});

describe("bestiaryFor", () => {
  it("returns only region-matching or generic foes for a region", () => {
    const tingen = bestiaryFor("tingen", 9);
    for (const foe of tingen) {
      expect(foe.regions === undefined || foe.regions.includes("tingen")).toBe(true);
    }
    // A Backlund-only foe never appears in a Tingen list.
    expect(tingen.some((f) => f.id === "backlund-devil-dog")).toBe(false);
  });

  it("filters by Sequence band (no hopeless mismatch)", () => {
    // The Devil Dog is a Seq 6-7 Beyonder; a Seq 9 player is in band, a Seq 2 is not.
    const lowPlayer = bestiaryFor("backlund", 9);
    expect(lowPlayer.some((f) => f.id === "backlund-devil-dog")).toBe(true);
    const highPlayer = bestiaryFor("backlund", 2);
    expect(highPlayer.some((f) => f.id === "backlund-devil-dog")).toBe(false);
  });

  it("returns only generic foes when no region is given", () => {
    const generic = bestiaryFor(undefined, 9);
    expect(generic.length).toBeGreaterThan(0);
    expect(generic.every((f) => f.regions === undefined)).toBe(true);
  });
});

describe("bestiaryFoeSequence", () => {
  it("clamps the player-relative target into the foe's canon band", () => {
    const devilDog = getBestiaryFoe("backlund-devil-dog")!; // band [6,7]
    // Seq 9 player → target 8 → clamped to the weakest band rung 7 (stays canon).
    expect(bestiaryFoeSequence(devilDog, 9)).toBe(7);
    // Seq 5 player → target 4 → clamped to the strongest band rung 6.
    expect(bestiaryFoeSequence(devilDog, 5)).toBe(6);
  });

  it("tracks the player one rung up within a wide band", () => {
    const rogue = getBestiaryFoe("generic-rogue-monster")!; // band [6,9]
    expect(bestiaryFoeSequence(rogue, 9)).toBe(8);
    expect(bestiaryFoeSequence(rogue, 7)).toBe(6);
  });
});

describe("bestiaryForPathwaySequence — ingredient-hunt carrier alignment", () => {
  it("matches a catalogued Beyonder of the exact pathway whose band covers the target sequence", () => {
    // Devil Dog: Abyss (21), band [6,7].
    const seq7 = bestiaryForPathwaySequence(21, 7, "backlund");
    expect(seq7.map((f) => f.id)).toContain("backlund-devil-dog");
    const seq6 = bestiaryForPathwaySequence(21, 6, "backlund");
    expect(seq6.map((f) => f.id)).toContain("backlund-devil-dog");
  });

  it("excludes a foe whose canon band does not COVER the target sequence", () => {
    // Devil Dog band [6,7] does not cover Seq 9 (a strict containment, not the
    // ±2 fight window).
    expect(bestiaryForPathwaySequence(21, 9, "backlund")).toHaveLength(0);
  });

  it("never returns a foe of a DIFFERENT pathway (the mismatch bug guard)", () => {
    // A Fool (1) hunter must never be handed the Abyss Devil Dog.
    const fool = bestiaryForPathwaySequence(1, 7, "backlund");
    expect(fool.every((f) => f.pathwayId === 1)).toBe(true);
    expect(fool.map((f) => f.id)).not.toContain("backlund-devil-dog");
  });

  it("prefers region-fitting carriers but is not region-bound", () => {
    // Out of region, the pathway/sequence match still surfaces (region is only a
    // tiebreak), so a roving Abyss hunter is not left empty-handed by locale.
    const elsewhere = bestiaryForPathwaySequence(21, 7, "tingen");
    expect(elsewhere.map((f) => f.id)).toContain("backlund-devil-dog");
  });
});
