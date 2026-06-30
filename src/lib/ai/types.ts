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
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", tier: "premium" },
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

/**
 * The continents the world model distinguishes (world build-out, issues #130/#138).
 * `central` is the ordinary mainland (the seven existing cities); `forsaken-land`
 * is the sealed Eastern Continent — the Forsaken Land of the Gods — reachable
 * only via the Dream-World passage, never an ordinary sea route; `southern-continent`
 * is the colonized Southern Continent (the old Balam Empire's lands), reachable by
 * an ordinary — but long and perilous — sea voyage across the Berserk Sea, with NO
 * capability gate (it is a colonial frontier, not a sealed land). Absent on a
 * `City` means `central` (the existing cities are untouched).
 */
export type Continent = "central" | "forsaken-land" | "southern-continent";

/**
 * Capability flags a character may hold (world build-out, issue #130). A flag is
 * an earned, NOT-AI-mutable capability gating access to otherwise-unreachable
 * surfaces — currently the single `dream-world-passage` (the shadow route into
 * the Forsaken Land). Persisted on the save's `GameState.accessFlags`, validated
 * strictly like `customLocations`, granted only by the engine (issue #3).
 */
export type AccessFlag =
  | "dream-world-passage"
  | "silver-city-passage"
  | "moon-city-passage";

/** The known capability flags, for strict validation (issues #130, #133). */
export const ACCESS_FLAGS: readonly AccessFlag[] = [
  "dream-world-passage",
  "silver-city-passage",
  "moon-city-passage",
];

/** Type guard: is `value` a recognised capability flag? */
export function isAccessFlag(value: unknown): value is AccessFlag {
  return typeof value === "string" && (ACCESS_FLAGS as readonly string[]).includes(value);
}

export interface StateChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  /**
   * Optional against-the-will relocation code (issue #101). Only meaningful on a
   * `location` change: the engine (`isInvoluntaryMoveCause` in
   * `@/lib/game/world-state`) narrows it to a known cause and lets an otherwise-
   * refused cross-city move through. Loosely typed at the boundary.
   */
  involuntaryCause?: string;
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
  /**
   * Residual free-form per-turn sanity nuance (issue #95), clamped to **±5**.
   * The bulk of per-turn sanity now comes from the engine via `sanityEventTags`
   * (deterministic magnitudes); this is the small narrative remainder the AI
   * may add on top. Validated/clamped to ±5 in `validation.ts`.
   */
  sanityImpact?: number;
  /**
   * Engine-scored sanity events the turn triggered (issue #95). The AI emits
   * only the tags; the engine computes the magnitude via `sanityDeltaForTags`.
   * Loosely typed at the boundary like `journalEntry` — `parseAIResponse`
   * normalizes it to the known `SanityEventTag` set (unknown tags dropped).
   */
  sanityEventTags?: string[];
  /**
   * The narrator detected the Acting Method being explicitly taught this turn —
   * an NPC instructing the character, or the character reading it in lore
   * (issue #95). Drop-not-throw flag (carried only when `true`); it is the
   * ONLY AI-driven acting-method discovery trigger and is NEVER a sanity scare.
   */
  actingMethodTaught?: boolean;
  itemsDiscovered?: Item[];
  /**
   * Currency found (or lost) in the fiction this turn, in pence (issue #16
   * follow-up). Like `itemsDiscovered`, the wallet is not on the AI-mutable
   * `worldStateChanges` allowlist, so this is the dedicated, bounded channel for
   * money the narrative grants. The engine clamps it to `FUNDS_DISCOVERED_CAP`
   * per turn (signed — negative for a robbery/bribe/loss) before applying.
   */
  fundsDiscovered?: number;
  /**
   * Optional journal-worthy flag (issue #11). Loosely typed at the AI
   * boundary; `validateJournalFlag` (@/lib/game/journal) is the single
   * validation point before anything reaches the journal.
   */
  journalEntry?: { summary: string; eventType: string };
  /**
   * The narrator detected the player declaring a change to their TRUE self
   * (a new name they adopt, a changed appearance/gender/title). Loosely typed at
   * the boundary, like `journalEntry`. NEVER applied automatically — the UI
   * surfaces a one-tap confirm and only then does the engine apply it next turn.
   * Deliberately distinct from `worldStateChanges` (the AI-mutable allowlist):
   * name/gender/appearance are NOT AI-mutable. Validated by
   * `validateSelfChangeProposal` (@/lib/game/profile) before use.
   */
  proposedSelfChange?: { field: string; value: string; reason?: string };
  /**
   * NPCs who are actively HUNTING/pursuing the character this turn (issue #101).
   * The world — not the player — decides who is on your trail, so this is the
   * narrator's channel for it. Loosely typed at the boundary like
   * `sanityEventTags`; `parseAIResponse` normalizes it to clean, non-empty
   * names. The engine rosters each as a hostile follower (idempotent), so a
   * pursuer reappears at the player's destination after travel until shaken off.
   * Companions, by contrast, are a deliberate PLAYER choice (the character
   * sheet), never this field.
   */
  pursuers?: string[];
  /**
   * Durable rolling "story so far" the narrator maintains each turn (amortized
   * into this response — no extra API call). It is fed back in next turn so the
   * model recursively prunes and extends it, and persisted on `MemoryState`
   * where it is never trimmed. Optional: when absent the prior summary is kept.
   * Capped on sanitize (`RUNNING_SUMMARY_CHAR_CAP`). Prior art: AI Dungeon's
   * auto Story Summary, NovelAI's pinned Memory, MemGPT's recursive summary.
   */
  runningSummary?: string;
  /**
   * Story-consistency Codex deltas (history-context Codex). When the narrator
   * introduces or materially changes an important person, location, object,
   * group, or plot thread, it emits a compact delta here; the engine folds it
   * into the durable `GameSession.codexState` registry. Loosely typed at the
   * boundary like `journalEntry` — `parseAIResponse` carries through a sanitized
   * array (count-capped, non-empty name) and `applyCodexUpdates`
   * (@/lib/game/codex) is the single real validation point (kind/importance
   * whitelist + length caps). Deltas only (introduced/changed), never a
   * restatement of the whole cast, so the per-turn output cost stays small.
   */
  codexUpdates?: CodexUpdateInput[];
}

