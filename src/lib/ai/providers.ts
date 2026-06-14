import type {
  ChatMessage,
  ModelOption,
  ModelTier,
  ProviderId,
  ProviderRequest,
  ProviderResponse,
} from "./types";
import { AIError, classifyHttpError, createNetworkError } from "./errors";

export interface LLMProviderAdapter {
  readonly name: ProviderId;
  makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse>;
  validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;
  /** Fetch the provider's live model catalog. Throws AIError on failure. */
  listModels(apiKey: string): Promise<ModelOption[]>;
  formatMessages(messages: ChatMessage[]): unknown;
  parseResponse(raw: unknown): ProviderResponse;
  getDefaultBaseUrl(): string;
}

interface OpenAIStyleResponse {
  choices: { message: { content: string }; finish_reason?: string }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  model: string;
  stop_reason?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

// OpenAI's /models endpoint lists many non-chat models; exclude them so the
// dropdown only offers usable chat/completion models.
const OPENAI_NON_CHAT =
  /embedding|whisper|tts|dall-e|audio|moderation|realtime|transcribe|image|babbage|davinci|ada|curie/i;

// Best-effort tier guess for dynamically-listed models. Only affects which
// model is pre-selected as a default — the user can reassign either slot.
export function inferModelTier(id: string): ModelTier {
  return /opus|gpt-4o(?!-mini)|gpt-4\.|gpt-4-|o1|o3|o4|sonnet|deepseek|70b|120b|405b|large/i.test(
    id,
  )
    ? "premium"
    : "routine";
}

// Build ModelOption[] from an OpenAI-style `{ data: [{ id, ... }] }` payload.
// `nameKey` selects the human-readable label field (e.g. "name", "display_name");
// it falls back to the id when absent.
function parseModelCatalog(raw: unknown, nameKey?: string): ModelOption[] {
  const data = raw as { data?: Record<string, unknown>[] };
  return (data.data ?? [])
    .filter(
      (m): m is { id: string } & Record<string, unknown> =>
        typeof m.id === "string" && m.id.length > 0,
    )
    .map((m) => {
      const label = nameKey ? m[nameKey] : undefined;
      return {
        id: m.id,
        name: typeof label === "string" && label.length > 0 ? label : m.id,
        tier: inferModelTier(m.id),
      };
    });
}

async function fetchWithErrorHandling(url: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw createNetworkError(err);
  }
  let body: string;
  try {
    body = await response.text();
  } catch (err) {
    throw createNetworkError(err);
  }
  if (!response.ok) {
    throw classifyHttpError(response.status, body);
  }
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Provider returned non-JSON response",
      body.slice(0, 500),
    );
  }
}

// Ollama's /api/embed returns `{ embeddings: number[][] }` — one row per input,
// in request order. The operator's always-on box exposes the same route, so a
// single parser covers both the BYO and operator embedding homes (issue #60).
function parseEmbeddings(raw: unknown): number[][] {
  const rows = (raw as { embeddings?: unknown }).embeddings;
  if (
    !Array.isArray(rows) ||
    !rows.every((row) => Array.isArray(row) && row.every((n) => typeof n === "number"))
  ) {
    throw new AIError(
      "MALFORMED_OUTPUT",
      "Embedding endpoint returned no `embeddings` number array.",
    );
  }
  return rows;
}

function parseOpenAIStyleResponse(raw: unknown): ProviderResponse {
  const data = raw as OpenAIStyleResponse;
  const content = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage ?? {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
  };
  return {
    content,
    model: data.model ?? "unknown",
    usage: {
      promptTokens: usage.prompt_tokens,
      completionTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cacheHit: (usage.prompt_tokens_details?.cached_tokens ?? 0) > 0,
    },
    truncated: data.choices?.[0]?.finish_reason === "length",
  };
}

