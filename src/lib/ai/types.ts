import type { Item, ValidationResult } from "@/lib/types/rules";
import type { Injury } from "@/lib/types/combat";
import type { LoreEntry } from "@/lib/lore/types";

export type ProviderId =
  | "anthropic"
  | "openai"
  | "openrouter"
  | "ollama"
  | "ollama-cloud"
  | "custom";

export type ModelTier = "routine" | "premium";

export type CallClassification = ModelTier;

export interface ProviderConfig {
  providerId: ProviderId;
  apiKey: string;
  baseUrl?: string;
  routineModel: string;
  premiumModel: string;
}

export interface ModelOption {
  id: string;
  name: string;
  tier: ModelTier;
}

export const PROVIDER_MODELS: Record<ProviderId, ModelOption[]> = {
  anthropic: [
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", tier: "routine" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "routine" },
    { id: "claude-opus-4-7", name: "Claude Opus 4.7", tier: "premium" },
  ],
  openai: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", tier: "routine" },
    { id: "gpt-4o", name: "GPT-4o", tier: "premium" },
    { id: "o3-mini", name: "o3-mini", tier: "premium" },
  ],
  openrouter: [
    {
      id: "anthropic/claude-haiku-4-5-20251001",
      name: "Claude Haiku 4.5",
      tier: "routine",
    },
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", tier: "routine" },
    { id: "anthropic/claude-sonnet-4-6", name: "Claude Sonnet 4.6", tier: "premium" },
    { id: "openai/gpt-4o", name: "GPT-4o", tier: "premium" },
  ],
  ollama: [
    { id: "llama3.2", name: "Llama 3.2", tier: "routine" },
    { id: "mistral", name: "Mistral", tier: "routine" },
    { id: "llama3.1:70b", name: "Llama 3.1 70B", tier: "premium" },
  ],
  "ollama-cloud": [
    { id: "gpt-oss:20b", name: "GPT-OSS 20B", tier: "routine" },
    { id: "gpt-oss:120b", name: "GPT-OSS 120B", tier: "premium" },
    { id: "deepseek-v3.2", name: "DeepSeek V3.2", tier: "premium" },
  ],
  custom: [],
};

export interface Choice {
  id: string;
  text: string;
  type: "action" | "dialogue" | "investigation" | "ritual";
}

export interface StateChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export interface ActingEvaluation {
  alignment: number;
  reasoning: string;
}

export interface AIResponse {
  narrative: string;
  choices?: Choice[];
  worldStateChanges?: StateChange[];
  actingEvaluation?: ActingEvaluation;
  sanityImpact?: number;
  itemsDiscovered?: Item[];
}

export interface ValidatedAIResponse {
  response: AIResponse;
  validation: ValidationResult;
  /** Rough token estimates for this call (issue #15) — chars/4 heuristic. */
  usage?: { promptTokens: number; outputTokens: number };
}

export type InstructionType =
  | "narrative"
  | "choices"
  | "evaluation"
  | "advancement"
  | "combat";

export interface DigestionState {
  /** Pathway of the potion currently being digested. */
  pathwayId: number;
  /** Sequence level of the potion currently being digested. */
  sequenceLevel: number;
  /** Digestion progress, 0-100. At 100 the potion is fully assimilated. */
  progress: number;
  /** True once progress reaches 100 — advancement becomes available. */
  complete: boolean;
}

export interface GameState {
  characterId: string;
  pathwayId: number;
  sequenceLevel: number;
  sanity: number;
  maxSanity: number;
  inventory: Item[];
  location: string;
  activeQuests: string[];
  npcsPresent: string[];
  characterName?: string;
  characterBackground?: string;
  /**
   * Digestion progress for the potion matching the current pathway/sequence.
   * Optional for backward compatibility with sessions saved before the Acting
   * Method mechanic; the game engine seeds a default when it is missing.
   */
  digestion?: DigestionState;
  /**
   * Active combat injuries (issue #10). Each heals over turns of normal play.
   * Optional for backward compatibility with sessions saved before the combat
   * system; absent means no injuries.
   */
  injuries?: Injury[];
}

export interface TurnRecord {
  turnNumber: number;
  playerAction: string;
  aiResponse: AIResponse;
  timestamp: number;
  /**
   * Ids of the `source_chunks` retrieved for this turn (issue #63), recorded
   * so "why did the narrator say X" stays answerable without vector-search
   * forensics. Absent on turns that performed no retrieval.
   */
  retrievedChunkIds?: string[];
}

export interface BulletSummary {
  turnNumber: number;
  summary: string;
}

export interface SessionFact {
  type: "event" | "npc-encounter" | "item-change" | "quest-progress";
  description: string;
  turnNumber: number;
}

export interface MemoryState {
  immediateTurns: TurnRecord[];
  recentSummaries: BulletSummary[];
  sessionFacts: SessionFact[];
}

export interface PromptLayer {
  role: "system" | "user";
  content: string;
  cacheControl?: boolean;
}

export interface PromptAssembly {
  layers: PromptLayer[];
  totalTokenEstimate: number;
}

export interface LoreContext {
  entries: LoreEntry[];
  totalTokens: number;
}

/**
 * A retrieved corpus chunk as the prompt assembler consumes it (issue #64) — a
 * structural slice of `RetrievedChunk` from `@/lib/lore/retrieval`, declared
 * here so the AI layer does not depend on the retrieval module.
 */
export interface RetrievedLoreChunk {
  id: string;
  title: string;
  content: string;
  source: string;
  token_count: number;
}

export interface PromptInput {
  gameState: GameState;
  memory: MemoryState;
  loreContext: LoreContext;
  /**
   * Gated chunks from `retrieveChunks` (issue #64), in retrieval-rank order.
   * They fill whatever lore budget the curated entries leave — authored lore
   * is never crowded out.
   */
  retrievedChunks?: RetrievedLoreChunk[];
  instruction: InstructionType;
  playerAction: string;
  abilities: string[];
  actingRequirements: string[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProviderRequest {
  messages: ChatMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: { type: "json_object" };
}

export interface ProviderResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cacheHit?: boolean;
  };
  /** True when the provider stopped because the output token cap was hit. */
  truncated?: boolean;
}
