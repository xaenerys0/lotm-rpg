import { describe, it, expect } from "vitest";
import type { GameState } from "@/lib/ai";
import type { Item } from "@/lib/types/rules";
import type {
  CombatEncounter,
  CombatPreparationInput,
  Enemy,
  Injury,
} from "@/lib/types/combat";
import {
  AMBUSH_PREP_CAP,
  VICTORY_THRESHOLD,
  DEFEAT_THRESHOLD,
  DECISION_POINT_COUNT,
  INJURY_RECOVERY_TURNS,
  INJURY_PENALTY_CAP,
  emptyPreparation,
  scorePreparation,
  computeSequenceGap,
  computePathwayMatchup,
  computeInjuryPenalty,
  computeBaseAdvantage,
  generateDecisionPoints,
  deriveEncounterEnemy,
  createEncounter,
  applyPreparation,
  chooseOption,
  isExchangeComplete,
  resolveOutcome,
  computeConsequences,
  resolveEncounter,
  applyCombatResult,
  tickInjuries,
  isValidEncounterShape,
} from "./combat";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeItem(name: string): Item {
  return {
    name,
    description: `${name} description`,
    category: "supplementary-ingredient",
  };
}

function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    name: "Wraith",
    sequenceLevel: 7,
    isBeyonder: false,
    ...overrides,
  };
}

function makePrep(
  overrides: Partial<CombatPreparationInput> = {},
): CombatPreparationInput {
  return {
    intelligence: "none",
    ritualMaterials: [],
    sealedArtifacts: [],
    readiedAbilities: [],
    terrain: "none",
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    characterId: "char-1",
    pathwayId: 1,
    sequenceLevel: 9,
    sanity: 100,
    maxSanity: 100,
    inventory: [],
    location: "Tingen City",
    activeQuests: [],
    npcsPresent: [],
    ...overrides,
  };
}

// ─── Preparation Scoring ─────────────────────────────────────────────

describe("scorePreparation", () => {
  it("scores an empty preparation as poor", () => {
    const quality = scorePreparation(emptyPreparation(), false);
    expect(quality.score).toBe(0);
    expect(quality.tier).toBe("poor");
  });

  it("caps a fully-stacked preparation at 1.0 and rates it thorough", () => {
    const quality = scorePreparation(
      makePrep({
        intelligence: "thorough",
        ritualMaterials: [makeItem("a"), makeItem("b"), makeItem("c"), makeItem("d")],
        sealedArtifacts: [makeItem("x"), makeItem("y"), makeItem("z")],
        readiedAbilities: ["one", "two", "three", "four"],
        terrain: "favorable",
      }),
      false,
    );
    expect(quality.score).toBe(1);
    expect(quality.tier).toBe("thorough");
  });

  it("caps each dimension independently", () => {
    const quality = scorePreparation(
      makePrep({
        ritualMaterials: [makeItem("a"), makeItem("b"), makeItem("c"), makeItem("d")],
      }),
      false,
    );
    // 4 materials × 0.07 = 0.28, capped at 0.21.
    expect(quality.breakdown.ritualMaterials).toBeCloseTo(0.21, 5);
  });

  it("rates a modest preparation between thresholds", () => {
    const quality = scorePreparation(
      makePrep({
        intelligence: "partial",
        ritualMaterials: [makeItem("a"), makeItem("b")],
      }),
      false,
    );
    // 0.15 + 0.14 = 0.29 → modest.
    expect(quality.score).toBeCloseTo(0.29, 5);
    expect(quality.tier).toBe("modest");
  });

  it("rates a solid preparation", () => {
    const quality = scorePreparation(
      makePrep({
        intelligence: "thorough",
        ritualMaterials: [makeItem("a"), makeItem("b")],
        sealedArtifacts: [makeItem("x")],
        readiedAbilities: ["one", "two"],
      }),
      false,
    );
    // 0.3 + 0.14 + 0.1 + 0.1 = 0.64 → solid.
    expect(quality.score).toBeCloseTo(0.64, 5);
    expect(quality.tier).toBe("solid");
  });

  it("caps preparation score under ambush", () => {
    const quality = scorePreparation(
      makePrep({ intelligence: "thorough", terrain: "favorable" }),
      true,
    );
    expect(quality.score).toBe(AMBUSH_PREP_CAP);
    expect(quality.tier).toBe("poor");
  });

  it("breaks down each dimension", () => {
    const quality = scorePreparation(
      makePrep({
        intelligence: "partial",
        sealedArtifacts: [makeItem("x")],
        readiedAbilities: ["one"],
        terrain: "neutral",
      }),
      false,
    );
    expect(quality.breakdown.intelligence).toBeCloseTo(0.15, 5);
    expect(quality.breakdown.sealedArtifacts).toBeCloseTo(0.1, 5);
    expect(quality.breakdown.readiedAbilities).toBeCloseTo(0.05, 5);
    expect(quality.breakdown.terrain).toBeCloseTo(0.05, 5);
  });
});

