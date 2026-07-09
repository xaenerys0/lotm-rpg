import type { LoreEntry } from "./types";

export const HERMIT_PATHWAY_LORE: LoreEntry[] = [
  {
    slug: "hermit-pathway-overview",
    title: "Hermit Pathway — Overview",
    category: "pathway",
    content: `The Hermit pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of occult lore, warlockry, scrolls, and the reading of the constellations. From the lowest rung its sequences progress Mystery Pryer (Sequence 9), Melee Scholar (8), Warlock (7), Scrolls Professor (6), and Constellations Master (Sequence 5); its Saint and demigod rungs continue Mysticologist (Sequence 4), Clairvoyant (3), Sage (2), and Knowledge Emperor (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Hermit (Sequence 4 is now curated; Sequence 3–1 names are canon but their detailed abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence's potion through the Acting Method — living the role until the potion's characteristics settle — never on raw power alone.`,
    pathway: "hermit",
    epoch: 5,
    npcs: [],
    sequences: [9, 8, 7, 6, 5, 4, 3, 2, 1],
    tags: ["hermit-pathway", "knowledge-group", "overview"],
    tokenCount: 222,
  },
  {
    slug: "hermit-seq4-mysticologist",
    title: "Hermit Pathway — Sequence 4: Mysticologist",
    category: "pathway",
    content: `The Mysticologist is the Saint threshold of the Hermit pathway, where occult scholarship becomes a direct conduit for hidden knowledge. A Mysticologist can perform Mystery Prying at scale, tearing secrets from the fabric of reality — learning a target's true name, hidden vulnerabilities, or forgotten history by asking the right questions of the world itself. They gain Constellation Invocation, calling down stellar influence to empower rituals, curses, or divinations according to the positions of the stars. Their Grimoire of Secrets is a living record that absorbs rare mystical formulae and can automatically suggest countermeasures to witnessed Beyonder powers. The Mysticologist also begins to hear the Hidden Sage's whispers, a dangerous source of insight that offers true knowledge in exchange for ever-deeper devotion. The potion requires two main ingredients — the brain of a Sage and a page written in the Hidden Sage's own cipher — and three supplementary ingredients: star-metal from a fallen meteor, ash of a Scrolls Professor's most treasured book, and a question answered correctly by a dying Oracle. The advancement ritual demands uncovering a secret guarded by an Angel-tier power and surviving the consequences of knowing it. The acting method requires the Mysticologist to prize truth over comfort, to never use knowledge without understanding its price, and to resist the seduction of treating the Hidden Sage as a benevolent teacher. At Sequence 4 the Hermit pathway practitioner becomes a keeper of dangerous questions, and the Moses Ascetic Order regards them as either prophet or heretic.`,
    pathway: "hermit",
    epoch: 5,
    npcs: [],
    sequences: [4],
    tags: [
      "hermit-pathway",
      "mysticologist",
      "saint-threshold",
      "hidden-sage",
      "secrets",
    ],
    tokenCount: 295,
    narratorOnly: true,
  },
];
