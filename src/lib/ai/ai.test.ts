import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  AIError,
  classifyHttpError,
  createMalformedOutputError,
  createNetworkError,
} from "./errors";
import type {
  AIResponse,
  GameState,
  MemoryState,
  ProviderConfig,
  ProviderRequest,
  ChatMessage,
  LoreContext,
  TurnRecord,
} from "./types";
import { PROVIDER_MODELS } from "./types";
import {
  OpenAIAdapter,
  AnthropicAdapter,
  OpenRouterAdapter,
  OllamaAdapter,
  OllamaCloudAdapter,
  CustomAdapter,
  createAdapter,
  inferModelTier,
} from "./providers";
import {
  buildSystemPrompt,
  buildLoreContext,
  selectRetrievedForBudget,
  buildSanityDirective,
  buildDemigodDirective,
  buildGameStatePrompt,
  buildHistoryPrompt,
  buildInstructionPrompt,
  assemblePrompt,
  promptToMessages,
  isWithinTokenBudget,
  TOKEN_BUDGET,
} from "./prompts";
import {
  SANITY_TIER_THRESHOLDS,
  sanityPercent,
  classifySanityTier,
  sanityNarrationDirective,
} from "./sanity";
import {
  createMemoryState,
  addTurn,
  addSessionFact,
  summarizeTurn,
  extractSessionFacts,
  estimateMemoryTokens,
  trimMemoryForBudget,
  formatMemoryForPrompt,
  buildTurnRecord,
} from "./memory";
import { parseAIResponse, validateAIResponse, sanitizeAIResponse } from "./validation";
import {
  classifyCall,
  selectModel,
  generate,
  validateProviderConfig,
  listProviderModels,
  MAX_RETRIES,
  RETRY_DELAYS,
  MAX_OUTPUT_TOKENS,
  MAX_PARSE_ATTEMPTS,
} from "./client";
import {
  generatePrologueScene,
  generatePrologueFinale,
  MIN_PROLOGUE_SCENES,
  MAX_PROLOGUE_SCENES,
  PROLOGUE_AFFINITY_COUNT,
  type PrologueTurn,
} from "./prologue-client";

// ── Test Helpers ──

function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    characterId: "char-1",
    pathwayId: 1,
    sequenceLevel: 9,
    sanity: 80,
    maxSanity: 100,
    inventory: [],
    location: "Tingen City",
    activeQuests: ["Find the Seer potion formula"],
    npcsPresent: ["Dunn Smith"],
    ...overrides,
  };
}

function makeMemoryState(): MemoryState {
  return createMemoryState();
}

function makeLoreContext(): LoreContext {
  return {
    entries: [
      {
        slug: "test-lore",
        title: "Test Lore",
        category: "pathway",
        content: "This is test lore content for the Fool pathway.",
        pathway: "Fool",
        npcs: [],
        sequences: [9],
        tags: ["test"],
        tokenCount: 50,
      },
    ],
    totalTokens: 50,
  };
}

function makeProviderConfig(overrides?: Partial<ProviderConfig>): ProviderConfig {
  return {
    providerId: "openai",
    apiKey: "sk-test-key",
    routineModel: "gpt-4o-mini",
    premiumModel: "gpt-4o",
    ...overrides,
  };
}

function makeValidAIResponse(): AIResponse {
  return {
    narrative: "The fog parts before you as you step into the dimly lit alley.",
    choices: [
      { id: "1", text: "Investigate the shadows", type: "investigation" },
      { id: "2", text: "Call out to the figure", type: "dialogue" },
    ],
    sanityImpact: -2,
    actingEvaluation: { alignment: 0.7, reasoning: "Maintained mysterious demeanor" },
  };
}

function makeTurnRecord(turnNumber: number): TurnRecord {
  return buildTurnRecord(turnNumber, "I search the room", makeValidAIResponse());
}

// ── Error Tests ──

describe("errors", () => {
  describe("AIError", () => {
    it("creates error with correct properties", () => {
      const err = new AIError("AUTH_ERROR", "Invalid key", "raw msg");
      expect(err.code).toBe("AUTH_ERROR");
      expect(err.message).toBe("Invalid key");
      expect(err.providerMessage).toBe("raw msg");
      expect(err.name).toBe("AIError");
      expect(err.retryable).toBe(false);
    });

    it("marks RATE_LIMITED as retryable", () => {
      const err = new AIError("RATE_LIMITED", "too fast");
      expect(err.retryable).toBe(true);
    });

    it("marks PROVIDER_ERROR as retryable", () => {
      const err = new AIError("PROVIDER_ERROR", "server down");
      expect(err.retryable).toBe(true);
    });

    it("marks MALFORMED_OUTPUT as retryable", () => {
      const err = new AIError("MALFORMED_OUTPUT", "bad json");
      expect(err.retryable).toBe(true);
    });

    it("marks AUTH_ERROR as non-retryable", () => {
      const err = new AIError("AUTH_ERROR", "bad key");
      expect(err.retryable).toBe(false);
    });

    it("marks QUOTA_EXCEEDED as non-retryable", () => {
      const err = new AIError("QUOTA_EXCEEDED", "over limit");
      expect(err.retryable).toBe(false);
    });

    it("marks VALIDATION_FAILED as non-retryable", () => {
      const err = new AIError("VALIDATION_FAILED", "failed");
      expect(err.retryable).toBe(false);
    });

    it("marks NETWORK_ERROR as non-retryable", () => {
      const err = new AIError("NETWORK_ERROR", "no network");
      expect(err.retryable).toBe(false);
    });

    it("marks TOKEN_LIMIT_EXCEEDED as non-retryable", () => {
      const err = new AIError("TOKEN_LIMIT_EXCEEDED", "too long");
      expect(err.retryable).toBe(false);
    });

    it("creates error without provider message", () => {
      const err = new AIError("AUTH_ERROR", "Invalid key");
      expect(err.providerMessage).toBeUndefined();
    });
  });

  describe("classifyHttpError", () => {
    it("classifies 401 as AUTH_ERROR", () => {
      const err = classifyHttpError(401, "unauthorized");
      expect(err.code).toBe("AUTH_ERROR");
    });

    it("classifies 403 as AUTH_ERROR", () => {
      const err = classifyHttpError(403, "forbidden");
      expect(err.code).toBe("AUTH_ERROR");
    });

    it("classifies 429 as RATE_LIMITED", () => {
      const err = classifyHttpError(429, "too many");
      expect(err.code).toBe("RATE_LIMITED");
    });

    it("classifies 402 as QUOTA_EXCEEDED", () => {
      const err = classifyHttpError(402, "payment required");
      expect(err.code).toBe("QUOTA_EXCEEDED");
    });

    it("classifies 500 as PROVIDER_ERROR", () => {
      const err = classifyHttpError(500, "server error");
      expect(err.code).toBe("PROVIDER_ERROR");
    });

    it("classifies 503 as PROVIDER_ERROR", () => {
      const err = classifyHttpError(503, "unavailable");
      expect(err.code).toBe("PROVIDER_ERROR");
    });

    it("classifies unknown status as PROVIDER_ERROR", () => {
      const err = classifyHttpError(418, "teapot");
      expect(err.code).toBe("PROVIDER_ERROR");
      expect(err.message).toContain("418");
    });
  });

  describe("createMalformedOutputError", () => {
    it("creates error with truncated provider message", () => {
      const longOutput = "x".repeat(600);
      const err = createMalformedOutputError(longOutput);
      expect(err.code).toBe("MALFORMED_OUTPUT");
      expect(err.providerMessage!.length).toBe(500);
    });

    it("creates error with short provider message", () => {
      const err = createMalformedOutputError("short");
      expect(err.providerMessage).toBe("short");
    });
  });

  describe("createNetworkError", () => {
    it("creates error from Error instance", () => {
      const err = createNetworkError(new Error("fetch failed"));
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.message).toContain("fetch failed");
    });

    it("creates error from unknown value", () => {
      const err = createNetworkError("something");
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.message).toContain("Unknown network error");
    });
  });
});

// ── Provider Tests ──

