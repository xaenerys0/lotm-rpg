import { createMemoryState, capWithEllipsis } from "@/lib/ai";
import type { MemoryState, SessionFact } from "@/lib/ai";

export interface PathwayScore {
  pathwayId: number;
  score: number;
}

// Pathway ids 1–22. 1=Fool, 2=Visionary, 3=Sun, 4=Death, 5=Darkness,
// 6=Tyrant/Sailor, 7=Door/Apprentice, 8=Error/Marauder, 9=Hanged Man/Secrets
// Suppliant, 10=White Tower/Reader, 11=Twilight Giant/Warrior, 12=Justiciar/
// Arbiter, 13=Black Emperor/Lawyer, 14=Red Priest/Hunter, 15=Demoness/Assassin,
// 16=Mother/Planter, 17=Moon/Apothecary, 18=Hermit/Mystery Pryer, 19=Paragon/
// Savant, 20=Wheel of Fortune/Monster, 21=Abyss/Criminal, 22=Chained/Prisoner.
// All 22 are playable: each has a Seq-9 becoming scene + heading below, and the
// rules engine carries full Seq 9→1 recipes/abilities for every one.
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
  10: "The First Page",
  11: "The First Blood",
  12: "The First Verdict",
  13: "The First Argument",
  14: "The First Hunt",
  15: "The First Cut",
  16: "The First Seed",
  17: "The First Draught",
  18: "The First Mystery",
  19: "The First Insight",
  20: "The First Omen",
  21: "The First Sin",
  22: "The First Chain",
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
  // ── Pathways 10–22 (issue #120). The Seq-9 potion ingredients of these
  // pathways are NOT specified in canon, so these scenes name no fabricated
  // recipe; each is grounded in the pathway's canon Sequence-9 abilities and
  // documented nature (the becoming-sensation), corpus-verified, never invented.
  10: `The Reader potion is dark and still, the colour of strong tea gone cold, and it gives off the dry smell of old paper and binding-glue. You have measured the formula with a scholar's exactness — precision, you already sense, is half of this path — and you drink.\n\nThe cold settles behind your eyes rather than in your blood. The room does not change, but your grasp of it sharpens to a point: the titles on the spines across the way resolve themselves, and you realise you have already read, filed, and cross-referenced them without trying. A column of figures you glanced at an hour ago returns to you entire. Connections assemble on their own — and beneath the new clarity stirs something stranger, a sense that certain words, set in a certain order, would reach out and touch the world itself.\n\nYou set down the glass. Your mind has become a sharper, quieter instrument, and a far harder one to deceive.\n\nYou are a Reader now. Knowledge, you are beginning to understand, is the first power — and it has only begun to come to you.`,
  11: `The Warrior potion is thick and dark, almost the red-black of clotted blood, and it is warm in the glass as though it remembers a living body. There is iron in its smell. You steady yourself and drink, and the warmth goes down like swallowed coals.\n\nIt reaches your limbs and they answer. Your heartbeat slows and deepens; the ache of the day's labour simply leaves you. When you close your hand you feel, with quiet astonishment, that it could close on an iron bar and bend it — that the floor would crack before your stride did. Something older than you has woken in the marrow: the blood of giants, running strong, lending a strength and a sureness no unchanged man owns. Only the faintest hum of the mystical comes with it; this gift is of the body.\n\nYou set down the glass and feel the new power idling in you like a banked fire.\n\nYou are a Warrior now. The blood of giants is in you, and it is only beginning to wake.`,
  12: `The Arbiter potion is pale gold and clear as judgement, and it sits perfectly level in the glass however your hand shakes. It smells faintly of hot brass and clean stone. You drink, and a cool steadiness spreads through you.\n\nYour body answers first — your senses widen, your reflexes draw taut, and a balanced, unhurried strength settles into your frame. But the deeper change is in your bearing. When you speak the next words aloud, idle as they are, you hear a new weight ride beneath them, a quiet authority that expects to be believed and obeyed. You understand, with sudden clarity, where a thing is in its right place and where it has stepped out of line — and that part of you now means to set it right.\n\nYou set down the glass and the room seems to arrange itself around your stillness.\n\nYou are an Arbiter now. Order, you are beginning to understand, is not kept by force alone but by the will of one who can command it.`,
  13: `The Black Emperor potion is ink-dark and faintly bitter, and it clings to the glass like a contract that will not be torn up. You drink, and the bitterness sharpens not your hands but your tongue and your judgement.\n\nNothing in the room moves, yet everything in it seems suddenly negotiable. The argument you lost yesterday rearranges itself in your mind, and you see the three turns of phrase that would have won it. You sense the seams in things — the loophole in a rule, the unspoken weakness in a man's position, the exact word that would turn a listener from doubt to agreement. Speech has become a tool with an edge, and you have just felt that edge for the first time.\n\nYou set down the glass, already composing the sentence that would make someone believe whatever you needed them to.\n\nYou are a Lawyer now. The rules that bind other men, you are beginning to understand, are to you a set of locks — and you have been handed the keys.`,
  14: `The Hunter potion is rust-red and restless, and it smells of cold forest and old blood. You drink, and your nerves catch like struck flint.\n\nYour body wakes to a sharper pitch — muscle and reflex and the quiet promise of wounds that will close fast. But it is your senses that astonish you: the room floods with information you never had words for, the scent of rain on the air two streets off, a heartbeat through a wall, the grain of every small sound. And beneath it, newest and strangest, a thread of warning that tightens before your thoughts catch up — a flat certainty, when your eyes pass the dark window, that something out there could mean you harm. You would know it was coming before it came.\n\nYou set down the glass, every sense leaning outward into the night.\n\nYou are a Hunter now. The world has become a country of scents and signs and quarry, and you, you are beginning to understand, were made to track it.`,
  15: `The Assassin potion is black as a shuttered room and gives off almost no smell at all, as though it means not to be noticed. You drink, and a weightless cold pours through you.\n\nThe shadows in the corners of the room deepen, and you feel them lean toward you — kin, now, willing to fold you out of sight. Your body has changed to match: lighter, quicker, balanced on the balls of your feet without your deciding it, so that a step from the windowsill would carry you down soft as a settling leaf. And coiled beneath the lightness is its opposite, a single sudden violence you could spend all at once — one blow with everything behind it. You move, and the floorboards do not betray you.\n\nYou set down the glass in a silence that now belongs to you.\n\nYou are an Assassin now. The dark, you are beginning to understand, is not a place to hide so much as a thing that has agreed to carry you.`,
  16: `The Planter potion is the deep green of turned earth after rain, cloudy with sediment, and it smells of loam and growing things. You drink, and a slow, rooted strength rises through you.\n\nYour body firms — a labourer's strength, but easy now, tireless. Your hands, when you flex them, seem to know things they did not: the heft of a good seed against a barren one, the moment soil is ready to take it, the care a living thing needs to be coaxed up out of the ground. You glance through the window at the night sky and read tomorrow's weather in the set of the clouds and the smell of the wind, plain as words on a page. The world has turned from something you live on into something you can tend.\n\nYou set down the glass, and the smell of green stays with you.\n\nYou are a Planter now. Life, you are beginning to understand, answers those who know how to make it grow.`,
  17: `The Apothecary potion is silver-pale and faintly luminous, like moonlight strained through milk, and it smells of crushed herbs and something animal beneath. You drink, and a cool clarity spreads outward, settling at last behind your eyes.\n\nYour body sharpens a little — but the change is mostly in your hands and your knowing. You look at the dried sprigs and oddments on your shelf and understand, without being taught, how this leaf and that gland and a measure of spirit could be ground and steeped into a draught to close a wound or break a fever. You sense, too, that a wary animal would gentle under your hand, and that your spirit has opened a fraction toward the unseen. The night outside seems less a darkness than a dispensary of quiet, useful things.\n\nYou set down the glass, already cataloguing remedies you did not know an hour ago.\n\nYou are an Apothecary now. The moon's pharmacy, you are beginning to understand, has just been opened to you.`,
  18: `The Mystery Pryer potion is a murky grey-violet that never quite settles, and it smells of cold candle-smoke and turned pages. You drink, and a prickling cold climbs the back of your skull.\n\nYour eyes change first. The dim room is suddenly crowded with faint things you could not see a moment ago — a residue clinging to an old keepsake, a thin seam in the air by the door where something once passed through. And your mind will not sit still: knowledge arrives in it unbidden, scraps of rite and sign and half-named law, as though some patient voice were murmuring lessons just below hearing. It is a gift and a danger both, you sense — that whispering does not always mean kindness.\n\nYou set down the glass, and the things at the edges of your sight do not look away.\n\nYou are a Mystery Pryer now. The hidden world, you are beginning to understand, is not behind a wall but all around you — and now it is looking back.`,
  19: `The Savant potion is clear and faintly metallic, with a thin glitter suspended in it like filings in oil, and it smells of hot brass and ozone. You drink, and a bright cold floods straight to the front of your mind.\n\nNothing in the room moves, yet your understanding of it deepens all at once: the workings of the lamp, the logic of the lock, the half-grasped principle behind a mechanism you only ever used become suddenly transparent, mysticism and machinery alike laid open to you. And as you blink, you realise you have forgotten nothing — the page you read this morning is there entire, every word in place, recalled the instant you reach for it. Knowledge has stopped being something you gather and become something you simply have.\n\nYou set down the glass, your thoughts ordered and lit like a workshop at noon.\n\nYou are a Savant now. Knowledge is power, you are beginning to understand — and you have just been made its vessel.`,
  20: `The Monster potion shifts colour as it moves, never the same twice, and it smells of nothing you can name. Your hand hesitates over it for no reason you can give — and that, you will later think, was the first sign. You drink.\n\nThe change is in the air itself, or in your sense of it. The room hums with a meaning it did not have: you feel, before you hear it, the cart that will pass in the street; you know, without knowing how, which of two doors you must not open tonight. A pressure builds and eases behind your eyes like a tide, and through it run flickers of things not yet happened, gone before you can hold them. Luck and ruin both feel suddenly close enough to touch.\n\nYou set down the glass, and the back of your neck will not stop prickling.\n\nYou are a Monster now. Fate, you are beginning to understand, has stopped being a thing that happens to you and become a thing you can almost see coming.`,
  21: `The Criminal potion is a sullen, oily dark, and it smells of iron and something gone sour. You drink, and it burns going down — a heat that does not fade but settles, becoming part of you.\n\nYour body answers with a hard new vigour: muscle that did not tire, instincts that woke fast and mean, a constitution toughened past anything an ordinary life would build. The hungers in you sharpen with it — the want of things, the readiness to take them, the cold ease of a conscience that has learned to look away. There is strength here, and there is the first cold draught of the abyss the strength is drawn from, and you cannot have the one without tasting the other.\n\nYou set down the glass, your pulse slow and your appetites awake.\n\nYou are a Criminal now. The abyss, you are beginning to understand, gives generously — and keeps a ledger of every gift.`,
  22: `The Prisoner potion is grey and heavy, the colour of wet stone, and it tastes of iron and cold water. You drink, and a weight settles over you like a chain drawn snug.\n\nYour body hardens — strong, keenly sensed, a stillness in your face over something far less still beneath. And into your mind comes a strange, specific competence: the knowledge of locks and walls and watchers, of how a man is held and how a man slips free, as though you had served a dozen sentences and broken out of each. Yet the same moment binds you: you feel your own spirit and your own wild wants drawn taut and held in check, reined by reason, by your body, by the unseen rule of the world itself. Restraint and the will to break it tighten against each other in you, and the tension is your new strength.\n\nYou set down the glass, and the chain you cannot see does not loosen.\n\nYou are a Prisoner now. Every chain, you are beginning to understand — even the one laid on your own heart — is also a thing that can be picked.`,
};

