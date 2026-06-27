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
  deriveEncounter,
  deriveHuntQuarry,
  selectOpponents,
  bestiaryFoeToEnemy,
  isReconcilableFraming,
  coerceAllyFraming,
  makeEncounterContext,
  framingLabel,
  describeFraming,
  enemyIntel,
  createEncounter,
  applyPreparation,
  chooseOption,
  isExchangeComplete,
  resolveOutcome,
  isWinningOutcome,
  computeConsequences,
  resolveEncounter,
  applyCombatResult,
  tickInjuries,
  combatNarrationContext,
  isValidEncounterShape,
  controlTierFor,
  controlTierLabel,
  describeControlTier,
  seedControlStrain,
  stanceForPoint,
  stanceLabel,
  describeStance,
  threatAssessment,
  afterActionReport,
  artifactBacklash,
  ARTIFACT_VOLATILE_THRESHOLD,
  creatureFromMaterial,
} from "./combat";
import { getSealedArtifact, mintArtifactItem, getBestiaryFoe } from "@/lib/lore";
import { ALL_PATHWAYS, getPathway, getSequence } from "@/lib/rules";
import type { TrackedNpcState } from "./tracked-npcs";

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

  it("carries a potion-hunt objective when one is supplied, omitting it otherwise", () => {
    const hunt = createEncounter({
      id: "hunt-1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
      huntTarget: "Sequence 8 Demoness Beyonder Characteristic",
    });
    expect(hunt.huntTarget).toBe("Sequence 8 Demoness Beyonder Characteristic");

    const plain = createEncounter({
      id: "plain-1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(plain.huntTarget).toBeUndefined();
    expect("huntTarget" in plain).toBe(false);
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

// ─── Encounter framing & opponent selection (issue #187, Phase 1) ────

describe("framing helpers", () => {
  it("classifies reconcilable framings", () => {
    expect(isReconcilableFraming("mind-controlled")).toBe(true);
    expect(isReconcilableFraming("coerced")).toBe(true);
    expect(isReconcilableFraming("lost-control")).toBe(true);
    expect(isReconcilableFraming("rival-motive")).toBe(true);
    expect(isReconcilableFraming("hostile-beyonder")).toBe(false);
    expect(isReconcilableFraming("mundane-threat")).toBe(false);
    expect(isReconcilableFraming("beast")).toBe(false);
  });

  it("forces an ally combatant into a reconcilable framing (engine truth over AI string)", () => {
    expect(coerceAllyFraming("hostile-beyonder", "ally")).toBe("mind-controlled");
    expect(coerceAllyFraming("beast", "ally")).toBe("mind-controlled");
    // An already-reconcilable framing for an ally is kept.
    expect(coerceAllyFraming("coerced", "ally")).toBe("coerced");
    // A non-ally keeps the proposed framing.
    expect(coerceAllyFraming("hostile-beyonder", "hostile")).toBe("hostile-beyonder");
    expect(coerceAllyFraming("hostile-beyonder", undefined)).toBe("hostile-beyonder");
  });

  it("derives reconcilability from the framing in makeEncounterContext", () => {
    const ctx = makeEncounterContext("mind-controlled", {
      isKnownPerson: true,
      controllerName: "The Puppeteer",
    });
    expect(ctx.reconcilable).toBe(true);
    expect(ctx.controllerName).toBe("The Puppeteer");
    expect(makeEncounterContext("hostile-beyonder").reconcilable).toBe(false);
  });

  it("labels and describes framings for the threat card", () => {
    expect(framingLabel("mind-controlled")).toBe("Mind-controlled");
    const controlled = describeFraming(
      makeEncounterContext("mind-controlled", {
        isKnownPerson: true,
        controllerName: "Hood Eugen",
      }),
    );
    expect(controlled).toContain("Hood Eugen");
    // A motive overrides the generic description.
    const withMotive = describeFraming(
      makeEncounterContext("rival-motive", {
        isKnownPerson: false,
        motive: "After the relic.",
      }),
    );
    expect(withMotive).toBe("After the relic.");
    // Each framing has a non-empty fallback description.
    for (const framing of [
      "mind-controlled",
      "coerced",
      "lost-control",
      "rival-motive",
      "beast",
      "mundane-threat",
      "hostile-beyonder",
    ] as const) {
      expect(describeFraming(makeEncounterContext(framing)).length).toBeGreaterThan(0);
    }
  });
});

describe("selectOpponents", () => {
  const roster = (npcs: TrackedNpcState["roster"]): TrackedNpcState => ({ roster: npcs });

  it("reframes a present ally as mind-controlled, never a plain foe", () => {
    const state = makeGameState({ npcsPresent: ["Lawrence"], currentCity: "tingen" });
    const options = selectOpponents(state, {
      trackedNpcState: roster([{ name: "Lawrence", disposition: "ally", follows: true }]),
    });
    const lawrence = options.find((o) => o.enemy.name === "Lawrence")!;
    expect(lawrence.source).toBe("present-npc");
    expect(lawrence.context.framing).toBe("mind-controlled");
    expect(lawrence.context.reconcilable).toBe(true);
    expect(lawrence.context.isKnownPerson).toBe(true);
  });

  it("frames a roster hostile as a genuine enemy", () => {
    const state = makeGameState({ npcsPresent: ["The Killer"] });
    const options = selectOpponents(state, {
      trackedNpcState: roster([
        { name: "The Killer", disposition: "hostile", follows: true },
      ]),
    });
    expect(options[0].context.framing).toBe("hostile-beyonder");
  });

  it("frames an unknown present NPC as a rival with their own agenda", () => {
    const options = selectOpponents(makeGameState({ npcsPresent: ["A Stranger"] }));
    expect(options[0].context.framing).toBe("rival-motive");
    expect(options[0].context.reconcilable).toBe(true);
  });

  it("surfaces roster pursuers not in the scene as targets", () => {
    const options = selectOpponents(makeGameState(), {
      trackedNpcState: roster([
        { name: "The Hunter", disposition: "hostile", follows: true },
      ]),
    });
    const pursuer = options.find((o) => o.source === "pursuer");
    expect(pursuer?.enemy.name).toBe("The Hunter");
  });

  it("surfaces curated bestiary picks for the region + Sequence", () => {
    const options = selectOpponents(makeGameState({ currentCity: "backlund" }), {
      maxBestiary: 5,
    });
    const bestiary = options.filter((o) => o.source === "bestiary");
    expect(bestiary.length).toBeGreaterThan(0);
    expect(bestiary.some((o) => o.enemy.bestiaryId === "backlund-devil-dog")).toBe(true);
  });

  it("does not duplicate a present NPC who is also a roster pursuer", () => {
    const state = makeGameState({ npcsPresent: ["The Hunter"] });
    const options = selectOpponents(state, {
      trackedNpcState: roster([
        { name: "The Hunter", disposition: "hostile", follows: true },
      ]),
    });
    expect(options.filter((o) => o.enemy.name === "The Hunter")).toHaveLength(1);
  });

  it("can return an empty list when nothing fits (the launcher then uses deriveEncounter)", () => {
    // A powerful player (Seq 2) with no NPCs/pursuers and no region-appropriate
    // bestiary foe surfaces no framed target...
    expect(selectOpponents(makeGameState({ sequenceLevel: 2 }))).toEqual([]);
    // ...but the single-pick derivation still yields a framed fallback, so the
    // UI never dead-ends.
    expect(deriveEncounter(makeGameState({ sequenceLevel: 2 })).enemy.name).toBe(
      "a lurking Beyonder",
    );
  });

  it("an ambush opponent strikes at an even footing", () => {
    const options = selectOpponents(
      makeGameState({ npcsPresent: ["X"], sequenceLevel: 7 }),
      {
        ambush: true,
      },
    );
    expect(options[0].enemy.sequenceLevel).toBe(7);
    expect(options[0].enemy.isBeyonder).toBe(false);
  });
});

describe("deriveEncounter", () => {
  it("returns a framed present-NPC opponent over the bestiary", () => {
    const option = deriveEncounter(
      makeGameState({ npcsPresent: ["Comrade"], currentCity: "tingen" }),
      {
        trackedNpcState: {
          roster: [{ name: "Comrade", disposition: "ally", follows: true }],
        },
      },
    );
    expect(option.enemy.name).toBe("Comrade");
    expect(option.context.framing).toBe("mind-controlled");
  });

  it("falls back to a framed generic threat when the scene is empty", () => {
    const known = deriveEncounter(makeGameState({ sequenceLevel: 7 }), { ambush: false });
    expect(known.enemy.name).toBe("a lurking Beyonder");
    expect(known.context.framing).toBe("hostile-beyonder");
    const ambush = deriveEncounter(makeGameState({ sequenceLevel: 7 }), { ambush: true });
    expect(ambush.enemy.name).toBe("an assailant in the fog");
    expect(ambush.context.framing).toBe("mundane-threat");
  });
});

describe("deriveHuntQuarry — pathway/sequence-aligned, never a friend", () => {
  it("ignores a present ally entirely — a hunt never targets the cast", () => {
    // A present "ally" in the scene must never be fielded as the quarry; the hunt
    // reads neither `npcsPresent` nor the roster.
    const quarry = deriveHuntQuarry(
      makeGameState({
        npcsPresent: ["Trusted Friend"],
        currentCity: "backlund",
        sequenceLevel: 9,
        pathwayId: 10, // White Tower — no catalogued carrier, so synthesized
      }),
    );
    expect(quarry.enemy.name).not.toBe("Trusted Friend");
    expect(quarry.source).toBe("bestiary");
    expect(quarry.context.isKnownPerson).toBe(false);
  });

  it("synthesizes a Beyonder of the player's OWN pathway at the target rung", () => {
    // White Tower (10) player at Seq 9 → hunts the Sequence 8 White Tower
    // Characteristic, so the quarry is a Sequence 8 White Tower Beyonder.
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 9, pathwayId: 10, currentCity: "backlund" }),
    );
    expect(quarry.enemy.isBeyonder).toBe(true);
    expect(quarry.enemy.pathwayId).toBe(10);
    expect(quarry.enemy.sequenceLevel).toBe(8); // targetSeq = sequenceLevel - 1
    const pathway = getPathway(10)!;
    const seq = getSequence(10, 8)!;
    expect(quarry.enemy.name).toBe(`a rogue ${seq.name} of the ${pathway.name} Pathway`);
    expect(quarry.enemy.knownAbilities).toEqual(
      seq.abilities.slice(0, 3).map((a) => a.name),
    );
    expect(quarry.context.framing).toBe("hostile-beyonder");
  });

  it("aligns the quarry to the explicit hunt targetSeq when provided", () => {
    // A Visionary (2) player at Seq 7 hunting a Sequence 6 Characteristic.
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 7, pathwayId: 2, currentCity: "tingen" }),
      { targetSeq: 6 },
    );
    expect(quarry.enemy.pathwayId).toBe(2);
    expect(quarry.enemy.sequenceLevel).toBe(6);
    expect(quarry.enemy.name).toBe(
      `a rogue ${getSequence(2, 6)!.name} of the ${getPathway(2)!.name} Pathway`,
    );
  });

  it("prefers a catalogued carrier of the player's pathway + sequence (the Devil Dog for an Abyss hunter)", () => {
    // Abyss (21) hunter at Seq 8 in Backlund → target Seq 7, where the Devil Dog
    // (Abyss, band [6,7]) IS the canonical bearer.
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 8, pathwayId: 21, currentCity: "backlund" }),
    );
    expect(quarry.enemy.bestiaryId).toBe("backlund-devil-dog");
    expect(quarry.enemy.pathwayId).toBe(21);
    expect(quarry.source).toBe("bestiary");
    expect(quarry.enemy.sequenceLevel).toBe(7); // scaled to targetSeq, in-band
  });

  it("scales the catalogued carrier to the HUNTED rung, not the current Sequence", () => {
    // An explicit hunt targetSeq (6) below the current-Sequence default (sequence
    // 8 → 7) must drive the curated enemy's rung, mirroring the synthesize branch
    // — the Devil Dog band [6,7] still covers 6, so it resolves to exactly 6.
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 8, pathwayId: 21, currentCity: "backlund" }),
      { targetSeq: 6 },
    );
    expect(quarry.enemy.bestiaryId).toBe("backlund-devil-dog");
    expect(quarry.enemy.sequenceLevel).toBe(6);
  });

  it("never fields the Devil Dog for a hunter on a different pathway (the reported bug)", () => {
    // A Fool (1) hunter in Backlund must NOT be handed the Abyss Devil Dog.
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 8, pathwayId: 1, currentCity: "backlund" }),
    );
    expect(quarry.enemy.bestiaryId).toBeUndefined();
    expect(quarry.enemy.pathwayId).toBe(1); // the player's OWN pathway
    expect(quarry.enemy.sequenceLevel).toBe(7);
  });

  it("falls back to a generic framed foe when no canon pathway data exists", () => {
    // An out-of-range pathway id has no canon sequence/pathway data → generic foe.
    const quarry = deriveHuntQuarry(makeGameState({ sequenceLevel: 9 }), {
      pathwayId: 999,
    });
    expect(quarry.enemy.name).toBe("a lurking Beyonder");
    expect(quarry.context.framing).toBe("hostile-beyonder");
  });
});