describe("providers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createAdapter", () => {
    it("creates OpenAI adapter", () => {
      const adapter = createAdapter("openai");
      expect(adapter.name).toBe("openai");
    });

    it("creates Anthropic adapter", () => {
      const adapter = createAdapter("anthropic");
      expect(adapter.name).toBe("anthropic");
    });

    it("creates OpenRouter adapter", () => {
      const adapter = createAdapter("openrouter");
      expect(adapter.name).toBe("openrouter");
    });

    it("creates Ollama adapter", () => {
      const adapter = createAdapter("ollama");
      expect(adapter.name).toBe("ollama");
    });

    it("creates Custom adapter", () => {
      const adapter = createAdapter("custom", "http://my-llm.local/v1");
      expect(adapter.name).toBe("custom");
    });
  });

  describe("OpenAIAdapter", () => {
    it("returns correct default base URL", () => {
      const adapter = new OpenAIAdapter();
      expect(adapter.getDefaultBaseUrl()).toBe("https://api.openai.com/v1");
    });

    it("formats messages as pass-through", () => {
      const adapter = new OpenAIAdapter();
      const msgs: ChatMessage[] = [
        { role: "system", content: "sys" },
        { role: "user", content: "hi" },
      ];
      expect(adapter.formatMessages(msgs)).toEqual(msgs);
    });

    it("parses OpenAI-style response", () => {
      const adapter = new OpenAIAdapter();
      const raw = {
        choices: [{ message: { content: '{"narrative":"test"}' } }],
        model: "gpt-4o",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          prompt_tokens_details: { cached_tokens: 0 },
        },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe('{"narrative":"test"}');
      expect(parsed.model).toBe("gpt-4o");
      expect(parsed.usage.promptTokens).toBe(100);
      expect(parsed.usage.completionTokens).toBe(50);
      expect(parsed.usage.totalTokens).toBe(150);
      expect(parsed.usage.cacheHit).toBe(false);
    });

    it("parses response with cache hit", () => {
      const adapter = new OpenAIAdapter();
      const raw = {
        choices: [{ message: { content: "test" } }],
        model: "gpt-4o",
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          prompt_tokens_details: { cached_tokens: 80 },
        },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.cacheHit).toBe(true);
    });

    it("handles empty choices array", () => {
      const adapter = new OpenAIAdapter();
      const raw = { choices: [], usage: {} };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe("");
      expect(parsed.model).toBe("unknown");
    });

    it("handles missing usage", () => {
      const adapter = new OpenAIAdapter();
      const raw = { choices: [{ message: { content: "x" } }] };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.promptTokens).toBe(0);
    });

    it("handles missing prompt_tokens_details", () => {
      const adapter = new OpenAIAdapter();
      const raw = {
        choices: [{ message: { content: "x" } }],
        model: "gpt-4o",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.cacheHit).toBe(false);
    });

    it("makeRequest calls fetch with correct parameters", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: "result" } }],
              model: "gpt-4o-mini",
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
          ),
      } as Response);

      const request: ProviderRequest = {
        messages: [{ role: "user", content: "hi" }],
        model: "gpt-4o-mini",
        temperature: 0.8,
        maxTokens: 1000,
        responseFormat: { type: "json_object" },
      };
      const result = await adapter.makeRequest(request, "sk-key");
      expect(result.content).toBe("result");
      expect(fetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer sk-key",
          }),
        }),
      );
    });

    it("makeRequest throws on HTTP error", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("unauthorized"),
      } as Response);

      await expect(
        adapter.makeRequest(
          {
            messages: [],
            model: "gpt-4o-mini",
            temperature: 0.8,
            maxTokens: 1000,
          },
          "bad-key",
        ),
      ).rejects.toThrow(AIError);
    });

    it("makeRequest throws on network error", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network failure"));

      await expect(
        adapter.makeRequest(
          {
            messages: [],
            model: "gpt-4o-mini",
            temperature: 0.8,
            maxTokens: 1000,
          },
          "key",
        ),
      ).rejects.toThrow(AIError);
    });

    it("makeRequest wraps non-JSON 200 response as MALFORMED_OUTPUT", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("<html>Maintenance</html>"),
      } as Response);

      try {
        await adapter.makeRequest(
          {
            messages: [],
            model: "gpt-4o-mini",
            temperature: 0.8,
            maxTokens: 1000,
          },
          "key",
        );
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as AIError).code).toBe("MALFORMED_OUTPUT");
      }
    });

    it("makeRequest wraps response.text() failure as NETWORK_ERROR", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.reject(new Error("body stream interrupted")),
      } as Response);

      try {
        await adapter.makeRequest(
          {
            messages: [],
            model: "gpt-4o-mini",
            temperature: 0.8,
            maxTokens: 1000,
          },
          "key",
        );
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as AIError).code).toBe("NETWORK_ERROR");
      }
    });

    it("validateKey returns valid on success", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      const result = await adapter.validateKey("sk-key");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid on error", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("bad"),
      } as Response);

      const result = await adapter.validateKey("bad-key");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("validateKey handles non-Error throws", async () => {
      const adapter = new OpenAIAdapter();
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("string error");

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(false);
    });
  });

  describe("AnthropicAdapter", () => {
    it("returns correct default base URL", () => {
      const adapter = new AnthropicAdapter();
      expect(adapter.getDefaultBaseUrl()).toBe("https://api.anthropic.com/v1");
    });

    it("formats messages separating system from user/assistant", () => {
      const adapter = new AnthropicAdapter();
      const msgs: ChatMessage[] = [
        { role: "system", content: "system1" },
        { role: "system", content: "system2" },
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ];
      const result = adapter.formatMessages(msgs);
      expect(result).toEqual({
        system: "system1\n\nsystem2",
        messages: [
          { role: "user", content: "hello" },
          { role: "assistant", content: "hi" },
        ],
      });
    });

    it("parses Anthropic-style response", () => {
      const adapter = new AnthropicAdapter();
      const raw = {
        content: [{ type: "text", text: '{"narrative":"test"}' }],
        model: "claude-sonnet-4-6",
        usage: {
          input_tokens: 200,
          output_tokens: 80,
          cache_read_input_tokens: 0,
        },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe('{"narrative":"test"}');
      expect(parsed.model).toBe("claude-sonnet-4-6");
      expect(parsed.usage.promptTokens).toBe(200);
      expect(parsed.usage.completionTokens).toBe(80);
      expect(parsed.usage.totalTokens).toBe(280);
      expect(parsed.usage.cacheHit).toBe(false);
    });

    it("detects cache hit from Anthropic response", () => {
      const adapter = new AnthropicAdapter();
      const raw = {
        content: [{ type: "text", text: "x" }],
        model: "claude-sonnet-4-6",
        usage: {
          input_tokens: 200,
          output_tokens: 80,
          cache_read_input_tokens: 150,
        },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.cacheHit).toBe(true);
    });

    it("handles empty content blocks", () => {
      const adapter = new AnthropicAdapter();
      const raw = { content: [], usage: {} };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe("");
    });

    it("handles missing content blocks", () => {
      const adapter = new AnthropicAdapter();
      const raw = { usage: {} };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe("");
    });

    it("handles missing usage in response", () => {
      const adapter = new AnthropicAdapter();
      const raw = { content: [{ type: "text", text: "x" }] };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.promptTokens).toBe(0);
      expect(parsed.usage.completionTokens).toBe(0);
    });

    it("makeRequest sends correct Anthropic headers", async () => {
      const adapter = new AnthropicAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              content: [{ type: "text", text: "result" }],
              model: "claude-sonnet-4-6",
              usage: { input_tokens: 10, output_tokens: 5 },
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [
            { role: "system", content: "sys" },
            { role: "user", content: "hi" },
          ],
          model: "claude-sonnet-4-6",
          temperature: 0.8,
          maxTokens: 1000,
        },
        "sk-ant-key",
      );

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-ant-key");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
      expect(headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    });

    it("makeRequest sends system as cache-controlled block", async () => {
      const adapter = new AnthropicAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              content: [{ type: "text", text: "result" }],
              model: "claude-sonnet-4-6",
              usage: { input_tokens: 10, output_tokens: 5 },
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [
            { role: "system", content: "system prompt" },
            { role: "user", content: "hi" },
          ],
          model: "claude-sonnet-4-6",
          temperature: 0.7,
          maxTokens: 500,
        },
        "key",
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.system).toEqual([
        {
          type: "text",
          text: "system prompt",
          cache_control: { type: "ephemeral" },
        },
      ]);
    });

    it("validateKey returns valid on successful API call", async () => {
      const adapter = new AnthropicAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              content: [{ type: "text", text: "hi" }],
              usage: { input_tokens: 1, output_tokens: 1 },
            }),
          ),
      } as Response);

      const result = await adapter.validateKey("sk-ant-key");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid on auth error", async () => {
      const adapter = new AnthropicAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid or expired API key"),
      } as Response);

      const result = await adapter.validateKey("bad-key");
      expect(result.valid).toBe(false);
    });

    it("validateKey returns valid on transient errors (rate limited)", async () => {
      const adapter = new AnthropicAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("rate limited"),
      } as Response);

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid on quota exceeded", async () => {
      const adapter = new AnthropicAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 402,
        text: () => Promise.resolve("payment required"),
      } as Response);

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(false);
    });
  });

  describe("OpenRouterAdapter", () => {
    it("returns correct default base URL", () => {
      const adapter = new OpenRouterAdapter();
      expect(adapter.getDefaultBaseUrl()).toBe("https://openrouter.ai/api/v1");
    });

    it("formats messages as pass-through", () => {
      const adapter = new OpenRouterAdapter();
      const msgs: ChatMessage[] = [{ role: "user", content: "hi" }];
      expect(adapter.formatMessages(msgs)).toEqual(msgs);
    });

    it("parses response using OpenAI format", () => {
      const adapter = new OpenRouterAdapter();
      const raw = {
        choices: [{ message: { content: "test" } }],
        model: "openai/gpt-4o",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.model).toBe("openai/gpt-4o");
    });

    it("makeRequest includes OpenRouter-specific headers", async () => {
      const adapter = new OpenRouterAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: "ok" } }],
              model: "openai/gpt-4o",
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "openai/gpt-4o",
          temperature: 0.8,
          maxTokens: 1000,
          responseFormat: { type: "json_object" },
        },
        "or-key",
      );

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer or-key");
      expect(headers["X-Title"]).toBe("LOTM RPG");
    });

    it("validateKey returns valid on success", async () => {
      const adapter = new OpenRouterAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      const result = await adapter.validateKey("or-key");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid on error", async () => {
      const adapter = new OpenRouterAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("bad"),
      } as Response);

      const result = await adapter.validateKey("bad");
      expect(result.valid).toBe(false);
    });

    it("validateKey handles non-Error throws", async () => {
      const adapter = new OpenRouterAdapter();
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("string error");

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(false);
    });
  });

  describe("OllamaAdapter", () => {
    it("returns correct default base URL", () => {
      const adapter = new OllamaAdapter();
      expect(adapter.getDefaultBaseUrl()).toBe("http://localhost:11434");
    });

    it("formats messages as pass-through", () => {
      const adapter = new OllamaAdapter();
      const msgs: ChatMessage[] = [{ role: "user", content: "hi" }];
      expect(adapter.formatMessages(msgs)).toEqual(msgs);
    });

    it("parses Ollama response format", () => {
      const adapter = new OllamaAdapter();
      const raw = {
        message: { content: '{"narrative":"test"}' },
        model: "llama3.2",
        prompt_eval_count: 100,
        eval_count: 50,
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe('{"narrative":"test"}');
      expect(parsed.model).toBe("llama3.2");
      expect(parsed.usage.promptTokens).toBe(100);
      expect(parsed.usage.completionTokens).toBe(50);
      expect(parsed.usage.totalTokens).toBe(150);
    });

    it("handles missing eval counts", () => {
      const adapter = new OllamaAdapter();
      const raw = { message: { content: "x" } };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.usage.promptTokens).toBe(0);
      expect(parsed.usage.completionTokens).toBe(0);
    });

    it("handles missing message", () => {
      const adapter = new OllamaAdapter();
      const raw = {};
      const parsed = adapter.parseResponse(raw);
      expect(parsed.content).toBe("");
    });

    it("makeRequest sends correct Ollama format", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              message: { content: "result" },
              model: "llama3.2",
              prompt_eval_count: 50,
              eval_count: 25,
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "llama3.2",
          temperature: 0.8,
          maxTokens: 1000,
          responseFormat: { type: "json_object" },
        },
        "",
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.stream).toBe(false);
      expect(body.format).toBe("json");
      expect(body.options.temperature).toBe(0.8);
    });

    it("makeRequest sends undefined format without responseFormat", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              message: { content: "result" },
              model: "llama3.2",
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "llama3.2",
          temperature: 0.8,
          maxTokens: 1000,
        },
        "",
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.format).toBeUndefined();
    });

    it("validateKey returns valid when Ollama is reachable", async () => {
      const adapter = new OllamaAdapter();
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      const result = await adapter.validateKey("");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid when Ollama is not reachable", async () => {
      const adapter = new OllamaAdapter();
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new Error("connection refused"),
      );

      const result = await adapter.validateKey("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("connection refused");
    });

    it("validateKey handles non-Error throws", async () => {
      const adapter = new OllamaAdapter();
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(42);

      const result = await adapter.validateKey("");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("makeRequest omits Authorization header when apiKey is empty", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({ message: { content: "ok" }, model: "llama3.2" }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "llama3.2",
          temperature: 0.7,
          maxTokens: 500,
        },
        "",
      );

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("makeRequest sends Authorization header when apiKey is provided", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({ message: { content: "ok" }, model: "llama3.2" }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "llama3.2",
          temperature: 0.7,
          maxTokens: 500,
        },
        "cloud-key",
      );

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer cloud-key");
    });

    it("validateKey omits Authorization header when apiKey is empty", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      await adapter.validateKey("");

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBeUndefined();
    });

    it("validateKey sends Authorization header when apiKey is provided", async () => {
      const adapter = new OllamaAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      await adapter.validateKey("cloud-key");

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer cloud-key");
    });
  });

  describe("OllamaCloudAdapter", () => {
    it("name is ollama-cloud", () => {
      expect(new OllamaCloudAdapter().name).toBe("ollama-cloud");
    });

    it("default base URL routes through server-side proxy", () => {
      expect(new OllamaCloudAdapter().getDefaultBaseUrl()).toBe(
        "/api/proxy/ollama-cloud",
      );
    });

    it("makeRequest sends Authorization header through proxy endpoint", async () => {
      const adapter = new OllamaCloudAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: "ok" } }],
              model: "llama3.2",
              usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "llama3.2",
          temperature: 0.7,
          maxTokens: 500,
        },
        "cloud-key",
      );

      const init = fetchSpy.mock.calls[0][1]!;
      expect((init.headers as Record<string, string>)["Authorization"]).toBe(
        "Bearer cloud-key",
      );
      expect(fetchSpy.mock.calls[0][0]).toBe("/api/proxy/ollama-cloud/chat/completions");
    });

    it("validateKey returns valid for non-empty key without network call", async () => {
      const adapter = new OllamaCloudAdapter();
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const result = await adapter.validateKey("cloud-key");

      expect(result.valid).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("validateKey returns invalid for empty key", async () => {
      const adapter = new OllamaCloudAdapter();
      const result = await adapter.validateKey("   ");
      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("createAdapter('ollama-cloud') returns OllamaCloudAdapter", () => {
      expect(createAdapter("ollama-cloud")).toBeInstanceOf(OllamaCloudAdapter);
    });
  });

  describe("CustomAdapter", () => {
    it("returns empty default base URL", () => {
      const adapter = new CustomAdapter();
      expect(adapter.getDefaultBaseUrl()).toBe("");
    });

    it("uses provided base URL", () => {
      const adapter = new CustomAdapter("http://custom.local/v1");
      expect(adapter.getDefaultBaseUrl()).toBe("");
    });

    it("formats messages as pass-through", () => {
      const adapter = new CustomAdapter();
      const msgs: ChatMessage[] = [{ role: "user", content: "hi" }];
      expect(adapter.formatMessages(msgs)).toEqual(msgs);
    });

    it("parses response using OpenAI format", () => {
      const adapter = new CustomAdapter();
      const raw = {
        choices: [{ message: { content: "test" } }],
        model: "custom-model",
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
      const parsed = adapter.parseResponse(raw);
      expect(parsed.model).toBe("custom-model");
    });

    it("makeRequest uses provided base URL", async () => {
      const adapter = new CustomAdapter("http://my-llm.local/v1");
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: "ok" } }],
              model: "custom",
              usage: {
                prompt_tokens: 10,
                completion_tokens: 5,
                total_tokens: 15,
              },
            }),
          ),
      } as Response);

      await adapter.makeRequest(
        {
          messages: [{ role: "user", content: "hi" }],
          model: "custom-model",
          temperature: 0.8,
          maxTokens: 1000,
        },
        "key",
      );

      expect(fetchSpy.mock.calls[0][0]).toBe("http://my-llm.local/v1/chat/completions");
    });

    it("validateKey returns valid on success", async () => {
      const adapter = new CustomAdapter("http://my-llm.local/v1");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(true);
    });

    it("validateKey returns invalid on error", async () => {
      const adapter = new CustomAdapter("http://my-llm.local/v1");
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("bad"),
      } as Response);

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(false);
    });

    it("validateKey handles non-Error throws", async () => {
      const adapter = new CustomAdapter("http://my-llm.local/v1");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("string error");

      const result = await adapter.validateKey("key");
      expect(result.valid).toBe(false);
    });
  });

  // ── Truncation detection ──
  describe("truncation detection", () => {
    it("OpenAI flags finish_reason 'length' as truncated", () => {
      const parsed = new OpenAIAdapter().parseResponse({
        choices: [{ message: { content: "x" }, finish_reason: "length" }],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });
      expect(parsed.truncated).toBe(true);
    });

    it("OpenAI is not truncated on finish_reason 'stop'", () => {
      const parsed = new OpenAIAdapter().parseResponse({
        choices: [{ message: { content: "x" }, finish_reason: "stop" }],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      });
      expect(parsed.truncated).toBe(false);
    });

    it("Anthropic flags stop_reason 'max_tokens' as truncated", () => {
      const parsed = new AnthropicAdapter().parseResponse({
        content: [{ type: "text", text: "x" }],
        model: "claude-sonnet-4-6",
        stop_reason: "max_tokens",
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      expect(parsed.truncated).toBe(true);
    });

    it("Ollama flags done_reason 'length' as truncated", () => {
      const parsed = new OllamaAdapter().parseResponse({
        message: { content: "x" },
        model: "llama3.2",
        done_reason: "length",
      });
      expect(parsed.truncated).toBe(true);
    });
  });

  // ── Anthropic JSON prefill ──
  describe("AnthropicAdapter JSON prefill", () => {
    function mockOnce(value: unknown) {
      return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(value)),
      } as Response);
    }

    it("prefills the assistant turn with '{' and reattaches it", async () => {
      const fetchSpy = mockOnce({
        content: [{ type: "text", text: '"narrative":"hi"}' }],
        model: "claude-sonnet-4-6",
        usage: { input_tokens: 10, output_tokens: 5 },
      });
      const result = await new AnthropicAdapter().makeRequest(
        {
          messages: [{ role: "user", content: "go" }],
          model: "claude-sonnet-4-6",
          temperature: 0.7,
          maxTokens: 100,
          responseFormat: { type: "json_object" },
        },
        "sk-ant",
      );
      expect(result.content).toBe('{"narrative":"hi"}');
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.messages[body.messages.length - 1]).toEqual({
        role: "assistant",
        content: "{",
      });
    });

    it("does not prefill when responseFormat is absent", async () => {
      const fetchSpy = mockOnce({
        content: [{ type: "text", text: '{"narrative":"hi"}' }],
        model: "claude-sonnet-4-6",
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      const result = await new AnthropicAdapter().makeRequest(
        {
          messages: [{ role: "user", content: "go" }],
          model: "claude-sonnet-4-6",
          temperature: 0.7,
          maxTokens: 100,
        },
        "sk-ant",
      );
      expect(result.content).toBe('{"narrative":"hi"}');
      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.messages[body.messages.length - 1].role).toBe("user");
    });

    it("does not double-prepend when the model echoes the opening brace", async () => {
      mockOnce({
        content: [{ type: "text", text: '{"narrative":"hi"}' }],
        model: "claude-sonnet-4-6",
        usage: { input_tokens: 1, output_tokens: 1 },
      });
      const result = await new AnthropicAdapter().makeRequest(
        {
          messages: [{ role: "user", content: "go" }],
          model: "claude-sonnet-4-6",
          temperature: 0.7,
          maxTokens: 100,
          responseFormat: { type: "json_object" },
        },
        "sk-ant",
      );
      expect(result.content).toBe('{"narrative":"hi"}');
    });
  });

  // ── inferModelTier ──
  describe("inferModelTier", () => {
    it("classifies premium-capable models", () => {
      expect(inferModelTier("claude-opus-4-7")).toBe("premium");
      expect(inferModelTier("gpt-4o")).toBe("premium");
      expect(inferModelTier("o3-mini")).toBe("premium");
      expect(inferModelTier("anthropic/claude-sonnet-4-6")).toBe("premium");
    });

    it("classifies lightweight models as routine", () => {
      expect(inferModelTier("gpt-4o-mini")).toBe("routine");
      expect(inferModelTier("claude-haiku-4-5")).toBe("routine");
      expect(inferModelTier("llama3.2")).toBe("routine");
    });
  });

  // ── listModels ──
  describe("listModels", () => {
    function mockOnce(value: unknown) {
      return vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(value)),
      } as Response);
    }

    it("OpenAI lists chat models and filters non-chat ones", async () => {
      mockOnce({
        data: [
          { id: "gpt-4o" },
          { id: "gpt-4o-mini" },
          { id: "text-embedding-3-small" },
          { id: "whisper-1" },
          { id: "dall-e-3" },
        ],
      });
      const ids = (await new OpenAIAdapter().listModels("sk-key")).map((m) => m.id);
      expect(ids).toContain("gpt-4o");
      expect(ids).toContain("gpt-4o-mini");
      expect(ids).not.toContain("text-embedding-3-small");
      expect(ids).not.toContain("whisper-1");
      expect(ids).not.toContain("dall-e-3");
    });

    it("OpenAI ignores entries without a valid id", async () => {
      mockOnce({ data: [{ id: "gpt-4o" }, {}, { id: "" }] });
      const ids = (await new OpenAIAdapter().listModels("sk-key")).map((m) => m.id);
      expect(ids).toEqual(["gpt-4o"]);
    });

    it("OpenAI handles a missing data array", async () => {
      mockOnce({});
      expect(await new OpenAIAdapter().listModels("sk-key")).toEqual([]);
    });

    it("OpenAI propagates HTTP errors", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("unauthorized"),
      } as Response);
      await expect(new OpenAIAdapter().listModels("bad")).rejects.toThrow(AIError);
    });

    it("Anthropic lists models with display names and tiers", async () => {
      mockOnce({
        data: [
          { id: "claude-opus-4-7", display_name: "Claude Opus 4.7" },
          { id: "claude-haiku-4-5" },
        ],
      });
      const models = await new AnthropicAdapter().listModels("sk-ant");
      expect(models[0]).toEqual({
        id: "claude-opus-4-7",
        name: "Claude Opus 4.7",
        tier: "premium",
      });
      expect(models[1].name).toBe("claude-haiku-4-5");
    });

    it("Anthropic sends the direct-browser-access header", async () => {
      const fetchSpy = mockOnce({ data: [] });
      await new AnthropicAdapter().listModels("sk-ant");
      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    });

    it("OpenRouter lists models sorted by name", async () => {
      mockOnce({
        data: [
          { id: "z/model", name: "Zeta" },
          { id: "a/model", name: "Alpha" },
        ],
      });
      const names = (await new OpenRouterAdapter().listModels("or-key")).map(
        (m) => m.name,
      );
      expect(names).toEqual(["Alpha", "Zeta"]);
    });

    it("OpenRouter falls back to id when name is missing", async () => {
      mockOnce({ data: [{ id: "a/model" }] });
      const models = await new OpenRouterAdapter().listModels("or-key");
      expect(models[0].name).toBe("a/model");
    });

    it("Ollama lists installed model names", async () => {
      mockOnce({ models: [{ name: "mistral" }, { name: "llama3.2" }] });
      const ids = (await new OllamaAdapter().listModels("")).map((m) => m.id);
      expect(ids).toEqual(["llama3.2", "mistral"]);
    });

    it("Ollama handles a missing models array", async () => {
      mockOnce({});
      expect(await new OllamaAdapter().listModels("")).toEqual([]);
    });

    it("Ollama sends Authorization header when an apiKey is provided", async () => {
      const fetchSpy = mockOnce({ models: [] });
      await new OllamaAdapter().listModels("cloud-key");
      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer cloud-key");
    });

    it("Custom lists models via the OpenAI format", async () => {
      mockOnce({ data: [{ id: "my-model" }] });
      const ids = (await new CustomAdapter("http://x/v1").listModels("key")).map(
        (m) => m.id,
      );
      expect(ids).toEqual(["my-model"]);
    });

    it("OllamaCloud lists models through the proxy /models route", async () => {
      const fetchSpy = mockOnce({ data: [{ id: "gpt-oss:20b" }] });
      const models = await new OllamaCloudAdapter().listModels("cloud-key");
      expect(fetchSpy.mock.calls[0][0]).toBe("/api/proxy/ollama-cloud/models");
      expect(models.map((m) => m.id)).toEqual(["gpt-oss:20b"]);
    });
  });
});

