import type { ChunkRecord } from "./types";

// ---------------------------------------------------------------------------
// Evaluation + leakage harness (issue #64, sub-issue of #57)
// ---------------------------------------------------------------------------
//
// Two advisory metrics over a labeled query -> expected-chunk set:
//   - recall@k  — does retrieval surface the chunks a librarian would pick?
//   - leakage   — does any player-visible result violate the timeline gate
//                 (future canon) or the concealment gate? This one is the
//                 timeline gate's SAFETY NET: a single violation is a bug.
// Both are advisory (visibility without blocking velocity): the CLI driver
// (`pnpm rag:eval`) always exits 0 unless --strict is passed.
//
// The harness is retriever-agnostic: tests and offline CI runs use the
// deterministic lexical retriever below (no DB, no embedder); the same cases
// can be replayed against the real `retrieveChunks` path when a corpus and
// embedder are available.

/** One labeled evaluation case. */
export interface EvalCase {
  id: string;
  query: string;
  /** Chunk ids that should appear in the top-k for this query. */
  expectedChunkIds: string[];
  /** The simulated player's timeline position (`null` = no limit). */
  canonPosition: number | null;
  /** The simulated player's concealment ceiling. */
  maxConcealmentTier: number;
}

/** The minimal row shape the harness needs back from a retriever. */
export interface EvalChunk {
  id: string;
  canon_order: number | null;
  concealment_tier: number;
}

/** Any retrieval path under evaluation (lexical, or the real gated RPC). */
export type EvalRetriever = (evalCase: EvalCase, k: number) => Promise<EvalChunk[]>;

export interface RecallCaseResult {
  caseId: string;
  expected: number;
  found: number;
  recall: number;
  missing: string[];
}

export interface RecallReport {
  k: number;
  cases: RecallCaseResult[];
  /** Mean per-case recall across the set. */
  recallAtK: number;
}

export interface LeakageViolation {
  caseId: string;
  chunkId: string;
  kind: "future-canon" | "concealed";
}

export interface LeakageReport {
  casesChecked: number;
  violations: LeakageViolation[];
  clean: boolean;
}

export const DEFAULT_EVAL_K = 10;

/** Recall@k: per case, the fraction of expected chunks present in the top-k. */
export async function evalRecallAtK(
  cases: readonly EvalCase[],
  retrieve: EvalRetriever,
  k: number = DEFAULT_EVAL_K,
): Promise<RecallReport> {
  const results: RecallCaseResult[] = [];
  for (const evalCase of cases) {
    const returned = new Set((await retrieve(evalCase, k)).map((c) => c.id));
    const missing = evalCase.expectedChunkIds.filter((id) => !returned.has(id));
    const found = evalCase.expectedChunkIds.length - missing.length;
    results.push({
      caseId: evalCase.id,
      expected: evalCase.expectedChunkIds.length,
      found,
      recall:
        evalCase.expectedChunkIds.length === 0
          ? 1
          : found / evalCase.expectedChunkIds.length,
      missing,
    });
  }
  const recallAtK =
    results.length === 0
      ? 1
      : results.reduce((sum, r) => sum + r.recall, 0) / results.length;
  return { k, cases: results, recallAtK };
}

/**
 * Leakage: every chunk a player-visible retrieval returns must respect that
 * player's timeline position and concealment ceiling. Any violation is a bug
 * in the gate path, not a tuning concern.
 */
export async function evalLeakage(
  cases: readonly EvalCase[],
  retrieve: EvalRetriever,
  k: number = DEFAULT_EVAL_K,
): Promise<LeakageReport> {
  const violations: LeakageViolation[] = [];
  for (const evalCase of cases) {
    for (const chunk of await retrieve(evalCase, k)) {
      if (
        evalCase.canonPosition !== null &&
        chunk.canon_order !== null &&
        chunk.canon_order > evalCase.canonPosition
      ) {
        violations.push({
          caseId: evalCase.id,
          chunkId: chunk.id,
          kind: "future-canon",
        });
      }
      if (chunk.concealment_tier > evalCase.maxConcealmentTier) {
        violations.push({ caseId: evalCase.id, chunkId: chunk.id, kind: "concealed" });
      }
    }
  }
  return { casesChecked: cases.length, violations, clean: violations.length === 0 };
}

/** Render both reports as the advisory text the CLI prints. */
export function formatEvalReport(recall: RecallReport, leakage: LeakageReport): string {
  const lines = [
    `recall@${recall.k}: ${recall.recallAtK.toFixed(3)} over ${recall.cases.length} cases`,
  ];
  for (const c of recall.cases) {
    const miss = c.missing.length > 0 ? ` missing: ${c.missing.join(", ")}` : "";
    lines.push(`  ${c.caseId}: ${c.found}/${c.expected}${miss}`);
  }
  lines.push(
    leakage.clean
      ? `leakage: CLEAN (${leakage.casesChecked} cases)`
      : `leakage: ${leakage.violations.length} VIOLATION(S)`,
  );
  for (const v of leakage.violations) {
    lines.push(`  ${v.caseId}: ${v.kind} chunk ${v.chunkId}`);
  }
  return lines.join("\n");
}

/**
 * A deterministic, dependency-free retriever over an in-memory chunk corpus:
 * term-overlap scoring plus the SAME gates as `match_source_chunks` (timeline,
 * concealment), ties broken by id. Lets the harness run offline (tests, CI)
 * with no database and no embedder.
 */
export function createLexicalRetriever(chunks: readonly ChunkRecord[]): EvalRetriever {
  return (evalCase, k) => {
    const terms = queryTerms(evalCase.query);
    const scored = chunks
      .filter(
        (chunk) =>
          (evalCase.canonPosition === null ||
            chunk.canon_order === null ||
            chunk.canon_order <= evalCase.canonPosition) &&
          chunk.concealment_tier <= evalCase.maxConcealmentTier,
      )
      .map((chunk) => {
        const haystack = `${chunk.title}\n${chunk.content}`.toLowerCase();
        return {
          chunk,
          score: terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0),
        };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
    return Promise.resolve(
      scored.slice(0, k).map(({ chunk }) => ({
        id: chunk.id,
        canon_order: chunk.canon_order,
        concealment_tier: chunk.concealment_tier,
      })),
    );
  };
}

function queryTerms(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((term) => term.length > 2),
    ),
  ];
}
