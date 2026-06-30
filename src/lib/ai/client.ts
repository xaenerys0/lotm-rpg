import type {
  AIResponse,
  CallClassification,
  ChatMessage,
  GameState,
  InstructionType,
  ModelOption,
  NarrativeVerbosity,
  PinnedCodexEntity,
  ProviderConfig,
  ProviderResponse,
  ValidatedAIResponse,
  RetrievedLoreChunk,
} from "./types";
import { AIError } from "./errors";
import {
  createAdapter,
  anthropicSupportsStructuredOutput,
  type LLMProviderAdapter,
} from "./providers";
import { assemblePrompt, promptToMessages } from "./prompts";
import type { MemoryState, LoreContext, CodexUpdateInput } from "./types";
import { parseAIResponse, sanitizeAIResponse, validateAIResponse } from "./validation";
import { AI_RESPONSE_JSON_SCHEMA } from "./response-schema";
import {
  buildCodexRebuildPrompt,
  parseCodexRebuild,
  type CodexRebuildInput,
} from "./codex-rebuild";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [2000, 4000, 8000];
// Sized to comfortably fit a full narrative + choices + state changes; 1500 was
// prone to truncating mid-JSON, which surfaced as "random" malformed output.
// Shared with the prologue path (prologue-client.ts) via the export block below,
// so it reuses the exact cap rather than duplicating the magic number — both hit
// the same mid-JSON truncation.
const MAX_OUTPUT_TOKENS = 3072;
// The one-shot Codex rebuild emits up to MAX_REBUILD_ENTITIES compact entries —
// a larger ceiling than a turn so the whole registry fits without truncation.
const REBUILD_MAX_TOKENS = 4096;
// Total attempts to obtain parseable JSON: the initial call plus corrective
// retries that feed the bad output back with an instruction to fix it.
const MAX_PARSE_ATTEMPTS = 3;
const ROUTINE_TEMPERATURE = 0.8;
const PREMIUM_TEMPERATURE = 0.7;

const PREMIUM_INSTRUCTIONS: InstructionType[] = ["advancement", "combat"];

export function classifyCall(instruction: InstructionType): CallClassification {
  return PREMIUM_INSTRUCTIONS.includes(instruction) ? "premium" : "routine";
}

export function selectModel(
  config: ProviderConfig,
  classification: CallClassification,
): string {
  return classification === "premium" ? config.premiumModel : config.routineModel;
}

function getTemperature(classification: CallClassification): number {
  return classification === "premium" ? PREMIUM_TEMPERATURE : ROUTINE_TEMPERATURE;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every provider (Anthropic, OpenAI, OpenRouter, Ollama, Ollama-Cloud, Custom)
// is called browser-direct or through a thin proxy, so a failed turn has no
// server-side log — it otherwise vanishes into a generic "Something went wrong"
// in the UI. Logging here, the single seam both the main turn loop and the
// prologue funnel through, makes every provider failure visible in devtools with
// the status, error code, and the provider's own reason/body. The intentional
// probe/validate paths (`probeModelAccess`, `validateKey`) call adapters
// directly and bypass this, so expected probe errors don't add noise. The API
// key is never logged — only the response/error carried on the AIError is.
function logProviderFailure(
  provider: string,
  model: string,
  attempt: number,
  err: AIError,
): void {
  console.error(
    "[ai] provider call failed",
    JSON.stringify({
      provider,
      model,
      attempt,
      code: err.code,
      status: err.status,
      retryable: err.retryable,
      reason: err.reason,
      body: err.providerMessage?.slice(0, 500),
    }),
  );
}

export async function executeWithRetry(
  adapter: LLMProviderAdapter,
  request: Parameters<LLMProviderAdapter["makeRequest"]>[0],
  apiKey: string,
): Promise<ProviderResponse> {
  let lastError: AIError | undefined;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      return await adapter.makeRequest(request, apiKey);
    } catch (err) {
      if (err instanceof AIError) {
        lastError = err;
        logProviderFailure(adapter.name, request.model, attempt, err);
        if (!err.retryable || attempt >= RETRY_DELAYS.length) {
          throw err;
        }
        await sleep(RETRY_DELAYS[attempt]);
      } else {
        throw err;
      }
    }
  }

  throw lastError ?? new AIError("PROVIDER_ERROR", "Max retries exceeded");
}

