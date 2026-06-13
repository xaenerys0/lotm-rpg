import type { Metadata } from "next";

import { LeaderboardPanel } from "@/components/game/leaderboard-panel";

export const metadata: Metadata = { title: "Leaderboard" };

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          The Board
        </h1>
        <p className="mt-2 text-muted">
          Public records of Beyonders across every timeline.
        </p>
      </header>

      <LeaderboardPanel />
    </div>
  );
}
