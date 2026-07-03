// Model-aware "thinking level" — the single quality/speed dial that replaces the
// old routine/premium two-model split. The player picks ONE model and ONE
// abstract thinking level; this module resolves that level into whatever each
// model + transport legitimately accepts. Verified provider behaviour (July 2026):
//
//   - Ollama OpenAI-compatible `/v1/chat/completions` accepts `reasoning_effort`
//     for thinking-capable models. **gemma4** can fully disable thinking with
//     `reasoning_effort: "none"`; **gpt-oss** CANNOT — its floor is `"low"`
//     (`none`/`minimal` return an error). (ollama/ollama #12004, #15635.)
//   - OpenAI reasoning models (o-series, gpt-5) accept `reasoning_effort`
//     `minimal|low|medium|high`; non-reasoning models (gpt-4o) reject it.
//   - Anthropic does NOT use `reasoning_effort` at all — it uses
//     `output_config.effort` (`low|medium|high|max`), a different parameter.
//   - A model with no thinking control must receive NO parameter, or it 400s.
//
// The guiding rule: never send a value a model doesn't accept. When a family is
// unknown or non-thinking, the resolver omits the parameter entirely.

export type ThinkingLevel = "off" | "low" | "medium" | "high";

/** Ordered low→high; `off` first. Source of truth for the Settings selector. */
export const THINKING_LEVELS: readonly ThinkingLevel[] = [
  "off",
  "low",
  "medium",
  "high",
] as const;

/** The default baseline for player-driven (routine) turns. */
export const DEFAULT_THINKING_LEVEL: ThinkingLevel = "low";

export function isThinkingLevel(value: unknown): value is ThinkingLevel {
  return typeof value === "string" && THINKING_LEVELS.includes(value as ThinkingLevel);
}

// Premium (advancement/combat) turns nudge one notch up for the harder reasoning,
// capped at the top of the scale. This is what makes a SINGLE model behave like
// the old two-tier split: routine turns run at the player's level, premium turns
// one step deeper. Indexes THINKING_LEVELS directly so the scale has one home.
export function bumpThinkingLevel(level: ThinkingLevel): ThinkingLevel {
  const idx = THINKING_LEVELS.indexOf(level);
  return THINKING_LEVELS[Math.min(idx + 1, THINKING_LEVELS.length - 1)];
}

// ── Model-family detection (from the model id) ──────────────────────────────
// Families that speak the OpenAI-compatible `reasoning_effort` parameter, each
// with its own valid-value envelope.

type OpenAiThinkingFamily =
  | "gemma" // can disable → "none"
  | "gpt-oss" // floor is "low"; "none"/"minimal" error
  | "openai-reasoning" // o-series / gpt-5; "minimal" is the floor-off
  | "generic-reasoning" // other thinking models (deepseek, qwen thinking, …)
  | "none"; // no thinking control — send nothing

function detectOpenAiFamily(model: string): OpenAiThinkingFamily {
  const id = model.toLowerCase();
  // Only the gemma FOUR generation (and later) reasons — gemma2/gemma3 have no
  // thinking control and reject a reasoning parameter, so match gemma4..gemma9
  // and gemma10+ specifically, never a bare "gemma"/"gemma3".
  if (/gemma-?([4-9]|\d\d)/.test(id)) return "gemma";
  if (/gpt-oss/.test(id)) return "gpt-oss";
  // OpenAI reasoning models: o1/o3/o4-*, gpt-5*. gpt-4o and friends are NOT.
  if (/(^|[^a-z])o[134](-|$|\b)/.test(id) || /gpt-5/.test(id)) {
    return "openai-reasoning";
  }
  // Other known thinking families. deepseek-r1 / deepseek-v3.1+ and qwen3
  // "thinking" variants reason; we keep them on/low..high and never send an
  // off value we can't guarantee, so an unsupported "none" can't 400.
  if (/deepseek-(r1|v3\.[1-9]|v[4-9])/.test(id)) return "generic-reasoning";
  if (/qwen3.*think|thinking/.test(id)) return "generic-reasoning";
  return "none";
}

/**
 * Resolve the OpenAI-compatible `reasoning_effort` value for a level, or `null`
 * when the model takes no thinking parameter or no level was requested (so the
 * caller just omits it). Used by the OpenAI / OpenRouter / Ollama-Cloud / Custom
 * adapters — the transports that POST an OpenAI-shaped body. The undefined case
 * lives here so the call sites stay one-liners.
 */
export function resolveReasoningEffort(
  model: string,
  level: ThinkingLevel | undefined,
): string | null {
  if (level === undefined) return null;
  const family = detectOpenAiFamily(model);
  switch (family) {
    case "gemma":
      // gemma4 honours "none" on the chat/completions endpoint (ollama #15635).
      return level === "off" ? "none" : level;
    case "gpt-oss":
      // Cannot fully disable; clamp "off" up to the "low" floor (ollama #12004).
      return level === "off" ? "low" : level;
    case "openai-reasoning":
      // "minimal" is OpenAI's fastest reasoning setting; use it for "off".
      return level === "off" ? "minimal" : level;
    case "generic-reasoning":
      // Unknown disable support → clamp "off" to "low" rather than risk a 400.
      return level === "off" ? "low" : level;
    case "none":
      return null;
  }
}

// ── Anthropic ───────────────────────────────────────────────────────────────
// Anthropic has no `reasoning_effort`; depth is controlled by
// `output_config.effort` (GA on Opus 4.5+/4.6/4.7/4.8, Sonnet 4.6/5, Fable 5 —
// NOT Haiku 4.5 or Sonnet 4.5, which error). We can't portably disable thinking
// across the family, so "off" clamps to the "low" effort floor.

// The trailing `(?![\d.])` guards the version boundary so a future
// `opus-4-80`/`opus-4-5x` id can't match `opus-4-8`/`opus-4-5` (the real dated
// ids continue with `-YYYYMMDD`, so the boundary still passes for them).
const ANTHROPIC_EFFORT_MODELS = /(opus-4-[5-8]|sonnet-4-6|sonnet-5|fable-5)(?![\d.])/;

function anthropicSupportsEffort(model: string): boolean {
  return ANTHROPIC_EFFORT_MODELS.test(model.toLowerCase());
}

/**
 * Resolve the Anthropic `output_config.effort` value for a level, or `null` when
 * no level was requested or the model doesn't support the effort parameter (so
 * the caller omits it).
 */
export function resolveAnthropicEffort(
  model: string,
  level: ThinkingLevel | undefined,
): string | null {
  if (level === undefined || !anthropicSupportsEffort(model)) return null;
  return level === "off" ? "low" : level;
}

// ── Native Ollama (`/api/chat`) ─────────────────────────────────────────────
// Local Ollama uses a top-level `think` control rather than `reasoning_effort`.
// Only gpt-oss and gemma accept a level STRING there; the other reasoning
// families (deepseek-r1, qwen thinking) take a plain boolean, so a level string
// would be rejected. So: gpt-oss → level string (can't disable → "low" floor);
// gemma → level string, `false` to disable; every other reasoner → boolean
// (on/off); non-thinking or no level → `null` (omit the field).
export function resolveOllamaThink(
  model: string,
  level: ThinkingLevel | undefined,
): boolean | string | null {
  if (level === undefined) return null;
  const family = detectOpenAiFamily(model);
  if (family === "none") return null;
  if (family === "gpt-oss") return level === "off" ? "low" : level;
  if (family === "gemma") return level === "off" ? false : level;
  return level !== "off";
}
