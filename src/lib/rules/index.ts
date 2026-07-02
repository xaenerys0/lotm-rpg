export {
  ALL_PATHWAYS,
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
  getPathway,
  getSequence,
  getCumulativeAbilities,
  getCumulativeAbilityGroups,
  areNeighboringPathways,
} from "./pathways";
export type { CumulativeAbility, SequenceAbilityGroup } from "./pathways";

export { PATHWAY_GROUPS, getGroupForPathway, areInSameGroup } from "./groups";

// The two cosmic-law helpers wired into live simulation (issue #212); the
// whole-world weight-census + advancement-gate validators were retired — see
// `laws.ts` and `docs/laws-simulation-design.md`.
export { validateConvergence, validateCharacteristicTransfer } from "./laws";

// Canon sequence names (generated from corpus/wiki Module:Sequence/standard) —
// the source of truth the reconciliation test holds pathways.ts + TRUE_GOD_NAMES
// against (issue #99 Part A).
export { SEQUENCE_NAMES } from "./sequence-names-canon";

// The Pillars — the cosmic apex above Sequence 0 (issue #99 Part B). Canon data;
// the mechanical ascent lives in `@/lib/game/pillars`.
export {
  PILLARS,
  pillarForPathway,
  getPillar,
  siblingPathwayIds,
  siblingPathwayNames,
} from "./pillars";
export type { Pillar } from "./pillars";
