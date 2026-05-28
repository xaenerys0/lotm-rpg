import type { ChatMessage, ProviderId, ProviderRequest, ProviderResponse } from "./types";
import { AIError, classifyHttpError, createNetworkError } from "./errors";

export interface LLMProviderAdapter {
  readonly name: ProviderId;
  makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse>;
  validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;
  formatMessages(messages: ChatMessage[]): unknown;
  parseResponse(raw: unknown): ProviderResponse;
  getDefaultBaseUrl(): string;
}

interface OpenAIStyleResponse {
  choices: { message: { content: string } }[];
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
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
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
    };
  }

  async makeRequest(request: ProviderRequest, apiKey: string): Promise<ProviderResponse> {
    const { system, messages } = this.formatMessages(request.messages);
    const raw = await fetchWithErrorHandling(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2024-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: request.model,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
      }),
    });
    return this.parseResponse(raw);
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      await fetchWithErrorHandling(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2024-06-01",
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
      if (
        err instanceof AIError &&
        (err.code === "RATE_LIMITED" || err.code === "PROVIDER_ERROR")
      ) {
        return { valid: true };
      }
      return { valid: false, error: message };
    }
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
