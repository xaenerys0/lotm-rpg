export type PathwayGroupId =
  | "mysteries"
  | "god-almighty"
  | "eternal-darkness"
  | "order"
  | "combat"
  | "life"
  | "knowledge"
  | "wheel-of-fortune"
  | "abyss";

export interface PathwayGroup {
  id: PathwayGroupId;
  name: string;
  sefirah: string;
  pathwayIds: number[];
}

export interface Ability {
  name: string;
  description: string;
  type: "passive" | "active";
}

export interface Item {
  name: string;
  description: string;
  category:
    | "main-ingredient"
    | "supplementary-ingredient"
    | "potion-formula"
    | "mundane"
    | "uniqueness"
    | "sealed-artifact";
  /**
   * Whether the item is destroyed when used (combat overhaul, issue #187).
   * Optional override of the category default resolved by `isConsumable` in
   * `@/lib/game/inventory`: a Sealed Artifact persists unless its description
   * says otherwise; a one-use reagent/potion is spent. Set explicitly only when
   * an item's behaviour differs from its category's default.
   */
  consumable?: boolean;
  /**
   * Present only on a carried Beyonder Characteristic (issue #227). Two items
   * with the same `name` are different objects: this metadata's `unitId` is the
   * item's identity, equal to the `unitId` of the precipitated unit it was
   * recovered from, so a characteristic is consumed / traded / lost exactly once.
   * Absent on a legacy save's characteristic until migration resolves it.
   */
  characteristic?: CharacteristicItemMetadata;
}

/** The identity of one precipitated characteristic AND of the item carrying it. */
export type CharacteristicUnitId = string;

/**
 * What FORM a precipitated characteristic took (issue #227). A death normally
 * leaves the raw characteristic; a Beyonder who died having LOST CONTROL may
 * instead leave it bound inside a mystical item — "or it could be a mystical
 * artifact that requires sealing" (Book 1, ch. 218) — which yields the original
 * characteristic when purified or destroyed. A fused unit is NOT a church-graded
 * Sealed Artifact (grades are after-the-fact designations, so none is claimed at
 * drop time) and is not advancement- or artifice-usable until it is purified back
 * to `"raw"`, keeping the same `unitId`.
 */
export type CharacteristicForm = "raw" | "fused-mystical";

/** Where a carried characteristic came from — its unforgeable provenance. */
export type CharacteristicOrigin =
  | { kind: "death"; deathEventId: string }
  | { kind: "legacy-import"; migrationId: string }
  | { kind: "curated-acquisition"; acquisitionId: string };

export interface CharacteristicItemMetadata {
  unitId: CharacteristicUnitId;
  pathwayId: number;
  sequenceLevel: number;
  form: CharacteristicForm;
  origin: CharacteristicOrigin;
}

/** Whether a ritual step is a tangible material or a lived condition/deed. */
export type RitualRequirementKind = "material" | "condition";

/**
 * A single tagged step of an Advancement Ritual (issue #209): a **material**
 * (a tangible reagent the rite consumes — reconciled with the potion's
 * `prerequisiteItems`) or a **condition** (a lived deed/place/time the Beyonder
 * must endure — "amidst the singing of mermaids", "buried for sixty days").
 */
export interface RitualStep {
  kind: RitualRequirementKind;
  text: string;
}

export interface Ritual {
  description: string;
  /**
   * Legacy flat requirement list (back-compat). Hand-authored fallback rituals
   * in `pathways.ts` keep this; the engine treats each entry as a `condition`
   * step when `steps` is absent.
   */
  requirements: string[];
  /**
   * Corpus-generated tagged steps (issue #209) — materials drawn from the canon
   * ingredient list + conditions split from the ritual description. When
   * present, supersedes `requirements` for the rite's step derivation.
   */
  steps?: RitualStep[];
}

export type SequenceClassification = "Low" | "Mid" | "High" | "Demigod" | "True God";

export interface Sequence {
  level: number;
  name: string;
  classification: SequenceClassification;
  abilities: Ability[];
  actingRequirements: string[];
  advancementRitual?: Ritual;
  prerequisiteItems: Item[];
}

export interface Pathway {
  id: number;
  name: string;
  group: PathwayGroupId;
  sefirah: string;
  neighboringPathways: number[];
  sequences: Sequence[];
}

export interface BeyonderCharacteristic {
  pathwayId: number;
  sequenceLevel: number;
  quantity: number;
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
}

export type LawType =
  | "indestructibility"
  | "conservation"
  | "convergence"
  | "prerequisite";

export interface Violation {
  law: LawType;
  message: string;
}

export interface CharacteristicTransfer {
  fromEntityId?: string;
  toEntityId: string;
  characteristic: BeyonderCharacteristic;
  source: "death-drop" | "hunt" | "trade" | "ritual";
}

export interface WorldCharacteristicLedger {
  characteristics: BeyonderCharacteristic[];
}

export interface ConvergenceCheck {
  characterPathwayId: number;
  characterSequence: number;
  nearbyCharacteristics: BeyonderCharacteristic[];
}

export interface ConvergenceResult {
  attracted: BeyonderCharacteristic[];
  strength: "none" | "weak" | "strong";
}
