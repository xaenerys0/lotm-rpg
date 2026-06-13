// Session token-usage tracking (issue #15) — the "rough cost estimation"
// surface for BYOK players. Everything here is an ESTIMATE built on the same
// chars/4 heuristic the prompt budget uses: good enough to show order-of-
// magnitude spend, never an invoice. Pure functions; localStorage access stays
// in the React layer per the project convention.

/** Token estimates for one AI call. */
export interface TurnUsage {
  promptTokens: number;
  outputTokens: number;
}

/** Cumulative estimates for one play session. */
export interface SessionUsage {
  turns: number;
  promptTokens: number;
  outputTokens: number;
}

/**
 * Generic per-million-token rates for the rough estimate. Real prices vary
 * by provider/model (the player's BYOK key pays); these sit in the mid-range
 * of common hosted models, and local Ollama is effectively $0.
 */
export interface TokenRates {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const DEFAULT_TOKEN_RATES: TokenRates = {
  inputPerMillion: 3,
  outputPerMillion: 15,
};

export function emptyUsage(): SessionUsage {
  return { turns: 0, promptTokens: 0, outputTokens: 0 };
}

/** Fold one call's usage into the session tally (pure). */
export function addUsage(usage: SessionUsage, turn: TurnUsage): SessionUsage {
  return {
    turns: usage.turns + 1,
    promptTokens: usage.promptTokens + Math.max(0, turn.promptTokens),
    outputTokens: usage.outputTokens + Math.max(0, turn.outputTokens),
  };
}

/** Rough dollar estimate for the session at the given (or default) rates. */
export function estimateSessionCost(
  usage: SessionUsage,
  rates: TokenRates = DEFAULT_TOKEN_RATES,
): number {
  return (
    (usage.promptTokens / 1_000_000) * rates.inputPerMillion +
    (usage.outputTokens / 1_000_000) * rates.outputPerMillion
  );
}

/** Compact token count: 950 -> "950", 12_340 -> "12.3k", 2_000_000 -> "2.0M". */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return String(tokens);
}

/** One-line session summary for the status bar / settings panel. */
export function formatUsage(
  usage: SessionUsage,
  rates: TokenRates = DEFAULT_TOKEN_RATES,
): string {
  const cost = estimateSessionCost(usage, rates);
  const costText = cost >= 0.01 ? `~$${cost.toFixed(2)}` : "<$0.01";
  return `≈${formatTokenCount(usage.promptTokens)} in / ${formatTokenCount(usage.outputTokens)} out · ${costText}`;
}

export function serializeUsage(usage: SessionUsage): string {
  return JSON.stringify(usage);
}

/** Strict-shape parse; null for anything malformed (mirrors session parsing). */
export function deserializeUsage(json: string): SessionUsage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const u = parsed as Record<string, unknown>;
  for (const key of ["turns", "promptTokens", "outputTokens"] as const) {
    if (!Number.isFinite(u[key]) || (u[key] as number) < 0) return null;
  }
  return {
    turns: u.turns as number,
    promptTokens: u.promptTokens as number,
    outputTokens: u.outputTokens as number,
  };
}
