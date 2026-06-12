import { describe, it, expect } from "vitest";
import {
  PROLOGUE_SCENES,
  PATHWAY_JUSTIFICATIONS,
  POTION_HEADINGS,
  FIRST_POTION_NARRATIVE,
  scoreSelections,
  recommendPathway,
  dominantAffinity,
  tallyAffinities,
  rankPathways,
  selectTopCandidates,
  createPrologueState,
  createPrologueMemory,
  createAIPrologueMemory,
} from "./prologue";
import type { PrologueSelection } from "./prologue";

// Helper: build all-Fool selections
function foolSelections(): PrologueSelection[] {
  return PROLOGUE_SCENES.map((scene) => ({
    sceneId: scene.id,
    choiceId: scene.choices.find((c) => c.affinities[1] === 2)!.id,
  }));
}

// Helper: build all-Visionary selections
function visionarySelections(): PrologueSelection[] {
  return PROLOGUE_SCENES.map((scene) => ({
    sceneId: scene.id,
    choiceId: scene.choices.find((c) => c.affinities[2] === 2)!.id,
  }));
}

// Helper: build all-Sun selections
function sunSelections(): PrologueSelection[] {
  return PROLOGUE_SCENES.map((scene) => ({
    sceneId: scene.id,
    choiceId: scene.choices.find((c) => c.affinities[3] === 2)!.id,
  }));
}

// Helper: build all-Death selections
function deathSelections(): PrologueSelection[] {
  return PROLOGUE_SCENES.map((scene) => ({
    sceneId: scene.id,
    choiceId: scene.choices.find((c) => c.affinities[4] === 2)!.id,
  }));
}

