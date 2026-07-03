import { describe, expect, it } from "vitest";
import {
  THINKING_LEVELS,
  DEFAULT_THINKING_LEVEL,
  isThinkingLevel,
  bumpThinkingLevel,
  resolveReasoningEffort,
  resolveAnthropicEffort,
  resolveOllamaThink,
  type ThinkingLevel,
} from "./thinking";

const LEVELS: ThinkingLevel[] = ["off", "low", "medium", "high"];

describe("thinking level constants", () => {
  it("orders the levels off→high with off first", () => {
    expect(THINKING_LEVELS).toEqual(["off", "low", "medium", "high"]);
  });

  it("defaults to off — the fastest baseline (resolvers clamp per model)", () => {
    expect(DEFAULT_THINKING_LEVEL).toBe("off");
  });
});

describe("isThinkingLevel", () => {
  it("accepts every valid level", () => {
    for (const level of THINKING_LEVELS) {
      expect(isThinkingLevel(level)).toBe(true);
    }
  });

  it("rejects unknown strings and non-strings", () => {
    expect(isThinkingLevel("none")).toBe(false);
    expect(isThinkingLevel("max")).toBe(false);
    expect(isThinkingLevel("")).toBe(false);
    expect(isThinkingLevel(undefined)).toBe(false);
    expect(isThinkingLevel(2)).toBe(false);
    expect(isThinkingLevel(null)).toBe(false);
  });
});

describe("bumpThinkingLevel", () => {
  it("nudges one notch up", () => {
    expect(bumpThinkingLevel("off")).toBe("low");
    expect(bumpThinkingLevel("low")).toBe("medium");
    expect(bumpThinkingLevel("medium")).toBe("high");
  });

  it("caps at the top of the scale", () => {
    expect(bumpThinkingLevel("high")).toBe("high");
  });
});

describe("resolveReasoningEffort (OpenAI-compatible transports)", () => {
  it("lets gemma4+ fully disable via 'none' and passes levels through", () => {
    expect(resolveReasoningEffort("gemma4:cloud", "off")).toBe("none");
    expect(resolveReasoningEffort("gemma4:31b-cloud", "low")).toBe("low");
    expect(resolveReasoningEffort("gemma4:12b", "medium")).toBe("medium");
    expect(resolveReasoningEffort("gemma4", "high")).toBe("high");
  });

  it("does NOT treat gemma2/gemma3 as thinking models (they reject the param)", () => {
    for (const level of LEVELS) {
      expect(resolveReasoningEffort("gemma3:12b", level)).toBeNull();
      expect(resolveReasoningEffort("gemma2", level)).toBeNull();
      expect(resolveReasoningEffort("gemma", level)).toBeNull();
    }
  });

  it("floors gpt-oss at 'low' — it cannot disable thinking", () => {
    expect(resolveReasoningEffort("gpt-oss:120b", "off")).toBe("low");
    expect(resolveReasoningEffort("gpt-oss:20b", "low")).toBe("low");
    expect(resolveReasoningEffort("gpt-oss:120b", "high")).toBe("high");
  });

  it("maps 'off' to 'minimal' for OpenAI reasoning models", () => {
    expect(resolveReasoningEffort("o3", "off")).toBe("minimal");
    expect(resolveReasoningEffort("o1-mini", "off")).toBe("minimal");
    expect(resolveReasoningEffort("o4-mini", "medium")).toBe("medium");
    expect(resolveReasoningEffort("gpt-5", "high")).toBe("high");
    expect(resolveReasoningEffort("gpt-5.1", "low")).toBe("low");
  });

  it("clamps 'off' to 'low' for other reasoning families (deepseek / qwen)", () => {
    expect(resolveReasoningEffort("deepseek-r1", "off")).toBe("low");
    expect(resolveReasoningEffort("deepseek-v3.2", "medium")).toBe("medium");
    expect(resolveReasoningEffort("qwen3-thinking", "off")).toBe("low");
    expect(resolveReasoningEffort("qwen3-32b-thinking", "high")).toBe("high");
  });

  it("omits the parameter for non-thinking models at every level", () => {
    for (const level of LEVELS) {
      expect(resolveReasoningEffort("gpt-4o", level)).toBeNull();
      expect(resolveReasoningEffort("gpt-4o-mini", level)).toBeNull();
      expect(resolveReasoningEffort("llama3.1:70b", level)).toBeNull();
      expect(resolveReasoningEffort("mistral-large", level)).toBeNull();
    }
  });

  it("omits the parameter when no level is requested", () => {
    expect(resolveReasoningEffort("gemma4", undefined)).toBeNull();
    expect(resolveReasoningEffort("gpt-4o", undefined)).toBeNull();
  });

  it("does not mistake deepseek-v3.0 for a reasoning variant", () => {
    // Only v3.1+ / r1 reason; a bare deepseek-v3 shouldn't get the param.
    expect(resolveReasoningEffort("deepseek-v3", "low")).toBeNull();
  });
});