describe("emptyPreparation", () => {
  it("produces a no-preparation input", () => {
    expect(emptyPreparation()).toEqual({
      intelligence: "none",
      ritualMaterials: [],
      sealedArtifacts: [],
      readiedAbilities: [],
      terrain: "none",
    });
  });
});

// ─── Sequence Gap & Matchup ──────────────────────────────────────────

describe("computeSequenceGap", () => {
  it("is positive when the enemy is the weaker (higher) sequence", () => {
    expect(computeSequenceGap(5, 9)).toBe(4);
  });
  it("is negative when the enemy is the stronger (lower) sequence", () => {
    expect(computeSequenceGap(9, 5)).toBe(-4);
  });
  it("is zero for an even match", () => {
    expect(computeSequenceGap(7, 7)).toBe(0);
  });
});

describe("computePathwayMatchup", () => {
  it("gives a Beyonder an edge over a mundane foe", () => {
    const matchup = computePathwayMatchup(1, makeEnemy({ isBeyonder: false }));
    expect(matchup.relation).toBe("foreign");
    expect(matchup.advantage).toBeGreaterThan(0);
  });

  it("treats a Beyonder enemy without a known pathway as mundane", () => {
    const matchup = computePathwayMatchup(
      1,
      makeEnemy({ isBeyonder: true, pathwayId: undefined }),
    );
    expect(matchup.relation).toBe("foreign");
    expect(matchup.advantage).toBeGreaterThan(0);
  });

  it("is a slight disadvantage against the same pathway", () => {
    const matchup = computePathwayMatchup(
      1,
      makeEnemy({ isBeyonder: true, pathwayId: 1 }),
    );
    expect(matchup.relation).toBe("same");
    expect(matchup.advantage).toBeLessThan(0);
  });

  it("favours the Sun (god-almighty) against an Eternal Darkness enemy", () => {
    const matchup = computePathwayMatchup(
      3,
      makeEnemy({ isBeyonder: true, pathwayId: 4 }),
    );
    expect(matchup.relation).toBe("opposed");
    expect(matchup.advantage).toBeGreaterThan(0);
  });

  it("disfavours a Death (eternal-darkness) Beyonder against the Sun", () => {
    const matchup = computePathwayMatchup(
      4,
      makeEnemy({ isBeyonder: true, pathwayId: 3 }),
    );
    expect(matchup.relation).toBe("opposed");
    expect(matchup.advantage).toBeLessThan(0);
  });

  it("treats a shared group (not same pathway) as kindred", () => {
    // Visionary (2) and Sun (3) are both in the God Almighty group.
    const matchup = computePathwayMatchup(
      2,
      makeEnemy({ isBeyonder: true, pathwayId: 3 }),
    );
    expect(matchup.relation).toBe("kindred");
    expect(matchup.advantage).toBeGreaterThan(0);
  });

  it("is neutral foreign across unrelated groups", () => {
    // Fool (mysteries) vs Death (eternal-darkness).
    const matchup = computePathwayMatchup(
      1,
      makeEnemy({ isBeyonder: true, pathwayId: 4 }),
    );
    expect(matchup.relation).toBe("foreign");
    expect(matchup.advantage).toBe(0);
  });

  it("is neutral foreign when the enemy pathway has no known group", () => {
    const matchup = computePathwayMatchup(
      1,
      makeEnemy({ isBeyonder: true, pathwayId: 99 }),
    );
    expect(matchup.relation).toBe("foreign");
    expect(matchup.advantage).toBe(0);
  });
});

// ─── Injuries (penalty in) ───────────────────────────────────────────

describe("computeInjuryPenalty", () => {
  const minor: Injury = {
    id: "i1",
    description: "",
    severity: "minor",
    recoveryTurns: 3,
  };
  const major: Injury = {
    id: "i2",
    description: "",
    severity: "major",
    recoveryTurns: 6,
  };
  const grievous: Injury = {
    id: "i3",
    description: "",
    severity: "grievous",
    recoveryTurns: 10,
  };

  it("is zero with no injuries", () => {
    expect(computeInjuryPenalty([])).toBe(0);
  });

  it("sums per-severity penalties", () => {
    expect(computeInjuryPenalty([minor, major])).toBeCloseTo(0.17, 5);
  });

  it("caps the combined penalty", () => {
    expect(computeInjuryPenalty([grievous, grievous, grievous])).toBe(INJURY_PENALTY_CAP);
  });
});

// ─── Base Advantage ──────────────────────────────────────────────────