// ── Provider Models ──

describe("PROVIDER_MODELS", () => {
  it("each non-custom provider has at least one routine and one premium model", () => {
    const nonCustom = [
      "anthropic",
      "openai",
      "openrouter",
      "ollama",
      "ollama-cloud",
    ] as const;
    for (const id of nonCustom) {
      const models = PROVIDER_MODELS[id];
      expect(models.some((m) => m.tier === "routine")).toBe(true);
      expect(models.some((m) => m.tier === "premium")).toBe(true);
    }
    expect(PROVIDER_MODELS.custom).toEqual([]);
  });

  it("each model has required fields", () => {
    for (const [, models] of Object.entries(PROVIDER_MODELS)) {
      for (const model of models) {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(["routine", "premium"]).toContain(model.tier);
      }
    }
  });
});

// ── Prompt Tests ──

describe("prompts", () => {
  describe("buildSystemPrompt", () => {
    it("builds system prompt with abilities and acting requirements", () => {
      const layer = buildSystemPrompt(
        ["Spirit Vision", "Divination"],
        ["Observe more than you reveal"],
      );
      expect(layer.role).toBe("system");
      expect(layer.cacheControl).toBe(true);
      expect(layer.content).toContain("Spirit Vision");
      expect(layer.content).toContain("Divination");
      expect(layer.content).toContain("Observe more than you reveal");
      expect(layer.content).toContain("Lord of the Mysteries");
    });

    it("handles empty abilities", () => {
      const layer = buildSystemPrompt([], []);
      expect(layer.content).toContain("None yet");
    });
  });

  describe("buildLoreContext", () => {
    it("builds lore context from entries", () => {
      const ctx = makeLoreContext();
      const layer = buildLoreContext(ctx);
      expect(layer.role).toBe("system");
      expect(layer.cacheControl).toBe(true);
      expect(layer.content).toContain("Test Lore");
      expect(layer.content).toContain("test lore content");
    });

    it("returns empty content for no entries", () => {
      const layer = buildLoreContext({ entries: [], totalTokens: 0 });
      expect(layer.content).toBe("");
    });

    it("appends retrieved chunks after the curated guardrails (issue #64)", () => {
      const ctx = makeLoreContext();
      const layer = buildLoreContext(ctx, [
        {
          id: "novel-ch1-0000",
          title: "Chapter 1",
          content: "The fog came early that autumn.",
          source: "novel",
          token_count: 50,
        },
      ]);
      const curatedAt = layer.content.indexOf("## Lore Context");
      const retrievedAt = layer.content.indexOf("## Retrieved Source Material");
      expect(curatedAt).toBeGreaterThanOrEqual(0);
      expect(retrievedAt).toBeGreaterThan(curatedAt);
      expect(layer.content).toContain("Chapter 1 (novel) [NARRATOR ONLY]");
      expect(layer.content).toContain("The fog came early that autumn.");
      expect(layer.content).toContain("never quote these passages verbatim");
    });

    it("renders retrieved chunks alone when no curated entries match", () => {
      const layer = buildLoreContext({ entries: [], totalTokens: 0 }, [
        {
          id: "wiki-x-0000",
          title: "Tingen",
          content: "A foggy city.",
          source: "wiki",
          token_count: 10,
        },
      ]);
      expect(layer.content).toContain("## Retrieved Source Material");
      expect(layer.content).not.toContain("## Lore Context");
    });

    it("never crowds out curated lore: retrieved chunks only fill the remainder", () => {
      const bigChunk = (id: string, tokens: number) => ({
        id,
        title: id,
        content: "x",
        source: "novel",
        token_count: tokens,
      });
      // Curated lore consumes all but 100 tokens of the lore budget.
      const ctx = {
        entries: makeLoreContext().entries,
        totalTokens: TOKEN_BUDGET.lore - 100,
      };
      const layer = buildLoreContext(ctx, [
        bigChunk("too-big", 150),
        bigChunk("fits", 80),
        bigChunk("also-too-big-now", 50),
      ]);
      // First-fit over rank order: the oversized chunk is skipped, the fitting
      // one is taken, and the next no longer fits the remainder.
      expect(layer.content).toContain("fits");
      expect(layer.content).not.toContain("too-big");
      expect(layer.content).not.toContain("also-too-big-now");
    });
  });

  describe("selectRetrievedForBudget", () => {
    const chunk = (id: string, tokens: number) => ({
      id,
      title: id,
      content: "c",
      source: "novel",
      token_count: tokens,
    });

    it("packs in rank order with first-fit and is deterministic", () => {
      const chunks = [chunk("a", 60), chunk("b", 50), chunk("c", 40)];
      expect(selectRetrievedForBudget(chunks, 100).map((c) => c.id)).toEqual(["a", "c"]);
      expect(selectRetrievedForBudget(chunks, 100).map((c) => c.id)).toEqual(["a", "c"]);
      expect(selectRetrievedForBudget(chunks, 0)).toEqual([]);
      expect(selectRetrievedForBudget([], 100)).toEqual([]);
    });
  });

  describe("buildGameStatePrompt", () => {
    it("builds game state as JSON", () => {
      const state = makeGameState();
      const layer = buildGameStatePrompt(state);
      expect(layer.role).toBe("user");
      expect(layer.content).toContain("Tingen City");
      expect(layer.content).toContain("80/100");
      expect(layer.content).toContain("Dunn Smith");
    });
  });

  describe("buildGameStatePrompt with digestion", () => {
    it("includes digestion progress when present", () => {
      const state = makeGameState({
        digestion: { pathwayId: 1, sequenceLevel: 9, progress: 42, complete: false },
      });
      const layer = buildGameStatePrompt(state);
      expect(layer.content).toContain("potionDigestion");
      expect(layer.content).toContain("42%");
    });

    it("defaults digestion to 0% when absent", () => {
      const state = makeGameState();
      const layer = buildGameStatePrompt(state);
      expect(layer.content).toContain('"potionDigestion": "0%"');
    });
  });

  describe("buildGameStatePrompt with inventory", () => {
    it("includes inventory items", () => {
      const state = makeGameState({
        inventory: [
          {
            name: "Dragon Blood Grass",
            description: "A crimson herb",
            category: "main-ingredient",
          },
        ],
      });
      const layer = buildGameStatePrompt(state);
      expect(layer.content).toContain("Dragon Blood Grass");
    });
  });

  describe("buildHistoryPrompt", () => {
    it("returns empty for fresh memory", () => {
      const layer = buildHistoryPrompt(makeMemoryState());
      expect(layer.content).toBe("");
    });

    it("includes turn history", () => {
      let mem = makeMemoryState();
      mem = addTurn(mem, makeTurnRecord(1));
      const layer = buildHistoryPrompt(mem);
      expect(layer.content).toContain("Turn 1");
      expect(layer.content).toContain("I search the room");
    });
  });

  describe("buildInstructionPrompt", () => {
    it("builds narrative instruction", () => {
      const layer = buildInstructionPrompt("narrative", "I open the door");
      expect(layer.role).toBe("user");
      expect(layer.content).toContain("narrative response");
      expect(layer.content).toContain("I open the door");
    });

    it("builds evaluation instruction", () => {
      const layer = buildInstructionPrompt("evaluation", "I act mysteriously");
      expect(layer.content).toContain("acting requirements");
    });

    it("builds advancement instruction", () => {
      const layer = buildInstructionPrompt("advancement", "Begin the ritual");
      expect(layer.content).toContain("advancement");
    });

    it("builds combat instruction", () => {
      const layer = buildInstructionPrompt("combat", "I attack");
      expect(layer.content).toContain("combat");
    });

    it("builds choices instruction", () => {
      const layer = buildInstructionPrompt("choices", "What can I do?");
      expect(layer.content).toContain("choices");
    });
  });

  describe("buildSanityDirective", () => {
    it("returns empty content at high sanity", () => {
      const layer = buildSanityDirective(makeGameState({ sanity: 90, maxSanity: 100 }));
      expect(layer.role).toBe("system");
      expect(layer.content).toBe("");
    });

    it("returns a strained directive at medium sanity", () => {
      const layer = buildSanityDirective(makeGameState({ sanity: 50, maxSanity: 100 }));
      expect(layer.content).toContain("Strained");
    });

    it("returns an unreliable directive at low sanity", () => {
      const layer = buildSanityDirective(makeGameState({ sanity: 25, maxSanity: 100 }));
      expect(layer.content).toContain("Unreliable");
      expect(layer.content.toLowerCase()).toContain("irrational");
    });

    it("returns a shattering directive at critical sanity", () => {
      const layer = buildSanityDirective(makeGameState({ sanity: 5, maxSanity: 100 }));
      expect(layer.content).toContain("Shattering");
      expect(layer.content.toLowerCase()).toContain("false choice");
    });
  });

  describe("buildDemigodDirective", () => {
    it("returns empty content below the demigod tier (Seq > 4)", () => {
      expect(buildDemigodDirective(makeGameState({ sequenceLevel: 9 })).content).toBe("");
      expect(buildDemigodDirective(makeGameState({ sequenceLevel: 5 })).content).toBe("");
    });

    it("returns a demigod-stakes directive at Seq 4 (Saint) and above", () => {
      for (const sequenceLevel of [4, 2, 1]) {
        const layer = buildDemigodDirective(makeGameState({ sequenceLevel }));
        expect(layer.role).toBe("system");
        expect(layer.content).toContain("Demigod Stakes");
        expect(layer.content.toLowerCase()).toContain("cosmic");
        expect(layer.content.toLowerCase()).toContain("church");
      }
    });
  });

  describe("assemblePrompt", () => {
    it("includes the demigod directive at Seq 4 and omits it below", () => {
      const hasDemigod = (sequenceLevel: number) =>
        assemblePrompt({
          gameState: makeGameState({ sequenceLevel }),
          memory: makeMemoryState(),
          loreContext: { entries: [], totalTokens: 0 },
          instruction: "narrative" as const,
          playerAction: "I look around",
          abilities: [],
          actingRequirements: [],
        }).layers.some((l) => l.content.includes("Demigod Stakes"));
      expect(hasDemigod(4)).toBe(true);
      expect(hasDemigod(9)).toBe(false);
    });

    it("includes the sanity directive at low sanity", () => {
      const assembly = assemblePrompt({
        gameState: makeGameState({ sanity: 20, maxSanity: 100 }),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      });
      const hasDirective = assembly.layers.some((l) =>
        l.content.includes("Narrator State"),
      );
      expect(hasDirective).toBe(true);
    });

    it("omits the sanity directive at high sanity", () => {
      const assembly = assemblePrompt({
        gameState: makeGameState({ sanity: 95, maxSanity: 100 }),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      });
      const hasDirective = assembly.layers.some((l) =>
        l.content.includes("Narrator State"),
      );
      expect(hasDirective).toBe(false);
    });

    it("assembles all layers", () => {
      const input = {
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: ["Spirit Vision"],
        actingRequirements: ["Be mysterious"],
      };
      const assembly = assemblePrompt(input);
      expect(assembly.layers.length).toBeGreaterThanOrEqual(3);
      expect(assembly.totalTokenEstimate).toBeGreaterThan(0);
    });

    it("excludes empty lore context", () => {
      const input = {
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      };
      const assembly = assemblePrompt(input);
      const systemLayers = assembly.layers.filter((l) => l.role === "system");
      expect(systemLayers.length).toBe(1);
    });

    it("includes history when present", () => {
      let mem = makeMemoryState();
      mem = addTurn(mem, makeTurnRecord(1));
      const input = {
        gameState: makeGameState(),
        memory: mem,
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      };
      const assembly = assemblePrompt(input);
      const hasHistory = assembly.layers.some((l) => l.content.includes("History"));
      expect(hasHistory).toBe(true);
    });

    it("excludes empty history", () => {
      const input = {
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      };
      const assembly = assemblePrompt(input);
      const hasHistory = assembly.layers.some((l) => l.content.includes("History"));
      expect(hasHistory).toBe(false);
    });

    it("includes the city narration tone layer when provided", () => {
      const assembly = assemblePrompt({
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        cityNarration: "Backlund is the capital and the City of Dust.",
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      });
      const tone = assembly.layers.find((l) => l.content.includes("Setting Tone"));
      expect(tone).toBeDefined();
      expect(tone!.content).toContain("City of Dust");
    });

    it("omits the city narration layer when null or absent", () => {
      const withNull = assemblePrompt({
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        cityNarration: null,
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      });
      const withAbsent = assemblePrompt({
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: { entries: [], totalTokens: 0 },
        instruction: "narrative" as const,
        playerAction: "I look around",
        abilities: [],
        actingRequirements: [],
      });
      expect(withNull.layers.some((l) => l.content.includes("Setting Tone"))).toBe(false);
      expect(withAbsent.layers.some((l) => l.content.includes("Setting Tone"))).toBe(
        false,
      );
    });
  });

  describe("promptToMessages", () => {
    it("combines system and user layers into messages", () => {
      const assembly = assemblePrompt({
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });
      const messages = promptToMessages(assembly);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe("system");
      expect(messages[1].role).toBe("user");
    });

    it("handles assembly with only user layers", () => {
      const assembly = {
        layers: [{ role: "user" as const, content: "hello" }],
        totalTokenEstimate: 2,
      };
      const messages = promptToMessages(assembly);
      expect(messages.length).toBe(1);
      expect(messages[0].role).toBe("user");
    });
  });

  describe("isWithinTokenBudget", () => {
    it("returns true for small prompt", () => {
      const assembly = { layers: [], totalTokenEstimate: 1000 };
      expect(isWithinTokenBudget(assembly)).toBe(true);
    });

    it("returns false for oversized prompt", () => {
      const assembly = { layers: [], totalTokenEstimate: 10000 };
      expect(isWithinTokenBudget(assembly)).toBe(false);
    });

    it("returns true at exact budget", () => {
      const assembly = { layers: [], totalTokenEstimate: TOKEN_BUDGET.total };
      expect(isWithinTokenBudget(assembly)).toBe(true);
    });
  });
});

