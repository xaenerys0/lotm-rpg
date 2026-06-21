import type { Metadata } from "next";

import { MapPanel } from "@/components/game/map-panel";
import { FirstTimeHint } from "@/components/game/first-time-hint";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Whereabouts"
        title="The Gazetteer"
        description="The districts of your city, as a walker knows them."
      />

      <FirstTimeHint id="map">
        The gazetteer marks where your active character currently is. More of the world
        opens up as your story travels.
      </FirstTimeHint>

      <MapPanel />
    </div>
  );
}