// One-line manual-card blurb per pathway (issue #120). Format: the canon
// Sequence 9 / 8 / 7 names (corpus-verified, from sequence-names-canon.ts) plus
// a short theme grounded in the pathway's documented nature. Consumed by the
// character-creation manual cards; centralized here with the other two
// pathway-keyed content maps so all three cover the full 1–22 id set and share
// one data-integrity test.
export const PATHWAY_DESCRIPTIONS: Readonly<Record<number, string>> = {
  1: "Seer, Clown, Magician — divination and hidden knowledge",
  2: "Spectator, Telepathist, Psychiatrist — mind and imagination",
  3: "Bard, Light Suppliant, Solar High Priest — radiance and healing",
  4: "Corpse Collector, Gravedigger, Spirit Medium — spirits and the dead",
  5: "Sleepless, Midnight Poet, Nightmare — night, dreams, and concealment",
  6: "Sailor, Folk of Rage, Seafarer — sea, storm, and wrath",
  7: "Apprentice, Trickmaster, Astrologer — travel, doors, and space",
  8: "Marauder, Swindler, Cryptologist — theft, trickery, and secrets",
  9: "Secrets Suppliant, Listener, Shadow Ascetic — sacrifice, shadow, and taboo",
  10: "Reader, Student of Ratiocination, Detective — knowledge, reason, and ritual",
  11: "Warrior, Pugilist, Weapon Master — giant blood, strength, and battle",
  12: "Arbiter, Sheriff, Interrogator — authority, law, and order",
  13: "Lawyer, Barbarian, Briber — eloquence, leverage, and the loophole",
  14: "Hunter, Provoker, Pyromaniac — the hunt, the senses, and fire",
  15: "Assassin, Instigator, Witch — shadow, the blade, and calamity",
  16: "Planter, Doctor, Harvest Priest — growth, healing, and the land",
  17: "Apothecary, Beast Tamer, Vampire — medicine, taming, and the moon",
  18: "Mystery Pryer, Melee Scholar, Warlock — hidden sight, witchcraft, and forbidden lore",
  19: "Savant, Archaeologist, Appraiser — knowledge, memory, and machinery",
  20: "Monster, Robot, Lucky One — fortune, foresight, and fate",
  21: "Criminal, Unwinged Angel, Serial Killer — the abyss, corruption, and sin",
  22: "Prisoner, Lunatic, Werewolf — restraint, madness, and the chain",
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
