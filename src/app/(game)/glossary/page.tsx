import type { Metadata } from "next";

import { GlossaryPanel } from "@/components/game/glossary-panel";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Glossary" };

export default function GlossaryPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Lexicon"
        title="Glossary"
        description="A walker’s lexicon of the hidden world. Entries unseal as you advance."
      />

      <GlossaryPanel />
    </div>
  );
}
