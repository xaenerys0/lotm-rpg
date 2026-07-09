import type { LoreEntry } from "./types";

export const DEMONESS_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "demoness-pathway-overview",
    title: "Demoness Pathway — Overview",
    category: "pathway",
    content: `The Demoness pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of assassination, temptation, witchcraft, and affliction. From the lowest rung its sequences progress Assassin (Sequence 9), Instigator (8), Witch (7), Pleasure (6), and Affliction (Sequence 5); its Saint and demigod rungs continue Despair (Sequence 4), Unaging (3), Catastrophe (2), and Apocalypse (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Demoness (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "demoness",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["demoness-pathway", "combat-group", "overview"],
    tokenCount: 216,
  },
  {
    slug: "demoness-seq4-despair",
    title: "Demoness Pathway — Sequence 4: Despair",
    category: "pathway",
    content: `The Despair is the Saint threshold of the Demoness pathway, the rung where the pathway's gender lock fixes the practitioner as female and suffering becomes both weapon and art. A Despair can radiate the Aura of Despair, a cold, clinging hopelessness that slows enemies, weakens their will to fight, and can drive ordinary mortals to surrender or self-harm. They weave the Threads of Misfortune, cursing a target so that small accidents compound into lethal disaster over hours or days. Their touch carries the Kiss of Frost, freezing blood and desire alike, and they gain the Mask of Beauty, a supernatural allure that conceals their true nature and makes commands feel like invitations. The potion requires two main ingredients — the frozen heart of a Catastrophe and a tear shed by someone who died of grief — and three supplementary ingredients: black ice from a mountain cursed by witches, a lock of hair from a woman who died betrayed, and the ashes of an Affliction's last victim. The advancement ritual demands spreading despair so thoroughly through a community that hope itself becomes suspect, then ending the working before the practitioner loses the ability to feel anything else. The acting method requires the Despair to feed on the pain of others without drowning in it, to remain beautiful while being monstrous, and to remember that the Primordial Demoness reached Sequence 0 through exactly this door. At Sequence 4 the Demoness pathway practitioner becomes a Duchess of sorrow, and the Demoness Sect claims or kills any Saint who will not kneel.`,
    pathway: "demoness",
    epoch: 5,
    npcs: ["Judith"],
    sequences: [4],
    tags: ["demoness-pathway", "despair", "saint-threshold", "misfortune", "gender-lock"],
    tokenCount: 295,
    narratorOnly: true,
  },
];
