@../../../docs/rules/testing.md

# AI Integration Layer

Provider-agnostic LLM interface with tiered prompt architecture. The AI generates narrative and soft lore (Tier 2/3) while the rules engine handles hard mechanics (Tier 1).

## Structure

- `types.ts` — All AI-related type definitions: providers, responses, prompts, memory, game state.
- `errors.ts` — `AIError` class with unified error codes: AUTH_ERROR, RATE_LIMITED, QUOTA_EXCEEDED, PROVIDER_ERROR, MALFORMED_OUTPUT, VALIDATION_FAILED, NETWORK_ERROR, TOKEN_LIMIT_EXCEEDED.
- `providers.ts` — Provider adapters: Anthropic, OpenAI, OpenRouter, Ollama, Custom. Each implements `LLMProviderAdapter` interface (incl. `listModels(apiKey)` for the live model catalog). Factory: `createAdapter(providerId, baseUrl?)`. The Anthropic adapter prefills the assistant turn with `{` to force JSON (no `response_format` support). `parseResponse` sets `truncated` from the provider's stop/finish reason. `inferModelTier(id)` guesses a tier for dynamically-listed models.
- `prompts.ts` — 5-layer prompt assembly: system prompt, lore context, game state, history, instruction. Token budget enforcement (7,300 total).
- `memory.ts` — Tiered memory manager: immediate (last 3-5 turns full), recent (turns 6-20 bullets), session facts. Rule-based summarization (no extra LLM call).
- `validation.ts` — Parse and validate AI output: JSON parsing with code-block extraction (plus a forgiving first-`{`…last-`}` fallback when prose surrounds the JSON), structural validation (sanity bounds, choice limits, alignment range), `sanitizeAIResponse` for auto-correction.
- `client.ts` — Main orchestrator: `generate()` assembles prompt, selects model by tier, calls provider with retry, parses/validates response. JSON parsing retries up to `MAX_PARSE_ATTEMPTS` with a corrective prompt (truncation-aware) and lowered temperature. `classifyCall()` determines routine vs premium. `validateProviderConfig()` checks API key validity. `listProviderModels()` fetches the provider's live model catalog.
- `prologue-client.ts` — AI-driven prologue generation. `generatePrologueScene()` runs an interactive multi-turn prologue where each scene presents EXACTLY `PROLOGUE_AFFINITY_COUNT` (4) choices, one per Beyonder affinity, each tagged with an `affinities` weight map (`{pathwayId: weight}`). The AI only narrates and tags choices — it never judges or scores the pathway (no `inferredPathwayId`); `readyToConclude` is advisory and the engine enforces MIN/MAX. Validation is strict (exactly 4 choices, each with a positive-int/positive-weight affinity map, the four dominant affinities all present) and throws `AIError("MALFORMED_OUTPUT")` rather than silently defaulting to a pathway. `generatePrologueFinale()` is a separate, player-decided step: the engine computes the candidate pathway ids (the only place a pathway id enters a prompt) and the AI renders exactly those as evocatively-described potion choices; the player's pick IS the final pathway.
- `index.ts` — Public exports.
- `ai.test.ts` — Comprehensive test suite.

## Key Design Decisions

- **Stateless single-turn calls.** Every AI call is self-contained — no multi-turn conversation threads.
- **BYOK (Bring Your Own Key).** API keys stored client-side only (localStorage). Never sent to our backend.
- **Direct browser-to-provider calls.** No proxy server needed for supported providers.
- **Model tiering.** Calls classified as `routine` or `premium` based on instruction type. Advancement and combat are premium; everything else is routine.
- **Token budget enforcement.** History is trimmed if prompt exceeds 7,300 tokens. System prompt and game state are never trimmed.
- **Robust JSON output.** Output cap is `MAX_OUTPUT_TOKENS` (3072) to avoid mid-JSON truncation; Anthropic uses assistant prefill, OpenAI-style providers use `response_format: json_object`. Malformed/truncated output triggers a corrective retry loop (`MAX_PARSE_ATTEMPTS`).
- **Live model lists.** `listModels()` reuses each provider's catalog endpoint (`/models`, `/api/tags`); the config UI caches results in localStorage and falls back to the static `PROVIDER_MODELS` map.

## Conventions

- All provider adapters implement `LLMProviderAdapter` interface — swap providers with config change only.
- Validation functions return `ValidationResult` (same pattern as rules engine) — never throw.
- `sanitizeAIResponse` clamps out-of-range values rather than rejecting — player always gets a response.
- Error handling uses exponential backoff retry (2s, 4s, 8s) for retryable errors.
