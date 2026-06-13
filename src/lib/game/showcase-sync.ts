import type { Database, Json } from "@/lib/types/database";

import type { ShowcaseStats } from "./achievements";
import type { GameSession } from "./types";

// Supabase glue for player showcases & leaderboards (issue #18), over a
// minimal structural client (the journal-sync pattern). Publishing is an
// explicit player action; privacy rides on the SELECT policy (only rows
// marked public are visible to others).

type ShowcaseRow = Database["public"]["Tables"]["player_showcases"]["Row"];
type ShowcaseInsert = Database["public"]["Tables"]["player_showcases"]["Insert"];

export type LeaderboardMetric = "sequence" | "achievements" | "divergence";

export interface ShowcaseClient {
  from(table: "player_showcases"): {
    upsert(
      rows: ShowcaseInsert[],
      options: { onConflict: string },
    ): PromiseLike<{ error: { message: string } | null }>;
    select(columns: string): {
      eq(
        column: "public",
        value: boolean,
      ): {
        limit(count: number): PromiseLike<{
          data: ShowcaseRow[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

/** Build the row a publish action upserts. */
export function toShowcaseRow(
  session: GameSession,
  args: {
    userId: string;
    displayName: string;
    isPublic: boolean;
    achievementIds: string[];
    divergence: number;
    stats: ShowcaseStats;
  },
): ShowcaseInsert {
  return {
    user_id: args.userId,
    display_name: args.displayName.trim() || "A nameless Beyonder",
    public: args.isPublic,
    pathway_id: session.gameState.pathwayId,
    sequence_level: session.gameState.sequenceLevel,
    achievement_ids: args.achievementIds,
    divergence_score: args.divergence,
    stats: args.stats as unknown as Json,
    updated_at: new Date().toISOString(),
  };
}

export async function publishShowcase(
  client: ShowcaseClient,
  row: ShowcaseInsert,
): Promise<void> {
  const { error } = await client
    .from("player_showcases")
    .upsert([row], { onConflict: "user_id" });
  if (error) throw new Error(`Publishing your showcase failed: ${error.message}`);
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  pathwayId: number;
  sequenceLevel: number;
  achievementCount: number;
  divergenceScore: number;
  stats: ShowcaseStats;
}

/**
 * Fetch public showcases and rank them client-side by the chosen metric
 * (sequence: lower = stronger; achievements/divergence: higher first), with
 * an optional pathway filter. Private rows never arrive — RLS hides them.
 */
export async function fetchLeaderboard(
  client: ShowcaseClient,
  options: { metric: LeaderboardMetric; pathwayId?: number; limit?: number } = {
    metric: "sequence",
  },
): Promise<LeaderboardEntry[]> {
  const { data, error } = await client
    .from("player_showcases")
    .select("*")
    .eq("public", true)
    .limit(options.limit ?? 200);
  if (error) throw new Error(`The board is unreadable: ${error.message}`);

  const entries = (data ?? [])
    .filter(
      (row) => options.pathwayId === undefined || row.pathway_id === options.pathwayId,
    )
    .map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      pathwayId: row.pathway_id,
      sequenceLevel: row.sequence_level,
      achievementCount: row.achievement_ids.length,
      divergenceScore: row.divergence_score,
      stats: row.stats as unknown as ShowcaseStats,
    }));

  return entries.sort((a, b) => {
    if (options.metric === "sequence") {
      return a.sequenceLevel - b.sequenceLevel || b.achievementCount - a.achievementCount;
    }
    if (options.metric === "achievements") {
      return b.achievementCount - a.achievementCount || a.sequenceLevel - b.sequenceLevel;
    }
    return b.divergenceScore - a.divergenceScore || a.sequenceLevel - b.sequenceLevel;
  });
}