// ── Sanity Tier Tests ──

describe("sanity tiers", () => {
  describe("sanityPercent", () => {
    it("computes a clamped percentage", () => {
      expect(sanityPercent(40, 100)).toBe(40);
      expect(sanityPercent(-1, 100)).toBe(0);
      expect(sanityPercent(200, 100)).toBe(100);
    });

    it("returns 0 for non-positive max", () => {
      expect(sanityPercent(50, 0)).toBe(0);
    });
  });

  describe("classifySanityTier", () => {
    it("maps values to the spec tiers", () => {
      expect(classifySanityTier(75, 100)).toBe("high");
      expect(classifySanityTier(74, 100)).toBe("medium");
      expect(classifySanityTier(40, 100)).toBe("medium");
      expect(classifySanityTier(39, 100)).toBe("low");
      expect(classifySanityTier(15, 100)).toBe("low");
      expect(classifySanityTier(14, 100)).toBe("critical");
    });
  });

  describe("SANITY_TIER_THRESHOLDS", () => {
    it("matches the spec boundaries", () => {
      expect(SANITY_TIER_THRESHOLDS).toEqual({ high: 75, medium: 40, low: 15 });
    });
  });

  describe("sanityNarrationDirective", () => {
    it("is empty for high sanity", () => {
      expect(sanityNarrationDirective("high")).toBe("");
    });

    it("escalates instructions as the tier worsens", () => {
      expect(sanityNarrationDirective("medium")).toContain("Strained");
      expect(sanityNarrationDirective("low")).toContain("Unreliable");
      expect(sanityNarrationDirective("critical")).toContain("Shattering");
    });
  });
});