/** The first main-ingredient item for advancing into `target` on a pathway. */
function mainIngredientFor(pathwayId: number, target: number): Item | undefined {
  return getSequence(pathwayId, target)?.prerequisiteItems.find(
    (i) => i.category === "main-ingredient",
  );
}

/** Every main-ingredient item for advancing into `target` on a pathway. */
function mainIngredientsFor(pathwayId: number, target: number): Item[] {
  return (getSequence(pathwayId, target)?.prerequisiteItems ?? []).filter(
    (i) => i.category === "main-ingredient",
  );
}

describe("deriveHuntQuarry — matches the hunted ingredient (creatures vs characteristics)", () => {
  it("hunts a Beyonder of the TARGET rung's own role for a role-Characteristic rung (same tier)", () => {
    // White Tower (10) is undocumented in the corpus material map, so each rung
    // takes the canon "Or a {role} Beyonder Characteristic" option. The Seq-4
    // Prophet potion takes a Prophet (Seq 4) Characteristic → a Seq-4 Prophet foe.
    const huntItem = mainIngredientFor(10, 4)!;
    expect(huntItem.name).toBe("Prophet Beyonder Characteristic");
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 5, pathwayId: 10, currentCity: "backlund" }),
      { targetSeq: 4, huntItem },
    );
    expect(quarry.enemy.pathwayId).toBe(10);
    expect(quarry.enemy.sequenceLevel).toBe(4); // the TARGET rung, same as the potion
    expect(quarry.enemy.name).toBe("a rogue Prophet of the White Tower Pathway");
  });

  it("prefers the catalogued carrier when one bears the TARGET rung's Characteristic", () => {
    // An Abyss (21) hunter at Seq 8 → target 7; the Seq-7 potion takes that rung's
    // own Beyonder Characteristic, and the Devil Dog (Abyss, band [6,7]) IS its
    // canon bearer — so the hunt fields the Devil Dog, not a synthesized foe.
    const huntItem = mainIngredientFor(21, 7)!;
    expect(huntItem.name).toMatch(/Beyonder Characteristic$/);
    const quarry = deriveHuntQuarry(
      makeGameState({ sequenceLevel: 8, pathwayId: 21, currentCity: "backlund" }),
      { targetSeq: 7, huntItem },
    );
    expect(quarry.enemy.bestiaryId).toBe("backlund-devil-dog");
    expect(quarry.enemy.sequenceLevel).toBe(7);
  });

  it("hunts the CREATURE (a beast) for a canon monster-material ingredient, never a pathway Beyonder", () => {
    // Fool (1) at Seq 9 → target 8; the Seq-8 potion's canon primary main material
    // is the "Hornacis Gray Mountain Goat Horn" — a creature material, so the
    // quarry is that creature, framed as a beast that drops no Characteristic.
    const huntItem = mainIngredientFor(1, 8)!;
    expect(huntItem.name).toBe("Hornacis Gray Mountain Goat Horn");
    const quarry = deriveHuntQuarry(makeGameState({ sequenceLevel: 9, pathwayId: 1 }), {
      targetSeq: 8,
      huntItem,
    });
    expect(quarry.enemy.isBeyonder).toBe(false);
    expect(quarry.enemy.pathwayId).toBeUndefined();
    expect(quarry.context.framing).toBe("beast");
    expect(quarry.enemy.name).toBe("the Hornacis Gray Mountain Goat");
    expect(quarry.enemy.description).toContain("Hornacis Gray Mountain Goat Horn");
  });

  it("hunts the canon CREATURE for a documented rung (the Faceless rung → the Thousand-faced Hunter)", () => {
    // Fool Seq 6 (Faceless) canon primary = "Mutated pituitary gland of a
    // Thousand-faced Hunter" → hunt the Thousand-faced Hunter beast.
    const huntItem = mainIngredientFor(1, 6)!;
    expect(huntItem.name).toBe("Mutated pituitary gland of a Thousand-faced Hunter");
    const quarry = deriveHuntQuarry(makeGameState({ sequenceLevel: 7, pathwayId: 1 }), {
      targetSeq: 6,
      huntItem,
    });
    expect(quarry.enemy.isBeyonder).toBe(false);
    expect(quarry.context.framing).toBe("beast");
    expect(quarry.enemy.name).toBe("the Thousand-faced Hunter");
  });

  it("is accurate for EVERY pathway, sequence, and main ingredient (comprehensive integrity sweep)", () => {
    let sawCanonMaterial = false;
    for (const pathway of ALL_PATHWAYS) {
      for (let current = 9; current >= 2; current--) {
        const target = current - 1;
        for (const huntItem of mainIngredientsFor(pathway.id, target)) {
          const quarry = deriveHuntQuarry(
            makeGameState({ sequenceLevel: current, pathwayId: pathway.id }),
            { targetSeq: target, huntItem },
          );
          const where = `${pathway.name} target ${target}: "${huntItem.name}"`;
          // No malformed names anywhere.
          expect(quarry.enemy.name, where).not.toMatch(/undefined|unknown|NaN/i);
          expect(quarry.enemy.name.length, where).toBeGreaterThan(0);
          expect(quarry.enemy.knownAbilities?.length ?? 0, where).toBeGreaterThan(0);

          if (/Beyonder Characteristic/i.test(huntItem.name)) {
            // A role Beyonder Characteristic hunt → a Beyonder of the player's OWN
            // pathway at the TARGET rung (same tier as the potion), the ingredient
            // named for that rung's own role.
            expect(quarry.enemy.isBeyonder, where).toBe(true);
            expect(quarry.enemy.pathwayId, where).toBe(pathway.id);
            expect(quarry.enemy.sequenceLevel, where).toBe(target);
            expect(huntItem.name, where).toBe(
              `${getSequence(pathway.id, target)!.name} Beyonder Characteristic`,
            );
          } else {
            // A canon monster material → that beast, never a pathway Beyonder.
            sawCanonMaterial = true;
            expect(quarry.enemy.isBeyonder, where).toBe(false);
            expect(quarry.enemy.pathwayId, where).toBeUndefined();
            expect(quarry.context.framing, where).toBe("beast");
            expect(quarry.enemy.name, where).toBe(
              `the ${creatureFromMaterial(huntItem.name)}`,
            );
          }
        }
      }
    }
    // The corpus documents monster materials for several pathways — assert the
    // material (beast) branch was actually exercised, not just the Characteristic one.
    expect(sawCanonMaterial).toBe(true);
  });
});

