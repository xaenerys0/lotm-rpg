import type {
  AIResponse,
  BulletSummary,
  FactSource,
  MemoryState,
  SessionFact,
  TurnKind,
  TurnRecord,
} from "./types";

// Full-text turns the narrator sees verbatim before they compress to bullets.
// Raised 5 → 8 (story-memory consistency): the immediate window is the only
// place the full narrative survives, so a wider window keeps recent detail
// intact for more turns before it is reduced to a one-line summary. The history
// token budget (`TOKEN_BUDGET.history` in prompts.ts) was widened in lockstep so
// these turns actually fit at prompt-assembly time rather than being re-trimmed.
const IMMEDIATE_WINDOW_MAX = 8;
const IMMEDIATE_WINDOW_MIN = 3;
const RECENT_WINDOW_MAX = 15;
const SESSION_FACTS_MAX = 40;
const TOKEN_PER_TURN_ESTIMATE = 150;
const TOKEN_PER_SUMMARY_ESTIMATE = 30;
const TOKEN_PER_FACT_ESTIMATE = 20;

/**
 * Max chars of narrative kept in an evicted turn's one-line bullet. Raised
 * 120 → 320 (story-memory consistency): once a turn ages out of the immediate
 * window the bullet is ALL that remains of it, and 120 chars dropped nearly the
 * whole beat (a sentence fragment) — losing the very continuity the summary is
 * meant to preserve. 320 keeps the gist of the result without bloating the
 * recent-history block.
 */
export const SUMMARY_NARRATIVE_CHAR_CAP = 320;

/** Rough chars-per-token heuristic shared by every prompt/budget estimate. */
export const CHARS_PER_TOKEN = 4;

/**
 * Type-importance weights for salience-based session-fact eviction. Narrative
 * spine (quest progress, who you met) outranks incidental events and loot when
 * the cap forces a drop. Park et al. (Generative Agents) score memories by
 * recency × importance; this is the importance axis, with recency as the
 * tiebreak in {@link lowestSalienceFactIndex}.
 */
const FACT_TYPE_IMPORTANCE: Record<SessionFact["type"], number> = {
  "quest-progress": 3,
  "npc-encounter": 2,
  event: 1,
  "item-change": 0,
};

/**
 * Salience bonus that lifts every `engine` (ground-truth) fact above every `ai`
 * (narrator-extracted) fact, so an authoritative event is never evicted before a
 * less-reliable AI-asserted one. Larger than any type weight so source dominates
 * the ordering. A fact with no source is treated as `engine` (see {@link FactSource}).
 */
const ENGINE_SOURCE_BONUS = 100;

/**
 * Hard cap (chars) on the durable running summary. Bounds prompt growth — the
 * narrator recursively prunes its own synopsis to stay under it (best practice
 * across LangChain summary-buffer / MemGPT recursive summaries). ~375 tokens.
 */
export const RUNNING_SUMMARY_CHAR_CAP = 1500;

/**
 * Bound a string to `maxChars`, appending an ellipsis when it overflows. The
 * one place durable text (running summary, prologue recap) is length-capped.
 * Pure; does not trim — the caller decides whether leading/trailing space
 * matters before capping.
 */
export function capWithEllipsis(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + "…" : text;
}

/** Trim then bound the running summary. The single cap for the durable synopsis. */
export function capRunningSummary(summary: string): string {
  return capWithEllipsis(summary.trim(), RUNNING_SUMMARY_CHAR_CAP);
}

/**
 * Below this prior length (chars) the running summary is too small to "collapse"
 * — early-game synopses are legitimately short, so the regression guard stays
 * out of their way.
 */
export const SUMMARY_REGRESSION_FLOOR = 300;

/**
 * A new summary below this absolute length (chars) — roughly a sentence or two —
 * is treated as a near-empty WIPE of the durable chronicle, not a legitimate
 * prune. Deliberately an ABSOLUTE floor, not a fraction of the prior: the new
 * structured-summary format encourages terse synopses, and a ratio of the prior
 * would livelock — a long prior would perpetually reject every legitimately
 * compact rewrite, pinning the synopsis to a stale value that can never update.
 * Any real labelled summary (even one terse line per label) clears this; only a
 * genuine blanking falls below it.
 */
export const SUMMARY_COLLAPSE_CEILING = 120;

/**
 * Guard against the recursive-summarization failure mode where the narrator
 * silently discards the durable chronicle in a single rewrite (the "fail-plausible"
 * collapse: a fluent but near-empty synopsis that future turns then treat as the
 * whole story). Returns true when a SUBSTANTIAL `prior` (≥
 * {@link SUMMARY_REGRESSION_FLOOR} chars) is replaced by a near-empty `next`
 * (< {@link SUMMARY_COLLAPSE_CEILING} chars) — at which point {@link addTurn}
 * keeps the prior summary instead.
 *
 * The absolute ceiling (rather than a fraction of the prior) is deliberate: it
 * catches only a true blanking, never a legitimate compaction, so it cannot
 * livelock a long synopsis into permanent staleness. A false reject costs one
 * turn of a slightly-staler synopsis (recoverable next turn) whereas a false
 * accept permanently wipes durable memory — an asymmetry that favours keeping
 * the prior. We do NOT attempt fuzzy semantic contradiction-checking against
 * `GameState` here: the synopsis need not mention a field for it to be
 * consistent, so absence-of-mention is not contradiction and string-matching
 * would false-reject legitimate updates. Ground-truth precedence is instead
 * asserted structurally by the `## Ground Truth` anchor the history layer pins
 * above the synopsis (see `buildHistoryPrompt`).
 */
