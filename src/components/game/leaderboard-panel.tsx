"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { getPathway, ALL_PATHWAYS } from "@/lib/rules";
import {
  fetchLeaderboard,
  sequenceClassificationFor,
  sequenceLabel,
  type LeaderboardEntry,
  type LeaderboardMetric,
  type ShowcaseClient,
} from "@/lib/game";

// Leaderboard (issue #18): public showcases only (RLS hides private rows),
// ranked by metric with a pathway filter. Best-effort networking.

const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  sequence: "Highest sequence",
  achievements: "Achievements",
  divergence: "Timeline divergence",
};

export function LeaderboardPanel() {
  const [metric, setMetric] = useState<LeaderboardMetric>("sequence");
  const [pathwayId, setPathwayId] = useState<number | undefined>(undefined);
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  const load = useCallback(async () => {
    try {
      const client = createClient() as unknown as ShowcaseClient;
      setEntries(await fetchLeaderboard(client, { metric, pathwayId }));
    } catch {
      setEntries([]);
    }
  }, [metric, pathwayId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-5">
        <div>
          <label
            htmlFor="board-metric"
            className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Rank by
          </label>
          <select
            id="board-metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value as LeaderboardMetric)}
            className="rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          >
            {(Object.keys(METRIC_LABELS) as LeaderboardMetric[]).map((value) => (
              <option key={value} value={value}>
                {METRIC_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="board-pathway"
            className="mb-1.5 block text-xs font-semibold tracking-[0.18em] text-amber uppercase"
          >
            Pathway
          </label>
          <select
            id="board-pathway"
            value={pathwayId ?? ""}
            onChange={(e) =>
              setPathwayId(e.target.value ? Number(e.target.value) : undefined)
            }
            className="rounded-lg border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30"
          >
            <option value="">All pathways</option>
            {ALL_PATHWAYS.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {pathway.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {entries === null ? (
        <p className="text-sm text-muted" role="status">
          Reading the board…
        </p>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted">
          The board is bare — no Beyonder has published a public record yet.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {entries.map((entry, index) => (
            <li
              key={entry.userId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-all duration-200 hover:border-amber/40"
            >
              <span className="flex items-center gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised font-serif text-sm font-semibold text-amber">
                  {index + 1}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {entry.displayName}
                  </span>
                  <span className="text-xs font-medium text-muted">
                    {entry.sequenceLevel <= 0
                      ? `${sequenceLabel(entry.pathwayId, entry.sequenceLevel)} (${sequenceClassificationFor(entry.sequenceLevel)})`
                      : `Seq ${entry.sequenceLevel} · ${getPathway(entry.pathwayId)?.name ?? "Unknown"}`}
                  </span>
                </span>
              </span>
              <span className="text-xs font-medium text-muted">
                {metric === "achievements"
                  ? `${entry.achievementCount} achievements`
                  : metric === "divergence"
                    ? `divergence ${entry.divergenceScore}`
                    : `${entry.achievementCount} achievements · divergence ${entry.divergenceScore}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
