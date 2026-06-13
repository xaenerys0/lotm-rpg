import type { LoreEntry } from "./types";

// Second Epoch — the Dark Epoch (issue: character epoch isolation). Canon-
// grounded from the LOTM wiki (Second Epoch, Ancient Gods, Survivors, Giant
// King's Court pages). The factional/divine history is well-attested canon;
// human daily-life texture under enslavement is thin and extrapolated.

export const SECOND_EPOCH_LORE: LoreEntry[] = [
  {
    slug: "second-epoch-overview",
    title: "Second Epoch — The Dark Epoch",
    category: "metaphysics",
    content: `The Second Epoch, humanity's Dark Epoch, is the age of the Ancient Gods. As the chaos of the first age settled, the surviving Beyonder races purified, gained reason, and built civilizations — and eight monstrous-but-rational Ancient Gods rose to divide rule over sky, ocean, land, the Spirit World, and the Astral World. Humanity is not the master of this world but its underclass: subordinate to, and often enslaved by, the dominant humanoid races — the Giants, the Elves, and the Sanguines. To be a human Beyonder in this age is doubly dangerous: power marks you, and a slave with power is a thing to be collared or destroyed. The mood is oppression and hidden defiance; hope itself is contraband. The epoch's long night ends only when a human survivor begins, impossibly, to kill gods.`,
    epoch: 2,
    npcs: [],
    sequences: [],
    tags: ["epoch", "dark-epoch", "world-setting", "history", "ancient-gods"],
    tokenCount: 215,
    narratorOnly: false,
  },
  {
    slug: "second-epoch-society",
    title: "Second Epoch — Life Under the Gods",
    category: "metaphysics",
    content: `Human life in the Dark Epoch is lived in the shadow of inhuman masters. Most humans exist as property or prey of the Giants, Elves, and Sanguines — labor for their works, tribute for their courts, or cattle for the vampires' thirst. Humans cluster in enclaves and slave-quarters at the margins of the great non-human realms, governed by overseers who answer to inhuman lords. Daily life is fear, obedience, and the small rebellions of those with nothing left to lose: a hidden shrine, a smuggled scrap of forbidden formula, a whispered story that humanity was not always meant to kneel. A Beyonder hiding among the enclaves keeps their eyes down and their power secret, for the overseers watch for exactly that spark. Survival means invisibility; defiance means a careful, patient conspiracy, never an open one.`,
    epoch: 2,
    npcs: [],
    sequences: [],
    tags: ["society", "daily-life", "slavery", "world-setting"],
    tokenCount: 200,
    narratorOnly: false,
  },
  {
    slug: "second-epoch-ancient-gods",
    title: "Second Epoch — The Eight Ancient Gods",
    category: "metaphysics",
    content: `Eight Ancient Gods rule the Dark Epoch, split into rival blocs. The humanoid bloc is led by the Giant King Aurmir, the Elf King Soniathrym, and the Sanguine Ancestor Lilith — the powers whose races hold humanity in bondage. The non-human bloc gathers the Dragon of Imagination Ankewelt, the Phoenix Ancestor Gregrace, and the Mutated King Kvastir. Apart from both stand the chaos-aligned independents — the Devil Monarch Farbauti and the Annihilation Demonic Wolf Flegrea — who seek to subvert all order and corrupt all life. Their wars and bargains decide the fate of every lesser thing beneath them, humanity included. Near the epoch's close a human survivor, Grisha Adam, will manipulate the First Blasphemy Slate to surface the divine pathway formulas — the seed of the codified potion-and-ritual system that defines every later age. Narrator: a human of this age knows these gods as feared names and overlords, not as a tidy pantheon.`,
    epoch: 2,
    npcs: [],
    sequences: [],
    tags: ["powers", "ancient-gods", "factions", "history"],
    tokenCount: 235,
    narratorOnly: true,
  },
  {
    slug: "second-epoch-enclave",
    title: "Second Epoch — The Human Enclave",
    category: "location",
    content: `A human enclave in the Dark Epoch is a walled-off quarter, work-camp, or warren tolerated at the edge of an inhuman dominion — a giant's holding, an elven forest-realm, or a sanguine city. Within its bounds humans live packed and watched: mud-and-timber dwellings, communal labor sheds, a market of scraps, and always the overseers' hall from which the masters' will is enforced. Beyond the enclave lies the dominion proper — architecture built for beings far larger or stranger than people, where a human walks only on an errand and never freely. The great courts of the gods, such as Aurmir's Giant King's Court, are spoken of in the enclaves the way mortals speak of weather and judgment: distant, absolute, and not to be appealed. An enclave's unwritten law is simple — keep the masters satisfied, keep the dangerous ones hidden, and survive to the next dawn.`,
    epoch: 2,
    city: "human",
    npcs: [],
    sequences: [],
    tags: ["geography", "enclave", "setting"],
    tokenCount: 215,
    narratorOnly: false,
  },
];