/**
 * A single narrator-emitted Codex delta (history-context Codex), loosely typed
 * at the AI boundary. `applyCodexUpdates` (@/lib/game/codex) validates `kind`
 * against the known `CodexKind` set, `importance` against its whitelist, and
 * clamps the string fields — exactly as `validateJournalFlag` is the single
 * validation point for `journalEntry`.
 */
export interface CodexUpdateInput {
  /** "person" | "location" | "object" | "group" | "thread" (validated downstream). */
  kind: string;
  /** Entity display name (the match key). Dropped at parse when blank. */
  name: string;
  /** Concise current state, e.g. "alive; wary ally in Backlund". */
  status?: string;
  /** "pivotal" | "standard" (validated downstream). */
  importance?: string;
  /** Optional longer detail for the player-facing Codex view. */
  note?: string;
  /** Threads only: the promise/debt/hook has been settled. */
  resolved?: boolean;
  /** Alternate names the narrator may also refer to this entity by. */
  aliases?: string[];
}

/**
 * A Codex entity as the prompt assembler consumes it (history-context Codex) —
 * a structural slice of `CodexEntity` from `@/lib/game/codex`, declared here so
 * the AI layer never imports the game layer (mirrors `RetrievedLoreChunk`). The
 * game layer maps its selected, scene-relevant entities into this shape and
 * threads them through `PromptInput.pinnedEntities`.
 */