// ── Memory Tests ──

describe("memory", () => {
  describe("createMemoryState", () => {
    it("creates empty memory state", () => {
      const state = createMemoryState();
      expect(state.immediateTurns).toEqual([]);
      expect(state.recentSummaries).toEqual([]);
      expect(state.sessionFacts).toEqual([]);
    });
  });

  describe("buildTurnRecord", () => {
    it("creates turn record with timestamp", () => {
      const response = makeValidAIResponse();
      const turn = buildTurnRecord(1, "I search", response);
      expect(turn.turnNumber).toBe(1);
      expect(turn.playerAction).toBe("I search");
      expect(turn.aiResponse).toBe(response);
      expect(turn.timestamp).toBeGreaterThan(0);
      // No retrieval on this turn: the field is omitted, not an empty array.
      expect("retrievedChunkIds" in turn).toBe(false);
    });

    it("records the retrieved chunk ids when retrieval ran (issue #63)", () => {
      const turn = buildTurnRecord(2, "I divine", makeValidAIResponse(), [
        "chunk-a",
        "chunk-b",
      ]);
      expect(turn.retrievedChunkIds).toEqual(["chunk-a", "chunk-b"]);
    });
  });

  describe("summarizeTurn", () => {
    it("summarizes basic turn", () => {
      const turn = makeTurnRecord(1);
      const summary = summarizeTurn(turn);
      expect(summary.turnNumber).toBe(1);
      expect(summary.summary).toContain("I search the room");
      expect(summary.summary).toContain("Result:");
    });

    it("includes sanity impact in summary", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.sanityImpact = -5;
      const summary = summarizeTurn(turn);
      expect(summary.summary).toContain("Sanity: -5");
    });

    it("includes positive sanity impact with plus sign", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.sanityImpact = 3;
      const summary = summarizeTurn(turn);
      expect(summary.summary).toContain("Sanity: +3");
    });

    it("skips zero sanity impact", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.sanityImpact = 0;
      const summary = summarizeTurn(turn);
      expect(summary.summary).not.toContain("Sanity:");
    });

    it("includes discovered items", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.itemsDiscovered = [
        {
          name: "Dragon Blood Grass",
          description: "A crimson herb",
          category: "main-ingredient",
        },
      ];
      const summary = summarizeTurn(turn);
      expect(summary.summary).toContain("Found: Dragon Blood Grass");
    });

    it("truncates long narratives", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.narrative = "A".repeat(200);
      const summary = summarizeTurn(turn);
      expect(summary.summary).toContain("...");
    });

    it("does not truncate short narratives", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.narrative = "Short narrative";
      const summary = summarizeTurn(turn);
      expect(summary.summary).not.toContain("...");
    });

    it("handles empty narrative", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse = { narrative: "" };
      const summary = summarizeTurn(turn);
      expect(summary.summary).toContain("Player:");
      expect(summary.summary).not.toContain("Result:");
    });

    it("handles response with empty items array", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.itemsDiscovered = [];
      const summary = summarizeTurn(turn);
      expect(summary.summary).not.toContain("Found:");
    });
  });

  describe("extractSessionFacts", () => {
    it("extracts item discoveries", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.itemsDiscovered = [
        {
          name: "Night Vale Flower",
          description: "A pale flower",
          category: "supplementary-ingredient",
        },
      ];
      const facts = extractSessionFacts(turn);
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: "item-change",
          description: "Discovered Night Vale Flower",
        }),
      );
    });

    it("extracts world state changes", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.worldStateChanges = [
        {
          field: "location",
          oldValue: "Tingen",
          newValue: "Backlund",
          reason: "Player traveled",
        },
      ];
      const facts = extractSessionFacts(turn);
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: "event",
          description: "location: Player traveled",
        }),
      );
    });

    it("extracts high acting alignment", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.actingEvaluation = {
        alignment: 0.9,
        reasoning: "Perfect acting",
      };
      const facts = extractSessionFacts(turn);
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: "quest-progress",
        }),
      );
    });

    it("ignores low acting alignment", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse.actingEvaluation = {
        alignment: 0.5,
        reasoning: "Average",
      };
      const facts = extractSessionFacts(turn);
      const questFacts = facts.filter((f) => f.type === "quest-progress");
      expect(questFacts).toHaveLength(0);
    });

    it("returns empty for turn with no extractable facts", () => {
      const turn = makeTurnRecord(1);
      turn.aiResponse = { narrative: "Nothing happened." };
      const facts = extractSessionFacts(turn);
      expect(facts).toHaveLength(0);
    });
  });

  describe("addSessionFact", () => {
    it("appends a fact without mutating the input", () => {
      const state = createMemoryState();
      const next = addSessionFact(state, {
        type: "event",
        description: "Travelled to Backlund.",
        turnNumber: 3,
      });
      expect(next.sessionFacts).toHaveLength(1);
      expect(next.sessionFacts[0].description).toBe("Travelled to Backlund.");
      expect(state.sessionFacts).toHaveLength(0);
    });

    it("caps session facts at the maximum, evicting the oldest", () => {
      let state = createMemoryState();
      for (let i = 0; i < 45; i++) {
        state = addSessionFact(state, {
          type: "event",
          description: `fact ${i}`,
          turnNumber: i,
        });
      }
      expect(state.sessionFacts.length).toBeLessThanOrEqual(40);
      // The earliest facts were evicted first.
      expect(state.sessionFacts[0].description).toBe("fact 5");
    });
  });

  describe("addTurn", () => {
    it("adds turn to immediate window", () => {
      let state = createMemoryState();
      state = addTurn(state, makeTurnRecord(1));
      expect(state.immediateTurns).toHaveLength(1);
    });

    it("evicts to recent when window exceeds 5", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 6; i++) {
        state = addTurn(state, makeTurnRecord(i));
      }
      expect(state.immediateTurns).toHaveLength(5);
      expect(state.recentSummaries).toHaveLength(1);
    });

    it("trims recent summaries beyond 15", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 25; i++) {
        state = addTurn(state, makeTurnRecord(i));
      }
      expect(state.recentSummaries.length).toBeLessThanOrEqual(15);
    });

    it("accumulates session facts", () => {
      let state = createMemoryState();
      const turn = makeTurnRecord(1);
      turn.aiResponse.itemsDiscovered = [
        { name: "Item1", description: "desc", category: "main-ingredient" },
      ];
      state = addTurn(state, turn);
      expect(state.sessionFacts.length).toBeGreaterThan(0);
    });

    it("caps session facts at maximum", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 50; i++) {
        const turn = makeTurnRecord(i);
        turn.aiResponse.itemsDiscovered = [
          { name: `Item${i}`, description: "desc", category: "main-ingredient" },
        ];
        turn.aiResponse.worldStateChanges = [
          { field: "x", oldValue: i - 1, newValue: i, reason: "change" },
        ];
        state = addTurn(state, turn);
      }
      expect(state.sessionFacts.length).toBeLessThanOrEqual(40);
    });
  });

  describe("estimateMemoryTokens", () => {
    it("estimates zero for empty state", () => {
      expect(estimateMemoryTokens(createMemoryState())).toBe(0);
    });

    it("estimates based on content", () => {
      let state = createMemoryState();
      state = addTurn(state, makeTurnRecord(1));
      expect(estimateMemoryTokens(state)).toBeGreaterThan(0);
    });
  });

  describe("trimMemoryForBudget", () => {
    it("does not trim when within budget", () => {
      let state = createMemoryState();
      state = addTurn(state, makeTurnRecord(1));
      const trimmed = trimMemoryForBudget(state, 10000);
      expect(trimmed.immediateTurns).toHaveLength(1);
    });

    it("reduces immediate window first", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 5; i++) {
        state = addTurn(state, makeTurnRecord(i));
      }
      const trimmed = trimMemoryForBudget(state, 100);
      expect(trimmed.immediateTurns.length).toBeLessThanOrEqual(3);
    });

    it("drops recent summaries if still over budget", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 20; i++) {
        state = addTurn(state, makeTurnRecord(i));
      }
      const trimmed = trimMemoryForBudget(state, 1);
      expect(trimmed.recentSummaries).toHaveLength(0);
    });

    it("drops session facts if still over budget", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 30; i++) {
        const turn = makeTurnRecord(i);
        turn.aiResponse.itemsDiscovered = [
          { name: `Item${i}`, description: "desc", category: "main-ingredient" },
        ];
        state = addTurn(state, turn);
      }
      const trimmed = trimMemoryForBudget(state, 1);
      expect(trimmed.sessionFacts).toHaveLength(0);
    });
  });

  describe("formatMemoryForPrompt", () => {
    it("returns empty string for empty memory", () => {
      expect(formatMemoryForPrompt(createMemoryState())).toBe("");
    });

    it("formats immediate turns", () => {
      let state = createMemoryState();
      state = addTurn(state, makeTurnRecord(1));
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).toContain("Turn 1");
      expect(formatted).toContain("I search the room");
    });

    it("formats recent summaries", () => {
      let state = createMemoryState();
      for (let i = 1; i <= 6; i++) {
        state = addTurn(state, makeTurnRecord(i));
      }
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).toContain("Recent History");
    });

    it("formats session facts", () => {
      let state = createMemoryState();
      const turn = makeTurnRecord(1);
      turn.aiResponse.itemsDiscovered = [
        { name: "TestItem", description: "desc", category: "main-ingredient" },
      ];
      state = addTurn(state, turn);
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).toContain("Session Facts");
      expect(formatted).toContain("Discovered TestItem");
    });

    it("includes choices in turn details", () => {
      let state = createMemoryState();
      state = addTurn(state, makeTurnRecord(1));
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).toContain("Choices offered:");
    });

    it("formats turn without choices", () => {
      let state = createMemoryState();
      const turn = makeTurnRecord(1);
      turn.aiResponse.choices = undefined;
      state = addTurn(state, turn);
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).not.toContain("Choices offered:");
    });

    it("formats turn with empty choices array", () => {
      let state = createMemoryState();
      const turn = makeTurnRecord(1);
      turn.aiResponse.choices = [];
      state = addTurn(state, turn);
      const formatted = formatMemoryForPrompt(state);
      expect(formatted).not.toContain("Choices offered:");
    });
  });
});

// ── Validation Tests ──

