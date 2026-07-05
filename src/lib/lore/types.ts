import type { LoreCategoryEnum } from "@/lib/types/database";
import type { LoreFaction } from "./factions";

export type { LoreFaction } from "./factions";

export type LoreCategory = LoreCategoryEnum;

export interface EncounterConfig {
  /** Earliest chapter in the novel when this character appears. Used for spoiler gating. */
  earliestChapter?: number;
  /**
   * Latest chapter this character should appear without spoilers.
   * Absent = no upper limit (safe for all post-introduction play).
   */
  latestChapter?: number;
  /**
   * Specific locations beyond city-level (e.g., "backlund-empress-borough", "tingen-nighthawks-headquarters").
   * If absent, city-level matching applies.
   */
  specificLocations?: string[];
  /**
   * Faction affiliations that gate encounters. Player must be affiliated
   * (via GameState.factions) to encounter this character naturally.
   * Examples: "tarot-club", "aurora-order", "nighthawks", "moses-ascetic-order"
   */
  factionGates?: LoreFaction[];
  /**
   * Minimum player sequence to encounter this character naturally.
   * Used for high-sequence figures who shouldn't appear to Sequence 9 players.
   */
  minPlayerSequence?: number;
  /**
   * Characters this NPC requires the player to have met first.
   * Enables relationship-based gating (e.g., "must meet Roselle before Bernadette").
   */
  requiresPriorEncounter?: string[]; // slugs of other NPCs
  /**
   * How frequently this character should appear when conditions are met.
   * Higher = more likely. Default = 1.0. Story-critical figures = 2.0+.
   */
  encounterWeight?: number;
  /**
   * Type of encounter. 'story-critical' = always inject if conditions met.
   * 'optional' = weighted selection. 'rare' = low probability, special occasions.
   */
  encounterType?: "story-critical" | "optional" | "rare";
  /**
   * Epochs when this character can be encountered.
   * Defaults to entry's `epoch` field if absent.
   * Useful for characters who span multiple epochs (e.g., Azik Eggers).
   */
  activeEpochs?: number[];
}

export interface LoreEntry {
  slug: string;
  title: string;
  category: LoreCategory;
  content: string;
  pathway?: string;
  epoch?: number;
  city?: string;
  npcs: string[];
  sequences: number[];
  tags: string[];
  tokenCount: number;
  // When undefined or true: the AI uses this for narrator accuracy but should not
  // treat it as information the player character already possesses. Set to false
  // only for entries describing genuinely public knowledge (geography, era context).
  narratorOnly?: boolean;
  // === ENCOUNTER REGISTRY FIELDS (Issue #213) ===
  /**
   * Encounter configuration for making characters encounterable (issue #213).
   * Absent = no special encounter rules (uses default city/pathway injection).
   */
  encounterConfig?: EncounterConfig;
}
