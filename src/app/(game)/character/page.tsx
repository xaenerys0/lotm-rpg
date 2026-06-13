import type { Metadata } from "next";

import { CharacterSheet } from "@/components/game/character-sheet";
import { FirstTimeHint } from "@/components/game/first-time-hint";

export const metadata: Metadata = { title: "Character" };

export default function CharacterPage() {
  return (
    <div className="mx-auto max-w-[var(--container-game)] px-6 py-10 animate-fade-in-up">
      <header className="gaslit mb-10">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-amber md:text-4xl">
          Character
        </h1>
        <p className="mt-2 text-muted">Your Beyonder identity and progression.</p>
      </header>

      <FirstTimeHint id="character">
        Your sheet reads like a dossier: abilities, the acting method your potion demands,
        your condition, and everything in your pockets.
      </FirstTimeHint>

      <CharacterSheet />
    </div>
  );
}
