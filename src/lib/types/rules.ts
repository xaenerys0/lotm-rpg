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
