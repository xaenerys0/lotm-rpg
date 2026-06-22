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
    // The Acting Method is deliberately NOT here — it is secret knowledge gated on
    // discovery (issue #95), covered by its own suite below.
    const visible = glossaryForSequence(9).map((t) => t.slug);
    for (const slug of ["beyonder", "sequence", "pathway", "potion"]) {
      expect(visible).toContain(slug);
    }
  });

  it("covers every category", () => {
    const used = new Set(GLOSSARY_TERMS.map((t) => t.category));
    for (const category of GLOSSARY_CATEGORIES) {
      expect(used.has(category)).toBe(true);
    }
  });

  it("adds the wider Loen Kingdom terms (issue #134)", () => {
    // Constant City + Midseashire geography and the Relic Foundation org are
    // ungated Fifth-Epoch knowledge (no capability flag) — a mainland character
    // sees them from the first night.
    const fifth = glossaryForSequence(8, 5).map((t) => t.slug);
    expect(fifth).toContain("constant-city");
    expect(fifth).toContain("midseashire");
    expect(fifth).toContain("loen-relic-foundation");
    for (const slug of ["constant-city", "midseashire", "loen-relic-foundation"]) {
      expect(getGlossaryTerm(slug)?.requiresFlag).toBeUndefined();
      expect(getGlossaryTerm(slug)?.epoch).toBe(5);
    }
  });

  it("adds the Intis Republic terms (issue #135)", () => {
    // Intis Republic geography + the Eternal Blazing Sun / Aurora Order orgs are
    // ungated Fifth-Epoch knowledge; the Aurora Order's public face (a terror
    // cult) unlocks for a practitioner (Seq 7), its deep truth staying in the
    // narrator-only org lore.
    const fifth = glossaryForSequence(7, 5).map((t) => t.slug);
    expect(fifth).toContain("intis-republic");
    expect(fifth).toContain("eternal-blazing-sun");
    expect(fifth).toContain("aurora-order");
    for (const slug of ["intis-republic", "eternal-blazing-sun", "aurora-order"]) {
      expect(getGlossaryTerm(slug)?.requiresFlag).toBeUndefined();
      expect(getGlossaryTerm(slug)?.epoch).toBe(5);
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

  it("reveals the Sealed Artifact grade ladder to a practitioner (Seq 6), not a novice", () => {
    expect(getGlossaryTerm("sealed-artifact-grades")?.revealAtSequence).toBe(6);
    expect(glossaryForSequence(9).map((t) => t.slug)).not.toContain(
      "sealed-artifact-grades",
    );
    const atSix = glossaryForSequence(6).map((t) => t.slug);
    expect(atSix).toContain("sealed-artifact-grades");
    // It is universal world-building, not epoch-gated.
    expect(getGlossaryTerm("sealed-artifact-grades")?.epoch).toBeUndefined();
  });

  it("unlocks monotonically as the player advances", () => {
    let previous = 0;
    for (let level = 9; level >= 1; level--) {
      const count = glossaryForSequence(level).length;
      expect(count).toBeGreaterThanOrEqual(previous);
      previous = count;
    }
    // At Sequence 1 every epoch-applicable, ungated term is unlocked. With no
    // epoch given the lexicon defaults to the Fifth (other-epoch terms never
    // appear), and with no flags held the capability-gated Forsaken terms don't.
    const fifthUngated = GLOSSARY_TERMS.filter(
      (t) =>
        (t.epoch === undefined || t.epoch === 5) &&
        t.requiresFlag === undefined &&
        !t.requiresActingMethod,
    );
    expect(glossaryForSequence(1)).toHaveLength(fifthUngated.length);
  });
});

describe("capability gate (issue #132)", () => {
  const FORSAKEN_SLUGS = [
    "city-of-silver",
    "giant-kings-court-term",
    "sea-of-ruins",
    "silver-knights",
    "dream-world-passage",
    "moon-city",
    "the-gray-fog",
  ];
  const ALL_FORSAKEN_FLAGS = [
    "dream-world-passage",
    "silver-city-passage",
    "moon-city-passage",
  ] as const;

  it("hides the Forsaken Land's terms from a character without any passage", () => {
    const central = glossaryForSequence(9, 5).map((t) => t.slug);
    for (const slug of FORSAKEN_SLUGS) {
      expect(central).not.toContain(slug);
    }
  });

  it("reveals all Forsaken terms only to a holder of every Forsaken flag", () => {
    // At Sequence 5 every Forsaken term has been reached (the gray fog reveals at 5).
    const forsaken = glossaryForSequence(5, 5, [...ALL_FORSAKEN_FLAGS]).map(
      (t) => t.slug,
    );
    for (const slug of FORSAKEN_SLUGS) {
      expect(forsaken).toContain(slug);
    }
  });

  it("gates the per-city terms by their own flag (Silver vs Moon unaware, issue #133)", () => {
    // A Silver native (dream + silver flags, no moon) sees Silver's terms and the
    // shared Court/Sea terms — but NEVER Moon City's.
    const silver = glossaryForSequence(9, 5, [
      "dream-world-passage",
      "silver-city-passage",
    ]).map((t) => t.slug);
    expect(silver).toContain("city-of-silver");
    expect(silver).toContain("silver-knights");
    expect(silver).toContain("giant-kings-court-term");
    expect(silver).not.toContain("moon-city");
    expect(silver).not.toContain("the-gray-fog");
    // A Moon native (dream + moon) sees Moon's terms but never the City of Silver's.
    const moon = glossaryForSequence(9, 5, [
      "dream-world-passage",
      "moon-city-passage",
    ]).map((t) => t.slug);
    expect(moon).toContain("moon-city");
    expect(moon).not.toContain("city-of-silver");
    expect(moon).not.toContain("silver-knights");
  });

  it("never leaks the Forsaken terms' existence through the sealed count", () => {
    // The sealed count for a flagless character is computed only over terms it
    // could ever reach, so the gated Forsaken entries are invisible to it.
    const flagless = GLOSSARY_TERMS.filter(
      (t) =>
        (t.epoch === undefined || t.epoch === 5) &&
        t.requiresFlag === undefined &&
        !t.requiresActingMethod,
    );
    expect(sealedTermCount(9)).toBe(flagless.length - glossaryForSequence(9).length);
    // Holding the flag widens the applicable universe, so the count can change.
    const withFlag = GLOSSARY_TERMS.filter(
      (t) =>
        (t.epoch === undefined || t.epoch === 5) &&
        (t.requiresFlag === undefined || t.requiresFlag === "dream-world-passage") &&
        !t.requiresActingMethod,
    );
    expect(sealedTermCount(9, 5, ["dream-world-passage"])).toBe(
      withFlag.length - glossaryForSequence(9, 5, ["dream-world-passage"]).length,
    );
  });
});

describe("acting-method discovery gate (issue #95)", () => {
  it("tags the Acting Method term as discovery-gated", () => {
    expect(getGlossaryTerm("acting-method")?.requiresActingMethod).toBe(true);
  });

  it("hides the term until the method is discovered", () => {
    // Undiscovered (the default and explicit false) — the secret stays sealed.
    expect(glossaryForSequence(9).map((t) => t.slug)).not.toContain("acting-method");
    expect(glossaryForSequence(9, 5, [], false).map((t) => t.slug)).not.toContain(
      "acting-method",
    );
    // Discovered — it joins the first-night basics.
    expect(glossaryForSequence(9, 5, [], true).map((t) => t.slug)).toContain(
      "acting-method",
    );
  });

  it("never leaks the term's existence through the sealed count before discovery", () => {
    // The term is left out of the sealed universe entirely until discovered, so
    // the count is identical with the method known or not — no +1 hint.
    expect(sealedTermCount(9, 5, [], false)).toBe(sealedTermCount(9, 5, [], true));
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
      (t) => (t.epoch === undefined || t.epoch === 1) && !t.requiresActingMethod,
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
      (t) =>
        (t.epoch === undefined || t.epoch === 5) &&
        t.requiresFlag === undefined &&
        !t.requiresActingMethod,
    );
    expect(sealedTermCount(9)).toBe(
      fifthApplicable.length - glossaryForSequence(9).length,
    );
    expect(sealedTermCount(1)).toBe(0);
  });
});