describe("resolveAnthropicEffort", () => {
  it("maps levels to effort on supported first-party models", () => {
    expect(resolveAnthropicEffort("claude-opus-4-8", "off")).toBe("low");
    expect(resolveAnthropicEffort("claude-opus-4-7", "low")).toBe("low");
    expect(resolveAnthropicEffort("claude-opus-4-6", "medium")).toBe("medium");
    expect(resolveAnthropicEffort("claude-opus-4-5", "high")).toBe("high");
    expect(resolveAnthropicEffort("claude-sonnet-4-6", "medium")).toBe("medium");
    expect(resolveAnthropicEffort("claude-sonnet-5", "high")).toBe("high");
    expect(resolveAnthropicEffort("claude-fable-5", "low")).toBe("low");
  });

  it("clamps 'off' to the 'low' effort floor (no portable disable)", () => {
    expect(resolveAnthropicEffort("claude-sonnet-5", "off")).toBe("low");
  });

  it("omits effort for models that reject it (Haiku 4.5, Sonnet 4.5, older)", () => {
    expect(resolveAnthropicEffort("claude-haiku-4-5", "high")).toBeNull();
    expect(resolveAnthropicEffort("claude-haiku-4-5-20251001", "low")).toBeNull();
    expect(resolveAnthropicEffort("claude-sonnet-4-5", "medium")).toBeNull();
    expect(resolveAnthropicEffort("claude-3-opus-20240229", "high")).toBeNull();
  });

  it("keeps effort on the real dated ids but not a longer look-alike version", () => {
    // A dated id continues with "-YYYYMMDD" (boundary passes); a hypothetical
    // longer minor version must NOT match the shorter one.
    expect(resolveAnthropicEffort("claude-opus-4-5-20251101", "high")).toBe("high");
    expect(resolveAnthropicEffort("claude-opus-4-80", "high")).toBeNull();
  });

  it("omits effort when no level is requested", () => {
    expect(resolveAnthropicEffort("claude-opus-4-8", undefined)).toBeNull();
  });
});

describe("resolveOllamaThink (native /api/chat)", () => {
  it("disables gemma4 with think:false and passes level strings through", () => {
    expect(resolveOllamaThink("gemma4:12b", "off")).toBe(false);
    expect(resolveOllamaThink("gemma4:12b", "low")).toBe("low");
    expect(resolveOllamaThink("gemma4:12b", "high")).toBe("high");
  });

  it("floors gpt-oss 'off' at the 'low' string (cannot disable)", () => {
    expect(resolveOllamaThink("gpt-oss:20b", "off")).toBe("low");
    expect(resolveOllamaThink("gpt-oss:20b", "medium")).toBe("medium");
  });

  it("uses a plain boolean for other reasoning families (deepseek / qwen)", () => {
    // Native `think` only accepts level strings for gpt-oss/gemma; these take a
    // boolean, so a level string would be rejected.
    expect(resolveOllamaThink("deepseek-r1", "off")).toBe(false);
    expect(resolveOllamaThink("deepseek-r1", "medium")).toBe(true);
    expect(resolveOllamaThink("qwen3-thinking", "high")).toBe(true);
  });

  it("omits the control for a non-thinking local model or no level", () => {
    expect(resolveOllamaThink("llama3.2", "off")).toBeNull();
    expect(resolveOllamaThink("llama3.2", "high")).toBeNull();
    expect(resolveOllamaThink("gemma3", "high")).toBeNull();
    expect(resolveOllamaThink("gemma4:12b", undefined)).toBeNull();
  });
});
