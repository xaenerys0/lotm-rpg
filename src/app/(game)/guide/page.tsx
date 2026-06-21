import type { Metadata } from "next";

import { GuidePanel } from "@/components/game/guide-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Guide" };

export default function GuidePage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Orientation"
        title="Guide"
        description="Find your way through the Mysteries — where everything lives and how to play."
      />

      <GuidePanel />
    </div>
  );
}
