import { createMemoryState, capWithEllipsis } from "@/lib/ai";
import type { MemoryState, SessionFact } from "@/lib/ai";

export interface PathwayScore {
  pathwayId: number;
  score: number;
}

// Pathway ids: 1=Fool, 2=Visionary, 3=Sun, 4=Death, 5=Darkness, 6=Tyrant/Sailor,
// 7=Door/Apprentice, 8=Error/Marauder, 9=Hanged Man/Secrets Suppliant.
export const POTION_HEADINGS: Readonly<Record<number, string>> = {
  1: "The First Vision",
  2: "The First Glimpse",
  3: "The First Light",
  4: "The First Toll",
  5: "The First Night",
  6: "The First Tide",
  7: "The First Door",
  8: "The First Theft",
  9: "The First Offering",
};

export const FIRST_POTION_NARRATIVE: Readonly<Record<number, string>> = {
  1: `The Seer potion is the colour of dark water.\n\nYou have prepared the ingredients with care — Lavos Squid Blood as the primary, a Star Crystal ground to powder, and the supplementary additions measured out with precision. The ritual is brief. You drink.\n\nThe cold spreads from your throat before the glass is down. The world does not change; your perception of it does. Shapes sharpen at their edges. Shadows develop textures you cannot name. And in the corner of the room — faint, translucent, watching you with ancient curiosity — something that was not there before.\n\nA spirit. It sees that you can see it. And something in your mind opens, like a key turning in a lock you didn't know was there.\n\nYou are a Seer now. The world will never be quite opaque again.`,
  2: `The Spectator potion is nearly colourless — just the faintest tinge of violet, like diluted ink in water. The Phantom Lizard Pituitary Gland is the primary ingredient, difficult to source and stranger still to hold. Half-Ghost Rabbit Spinal Fluid adds a faint shimmer. You follow the formula exactly. You drink.\n\nThe sensation is not physical. No warmth, no cold, no change in the body. What changes is the quality of your attention.\n\nThe landlady's footsteps in the hallway become intelligible — the weight behind them, the hesitation at the third step, the way her breath catches when she passes your door. Fear of something. You know this without deciding to know it. Every face you passed today returns to you, and you can read them now: who was lying, who was carrying grief, who was merely pretending to be fine.\n\nYou set down the glass. You were always watching. You simply never understood what you were seeing.\n\nYou are a Spectator now. People, you are beginning to understand, are never quite what they appear.`,
  3: `The Bard potion is golden — not metaphorically, not faintly, but gold as autumn light caught in glass. Crystal Sunflower gives it that colour; the ground Siren Rock makes it warm to hold. The smell is like something that has been near a flame for a long time without burning. You drink.\n\nThe warmth comes from your chest, not from outside. A resonance, as though something dormant has begun to vibrate. You find yourself humming before you are aware of humming — a single note, simple, without melody — and the room changes. Not physically. But the cold draft from the window seems to yield, and the shadows draw back from the candlelight as though given permission to.\n\nYou set down the glass and listen to the silence. It is a different silence than before.\n\nYou are a Bard now. The sound that leaves you is no longer merely air.`,
  4: `The Corpse Collector potion is dark brown, nearly black at its depths. The Corpse Grass — harvested from the graves of Beyonders — gives it that colour. The Black-faced Vulture Oil makes the surface gleam. You have prepared both with care. You drink.\n\nThe cold comes. Not through your blood but through your skin — a second temperature layered over your own, the ambient chill of places where something has finished. The candle flame continues to burn, but something shifts in the corners of the room.\n\nNot quite there. Not quite gone.\n\nYou understand, slowly, that the room is not empty. It never was. Whatever passed through this space before you — you can feel the outline of it, like the impression left by a book that has been moved. Somewhere beneath the floorboards, muffled but distinct, you hear the house's own history settling.\n\nYou set down the glass. You are a Corpse Collector now. The dead, you are beginning to understand, have much to say. They were simply waiting for someone who could listen.`,
  5: `The Sleepless potion is the deep blue-black of a moonless sky. The Midnight Beauty Flower — which opens only after dark — gives it that colour; the Six-Footed Owl's eyes lend it a faint, watchful sheen. You measured the strong liquor and the night-vanilla oil by candlelight, and now, with the city long asleep, you drink.\n\nThe change is in the dark itself. The shadows of your room, a moment ago flat and ordinary, deepen into something you can read. The blackness past the window is no longer a wall but a country, and you can see into it — the cat on the far wall, the loose slate on the roof, the figure two streets over who should not be there.\n\nYou are not tired. You feel, if anything, that you could keep this vigil for nights on end.\n\nYou are Sleepless now. The night, you are beginning to understand, has been waiting for you to wake into it.`,
  6: `The Sailor potion smells of brine and storm before it touches your lips. The storm-petrel's heart and the deep-sea fish's blood give it a restless, sloshing colour, like seawater caught in a glass that will not sit still. You drink, and salt floods your mouth.\n\nThe cold of it runs down like a swallow of the sea. Your balance shifts — the floor seems to rise and fall gently, and you find your feet answering it without thought, sure as a deckhand in a swell. Beneath your skin something tightens and slips, scales you cannot see. The draught from the window carries the far-off sound of water, and your blood leans toward it.\n\nThere is a temper in you now, close beneath the surface, that was not so close before.\n\nYou are a Sailor now. The sea, you are beginning to understand, has put its hand on you and means to keep it there.`,
  7: `The Apprentice potion shimmers like half-melted snow, pale and clear, with small greenish bubbles that rise and vanish. The Gem-Eating Worm and the Phantom Crystal give it that strange light; the ancient well-water makes it cold as a cellar. You drink, and the cold spreads outward to your fingertips.\n\nNothing in the room moves — yet the room feels suddenly larger, as though every wall has become a suggestion rather than a fact. You sense, without trying, exactly how the building is laid out around you: the stair, the alley door, the gap behind the chimney. And you understand, with quiet certainty, that no door here could truly hold you.\n\nYou rest your palm against the wall and feel, faintly, the open street beyond it.\n\nYou are an Apprentice now. No threshold, you are beginning to understand, is quite closed to you any longer.`,
  8: `The Marauder potion is a deep blue-black and bitter on the tongue. The Blood-Spotted Black Mosquito and the Candle-Eating Spirit's core give it that darkness; the sapphire ground into it leaves a faint grit. You drink, and the bitterness sharpens every nerve in your hands.\n\nYour fingers wake. There is no other word for it — the sudden, almost shameful dexterity, the sense that a coin, a latch, a clasp would all yield to you without resistance. Your eyes move across the room and snag, unbidden, on the value of things: the loose floorboard, the cash-box, where a careful person would hide what they could not afford to lose.\n\nYou flex your hand and watch it move faster than thought.\n\nYou are a Marauder now. The world's locks, you are beginning to understand, were only ever a polite suggestion.`,
  9: `The Secrets Suppliant potion is the colour of old blood, thick and dark, and it carries a smell of cold ash and graveyard wormwood. The Shadow-Touched Toad's heart and the sacrificial altar-ash give it that hue; the black goat's blood makes the surface gleam dully. You speak the small rite over it, as the knowledge in your head insists you must, and you drink.\n\nThe knowledge comes with it — names you did not know an hour ago, shapes of ritual and sacrifice, a handful of honorific titles that your mind shies from even as it holds them. The candle gutters. The shadows in the corners feel, briefly, attentive.\n\nSomething has been given, and something — you sense — will be asked in return.\n\nYou are a Secrets Suppliant now. The hidden things, you are beginning to understand, answer those willing to pay, and the price is never named in advance.`,
};

