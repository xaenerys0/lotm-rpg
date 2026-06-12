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
    expect(glossaryForSequence(1)).toHaveLength(GLOSSARY_TERMS.length);
  });
});

describe("getGlossaryTerm / sealedTermCount", () => {
  it("looks up by slug and counts the sealed remainder", () => {
    expect(getGlossaryTerm("beyonder")?.term).toBe("Beyonder");
    expect(getGlossaryTerm("nope")).toBeUndefined();
    expect(sealedTermCount(9)).toBe(
      GLOSSARY_TERMS.length - glossaryForSequence(9).length,
    );
    expect(sealedTermCount(1)).toBe(0);
  });
});
