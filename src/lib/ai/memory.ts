import type {
  AIResponse,
  BulletSummary,
  MemoryState,
  SessionFact,
  TurnRecord,
} from "./types";

const IMMEDIATE_WINDOW_MAX = 5;
const IMMEDIATE_WINDOW_MIN = 3;
const RECENT_WINDOW_MAX = 15;
const SESSION_FACTS_MAX = 40;
const TOKEN_PER_TURN_ESTIMATE = 150;
const TOKEN_PER_SUMMARY_ESTIMATE = 30;
const TOKEN_PER_FACT_ESTIMATE = 20;
const CHARS_PER_TOKEN = 4;

/**
 * Hard cap (chars) on the durable running summary. Bounds prompt growth — the
 * narrator recursively prunes its own synopsis to stay under it (best practice
 * across LangChain summary-buffer / MemGPT recursive summaries). ~375 tokens.
 */
export const RUNNING_SUMMARY_CHAR_CAP = 1500;

/** Cap the running summary defensively (sanitize does this too). Pure. */
export function capRunningSummary(summary: string): string {
  const trimmed = summary.trim();
  return trimmed.length > RUNNING_SUMMARY_CHAR_CAP
    ? trimmed.slice(0, RUNNING_SUMMARY_CHAR_CAP).trimEnd() + "…"
    : trimmed;
}

export function createMemoryState(): MemoryState {
  return {
    immediateTurns: [],
    recentSummaries: [],
    sessionFacts: [],
    runningSummary: "",
  };
}

export function summarizeTurn(turn: TurnRecord): BulletSummary {
  const parts: string[] = [];
  parts.push(`Player: ${turn.playerAction}`);

  const r = turn.aiResponse;
  if (r.narrative) {
    const truncated =
      r.narrative.length > 120 ? r.narrative.slice(0, 117) + "..." : r.narrative;
    parts.push(`Result: ${truncated}`);
  }
  if (r.sanityImpact && r.sanityImpact !== 0) {
    parts.push(`Sanity: ${r.sanityImpact > 0 ? "+" : ""}${r.sanityImpact}`);
  }
  if (r.itemsDiscovered && r.itemsDiscovered.length > 0) {
    parts.push(`Found: ${r.itemsDiscovered.map((i) => i.name).join(", ")}`);
  }

  return {
    turnNumber: turn.turnNumber,
    summary: parts.join(" | "),
  };
}

export function extractSessionFacts(turn: TurnRecord): SessionFact[] {
  const facts: SessionFact[] = [];
  const r = turn.aiResponse;

  if (r.itemsDiscovered) {
    for (const item of r.itemsDiscovered) {
      facts.push({
        type: "item-change",
        description: `Discovered ${item.name}`,
        turnNumber: turn.turnNumber,
      });
    }
  }

  if (r.worldStateChanges) {
    for (const change of r.worldStateChanges) {
      facts.push({
        type: "event",
        description: `${change.field}: ${change.reason}`,
        turnNumber: turn.turnNumber,
      });
    }
  }

  if (r.actingEvaluation && r.actingEvaluation.alignment >= 0.8) {
    facts.push({
      type: "quest-progress",
      description: `Strong acting alignment (${r.actingEvaluation.alignment}): ${r.actingEvaluation.reasoning}`,
      turnNumber: turn.turnNumber,
    });
  }

  return facts;
}

export function addTurn(state: MemoryState, turn: TurnRecord): MemoryState {
  const next = structuredClone(state);

  next.immediateTurns.push(turn);

  while (next.immediateTurns.length > IMMEDIATE_WINDOW_MAX) {
    const evicted = next.immediateTurns.shift()!;
    const summary = summarizeTurn(evicted);
    next.recentSummaries.push(summary);
  }

  while (next.recentSummaries.length > RECENT_WINDOW_MAX) {
    next.recentSummaries.shift();
  }

  const newFacts = extractSessionFacts(turn);
  next.sessionFacts.push(...newFacts);

  while (next.sessionFacts.length > SESSION_FACTS_MAX) {
    next.sessionFacts.shift();
  }

  // Adopt the narrator's updated rolling summary when it supplied one this
  // turn; otherwise keep the prior synopsis so a turn that omits it never
  // erases the chronicle's durable memory.
  const incoming = turn.aiResponse.runningSummary;
  if (typeof incoming === "string" && incoming.trim() !== "") {
    next.runningSummary = capRunningSummary(incoming);
  }

  return next;
}

