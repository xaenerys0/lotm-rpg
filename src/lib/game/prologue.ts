import { createMemoryState } from "@/lib/ai";
import type { MemoryState, SessionFact } from "@/lib/ai";

export interface PrologueChoice {
  id: string;
  text: string;
  affinities: Readonly<Record<number, number>>;
}

export interface PrologueScene {
  id: string;
  title: string;
  setting: string;
  narrative: string;
  choices: PrologueChoice[];
}

export interface PrologueSelection {
  sceneId: string;
  choiceId: string;
}

export interface PathwayScore {
  pathwayId: number;
  score: number;
}

export interface PrologueRecommendation {
  pathwayId: number;
  score: number;
  maxPossible: number;
  justification: string;
}

export interface PrologueState {
  currentScene: number;
  selections: PrologueSelection[];
  isComplete: boolean;
}

// Pathway IDs: 1=Fool, 2=Visionary, 3=Sun, 4=Death
export const PROLOGUE_SCENES: readonly PrologueScene[] = [
  {
    id: "scene-1",
    title: "The Widow's Misfortune",
    setting: "Tingen City Market District, Early Autumn",
    narrative:
      "A cold autumn morning in Tingen City. The market district hums with commerce — coal smoke drifting from factory chimneys, vendors crying their wares, the distant clank of a steam tram. You have paused at a pie stall when you witness it: a nimble-fingered youth in a grey coat lifts a small purse from an elderly widow's shawl pocket. The old woman is still counting out coins for a loaf of bread. The thief has already begun to walk away.",
    choices: [
      {
        id: "s1-fool",
        text: "Follow the thief at a distance. He didn't act alone — someone is directing these young pickpockets.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s1-sun",
        text: "Call out and plant yourself in the thief's path. The widow needs her money back.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s1-visionary",
        text: "Go to the widow first. She looks frightened and confused — that matters more right now.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s1-death",
        text: "Study the thief's face. His eyes are sunken and empty — the look of someone haunted, or hollow.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-2",
    title: "The Sealed Basement",
    setting: "An Abandoned Warehouse, East Tingen",
    narrative:
      "You have taken a shortcut through a derelict industrial block when you notice it: a heavy iron door set flush with the ground, secured by a padlock as large as your fist. A faint smell — chemical, with something organic beneath it — seeps through the gap. Whatever is stored here, the owners do not want it found. The street is empty. No one will see what you do next.",
    choices: [
      {
        id: "s2-fool",
        text: "Examine the lock and the hinges. Patterns in the rust and scratch marks reveal when this was last used.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s2-sun",
        text: "If someone is trapped down there, waiting is not an option. You look for something to break the padlock.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s2-visionary",
        text: "Press your ear to the door and hold very still. Beneath the chemical smell — yes. A soft, rhythmic sound.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s2-death",
        text: "The smell reminds you of something you once encountered at a mortuary. You have learned to recognise the dead.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-3",
    title: "The Veteran's Orders",
    setting: "The Iron Anchor Tavern, Dockside District",
    narrative:
      "Rain drums against the tavern windows. A soldier sits across the room, alone with a pewter mug and a letter bearing an unfamiliar seal. His hands shake, though not from the cold. He reads the letter again. And again. The regulars ignore him — they know better than to notice an officer reading orders in a place like this. But you notice. And you notice that the seal is not one issued by the Loen military.",
    choices: [
      {
        id: "s3-fool",
        text: "Watch him. His reactions tell you more than the letter ever could. Who gave him this, and why does it frighten him?",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s3-sun",
        text: "Move to his table. Whatever he is facing, he should not face it without someone at his side.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s3-visionary",
        text: "Catch his eye for a moment — a steady, unhurried look. You want him to know someone sees him.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s3-death",
        text: "You find yourself wondering — if those orders lead him somewhere fatal, what will remain of him afterward?",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
  {
    id: "scene-4",
    title: "The Old Book",
    setting: "Falser's Second-Hand Books, Upper Tingen",
    narrative:
      "A browsing afternoon turns strange when a waterlogged volume slides from an overpacked shelf and falls open at your feet. The pages show a circular diagram — geometric lines radiating from a central symbol you cannot quite focus on. The ink is faded brown, but the central glyph seems to absorb light rather than reflect it. The bookseller doesn't notice. The diagram looks like something drawn by a very careful, very frightened person.",
    choices: [
      {
        id: "s4-fool",
        text: "Copy the diagram into your notebook before touching anything else. You have a feeling you should not close this book.",
        affinities: { 1: 2, 2: 0, 3: 0, 4: 0 },
      },
      {
        id: "s4-sun",
        text: "Bring it to the counter immediately. This is not something for idle hands — the bookseller should know.",
        affinities: { 1: 0, 2: 0, 3: 2, 4: 0 },
      },
      {
        id: "s4-visionary",
        text: "Place your hand on the page without thinking. The paper feels faintly warm, like a palm pressed flat just a moment ago.",
        affinities: { 1: 0, 2: 2, 3: 0, 4: 0 },
      },
      {
        id: "s4-death",
        text: "The central glyph reminds you of runes you saw carved on a grave marker in Old Tingen cemetery, years ago.",
        affinities: { 1: 0, 2: 0, 3: 0, 4: 2 },
      },
    ],
  },
] as const;

export const PATHWAY_JUSTIFICATIONS: Readonly<Record<number, string>> = {
  1: "Your instinct is to observe before you act — to see the shape of a thing before naming it. You are drawn to patterns hidden beneath the surface, to questions that most people don't think to ask. The Fool pathway calls to those who prefer the long view, who understand that knowledge carefully gathered is its own form of power.",
  2: "You read people the way others read books. Before intellect or action, you reach for understanding — of what a person feels, of what they fear, of what they carry. The Visionary pathway calls to those who believe the world is moved more by the weight of inner lives than by any physical force.",
  3: "When something is wrong, you act. Not recklessly — but with a clear sense that standing by is itself a choice, and not one you're willing to make. The Sun pathway calls to those who carry a light inside them, who protect without being asked, who know that courage is ordinary kindness made extraordinary by circumstance.",
  4: "You see the edges others avoid. You notice when someone is hollow-eyed, when a smell carries the wrong weight, when stillness is not peace but absence. The Death pathway calls to those who look unflinching at what lies beneath the surface of living — curious, rather than afraid, about what persists when the rest is gone.",
};

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

export function scoreSelections(selections: PrologueSelection[]): PathwayScore[] {
  const totals: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const selection of selections) {
    const scene = PROLOGUE_SCENES.find((s) => s.id === selection.sceneId);
    if (!scene) continue;
    const choice = scene.choices.find((c) => c.id === selection.choiceId);
    if (!choice) continue;
    for (const [idStr, score] of Object.entries(choice.affinities)) {
      const pathwayId = Number(idStr);
      totals[pathwayId] = (totals[pathwayId] ?? 0) + score;
    }
  }

  return Object.entries(totals)
    .map(([id, score]) => ({ pathwayId: Number(id), score }))
    .sort((a, b) => b.score - a.score);
}

// ───────────────────────────────────────────────────────────────────────────
// Generic, deterministic affinity tallying (issue #53)
//
// These helpers are generic over ANY set of pathway ids — they never assume
// "4". They power the live AI-prologue decision: the AI only narrates and tags
// choices with affinity weights; the engine accumulates those weights here and
// computes the candidate set the player picks from. Scales unchanged from the 4
// pathways shipped today to the full 22 later.
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

export function recommendPathway(
  selections: PrologueSelection[],
): PrologueRecommendation {
  const tally: Record<number, number> = {};
  for (const { pathwayId, score } of scoreSelections(selections)) {
    tally[pathwayId] = score;
  }
  const top = rankPathways(tally)[0];
  const maxPossible = PROLOGUE_SCENES.length * 2;
  // De-biased: with no affinity signal at all, refuse to default to a specific
  // pathway (the old code hardcoded Seer/pathway 1 here). pathwayId 0 == none.
  if (!top || top.score === 0) {
    return { pathwayId: 0, score: 0, maxPossible, justification: "" };
  }
  return {
    pathwayId: top.pathwayId,
    score: top.score,
    maxPossible,
    justification: PATHWAY_JUSTIFICATIONS[top.pathwayId] ?? "",
  };
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

export function createPrologueState(): PrologueState {
  return {
    currentScene: 0,
    selections: [],
    isComplete: false,
  };
}

export function createPrologueMemory(
  selections: PrologueSelection[],
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
    ...(selections.length > 0
      ? [
          {
            type: "event" as const,
            description: `Completed the Beyonder prologue. Narrative choices revealed ${selections.length} defining moments.`,
            turnNumber: 0,
          },
        ]
      : []),
    ...selections.map((sel): SessionFact => {
      const scene = PROLOGUE_SCENES.find((s) => s.id === sel.sceneId);
      const choice = scene?.choices.find((c) => c.id === sel.choiceId);
      return {
        type: "event",
        description: `Prologue — "${scene?.title ?? sel.sceneId}": ${choice?.text ?? sel.choiceId}`,
        turnNumber: 0,
      };
    }),
  ];

  return { ...memory, sessionFacts: [...memory.sessionFacts, ...facts] };
}