describe("validation", () => {
  describe("parseAIResponse", () => {
    it("parses valid JSON response", () => {
      const json = JSON.stringify({ narrative: "Test narrative" });
      const result = parseAIResponse(json);
      expect(result.narrative).toBe("Test narrative");
    });

    it("extracts JSON from code blocks", () => {
      const raw = '```json\n{"narrative": "Test"}\n```';
      const result = parseAIResponse(raw);
      expect(result.narrative).toBe("Test");
    });

    it("parses response with all optional fields", () => {
      const json = JSON.stringify({
        narrative: "The door opens",
        choices: [{ id: "1", text: "Enter", type: "action" }],
        worldStateChanges: [
          {
            field: "location",
            oldValue: "hall",
            newValue: "room",
            reason: "moved",
          },
        ],
        actingEvaluation: { alignment: 0.8, reasoning: "Good acting" },
        sanityImpact: -3,
        itemsDiscovered: [
          {
            name: "Key",
            description: "A rusty key",
            category: "supplementary-ingredient",
          },
        ],
      });
      const result = parseAIResponse(json);
      expect(result.choices).toHaveLength(1);
      expect(result.worldStateChanges).toHaveLength(1);
      expect(result.actingEvaluation?.alignment).toBe(0.8);
      expect(result.sanityImpact).toBe(-3);
      expect(result.itemsDiscovered).toHaveLength(1);
    });

    it("throws on non-JSON input", () => {
      expect(() => parseAIResponse("not json at all")).toThrow(AIError);
    });

    it("extracts JSON embedded in surrounding prose", () => {
      const result = parseAIResponse(
        'Here is the scene: {"narrative":"The fog rolls in."} Enjoy!',
      );
      expect(result.narrative).toBe("The fog rolls in.");
    });

    it("throws when braces are present but the span is not valid JSON", () => {
      expect(() => parseAIResponse("intro {not: valid json} outro")).toThrow(AIError);
    });

    it("throws on array input", () => {
      expect(() => parseAIResponse("[1,2,3]")).toThrow(AIError);
    });

    it("throws on missing narrative", () => {
      expect(() => parseAIResponse(JSON.stringify({ choices: [] }))).toThrow(AIError);
    });

    it("throws on empty narrative", () => {
      expect(() => parseAIResponse(JSON.stringify({ narrative: "" }))).toThrow(AIError);
    });

    it("throws on non-array choices", () => {
      expect(() =>
        parseAIResponse(JSON.stringify({ narrative: "x", choices: "bad" })),
      ).toThrow(AIError);
    });

    it("throws on non-array worldStateChanges", () => {
      expect(() =>
        parseAIResponse(JSON.stringify({ narrative: "x", worldStateChanges: "bad" })),
      ).toThrow(AIError);
    });

    it("throws on non-array itemsDiscovered", () => {
      expect(() =>
        parseAIResponse(JSON.stringify({ narrative: "x", itemsDiscovered: "bad" })),
      ).toThrow(AIError);
    });

    it("defaults invalid choice type to action", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [{ id: "1", text: "Do thing", type: "invalid" }],
      });
      const result = parseAIResponse(json);
      expect(result.choices![0].type).toBe("action");
    });

    it("defaults invalid item category to supplementary-ingredient", () => {
      const json = JSON.stringify({
        narrative: "x",
        itemsDiscovered: [{ name: "thing", description: "desc", category: "invalid" }],
      });
      const result = parseAIResponse(json);
      expect(result.itemsDiscovered![0].category).toBe("supplementary-ingredient");
    });

    it("handles null actingEvaluation", () => {
      const json = JSON.stringify({
        narrative: "x",
        actingEvaluation: null,
      });
      const result = parseAIResponse(json);
      expect(result.actingEvaluation).toBeUndefined();
    });

    it("handles null sanityImpact", () => {
      const json = JSON.stringify({
        narrative: "x",
        sanityImpact: null,
      });
      const result = parseAIResponse(json);
      expect(result.sanityImpact).toBeUndefined();
    });

    it("discards NaN sanityImpact from non-numeric string", () => {
      const json = JSON.stringify({
        narrative: "x",
        sanityImpact: "severe",
      });
      const result = parseAIResponse(json);
      expect(result.sanityImpact).toBeUndefined();
    });

    it("defaults NaN alignment to 0", () => {
      const json = JSON.stringify({
        narrative: "x",
        actingEvaluation: { alignment: "high", reasoning: "good" },
      });
      const result = parseAIResponse(json);
      expect(result.actingEvaluation!.alignment).toBe(0);
    });

    it("throws on null input", () => {
      expect(() => parseAIResponse("null")).toThrow(AIError);
    });

    it("trims whitespace before parsing", () => {
      const json = `  {"narrative": "test"}  `;
      const result = parseAIResponse(json);
      expect(result.narrative).toBe("test");
    });

    it("falls back to a stable index-based id when id is missing", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [{}, {}],
      });
      const result = parseAIResponse(json);
      expect(result.choices![0].id).toBe("choice-0");
      expect(result.choices![1].id).toBe("choice-1");
      expect(result.choices![0].text).toBe("");
    });

    it("falls back to a stable id when id is blank/whitespace", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [{ id: "   ", text: "a" }],
      });
      const result = parseAIResponse(json);
      expect(result.choices![0].id).toBe("choice-0");
    });

    it("de-duplicates repeated choice ids so keys stay unique", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [
          { id: "dup", text: "a" },
          { id: "dup", text: "b" },
        ],
      });
      const result = parseAIResponse(json);
      expect(result.choices![0].id).toBe("dup");
      expect(result.choices![1].id).toBe("choice-1");
      const ids = result.choices!.map((c) => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("preserves provided non-empty unique choice ids", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [
          { id: "a", text: "1" },
          { id: "b", text: "2" },
        ],
      });
      const result = parseAIResponse(json);
      expect(result.choices!.map((c) => c.id)).toEqual(["a", "b"]);
    });

    it("handles worldStateChange with missing fields", () => {
      const json = JSON.stringify({
        narrative: "x",
        worldStateChanges: [{}],
      });
      const result = parseAIResponse(json);
      expect(result.worldStateChanges![0].field).toBe("");
      expect(result.worldStateChanges![0].reason).toBe("");
    });

    it("handles actingEvaluation with missing fields", () => {
      const json = JSON.stringify({
        narrative: "x",
        actingEvaluation: {},
      });
      const result = parseAIResponse(json);
      expect(result.actingEvaluation!.alignment).toBe(0);
      expect(result.actingEvaluation!.reasoning).toBe("");
    });

    it("handles itemsDiscovered with missing fields", () => {
      const json = JSON.stringify({
        narrative: "x",
        itemsDiscovered: [{}],
      });
      const result = parseAIResponse(json);
      expect(result.itemsDiscovered![0].name).toBe("");
      expect(result.itemsDiscovered![0].category).toBe("supplementary-ingredient");
    });

    it("handles valid item categories", () => {
      const json = JSON.stringify({
        narrative: "x",
        itemsDiscovered: [
          {
            name: "a",
            description: "b",
            category: "main-ingredient",
          },
          {
            name: "c",
            description: "d",
            category: "potion-formula",
          },
        ],
      });
      const result = parseAIResponse(json);
      expect(result.itemsDiscovered![0].category).toBe("main-ingredient");
      expect(result.itemsDiscovered![1].category).toBe("potion-formula");
    });

    it("handles valid choice types", () => {
      const json = JSON.stringify({
        narrative: "x",
        choices: [
          { id: "1", text: "a", type: "dialogue" },
          { id: "2", text: "b", type: "investigation" },
          { id: "3", text: "c", type: "ritual" },
        ],
      });
      const result = parseAIResponse(json);
      expect(result.choices![0].type).toBe("dialogue");
      expect(result.choices![1].type).toBe("investigation");
      expect(result.choices![2].type).toBe("ritual");
    });
  });

  describe("validateAIResponse", () => {
    it("validates correct response", () => {
      const result = validateAIResponse(makeValidAIResponse());
      expect(result.valid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("flags sanity impact below minimum", () => {
      const response = makeValidAIResponse();
      response.sanityImpact = -25;
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
      expect(result.violations[0].message).toContain("-25");
    });

    it("flags sanity impact above maximum", () => {
      const response = makeValidAIResponse();
      response.sanityImpact = 15;
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags too many choices", () => {
      const response = makeValidAIResponse();
      response.choices = Array.from({ length: 8 }, (_, i) => ({
        id: String(i),
        text: `Choice ${i}`,
        type: "action" as const,
      }));
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
      expect(result.violations[0].message).toContain("8");
    });

    it("flags a choice with empty text", () => {
      const response = makeValidAIResponse();
      response.choices = [
        { id: "1", text: "Investigate", type: "investigation" },
        { id: "2", text: "", type: "action" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
      expect(result.violations.some((v) => v.message.includes("missing text"))).toBe(
        true,
      );
    });

    it("flags a choice whose text is only whitespace", () => {
      const response = makeValidAIResponse();
      response.choices = [{ id: "1", text: "   ", type: "action" }];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags acting alignment below 0", () => {
      const response = makeValidAIResponse();
      response.actingEvaluation = { alignment: -0.5, reasoning: "bad" };
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags acting alignment above 1", () => {
      const response = makeValidAIResponse();
      response.actingEvaluation = { alignment: 1.5, reasoning: "too good" };
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags items with missing name", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "", description: "desc", category: "main-ingredient" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags items with missing description", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "Item", description: "", category: "main-ingredient" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags state changes with missing field", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "", oldValue: 1, newValue: 2, reason: "change" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags state changes with missing reason", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [{ field: "x", oldValue: 1, newValue: 2, reason: "" }];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("validates items with name but no description", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "Item", description: "", category: "main-ingredient" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("validates items with description but no name", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "", description: "A thing", category: "main-ingredient" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("validates valid items pass", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "Item", description: "A thing", category: "main-ingredient" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(true);
    });

    it("validates valid state changes pass", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "location", oldValue: "a", newValue: "b", reason: "moved" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(true);
    });

    it("flags state changes with field but no reason", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "location", oldValue: "a", newValue: "b", reason: "" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("flags state changes with reason but no field", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "", oldValue: "a", newValue: "b", reason: "moved" },
      ];
      const result = validateAIResponse(response);
      expect(result.valid).toBe(false);
    });

    it("validates sanity at boundary values", () => {
      const response1 = makeValidAIResponse();
      response1.sanityImpact = -20;
      expect(validateAIResponse(response1).valid).toBe(true);

      const response2 = makeValidAIResponse();
      response2.sanityImpact = 10;
      expect(validateAIResponse(response2).valid).toBe(true);
    });

    it("validates acting alignment at boundary values", () => {
      const response1 = makeValidAIResponse();
      response1.actingEvaluation = { alignment: 0, reasoning: "test" };
      expect(validateAIResponse(response1).valid).toBe(true);

      const response2 = makeValidAIResponse();
      response2.actingEvaluation = { alignment: 1, reasoning: "test" };
      expect(validateAIResponse(response2).valid).toBe(true);
    });

    it("validates exactly 6 choices is valid", () => {
      const response = makeValidAIResponse();
      response.choices = Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        text: `Choice ${i}`,
        type: "action" as const,
      }));
      expect(validateAIResponse(response).valid).toBe(true);
    });

    it("validates response with no optional fields", () => {
      const result = validateAIResponse({ narrative: "Just text" });
      expect(result.valid).toBe(true);
    });

    it("validates response with undefined sanityImpact", () => {
      const result = validateAIResponse({
        narrative: "text",
        sanityImpact: undefined,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe("sanitizeAIResponse", () => {
    it("clamps sanity impact to valid range", () => {
      const response = makeValidAIResponse();
      response.sanityImpact = -30;
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.sanityImpact).toBe(-20);
    });

    it("clamps high sanity impact", () => {
      const response = makeValidAIResponse();
      response.sanityImpact = 20;
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.sanityImpact).toBe(10);
    });

    it("trims excess choices", () => {
      const response = makeValidAIResponse();
      response.choices = Array.from({ length: 8 }, (_, i) => ({
        id: String(i),
        text: `Choice ${i}`,
        type: "action" as const,
      }));
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.choices).toHaveLength(6);
    });

    it("drops choices with empty or whitespace-only text", () => {
      const response = makeValidAIResponse();
      response.choices = [
        { id: "1", text: "Keep me", type: "action" },
        { id: "2", text: "", type: "action" },
        { id: "3", text: "   ", type: "action" },
      ];
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.choices).toHaveLength(1);
      expect(sanitized.choices![0].text).toBe("Keep me");
    });

    it("clamps acting alignment to [0, 1]", () => {
      const response = makeValidAIResponse();
      response.actingEvaluation = { alignment: 1.5, reasoning: "test" };
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.actingEvaluation!.alignment).toBe(1);
    });

    it("clamps negative acting alignment", () => {
      const response = makeValidAIResponse();
      response.actingEvaluation = { alignment: -0.5, reasoning: "test" };
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.actingEvaluation!.alignment).toBe(0);
    });

    it("does not modify valid response", () => {
      const response = makeValidAIResponse();
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized).toEqual(response);
    });

    it("does not modify original object", () => {
      const response = makeValidAIResponse();
      response.sanityImpact = -30;
      const original = structuredClone(response);
      sanitizeAIResponse(response);
      expect(response).toEqual(original);
    });

    it("handles undefined sanityImpact", () => {
      const response: AIResponse = { narrative: "test" };
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.sanityImpact).toBeUndefined();
    });

    it("handles undefined choices", () => {
      const response: AIResponse = { narrative: "test" };
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.choices).toBeUndefined();
    });

    it("handles undefined actingEvaluation", () => {
      const response: AIResponse = { narrative: "test" };
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.actingEvaluation).toBeUndefined();
    });

    it("removes items with empty name", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "", description: "desc", category: "main-ingredient" },
        { name: "Valid Item", description: "valid", category: "main-ingredient" },
      ];
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.itemsDiscovered).toHaveLength(1);
      expect(sanitized.itemsDiscovered![0].name).toBe("Valid Item");
    });

    it("removes items with empty description", () => {
      const response = makeValidAIResponse();
      response.itemsDiscovered = [
        { name: "Item", description: "", category: "main-ingredient" },
      ];
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.itemsDiscovered).toHaveLength(0);
    });

    it("removes state changes with empty field", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "", oldValue: 1, newValue: 2, reason: "moved" },
        { field: "location", oldValue: "a", newValue: "b", reason: "walked" },
      ];
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.worldStateChanges).toHaveLength(1);
      expect(sanitized.worldStateChanges![0].field).toBe("location");
    });

    it("removes state changes with empty reason", () => {
      const response = makeValidAIResponse();
      response.worldStateChanges = [
        { field: "location", oldValue: "a", newValue: "b", reason: "" },
      ];
      const sanitized = sanitizeAIResponse(response);
      expect(sanitized.worldStateChanges).toHaveLength(0);
    });
  });
});

