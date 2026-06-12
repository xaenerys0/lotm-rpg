import type { Metadata } from "next";

import { GlossaryPanel } from "@/components/game/glossary-panel";

export const metadata: Metadata = { title: "Glossary" };

export default function GlossaryPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Glossary
        </h1>
        <p className="mt-2 text-muted">
          A walker&rsquo;s lexicon of the hidden world. Entries unseal as you advance.
        </p>
      </header>

      <GlossaryPanel />
    </div>
  );
}