// ───────────────────────────────────────────────────────────────────────────
// Generic, deterministic affinity tallying (issues #53, #119)
//
// These helpers are generic over ANY set of pathway ids — they never assume a
// fixed count. They power the live AI-prologue decision: the AI only narrates
// and tags choices with affinity weights (leaning toward a pathway region), the
// engine accumulates those weights here and computes the candidate set the
// player picks from. The neighborhood-affinity catalog the prologue scenes use
// lives in `@/lib/ai` `prologue-client.ts`.
// ───────────────────────────────────────────────────────────────────────────

/**
 * The pathway id with the greatest weight in a single affinity map (argmax).
 * Ties break toward the lowest id for determinism. Returns 0 for an empty map.
 */
export function dominantAffinity(affinities: Record<number, number>): number {
  let bestId = 0;
  let bestWeight = -Infinity;
  for (const [idStr, weight] of Object.entries(affinities)) {
    const id = Number(idStr);
    if (weight > bestWeight || (weight === bestWeight && (bestId === 0 || id < bestId))) {
      bestWeight = weight;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * Sum per-pathway affinity weights across every picked choice. The result is a
 * sparse map (only pathways that were actually touched appear). An empty input
 * yields an empty tally (every pathway implicitly zero).
 */
export function tallyAffinities(
  weightMaps: ReadonlyArray<Record<number, number>>,
): Record<number, number> {
  const tally: Record<number, number> = {};
  for (const map of weightMaps) {
    for (const [idStr, weight] of Object.entries(map)) {
      const id = Number(idStr);
      tally[id] = (tally[id] ?? 0) + weight;
    }
  }
  return tally;
}

/**
 * Rank a tally into descending `PathwayScore[]`. Ties break by ascending
 * pathway id so the ordering is fully deterministic and reproducible.
 */
export function rankPathways(tally: Record<number, number>): PathwayScore[] {
  return Object.entries(tally)
    .map(([id, score]) => ({ pathwayId: Number(id), score }))
    .sort((a, b) => b.score - a.score || a.pathwayId - b.pathwayId);
}

/**
 * The ranked pathway ids the finale should offer the player. Takes the top
 * `count` by score, includes every pathway tied at the cutoff score, and
 * guarantees at least `min` options by filling from the ranked list. Pure and
 * deterministic — generic over any number of pathways.
 */
export function selectTopCandidates(
  tally: Record<number, number>,
  opts?: { count?: number; min?: number },
): number[] {
  const count = opts?.count ?? 3;
  const min = opts?.min ?? 2;
  const ranked = rankPathways(tally);
  if (ranked.length === 0) return [];

  // Top `count`, plus everything tied at the cutoff score.
  const cutoffScore = ranked[Math.min(count, ranked.length) - 1]!.score;
  const selected = ranked.filter((p, i) => i < count || p.score === cutoffScore);

  // Floor: fill from the ranked list until we have at least `min` (or run out).
  const seen = new Set(selected);
  for (const p of ranked) {
    if (selected.length >= min) break;
    if (!seen.has(p)) {
      selected.push(p);
      seen.add(p);
    }
  }

  return selected.map((p) => p.pathwayId);
}

export function createAIPrologueMemory(
  selectedChoiceTexts: string[],
  characterName: string,
  background: string,
): MemoryState {
  const memory = createMemoryState();
  const facts: SessionFact[] = [
    {
      type: "event",
      description: `Character created: ${characterName}${background ? `. Background: ${background}` : ""}`,
      turnNumber: 0,
    },
    ...(selectedChoiceTexts.length > 0
      ? [
          {
            type: "event" as const,
            description: `Completed the AI-guided Beyonder prologue across ${selectedChoiceTexts.length} scenes.`,
            turnNumber: 0,
          },
        ]
      : []),
    ...selectedChoiceTexts.map(
      (text, i): SessionFact => ({
        type: "event",
        description: `Prologue scene ${i + 1}: ${text}`,
        turnNumber: 0,
      }),
    ),
  ];
  return { ...memory, sessionFacts: [...memory.sessionFacts, ...facts] };
}

/** Inputs for {@link buildPrologueRecap}. */
export interface PrologueRecapInput {
  /** The defining choices the character made during the prologue, in order. */
  choices: readonly string[];
  /** The finale scene — the chance encounter where potions were offered. */
  finaleNarrative?: string;
  /** The potion the character chose to drink (player-facing description). */
  chosenPotion?: string;
}

/** Hard cap (chars) so the durable recap stays small in every per-turn prompt. */
export const RECAP_FINALE_CHAR_CAP = 600;

/**
 * Compose a compact, durable recap of the AI prologue for the main narrator.
 * The prologue runs on a separate prompt (`prologue-client.ts`) that the story
 * narrator never sees, so without this the chronicle opens cold — no memory of
 * the life the character led or the encounter that made them a Beyonder. The
 * recap is pinned into the never-trimmed game-state layer (`buildGameStatePrompt`
 * via `GameState.prologueRecap`), so it keeps the prologue → story transition
 * seamless instead of fading as session facts age out of the history window.
 *
 * Returns `""` when there is nothing to recap (e.g. the manual path), so callers
 * can leave `prologueRecap` unset.
 */
export function buildPrologueRecap(input: PrologueRecapInput): string {
  const choices = input.choices.map((c) => c.trim()).filter((c) => c.length > 0);
  const finale = input.finaleNarrative?.trim() ?? "";
  const potion = input.chosenPotion?.trim() ?? "";

  if (choices.length === 0 && finale === "" && potion === "") return "";

  const parts: string[] = [];
  if (choices.length > 0) {
    parts.push(
      "Before becoming a Beyonder, the character lived through these defining moments (earliest first):",
      ...choices.map((c) => `- ${c}`),
    );
  }
  if (finale !== "") {
    parts.push(
      `The encounter that changed everything: ${capWithEllipsis(finale, RECAP_FINALE_CHAR_CAP)}`,
    );
  }
  if (potion !== "") {
    parts.push(
      `They drank: ${potion} — not knowing what it was. The chronicle opens in the moments after, as the change takes hold.`,
    );
  }
  return parts.join("\n");
}

/**
 * Seed session memory for the manual character-creation path (no AI prologue).
 * Records only the character-created fact — the manual path has no prologue
 * scenes to recap.
 */
export function createPrologueMemory(
  characterName: string,
  background: string,
): MemoryState {
  const memory = createMemoryState();
  const fact: SessionFact = {
    type: "event",
    description: `Character created: ${characterName}${background ? `. Background: ${background}` : ""}`,
    turnNumber: 0,
  };
  return { ...memory, sessionFacts: [...memory.sessionFacts, fact] };
}
