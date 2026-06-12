import type { Metadata } from "next";

import { SocietyPanel } from "@/components/game/society-panel";

export const metadata: Metadata = { title: "Society" };

export default function SocietyPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          The Gathering
        </h1>
        <p className="mt-2 text-muted">
          Code names, careful favors, and a table above the fog.
        </p>
      </header>

      <SocietyPanel />
    </div>
  );
}