describe("computeBaseAdvantage", () => {
  it("rewards above-average preparation at an even match", () => {
    const advantage = computeBaseAdvantage({
      prepScore: 1,
      sequenceGap: 0,
      matchupAdvantage: 0,
      randomFactor: 0.5,
      injuryPenalty: 0,
    });
    expect(advantage).toBeCloseTo(0.125, 5);
  });

  it("punishes a large sequence deficit with no preparation", () => {
    const advantage = computeBaseAdvantage({
      prepScore: 0,
      sequenceGap: -4,
      matchupAdvantage: 0,
      randomFactor: 0.5,
      injuryPenalty: 0,
    });
    expect(advantage).toBeCloseTo(-0.575, 5);
  });

  it("clamps the sequence gap and matchup contributions", () => {
    const beyondClamp = computeBaseAdvantage({
      prepScore: 0.5,
      sequenceGap: 50,
      matchupAdvantage: 5,
      randomFactor: 0.5,
      injuryPenalty: 0,
    });
    const atClamp = computeBaseAdvantage({
      prepScore: 0.5,
      sequenceGap: 4,
      matchupAdvantage: 1,
      randomFactor: 0.5,
      injuryPenalty: 0,
    });
    expect(beyondClamp).toBeCloseTo(atClamp, 5);
  });

  it("subtracts the injury penalty and applies the random factor", () => {
    const advantage = computeBaseAdvantage({
      prepScore: 0.5,
      sequenceGap: 0,
      matchupAdvantage: 0,
      randomFactor: 1,
      injuryPenalty: 0.2,
    });
    // random = 0.15 × 1 = 0.15; minus 0.2 injury → -0.05.
    expect(advantage).toBeCloseTo(-0.05, 5);
  });
});

// ─── Encounter Lifecycle ─────────────────────────────────────────────

