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
    | "uniqueness";
}

export interface Ritual {
  description: string;
  requirements: string[];
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

export interface AdvancementAttempt {
  characterId: string;
  currentPathwayId: number;
  currentSequence: number;
  targetSequence: number;
  consumedCharacteristics: BeyonderCharacteristic[];
  availableItems: Item[];
  ritualCompleted: boolean;
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
