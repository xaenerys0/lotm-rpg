@../../../docs/rules/testing.md

# AI Integration Layer

Provider-agnostic LLM interface with tiered prompt architecture. The AI generates narrative and soft lore (Tier 2/3) while the rules engine handles hard mechanics (Tier 1).

## Structure

- `types.ts` — All AI-related type definitions: providers, responses, prompts, memory, game state.
- `errors.ts` — `AIError` class with unified error codes: AUTH_ERROR, RATE_LIMITED, QUOTA_EXCEEDED, PROVIDER_ERROR, MALFORMED_OUTPUT, VALIDATION_FAILED, NETWORK_ERROR, TOKEN_LIMIT_EXCEEDED.
- `providers.ts` — Provider adapters: Anthropic, OpenAI, OpenRouter, Ollama, Custom. Each implements `LLMProviderAdapter` interface. Factory: `createAdapter(providerId, baseUrl?)`.
- `prompts.ts` — 5-layer prompt assembly: system prompt, lore context, game state, history, instruction. Token budget enforcement (7,300 total).
- `memory.ts` — Tiered memory manager: immediate (last 3-5 turns full), recent (turns 6-20 bullets), session facts. Rule-based summarization (no extra LLM call).
- `validation.ts` — Parse and validate AI output: JSON parsing with code-block extraction, structural validation (sanity bounds, choice limits, alignment range), `sanitizeAIResponse` for auto-correction.
- `client.ts` — Main orchestrator: `generate()` assembles prompt, selects model by tier, calls provider with retry, parses/validates response. `classifyCall()` determines routine vs premium. `validateProviderConfig()` checks API key validity.
- `prologue-client.ts` — AI-driven prologue generation: `generatePrologueScene()` runs a 5-scene interactive prologue using multi-turn conversation. The AI tracks Beyonder pathway affinity and engineers a pathway-specific chance encounter conclusion.
- `index.ts` — Public exports.
- `ai.test.ts` — Comprehensive test suite.

## Key Design Decisions

- **Stateless single-turn calls.** Every AI call is self-contained — no multi-turn conversation threads.
- **BYOK (Bring Your Own Key).** API keys stored client-side only (localStorage). Never sent to our backend.
- **Direct browser-to-provider calls.** No proxy server needed for supported providers.
- **Model tiering.** Calls classified as `routine` or `premium` based on instruction type. Advancement and combat are premium; everything else is routine.
- **Token budget enforcement.** History is trimmed if prompt exceeds 7,300 tokens. System prompt and game state are never trimmed.

## Conventions

- All provider adapters implement `LLMProviderAdapter` interface — swap providers with config change only.
- Validation functions return `ValidationResult` (same pattern as rules engine) — never throw.
- `sanitizeAIResponse` clamps out-of-range values rather than rejecting — player always gets a response.
- Error handling uses exponential backoff retry (2s, 4s, 8s) for retryable errors.
