import { describe, expect, it } from "vitest";
import { getPathway } from "@/lib/rules";
import {
  GRADE_POWER_BAND,
  SEALED_ARTIFACTS,
  type ArtifactGrade,
  classifyHolder,
  custodyForArtifactItem,
  effectsForArtifactNumber,
  getArtifactCustody,
  getSealedArtifact,
  gradeForArtifactItem,
  hasAuthoredEffects,
  isArtifactTradeable,
  isCraftedArtifactCode,
  mintArtifactItem,
  ownerNameForArtifactItem,
  sealedArtifactNumberFromItemName,
  sealedArtifactsForGrade,
  sealedArtifactsForPathway,
} from "./sealed-artifacts";

const EFFECT_HOOKS = new Set([
  "identity",
  "sanity",
  "combat",
  "acquired-power",
  "funds",
  "access",
  "narrator",
]);

const GRADES: ArtifactGrade[] = [0, 1, 2, 3];

describe("sealed-artifacts data integrity", () => {
  it("ships a meaningful catalogue across every grade", () => {
    expect(SEALED_ARTIFACTS.length).toBeGreaterThanOrEqual(25);
    for (const grade of GRADES) {
      expect(sealedArtifactsForGrade(grade).length).toBeGreaterThan(0);
    }
  });

  it("every entry has a unique code and name", () => {
    const numbers = SEALED_ARTIFACTS.map((a) => a.number);
    const names = SEALED_ARTIFACTS.map((a) => a.name);
    expect(new Set(numbers).size).toBe(numbers.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("every entry's code matches its grade and a valid Grade-Sequential shape", () => {
    // Arrodes (2-111) is canonically Grade 1 despite its legacy "2-" code — the
    // one documented anomaly where the leading digit does not equal the grade.
    const CODE_GRADE_ANOMALIES = new Set(["2-111"]);
    for (const artifact of SEALED_ARTIFACTS) {
      expect(artifact.number).toMatch(/^[0-3]-\d{2,4}$/);
      expect(GRADES).toContain(artifact.grade);
      if (!CODE_GRADE_ANOMALIES.has(artifact.number)) {
        expect(Number(artifact.number[0])).toBe(artifact.grade);
      }
    }
  });

  it("every entry carries a non-empty description, drawback, power band, and source", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      expect(artifact.name.trim().length).toBeGreaterThan(0);
      expect(artifact.description.trim().length).toBeGreaterThan(0);
      // The drawback is the defining trait of a Sealed Artifact — never omitted.
      expect(artifact.drawback.trim().length).toBeGreaterThan(0);
      expect(artifact.powerEquivalence.trim().length).toBeGreaterThan(0);
      expect(artifact.sourceRef.trim().length).toBeGreaterThan(0);
    }
  });

  it("a pathway hint, when present, is one of the 22 playable pathways", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      if (artifact.pathwayHint === undefined) continue;
      expect(artifact.pathwayHint).toBeGreaterThanOrEqual(1);
      expect(artifact.pathwayHint).toBeLessThanOrEqual(22);
      expect(getPathway(artifact.pathwayHint)).toBeDefined();
    }
  });

  it("exposes a power band for each grade", () => {
    for (const grade of GRADES) {
      expect(GRADE_POWER_BAND[grade].trim().length).toBeGreaterThan(0);
    }
  });
});

describe("sealed-artifacts lookups", () => {
  it("getSealedArtifact hits a real code and misses an unknown one", () => {
    expect(getSealedArtifact("0-08")?.name).toBe("Quill of Alzuhod");
    expect(getSealedArtifact("9-999")).toBeUndefined();
  });

  it("sealedArtifactsForGrade returns only that grade", () => {
    for (const grade of GRADES) {
      const set = sealedArtifactsForGrade(grade);
      expect(set.every((a) => a.grade === grade)).toBe(true);
    }
  });

  it("sealedArtifactsForPathway filters by the canon pathway hint", () => {
    // The Fool (id 1) ties to the Antigonus Family Puppet (2-049), among others.
    const foolArtifacts = sealedArtifactsForPathway(1);
    expect(foolArtifacts.length).toBeGreaterThan(0);
    expect(foolArtifacts.every((a) => a.pathwayHint === 1)).toBe(true);
    expect(foolArtifacts.some((a) => a.number === "2-049")).toBe(true);
    // A pathway no catalogue entry hints at yields nothing (never throws).
    expect(sealedArtifactsForPathway(999)).toEqual([]);
  });
});

describe("mintArtifactItem", () => {
  it("produces a self-describing sealed-artifact inventory item", () => {
    const quill = getSealedArtifact("0-08")!;
    const item = mintArtifactItem(quill);
    expect(item.category).toBe("sealed-artifact");
    expect(item.name).toBe("Sealed Artifact 0-08 — Quill of Alzuhod");
    // The drawback and grade ride into the description for the narrator/sheet.
    expect(item.description).toContain("Grade 0");
    expect(item.description).toContain(quill.drawback);
  });

  it("round-trips the code back out of the minted name for every entry", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      const item = mintArtifactItem(artifact);
      expect(sealedArtifactNumberFromItemName(item.name)).toBe(artifact.number);
      expect(gradeForArtifactItem(item)).toBe(artifact.grade);
    }
  });
});