describe("creatureFromMaterial", () => {
  it("strips a trailing body-part / harvested-material phrase", () => {
    expect(creatureFromMaterial("Hornacis Mountain Goat Horn Crystal")).toBe(
      "Hornacis Mountain Goat",
    );
    expect(creatureFromMaterial("Psychic Dragon Pituitary Gland")).toBe("Psychic Dragon");
    expect(creatureFromMaterial("Lavos Squid Blood")).toBe("Lavos Squid");
    expect(creatureFromMaterial("Sphinx Brain")).toBe("Sphinx");
    expect(creatureFromMaterial("Soul-Grazing Beast Stomach")).toBe("Soul-Grazing Beast");
  });

  it("takes the creature tail of a '{part} of a/an/the {creature}' material", () => {
    expect(creatureFromMaterial("Eye of a Dreamweaver Spider")).toBe(
      "Dreamweaver Spider",
    );
    expect(creatureFromMaterial("Scale of a Golden Serpent")).toBe("Golden Serpent");
    expect(creatureFromMaterial("Skull of an Underworld Wanderer")).toBe(
      "Underworld Wanderer",
    );
    expect(creatureFromMaterial("Fruit of the Tree of Elders")).toBe("Tree of Elders");
  });

  it("keeps an article-less or whole-entity material intact (no degradation)", () => {
    expect(creatureFromMaterial("Shadow of Death")).toBe("Shadow of Death");
    expect(creatureFromMaterial("Source of Mad Dreams")).toBe("Source of Mad Dreams");
    expect(creatureFromMaterial("Crystal Sunflower")).toBe("Crystal Sunflower");
    expect(creatureFromMaterial("Wandering Hide")).toBe("Wandering Hide");
  });

  it("takes the head of a possessive '{creature}'s {part}' canon material", () => {
    expect(creatureFromMaterial("Lavos Squid's Blood")).toBe("Lavos Squid");
    expect(creatureFromMaterial("Gray Demonic Wolf's front claws")).toBe(
      "Gray Demonic Wolf",
    );
    expect(creatureFromMaterial("Sun Divine Bird's tail feathers")).toBe(
      "Sun Divine Bird",
    );
    expect(creatureFromMaterial("Matured Manhal Fish's Eyeball")).toBe(
      "Matured Manhal Fish",
    );
  });

  it("parses the lowercase-cased canon body-part forms (case-insensitive)", () => {
    expect(creatureFromMaterial("Fire Salamander gland")).toBe("Fire Salamander");
    expect(creatureFromMaterial("Magma Giant's core")).toBe("Magma Giant");
    expect(creatureFromMaterial("Succubus eyes")).toBe("Succubus");
    expect(creatureFromMaterial("Black Hunting Spider Composite Eyes")).toBe(
      "Black Hunting Spider",
    );
  });

  it("yields a non-empty creature for EVERY canon monster-material ingredient", () => {
    for (const pathway of ALL_PATHWAYS) {
      for (let s = 9; s >= 1; s--) {
        const main = mainIngredientFor(pathway.id, s);
        if (!main || /Characteristic/i.test(main.name)) continue;
        const creature = creatureFromMaterial(main.name);
        expect(creature.length, main.name).toBeGreaterThan(0);
        expect(creature, main.name).toBe(creature.trim());
        // The body-part suffixes must not survive as the creature's whole name.
        expect(creature, main.name).not.toMatch(/ (Pituitary Gland|Horn Crystal)$/);
      }
    }
  });
});

describe("bestiaryFoeToEnemy", () => {
  it("scales a curated foe to the player while keeping canon data", () => {
    const devilDog = getBestiaryFoe("backlund-devil-dog")!;
    const enemy = bestiaryFoeToEnemy(devilDog, 9);
    expect(enemy.name).toContain("Devil Dog");
    expect(enemy.isBeyonder).toBe(true);
    expect(enemy.pathwayId).toBe(21);
    expect(enemy.bestiaryId).toBe("backlund-devil-dog");
    expect(enemy.knownAbilities).toEqual(devilDog.signatureAbilities);
    // Stays inside the canon band [6,7].
    expect(enemy.sequenceLevel).toBeGreaterThanOrEqual(6);
    expect(enemy.sequenceLevel).toBeLessThanOrEqual(7);
  });

  it("omits the pathway for a mundane foe", () => {
    const thugs = getBestiaryFoe("generic-desperate-thugs")!;
    const enemy = bestiaryFoeToEnemy(thugs, 9);
    expect(enemy.isBeyonder).toBe(false);
    expect(enemy.pathwayId).toBeUndefined();
  });
});

