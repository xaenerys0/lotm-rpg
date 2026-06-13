import type { Metadata } from "next";

import { ShowcasePanel } from "@/components/game/showcase-panel";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Profile
        </h1>
        <p className="mt-2 text-muted">
          Your deeds, your drift from canon, and what you choose to show the world.
        </p>
      </header>

      <ShowcasePanel />
    </div>
  );
}