describe("sealedArtifactNumberFromItemName / gradeForArtifactItem", () => {
  it("returns undefined for a name that is not a minted artifact", () => {
    expect(sealedArtifactNumberFromItemName("A rusty key")).toBeUndefined();
  });

  it("gradeForArtifactItem ignores non-artifact categories", () => {
    expect(
      gradeForArtifactItem({ name: "Honey", description: "", category: "mundane" }),
    ).toBeUndefined();
  });

  it("gradeForArtifactItem returns undefined for a sealed item not in the catalogue", () => {
    expect(
      gradeForArtifactItem({
        name: "Sealed Artifact 9-999 — Unknown Relic",
        description: "",
        category: "sealed-artifact",
      }),
    ).toBeUndefined();
  });

  it("gradeForArtifactItem returns undefined for a malformed sealed-artifact name", () => {
    expect(
      gradeForArtifactItem({
        name: "Just an artifact",
        description: "",
        category: "sealed-artifact",
      }),
    ).toBeUndefined();
  });

  it("gradeForArtifactItem reads the grade from a crafted synthetic code", () => {
    for (const grade of GRADES) {
      expect(
        gradeForArtifactItem({
          name: `Sealed Artifact C${grade}-001 — A Player Relic`,
          description: "",
          category: "sealed-artifact",
        }),
      ).toBe(grade);
    }
  });
});

describe("custody classification", () => {
  it("every catalogue entry has an authored custody record", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      const record = getArtifactCustody(artifact.number);
      expect(record).toBeDefined();
      expect(["church", "individual", "unowned"]).toContain(record!.custody);
    }
  });

  it("the authored custody agrees with classifyHolder(holder)", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      const authored = getArtifactCustody(artifact.number)!;
      const derived = classifyHolder(artifact.holder);
      expect(derived.custody).toBe(authored.custody);
      if (authored.custody === "individual") {
        expect(authored.ownerName).toBeDefined();
        expect(derived.ownerName).toBe(authored.ownerName);
      }
    }
  });

  it("classifyHolder maps churches, dynasties, individuals, and the unowned", () => {
    expect(classifyHolder("Church of the Evernight Goddess").custody).toBe("church");
    expect(classifyHolder("Sealed by the Church of the Evernight Goddess").custody).toBe(
      "church",
    );
    expect(classifyHolder("Church of the Fool (Abraham Family)").custody).toBe("church");
    expect(classifyHolder("The Augustus royal line").custody).toBe("church");
    expect(classifyHolder("Held by Isengard Stanton")).toEqual({
      custody: "individual",
      ownerName: "Isengard Stanton",
    });
    expect(classifyHolder("Carried by the Fool, Klein Moretti")).toEqual({
      custody: "individual",
      ownerName: "Klein Moretti",
    });
    expect(classifyHolder(undefined).custody).toBe("unowned");
    expect(classifyHolder("   ").custody).toBe("unowned");
    // An individual holder with no parseable name → individual, no ownerName.
    expect(classifyHolder("Held by")).toEqual({ custody: "individual" });
    // A non-empty holder that is neither a church nor a "by <name>" form.
    expect(classifyHolder("A masterless wandering relic").custody).toBe("unowned");
  });

  it("getArtifactCustody falls back to classifyHolder for an unknown code", () => {
    // An unknown code is not in the authored table and has no catalogue entry.
    expect(getArtifactCustody("9-999")).toBeUndefined();
  });

  it("custodyForArtifactItem resolves catalogue, crafted, and non-artifact items", () => {
    const ring = mintArtifactItem(getSealedArtifact("2-081")!);
    expect(custodyForArtifactItem(ring)).toBe("individual");
    expect(ownerNameForArtifactItem(ring)).toBe("Isengard Stanton");

    const churchRelic = mintArtifactItem(getSealedArtifact("2-049")!);
    expect(custodyForArtifactItem(churchRelic)).toBe("church");
    expect(ownerNameForArtifactItem(churchRelic)).toBeUndefined();

    const crafted = {
      name: "Sealed Artifact C2-007 — A Made Thing",
      description: "",
      category: "sealed-artifact" as const,
    };
    expect(custodyForArtifactItem(crafted)).toBe("individual");
    expect(isCraftedArtifactCode("C2-007")).toBe(true);
    expect(isCraftedArtifactCode("2-049")).toBe(false);

    expect(
      custodyForArtifactItem({ name: "Honey", description: "", category: "mundane" }),
    ).toBeUndefined();
  });

  it("isArtifactTradeable allows non-church custody only", () => {
    expect(isArtifactTradeable(mintArtifactItem(getSealedArtifact("2-081")!))).toBe(true);
    expect(isArtifactTradeable(mintArtifactItem(getSealedArtifact("2-049")!))).toBe(
      false,
    );
    expect(
      isArtifactTradeable({
        name: "Sealed Artifact C0-001 — A Made Thing",
        description: "",
        category: "sealed-artifact",
      }),
    ).toBe(true);
    expect(
      isArtifactTradeable({ name: "Honey", description: "", category: "mundane" }),
    ).toBe(false);
  });
});

describe("artifact effects", () => {
  it("every catalogue entry has at least one well-formed authored effect", () => {
    for (const artifact of SEALED_ARTIFACTS) {
      expect(hasAuthoredEffects(artifact.number)).toBe(true);
      const effects = effectsForArtifactNumber(artifact.number);
      expect(effects.length).toBeGreaterThan(0);
      for (const effect of effects) {
        expect(effect.label.trim().length).toBeGreaterThan(0);
        expect(effect.description.trim().length).toBeGreaterThan(0);
        expect(EFFECT_HOOKS.has(effect.hook)).toBe(true);
      }
    }
  });

  it("effectsForArtifactNumber returns an empty list for an unknown code", () => {
    expect(effectsForArtifactNumber("9-999")).toEqual([]);
    expect(hasAuthoredEffects("9-999")).toBe(false);
  });

  it("the copy-steal canon relics carry an acquired-power effect with a method", () => {
    for (const number of ["2-081", "2-105"]) {
      const effect = effectsForArtifactNumber(number)[0];
      expect(effect.hook).toBe("acquired-power");
      expect(typeof effect.params?.acquisition).toBe("string");
    }
  });
});
