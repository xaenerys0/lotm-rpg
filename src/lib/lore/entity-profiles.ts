import type {
  CanonMortalityPolicy,
  CharacteristicOwnership,
  EntityKind,
} from "@/lib/types/entities";
import type { Item } from "@/lib/types/rules";

import { BESTIARY } from "./bestiary";
import { CANON_PLAYABLE_CHARACTERS } from "./canon-characters";

// ---------------------------------------------------------------------------
// Curated entity profiles & canon mortality policies (issue #227).
//
// The TRUSTED half of "does this thing carry a Beyonder Characteristic, and may
// it die here?". Nothing else may answer either question: `Enemy.isBeyonder` and
// `Enemy.pathwayId` describe how something FIGHTS, and canon is explicit that
// supernatural nature does not imply ownership — "Some evil spirits had Beyonder
// characteristics, but most of them didn't" (Book 1, ch. 1263). So ownership is
// stated per entity, here, from `corpus/`, or it stays unknown and nothing drops.
//
// Two catalogues:
//
// - `CURATED_ENTITY_PROFILES` — per-catalogue-entry ownership + kind +
//   harvestable materials for the named foes in `bestiary.ts`. The combat surface
//   is NOT duplicated here: the engine composes it from the bestiary entry at
//   registration time (a foe's fight rung can vary within its canon band, while
//   the characteristic it OWNS is fixed).
// - `CANON_MORTALITY_POLICIES` — when a canonical figure may die. Derived for the
//   playable canon roster from each preset's already-corpus-verified introduction
//   `canonPosition`, and hand-authored for the named bestiary antagonists.
//
// Fail closed: a canonical entity with no policy here is PROTECTED, and an entity
// with no profile here owns nothing knowable. Both are deliberate — a gap costs a
// reward, never a phantom one. Adding an entry requires a `corpus/` citation.
//
// Design doc: `docs/entity-death-design.md`.
// ---------------------------------------------------------------------------

/** The sources allowed to kill a canonical figure once it is killable. */
export const CANON_DEATH_SOURCES = [
  "combat",
  "trusted-script",
  "player-failure",
] as const;

/** The Fifth Epoch — every curated antagonist below belongs to the baseline era. */
const FIFTH_EPOCH = 5;

/**
 * The trusted mechanical truth for one curated foe. Deliberately narrow: identity
 * and combat numbers live in `bestiary.ts` / the registry, so this states only
 * what the engine may never guess.
 */
export interface CuratedEntityProfile {
  /** Stable catalogue id recorded as the profile's provenance. */
  catalogId: string;
  /**
   * Bumped when the mechanical content below changes, so an existing save's
   * persisted snapshot stays distinguishable from a newer catalogue's.
   */
  profileVersion: number;
  /** The `BESTIARY` entry this profile is the mechanical truth for. */
  bestiaryId: string;
  kind: EntityKind;
  /**
   * What the entity owns. The Sequence here is the CANON rung of the
   * characteristic, independent of the rung the foe happens to fight at (the
   * Devil Dog's encounter band spans 6–7; the characteristic it carries is Seq 6).
   */
  characteristicOwnership: CharacteristicOwnership;
  /** Materials the remains yield. Empty unless the corpus names one. */
  harvestableMaterials: Item[];
  /** Corpus citation for the ownership claim. */
  sourceRef: string;
}

/**
 * Ownership for the named carriers, each verified against
 * `corpus/wiki/lordofthemystery_pages_current.xml` (infobox `sequence_rank` +
 * the opening prose naming the pathway).
 */
