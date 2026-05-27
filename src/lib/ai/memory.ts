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
const TOKEN_PER_TURN_ESTIMATE = 150;
const TOKEN_PER_SUMMARY_ESTIMATE = 30;
const TOKEN_PER_FACT_ESTIMATE = 20;

export function createMemoryState(): MemoryState {
  return {
    immediateTurns: [],
    recentSummaries: [],
    sessionFacts: [],
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

  return next;
}

export function estimateMemoryTokens(state: MemoryState): number {
  return (
    state.immediateTurns.length * TOKEN_PER_TURN_ESTIMATE +
    state.recentSummaries.length * TOKEN_PER_SUMMARY_ESTIMATE +
    state.sessionFacts.length * TOKEN_PER_FACT_ESTIMATE
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

  return trimmed;
}

export function formatMemoryForPrompt(state: MemoryState): string {
  const sections: string[] = [];

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
): TurnRecord {
  return {
    turnNumber,
    playerAction,
    aiResponse,
    timestamp: Date.now(),
  };
}