/**
 * Append a single session fact to memory, respecting the session-facts cap
 * (oldest evicted first). Pure — returns a new MemoryState. Used for events the
 * engine records directly rather than extracting from an AI turn (e.g. issue
 * #23 deliberate travel).
 */
export function addSessionFact(state: MemoryState, fact: SessionFact): MemoryState {
  const next = structuredClone(state);
  next.sessionFacts.push(fact);
  while (next.sessionFacts.length > SESSION_FACTS_MAX) {
    next.sessionFacts.shift();
  }
  return next;
}

export function estimateMemoryTokens(state: MemoryState): number {
  return (
    state.immediateTurns.length * TOKEN_PER_TURN_ESTIMATE +
    state.recentSummaries.length * TOKEN_PER_SUMMARY_ESTIMATE +
    state.sessionFacts.length * TOKEN_PER_FACT_ESTIMATE +
    Math.ceil((state.runningSummary?.length ?? 0) / CHARS_PER_TOKEN)
  );
}

export function trimMemoryForBudget(
  state: MemoryState,
  budgetTokens: number,
): MemoryState {
  const trimmed = structuredClone(state);
  let estimate = estimateMemoryTokens(trimmed);

  while (
    estimate > budgetTokens &&
    trimmed.immediateTurns.length > IMMEDIATE_WINDOW_MIN
  ) {
    const evicted = trimmed.immediateTurns.shift()!;
    trimmed.recentSummaries.push(summarizeTurn(evicted));
    estimate = estimateMemoryTokens(trimmed);
  }

  while (estimate > budgetTokens && trimmed.recentSummaries.length > 0) {
    trimmed.recentSummaries.shift();
    estimate = estimateMemoryTokens(trimmed);
  }

  while (estimate > budgetTokens && trimmed.sessionFacts.length > 0) {
    trimmed.sessionFacts.shift();
    estimate = estimateMemoryTokens(trimmed);
  }

  return trimmed;
}

export function formatMemoryForPrompt(state: MemoryState): string {
  const sections: string[] = [];

  // Pinned at the top, before facts and recent turns: the durable synopsis the
  // narrator both reads (to stay consistent) and rewrites (to keep it current).
  if (state.runningSummary && state.runningSummary.trim() !== "") {
    sections.push("## Story So Far");
    sections.push(state.runningSummary.trim());
  }

  if (state.sessionFacts.length > 0) {
    sections.push("## Session Facts");
    for (const fact of state.sessionFacts) {
      sections.push(`- [${fact.type}] ${fact.description}`);
    }
  }

  if (state.recentSummaries.length > 0) {
    sections.push("\n## Recent History (summaries)");
    for (const s of state.recentSummaries) {
      sections.push(`Turn ${s.turnNumber}: ${s.summary}`);
    }
  }

  if (state.immediateTurns.length > 0) {
    sections.push("\n## Recent Turns (full)");
    for (const t of state.immediateTurns) {
      sections.push(`\n### Turn ${t.turnNumber}`);
      sections.push(`Player action: ${t.playerAction}`);
      sections.push(`Narrative: ${t.aiResponse.narrative}`);
      if (t.aiResponse.choices && t.aiResponse.choices.length > 0) {
        sections.push(
          `Choices offered: ${t.aiResponse.choices.map((c) => c.text).join("; ")}`,
        );
      }
    }
  }

  return sections.join("\n");
}

export function buildTurnRecord(
  turnNumber: number,
  playerAction: string,
  aiResponse: AIResponse,
  retrievedChunkIds?: string[],
): TurnRecord {
  return {
    turnNumber,
    playerAction,
    aiResponse,
    timestamp: Date.now(),
    // Recorded for retrieval determinism/debuggability (issue #63); omitted
    // entirely on turns that performed no retrieval.
    ...(retrievedChunkIds !== undefined ? { retrievedChunkIds } : {}),
  };
}
