import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdapter } from "./providers";
import type { ProviderRequest } from "./types";

// These assert that the model-aware thinking level actually reaches each
// transport's request BODY in the shape that transport accepts — the wiring the
// pure resolvers in thinking.test.ts don't cover. Every adapter call funnels
// through the global fetch, so we spy it, capture the JSON body, and inspect it.

afterEach(() => vi.restoreAllMocks());

function spyOkJson(payload: unknown): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(payload)),
  } as Response);
}

function bodyOf(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
  const init = spy.mock.calls[0][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

const openAiReply = {
  choices: [{ message: { content: "{}" } }],
  model: "m",
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

function req(overrides: Partial<ProviderRequest>): ProviderRequest {
  return {
    messages: [{ role: "user", content: "hi" }],
    model: "gpt-4o",
    temperature: 0.5,
    maxTokens: 100,
    responseFormat: { type: "json_object" },
    ...overrides,
  };
}

describe("OpenAI-style adapters put reasoning_effort on the body", () => {
  it("ollama-cloud sends reasoning_effort:none for a gemma4 model with 'off'", async () => {
    const spy = spyOkJson(openAiReply);
    await createAdapter("ollama-cloud").makeRequest(
      req({ model: "gemma4:cloud", thinkingLevel: "off" }),
      "key",
    );
    expect(bodyOf(spy).reasoning_effort).toBe("none");
  });

  it("openai sends the mapped effort for a reasoning model", async () => {
    const spy = spyOkJson(openAiReply);
    await createAdapter("openai").makeRequest(
      req({ model: "gpt-5", thinkingLevel: "high" }),
      "key",
    );
    expect(bodyOf(spy).reasoning_effort).toBe("high");
  });

  it("omits reasoning_effort entirely for a non-thinking model", async () => {
    const spy = spyOkJson(openAiReply);
    await createAdapter("openai").makeRequest(
      req({ model: "gpt-4o", thinkingLevel: "high" }),
      "key",
    );
    expect(bodyOf(spy)).not.toHaveProperty("reasoning_effort");
  });

  it("custom adapter floors gpt-oss 'off' at 'low'", async () => {
    const spy = spyOkJson(openAiReply);
    await createAdapter("custom", "https://proxy.example/v1").makeRequest(
      req({ model: "gpt-oss:20b", thinkingLevel: "off" }),
      "key",
    );
    expect(bodyOf(spy).reasoning_effort).toBe("low");
  });
});

describe("native Ollama puts `think` on the body", () => {
  const ollamaReply = { message: { content: "{}" }, model: "gemma4" };

  it("sends think:false to disable gemma4", async () => {
    const spy = spyOkJson(ollamaReply);
    await createAdapter("ollama", "http://localhost:11434").makeRequest(
      req({ model: "gemma4:12b", thinkingLevel: "off" }),
      "",
    );
    expect(bodyOf(spy).think).toBe(false);
  });

  it("sends a boolean think for a non-gpt-oss reasoning family", async () => {
    const spy = spyOkJson(ollamaReply);
    await createAdapter("ollama", "http://localhost:11434").makeRequest(
      req({ model: "deepseek-r1", thinkingLevel: "medium" }),
      "",
    );
    expect(bodyOf(spy).think).toBe(true);
  });

  it("omits `think` for a non-thinking local model", async () => {
    const spy = spyOkJson(ollamaReply);
    await createAdapter("ollama", "http://localhost:11434").makeRequest(
      req({ model: "llama3.2", thinkingLevel: "high" }),
      "",
    );
    expect(bodyOf(spy)).not.toHaveProperty("think");
  });
});

describe("Anthropic puts output_config.effort on the body (default base URL only)", () => {
  const anthropicReply = {
    content: [{ type: "text", text: "{}" }],
    model: "claude-opus-4-8",
    usage: { input_tokens: 1, output_tokens: 1 },
  };

  it("sends effort for a supported model on the default base URL", async () => {
    const spy = spyOkJson(anthropicReply);
    await createAdapter("anthropic").makeRequest(
      req({ model: "claude-opus-4-8", thinkingLevel: "medium" }),
      "sk-ant",
    );
    const oc = bodyOf(spy).output_config as Record<string, unknown> | undefined;
    expect(oc?.effort).toBe("medium");
  });

  it("does NOT send effort against a non-default (proxy) base URL", async () => {
    const spy = spyOkJson(anthropicReply);
    await createAdapter("anthropic", "https://anthropic-proxy.example/v1").makeRequest(
      req({ model: "claude-opus-4-8", thinkingLevel: "medium" }),
      "sk-ant",
    );
    expect(bodyOf(spy)).not.toHaveProperty("output_config");
  });

  it("omits effort for a model that doesn't support it (Haiku)", async () => {
    const spy = spyOkJson({ ...anthropicReply, model: "claude-haiku-4-5" });
    await createAdapter("anthropic").makeRequest(
      req({ model: "claude-haiku-4-5", thinkingLevel: "high" }),
      "sk-ant",
    );
    expect(bodyOf(spy)).not.toHaveProperty("output_config");
  });
});
