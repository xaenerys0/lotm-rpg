import { describe, it, expect } from "vitest";
import {
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  PATHWAY_DESCRIPTIONS,
  dominantAffinity,
  tallyAffinities,
  rankPathways,
  selectTopCandidates,
  createPrologueMemory,
  createAIPrologueMemory,
  buildPrologueRecap,
  RECAP_FINALE_CHAR_CAP,
} from "./prologue";

// ---------------------------------------------------------------------------
// POTION_HEADINGS
// ---------------------------------------------------------------------------
// All 22 pathways are playable (issue #120) — each needs becoming-scene content.
const ALL_PATHWAY_IDS = Array.from({ length: 22 }, (_, i) => i + 1);

describe("POTION_HEADINGS", () => {
  it.each(ALL_PATHWAY_IDS)("has a non-empty heading for pathway %i", (id) => {
    expect(typeof POTION_HEADINGS[id]).toBe("string");
    expect((POTION_HEADINGS[id] as string).length).toBeGreaterThan(0);
  });

  it("has an entry for every pathway that has a narrative", () => {
    for (const id of Object.keys(FIRST_POTION_NARRATIVE).map(Number)) {
      expect(POTION_HEADINGS[id]).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// FIRST_POTION_NARRATIVE
// ---------------------------------------------------------------------------
describe("FIRST_POTION_NARRATIVE", () => {
  it.each(ALL_PATHWAY_IDS)("has a non-empty narrative for pathway %i", (id) => {
    expect(typeof FIRST_POTION_NARRATIVE[id]).toBe("string");
    expect((FIRST_POTION_NARRATIVE[id] as string).length).toBeGreaterThan(0);
  });

  it("covers every playable pathway (1–22) that the prologue/manual path can lead to", () => {
    for (const id of ALL_PATHWAY_IDS) {
      expect((FIRST_POTION_NARRATIVE[id] as string)?.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// PATHWAY_DESCRIPTIONS (issue #120) — manual-card blurb, all 22 pathways
// ---------------------------------------------------------------------------
describe("PATHWAY_DESCRIPTIONS", () => {
  it.each(ALL_PATHWAY_IDS)("has a non-empty description for pathway %i", (id) => {
    expect(typeof PATHWAY_DESCRIPTIONS[id]).toBe("string");
    expect((PATHWAY_DESCRIPTIONS[id] as string).length).toBeGreaterThan(0);
  });

  it("has exactly the 22 playable pathway ids (no fallback needed)", () => {
    expect(
      Object.keys(PATHWAY_DESCRIPTIONS)
        .map(Number)
        .sort((a, b) => a - b),
    ).toEqual(ALL_PATHWAY_IDS);
  });
});

// ---------------------------------------------------------------------------
// dominantAffinity / tallyAffinities / rankPathways / selectTopCandidates
// Generic, deterministic decision logic (issues #53, #119). Never assumes a
// fixed pathway count.
// ---------------------------------------------------------------------------
describe("dominantAffinity", () => {
  it("returns the highest-weighted pathway id", () => {
    expect(dominantAffinity({ 1: 1, 3: 5, 4: 2 })).toBe(3);
  });

  it("breaks ties toward the lowest id", () => {
    expect(dominantAffinity({ 7: 2, 2: 2, 5: 2 })).toBe(2);
  });

  it("returns 0 for an empty map", () => {
    expect(dominantAffinity({})).toBe(0);
  });

  it("works for ids well beyond the playable set (scalable)", () => {
    expect(dominantAffinity({ 17: 3, 22: 9 })).toBe(22);
  });
});

describe("tallyAffinities", () => {
  it("sums weights per pathway across maps", () => {
    const tally = tallyAffinities([{ 1: 2 }, { 1: 1, 3: 4 }, { 3: 1 }]);
    expect(tally).toEqual({ 1: 3, 3: 5 });
  });

  it("accumulates blended within-region leans into the dominant region", () => {
    // A run of Eternal Darkness leans (Death 4 / Darkness 5) lands the player in
    // that region; the finale then disambiguates which of the two.
    const tally = tallyAffinities([{ 4: 2, 5: 1 }, { 5: 2, 4: 1 }, { 4: 2 }]);
    expect(tally).toEqual({ 4: 5, 5: 3 });
  });

  it("returns an empty tally (all zero) for no maps", () => {
    expect(tallyAffinities([])).toEqual({});
  });

  it("is generic over arbitrary pathway ids", () => {
    const tally = tallyAffinities([{ 19: 1 }, { 19: 2 }, { 5: 1 }]);
    expect(tally).toEqual({ 19: 3, 5: 1 });
  });
});

describe("rankPathways", () => {
  it("sorts descending by score", () => {
    const ranked = rankPathways({ 1: 1, 2: 5, 3: 3 });
    expect(ranked.map((p) => p.pathwayId)).toEqual([2, 3, 1]);
  });

  it("breaks score ties by ascending pathway id", () => {
    const ranked = rankPathways({ 4: 2, 1: 2, 3: 2 });
    expect(ranked.map((p) => p.pathwayId)).toEqual([1, 3, 4]);
  });

  it("returns an empty array for an empty tally", () => {
    expect(rankPathways({})).toEqual([]);
  });
});

describe("selectTopCandidates", () => {
  it("returns the top `count` for a clear ranking", () => {
    const ids = selectTopCandidates({ 1: 10, 2: 8, 3: 6, 4: 1 });
    expect(ids).toEqual([1, 2, 3]);
  });

  it("ignores lower scorers beyond the cutoff", () => {
    const ids = selectTopCandidates({ 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 });
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
  });

  it("includes all ties at the cutoff score", () => {
    // count=3, but three pathways tie at the cutoff score of 5.
    const ids = selectTopCandidates({ 1: 10, 2: 5, 3: 5, 4: 5 });
    expect(new Set(ids)).toEqual(new Set([1, 2, 3, 4]));
  });

  it("guarantees the `min` floor by filling from the ranked list", () => {
    // A single dominant scorer plus weaker ones — min=2 fills the second slot.
    const ids = selectTopCandidates({ 1: 100, 2: 1 }, { count: 1, min: 2 });
    expect(ids).toEqual([1, 2]);
  });

  it("returns an empty list for an empty tally", () => {
    expect(selectTopCandidates({})).toEqual([]);
  });

  it("scales to more than four pathways (proves generality)", () => {
    const tally = { 12: 9, 7: 8, 19: 7, 3: 6, 22: 1 };
    const ids = selectTopCandidates(tally);
    expect(ids).toEqual([12, 7, 19]);
  });

  it("surfaces a neighborhood of playable pathways for a typical mixed run", () => {
    // Mostly God-Almighty leans with one Mysteries pick — the candidate set
    // ranges across the playable ids the player gravitated toward.
    const tally = tallyAffinities([
      { 3: 2 },
      { 2: 2, 3: 1 },
      { 6: 2 },
      { 3: 2 },
      { 1: 2 },
    ]);
    const ids = selectTopCandidates(tally);
    expect(ids[0]).toBe(3); // the dominant lean wins the finale slate
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// createPrologueMemory (manual path — no AI prologue)
// ---------------------------------------------------------------------------
describe("createPrologueMemory", () => {
  it("stores character name in sessionFacts", () => {
    const memory = createPrologueMemory("Klein Moretti", "");
    expect(memory.sessionFacts.some((f) => f.description.includes("Klein Moretti"))).toBe(
      true,
    );
  });

  it("stores background in sessionFacts when provided", () => {
    const memory = createPrologueMemory("Klein", "A postal worker in Tingen City.");
    expect(memory.sessionFacts.some((f) => f.description.includes("postal worker"))).toBe(
      true,
    );
  });

  it("omits background clause when background is empty", () => {
    const memory = createPrologueMemory("Klein", "");
    const nameFact = memory.sessionFacts.find((f) => f.description.includes("Klein"));
    expect(nameFact?.description).not.toContain("Background:");
  });

  it("records exactly one character-created fact (no prologue scenes on the manual path)", () => {
    const memory = createPrologueMemory("Test", "");
    expect(memory.sessionFacts).toHaveLength(1);
    expect(memory.sessionFacts[0]!.description).toContain("Character created");
  });

  it("the fact has turnNumber 0 and type 'event'", () => {
    const memory = createPrologueMemory("Test", "");
    expect(memory.sessionFacts[0]!.turnNumber).toBe(0);
    expect(memory.sessionFacts[0]!.type).toBe("event");
  });

  it("immediate turns and recent summaries are empty", () => {
    const memory = createPrologueMemory("Test", "");
    expect(memory.immediateTurns).toHaveLength(0);
    expect(memory.recentSummaries).toHaveLength(0);
  });

  it("does not record a prologue completion fact", () => {
    const memory = createPrologueMemory("Klein", "");
    const hasCompletionFact = memory.sessionFacts.some((f) =>
      f.description.includes("prologue"),
    );
    expect(hasCompletionFact).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createAIPrologueMemory
// ---------------------------------------------------------------------------
describe("createAIPrologueMemory", () => {
  it("includes character creation fact with name and background", () => {
    const memory = createAIPrologueMemory([], "Klein", "A former soldier");
    const fact = memory.sessionFacts.find((f) => f.description.includes("Klein"));
    expect(fact).toBeDefined();
    expect(fact?.description).toContain("A former soldier");
  });

  it("includes character fact with name only when no background", () => {
    const memory = createAIPrologueMemory([], "Audrey", "");
    const fact = memory.sessionFacts.find((f) => f.description.includes("Audrey"));
    expect(fact).toBeDefined();
    expect(fact?.description).not.toContain("Background:");
  });

  it("empty choices produces no completion or scene facts", () => {
    const memory = createAIPrologueMemory([], "Klein", "");
    const completionFact = memory.sessionFacts.find((f) =>
      f.description.includes("prologue"),
    );
    expect(completionFact).toBeUndefined();
  });

  it("non-empty choices includes completion fact with scene count", () => {
    const choices = ["Investigated the noise", "Stayed silent", "Left the room"];
    const memory = createAIPrologueMemory(choices, "Klein", "");
    const completionFact = memory.sessionFacts.find((f) =>
      f.description.includes("3 scenes"),
    );
    expect(completionFact).toBeDefined();
  });

  it("records each choice text as a scene fact", () => {
    const choices = ["Investigated the noise", "Stayed silent"];
    const memory = createAIPrologueMemory(choices, "Klein", "");
    expect(
      memory.sessionFacts.some((f) => f.description.includes("Investigated the noise")),
    ).toBe(true);
    expect(memory.sessionFacts.some((f) => f.description.includes("Stayed silent"))).toBe(
      true,
    );
  });

  it("all facts have turnNumber 0", () => {
    const memory = createAIPrologueMemory(["Chose path A"], "Klein", "");
    expect(memory.sessionFacts.every((f) => f.turnNumber === 0)).toBe(true);
  });
});

// buildPrologueRecap
describe("buildPrologueRecap", () => {
  it("returns empty string when there is nothing to recap", () => {
    expect(buildPrologueRecap({ choices: [] })).toBe("");
    expect(
      buildPrologueRecap({
        choices: ["  ", ""],
        finaleNarrative: "  ",
        chosenPotion: "",
      }),
    ).toBe("");
  });

  it("lists the defining choices in order", () => {
    const recap = buildPrologueRecap({
      choices: ["Followed the thief", "Confronted the stranger"],
    });
    expect(recap).toContain("defining moments");
    expect(recap).toContain("- Followed the thief");
    expect(recap).toContain("- Confronted the stranger");
    // earliest first — preserves the order the player chose them
    expect(recap.indexOf("Followed the thief")).toBeLessThan(
      recap.indexOf("Confronted the stranger"),
    );
  });

  it("drops blank choices and trims whitespace", () => {
    const recap = buildPrologueRecap({ choices: ["  Took the book  ", "", "   "] });
    expect(recap).toContain("- Took the book");
    expect(recap).not.toContain("- \n");
  });

  it("includes the finale narrative", () => {
    const recap = buildPrologueRecap({
      choices: [],
      finaleNarrative: "A stranger in a grey coat offered a tray of vials.",
    });
    expect(recap).toContain("The encounter that changed everything:");
    expect(recap).toContain("grey coat");
  });

  it("caps an over-long finale narrative", () => {
    const long = "x".repeat(RECAP_FINALE_CHAR_CAP + 200);
    const recap = buildPrologueRecap({ choices: [], finaleNarrative: long });
    expect(recap).toContain("…");
    expect(recap.length).toBeLessThan(long.length + 100);
  });

  it("does not cap a finale narrative within the limit", () => {
    const recap = buildPrologueRecap({
      choices: [],
      finaleNarrative: "Short and sweet.",
    });
    expect(recap).toContain("Short and sweet.");
    expect(recap).not.toContain("…");
  });

  it("records the potion the character drank", () => {
    const recap = buildPrologueRecap({
      choices: [],
      chosenPotion: "the vial that smelled of cold rain",
    });
    expect(recap).toContain("They drank: the vial that smelled of cold rain");
    expect(recap).toContain("not knowing what it was");
  });

  it("combines all three parts into one recap", () => {
    const recap = buildPrologueRecap({
      choices: ["Helped the widow"],
      finaleNarrative: "The vials glimmered.",
      chosenPotion: "the amber one",
    });
    expect(recap).toContain("- Helped the widow");
    expect(recap).toContain("The vials glimmered.");
    expect(recap).toContain("the amber one");
  });
});