export interface GenerateOptions {
  config: ProviderConfig;
  gameState: GameState;
  memory: MemoryState;
  loreContext: LoreContext;
  /** Gated retrieval results (issue #64); packed after the curated lore. */
  retrievedChunks?: RetrievedLoreChunk[];
  /** Active-persona context (issue #22), from `identityPromptContext`. */
  identityContext?: string | null;
  /** Carried Sealed Artifact effects, from `artifactNarratorContext`. */
  artifactEffectsContext?: string | null;
  /** True-self ground-truth context, from `profilePromptContext`. */
  profileContext?: string | null;
  /** Recognition-gap context, from `recognitionPromptContext`. */
  recognitionContext?: string | null;
  /** Epoch tone directive (issues #26/#29), from `epochNarrationDirective`. */
  epochContext?: string | null;
  /** Per-city narration tone (issue #23), from `cityNarrationDirective`. */
  cityNarration?: string | null;
  /** Player-chosen narration length (verbosity preset); absent/"standard" = baseline. */
  verbosity?: NarrativeVerbosity;
  /**
   * Scene-relevant + pivotal Codex entities (history-context Codex), pinned into
   * the `## Established Facts` block. Bounded by the engine's selection cap.
   */
  pinnedEntities?: PinnedCodexEntity[];
  instruction: InstructionType;
  playerAction: string;
  abilities: string[];
  actingRequirements: string[];
}

export async function generate(options: GenerateOptions): Promise<ValidatedAIResponse> {
  const adapter = createAdapter(options.config.providerId, options.config.baseUrl);
  const classification = classifyCall(options.instruction);
  const model = selectModel(options.config, classification);
  const temperature = getTemperature(classification);

  const assembly = assemblePrompt({
    gameState: options.gameState,
    memory: options.memory,
    loreContext: options.loreContext,
    retrievedChunks: options.retrievedChunks,
    identityContext: options.identityContext,
    artifactEffectsContext: options.artifactEffectsContext,
    profileContext: options.profileContext,
    recognitionContext: options.recognitionContext,
    epochContext: options.epochContext,
    cityNarration: options.cityNarration,
    verbosity: options.verbosity,
    pinnedEntities: options.pinnedEntities,
    instruction: options.instruction,
    playerAction: options.playerAction,
    abilities: options.abilities,
    actingRequirements: options.actingRequirements,
  });

  const messages = promptToMessages(assembly);

  // Server-side structured output (issue #201, item 3): only the Anthropic path,
  // and only for models/base URLs known to support `output_config.format`. Other
  // providers and unsupported Anthropic configs keep their native JSON mode.
  const jsonSchema =
    options.config.providerId === "anthropic" &&
    anthropicSupportsStructuredOutput(model, options.config.baseUrl)
      ? (AI_RESPONSE_JSON_SCHEMA as unknown as Record<string, unknown>)
      : undefined;

  let aiResponse = await requestAndParse(
    adapter,
    messages,
    model,
    temperature,
    options.config.apiKey,
    jsonSchema,
  );

  const validation = validateAIResponse(aiResponse);

  if (!validation.valid) {
    aiResponse = sanitizeAIResponse(aiResponse);
  }

  const finalValidation = validateAIResponse(aiResponse);

  return {
    response: aiResponse,
    validation: finalValidation,
    // Rough per-call token estimate (issue #15): prompt side from the
    // assembly's own budget arithmetic, output side from the parsed JSON.
    usage: {
      promptTokens: assembly.totalTokenEstimate,
      outputTokens: Math.ceil(JSON.stringify(aiResponse).length / 4),
    },
  };
}

/**
 * One-shot Codex rebuild (history-context Codex): run the chronicle digest
 * through the provider and parse a clean, categorized, de-duplicated set of
 * entity deltas. Reuses the same adapter + retry seam as `generate()`; the
 * caller folds the result into a fresh `codexState` via `applyCodexUpdates`.
 * The pure prompt/parse live in `codex-rebuild.ts`.
 */