export const CURATED_ENTITY_PROFILES: readonly CuratedEntityProfile[] = [
  {
    catalogId: "profile-sirius-arapis",
    profileVersion: 1,
    bestiaryId: "tingen-sirius-arapis",
    kind: "person",
    characteristicOwnership: {
      status: "known",
      stacks: [{ pathwayId: 9, sequenceLevel: 9, quantity: 1 }],
    },
    harvestableMaterials: [],
    // CORPUS: wiki "Sirius Arapis" — sequence_rank = 9; "He was a Sequence 9
    // {{Seq|Secrets Suppliant}} of the [[Hanged Man Pathway]]."
    sourceRef: "wiki: Sirius Arapis (sequence_rank 9, Hanged Man Pathway)",
  },
  {
    catalogId: "profile-antigonus-family-puppet",
    profileVersion: 1,
    bestiaryId: "tingen-antigonus-puppet",
    kind: "construct",
    // The Puppet is a Grade 2 Sealed Artifact whose abilities RESEMBLE the Fool's
    // Sequence 5 Marionettist; the corpus attributes no Beyonder Characteristic to
    // it, so it explicitly owns none. Its Fool pathway framing stays a combat and
    // intelligence fact only.
    characteristicOwnership: { status: "known-none" },
    harvestableMaterials: [],
    // CORPUS: wiki "Antigonus Family Puppet" — grade = 2; pathway = Fool; "Its
    // abilities resemble the Sequence 5, {{Seq|Marionettist}} of the Fool Pathway."
    sourceRef: "wiki: Antigonus Family Puppet (Grade 2 Sealed Artifact, Fool-like)",
  },
  {
    catalogId: "profile-devil-dog",
    profileVersion: 1,
    bestiaryId: "backlund-devil-dog",
    kind: "mystical-creature",
    characteristicOwnership: {
      status: "known",
      stacks: [{ pathwayId: 21, sequenceLevel: 6, quantity: 1 }],
    },
    harvestableMaterials: [],
    // CORPUS: wiki "Devil Dog" — species = Dog, sequence_rank = 6; "It was a
    // Sequence 6 {{Seq|Devil}} of the [[Abyss Pathway]]." The encounter band spans
    // 6–7, but the characteristic is Sequence 6.
    sourceRef: "wiki: Devil Dog (sequence_rank 6, Abyss Pathway)",
  },
  {
    catalogId: "profile-meursault",
    profileVersion: 1,
    bestiaryId: "backlund-meursault",
    kind: "person",
    characteristicOwnership: {
      status: "known",
      stacks: [{ pathwayId: 14, sequenceLevel: 9, quantity: 1 }],
    },
    harvestableMaterials: [],
    // CORPUS: wiki "Meursault" — sequence_rank = 9; "He was a Sequence 9 Beyonder
    // of the [[Red Priest Pathway]]."
    sourceRef: "wiki: Meursault (sequence_rank 9, Red Priest Pathway)",
  },
  {
    catalogId: "profile-hood-eugen",
    profileVersion: 1,
    bestiaryId: "backlund-hood-eugen",
    kind: "person",
    characteristicOwnership: {
      status: "known",
      stacks: [{ pathwayId: 2, sequenceLevel: 7, quantity: 1 }],
    },
    harvestableMaterials: [],
    // CORPUS: wiki "Hood Eugen" — sequence_rank = 7; "He was a Beyonder of the
    // [[Visionary Pathway]] and a member of the [[Psychology Alchemists]]."
    // Visionary Sequence 7 is the Psychiatrist (`sequence-names-canon.ts`).
    sourceRef: "wiki: Hood Eugen (sequence_rank 7, Visionary Pathway — Psychiatrist)",
  },
  {
    catalogId: "profile-rosago",
    profileVersion: 1,
    bestiaryId: "backlund-rosago",
    kind: "person",
    characteristicOwnership: {
      status: "known",
      stacks: [{ pathwayId: 1, sequenceLevel: 5, quantity: 1 }],
    },
    harvestableMaterials: [],
    // CORPUS: wiki "Rosago" — sequence_rank = 5; "Rosago is a Sequence 5 Beyonder
    // of the [[Fool Pathway]]." Fool Sequence 5 is the Marionettist.
    sourceRef: "wiki: Rosago (sequence_rank 5, Fool Pathway — Marionettist)",
  },
];

/** A canonical figure's mortality policy, keyed by its registry `canonRef`. */
export interface CanonMortalityEntry {
  canonRef: string;
  policy: CanonMortalityPolicy;
  /** Corpus citation for the position/epoch claim. */
  sourceRef: string;
}

/**
 * The named bestiary antagonists' policies. `minCanonPosition` is each figure's
 * earliest chapter cited on their own wiki page — the point the story has met
 * them — so an alternative history may kill them from their appearance onward
 * while a chronicle that has not reached them cannot.
 */
