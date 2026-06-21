import type { Metadata } from "next";

import { CharacterSheet } from "@/components/game/character-sheet";
import { FirstTimeHint } from "@/components/game/first-time-hint";
import { PageHeader } from "@/components/game/page-header";

export const metadata: Metadata = { title: "Character" };

export default function CharacterPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[var(--container-game)] px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Dossier"
        title="Character"
        description="Your Beyonder identity and progression."
      />

      <FirstTimeHint id="character">
        Your sheet reads like a dossier: abilities, the role your Sequence demands, your
        condition, and everything in your pockets.
      </FirstTimeHint>

      <CharacterSheet />
    </div>
  );
}
