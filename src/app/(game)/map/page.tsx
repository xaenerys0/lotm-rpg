import type { Metadata } from "next";

import { MapPanel } from "@/components/game/map-panel";
import { FirstTimeHint } from "@/components/game/first-time-hint";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Map of Tingen
        </h1>
        <p className="mt-2 text-muted">
          The districts of the city, as a walker knows them.
        </p>
      </header>

      <FirstTimeHint id="map">
        The gazetteer marks where your active character currently is. More of the world
        opens up as your story travels.
      </FirstTimeHint>

      <MapPanel />
    </div>
  );
}