export async function generateCodexRebuild(
  config: ProviderConfig,
  input: CodexRebuildInput,
): Promise<CodexUpdateInput[]> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
  // Premium model: a one-time, accuracy-sensitive extraction over the whole
  // chronicle — worth the better model, and it runs at most once per rebuild.
  const model = selectModel(config, "premium");
  const messages = buildCodexRebuildPrompt(input);

  // Parse-retry loop (mirrors the main turn's `requestAndParse`): the rebuild
  // must survive a provider that wraps the JSON in prose, truncates it, or
  // returns a degenerate empty completion. The FIRST attempt is deterministic
  // (temperature 0) so a clean run is stable/repeatable; a failed parse then
  // re-prompts with a corrective instruction AND a small temperature so a
  // degenerate temp-0 output isn't reproduced verbatim (which would make the
  // retry pointless). Browser-direct BYOK has no server log, so each unparseable
  // attempt is surfaced to the console for diagnosis (the key is never logged).
  const convo = [...messages];
  for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt++) {
    const response = await executeWithRetry(
      adapter,
      {
        messages: convo,
        model,
        temperature: attempt === 0 ? 0 : 0.4,
        maxTokens: REBUILD_MAX_TOKENS,
        responseFormat: { type: "json_object" },
      },
      config.apiKey,
    );
    const updates = parseCodexRebuild(response.content);
    if (updates.length > 0) return updates;
    logUnparseableOutput(config.providerId, model, attempt + 1, response);
    // Feed the bad reply back with a corrective instruction for the next pass.
    convo.push(
      { role: "assistant", content: response.content },
      { role: "user", content: correctiveMessage(response.truncated ?? false) },
    );
  }
  return [];
}

export function correctiveMessage(truncated: boolean): string {
  if (truncated) {
    return "Your previous response was cut off before the JSON was complete. Respond with a COMPLETE but more concise JSON object matching the required schema — shorten the narrative if needed. Output ONLY the JSON, no markdown or commentary.";
  }
  return "Your previous response was not valid JSON. Please respond with ONLY a valid JSON object matching the required schema. No markdown, no code blocks, just the JSON object.";
}

export function logUnparseableOutput(
  provider: string,
  model: string,
  attempt: number,
  response: ProviderResponse,
): void {
  const content = response.content ?? "";
  console.error(
    "[ai] unparseable provider output",
    JSON.stringify({
      provider,
      model,
      attempt,
      truncated: response.truncated ?? false,
      contentLength: content.length,
      contentHead: content.slice(0, 400),
      contentTail: content.slice(-200),
    }),
  );
}

/**
 * Request structured output and parse it, retrying with a corrective prompt
 * when the JSON is malformed or truncated. Each retry lowers temperature and
 * feeds the bad output back so the model can fix it.
 */
async function requestAndParse(
  adapter: LLMProviderAdapter,
  baseMessages: ChatMessage[],
  model: string,
  temperature: number,
  apiKey: string,
  jsonSchema?: Record<string, unknown>,
): Promise<AIResponse> {
  let messages = baseMessages;
  // Use server-side structured output when a schema was supplied (Anthropic only,
  // gated by the caller). If the provider rejects it with a 400 — an unexpected
  // model/proxy that doesn't support `output_config` — drop the schema and fall
  // back to the system-directive path once, so a BYOK edge case never hard-fails.
  let useSchema = jsonSchema !== undefined;

  for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt++) {
    let providerResponse: ProviderResponse;
    try {
      providerResponse = await executeWithRetry(
        adapter,
        {
          messages,
          model,
          temperature: attempt === 0 ? temperature : temperature * 0.5,
          maxTokens: MAX_OUTPUT_TOKENS,
          responseFormat: { type: "json_object" },
          ...(useSchema ? { jsonSchema } : {}),
        },
        apiKey,
      );
    } catch (err) {
      if (useSchema && err instanceof AIError && err.status === 400) {
        useSchema = false;
        attempt--; // the format fallback does not consume a parse attempt
        continue;
      }
      throw err;
    }

    try {
      return parseAIResponse(providerResponse.content);
    } catch (parseError) {
      // The client-side complement to the ollama-cloud proxy diagnostic: when a
      // 2xx body fails to parse into the game's JSON (the gpt-oss/Harmony failure
      // mode, but reachable on any provider), log the provider, model, truncation
      // flag, and head/tail of the raw output so the real shape is visible in
      // devtools rather than just surfacing as MALFORMED_OUTPUT.
      if (parseError instanceof AIError && parseError.code === "MALFORMED_OUTPUT") {
        logUnparseableOutput(adapter.name, model, attempt, providerResponse);
      }
      if (
        !(parseError instanceof AIError) ||
        parseError.code !== "MALFORMED_OUTPUT" ||
        attempt === MAX_PARSE_ATTEMPTS - 1
      ) {
        throw parseError;
      }
      messages = [
        ...baseMessages,
        { role: "assistant", content: providerResponse.content.slice(0, 4000) },
        { role: "user", content: correctiveMessage(providerResponse.truncated ?? false) },
      ];
    }
  }

  // Unreachable: the final attempt always returns or rethrows above.
  throw new AIError("MALFORMED_OUTPUT", "Failed to parse AI response after retries");
}