// ── Client Tests ──

describe("client", () => {
  describe("classifyCall", () => {
    it("classifies narrative as routine", () => {
      expect(classifyCall("narrative")).toBe("routine");
    });

    it("classifies choices as routine", () => {
      expect(classifyCall("choices")).toBe("routine");
    });

    it("classifies evaluation as routine", () => {
      expect(classifyCall("evaluation")).toBe("routine");
    });

    it("classifies advancement as premium", () => {
      expect(classifyCall("advancement")).toBe("premium");
    });

    it("classifies combat as premium", () => {
      expect(classifyCall("combat")).toBe("premium");
    });
  });

  describe("selectModel", () => {
    it("selects routine model for routine classification", () => {
      const config = makeProviderConfig();
      expect(selectModel(config, "routine")).toBe("gpt-4o-mini");
    });

    it("selects premium model for premium classification", () => {
      const config = makeProviderConfig();
      expect(selectModel(config, "premium")).toBe("gpt-4o");
    });
  });

  describe("exported constants", () => {
    it("exports MAX_RETRIES", () => {
      expect(MAX_RETRIES).toBe(3);
    });

    it("exports RETRY_DELAYS", () => {
      expect(RETRY_DELAYS).toEqual([2000, 4000, 8000]);
    });

    it("exports MAX_OUTPUT_TOKENS", () => {
      expect(MAX_OUTPUT_TOKENS).toBe(3072);
    });

    it("exports MAX_PARSE_ATTEMPTS", () => {
      expect(MAX_PARSE_ATTEMPTS).toBe(3);
    });
  });

  describe("generate", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("generates validated response on success", async () => {
      const mockResponse = JSON.stringify(makeValidAIResponse());
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: mockResponse } }],
              model: "gpt-4o-mini",
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          ),
      } as Response);

      const result = await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "I look around",
        abilities: ["Spirit Vision"],
        actingRequirements: ["Be mysterious"],
      });

      expect(result.response.narrative).toBeTruthy();
      expect(result.validation.valid).toBe(true);
    });

    it("retries on malformed output then succeeds", async () => {
      const validResponse = JSON.stringify(makeValidAIResponse());
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: "not json" } }],
                model: "gpt-4o-mini",
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150,
                },
              }),
            ),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: validResponse } }],
                model: "gpt-4o-mini",
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150,
                },
              }),
            ),
        } as Response);

      const result = await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      expect(result.response.narrative).toBeTruthy();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("sanitizes invalid AI response values", async () => {
      const response: AIResponse = {
        narrative: "test",
        sanityImpact: -30,
        actingEvaluation: { alignment: 1.5, reasoning: "test" },
      };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: JSON.stringify(response) } }],
              model: "gpt-4o-mini",
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          ),
      } as Response);

      const result = await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      expect(result.response.sanityImpact).toBe(-20);
      expect(result.response.actingEvaluation!.alignment).toBe(1);
      expect(result.validation.valid).toBe(true);
    });

    it("throws on auth error", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("unauthorized"),
      } as Response);

      await expect(
        generate({
          config: makeProviderConfig(),
          gameState: makeGameState(),
          memory: makeMemoryState(),
          loreContext: makeLoreContext(),
          instruction: "narrative",
          playerAction: "test",
          abilities: [],
          actingRequirements: [],
        }),
      ).rejects.toThrow(AIError);
    });

    it("uses premium model for advancement", async () => {
      const mockResponse = JSON.stringify(makeValidAIResponse());
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: mockResponse } }],
              model: "gpt-4o",
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          ),
      } as Response);

      await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "advancement",
        playerAction: "Begin the ritual",
        abilities: [],
        actingRequirements: [],
      });

      const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
      expect(body.model).toBe("gpt-4o");
    });

    it("retries on provider error with backoff", async () => {
      vi.useFakeTimers();

      const mockResponse = JSON.stringify(makeValidAIResponse());
      const fetchMock = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve("server error"),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                choices: [{ message: { content: mockResponse } }],
                model: "gpt-4o-mini",
                usage: {
                  prompt_tokens: 100,
                  completion_tokens: 50,
                  total_tokens: 150,
                },
              }),
            ),
        } as Response);

      const promise = generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      await vi.advanceTimersByTimeAsync(2000);
      const result = await promise;

      expect(result.response.narrative).toBeTruthy();
      expect(fetchMock).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("rethrows non-MALFORMED_OUTPUT parse errors", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content: '{"narrative":"test"}' } }],
              model: "gpt-4o-mini",
              usage: {
                prompt_tokens: 100,
                completion_tokens: 50,
                total_tokens: 150,
              },
            }),
          ),
      } as Response);

      const validationModule = await import("./validation");
      const spy = vi
        .spyOn(validationModule, "parseAIResponse")
        .mockImplementationOnce(() => {
          throw new AIError("TOKEN_LIMIT_EXCEEDED", "too big");
        });

      try {
        const { generate: gen } = await import("./client");
        await gen({
          config: makeProviderConfig(),
          gameState: makeGameState(),
          memory: makeMemoryState(),
          loreContext: makeLoreContext(),
          instruction: "narrative",
          playerAction: "test",
          abilities: [],
          actingRequirements: [],
        });
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as AIError).code).toBe("TOKEN_LIMIT_EXCEEDED");
      }

      spy.mockRestore();
    });

    it("wraps network errors as NETWORK_ERROR", async () => {
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
        new TypeError("fetch is not a function"),
      );

      await expect(
        generate({
          config: makeProviderConfig(),
          gameState: makeGameState(),
          memory: makeMemoryState(),
          loreContext: makeLoreContext(),
          instruction: "narrative",
          playerAction: "test",
          abilities: [],
          actingRequirements: [],
        }),
      ).rejects.toThrow(AIError);
    });

    it("throws on non-retryable error without retry", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 402,
        text: () => Promise.resolve("payment required"),
      } as Response);

      try {
        await generate({
          config: makeProviderConfig(),
          gameState: makeGameState(),
          memory: makeMemoryState(),
          loreContext: makeLoreContext(),
          instruction: "narrative",
          playerAction: "test",
          abilities: [],
          actingRequirements: [],
        });
        expect.unreachable("should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(AIError);
        expect((err as AIError).code).toBe("QUOTA_EXCEEDED");
        expect((err as AIError).retryable).toBe(false);
      }

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("uses Anthropic adapter format", async () => {
      const mockResponse = JSON.stringify(makeValidAIResponse());
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              content: [{ type: "text", text: mockResponse }],
              model: "claude-sonnet-4-6",
              usage: { input_tokens: 100, output_tokens: 50 },
            }),
          ),
      } as Response);

      await generate({
        config: makeProviderConfig({
          providerId: "anthropic",
          routineModel: "claude-sonnet-4-6",
          premiumModel: "claude-opus-4-7",
        }),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      const headers = fetchSpy.mock.calls[0][1]!.headers as Record<string, string>;
      expect(headers["x-api-key"]).toBe("sk-test-key");
      expect(headers["anthropic-version"]).toBe("2023-06-01");
    });

    function mockOpenAIContent(content: string, extra?: Record<string, unknown>) {
      return {
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              choices: [{ message: { content }, ...extra }],
              model: "gpt-4o-mini",
              usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
            }),
          ),
      } as Response;
    }

    it("retries twice on repeated malformed output then succeeds", async () => {
      const valid = JSON.stringify(makeValidAIResponse());
      vi.spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(mockOpenAIContent("not json"))
        .mockResolvedValueOnce(mockOpenAIContent("still not json"))
        .mockResolvedValueOnce(mockOpenAIContent(valid));

      const result = await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      expect(result.response.narrative).toBeTruthy();
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("throws MALFORMED_OUTPUT after exhausting parse attempts", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(mockOpenAIContent("never json"));

      await expect(
        generate({
          config: makeProviderConfig(),
          gameState: makeGameState(),
          memory: makeMemoryState(),
          loreContext: makeLoreContext(),
          instruction: "narrative",
          playerAction: "test",
          abilities: [],
          actingRequirements: [],
        }),
      ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
      expect(fetch).toHaveBeenCalledTimes(MAX_PARSE_ATTEMPTS);
    });

    it("sends a truncation-specific corrective message when output was cut off", async () => {
      const valid = JSON.stringify(makeValidAIResponse());
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          mockOpenAIContent('{"narrative":"cut', { finish_reason: "length" }),
        )
        .mockResolvedValueOnce(mockOpenAIContent(valid));

      await generate({
        config: makeProviderConfig(),
        gameState: makeGameState(),
        memory: makeMemoryState(),
        loreContext: makeLoreContext(),
        instruction: "narrative",
        playerAction: "test",
        abilities: [],
        actingRequirements: [],
      });

      const retryBody = JSON.parse(fetchSpy.mock.calls[1][1]!.body as string);
      const lastMessage = retryBody.messages[retryBody.messages.length - 1];
      expect(lastMessage.role).toBe("user");
      expect(lastMessage.content).toContain("cut off");
    });
  });

  describe("listProviderModels", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("returns the provider's live model catalog", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({ data: [{ id: "gpt-4o" }, { id: "gpt-4o-mini" }] }),
          ),
      } as Response);

      const models = await listProviderModels(makeProviderConfig());
      expect(models.map((m) => m.id)).toEqual(["gpt-4o", "gpt-4o-mini"]);
    });
  });

  describe("validateProviderConfig", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("validates with the adapter's validateKey method", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve("{}"),
      } as Response);

      const result = await validateProviderConfig(makeProviderConfig());
      expect(result.valid).toBe(true);
    });

    it("returns invalid for bad key", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Invalid or expired API key"),
      } as Response);

      const result = await validateProviderConfig(makeProviderConfig());
      expect(result.valid).toBe(false);
    });
  });
});

// ── generatePrologueScene Tests ──