describe("createEncounter framing + kit capture (issues #187)", () => {
  it("captures the combat kit and the passed context", () => {
    const context = makeEncounterContext("coerced", { isKnownPerson: true });
    const encounter = createEncounter({
      id: "ck",
      enemy: makeEnemy({ isBeyonder: true }),
      context,
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(encounter.context).toEqual(context);
    expect((encounter.availableKit ?? []).length).toBeGreaterThan(0);
  });

  it("defaults a context from the enemy when none is passed", () => {
    const beyonder = createEncounter({
      id: "d1",
      enemy: makeEnemy({ isBeyonder: true }),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(beyonder.context?.framing).toBe("hostile-beyonder");
    const mundane = createEncounter({
      id: "d2",
      enemy: makeEnemy({ isBeyonder: false }),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(mundane.context?.framing).toBe("mundane-threat");
  });
});

describe("end-to-end resolution lines (Phase 4)", () => {
  // Pick the first option matching a predicate at each point; resolve.
  function playLine(
    encounter: CombatEncounter,
    pickId: (point: CombatEncounter["decisionPoints"][number]) => string,
  ): CombatEncounter {
    let current = encounter;
    for (let i = 0; i < current.decisionPoints.length; i++) {
      const point = current.decisionPoints[current.decisionIndex];
      current = chooseOption(current, pickId(point));
    }
    return resolveEncounter(current);
  }

  function controlledAlly(): CombatEncounter {
    return applyPreparation(
      createEncounter({
        id: "free",
        enemy: makeEnemy({ isBeyonder: true, sequenceLevel: 9 }),
        context: makeEncounterContext("mind-controlled", { isKnownPerson: true }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough" }),
    );
  }

  it("offers a snap-free line for a mind-controlled ally and frees them on a committed win", () => {
    const resolved = playLine(controlledAlly(), (point) => {
      const free = point.options.find((o) => o.resolutionLine === "free");
      if (free) return free.id;
      // Otherwise take the strongest-modifier option to secure the win.
      return [...point.options].sort((a, b) => b.modifier - a.modifier)[0].id;
    });
    expect(resolved.outcome).toBe("freed");
  });

  it("talks a reconcilable rival down with a sustained de-escalation", () => {
    const encounter = applyPreparation(
      createEncounter({
        id: "talk",
        enemy: makeEnemy({ isBeyonder: true }),
        context: makeEncounterContext("rival-motive", { isKnownPerson: true }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    const resolved = playLine(encounter, (point) => {
      const talk = point.options.find((o) => o.resolutionLine === "talk-down");
      return (talk ?? point.options[0]).id;
    });
    expect(resolved.outcome).toBe("talked-down");
  });
});

describe("combatNarrationContext framing line (Phase 6)", () => {
  it("prepends a framing line for a special framing", () => {
    const encounter = applyPreparation(
      createEncounter({
        id: "narr",
        enemy: makeEnemy({ isBeyonder: true }),
        context: makeEncounterContext("mind-controlled", {
          isKnownPerson: true,
          controllerName: "The Puppeteer",
        }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    expect(combatNarrationContext(encounter)).toContain("Mind-controlled");
  });

  it("stays silent on framing for an ordinary hostile fight", () => {
    const encounter = createEncounter({
      id: "narr2",
      enemy: makeEnemy({ isBeyonder: true }),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    expect(combatNarrationContext(encounter)).toBe("");
  });

  it("narrates the pursued resolution line and a fraying control tier", () => {
    let e = applyPreparation(
      createEncounter({
        id: "narr3",
        enemy: makeEnemy({ isBeyonder: true }),
        context: makeEncounterContext("mind-controlled", { isKnownPerson: true }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    // Pick the snap-free line at the first point.
    const free = e.decisionPoints[0].options.find((o) => o.resolutionLine === "free")!;
    e = chooseOption(e, free.id);
    const ctx = combatNarrationContext(e);
    expect(ctx).toContain("break the control over them");
  });

  it("narrates a slipping control tier", () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "narr4",
        enemy: makeEnemy({ isBeyonder: true }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    const slipping: CombatEncounter = { ...prepared, controlTier: "slipping" };
    expect(combatNarrationContext(slipping)).toContain("slipping");
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

  it("accepts a string hunt objective and rejects a non-string one", () => {
    expect(isValidEncounterShape({ ...valid, huntTarget: "a Characteristic" })).toBe(
      true,
    );
    expect(isValidEncounterShape({ ...valid, huntTarget: undefined })).toBe(true);
    expect(isValidEncounterShape({ ...valid, huntTarget: 42 })).toBe(false);
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

  it("produces the configured number of decision points with the templated trio plus kit/line options", () => {
    const encounter = preparedEncounter();
    const points = generateDecisionPoints(encounter);
    expect(points).toHaveLength(DECISION_POINT_COUNT);
    expect(points).toEqual(encounter.decisionPoints);
    for (const point of points) {
      // The three templated tactics are always present, now joined by combat-kit
      // ability options and an outcome-spectrum resolution line (issue #187).
      expect(point.options.length).toBeGreaterThanOrEqual(4);
      expect(point.options.some((o) => o.kind === "aggressive")).toBe(true);
      expect(point.options.some((o) => o.resolutionLine)).toBe(true);
    }
  });

  it("surfaces combat-kit ability options with effect tags (Phase 2)", () => {
    const points = preparedEncounter().decisionPoints;
    const kitOptions = points
      .flatMap((p) => p.options)
      .filter((o) => o.id.includes("-kit-"));
    expect(kitOptions.length).toBeGreaterThan(0);
    expect(kitOptions.every((o) => o.kind === "ability" && !!o.abilityName)).toBe(true);
    expect(kitOptions.every((o) => !!o.effectTag)).toBe(true);
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

  it("scales the templated ability option with intelligence (investigation rewards)", () => {
    const noIntel = preparedEncounter({ intelligence: "none" });
    const thorough = preparedEncounter({ intelligence: "thorough" });
    // The templated ability option (POINT_KINDS[1] includes "ability") has the
    // stable id suffix `-ability`; kit options use `-kit-` ids.
    const templatedAbilityModifier = (e: CombatEncounter) =>
      e.decisionPoints
        .flatMap((p) => p.options)
        .find((o) => o.kind === "ability" && o.id.endsWith("-ability"))!.modifier;
    expect(templatedAbilityModifier(thorough)).toBeGreaterThan(
      templatedAbilityModifier(noIntel),
    );
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

// ─── Dynamic mid-fight options ───────────────────────────────────────

describe("dynamic abilities & artifacts mid-fight", () => {
  function dynamicEncounter(
    availableAbilities: string[],
    availableArtifacts: Item[],
  ): CombatEncounter {
    const encounter = createEncounter({
      id: "dyn",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
      availableAbilities,
      availableArtifacts,
    });
    return applyPreparation(encounter, makePrep());
  }

  it("offers acquired/stolen powers as named options alongside the combat kit", () => {
    // `availableAbilities` now carries only copied/stolen powers — the pathway's
    // own abilities come from the kit (issue #187, Phase 2).
    const points = dynamicEncounter(["Borrowed Foresight"], []).decisionPoints;
    for (const point of points) {
      const acquired = point.options.find((o) => o.abilityName === "Borrowed Foresight");
      expect(acquired).toBeDefined();
      expect(acquired!.label).toContain("Borrowed Foresight");
      expect(acquired!.effectTag).toBe("Acquired power");
      // The kit also supplies named ability options.
      expect(point.options.some((o) => o.id.includes("-kit-"))).toBe(true);
    }
  });

  it("does not repeat a single acquired power within one decision point", () => {
    const point = dynamicEncounter(["Lone Power"], []).decisionPoints[0];
    expect(point.options.filter((o) => o.abilityName === "Lone Power")).toHaveLength(1);
  });

  it("offers carried artifacts as consuming options, allocated without duplication", () => {
    const artifacts = [makeItem("Charm A"), makeItem("Charm B")];
    const points = dynamicEncounter([], artifacts).decisionPoints;
    const offered = points
      .flatMap((p) => p.options)
      .filter((o) => o.artifactItem)
      .map((o) => o.artifactItem!.name);
    // Every carried artifact is offered (one per point), and none offered twice.
    expect(new Set(offered).size).toBe(offered.length);
    expect(new Set(offered)).toEqual(new Set(["Charm A", "Charm B"]));
    for (const point of points) {
      for (const option of point.options.filter((o) => o.artifactItem)) {
        expect(option.consumesArtifact).toBe(true);
      }
    }
  });

  it("does not also offer a carried artifact dynamically when it was readied as a sealed-prep artifact", () => {
    // One physical item must not be spendable twice (sealed slot + dynamic).
    const charm = makeItem("Sealed Charm");
    const other = makeItem("Loose Talisman");
    const encounter = applyPreparation(
      createEncounter({
        id: "dyn-sealed",
        enemy: makeEnemy(),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
        availableArtifacts: [charm, other],
      }),
      makePrep({ sealedArtifacts: [charm] }),
    );
    const dynamicNames = encounter.decisionPoints
      .flatMap((p) => p.options)
      .filter((o) => o.artifactItem)
      .map((o) => o.artifactItem!.name);
    expect(dynamicNames).not.toContain("Sealed Charm");
    expect(dynamicNames).toContain("Loose Talisman");
  });

  it("regenerates identical decision points from the same encounter (determinism)", () => {
    const encounter = dynamicEncounter(["A", "B"], [makeItem("Charm")]);
    expect(generateDecisionPoints(encounter)).toEqual(encounter.decisionPoints);
  });

  it("attaches dynamic options on the ambush path too", () => {
    const encounter = createEncounter({
      id: "amb",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      ambush: true,
      randomFactor: 0.5,
      availableAbilities: ["Reflex"],
    });
    expect(
      encounter.decisionPoints.flatMap((p) => p.options).some((o) => o.abilityName),
    ).toBe(true);
  });
});

// ─── Grade-scaled Sealed Artifact power (issue #171) ─────────────────

describe("grade-scaled Sealed Artifact power", () => {
  const grade0 = mintArtifactItem(getSealedArtifact("0-08")!); // Angel-tier
  const grade3 = mintArtifactItem(getSealedArtifact("3-0782")!); // low-Sequence

  function artifactOptionModifier(item: Item): number {
    const encounter = applyPreparation(
      createEncounter({
        id: `grade-${item.name}`,
        enemy: makeEnemy(),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
        availableArtifacts: [item],
      }),
      makePrep(),
    );
    const option = encounter.decisionPoints
      .flatMap((p) => p.options)
      .find((o) => o.artifactItem?.name === item.name);
    expect(option).toBeDefined();
    return option!.modifier;
  }

  it("gives a higher-grade artifact a larger mid-fight swing than a lower-grade one", () => {
    expect(artifactOptionModifier(grade0)).toBeGreaterThan(
      artifactOptionModifier(grade3),
    );
  });

  it("scales the readied-prep score by grade (a Grade 0 readied artifact counts for more)", () => {
    const g0 = scorePreparation(makePrep({ sealedArtifacts: [grade0] }), false);
    const g3 = scorePreparation(makePrep({ sealedArtifacts: [grade3] }), false);
    expect(g0.breakdown.sealedArtifacts).toBeGreaterThan(g3.breakdown.sealedArtifacts);
  });

  it("keeps the flat baseline for a non-catalogue 'artifact' item (unchanged balance)", () => {
    // makeItem produces a non-sealed item with no resolvable grade.
    expect(artifactOptionModifier(makeItem("Loose Charm"))).toBeCloseTo(0.2, 5);
  });

  it("preparation still decides: a thoroughly-prepared fighter out-advantages a lone Grade 0 artifact", () => {
    // A well-prepared Beyonder (intel + terrain + abilities + an even matchup)
    // enters with a base advantage that exceeds a single Grade 0 artifact swing,
    // so the artifact never single-handedly decides the fight.
    const prepared = scorePreparation(
      makePrep({
        intelligence: "thorough",
        terrain: "favorable",
        readiedAbilities: ["one", "two", "three"],
      }),
      false,
    ).score;
    const loneArtifactPrep = scorePreparation(
      makePrep({ sealedArtifacts: [grade0] }),
      false,
    ).score;
    expect(prepared).toBeGreaterThan(loneArtifactPrep);
    // And the single artifact swing (≤0.36) is smaller than the prep-score gap.
    expect(artifactOptionModifier(grade0)).toBeLessThan(prepared - loneArtifactPrep);
  });
});

// ─── Pathway Combat Styles (ids 5-9) ─────────────────────────────────

describe("new pathway combat styles", () => {
  function styleEncounter(pathwayId: number): CombatEncounter {
    const encounter = createEncounter({
      id: `style-${pathwayId}`,
      enemy: makeEnemy(),
      playerPathwayId: pathwayId,
      playerSequence: 9,
      randomFactor: 0.5,
    });
    return applyPreparation(encounter, makePrep());
  }

  it.each([5, 6, 7, 8, 9])(
    "pathway %i has a distinct, fully-populated combat style",
    (pathwayId) => {
      const options = styleEncounter(pathwayId).decisionPoints.flatMap((p) => p.options);
      // Every kind reached across the points carries a non-fallback label.
      for (const option of options) {
        expect(option.label.length).toBeGreaterThan(0);
        expect(option.description.length).toBeGreaterThan(0);
        expect(option.label).not.toBe("Press the attack");
      }
    },
  );

  it("each new pathway's options differ from the fallback and each other", () => {
    const evasiveLabel = (pathwayId: number) =>
      styleEncounter(pathwayId).decisionPoints[0].options.find(
        (o) => o.kind === "evasive",
      )!.label;
    const fallback = styleEncounter(99).decisionPoints[0].options.find(
      (o) => o.kind === "evasive",
    )!.label;
    const labels = [5, 6, 7, 8, 9].map(evasiveLabel);
    for (const label of labels) {
      expect(label).not.toBe(fallback);
    }
    // Darkness (5) and Door (7) both signature-evade but with distinct flavour.
    expect(labels[0]).not.toBe(labels[2]);
  });

  it("surfaces each new pathway's flavour in the narrative summary", () => {
    for (const pathwayId of [5, 6, 7, 8, 9]) {
      const encounter = resolveEncounter({
        ...styleEncounter(pathwayId),
        baseAdvantage: 0.5,
      });
      expect(encounter.result?.narrativeSummary.length ?? 0).toBeGreaterThan(0);
    }
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

  // Mirror of the engine's STANCE_MODIFIER table (issue #187, Phase 3b).
  const STANCE_ADJ: Record<string, Partial<Record<string, number>>> = {
    pressing: { aggressive: -0.05, defensive: 0.04, evasive: 0.04 },
    guarded: { aggressive: -0.04, ability: 0.02 },
    reeling: { aggressive: 0.05, ability: 0.03 },
    desperate: { aggressive: 0.06, defensive: -0.03 },
  };

  it("records the choice, accumulates its modifier plus the stance shift, and advances", () => {
    const encounter = prepared();
    const point = encounter.decisionPoints[0];
    const option = point.options[0];
    const next = chooseOption(encounter, option.id);
    expect(next.chosenOptionIds).toEqual([option.id]);
    // The accumulated modifier = the option modifier + the active enemy stance's
    // shift for that tactic (issue #187, Phase 3b).
    const adj = STANCE_ADJ[point.enemyStance!]?.[option.kind] ?? 0;
    expect(next.accumulatedModifier).toBeCloseTo(option.modifier + adj, 5);
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

describe("combatNarrationContext", () => {
  function freshEncounter(): CombatEncounter {
    return createEncounter({
      id: "n1",
      enemy: makeEnemy(),
      playerPathwayId: 1,
      playerSequence: 9,
      randomFactor: 0.5,
    });
  }

  it("returns an empty string before any preparation is committed", () => {
    expect(combatNarrationContext(freshEncounter())).toBe("");
  });

  it("summarizes the committed preparation once the exchange begins", () => {
    const prepared = applyPreparation(
      freshEncounter(),
      makePrep({
        intelligence: "thorough",
        terrain: "favorable",
        readiedAbilities: ["Spirit Vision"],
        sealedArtifacts: [makeItem("Sealed Idol")],
        ritualMaterials: [makeItem("Chalk")],
      }),
    );
    const context = combatNarrationContext(prepared);
    expect(context).toMatch(/thorough intelligence/);
    expect(context).toMatch(/favourable ground/);
    expect(context).toMatch(/readied abilities: Spirit Vision/);
    expect(context).toMatch(/sealed artifacts: Sealed Idol/);
    expect(context).toMatch(/ritual materials: Chalk/);
    // Nothing has been chosen yet, so the tactics clause is absent.
    expect(context).not.toMatch(/Tactics chosen/);
  });

  it("appends the chosen tactics, in order, once options are picked", () => {
    let encounter = applyPreparation(
      freshEncounter(),
      makePrep({ intelligence: "partial" }),
    );
    const firstLabel = encounter.decisionPoints[0].options[0].label;
    encounter = chooseOption(encounter, encounter.decisionPoints[0].options[0].id);
    const context = combatNarrationContext(encounter);
    expect(context).toMatch(/partial intelligence/);
    expect(context).toMatch(/Tactics chosen, in order:/);
    expect(context).toContain(firstLabel);
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
  const baseOutcome = (
    overrides: Partial<Parameters<typeof resolveOutcome>[0]> = {},
  ): Parameters<typeof resolveOutcome>[0] => ({
    finalAdvantage: 0,
    decisionCount: 3,
    evasiveCount: 0,
    framing: "hostile-beyonder",
    reconcilable: false,
    lines: { subdue: 0, free: 0, "talk-down": 0, capture: 0, spare: 0 },
    ...overrides,
  });

  it("returns victory at or above the victory threshold", () => {
    expect(resolveOutcome(baseOutcome({ finalAdvantage: VICTORY_THRESHOLD }))).toBe(
      "victory",
    );
  });

  it("returns escape when evasive choices dominate and it is not a victory", () => {
    expect(resolveOutcome(baseOutcome({ evasiveCount: 2 }))).toBe("escape");
  });

  it("returns defeat at or below the defeat threshold", () => {
    expect(resolveOutcome(baseOutcome({ finalAdvantage: DEFEAT_THRESHOLD }))).toBe(
      "defeat",
    );
  });

  it("returns stalemate in the middle band", () => {
    expect(resolveOutcome(baseOutcome())).toBe("stalemate");
  });

  it("never escapes with no decision points", () => {
    expect(resolveOutcome(baseOutcome({ decisionCount: 0 }))).toBe("stalemate");
  });

  it("subdues on a winning advantage when a subdue line was pursued", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: VICTORY_THRESHOLD,
          lines: { subdue: 1, free: 0, "talk-down": 0, capture: 0, spare: 0 },
        }),
      ),
    ).toBe("subdued");
  });

  it("frees a mind-controlled ally on a committed snap-free line + a win", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: VICTORY_THRESHOLD,
          framing: "mind-controlled",
          reconcilable: true,
          lines: { subdue: 0, free: 2, "talk-down": 0, capture: 0, spare: 0 },
        }),
      ),
    ).toBe("freed");
  });

  it("does NOT free without the committed line even on a win", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: VICTORY_THRESHOLD,
          framing: "mind-controlled",
          reconcilable: true,
          lines: { subdue: 0, free: 1, "talk-down": 0, capture: 0, spare: 0 },
        }),
      ),
    ).toBe("victory");
  });

  it("talks a reconcilable foe down on a committed de-escalation, even without a win", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: 0,
          framing: "rival-motive",
          reconcilable: true,
          lines: { subdue: 0, free: 0, "talk-down": 2, capture: 0, spare: 0 },
        }),
      ),
    ).toBe("talked-down");
  });

  it("does NOT talk down while being routed", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: DEFEAT_THRESHOLD,
          framing: "rival-motive",
          reconcilable: true,
          lines: { subdue: 0, free: 0, "talk-down": 3, capture: 0, spare: 0 },
        }),
      ),
    ).toBe("defeat");
  });

  it("captures or spares a beaten foe by the chosen line", () => {
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: VICTORY_THRESHOLD,
          lines: { subdue: 0, free: 0, "talk-down": 0, capture: 1, spare: 0 },
        }),
      ),
    ).toBe("captured");
    expect(
      resolveOutcome(
        baseOutcome({
          finalAdvantage: VICTORY_THRESHOLD,
          lines: { subdue: 0, free: 0, "talk-down": 0, capture: 0, spare: 1 },
        }),
      ),
    ).toBe("spared");
  });
});

describe("isWinningOutcome", () => {
  it("treats every win-shape as a win and the rest as not", () => {
    for (const o of [
      "victory",
      "subdued",
      "freed",
      "talked-down",
      "captured",
      "spared",
    ] as const) {
      expect(isWinningOutcome(o)).toBe(true);
    }
    for (const o of ["defeat", "escape", "stalemate"] as const) {
      expect(isWinningOutcome(o)).toBe(false);
    }
  });
});

describe("computeConsequences — outcome spectrum (Phase 4)", () => {
  function beyonderEncounter(): CombatEncounter {
    return resolveEncounter(
      applyPreparation(
        createEncounter({
          id: "spec",
          enemy: makeEnemy({ isBeyonder: true, pathwayId: 4, sequenceLevel: 8 }),
          context: makeEncounterContext("mind-controlled", { isKnownPerson: true }),
          playerPathwayId: 1,
          playerSequence: 9,
          randomFactor: 0.5,
        }),
        makePrep(),
      ),
    );
  }

  it("drops no loot or characteristic for a reconciled (non-lethal) outcome", () => {
    const encounter = beyonderEncounter();
    for (const outcome of [
      "subdued",
      "freed",
      "talked-down",
      "captured",
      "spared",
    ] as const) {
      const result = computeConsequences(encounter, outcome, 0.3);
      expect(result.itemsGained).toEqual([]);
      expect(result.characteristicsDropped).toEqual([]);
    }
  });

  it("still drops loot and a characteristic for a lethal victory", () => {
    const encounter: CombatEncounter = {
      ...beyonderEncounter(),
      enemy: {
        ...makeEnemy({ isBeyonder: true, pathwayId: 4, sequenceLevel: 8 }),
        loot: [makeItem("Spoils")],
      },
    };
    const result = computeConsequences(encounter, "victory", 0.3);
    expect(result.itemsGained).toEqual([makeItem("Spoils")]);
    expect(result.characteristicsDropped).toHaveLength(1);
  });

  it("inflicts no injury when a fight ends in words (talked-down)", () => {
    const encounter = beyonderEncounter();
    const result = computeConsequences(encounter, "talked-down", -0.1);
    expect(result.injuries).toEqual([]);
  });

  it("drains less sanity for a reconciled outcome than a bloody victory", () => {
    const encounter = beyonderEncounter();
    const talked = computeConsequences(encounter, "talked-down", 0.3).sanityImpact;
    const won = computeConsequences(encounter, "victory", 0.3).sanityImpact;
    // Sanity impacts are ≤ 0; a lighter drain is the larger (closer to 0) value.
    expect(talked).toBeGreaterThanOrEqual(won);
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

  it("applies a sanity backlash when a Sealed Artifact is invoked, but does NOT destroy it (§4.6)", () => {
    const artifact = mintArtifactItem(getSealedArtifact("0-08")!); // Grade 0
    const base = resolvedWith("victory", { sequenceLevel: 7 }, 0.5);
    const withArtifact: CombatEncounter = {
      ...base,
      preparation: makePrep({ sealedArtifacts: [artifact] }),
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
    const baseline = computeConsequences(base, "victory", 0.5).sanityImpact;
    const result = computeConsequences(withArtifact, "victory", 0.5);
    // The relic PERSISTS (it is not a single-use reagent) — but invoking it
    // still bites: its grade-0 backlash deepens the sanity drain.
    expect(result.itemsLost).toEqual([]);
    expect(result.sanityImpact).toBeLessThan(baseline);
  });

  it("still destroys an artifact explicitly flagged consumable (§4.6 override)", () => {
    const artifact: Item = {
      ...mintArtifactItem(getSealedArtifact("0-08")!),
      consumable: true,
    };
    const base = resolvedWith("victory", { sequenceLevel: 7 }, 0.5);
    const withArtifact: CombatEncounter = {
      ...base,
      preparation: makePrep({ sealedArtifacts: [artifact] }),
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
    const result = computeConsequences(withArtifact, "victory", 0.5);
    expect(result.itemsLost).toEqual([artifact]);
  });

  it("loses a dynamically-invoked carried artifact without double-counting sealed ones", () => {
    const dynamic = makeItem("Pocket Mirror");
    const encounter: CombatEncounter = {
      ...resolvedWith("victory", { sequenceLevel: 7 }, 0.5),
      preparation: makePrep(),
      decisionPoints: [
        {
          id: "dp",
          prompt: "",
          options: [
            {
              id: "use-dynamic",
              label: "",
              kind: "artifact",
              description: "",
              modifier: 0.2,
              consumesArtifact: true,
              artifactItem: dynamic,
            },
          ],
        },
      ],
      chosenOptionIds: ["use-dynamic"],
    };
    const result = computeConsequences(encounter, "victory", 0.5);
    expect(result.itemsLost).toEqual([dynamic]);
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

// ─── enemyIntel ──────────────────────────────────────────────────────

describe("enemyIntel", () => {
  const enemy = makeEnemy({
    name: "The Pale Visitor",
    description: "A figure wrapped in fog.",
    isBeyonder: true,
    pathwayId: 4,
    sequenceLevel: 7,
    knownAbilities: ["Command the spirits"],
  });

  it("reveals only name and description with no intelligence", () => {
    const intel = enemyIntel(enemy, "none", 9);
    expect(intel.name).toBe("The Pale Visitor");
    expect(intel.description).toBe("A figure wrapped in fog.");
    expect(intel.strength).toBeNull();
    expect(intel.sequenceLevel).toBeNull();
    expect(intel.pathwayId).toBeNull();
    expect(intel.knownAbilities).toEqual([]);
  });

  it("reveals a coarse strength read and pathway at partial intelligence", () => {
    // Enemy is Sequence 7; a Sequence 9 player is weaker, so the foe reads stronger.
    const intel = enemyIntel(enemy, "partial", 9);
    expect(intel.strength).toBe("stronger than you");
    expect(intel.pathwayId).toBe(4);
    // Exact sequence and abilities stay hidden.
    expect(intel.sequenceLevel).toBeNull();
    expect(intel.knownAbilities).toEqual([]);
  });

  it("reveals the exact sequence and known abilities at thorough intelligence", () => {
    const intel = enemyIntel(enemy, "thorough", 9);
    expect(intel.sequenceLevel).toBe(7);
    expect(intel.knownAbilities).toEqual(["Command the spirits"]);
  });

  it("reads strength relative to the player's own sequence", () => {
    // Enemy is Sequence 7: an equal at 7, weaker than a stronger (Sequence 5) player.
    expect(enemyIntel(enemy, "partial", 7).strength).toBe("your equal in standing");
    expect(enemyIntel(enemy, "partial", 5).strength).toBe("weaker than you");
  });

  it("hides the pathway for a mundane foe even at thorough", () => {
    const mundane = makeEnemy({ isBeyonder: false, sequenceLevel: 9 });
    expect(enemyIntel(mundane, "thorough", 9).pathwayId).toBeNull();
    expect(enemyIntel(mundane, "thorough", 9).knownAbilities).toEqual([]);
  });

  it("omits the description field when the enemy has none", () => {
    const bare = makeEnemy({ description: undefined });
    expect(enemyIntel(bare, "none", 9).description).toBeUndefined();
  });
});

describe("artifactBacklash", () => {
  const grade0 = mintArtifactItem(getSealedArtifact("0-08")!); // Angel-tier
  const grade3 = mintArtifactItem(getSealedArtifact("3-0782")!); // low-Sequence
  const mundane: Item = { name: "Old coin", description: "", category: "mundane" };

  it("is zero with no artifacts and ignores non-artifact items", () => {
    expect(artifactBacklash([], 0.5)).toBe(0);
    expect(artifactBacklash([mundane], 0.5)).toBe(0);
  });

  it("returns a negative drain scaled by danger grade (deeper grade = worse)", () => {
    const low = artifactBacklash([grade3], 0.5);
    const high = artifactBacklash([grade0], 0.5);
    expect(high).toBeLessThan(0);
    expect(low).toBeLessThan(0);
    // A Grade 0 relic costs strictly more sanity than a Grade 3 one.
    expect(high).toBeLessThan(low);
  });

  it("sums across multiple consumed artifacts", () => {
    const single = artifactBacklash([grade3], 0.5);
    const pair = artifactBacklash([grade3, grade3], 0.5);
    expect(pair).toBe(single * 2);
  });

  it("amplifies the backlash when the artifact lurches (high random factor)", () => {
    const calm = artifactBacklash([grade0], ARTIFACT_VOLATILE_THRESHOLD - 0.01);
    const volatile = artifactBacklash([grade0], ARTIFACT_VOLATILE_THRESHOLD);
    expect(volatile).toBeLessThan(calm);
  });

  it("still bites for a sealed artifact not found in the catalogue", () => {
    const unknown: Item = {
      name: "Sealed Artifact 9-999 — Unknown Relic",
      description: "",
      category: "sealed-artifact",
    };
    expect(artifactBacklash([unknown], 0.5)).toBeLessThan(0);
  });
});

// ─── Control meter & enemy stances (issue #187, Phase 3) ─────────────

describe("seedControlStrain", () => {
  it("starts steady at full sanity and frayed when sanity is gone", () => {
    expect(seedControlStrain(100, 100)).toBe(0);
    expect(seedControlStrain(0, 100)).toBe(0.5);
    // Half sanity → a quarter strain.
    expect(seedControlStrain(50, 100)).toBeCloseTo(0.25, 5);
    // Defensive against a zero max.
    expect(seedControlStrain(0, 0)).toBe(0);
  });
});

describe("controlTierFor", () => {
  it("maps strain to its tier at the thresholds", () => {
    expect(controlTierFor(0)).toBe("steady");
    expect(controlTierFor(0.39)).toBe("steady");
    expect(controlTierFor(0.4)).toBe("frayed");
    expect(controlTierFor(0.69)).toBe("frayed");
    expect(controlTierFor(0.7)).toBe("slipping");
    expect(controlTierFor(0.89)).toBe("slipping");
    expect(controlTierFor(0.9)).toBe("spiral");
    expect(controlTierFor(1)).toBe("spiral");
  });
});

describe("control meter accrual & recovery", () => {
  function prepared(overrides = {}): CombatEncounter {
    return applyPreparation(
      createEncounter({
        id: "ctrl",
        enemy: makeEnemy({ sequenceLevel: 5 }), // stronger foe → low edge
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
        playerSanity: 60,
        playerMaxSanity: 100,
        ...overrides,
      }),
      makePrep(),
    );
  }

  it("seeds the encounter's strain from sanity", () => {
    const e = prepared();
    expect(e.controlStrain).toBeCloseTo(0.2, 5);
    expect(e.controlTier).toBe("steady");
  });

  it("pushing an aggressive option without an edge raises strain", () => {
    const e = prepared();
    const aggressive = e.decisionPoints[0].options.find((o) => o.kind === "aggressive")!;
    expect(aggressive.strainDelta).toBeGreaterThan(0);
    const next = chooseOption(e, aggressive.id);
    expect(next.controlStrain!).toBeGreaterThan(e.controlStrain!);
  });

  it("a defensive / de-escalation choice eases strain (back off the brink)", () => {
    const e = prepared();
    const defensive = e.decisionPoints[0].options.find((o) => o.kind === "defensive")!;
    expect(defensive.strainDelta).toBeLessThan(0);
    const next = chooseOption(e, defensive.id);
    expect(next.controlStrain!).toBeLessThan(e.controlStrain!);
  });

  it("is deterministic — the same choice yields the same strain", () => {
    const e = prepared();
    const id = e.decisionPoints[0].options[0].id;
    expect(chooseOption(e, id).controlStrain).toBe(chooseOption(e, id).controlStrain);
  });
});

describe("forced-reckless at slipping", () => {
  it("drops the evasive and de-escalation options for the next point once slipping", () => {
    // Seed near slipping, then a heavy aggressive push tips into it.
    const prepared = applyPreparation(
      createEncounter({
        id: "reck",
        enemy: makeEnemy({ sequenceLevel: 5 }), // stronger foe → no edge
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    // Sit just below slipping; a no-edge aggressive push (+0.18) tips into it.
    const e: CombatEncounter = { ...prepared, controlStrain: 0.6, controlTier: "frayed" };
    const aggressive = e.decisionPoints[0].options.find((o) => o.kind === "aggressive")!;
    const next = chooseOption(e, aggressive.id);
    expect(next.controlTier).toBe("slipping");
    const upcoming = next.decisionPoints[next.decisionIndex];
    // No flee / talk / snap-free escape hatch while slipping — forced reckless.
    expect(upcoming.options.some((o) => o.kind === "evasive")).toBe(false);
    expect(
      upcoming.options.some(
        (o) => o.resolutionLine === "free" || o.resolutionLine === "talk-down",
      ),
    ).toBe(false);
    // The point is still playable (at least one option remains).
    expect(upcoming.options.length).toBeGreaterThan(0);
  });

  it("restores the safe options once the meter recovers below slipping", () => {
    const prepared = applyPreparation(
      createEncounter({
        id: "recover",
        enemy: makeEnemy({ sequenceLevel: 9 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    // Frayed, not slipping — a defensive choice eases the meter; the upcoming
    // point keeps its evasive option (no forced-reckless constraint applied).
    const e: CombatEncounter = { ...prepared, controlStrain: 0.5, controlTier: "frayed" };
    const defensive = e.decisionPoints[0].options.find((o) => o.kind === "defensive")!;
    const next = chooseOption(e, defensive.id);
    expect(next.controlTier).not.toBe("slipping");
    expect(
      next.decisionPoints[next.decisionIndex].options.some((o) => o.kind === "evasive"),
    ).toBe(true);
  });
});

describe("loss-of-control spiral routing", () => {
  function spiralEncounter(playerSequence: number, highRisk = false): CombatEncounter {
    const e = applyPreparation(
      createEncounter({
        id: "spiral",
        enemy: makeEnemy({ sequenceLevel: 5 }),
        playerPathwayId: 1,
        playerSequence,
        randomFactor: 0.5,
        highRisk,
      }),
      makePrep(),
    );
    // Force the meter to spiral, as a pushed fight would.
    return { ...e, controlStrain: 0.95, controlTier: "spiral" };
  }

  it("sets a setback verdict at a low Sequence", () => {
    const resolved = resolveEncounter(spiralEncounter(8));
    expect(resolved.result?.lossOfControl?.outcome).toBe("setback");
    expect(resolved.result?.lossOfControl?.severity).toBe("setback");
  });

  it("sets a permadeath verdict at a high Sequence (Angel tier)", () => {
    const resolved = resolveEncounter(spiralEncounter(2));
    expect(resolved.result?.lossOfControl?.outcome).toBe("permadeath");
    expect(resolved.result?.lossOfControl?.severity).toBe("fatal");
  });

  it("escalates one step when the fighter was high-risk", () => {
    // Seq 7 alone is a setback; high-risk pushes it to transformation/permadeath.
    const calm = resolveEncounter(spiralEncounter(7, false));
    expect(calm.result?.lossOfControl?.outcome).toBe("setback");
    const fragile = resolveEncounter(spiralEncounter(7, true));
    expect(fragile.result?.lossOfControl?.outcome).toBe("permadeath");
  });

  it("does NOT set a verdict when the player backed off (no spiral)", () => {
    const e = applyPreparation(
      createEncounter({
        id: "calm",
        enemy: makeEnemy({ sequenceLevel: 8 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    expect(resolveEncounter(e).result?.lossOfControl).toBeUndefined();
  });

  it("a spiral penalty makes the fight harder to win than a steady one", () => {
    const base = applyPreparation(
      createEncounter({
        id: "pen",
        enemy: makeEnemy({ sequenceLevel: 9 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough" }),
    );
    const steady = resolveEncounter(base);
    const spiraled = resolveEncounter({
      ...base,
      controlStrain: 0.95,
      controlTier: "spiral",
    });
    // The spiral's advantage penalty makes a worse (or equal) outcome — never better.
    const rank = (o: string) => ["defeat", "stalemate", "escape", "victory"].indexOf(o);
    expect(rank(spiraled.outcome!)).toBeLessThanOrEqual(rank(steady.outcome!));
  });
});

describe("enemy stances (Phase 3b)", () => {
  it("derives the stance from the running advantage", () => {
    expect(stanceForPoint(0.4)).toBe("desperate");
    expect(stanceForPoint(0.2)).toBe("reeling");
    expect(stanceForPoint(0)).toBe("guarded");
    expect(stanceForPoint(-0.3)).toBe("pressing");
  });

  it("stamps every decision point with a stance and re-stamps reactively", () => {
    const e = applyPreparation(
      createEncounter({
        id: "stance",
        enemy: makeEnemy({ sequenceLevel: 9 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough" }),
    );
    expect(e.decisionPoints.every((p) => p.enemyStance !== undefined)).toBe(true);
    // A strong aggressive choice shifts the next point's stance toward reeling.
    const aggressive = e.decisionPoints[0].options.find((o) => o.kind === "aggressive")!;
    const next = chooseOption(e, aggressive.id);
    expect(next.decisionPoints[1].enemyStance).toBeDefined();
  });

  it("labels and describes every stance", () => {
    for (const s of ["pressing", "guarded", "reeling", "desperate"] as const) {
      expect(stanceLabel(s).length).toBeGreaterThan(0);
      expect(describeStance(s).length).toBeGreaterThan(0);
    }
  });
});

// ─── Clarity surfaces (issue #187, Phase 5) ──────────────────────────

describe("control tier copy", () => {
  it("labels and describes every tier", () => {
    for (const t of ["steady", "frayed", "slipping", "spiral"] as const) {
      expect(controlTierLabel(t).length).toBeGreaterThan(0);
      expect(describeControlTier(t).length).toBeGreaterThan(0);
    }
  });
});

describe("threatAssessment", () => {
  function withIntel(
    intel: "none" | "partial" | "thorough",
    enemy: Partial<Enemy> = {},
  ): CombatEncounter {
    return applyPreparation(
      createEncounter({
        id: "threat",
        enemy: makeEnemy(enemy),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: intel }),
    );
  }

  it("reads the danger tier from the sequence gap", () => {
    // A much stronger foe (Seq 5 vs player 9 → gap −4) is severe.
    expect(threatAssessment(withIntel("none", { sequenceLevel: 5 })).dangerTier).toBe(
      "severe",
    );
    // A weaker foe (Seq 9 enemy = gap 0 here; a Seq 7 player'd see low) — even.
    expect(threatAssessment(withIntel("none", { sequenceLevel: 9 })).dangerTier).toBe(
      "even",
    );
  });

  it("gates the odds band by intelligence", () => {
    expect(threatAssessment(withIntel("none")).oddsBand).toBe("unknown");
    expect(threatAssessment(withIntel("partial")).oddsBand).not.toBe("unknown");
    // A thorough read of a much weaker mundane foe (player Seq 5 vs Seq 9 thug,
    // gap +4) is strongly in your favour.
    const dominant = applyPreparation(
      createEncounter({
        id: "dom",
        enemy: makeEnemy({ sequenceLevel: 9, isBeyonder: false }),
        playerPathwayId: 1,
        playerSequence: 5,
        randomFactor: 0.5,
      }),
      makePrep({ intelligence: "thorough" }),
    );
    expect(threatAssessment(dominant).oddsBand).toBe("strongly in your favour");
  });

  it("surfaces reconcilability from the context", () => {
    const reconcilable = applyPreparation(
      createEncounter({
        id: "rec",
        enemy: makeEnemy({ isBeyonder: true }),
        context: makeEncounterContext("mind-controlled", { isKnownPerson: true }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    expect(threatAssessment(reconcilable).reconcilable).toBe(true);
  });
});

describe("afterActionReport", () => {
  function resolvedFight(): CombatEncounter {
    let e = applyPreparation(
      createEncounter({
        id: "aar",
        enemy: makeEnemy({ isBeyonder: true, pathwayId: 4, sequenceLevel: 8 }),
        playerPathwayId: 1,
        playerSequence: 9,
        randomFactor: 0.5,
      }),
      makePrep(),
    );
    while (!isExchangeComplete(e)) {
      e = chooseOption(e, e.decisionPoints[e.decisionIndex].options[0].id);
    }
    return resolveEncounter(e);
  }

  it("itemizes the consequences from the resolved encounter", () => {
    const e = resolvedFight();
    const report = afterActionReport(e, e.result!);
    expect(report.outcome).toBe(e.outcome);
    expect(report.injuries).toBe(e.result!.injuries);
    expect(report.itemsSpent).toBe(e.result!.itemsLost);
    expect(["steady", "frayed", "slipping", "spiral"]).toContain(report.controlTier);
    expect(typeof report.spiraled).toBe("boolean");
  });

  it("lists an INVOKED relic that survived as KEPT, but not a merely-readied one (§4.6)", () => {
    const relic = mintArtifactItem(getSealedArtifact("3-0782")!);
    // A fight where the readied relic IS invoked (an artifact option chosen) —
    // the sealed artifact persists (non-consumable), so it is reported as kept.
    const invoked: CombatEncounter = {
      ...resolvedFight(),
      preparation: makePrep({ sealedArtifacts: [relic] }),
      decisionPoints: [
        {
          id: "dp",
          prompt: "",
          options: [
            {
              id: "use-relic",
              label: "",
              kind: "artifact",
              description: "",
              modifier: 0.2,
              consumesArtifact: true,
            },
          ],
        },
      ],
      chosenOptionIds: ["use-relic"],
    };
    const usedReport = afterActionReport(invoked, { ...invoked.result!, itemsLost: [] });
    expect(usedReport.itemsKept.map((i) => i.name)).toContain(relic.name);

    // A relic that was readied but NEVER invoked is NOT listed as "kept" (it was
    // never spent — it just stays in inventory).
    const unused: CombatEncounter = {
      ...resolvedFight(),
      preparation: makePrep({ sealedArtifacts: [relic] }),
    };
    const unusedReport = afterActionReport(unused, { ...unused.result!, itemsLost: [] });
    expect(unusedReport.itemsKept).toEqual([]);
  });

  it("notes the world ripple for a freed ally", () => {
    const base = resolvedFight();
    const freed: CombatEncounter = {
      ...base,
      enemy: { ...base.enemy, name: "Lawrence" },
      context: makeEncounterContext("mind-controlled", { isKnownPerson: true }),
    };
    const report = afterActionReport(freed, { ...freed.result!, outcome: "freed" });
    expect(report.ripple.join(" ")).toContain("Lawrence");
  });

  it("notes the ripple for a captured or spared foe", () => {
    const base = resolvedFight();
    expect(
      afterActionReport(base, { ...base.result!, outcome: "captured" }).ripple.join(" "),
    ).toContain("taken alive");
    expect(
      afterActionReport(base, { ...base.result!, outcome: "spared" }).ripple.join(" "),
    ).toContain("lives");
  });

  it("attributes a spiral in the sanity causes", () => {
    const base = resolvedFight();
    const report = afterActionReport(base, {
      ...base.result!,
      sanityImpact: -10,
      lossOfControl: { severity: "setback", outcome: "setback" },
    });
    expect(report.spiraled).toBe(true);
    expect(report.sanityCauses.join(" ")).toContain("control");
  });
});
