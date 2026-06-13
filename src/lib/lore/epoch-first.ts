import type { LoreEntry } from "./types";

// First Epoch — the Age of Chaos (issue: character epoch isolation). Canon-
// grounded from the LOTM wiki (First Epoch, Original Creator, Zedus, Ancient
// Gods pages); daily-life/settlement texture is thin in canon and extrapolated
// in that spirit. The "metaphysics" entries are the epoch's setting overview and
// are injected by curated selection for First-Epoch characters; the "location"
// entries surface in the gazetteer and on discovery.

export const FIRST_EPOCH_LORE: LoreEntry[] = [
  {
    slug: "first-epoch-overview",
    title: "First Epoch — The Age of Chaos",
    category: "metaphysics",
    content: `The First Epoch, the Age of Chaos, is the world's lawless dawn. It began when the Original Creator — a primordial, maddened will asleep deep within the earth — awoke, convulsed under the warring concepts and authorities it contained, and tore itself apart. Its shattered Beyonder Characteristics scattered across the world and were absorbed by humans, beasts, and surviving things, igniting an age of monstrous mutation. There are no nations, no churches, no written law and no codified pathways — only raw, half-understood power and the long, dark struggle of the survivors to claw back some sliver of reason. Beyonders here are not secret operatives but walking calamities; a single mutated being can unmake a settlement. Knowledge is oral, superstition is survival, and to drink an unknown power is as likely to twist you into a beast as to save you. The epoch closes only when the first true wills claw their way toward godhood out of the madness.`,
    epoch: 1,
    npcs: [],
    sequences: [],
    tags: ["epoch", "age-of-chaos", "world-setting", "history"],
    tokenCount: 230,
    narratorOnly: false,
  },
  {
    slug: "first-epoch-survival",
    title: "First Epoch — Survival and Society",
    category: "metaphysics",
    content: `There is no civilization in the Age of Chaos worthy of the name — only survival. Humanity, nearly annihilated by the cataclysm and the mutated giants and beasts that followed, clings on in scattered, isolated enclaves: caves, hide-tent camps, and crude stockades hidden in defensible wilderness. Status is decided by raw power and usefulness, not birth or wealth; there is no coin, only barter and the protection of whoever is strongest. Bands gather around a powerful Beyonder or a shaman who can read the omens, and such warbands rise and shatter as quickly as their leaders do. Tools are bronze, bone, flint, and hide; fire and a defensible cave are luxuries. Outsiders are met with spears first. The dominant moods are dread and exhaustion — the constant awareness that the dark beyond the firelight is full of things that were once human, and worse things that never were.`,
    epoch: 1,
    npcs: [],
    sequences: [],
    tags: ["society", "daily-life", "survival", "world-setting"],
    tokenCount: 220,
    narratorOnly: false,
  },
  {
    slug: "first-epoch-mutated-races",
    title: "First Epoch — The Mutated Races and the First Gods",
    category: "metaphysics",
    content: `When the Original Creator self-destructed, its dismembered body and scattered Characteristics seeded the world's monstrous races: giants, elves, treants, dragons, feathered serpents, phoenixes, demonic wolves, naga, sea monsters, and twisted mutants. In the beginning these were bloodthirsty and mad; only slowly did some claw back rationality and the first crude cultures. From this chaos the first true wills rose toward godhood — and the epoch ends with the death of Zedus, slain (with Aurmir's aid) to forestall the Moon Pathway's summoning authority dragging a still-greater horror onto the world, and with Aurmir's ascension as the first Ancient God. Their rise begins the slow deterioration of the Astral Barrier that walls the world from outer terrors. Narrator: treat named figures and the divine machinery as deep background a First-Epoch survivor would know only as terrifying rumor, not history.`,
    epoch: 1,
    npcs: [],
    sequences: [],
    tags: ["powers", "beyonder-races", "ancient-gods", "history"],
    tokenCount: 215,
    narratorOnly: true,
  },
  {
    slug: "first-epoch-wild-lands",
    title: "First Epoch — The Wild Lands",
    category: "location",
    content: `The wild lands are everywhere and nowhere — an unmapped, monster-haunted expanse of primeval forest, ash-plains, and broken country where the cataclysm's scars still smoke. There are no roads, no borders, and no names that outlast the people who coin them; a "place" is a defensible cave, a river ford, a hunting ground, or the camp of a warband, and all of them are temporary. Travel is deadly: the open ground between enclaves belongs to mutated beasts and the things that were once people. Somewhere to the west lies a far greater wound — a stretch of the world the Celestial Worthy is said to have sealed away behind a wall of gray fog, locking part of all power inside it. The survivors who endure here learn to read the land like scripture: which water is safe, which silence means a predator, which ruins to never enter after dark.`,
    epoch: 1,
    city: "wild",
    npcs: [],
    sequences: [],
    tags: ["geography", "wild-lands", "setting"],
    tokenCount: 215,
    narratorOnly: false,
  },
];