describe("createEncounter", () => {
  it("starts a prepared fight in the preparation phase", () => {
    const encounter = createEncounter({
      id: "e1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(encounter.phase).toBe("preparation");
    expect(encounter.prepQuality).toBeNull();
    expect(encounter.decisionPoints).toEqual([]);
    expect(encounter.sequenceGap).toBe(-2);
  });

  it("skips straight to the exchange for an ambush", () => {
    const encounter = createEncounter({
      id: "a1",
      enemy: makeEnemy({ sequenceLevel: 8 }),
      playerPathwayId: 1,
      playerSequence: 9,
      ambush: true,
      randomFactor: 0.5,
    });
    expect(encounter.phase).toBe("exchange");
    expect(encounter.prepQuality?.score).toBe(0);
    expect(encounter.decisionPoints).toHaveLength(DECISION_POINT_COUNT);
  });

  it("defaults the random factor when none is supplied", () => {
    const encounter = createEncounter({
      id: "e2",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
    });
    expect(encounter.randomFactor).toBeGreaterThanOrEqual(0);
    expect(encounter.randomFactor).toBeLessThanOrEqual(1);
  });

  it("clamps an out-of-range random factor", () => {
    const high = createEncounter({
      id: "e3",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 5,
    });
    const low = createEncounter({
      id: "e4",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: -5,
    });
    expect(high.randomFactor).toBe(1);
    expect(low.randomFactor).toBe(0);
  });

  it("captures the injury penalty from active injuries", () => {
    const encounter = createEncounter({
      id: "e5",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      injuries: [{ id: "x", description: "", severity: "major", recoveryTurns: 4 }],
    });
    expect(encounter.injuryPenalty).toBeCloseTo(0.12, 5);
  });
});

describe("deriveEncounterEnemy", () => {
  it("derives a known Beyonder a step stronger for a confrontation", () => {
    const enemy = deriveEncounterEnemy(makeGameState({ sequenceLevel: 7 }), false);
    expect(enemy.sequenceLevel).toBe(6);
    expect(enemy.isBeyonder).toBe(true);
    expect(enemy.name).toBe("a lurking Beyonder");
  });

  it("derives an even, mundane ambusher for an ambush", () => {
    const enemy = deriveEncounterEnemy(makeGameState({ sequenceLevel: 7 }), true);
    expect(enemy.sequenceLevel).toBe(7);
    expect(enemy.isBeyonder).toBe(false);
    expect(enemy.name).toBe("an assailant in the fog");
  });

  it("clamps the enemy sequence at 0 for a Sequence 0 player", () => {
    const enemy = deriveEncounterEnemy(makeGameState({ sequenceLevel: 0 }), false);
    expect(enemy.sequenceLevel).toBe(0);
  });

  it("names the foe after a present NPC when there is one", () => {
    const enemy = deriveEncounterEnemy(
      makeGameState({ npcsPresent: ["The Masked Stranger"] }),
      false,
    );
    expect(enemy.name).toBe("The Masked Stranger");
  });
});

describe("isValidEncounterShape", () => {
  const valid = createEncounter({
    id: "shape-1",
    enemy: makeEnemy(),
    playerPathwayId: 1,
    playerSequence: 9,
    randomFactor: 0.5,
  });

  it("accepts a well-formed encounter", () => {
    expect(isValidEncounterShape(valid)).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isValidEncounterShape(null)).toBe(false);
    expect(isValidEncounterShape([])).toBe(false);
    expect(isValidEncounterShape("x")).toBe(false);
  });

  it("rejects a missing or empty id", () => {
    expect(isValidEncounterShape({ ...valid, id: "" })).toBe(false);
  });

  it("rejects an unknown phase", () => {
    expect(isValidEncounterShape({ ...valid, phase: "over" })).toBe(false);
  });

  it("rejects a malformed enemy", () => {
    expect(isValidEncounterShape({ ...valid, enemy: null })).toBe(false);
    expect(isValidEncounterShape({ ...valid, enemy: { ...valid.enemy, name: 1 } })).toBe(
      false,
    );
    expect(
      isValidEncounterShape({ ...valid, enemy: { ...valid.enemy, sequenceLevel: "x" } }),
    ).toBe(false);
    expect(
      isValidEncounterShape({ ...valid, enemy: { ...valid.enemy, isBeyonder: "yes" } }),
    ).toBe(false);
  });

  it("rejects non-numeric player fields", () => {
    expect(isValidEncounterShape({ ...valid, playerPathwayId: "one" })).toBe(false);
    expect(isValidEncounterShape({ ...valid, playerSequence: null })).toBe(false);
    expect(isValidEncounterShape({ ...valid, decisionIndex: "x" })).toBe(false);
  });

  it("rejects non-array decision points or chosen ids", () => {
    expect(isValidEncounterShape({ ...valid, decisionPoints: {} })).toBe(false);
    expect(isValidEncounterShape({ ...valid, chosenOptionIds: "none" })).toBe(false);
  });
});

describe("applyPreparation", () => {
  it("scores preparation, fixes the base advantage, and generates decision points", () => {
    const encounter = createEncounter({
      id: "p1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    const prepared = applyPreparation(
      encounter,
      makePrep({ intelligence: "thorough", sealedArtifacts: [makeItem("charm")] }),
    );
    expect(prepared.phase).toBe("exchange");
    expect(prepared.prepQuality?.score).toBeCloseTo(0.4, 5);
    expect(prepared.baseAdvantage).toBeCloseTo(-0.16, 5);
    expect(prepared.decisionPoints).toHaveLength(DECISION_POINT_COUNT);
  });

  it("is a no-op outside the preparation phase", () => {
    const ambush = createEncounter({
      id: "p2",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      ambush: true,
      randomFactor: 0.5,
    });
    const again = applyPreparation(ambush, makePrep({ intelligence: "thorough" }));
    expect(again).toBe(ambush);
  });
});

describe("generateDecisionPoints", () => {
  function preparedEncounter(
    prep: Partial<CombatPreparationInput> = {},
    enemy: Partial<Enemy> = {},
    pathwayId = 1,
  ): CombatEncounter {
    const encounter = createEncounter({
      id: "g1",
      enemy: makeEnemy(enemy),
      playerPathwayId: pathwayId,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    return applyPreparation(encounter, makePrep(prep));
  }

  it("produces the configured number of decision points with three options each", () => {
    const encounter = preparedEncounter();
    const points = generateDecisionPoints(encounter);
    expect(points).toHaveLength(DECISION_POINT_COUNT);
    expect(points).toEqual(encounter.decisionPoints);
    for (const point of points) {
      expect(point.options).toHaveLength(3);
    }
  });

  it("offers an artifact option only when an artifact is available", () => {
    const withArtifact = preparedEncounter({
      sealedArtifacts: [makeItem("charm")],
    }).decisionPoints;
    const artifactOption = withArtifact
      .flatMap((p) => p.options)
      .find((o) => o.kind === "artifact");
    expect(artifactOption).toBeDefined();
    expect(artifactOption?.consumesArtifact).toBe(true);

    const withoutArtifact = preparedEncounter().decisionPoints;
    expect(
      withoutArtifact.flatMap((p) => p.options).some((o) => o.kind === "artifact"),
    ).toBe(false);
  });

  it("scales ability options with intelligence (investigation rewards)", () => {
    const noIntel = preparedEncounter({ intelligence: "none" });
    const thorough = preparedEncounter({ intelligence: "thorough" });
    const abilityModifier = (e: CombatEncounter) =>
      e.decisionPoints.flatMap((p) => p.options).find((o) => o.kind === "ability")!
        .modifier;
    expect(abilityModifier(thorough)).toBeGreaterThan(abilityModifier(noIntel));
  });

  it("flavours options by the player's pathway", () => {
    const fool = preparedEncounter({}, {}, 1).decisionPoints[0].options;
    const sun = preparedEncounter({}, {}, 3).decisionPoints[0].options;
    const foolEvasive = fool.find((o) => o.kind === "evasive")!.label;
    const sunEvasive = sun.find((o) => o.kind === "evasive")!.label;
    expect(foolEvasive).not.toBe(sunEvasive);
  });

  it("falls back to a generic style for an unknown pathway", () => {
    const generic = preparedEncounter({}, {}, 99).decisionPoints[0].options;
    expect(generic.find((o) => o.kind === "aggressive")!.label).toBe("Press the attack");
  });

  it("grants the signature tactic a bonus", () => {
    // Fool's signature is evasive; its evasive modifier exceeds the raw base.
    const fool = preparedEncounter({}, {}, 1).decisionPoints[0].options;
    const evasive = fool.find((o) => o.kind === "evasive")!;
    expect(evasive.modifier).toBeGreaterThan(0.05);
  });

  it("makes aggression pay off for a favoured player", () => {
    // Sun (3, signature aggressive) opposing a Death (4) enemy holds the edge.
    const sun = preparedEncounter(
      { intelligence: "thorough" },
      { isBeyonder: true, pathwayId: 4, sequenceLevel: 9 },
      3,
    );
    const aggressive = sun.decisionPoints[0].options.find(
      (o) => o.kind === "aggressive",
    )!;
    expect(aggressive.modifier).toBeGreaterThan(0.2);
  });

  it("tolerates a pre-preparation encounter via defensive fallbacks", () => {
    // Called directly before preparation is applied: prepQuality/preparation
    // are null, so the engine falls back to a no-edge, no-intel baseline.
    const encounter = createEncounter({
      id: "g-raw",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    const points = generateDecisionPoints(encounter);
    expect(points).toHaveLength(DECISION_POINT_COUNT);
    expect(points.flatMap((p) => p.options).some((o) => o.kind === "artifact")).toBe(
      false,
    );
  });
});

// ─── Choosing Options ────────────────────────────────────────────────

describe("chooseOption", () => {
  function prepared(): CombatEncounter {
    const encounter = createEncounter({
      id: "c1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    return applyPreparation(encounter, makePrep({ intelligence: "thorough" }));
  }

  it("records the choice, accumulates its modifier, and advances", () => {
    const encounter = prepared();
    const option = encounter.decisionPoints[0].options[0];
    const next = chooseOption(encounter, option.id);
    expect(next.chosenOptionIds).toEqual([option.id]);
    expect(next.accumulatedModifier).toBeCloseTo(option.modifier, 5);
    expect(next.decisionIndex).toBe(1);
  });

  it("is a no-op outside the exchange phase", () => {
    const preparation = createEncounter({
      id: "c2",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(chooseOption(preparation, "anything")).toBe(preparation);
  });

  it("is a no-op for an unknown option id", () => {
    const encounter = prepared();
    expect(chooseOption(encounter, "no-such-option")).toBe(encounter);
  });

  it("is a no-op once the exchange is complete", () => {
    let encounter = prepared();
    for (const point of encounter.decisionPoints) {
      encounter = chooseOption(encounter, point.options[0].id);
    }
    expect(isExchangeComplete(encounter)).toBe(true);
    expect(chooseOption(encounter, encounter.decisionPoints[0].options[0].id)).toBe(
      encounter,
    );
  });
});

describe("isExchangeComplete", () => {
  it("is false with no decision points", () => {
    const encounter = createEncounter({
      id: "x1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(isExchangeComplete(encounter)).toBe(false);
  });

  it("is false mid-exchange and true once every point is resolved", () => {
    let encounter = applyPreparation(
      createEncounter({
        id: "x2",
        enemy: makeEnemy(),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    expect(isExchangeComplete(encounter)).toBe(false);
    encounter = chooseOption(encounter, encounter.decisionPoints[0].options[0].id);
    expect(isExchangeComplete(encounter)).toBe(false);
    encounter = chooseOption(encounter, encounter.decisionPoints[1].options[0].id);
    encounter = chooseOption(encounter, encounter.decisionPoints[2].options[0].id);
    expect(isExchangeComplete(encounter)).toBe(true);
  });
});

// ─── Outcome Resolution ──────────────────────────────────────────────

describe("resolveOutcome", () => {
  it("returns victory at or above the victory threshold", () => {
    expect(resolveOutcome(VICTORY_THRESHOLD, 0, 3)).toBe("victory");
  });

  it("returns escape when evasive choices dominate and it is not a victory", () => {
    expect(resolveOutcome(0, 2, 3)).toBe("escape");
  });

  it("returns defeat at or below the defeat threshold", () => {
    expect(resolveOutcome(DEFEAT_THRESHOLD, 0, 3)).toBe("defeat");
  });

  it("returns stalemate in the middle band", () => {
    expect(resolveOutcome(0, 0, 3)).toBe("stalemate");
  });

  it("never escapes with no decision points", () => {
    expect(resolveOutcome(0, 0, 0)).toBe("stalemate");
  });
});

// ─── End-to-end resolution & consequences ────────────────────────────

function playThrough(
  encounter: CombatEncounter,
  pick: (i: number) => number,
): CombatEncounter {
  let current = encounter;
  for (let i = 0; i < current.decisionPoints.length; i++) {
    const point = current.decisionPoints[current.decisionIndex];
    current = chooseOption(current, point.options[pick(i)].id);
  }
  return resolveEncounter(current);
}

describe("resolveEncounter", () => {
  it("is a no-op once resolved", () => {
    const encounter = playThrough(
      applyPreparation(
        createEncounter({
          id: "r0",
          enemy: makeEnemy(),
          playerPathwayId: 1,
          playerSequence: 9,
          randomFactor: 0.5,
        }),
        makePrep(),
      ),
      () => 0,
    );
    expect(encounter.phase).toBe("resolution");
    expect(resolveEncounter(encounter)).toBe(encounter);
  });

  it("rewards a prepared player who plays smart with victory (preparation mattered)", () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "win",
        enemy: makeEnemy({ sequenceLevel: 7 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough", sealedArtifacts: [makeItem("charm")] }),
    );
    // Pick the highest-modifier option at each point.
    const resolved = playThrough(prepared, (i) => {
      const point = prepared.decisionPoints[i];
      let best = 0;
      point.options.forEach((o, idx) => {
        if (o.modifier > point.options[best].modifier) best = idx;
      });
      return best;
    });
    expect(resolved.outcome).toBe("victory");
  });

  it("can punish a prepared player who plays recklessly (preparation never decides)", () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "lose",
        enemy: makeEnemy({ sequenceLevel: 7 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough", sealedArtifacts: [makeItem("charm")] }),
    );
    // Always pick the aggressive option, which backfires without an edge.
    const resolved = playThrough(prepared, (i) => {
      const point = prepared.decisionPoints[i];
      return point.options.findIndex((o) => o.kind === "aggressive");
    });
    expect(resolved.outcome).toBe("defeat");
  });

  it("lets an ambushed player escape through evasive choices", () => {
    const ambush = createEncounter({
      id: "ambush-escape",
      enemy: makeEnemy({ name: "Cutthroat", sequenceLevel: 8 }),
      playerPathwayId: 1,
      playerSequence: 9,
      ambush: true,
      randomFactor: 0.3,
    });
    const resolved = playThrough(ambush, (i) => {
      const point = ambush.decisionPoints[i];
      // Evade at the first two points, then anything.
      const evasive = point.options.findIndex((o) => o.kind === "evasive");
      return i < 2 && evasive !== -1 ? evasive : 0;
    });
    expect(["escape", "victory", "stalemate"]).toContain(resolved.outcome);
    expect(resolved.outcome).not.toBe("defeat");
  });

  it("punishes a reckless response to an ambush with defeat", () => {
    const ambush = createEncounter({
      id: "ambush-lose",
      enemy: makeEnemy({ name: "Cutthroat", sequenceLevel: 8 }),
      playerPathwayId: 1,
      playerSequence: 9,
      ambush: true,
      randomFactor: 0.3,
    });
    const resolved = playThrough(ambush, (i) =>
      ambush.decisionPoints[i].options.findIndex((o) => o.kind === "aggressive"),
    );
    expect(resolved.outcome).toBe("defeat");
  });
});

describe("computeConsequences", () => {
  function resolvedWith(
    outcome: "victory" | "defeat" | "escape" | "stalemate",
    enemy: Partial<Enemy>,
    finalAdvantage: number,
    playerSequence = 9,
  ): CombatEncounter {
    return {
      id: "cc",
      enemy: makeEnemy(enemy),
      ambush: false,
      phase: "exchange",
      playerPathwayId: 1,
      playerSequence,
      randomFactor: 0.5,
      injuryPenalty: 0,
      preparation: makePrep(),
      prepQuality: scorePreparation(makePrep(), false),
      sequenceGap: computeSequenceGap(playerSequence, enemy.sequenceLevel ?? 7),
      matchup: computePathwayMatchup(1, makeEnemy(enemy)),
      baseAdvantage: 0,
      decisionPoints: [],
      decisionIndex: 0,
      chosenOptionIds: [],
      accumulatedModifier: 0,
      outcome: null,
      result: null,
    };
  }

  it("awards loot and a characteristic when a Beyonder is slain", () => {
    const loot = [makeItem("Spirit Pendant")];
    const encounter = resolvedWith(
      "victory",
      { sequenceLevel: 7, isBeyonder: true, pathwayId: 1, loot },
      0.5,
    );
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.itemsGained).toEqual(loot);
    expect(result.characteristicsDropped).toEqual([
      { pathwayId: 1, sequenceLevel: 7, quantity: 1 },
    ]);
  });

  it("drops no characteristic for a mundane victory", () => {
    const encounter = resolvedWith(
      "victory",
      { sequenceLevel: 7, isBeyonder: false },
      0.5,
    );
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.characteristicsDropped).toEqual([]);
    expect(result.itemsGained).toEqual([]);
  });

  it("loses ritual materials and consumed artifacts", () => {
    const material = makeItem("Corpse Grass");
    const artifact = makeItem("Sealed Charm");
    const encounter: CombatEncounter = {
      ...resolvedWith("victory", { sequenceLevel: 7 }, 0.5),
      preparation: makePrep({ ritualMaterials: [material], sealedArtifacts: [artifact] }),
      decisionPoints: [
        {
          id: "dp",
          prompt: "",
          options: [
            {
              id: "use-artifact",
              label: "",
              kind: "artifact",
              description: "",
              modifier: 0.2,
              consumesArtifact: true,
            },
          ],
        },
      ],
      chosenOptionIds: ["use-artifact"],
    };
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.itemsLost).toEqual([material, artifact]);
  });

  it("keeps unused artifacts", () => {
    const artifact = makeItem("Sealed Charm");
    const encounter: CombatEncounter = {
      ...resolvedWith("victory", { sequenceLevel: 7 }, 0.5),
      preparation: makePrep({ sealedArtifacts: [artifact] }),
    };
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.itemsLost).toEqual([]);
  });

  it("handles a null preparation (no materials lost)", () => {
    const encounter: CombatEncounter = {
      ...resolvedWith("escape", { sequenceLevel: 7 }, 0),
      preparation: null,
    };
    const result = computeConsequences(encounter, "escape", 0);
    expect(result.itemsLost).toEqual([]);
  });

  it("ignores chosen ids that match no option", () => {
    const encounter: CombatEncounter = {
      ...resolvedWith("stalemate", { sequenceLevel: 7 }, 0),
      decisionPoints: [{ id: "dp", prompt: "", options: [] }],
      chosenOptionIds: ["ghost"],
    };
    const result = computeConsequences(encounter, "stalemate", 0);
    expect(result.itemsLost).toEqual([]);
  });

  it("inflicts no injury on a dominant victory", () => {
    const encounter = resolvedWith("victory", { sequenceLevel: 9 }, 0.6, 5);
    const result = computeConsequences(encounter, "victory", 0.6);
    expect(result.injuries).toEqual([]);
  });

  it("inflicts a minor injury on a narrow victory against a stronger foe", () => {
    const encounter = resolvedWith("victory", { sequenceLevel: 5 }, 0.2, 9);
    const result = computeConsequences(encounter, "victory", 0.2);
    expect(result.injuries).toHaveLength(1);
    expect(result.injuries[0].severity).toBe("minor");
    expect(result.injuries[0].recoveryTurns).toBe(INJURY_RECOVERY_TURNS.minor);
  });

  it("inflicts a minor injury when escaping", () => {
    const encounter = resolvedWith("escape", { sequenceLevel: 7 }, 0);
    const result = computeConsequences(encounter, "escape", 0);
    expect(result.injuries.map((i) => i.severity)).toEqual(["minor"]);
  });

  it("inflicts a major injury in a stalemate against a stronger foe", () => {
    const encounter = resolvedWith("stalemate", { sequenceLevel: 5 }, 0, 9);
    const result = computeConsequences(encounter, "stalemate", 0);
    expect(result.injuries.map((i) => i.severity)).toEqual(["major"]);
  });

  it("inflicts a minor injury in a stalemate against an even or weaker foe", () => {
    const encounter = resolvedWith("stalemate", { sequenceLevel: 9 }, 0, 9);
    const result = computeConsequences(encounter, "stalemate", 0);
    expect(result.injuries.map((i) => i.severity)).toEqual(["minor"]);
  });

  it("inflicts a major wound on defeat, plus a grievous one against a far stronger foe", () => {
    const close = resolvedWith("defeat", { sequenceLevel: 7 }, -0.4, 9);
    expect(
      computeConsequences(close, "defeat", -0.4).injuries.map((i) => i.severity),
    ).toEqual(["major"]);
    const overmatched = resolvedWith("defeat", { sequenceLevel: 5 }, -0.6, 9);
    expect(
      computeConsequences(overmatched, "defeat", -0.6).injuries.map((i) => i.severity),
    ).toEqual(["major", "grievous"]);
  });

  it("scales sanity drain by outcome and clamps the worst case", () => {
    const victory = computeConsequences(
      resolvedWith("victory", { sequenceLevel: 7 }, 0.5),
      "victory",
      0.5,
    );
    const defeat = computeConsequences(
      resolvedWith("defeat", { sequenceLevel: 7 }, -0.5),
      "defeat",
      -0.5,
    );
    expect(victory.sanityImpact).toBeLessThan(0);
    expect(defeat.sanityImpact).toBeLessThan(victory.sanityImpact);

    const catastrophic = computeConsequences(
      resolvedWith("defeat", { sequenceLevel: 2, isBeyonder: true, pathwayId: 4 }, -1, 9),
      "defeat",
      -1,
    );
    expect(catastrophic.sanityImpact).toBe(-40);
  });

  it("writes a pathway-flavoured narrative summary naming the enemy", () => {
    const encounter = resolvedWith("victory", { name: "Lurker", sequenceLevel: 7 }, 0.5);
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.narrativeSummary).toContain("Lurker");
    expect(result.narrativeSummary.length).toBeGreaterThan(0);
  });
});

// ─── Applying Results ────────────────────────────────────────────────

describe("applyCombatResult", () => {
  it("applies sanity drain, swaps inventory, and records injuries", () => {
    const state = makeGameState({
      sanity: 50,
      inventory: [makeItem("Corpse Grass"), makeItem("Old Coin")],
    });
    const next = applyCombatResult(state, {
      outcome: "victory",
      injuries: [{ id: "j1", description: "cut", severity: "minor", recoveryTurns: 3 }],
      sanityImpact: -12,
      itemsGained: [makeItem("Spirit Pendant")],
      itemsLost: [makeItem("Corpse Grass")],
      characteristicsDropped: [],
      narrativeSummary: "done",
    });
    expect(next.sanity).toBe(38);
    expect(next.inventory.map((i) => i.name)).toEqual(["Old Coin", "Spirit Pendant"]);
    expect(next.injuries).toHaveLength(1);
  });

  it("clamps sanity to zero and appends to existing injuries", () => {
    const state = makeGameState({
      sanity: 10,
      injuries: [{ id: "old", description: "", severity: "minor", recoveryTurns: 2 }],
    });
    const next = applyCombatResult(state, {
      outcome: "defeat",
      injuries: [{ id: "new", description: "", severity: "major", recoveryTurns: 6 }],
      sanityImpact: -25,
      itemsGained: [],
      itemsLost: [],
      characteristicsDropped: [],
      narrativeSummary: "lost",
    });
    expect(next.sanity).toBe(0);
    expect(next.injuries?.map((i) => i.id)).toEqual(["old", "new"]);
  });

  it("leaves inventory untouched and adds no injuries field when there are none", () => {
    const state = makeGameState({ inventory: [makeItem("Old Coin")] });
    const next = applyCombatResult(state, {
      outcome: "stalemate",
      injuries: [],
      sanityImpact: 0,
      itemsGained: [],
      itemsLost: [],
      characteristicsDropped: [],
      narrativeSummary: "even",
    });
    expect(next.inventory).toEqual([makeItem("Old Coin")]);
    expect(next.injuries).toBeUndefined();
  });

  it("tolerates losing an item that is not in the inventory", () => {
    const state = makeGameState({ inventory: [makeItem("Old Coin")] });
    const next = applyCombatResult(state, {
      outcome: "victory",
      injuries: [],
      sanityImpact: 0,
      itemsGained: [],
      itemsLost: [makeItem("Phantom")],
      characteristicsDropped: [],
      narrativeSummary: "won",
    });
    expect(next.inventory.map((i) => i.name)).toEqual(["Old Coin"]);
  });
});

describe("tickInjuries", () => {
  it("returns the state unchanged when there are no injuries", () => {
    const state = makeGameState();
    expect(tickInjuries(state)).toBe(state);
  });

  it("returns the state unchanged for an empty injuries array", () => {
    const state = makeGameState({ injuries: [] });
    expect(tickInjuries(state)).toBe(state);
  });

  it("heals injuries by one turn and drops the recovered ones", () => {
    const state = makeGameState({
      injuries: [
        { id: "a", description: "", severity: "minor", recoveryTurns: 1 },
        { id: "b", description: "", severity: "major", recoveryTurns: 3 },
      ],
    });
    const next = tickInjuries(state);
    expect(next.injuries).toEqual([
      { id: "b", description: "", severity: "major", recoveryTurns: 2 },
    ]);
  });
});