export interface PinnedCodexEntity {
  kind: string;
  name: string;
  status: string;
  importance: string;
  lastSeenTurn: number;
  resolved?: boolean;
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

/**
 * Player-chosen narration length. "standard" is the baseline — it emits no
 * directive (the assembler drops the layer), so existing saves are unchanged.
 * "concise" and "rich" each add a `## Narration Length` system directive.
 */
export type NarrativeVerbosity = "concise" | "standard" | "rich";

/** The allowed {@link NarrativeVerbosity} values — the single source of truth for validation. */
export const NARRATIVE_VERBOSITY_VALUES: readonly NarrativeVerbosity[] = [
  "concise",
  "standard",
  "rich",
];

/** True when `value` is a known {@link NarrativeVerbosity}. */
export function isNarrativeVerbosity(value: unknown): value is NarrativeVerbosity {
  return (
    typeof value === "string" &&
    (NARRATIVE_VERBOSITY_VALUES as readonly string[]).includes(value)
  );
}

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

/**
 * A narrator-named venue that is not in the static gazetteer, filed under the
 * city it was discovered in (Backlund location sync). Lets the map render and
 * pin places the story invented without the engine confidently mis-matching a
 * generic keyword (e.g. "chapel") to an unrelated district.
 */
export interface CustomLocation {
  /** The known city id this venue belongs to (e.g. "backlund"). */
  cityId: string;
  /** Stable, unique slug derived from the name (prefixed `custom-`). */
  slug: string;
  /** Display name, as the narrator wrote it (city prefix stripped). */
  name: string;
}

export interface GameState {
  characterId: string;
  pathwayId: number;
  sequenceLevel: number;
  sanity: number;
  maxSanity: number;
  inventory: Item[];
  location: string;
  /**
   * The known city id the character is currently in (issue #101). Engine-
   * maintained — set on deliberate travel and whenever an applied `location`
   * change resolves to a known city, and PRESERVED when `location` becomes a
   * bare district/landmark string (which `cityIdFromLocation` cannot resolve).
   * Lets the map show the right city's atlas during within-city play instead of
   * falling back to Tingen. NOT AI-mutable. Optional — absent on legacy saves and
   * outside the Fifth Epoch; the map falls back to `cityIdFromLocation(location)`.
   */
  currentCity?: string;
  /**
   * Venues the narrator named that are NOT in the static gazetteer (Backlund
   * location sync). When an applied `location` change resolves to a known city
   * but matches no known district, the engine files the place here under that
   * city so the map can render it and pin "you are here" correctly — instead of
   * silently keyword-matching a wrong district. Engine-maintained, NOT
   * AI-mutable; Fifth-Epoch only (the per-city atlas is). Optional/absent on
   * saves that never visited an off-map venue.
   */
  customLocations?: CustomLocation[];
  /**
   * Capability flags the character holds (world build-out, issue #130) — earned,
   * NOT-AI-mutable capabilities that gate access to otherwise-unreachable
   * surfaces (e.g. `dream-world-passage`, the shadow route into the access-gated
   * Forsaken Land). Optional + strictly validated + preserved on deserialize,
   * exactly like `customLocations`; granted only by the engine (issue #3). Lives
   * in the `game_sessions.data` jsonb — no schema migration, no `database.ts`
   * change. Absent on every existing save.
   */
  accessFlags?: AccessFlag[];
  activeQuests: string[];
  npcsPresent: string[];
  characterName?: string;
  characterBackground?: string;
  /**
   * Canon-character takeover marker (issue #92). When the player named their
   * character after a canonical figure on that figure's start-of-story pathway,
   * this holds the matched preset id (`canon-characters.ts` / the `npcs.ts` slug
   * stem). Rules-engine-only — NEVER AI-mutable. Drives doppelganger suppression
   * (the figure never appears as a separate present NPC while the player IS
   * them) and the "you ARE this character" narrator directive. Absent on every
   * ordinary save; preserved across (de)serialize on the `...gs` spread.
   */
  canonCharacterId?: string;
  /**
   * For a canon-character takeover, the figure's corpus-grounded personality —
   * seeded from the preset's `personalityTraits` at creation. Rules-engine-only
   * (NEVER AI-mutable); pinned into the never-trimmed game-state layer and used
   * by `buildGameStatePrompt` to bias the choices the narrator presents toward
   * what the character would canonically do (the player stays free to act against
   * type). Absent on every ordinary save; preserved on the `...gs` spread.
   */
  canonPersonality?: string;
  /**
   * A compact, durable recap of the AI prologue (the life the character led and
   * the encounter that made them a Beyonder). The prologue runs on a separate
   * prompt the story narrator never sees, so this is pinned into the
   * never-trimmed game-state layer to keep the prologue → story transition
   * seamless. Set at character creation; absent on the manual path. Built by
   * `buildPrologueRecap` (`@/lib/game`).
   */
  prologueRecap?: string;
  /**
   * Starting epoch (issues #26/#29). Optional — absent means the Fifth.
   * Set at character creation; rules-engine-only (never AI-mutable).
   */
  epoch?: number;
  /**
   * The first-turn opening beat for this chronicle (varied story openings).
   * Set at character creation from the chosen start scenario so the first scene
   * matches the (randomly varied) starting location. Optional — absent saves
   * (and the manual fallback) fall back to the epoch's default opening beat.
   * Only meaningful at `turnCount === 0`.
   */
  openingBeat?: string;
  /**
   * Funds in pence (issue #16 — the marketplace introduced currency).
   * Optional for saves that predate it; `getFunds` seeds the default.
   */
  funds?: number;
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

/**
 * The kind of engine-decided turn, stamped on the record so consumers (the
 * Story Chronicle) can style it structurally rather than by sniffing the action
 * text (issue #171). Absent on an ordinary story turn.
 */
export type TurnKind = "combat" | "advancement";

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
  /**
   * For an engine-decided turn (combat / advancement / apotheosis / pillar),
   * the structured kind — set where the turn is dispatched, so the chronicle
   * need not infer it from the action string. Absent = ordinary story turn.
   */
  kind?: TurnKind;
}

export interface BulletSummary {
  turnNumber: number;
  summary: string;
}

/**
 * Provenance of a {@link SessionFact}. `engine` facts are recorded directly by
 * the rules engine from authoritative state transitions (travel, inventory,
 * quests, discovery leads); `ai` facts are extracted from the narrator's
 * structured output and are therefore only as reliable as that output. Eviction
 * is salience-weighted and protects `engine` facts above `ai` facts, so a
 * ground-truth event survives longer than an AI-asserted one when the cap bites.
 * Optional for back-compat: a fact without a source is treated as `engine`
 * (authoritative — kept longer), the conservative default for legacy saves.
 */
export type FactSource = "engine" | "ai";

export interface SessionFact {
  type: "event" | "npc-encounter" | "item-change" | "quest-progress";
  description: string;
  turnNumber: number;
  /** Provenance (see {@link FactSource}); absent on legacy saves → `engine`. */
  source?: FactSource;
}

export interface MemoryState {
  immediateTurns: TurnRecord[];
  recentSummaries: BulletSummary[];
  sessionFacts: SessionFact[];
  /**
   * Durable rolling synopsis of the chronicle ("story so far"), maintained by
   * the narrator each turn and pinned at the top of the history layer. Unlike
   * `recentSummaries` (FIFO-evicted) it is never trimmed, so lasting context
   * survives the whole game. Optional for back-compat with saves that predate
   * it; treated as `""` when absent.
   */
  runningSummary?: string;
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
   * Epoch tone directive (issues #26/#29) — one narrator-facing line from
   * `epochNarrationDirective`; null/absent for the Fifth-Epoch baseline.
   */
  epochContext?: string | null;
  /**
   * Active-persona presentation context (issue #22) — one narrator-facing
   * line from `identityPromptContext`; null/absent when wearing the true face.
   */
  identityContext?: string | null;
  /**
   * Carried Sealed Artifact effects (Sealed Artifacts subsystem) — the binding
   * `## Artifact Effects` block from `artifactNarratorContext`, listing every
   * effect the character's artifacts grant so the narrator enforces them in the
   * fiction (the real path for an effect with no engine subsystem); null/absent
   * when the character carries no artifact.
   */
  artifactEffectsContext?: string | null;
  /**
   * True-self ground-truth context (character-info storage) — one narrator-facing
   * line from `profilePromptContext` (pronouns, gender, appearance, demeanor);
   * null/absent when the profile is empty.
   */
  profileContext?: string | null;
  /**
   * Recognition-gap context (character-info storage) — from
   * `recognitionPromptContext`: the people who knew the character before a drastic
   * change and don't recognise them now. null/absent when no gap is open (or while
   * a persona is worn — the gap is about the TRUE face).
   */
  recognitionContext?: string | null;
  /**
   * Gated chunks from `retrieveChunks` (issue #64), in retrieval-rank order.
   * They fill whatever lore budget the curated entries leave — authored lore
   * is never crowded out.
   */
  retrievedChunks?: RetrievedLoreChunk[];
  /**
   * Per-city narration tone (issue #23), one sentence, from
   * `cityNarrationDirective(location)`. Omitted/`null` for cities with no
   * specific tone — the assembler then drops the layer.
   */
  cityNarration?: string | null;
  /**
   * Player-chosen narration length (verbosity preset). Absent/"standard" emits
   * no directive; "concise"/"rich" add a `## Narration Length` system layer.
   */
  verbosity?: NarrativeVerbosity;
  /**
   * Scene-relevant + pivotal Codex entities (history-context Codex), selected
   * by the engine (`selectPinnedEntities`/`pinnedEntitiesForPrompt`) and pinned
   * into the `## Established Facts` block of the history layer as canon the
   * narrator must not contradict. Bounded (hard-capped) regardless of how large
   * the full Codex grows, so the per-turn budget stays flat. Absent/empty drops
   * the block.
   */
  pinnedEntities?: PinnedCodexEntity[];
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
  /**
   * Optional JSON Schema for server-side structured output (issue #201, item 3).
   * Only the Anthropic adapter consumes it (via `output_config.format`) and only
   * when the model/base URL supports it; other adapters ignore it and keep their
   * native JSON mode (`response_format` / `format: "json"`). When set, it enforces
   * the response shape server-side, so the system-directive + corrective-retry
   * path is a fallback rather than the primary mechanism.
   */
  jsonSchema?: Record<string, unknown>;
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
