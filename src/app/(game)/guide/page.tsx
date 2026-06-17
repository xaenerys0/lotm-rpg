import type { Metadata } from "next";

import { GuidePanel } from "@/components/game/guide-panel";

export const metadata: Metadata = { title: "Guide" };

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Guide
        </h1>
        <p className="mt-2 text-muted">
          Find your way through the Mysteries — where everything lives and how to play.
        </p>
      </header>

      <GuidePanel />
    </div>
  );
}