const BESTIARY_MORTALITY: readonly CanonMortalityEntry[] = [
  {
    canonRef: "tingen-sirius-arapis",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-sirius-arapis",
      version: 1,
      minCanonPosition: 100,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Sirius Arapis" cites Book 1 ch. 100-105 (killed ch. 103-104).
    sourceRef: "wiki: Sirius Arapis (earliest cited Book 1 ch. 100)",
  },
  {
    canonRef: "tingen-antigonus-puppet",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-antigonus-puppet",
      version: 1,
      minCanonPosition: 70,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Antigonus Family Puppet" cites Book 1 ch. 70-75.
    sourceRef: "wiki: Antigonus Family Puppet (earliest cited Book 1 ch. 70)",
  },
  {
    canonRef: "backlund-devil-dog",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-devil-dog",
      version: 1,
      minCanonPosition: 270,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Devil Dog" cites Book 1 ch. 270-412 (killed ch. 327).
    sourceRef: "wiki: Devil Dog (earliest cited Book 1 ch. 270)",
  },
  {
    canonRef: "backlund-meursault",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-meursault",
      version: 1,
      minCanonPosition: 215,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Meursault" cites Book 1 ch. 215-247 (killed ch. 228).
    sourceRef: "wiki: Meursault (earliest cited Book 1 ch. 215)",
  },
  {
    canonRef: "backlund-hood-eugen",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-hood-eugen",
      version: 1,
      minCanonPosition: 117,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Hood Eugen" cites Book 1 ch. 117-210 (killed ch. 186).
    sourceRef: "wiki: Hood Eugen (earliest cited Book 1 ch. 117)",
  },
  {
    canonRef: "backlund-rosago",
    policy: {
      kind: "mortal-after",
      policyId: "mortality-rosago",
      version: 1,
      minCanonPosition: 248,
      activeEpochs: [FIFTH_EPOCH],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    // CORPUS: wiki "Rosago" cites Book 1 ch. 248-251 (killed ch. 250).
    sourceRef: "wiki: Rosago (earliest cited Book 1 ch. 248)",
  },
];

/**
 * The playable canon roster's policies, DERIVED from each preset's curated
 * introduction position and epoch (already corpus-verified in
 * `canon-characters.ts`) rather than re-authored — so the two can never drift and
 * no new canon claim is introduced. A figure becomes killable exactly where the
 * novel introduces them: divergence after the introduction is allowed, a death
 * before it is not.
 */
const CANON_PRESET_MORTALITY: readonly CanonMortalityEntry[] =
  CANON_PLAYABLE_CHARACTERS.map((preset) => ({
    canonRef: preset.id,
    policy: {
      kind: "mortal-after",
      policyId: `mortality-canon-${preset.id}`,
      version: 1,
      minCanonPosition: preset.canonPosition,
      activeEpochs: [preset.epoch],
      allowedSources: [...CANON_DEATH_SOURCES],
    },
    sourceRef: `canon-characters.ts: ${preset.displayName} (introduced ch. ${preset.canonPosition}, epoch ${preset.epoch})`,
  }));

/**
 * Every curated mortality policy. A canonical entity whose `canonRef` is absent
 * here is PROTECTED — the deliberate fail-closed default for the hundreds of
 * corpus figures with no authored policy (and for anyone the corpus is silent or
 * ambiguous about).
 */
export const CANON_MORTALITY_POLICIES: readonly CanonMortalityEntry[] = [
  ...BESTIARY_MORTALITY,
  ...CANON_PRESET_MORTALITY,
];

const PROFILES_BY_CATALOG_ID = new Map(
  CURATED_ENTITY_PROFILES.map((profile) => [profile.catalogId, profile]),
);
const PROFILES_BY_BESTIARY_ID = new Map(
  CURATED_ENTITY_PROFILES.map((profile) => [profile.bestiaryId, profile]),
);
const MORTALITY_BY_CANON_REF = new Map(
  CANON_MORTALITY_POLICIES.map((entry) => [entry.canonRef, entry]),
);

/** O(1) catalogue lookup by profile id (the provenance recorded on a save). */
export function getCuratedEntityProfile(
  catalogId: string,
): CuratedEntityProfile | undefined {
  return PROFILES_BY_CATALOG_ID.get(catalogId);
}

/** The curated profile for a bestiary foe, or `undefined` (ownership unknown). */
export function curatedProfileForBestiaryId(
  bestiaryId: string,
): CuratedEntityProfile | undefined {
  return PROFILES_BY_BESTIARY_ID.get(bestiaryId);
}

/**
 * The curated mortality policy for a canonical reference, or `undefined` when
 * none is authored — which the authorization engine treats as protected.
 */
export function canonMortalityPolicy(canonRef: string): CanonMortalityPolicy | undefined {
  return MORTALITY_BY_CANON_REF.get(canonRef)?.policy;
}

/**
 * Canonical references that have NO curated mortality policy and are therefore
 * protected — the reportable gap list, and the set lethal random selection must
 * exclude. Derived from the bestiary so a newly added foe surfaces here instead of
 * silently becoming unkillable-and-forgotten.
 */
export function protectedBestiaryIds(): string[] {
  return BESTIARY.filter((foe) => !MORTALITY_BY_CANON_REF.has(foe.id)).map(
    (foe) => foe.id,
  );
}