export function isSummaryRegression(prior: string, next: string): boolean {
  if (prior.trim().length < SUMMARY_REGRESSION_FLOOR) return false;
  return next.trim().length < SUMMARY_COLLAPSE_CEILING;
}

/**
 * Salience of a session fact for eviction ordering: `engine` provenance
 * (ground truth) dominates via {@link ENGINE_SOURCE_BONUS}, then type importance
 * ({@link FACT_TYPE_IMPORTANCE}). Higher = kept longer. A fact with no `source`
 * counts as `engine` (legacy saves predate the field; keeping them is the safe
 * default). Pure.
 */
export function factSalience(fact: SessionFact): number {
  const source: FactSource = fact.source ?? "engine";
  const sourceBonus = source === "engine" ? ENGINE_SOURCE_BONUS : 0;
  return sourceBonus + FACT_TYPE_IMPORTANCE[fact.type];
}

/**
 * Index of the fact to evict when the session-fact cap is exceeded: the lowest
 * salience, breaking ties by oldest `turnNumber`, then earliest position. For a
 * uniform set this reduces to FIFO (evict the oldest), preserving the prior
 * behaviour; a mixed set drops the least-important, least-authoritative fact
 * first. Pure; assumes a non-empty list (callers only call it over-cap).
 */
export function lowestSalienceFactIndex(facts: SessionFact[]): number {
  let worst = 0;
  for (let i = 1; i < facts.length; i++) {
    const candidate = facts[i];
    const current = facts[worst];
    const cs = factSalience(candidate);
    const ws = factSalience(current);
    if (cs < ws || (cs === ws && candidate.turnNumber < current.turnNumber)) {
      worst = i;
    }
  }
  return worst;
}

/**
 * Remove the single lowest-salience fact in place. The one eviction primitive
 * shared by the count cap ({@link capSessionFacts}) and the token-budget trim
 * ({@link trimMemoryForBudget}), so the eviction policy lives in exactly one
 * place. Callers only invoke it over a non-empty list (a positive cap / budget
 * loop guard); on an empty list `splice(0, 1)` would simply no-op.
 */
function evictLowestSalienceFact(facts: SessionFact[]): void {
  facts.splice(lowestSalienceFactIndex(facts), 1);
}

/** Evict the lowest-salience fact in place while the list exceeds `max`. */
function capSessionFacts(facts: SessionFact[], max: number): void {
  while (facts.length > max) {
    evictLowestSalienceFact(facts);
  }
}

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
      r.narrative.length > SUMMARY_NARRATIVE_CHAR_CAP
        ? r.narrative.slice(0, SUMMARY_NARRATIVE_CHAR_CAP - 3) + "..."
        : r.narrative;
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

  // Every fact here is read from the narrator's structured output, so it is
  // tagged `ai` — less authoritative than an engine-recorded fact and dropped
  // first under the salience-weighted cap.
  if (r.itemsDiscovered) {
    for (const item of r.itemsDiscovered) {
      facts.push({
        type: "item-change",
        description: `Discovered ${item.name}`,
        turnNumber: turn.turnNumber,
        source: "ai",
      });
    }
  }

  if (r.worldStateChanges) {
    for (const change of r.worldStateChanges) {
      facts.push({
        type: "event",
        description: `${change.field}: ${change.reason}`,
        turnNumber: turn.turnNumber,
        source: "ai",
      });
    }
  }

  if (r.actingEvaluation && r.actingEvaluation.alignment >= 0.8) {
    facts.push({
      type: "quest-progress",
      description: `Strong acting alignment (${r.actingEvaluation.alignment}): ${r.actingEvaluation.reasoning}`,
      turnNumber: turn.turnNumber,
      source: "ai",
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

  capSessionFacts(next.sessionFacts, SESSION_FACTS_MAX);

  // Adopt the narrator's updated rolling summary when it supplied a non-blank
  // one this turn; otherwise keep the prior synopsis so a turn that omits or
  // blanks it never erases the chronicle's durable memory. This is the single
  // cap for the persisted summary (the only path into durable memory).
  if (typeof turn.aiResponse.runningSummary === "string") {
    const capped = capRunningSummary(turn.aiResponse.runningSummary);
    // Adopt only when non-blank AND not a catastrophic collapse of a substantial
    // prior synopsis (see `isSummaryRegression`) — a sudden near-total shrink is
    // a faulty rewrite, so we keep the durable prior rather than let the
    // chronicle silently evaporate.
    if (capped !== "" && !isSummaryRegression(next.runningSummary ?? "", capped)) {
      next.runningSummary = capped;
    }
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
  // The engine records these directly from authoritative state, so default a
  // missing provenance to `engine` — the salience-protected tier (see
  // `factSalience`). A caller that explicitly tags `ai` is respected.
  next.sessionFacts.push({ ...fact, source: fact.source ?? "engine" });
  capSessionFacts(next.sessionFacts, SESSION_FACTS_MAX);
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

  // Drop the least-salient fact first (lowest-importance AI fact before any
  // ground-truth engine fact), via the same eviction primitive as the cap in
  // `addTurn`.
  while (estimate > budgetTokens && trimmed.sessionFacts.length > 0) {
    evictLowestSalienceFact(trimmed.sessionFacts);
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
  kind?: TurnKind,
): TurnRecord {
  return {
    turnNumber,
    playerAction,
    aiResponse,
    timestamp: Date.now(),
    // Recorded for retrieval determinism/debuggability (issue #63); omitted
    // entirely on turns that performed no retrieval.
    ...(retrievedChunkIds !== undefined ? { retrievedChunkIds } : {}),
    // The structured engine-turn kind (issue #171); absent for story turns.
    ...(kind !== undefined ? { kind } : {}),
  };
}
