// Line-delimited JSON (JSONL) is the wire format between every pipeline stage:
// one record per line, append-only, streamable, and diffable in git. These
// helpers are the single read/write seam so the stages stay consistent.

/** Parse a JSONL document into records, skipping blank lines. */
export function parseJsonl<T = unknown>(text: string): T[] {
  return Array.from(iterateJsonl<T>(text));
}

/** Lazily yield one parsed record per non-blank line (streamable). */
export function* iterateJsonl<T = unknown>(text: string): Generator<T> {
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    yield JSON.parse(trimmed) as T;
  }
}

/** Serialize records to JSONL — one compact JSON object per line, trailing
 * newline when non-empty so files concatenate and diff cleanly. */
export function toJsonl(records: readonly unknown[]): string {
  if (records.length === 0) return "";
  return records.map((record) => JSON.stringify(record)).join("\n") + "\n";
}
