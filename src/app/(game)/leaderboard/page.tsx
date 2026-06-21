import type { Metadata } from "next";

import { LeaderboardPanel } from "@/components/game/leaderboard-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Records"
        title="The Board"
        description="Public records of Beyonders across every timeline."
      />

      <LeaderboardPanel />
    </div>
  );
}
