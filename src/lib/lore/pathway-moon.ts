import type { LoreEntry } from "./types";

export const MOON_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "moon-pathway-overview",
    title: "Moon Pathway — Overview",
    category: "pathway",
    content: `The Moon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Goddess of Origin group of pathways. Its Beyonders walk the road of potions, beast-taming, vampirism, and the blood of the scarlet moon. From the lowest rung its sequences progress Apothecary (Sequence 9), Beast Tamer (8), Vampire (7), Potions Professor (6), and Scarlet Scholar (Sequence 5); its Saint and demigod rungs continue Shaman King (Sequence 4), High Summoner (3), Life-Giver (2), and Beauty Goddess (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Moon (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "moon",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["moon-pathway", "life-group", "overview"],
    tokenCount: 217,
  },
  {
    slug: "moon-seq4-shaman-king",
    title: "Moon Pathway — Sequence 4: Shaman King",
    category: "pathway",
    content: `The Shaman King is the Saint threshold of the Moon pathway, where the scarlet moon's blood magic matures into command over beasts, spirits, and life force. A Shaman King can perform the Blood Rite, sacrificing vitality to heal others, curse enemies, or empower allies through mystical ties. They gain Beast Sovereignty, calling and commanding a host of animals and low spirits to fight, scout, or serve as the moonlight allows. Their Lunar Veil wraps them in shimmering red light that speeds regeneration and turns aside minor attacks. The Shaman King also practices Life Drain, pulling vitality from the land or a victim to sustain themselves — a power that blurs the line between healer and predator. The potion requires two main ingredients — the heart of a High Summoner and a chalice of Sanguine blood from an Earl's lineage — and three supplementary ingredients: a beast fang bathed in scarlet moonlight, a root from a grave that bloomed at night, and the shed skin of a Life-Giver. The advancement ritual demands binding a spirit-beast of at least Sequence 5 to service through a blood contract sworn under the full scarlet moon. The acting method requires the Shaman King to honor the balance between giving life and taking it, to treat the Sanguine traditions with respect even when rejecting them, and to remember that the Moon pathway's healing is never truly free. At Sequence 4 the Moon pathway practitioner becomes a sovereign of blood and beast, and the Sanguine Ancestor's descendants take careful notice.`,
    pathway: "moon",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: ["moon-pathway", "shaman-king", "saint-threshold", "blood-magic", "beasts"],
    tokenCount: 295,
    narratorOnly: true,
  },
];
