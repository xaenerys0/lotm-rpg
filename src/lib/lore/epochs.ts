// ---------------------------------------------------------------------------
// Epoch starting points (issues #26, #29)
// ---------------------------------------------------------------------------
//
// Each epoch is effectively a different setting over shared mechanics. One
// entry per epoch: player-safe summary (character creation), a narrator tone
// directive (prompt assembly), a starting location and opening beat, and a
// danger modifier (earlier epochs are harsher worlds). The Fifth remains the
// default and the most fully furnished; the others are playable framings
// whose depth grows with the lore database.

export interface Epoch {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  era: string;
  /** Player-safe pitch shown at character creation. */
  summary: string;
  /** One narrator directive line: tone, vocabulary, power structures. */
  toneDirective: string;
  /** Where a new character wakes. */
  startingLocation: string;
  /** The first scene's seed action. */
  openingBeat: string;
  /** 1 = Fifth-Epoch baseline; higher = harsher world (horror scaling). */
  dangerModifier: number;
}

export const EPOCHS: readonly Epoch[] = [
  {
    id: 1,
    name: "First Epoch",
    era: "Age of Chaos",
    summary:
      "The pathways have only just differentiated. No churches, no law — power belongs to whoever survives drinking it.",
    toneDirective:
      "FIRST EPOCH tone: primal and lawless. No churches, no nations, no gas lamps — scattered settlements, raw wilderness, and Beyonders as walking calamities. Vocabulary is elemental and superstitious; power structures are warbands and lone monsters; technology is bronze and bone.",
    startingLocation: "a nameless settlement in the wild lands",
    openingBeat:
      "I wake in a settlement of hide tents at the edge of the wild lands, the taste of a crude potion still burning in my throat. Describe the opening scene and give me choices.",
    dangerModifier: 1.5,
  },
  {
    id: 2,
    name: "Second Epoch",
    era: "Dark Epoch",
    summary:
      "Ancient, inhuman gods rule openly. Humanity survives in their shadow — enslaved, hidden, or worse.",
    toneDirective:
      "SECOND EPOCH tone: oppression under inhuman rule. The old gods are REAL and present; humans are property, prey, or quiet rebels. Vocabulary is fearful and liturgical; power structures are inhuman courts and their overseers; hope is contraband.",
    startingLocation: "a human enclave beneath an inhuman dominion",
    openingBeat:
      "I keep my eyes down in the enclave as the overseers pass, hiding what I have just become. Describe the opening scene and give me choices.",
    dangerModifier: 1.6,
  },
  {
    id: 3,
    name: "Third Epoch",
    era: "Cataclysm Epoch",
    summary:
      "The Ancient Sun God rises and humanity revolts. A world of war-camps, crusades, and falling thrones.",
    toneDirective:
      "THIRD EPOCH tone: revolt and crusade. Humanity fights upward behind the Ancient Sun God's banner; the old order is burning. Vocabulary is martial and fervent; power structures are armies, prophets, and collapsing dominions.",
    startingLocation: "a war-camp of the uprising",
    openingBeat:
      "I stand at the edge of a war-camp at dawn, my first potion settling in my blood, the horns about to sound. Describe the opening scene and give me choices.",
    dangerModifier: 1.4,
  },
  {
    id: 4,
    name: "Fourth Epoch",
    era: "Epoch of the Gods",
    summary:
      "The Solomon Empire spans the continent and gods intervene in person. Divine politics decide mortal fates.",
    toneDirective:
      "FOURTH EPOCH tone: high divinity. Gods intervene visibly; the Solomon Empire administers miracles like taxes. Vocabulary is imperial and theological; power structures are divine courts, imperial bureaus, and angel-blooded houses.",
    startingLocation: "the outskirts of the Solomon Empire's capital",
    openingBeat:
      "I arrive at the capital's outskirts among pilgrims and petitioners, carrying a power I must not declare. Describe the opening scene and give me choices.",
    dangerModifier: 1.2,
  },
  {
    id: 5,
    name: "Fifth Epoch",
    era: "Iron Age",
    summary:
      "Steam, gaslight, and secrecy — the classic setting. The churches police the hidden world and Beyonders walk unseen.",
    toneDirective: "",
    startingLocation: "Tingen City",
    openingBeat:
      "The strange potion still burns on my tongue as I move through Tingen City's gaslit fog, certain of only one thing: whatever I have just become, I must keep it hidden. Describe the opening scene and give me choices.",
    dangerModifier: 1,
  },
] as const;

export const DEFAULT_EPOCH_ID = 5;

export function getEpoch(id: number | undefined): Epoch {
  return EPOCHS.find((epoch) => epoch.id === id) ?? EPOCHS[4];
}

/** Narrator directive for the epoch; empty for the Fifth (the baseline). */
export function epochNarrationDirective(epochId: number | undefined): string | null {
  const directive = getEpoch(epochId).toneDirective;
  return directive === "" ? null : directive;
}

/**
 * The opening player action for a fresh character in this epoch. Every epoch —
 * including the Fifth — now seeds the first turn with an "awakening" beat that
 * continues directly from the prologue's final moment (drinking the potion),
 * so the chronicle never opens by abruptly announcing the character's pathway.
 * Returns null only for the (impossible) empty-beat case, leaving the game
 * loop's generic fallback as defence in depth.
 */
export function epochOpeningBeat(epochId: number | undefined): string | null {
  const beat = getEpoch(epochId).openingBeat;
  return beat === "" ? null : beat;
}

/**
 * The epoch content gate (issue: character epoch isolation). Untagged entries
 * are universal — shared Beyonder mechanics that hold in every era — and always
 * pass. A tagged entry passes only for a character of that exact epoch, so no
 * Fifth-Epoch city, faction, or chunk ever reaches a First-Epoch character (and
 * vice versa). An absent character epoch defaults to the Fifth
 * ({@link DEFAULT_EPOCH_ID}). Mirrors the timeline gate's "timeless rows always
 * pass" semantics so the SQL gate, the client RAG filter, curated selection,
 * and the glossary all share one rule.
 */
export function passesEpochGate(
  entryEpoch: number | null | undefined,
  characterEpoch: number | null | undefined,
): boolean {
  if (entryEpoch === null || entryEpoch === undefined) return true; // universal
  return entryEpoch === (characterEpoch ?? DEFAULT_EPOCH_ID);
}
