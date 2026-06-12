import type { Metadata } from "next";

import { JournalPanel } from "@/components/game/journal-panel";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Journal
        </h1>
        <p className="mt-2 text-muted">
          A chronicle of your journey through the Fifth Epoch.
        </p>
      </header>

      <JournalPanel />
    </div>
  );
}