export class OpenAIAdapter implements LLMProviderAdapter {
  readonly name: ProviderId = "openai";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? this.getDefaultBaseUrl();
  }

  getDefaultBaseUrl(): string {
    return "https://api.openai.com/v1";
  }

  formatMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages;
  }

  parseResponse(raw: unknown): ProviderResponse {
    return parseOpenAIStyleResponse(raw);
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.formatMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat,
      }),
    });
    return this.parseResponse(raw);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fetchWithErrorHandling(`${this.baseUrl}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async listModels(apiKey: string): Promise<ModelOption[]> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return parseModelCatalog(raw)
      .filter((m) => !OPENAI_NON_CHAT.test(m.id))
      .sort((a, b) => a.id.localeCompare(b.id));
  }
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

export class AnthropicAdapter implements LLMProviderAdapter {
  readonly name: ProviderId = "anthropic";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? this.getDefaultBaseUrl();
  }

  getDefaultBaseUrl(): string {
    return "https://api.anthropic.com/v1";
  }

  formatMessages(messages: ChatMessage[]): {
    system: string;
    messages: AnthropicMessage[];
  } {
    const systemParts: string[] = [];
    const formatted: AnthropicMessage[] = [];
    for (const msg of messages) {
      if (msg.role === "system") {
        systemParts.push(msg.content);
      } else {
        formatted.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }
    return { system: systemParts.join("\n\n"), messages: formatted };
  }

  parseResponse(raw: unknown): ProviderResponse {
    const data = raw as AnthropicResponse;
    const textBlock = data.content?.find((b) => b.type === "text");
    const content = textBlock?.text ?? "";
    const usage = data.usage ?? { input_tokens: 0, output_tokens: 0 };
    const cacheRead = usage.cache_read_input_tokens ?? 0;
    return {
      content,
      model: data.model ?? "unknown",
      usage: {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
        cacheHit: cacheRead > 0,
      },
      truncated: data.stop_reason === "max_tokens",
    };
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const { system, messages } = this.formatMessages(request.messages);
    // Anthropic has no `response_format` JSON mode; instead we prefill the
    // assistant turn with "{" so the model must continue valid JSON rather
    // than wrapping it in prose or markdown.
    const prefillJson = request.responseFormat?.type === "json_object";
    const requestMessages = prefillJson
      ? [...messages, { role: "assistant" as const, content: "{" }]
      : messages;
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: request.model,
        ...(system
          ? {
              system: [
                { type: "text", text: system, cache_control: { type: "ephemeral" } },
              ],
            }
          : {}),
        messages: requestMessages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });
    const response = this.parseResponse(raw);
    // Re-attach the prefilled "{" unless the model already echoed it.
    if (prefillJson && !response.content.trimStart().startsWith("{")) {
      response.content = `{${response.content}`;
    }
    return response;
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fetchWithErrorHandling(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      return { valid: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // The key authenticated unless Anthropic returned a 401. A rate limit or
      // provider hiccup (RATE_LIMITED / PROVIDER_ERROR), or a 400/404 against the
      // hardcoded probe model (the model is gated/unavailable on the account, not
      // a bad key — these classify as AUTH_ERROR but carry their HTTP status),
      // all mean the key itself is fine, so they must not be reported as invalid.
      if (
        err instanceof AIError &&
        (err.code === "RATE_LIMITED" ||
          err.code === "PROVIDER_ERROR" ||
          err.status === 400 ||
          err.status === 404)
      ) {
        return { valid: true };
      }
      return { valid: false, error: message };
    }
  }

  async listModels(apiKey: string): Promise<ModelOption[]> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/models?limit=100`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    return parseModelCatalog(raw, "display_name");
  }
}

