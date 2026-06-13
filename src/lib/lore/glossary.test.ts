import { describe, expect, it } from "vitest";

import {
  getGlossaryTerm,
  glossaryForSequence,
  GLOSSARY_CATEGORIES,
  GLOSSARY_TERMS,
  sealedTermCount,
} from "./glossary";

describe("GLOSSARY_TERMS", () => {
  it("has unique slugs, valid categories, and sane thresholds", () => {
    const slugs = GLOSSARY_TERMS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const term of GLOSSARY_TERMS) {
      expect(GLOSSARY_CATEGORIES).toContain(term.category);
      expect(term.revealAtSequence).toBeGreaterThanOrEqual(1);
      expect(term.revealAtSequence).toBeLessThanOrEqual(9);
      expect(term.definition.length).toBeGreaterThan(40);
    }
  });

  it("covers the core newcomer concepts from the start", () => {
    const visible = glossaryForSequence(9).map((t) => t.slug);
    for (const slug of ["beyonder", "sequence", "pathway", "potion", "acting-method"]) {
      expect(visible).toContain(slug);
    }
  });

  it("covers every category", () => {
    const used = new Set(GLOSSARY_TERMS.map((t) => t.category));
    for (const category of GLOSSARY_CATEGORIES) {
      expect(used.has(category)).toBe(true);
    }
  });
});

describe("glossaryForSequence (progressive disclosure)", () => {
  it("keeps deep concepts sealed until the player approaches them", () => {
    const atNine = glossaryForSequence(9).map((t) => t.slug);
    expect(atNine).not.toContain("sefirah");
    expect(atNine).not.toContain("demigod");

    const atFive = glossaryForSequence(5).map((t) => t.slug);
    expect(atFive).toContain("demigod");
    expect(atFive).not.toContain("sefirah");

    const atFour = glossaryForSequence(4).map((t) => t.slug);
    expect(atFour).toContain("sefirah");
  });

  it("unlocks monotonically as the player advances", () => {
    let previous = 0;
    for (let level = 9; level >= 1; level--) {
      const count = glossaryForSequence(level).length;
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
    // At Sequence 1 every epoch-applicable term is unlocked. With no epoch given,
    // the lexicon defaults to the Fifth, so other-epoch terms never appear.
    const fifthApplicable = GLOSSARY_TERMS.filter(
      (t) => t.epoch === undefined || t.epoch === 5,
    );
    expect(glossaryForSequence(1)).toHaveLength(fifthApplicable.length);
  });
});

describe("epoch isolation (issue: character epoch isolation)", () => {
  it("shows universal mechanics but hides Fifth-Epoch terms from earlier epochs", () => {
    const firstEpoch = glossaryForSequence(9, 1).map((t) => t.slug);
    // Universal Beyonder mechanics are shared across every era.
    expect(firstEpoch).toContain("beyonder");
    expect(firstEpoch).toContain("sequence");
    // The First Epoch's own terms appear...
    expect(firstEpoch).toContain("age-of-chaos");
    expect(firstEpoch).toContain("original-creator");
    // ...but the Fifth-Epoch nations and churches do not.
    expect(firstEpoch).not.toContain("tingen");
    expect(firstEpoch).not.toContain("loen-kingdom");
    expect(firstEpoch).not.toContain("nighthawks");
    // ...nor do other non-Fifth epochs' terms.
    expect(firstEpoch).not.toContain("solomon-empire");
  });

  it("gives each non-Fifth epoch its own era terms", () => {
    expect(glossaryForSequence(9, 2).map((t) => t.slug)).toContain("ancient-gods");
    expect(glossaryForSequence(9, 3).map((t) => t.slug)).toContain("ancient-sun-god");
    expect(glossaryForSequence(9, 4).map((t) => t.slug)).toContain("solomon-empire");
  });

  it("does not leak other-epoch terms through the sealed count", () => {
    // A First-Epoch newcomer's sealed count is computed only over First-Epoch-
    // applicable terms — never hinting that Fifth-Epoch entries exist.
    const applicable = GLOSSARY_TERMS.filter(
      (t) => t.epoch === undefined || t.epoch === 1,
    );
    expect(sealedTermCount(9, 1)).toBe(
      applicable.length - glossaryForSequence(9, 1).length,
    );
    expect(sealedTermCount(1, 1)).toBe(0);
  });
});

describe("getGlossaryTerm / sealedTermCount", () => {
  it("looks up by slug and counts the sealed remainder", () => {
    expect(getGlossaryTerm("beyonder")?.term).toBe("Beyonder");
    expect(getGlossaryTerm("nope")).toBeUndefined();
    const fifthApplicable = GLOSSARY_TERMS.filter(
      (t) => t.epoch === undefined || t.epoch === 5,
    );
    expect(sealedTermCount(9)).toBe(
      fifthApplicable.length - glossaryForSequence(9).length,
    );
    expect(sealedTermCount(1)).toBe(0);
  });
});