// ---------------------------------------------------------------------------
// PROLOGUE_SCENES data integrity
// ---------------------------------------------------------------------------
describe("PROLOGUE_SCENES", () => {
  it("contains exactly 4 scenes", () => {
    expect(PROLOGUE_SCENES).toHaveLength(4);
  });

  it("each scene has exactly 4 choices", () => {
    for (const scene of PROLOGUE_SCENES) {
      expect(scene.choices).toHaveLength(4);
    }
  });

  it("each scene has a unique id", () => {
    const ids = PROLOGUE_SCENES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("each scene has a non-empty title, setting, and narrative", () => {
    for (const scene of PROLOGUE_SCENES) {
      expect(scene.title.length).toBeGreaterThan(0);
      expect(scene.setting.length).toBeGreaterThan(0);
      expect(scene.narrative.length).toBeGreaterThan(0);
    }
  });

  it("each choice has exactly one non-zero affinity", () => {
    for (const scene of PROLOGUE_SCENES) {
      for (const choice of scene.choices) {
        const nonZero = Object.values(choice.affinities).filter((v) => v > 0);
        expect(nonZero).toHaveLength(1);
      }
    }
  });

  it("each pathway (1–4) is represented exactly once per scene", () => {
    for (const scene of PROLOGUE_SCENES) {
      const pathwayIds: number[] = [];
      for (const choice of scene.choices) {
        for (const [id, score] of Object.entries(choice.affinities)) {
          if (score > 0) pathwayIds.push(Number(id));
        }
      }
      expect(pathwayIds.sort()).toEqual([1, 2, 3, 4]);
    }
  });

  it("all choice ids within a scene are unique", () => {
    for (const scene of PROLOGUE_SCENES) {
      const ids = scene.choices.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

// ---------------------------------------------------------------------------
// PATHWAY_JUSTIFICATIONS
// ---------------------------------------------------------------------------
describe("PATHWAY_JUSTIFICATIONS", () => {
  it.each([1, 2, 3, 4])("has a non-empty justification for pathway %i", (id) => {
    expect(typeof PATHWAY_JUSTIFICATIONS[id]).toBe("string");
    expect((PATHWAY_JUSTIFICATIONS[id] as string).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// POTION_HEADINGS
// ---------------------------------------------------------------------------
describe("POTION_HEADINGS", () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])("has a non-empty heading for pathway %i", (id) => {
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
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
    "has a non-empty narrative for pathway %i",
    (id) => {
      expect(typeof FIRST_POTION_NARRATIVE[id]).toBe("string");
      expect((FIRST_POTION_NARRATIVE[id] as string).length).toBeGreaterThan(0);
    },
  );
});

// ---------------------------------------------------------------------------
// scoreSelections
// ---------------------------------------------------------------------------
describe("scoreSelections", () => {
  it("returns exactly 4 scores", () => {
    const scores = scoreSelections([]);
    expect(scores).toHaveLength(4);
  });

  it("all scores are 0 with no selections", () => {
    const scores = scoreSelections([]);
    for (const s of scores) expect(s.score).toBe(0);
  });

  it("returns scores sorted descending", () => {
    const scores = scoreSelections(foolSelections());
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i].score).toBeGreaterThanOrEqual(scores[i + 1].score);
    }
  });

  it("max score for a fully-aligned Fool playthrough is 8", () => {
    const scores = scoreSelections(foolSelections());
    const foolScore = scores.find((s) => s.pathwayId === 1)!;
    expect(foolScore.score).toBe(8);
  });

  it("max score for a fully-aligned Visionary playthrough is 8", () => {
    const scores = scoreSelections(visionarySelections());
    expect(scores.find((s) => s.pathwayId === 2)!.score).toBe(8);
  });

  it("max score for a fully-aligned Sun playthrough is 8", () => {
    const scores = scoreSelections(sunSelections());
    expect(scores.find((s) => s.pathwayId === 3)!.score).toBe(8);
  });

  it("max score for a fully-aligned Death playthrough is 8", () => {
    const scores = scoreSelections(deathSelections());
    expect(scores.find((s) => s.pathwayId === 4)!.score).toBe(8);
  });

  it("other pathways score 0 in a fully-aligned playthrough", () => {
    const scores = scoreSelections(foolSelections());
    for (const s of scores) {
      if (s.pathwayId !== 1) expect(s.score).toBe(0);
    }
  });

  it("splits evenly when alternating between two pathways", () => {
    const selections: PrologueSelection[] = [
      { sceneId: PROLOGUE_SCENES[0].id, choiceId: "s1-fool" },
      { sceneId: PROLOGUE_SCENES[1].id, choiceId: "s2-sun" },
      { sceneId: PROLOGUE_SCENES[2].id, choiceId: "s3-fool" },
      { sceneId: PROLOGUE_SCENES[3].id, choiceId: "s4-sun" },
    ];
    const scores = scoreSelections(selections);
    expect(scores.find((s) => s.pathwayId === 1)!.score).toBe(4);
    expect(scores.find((s) => s.pathwayId === 3)!.score).toBe(4);
    expect(scores.find((s) => s.pathwayId === 2)!.score).toBe(0);
    expect(scores.find((s) => s.pathwayId === 4)!.score).toBe(0);
  });

  it("ignores selections for unknown scene ids", () => {
    const scores = scoreSelections([{ sceneId: "nonexistent", choiceId: "x" }]);
    for (const s of scores) expect(s.score).toBe(0);
  });

  it("ignores selections for unknown choice ids within a valid scene", () => {
    const scores = scoreSelections([
      { sceneId: PROLOGUE_SCENES[0].id, choiceId: "nonexistent-choice" },
    ]);
    for (const s of scores) expect(s.score).toBe(0);
  });

  it("includes all four pathway ids in the result", () => {
    const pathwayIds = scoreSelections([]).map((s) => s.pathwayId);
    expect(pathwayIds).toContain(1);
    expect(pathwayIds).toContain(2);
    expect(pathwayIds).toContain(3);
    expect(pathwayIds).toContain(4);
  });
});

// ---------------------------------------------------------------------------
// recommendPathway
// ---------------------------------------------------------------------------
describe("recommendPathway", () => {
  it("recommends Fool for all-Fool selections", () => {
    expect(recommendPathway(foolSelections()).pathwayId).toBe(1);
  });

  it("recommends Visionary for all-Visionary selections", () => {
    expect(recommendPathway(visionarySelections()).pathwayId).toBe(2);
  });

  it("recommends Sun for all-Sun selections", () => {
    expect(recommendPathway(sunSelections()).pathwayId).toBe(3);
  });

  it("recommends Death for all-Death selections", () => {
    expect(recommendPathway(deathSelections()).pathwayId).toBe(4);
  });

  it("score matches the highest scorer", () => {
    const rec = recommendPathway(foolSelections());
    expect(rec.score).toBe(8);
  });

  it("maxPossible equals scene count times 2", () => {
    const rec = recommendPathway([]);
    expect(rec.maxPossible).toBe(PROLOGUE_SCENES.length * 2);
  });

  it("includes a non-empty justification", () => {
    const rec = recommendPathway(foolSelections());
    expect(rec.justification.length).toBeGreaterThan(0);
  });

  it("does not default to Seer/pathway 1 with no selections — returns no pathway (de-biased)", () => {
    const rec = recommendPathway([]);
    expect(rec.pathwayId).toBe(0);
    expect(rec.score).toBe(0);
    expect(rec.justification).toBe("");
  });
});

// ---------------------------------------------------------------------------
// dominantAffinity / tallyAffinities / rankPathways / selectTopCandidates
// Generic, deterministic decision logic (issue #53). These never assume "4".
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

  it("works for ids well beyond 4 (scalable)", () => {
    expect(dominantAffinity({ 17: 3, 22: 9 })).toBe(22);
  });
});

describe("tallyAffinities", () => {
  it("sums weights per pathway across maps", () => {
    const tally = tallyAffinities([{ 1: 2 }, { 1: 1, 3: 4 }, { 3: 1 }]);
    expect(tally).toEqual({ 1: 3, 3: 5 });
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
});

// ---------------------------------------------------------------------------
// createPrologueState
// ---------------------------------------------------------------------------
describe("createPrologueState", () => {
  it("starts at scene 0", () => {
    expect(createPrologueState().currentScene).toBe(0);
  });

  it("starts with no selections", () => {
    expect(createPrologueState().selections).toHaveLength(0);
  });

  it("starts as incomplete", () => {
    expect(createPrologueState().isComplete).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createPrologueMemory
// ---------------------------------------------------------------------------
describe("createPrologueMemory", () => {
  it("stores character name in sessionFacts", () => {
    const memory = createPrologueMemory([], "Klein Moretti", "");
    expect(memory.sessionFacts.some((f) => f.description.includes("Klein Moretti"))).toBe(
      true,
    );
  });

  it("stores background in sessionFacts when provided", () => {
    const memory = createPrologueMemory([], "Klein", "A postal worker in Tingen City.");
    expect(memory.sessionFacts.some((f) => f.description.includes("postal worker"))).toBe(
      true,
    );
  });

  it("omits background clause when background is empty", () => {
    const memory = createPrologueMemory([], "Klein", "");
    const nameFact = memory.sessionFacts.find((f) => f.description.includes("Klein"));
    expect(nameFact?.description).not.toContain("Background:");
  });

  it("stores one fact per prologue selection plus a completion fact when selections are non-empty", () => {
    const twoSelections: PrologueSelection[] = [
      { sceneId: PROLOGUE_SCENES[0].id, choiceId: PROLOGUE_SCENES[0].choices[0].id },
      { sceneId: PROLOGUE_SCENES[1].id, choiceId: PROLOGUE_SCENES[1].choices[0].id },
    ];
    const base = createPrologueMemory([], "Test", "");
    const withSelections = createPrologueMemory(twoSelections, "Test", "");
    // base has 1 fact (char created); with 2 selections: +1 completion fact +2 selection facts = +3
    expect(withSelections.sessionFacts.length).toBe(base.sessionFacts.length + 3);
  });

  it("all facts have turnNumber 0", () => {
    const memory = createPrologueMemory(foolSelections(), "Test", "");
    for (const fact of memory.sessionFacts) {
      expect(fact.turnNumber).toBe(0);
    }
  });

  it("all facts have type 'event'", () => {
    const memory = createPrologueMemory(foolSelections(), "Test", "");
    for (const fact of memory.sessionFacts) {
      expect(fact.type).toBe("event");
    }
  });

  it("immediate turns and recent summaries are empty", () => {
    const memory = createPrologueMemory([], "Test", "");
    expect(memory.immediateTurns).toHaveLength(0);
    expect(memory.recentSummaries).toHaveLength(0);
  });

  it("selection fact includes the scene title", () => {
    const selections: PrologueSelection[] = [
      { sceneId: PROLOGUE_SCENES[0].id, choiceId: PROLOGUE_SCENES[0].choices[0].id },
    ];
    const memory = createPrologueMemory(selections, "Test", "");
    const selFact = memory.sessionFacts.find((f) =>
      f.description.includes(PROLOGUE_SCENES[0].title),
    );
    expect(selFact).toBeDefined();
  });

  it("selection fact for unknown scene id uses scene id as fallback", () => {
    const selections: PrologueSelection[] = [
      { sceneId: "unknown-scene", choiceId: "unknown-choice" },
    ];
    const memory = createPrologueMemory(selections, "Test", "");
    const selFact = memory.sessionFacts.find((f) =>
      f.description.includes("unknown-scene"),
    );
    expect(selFact).toBeDefined();
  });

  it("skip-prologue path (empty selections) omits the prologue completion fact", () => {
    const memory = createPrologueMemory([], "Klein", "");
    const hasCompletionFact = memory.sessionFacts.some((f) =>
      f.description.includes("defining moments"),
    );
    expect(hasCompletionFact).toBe(false);
  });

  it("non-empty selections includes the prologue completion fact", () => {
    const memory = createPrologueMemory(foolSelections(), "Klein", "");
    const completionFact = memory.sessionFacts.find((f) =>
      f.description.includes("defining moments"),
    );
    expect(completionFact).toBeDefined();
    expect(completionFact?.description).toContain(`${PROLOGUE_SCENES.length}`);
  });

  it("appends to existing sessionFacts from createMemoryState rather than overwriting", () => {
    const memory = createPrologueMemory([], "Test", "");
    expect(memory.sessionFacts.length).toBeGreaterThanOrEqual(1);
  });
});

// createAIPrologueMemory
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