export class OpenRouterAdapter implements LLMProviderAdapter {
  readonly name: ProviderId = "openrouter";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? this.getDefaultBaseUrl();
  }

  getDefaultBaseUrl(): string {
    return "https://openrouter.ai/api/v1";
  }

  formatMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages;
  }

  parseResponse(raw: unknown): ProviderResponse {
    return parseOpenAIStyleResponse(raw);
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": globalThis.location?.origin ?? "https://lotm-rpg.vercel.app",
        "X-Title": "LOTM RPG",
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.formatMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat,
      }),
    });
    return this.parseResponse(raw);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fetchWithErrorHandling(`${this.baseUrl}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async listModels(apiKey: string): Promise<ModelOption[]> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return parseModelCatalog(raw, "name").sort((a, b) => a.name.localeCompare(b.name));
  }
}

export class OllamaAdapter implements LLMProviderAdapter {
  readonly name: ProviderId = "ollama";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? this.getDefaultBaseUrl();
  }

  getDefaultBaseUrl(): string {
    return "http://localhost:11434";
  }

  formatMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages;
  }

  parseResponse(raw: unknown): ProviderResponse {
    const data = raw as {
      message?: { content: string };
      model?: string;
      done_reason?: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };
    const content = data.message?.content ?? "";
    const promptTokens = data.prompt_eval_count ?? 0;
    const completionTokens = data.eval_count ?? 0;
    return {
      content,
      model: data.model ?? "unknown",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      truncated: data.done_reason === "length",
    };
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: request.model,
        messages: this.formatMessages(request.messages),
        stream: false,
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
        format: request.responseFormat ? "json" : undefined,
      }),
    });
    return this.parseResponse(raw);
  }

  async validateKey(apiKey: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      await fetchWithErrorHandling(`${this.baseUrl}/api/tags`, {
        method: "GET",
        headers,
      });
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Ollama not reachable",
      };
    }
  }

  async listModels(apiKey: string): Promise<ModelOption[]> {
    const headers: Record<string, string> = {};
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers,
    });
    const data = raw as { models?: { name?: string }[] };
    return (data.models ?? [])
      .map((m) => m.name)
      .filter((name): name is string => typeof name === "string" && name.length > 0)
      .sort()
      .map((id) => ({ id, name: id, tier: inferModelTier(id) }));
  }

  // Embedding seam (issue #60). Ollama serves embeddings on the same daemon via
  // `/api/embed`, so a player running Ollama can embed queries browser-direct —
  // mirroring the BYOK chat pattern (optional bearer key). The same method backs
  // the operator's always-on CPU box and the offline ingestion pass.
  async embed(model: string, texts: string[], apiKey: string): Promise<number[][]> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, input: texts }),
    });
    return parseEmbeddings(raw);
  }
}

// ollama.com does not send CORS headers, so direct browser fetches receive a
// status 0. Route through the server-side proxy at /api/proxy/ollama-cloud so
// the browser makes a same-origin call; the proxy forwards with the Bearer key.
export class OllamaCloudAdapter extends OpenAIAdapter {
  readonly name: ProviderId = "ollama-cloud";

  getDefaultBaseUrl(): string {
    return "/api/proxy/ollama-cloud";
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey.trim()) {
      return { valid: false, error: "Enter your ollama.com API key." };
    }
    return { valid: true };
  }
}

export class CustomAdapter implements LLMProviderAdapter {
  readonly name: ProviderId = "custom";
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? "";
  }

  getDefaultBaseUrl(): string {
    return "";
  }

  formatMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages;
  }

  parseResponse(raw: unknown): ProviderResponse {
    return parseOpenAIStyleResponse(raw);
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: this.formatMessages(request.messages),
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        response_format: request.responseFormat,
      }),
    });
    return this.parseResponse(raw);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fetchWithErrorHandling(`${this.baseUrl}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async listModels(apiKey: string): Promise<ModelOption[]> {
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    return parseModelCatalog(raw).sort((a, b) => a.id.localeCompare(b.id));
  }
}

export function createAdapter(
  providerId: ProviderId,
  baseUrl?: string,
): LLMProviderAdapter {
  switch (providerId) {
    case "openai":
      return new OpenAIAdapter(baseUrl);
    case "anthropic":
      return new AnthropicAdapter(baseUrl);
    case "openrouter":
      return new OpenRouterAdapter(baseUrl);
    case "ollama":
      return new OllamaAdapter(baseUrl);
    case "ollama-cloud":
      return new OllamaCloudAdapter(baseUrl);
    case "custom":
      return new CustomAdapter(baseUrl);
  }
}
