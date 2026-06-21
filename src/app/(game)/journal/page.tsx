import type { Metadata } from "next";

import { JournalPanel } from "@/components/game/journal-panel";
import { FirstTimeHint } from "@/components/game/first-time-hint";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Chronicle"
        title="Journal"
        description="A chronicle of your journey through the Fifth Epoch."
      />

      <FirstTimeHint id="journal">
        Key events are recorded here automatically as you play. Add your own notes to any
        entry — the narrator never sees them — and export the whole chronicle as Markdown.
      </FirstTimeHint>

      <JournalPanel />
    </div>
  );
}