describe("generatePrologueScene", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // A well-formed scored scene: exactly 4 choices, one per affinity, shuffled
  // positions, non-ordinal ids.
  function makePrologueApiResponse(overrides?: Record<string, unknown>): string {
    const base: Record<string, unknown> = {
      narrative: "The gaslight flickers as you step out into Tingen's fog-laden streets.",
      choices: [
        {
          id: "a",
          text: "Help the elderly woman struggling with her parcels.",
          affinities: { 3: 1 },
        },
        {
          id: "b",
          text: "Note the unusual seal on the envelope dropped by the courier.",
          affinities: { 1: 1 },
        },
        {
          id: "c",
          text: "Wonder what became of the man they carried from the alley.",
          affinities: { 4: 1 },
        },
        {
          id: "d",
          text: "Read the worry in the constable's tight, careful face.",
          affinities: { 2: 1 },
        },
      ],
      readyToConclude: false,
      ...overrides,
    };
    return JSON.stringify(base);
  }

  function makeTurn(): PrologueTurn {
    return {
      narrative: "Scene narrative",
      choices: [{ id: "a", text: "Choice A", affinities: { 1: 1 } }],
      selectedChoiceText: "Choice A",
      selectedAffinities: { 1: 1 },
      rawResponse: makePrologueApiResponse(),
    };
  }

  function mockOpenAIFetch(content: string): void {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          }),
        ),
    } as Response);
  }

  it("sends correct system message and initial user message for first turn (empty history)", async () => {
    const content = makePrologueApiResponse();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          }),
        ),
    } as Response);

    await generatePrologueScene(
      makeProviderConfig(),
      "Klein Moretti",
      "A discharged soldier.",
      [],
    );

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const messages: ChatMessage[] = body.messages as ChatMessage[];

    expect(messages[0]!.role).toBe("system");
    expect(messages[0]!.content).toContain("prologue");
    expect(messages[1]!.role).toBe("user");
    expect(messages[1]!.content).toContain("Klein Moretti");
    expect(messages[1]!.content).toContain("A discharged soldier.");
    expect(messages[1]!.content).toContain("Begin the prologue");
    // Only system + user — no history
    expect(messages).toHaveLength(2);
  });

  it("sends history in assistant/user alternation for subsequent turns", async () => {
    const content = makePrologueApiResponse();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          }),
        ),
    } as Response);

    const history: PrologueTurn[] = [makeTurn()];

    await generatePrologueScene(
      makeProviderConfig(),
      "Klein",
      "Background here.",
      history,
    );

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const messages: ChatMessage[] = body.messages as ChatMessage[];

    // system, initial user, assistant (turn 0 raw), user (turn 0 choice)
    expect(messages).toHaveLength(4);
    expect(messages[0]!.role).toBe("system");
    expect(messages[1]!.role).toBe("user");
    expect(messages[2]!.role).toBe("assistant");
    expect(messages[2]!.content).toBe(history[0]!.rawResponse);
    expect(messages[3]!.role).toBe("user");
    expect(messages[3]!.content).toContain("Choice A");
    expect(messages[3]!.content).toContain("scene 2");
  });

  it("does not instruct the AI to conclude or to judge a pathway", async () => {
    mockOpenAIFetch(makePrologueApiResponse());
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await generatePrologueScene(makeProviderConfig(), "Klein", "", [makeTurn()]);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const messages: ChatMessage[] = body.messages as ChatMessage[];
    // The scene generator never authors a conclusion or names a pathway.
    const lastMessage = messages[messages.length - 1]!;
    expect(lastMessage.content).toContain("Continue to scene");
    expect(lastMessage.content).not.toContain("isConclusion");
    // System prompt forbids the AI from scoring the character.
    expect(messages[0]!.content).toContain("Do NOT judge or score");
  });

  it("returns narrative, affinity-tagged choices, readyToConclude, and rawResponse on success", async () => {
    const rawContent = makePrologueApiResponse({
      narrative: "The fog thickens around you.",
      readyToConclude: true,
    });
    mockOpenAIFetch(rawContent);

    const result = await generatePrologueScene(
      makeProviderConfig(),
      "Audrey Hall",
      "",
      [],
    );

    expect(result.narrative).toBe("The fog thickens around you.");
    expect(result.choices).toHaveLength(PROLOGUE_AFFINITY_COUNT);
    // Each choice carries an affinities map; the four affinities are all present.
    const dominants = result.choices.map((c) => Number(Object.keys(c.affinities)[0]));
    expect(new Set(dominants)).toEqual(new Set([1, 2, 3, 4]));
    expect(result.readyToConclude).toBe(true);
    expect(result.rawResponse).toBe(rawContent);
  });

  it("throws AIError with MALFORMED_OUTPUT on invalid JSON response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content: "this is not json at all" } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
        ),
    } as Response);

    try {
      await generatePrologueScene(makeProviderConfig(), "Klein", "", []);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AIError);
      expect((err as AIError).code).toBe("MALFORMED_OUTPUT");
    }
  });

  it("defaults readyToConclude to false when missing from response", async () => {
    const rawContent = makePrologueApiResponse({ readyToConclude: undefined });
    // Strip the key entirely so it is genuinely missing.
    const parsed = JSON.parse(rawContent) as Record<string, unknown>;
    delete parsed["readyToConclude"];
    mockOpenAIFetch(JSON.stringify(parsed));

    const result = await generatePrologueScene(makeProviderConfig(), "Klein", "", []);
    expect(result.readyToConclude).toBe(false);
  });

  it("defaults readyToConclude to false when the value is not a boolean", async () => {
    mockOpenAIFetch(makePrologueApiResponse({ readyToConclude: "yes" }));

    const result = await generatePrologueScene(makeProviderConfig(), "Klein", "", []);
    expect(result.readyToConclude).toBe(false);
  });

  it("de-duplicates empty/repeated choice ids so React keys stay unique", async () => {
    // Affinities stay distinct (so the affinity check passes) but ids collide —
    // ids do not constrain affinities, and they double as React keys.
    mockOpenAIFetch(
      makePrologueApiResponse({
        choices: [
          { id: "x", text: "Help the woman.", affinities: { 3: 1 } },
          { id: "x", text: "Note the seal.", affinities: { 1: 1 } },
          { id: "", text: "Wonder about the man.", affinities: { 4: 1 } },
          { id: "x", text: "Read the constable.", affinities: { 2: 1 } },
        ],
      }),
    );

    const result = await generatePrologueScene(makeProviderConfig(), "Klein", "", []);
    const ids = result.choices.map((c) => c.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses default background text when characterBackground is empty", async () => {
    const rawContent = makePrologueApiResponse();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content: rawContent } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          }),
        ),
    } as Response);

    await generatePrologueScene(makeProviderConfig(), "Klein", "", []);

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const messages: ChatMessage[] = body.messages as ChatMessage[];
    expect(messages[1]!.content).toContain("A resident of Tingen City");
  });

  it("throws MALFORMED_OUTPUT when narrative is missing", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as Record<string, unknown>;
    delete parsed["narrative"];
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  // ── Strict validation: no silent pathway default ──

  it("rejects when there are fewer than four choices", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: unknown[];
    };
    parsed.choices = parsed.choices.slice(0, 3);
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when a choice lacks an affinities map", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: Record<string, unknown>[];
    };
    delete parsed.choices[0]!["affinities"];
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when a choice is not an object", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as { choices: unknown[] };
    parsed.choices[0] = "not an object";
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when a choice is missing its text", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: Record<string, unknown>[];
    };
    delete parsed.choices[0]!["text"];
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when a choice has an empty affinities map", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: { affinities: Record<number, number> }[];
    };
    parsed.choices[0]!.affinities = {};
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when an affinity weight is not positive", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: { affinities: Record<number, number> }[];
    };
    parsed.choices[0]!.affinities = { 3: 0 };
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when an affinity pathway id is not a positive integer", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: { affinities: Record<string, number> }[];
    };
    parsed.choices[0]!.affinities = { "0": 1 };
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("rejects when the four affinities are not all represented (duplicate dominant)", async () => {
    const parsed = JSON.parse(makePrologueApiResponse()) as {
      choices: { affinities: Record<number, number> }[];
    };
    // Make two choices dominate the same affinity, dropping one of the four.
    parsed.choices[0]!.affinities = { 1: 1 };
    mockOpenAIFetch(JSON.stringify(parsed));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("throws AIError with MALFORMED_OUTPUT when the response is a JSON array", async () => {
    mockOpenAIFetch(JSON.stringify([1, 2, 3]));

    await expect(
      generatePrologueScene(makeProviderConfig(), "Klein", "", []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("exports MIN_PROLOGUE_SCENES as 4 and MAX_PROLOGUE_SCENES as 12", () => {
    expect(MIN_PROLOGUE_SCENES).toBe(4);
    expect(MAX_PROLOGUE_SCENES).toBe(12);
  });

  it("exports PROLOGUE_AFFINITY_COUNT as 4", () => {
    expect(PROLOGUE_AFFINITY_COUNT).toBe(4);
  });
});

// ── generatePrologueFinale Tests ──

describe("generatePrologueFinale", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeFinaleApiResponse(candidateIds: number[]): string {
    return JSON.stringify({
      narrative:
        "A stranger in a long coat sets three vials on the table and waits, saying nothing.",
      choices: candidateIds.map((id) => ({
        id: `p${id}`,
        text: `A vial that stirs something in you (${id}).`,
        affinities: { [id]: 1 },
      })),
    });
  }

  function mockOpenAIFetch(content: string): void {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            choices: [{ message: { content } }],
            model: "gpt-4o-mini",
            usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
          }),
        ),
    } as Response);
  }

  function makeHistory(): PrologueTurn[] {
    return [
      {
        narrative: "Scene 1",
        choices: [{ id: "a", text: "Observe", affinities: { 1: 1 } }],
        selectedChoiceText: "Observe",
        selectedAffinities: { 1: 1 },
        rawResponse: "{}",
      },
    ];
  }

  it("passes the candidate ids into the prompt and returns one choice per candidate", async () => {
    mockOpenAIFetch(makeFinaleApiResponse([1, 3]));
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await generatePrologueFinale(
      makeProviderConfig(),
      "Klein",
      "A fortune-teller.",
      makeHistory(),
      [1, 3],
    );

    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    const messages: ChatMessage[] = body.messages as ChatMessage[];
    const lastMessage = messages[messages.length - 1]!;
    expect(lastMessage.content).toContain("candidate 1");
    expect(lastMessage.content).toContain("candidate 3");

    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.choices).toHaveLength(2);
    const ids = result.choices.map((c) => Number(Object.keys(c.affinities)[0]));
    expect(new Set(ids)).toEqual(new Set([1, 3]));
  });

  it("throws when called with no candidates", async () => {
    await expect(
      generatePrologueFinale(makeProviderConfig(), "Klein", "", makeHistory(), []),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("de-duplicates repeated finale choice ids so React keys stay unique", async () => {
    mockOpenAIFetch(
      JSON.stringify({
        narrative: "Two vials, both labelled the same by a careless hand.",
        choices: [
          { id: "same", text: "The amber vial.", affinities: { 1: 1 } },
          { id: "same", text: "The black vial.", affinities: { 3: 1 } },
        ],
      }),
    );

    const result = await generatePrologueFinale(
      makeProviderConfig(),
      "Klein",
      "",
      makeHistory(),
      [1, 3],
    );

    const ids = result.choices.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws when the finale narrative is missing", async () => {
    mockOpenAIFetch(
      JSON.stringify({ choices: [{ id: "p1", text: "x", affinities: { 1: 1 } }] }),
    );

    await expect(
      generatePrologueFinale(makeProviderConfig(), "Klein", "", makeHistory(), [1]),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("throws when a requested candidate is not covered by any choice", async () => {
    // Only candidate 1 is returned, but 2 was also requested.
    mockOpenAIFetch(makeFinaleApiResponse([1]));

    await expect(
      generatePrologueFinale(makeProviderConfig(), "Klein", "", makeHistory(), [1, 2]),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });

  it("throws when choices are missing entirely", async () => {
    mockOpenAIFetch(JSON.stringify({ narrative: "A scene." }));

    await expect(
      generatePrologueFinale(makeProviderConfig(), "Klein", "", makeHistory(), [1]),
    ).rejects.toMatchObject({ code: "MALFORMED_OUTPUT" });
  });
});