export async function validateProviderConfig(
  config: ProviderConfig,
): Promise<{ valid: boolean; error?: string }> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
  return adapter.validateKey(config.apiKey);
}

/** Fetch the provider's live model catalog for the given config. */
export async function listProviderModels(config: ProviderConfig): Promise<ModelOption[]> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
  return adapter.listModels(config.apiKey);
}

/**
 * Return the configured model ids (`routineModel`/`premiumModel`) that are NOT
 * present in the provider's live catalog. A non-empty result means a turn using
 * that model will likely be rejected upstream — e.g. an Ollama-Cloud account
 * that does not serve `gpt-oss:120b` returns a 403 only when a premium
 * (advancement/combat) call is made. Surfacing it at config time turns that
 * mid-game failure into an actionable Settings warning. Pure: blank ids and an
 * empty catalog (catalog unavailable) yield no findings, and duplicates collapse.
 */
export function findUnservedModels(
  config: ProviderConfig,
  catalog: ModelOption[],
): string[] {
  if (catalog.length === 0) return [];
  const served = new Set(catalog.map((m) => m.id));
  const configured = [config.routineModel, config.premiumModel].filter(
    (id) => id.trim().length > 0,
  );
  return [...new Set(configured)].filter((id) => !served.has(id));
}

export interface ModelAccessResult {
  /** The model id that was probed. */
  model: string;
  /** True when a minimal chat call succeeded — the account can actually run it. */
  accessible: boolean;
  /** When inaccessible, the provider's own reason (e.g. the subscription notice). */
  reason?: string;
}

/**
 * Verify that the account can actually RUN the given models, not just that they
 * are listed. ollama.com's `/v1/models` returns its whole cloud catalog
 * regardless of plan, so a listed (and selectable) model can still 403 — "this
 * model requires a subscription, upgrade for access" — the first time a chat
 * call hits it mid-game. A minimal `max_tokens: 1` chat probe is the only way to
 * learn entitlement up front.
 *
 * A model is flagged inaccessible only on a definitive per-model refusal: 403
 * (gated / not on plan) or 404 (not found). A 401 (bad key), 429 (rate limit),
 * 5xx, or network error is inconclusive — it isn't this model's fault — so the
 * model stays accessible and we never warn on a transient or key-wide failure.
 * Never throws; blank ids are dropped and duplicates collapse.
 */
export async function probeModelAccess(
  config: ProviderConfig,
  modelIds: string[],
): Promise<ModelAccessResult[]> {
  const adapter = createAdapter(config.providerId, config.baseUrl);
  const unique = [
    ...new Set(modelIds.map((id) => id.trim()).filter((id) => id.length > 0)),
  ];
  return Promise.all(unique.map((model) => probeOne(adapter, config.apiKey, model)));
}

async function probeOne(
  adapter: LLMProviderAdapter,
  apiKey: string,
  model: string,
): Promise<ModelAccessResult> {
  try {
    await adapter.makeRequest(
      {
        model,
        messages: [{ role: "user", content: "ping" }],
        temperature: 0,
        maxTokens: 1,
      },
      apiKey,
    );
    return { model, accessible: true };
  } catch (err) {
    if (err instanceof AIError && (err.status === 403 || err.status === 404)) {
      return { model, accessible: false, reason: err.reason };
    }
    return { model, accessible: true };
  }
}

export { MAX_RETRIES, RETRY_DELAYS, MAX_OUTPUT_TOKENS, MAX_PARSE_ATTEMPTS };
