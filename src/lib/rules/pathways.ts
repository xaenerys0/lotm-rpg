import type { Pathway, Sequence } from "@/lib/types/rules";

const foolSequences: Sequence[] = [
  {
    level: 9,
    name: "Seer",
    classification: "Low",
    abilities: [
      {
        name: "Spirit Vision",
        description: "Perceive the spirit world and see lingering spiritual traces",
        type: "active",
      },
      {
        name: "Divination",
        description:
          "Use mediums such as tarot cards or pendulums to divine limited information",
        type: "active",
      },
      {
        name: "Spiritual Intuition",
        description: "Sense danger and anomalies through subtle spiritual perception",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Avoid proactive divination without proper ritual preparation",
      "Speak and act with an air of mystery and reserve",
      "Observe more than you reveal",
    ],
    prerequisiteItems: [
      {
        name: "Seer Potion Formula",
        description: "The recipe for the Sequence 9 Seer potion",
        category: "potion-formula",
      },
      {
        name: "Lavos Squid Blood",
        description:
          "10 milliliters of blood from a Lavos Squid, a deep-sea supernatural creature",
        category: "main-ingredient",
      },
      {
        name: "Star Crystal",
        description: "50 grams of crystallised starlight energy",
        category: "main-ingredient",
      },
      {
        name: "Night Vanilla",
        description:
          "13 drops of liquid from Night Vanilla, which blooms only in darkness",
        category: "supplementary-ingredient",
      },
      {
        name: "Gold Mint Leaves",
        description: "7 leaves of Gold Mint, a rare herb associated with clarity of mind",
        category: "supplementary-ingredient",
      },
      {
        name: "Poison Hemlock",
        description: "3 drops of Poison Hemlock juice, carefully measured",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Blood Grass",
        description:
          "9 grams of powdered Dragon Blood Grass, a crimson herb found near ancient remains",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Clown",
    classification: "Low",
    abilities: [
      {
        name: "Distraction",
        description: "Misdirect attention using performance and sleight of hand",
        type: "active",
      },
      {
        name: "Flame Manipulation",
        description: "Control small flames for performance and combat",
        type: "active",
      },
      {
        name: "Paper Figurine Substitution",
        description: "Substitute a paper figurine for yourself to escape danger",
        type: "active",
      },
      {
        name: "Enhanced Agility",
        description: "Supernatural nimbleness and acrobatic ability",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Perform in front of audiences regularly",
      "Make others laugh or feel joy through your antics",
      "Never reveal your true emotions openly",
    ],
    prerequisiteItems: [
      {
        name: "Clown Potion Formula",
        description: "The recipe for the Sequence 8 Clown potion",
        category: "potion-formula",
      },
      {
        name: "Hornacis Mountain Goat Horn Crystal",
        description:
          "A crystal formed from the horn of a matured Hornacis Gray Mountain Goat",
        category: "main-ingredient",
      },
      {
        name: "Human-Faced Rose",
        description:
          "A complete stalk of a Human-Faced Rose, a supernatural flower with a human visage at its centre",
        category: "main-ingredient",
      },
      {
        name: "Tornapple Juice",
        description: "5 drops of juice from a Tornapple (jimsonweed), carefully measured",
        category: "supplementary-ingredient",
      },
      {
        name: "Black-Rimmed Sunflower",
        description: "Powdered petals of a Black-Rimmed Sunflower",
        category: "supplementary-ingredient",
      },
      {
        name: "Golden Cloak Grass",
        description: "Powdered Golden Cloak Grass",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Perform before an audience while channeling spiritual power",
      requirements: [
        "Gather an audience of at least ten people",
        "Perform a complete act from start to finish",
        "Channel spiritual energy during the climax of the performance",
      ],
    },
  },
  {
    level: 7,
    name: "Magician",
    classification: "Mid",
    abilities: [
      {
        name: "Damage Transfer",
        description: "Transfer damage from yourself to a connected object or person",
        type: "active",
      },
      {
        name: "Seal",
        description: "Create mystical seals to bind or contain supernatural entities",
        type: "active",
      },
      {
        name: "Item Affinity",
        description:
          "Sense and interact with enchanted or mystical items more effectively",
        type: "passive",
      },
      {
        name: "Conjuring",
        description: "Summon small objects from hidden spaces",
        type: "active",
      },
    ],
    actingRequirements: [
      "Practice magic tricks and illusions daily",
      "Always carry props and mystical tools",
      "Maintain an air of showmanship in all interactions",
    ],
    prerequisiteItems: [
      {
        name: "Magician Potion Formula",
        description: "The recipe for the Sequence 7 Magician potion",
        category: "potion-formula",
      },
      {
        name: "Fog Tree Person Root",
        description:
          "The true root of a Fog Tree Person (Mist Treant), a humanoid tree creature native to fog-shrouded regions",
        category: "main-ingredient",
      },
      {
        name: "Evil-Patterned Black Panther Spinal Fluid",
        description:
          "Spinal fluid from an Evil-Patterned Black Panther, a Beyonder beast with dark-marked hide",
        category: "main-ingredient",
      },
      {
        name: "Fog Tree Sap",
        description: "30 ml of sap from a Fog Tree Person",
        category: "supplementary-ingredient",
      },
      {
        name: "Aqueous Gemstone Powder",
        description: "3 grams of finely ground aqueous gemstone",
        category: "supplementary-ingredient",
      },
      {
        name: "Hallucinogenic Grass Oil",
        description: "4 drops of essential oil from hallucinogenic grass",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Complete a binding ritual to absorb the Magician characteristic",
      requirements: [
        "Draw a ritual circle using spiritually-charged materials",
        "Recite the Magician invocation at midnight",
        "Successfully seal a minor supernatural entity during the ritual",
      ],
    },
  },
  {
    level: 6,
    name: "Faceless",
    classification: "Mid",
    abilities: [
      {
        name: "Shapeshifting",
        description:
          "Completely transform your appearance, voice, and physique to imitate another person",
        type: "active",
      },
      {
        name: "Identity Theft",
        description:
          "Temporarily absorb the surface memories and mannerisms of a touched target",
        type: "active",
      },
      {
        name: "Body Malleability",
        description: "Reshape your body to squeeze through gaps or resist blunt impacts",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Adopt a new identity for at least one full day each week",
      "Live convincingly as someone else without being discovered",
      "Never grow too attached to a single identity",
    ],
    prerequisiteItems: [
      {
        name: "Faceless Potion Formula",
        description: "The recipe for the Sequence 6 Faceless potion",
        category: "potion-formula",
      },
      {
        name: "Thousand-Faced Hunter Mutant Pituitary Gland",
        description:
          "The mutated pituitary gland from a Thousand-Faced Hunter, a shapeshifting Beyonder beast",
        category: "main-ingredient",
      },
      {
        name: "Characteristic of a Human-Skinned Shadow",
        description:
          "The supernatural characteristic of a Human-Skinned Shadow, a creature that wears human skin",
        category: "main-ingredient",
      },
      {
        name: "Thousand-Faced Hunter Blood",
        description: "80 ml of blood from a Thousand-Faced Hunter",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Tornapple Juice",
        description: "5 drops of juice from Black Tornapple (black jimsonweed)",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Tooth Grass Powder",
        description: "10 grams of powdered Dragon Tooth Grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep-Sea Naga Hair",
        description: "Three strands of hair from a Deep-Sea Naga",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Assume a false identity and maintain it through a crisis without breaking character",
      requirements: [
        "Prepare a complete false identity with documentation",
        "Live as the assumed identity for no less than three days",
        "Successfully navigate a threatening situation while in disguise",
      ],
    },
  },
  {
    level: 5,
    name: "Marionettist",
    classification: "Mid",
    abilities: [
      {
        name: "Marionette Control",
        description:
          "Take direct control of a living person's body, turning them into your puppet",
        type: "active",
      },
      {
        name: "Thread Manipulation",
        description:
          "Create invisible spiritual threads to manipulate objects and people at range",
        type: "active",
      },
      {
        name: "Grafting",
        description:
          "Graft abilities from defeated Beyonders onto yourself or your marionettes",
        type: "active",
      },
      {
        name: "Enhanced Spiritual Perception",
        description: "Greatly enhanced ability to detect and read spiritual fluctuations",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Control at least one marionette at all times",
      "Direct events from behind the scenes rather than acting openly",
      "Treat every interaction as a stage where you pull the strings",
    ],
    prerequisiteItems: [
      {
        name: "Marionettist Potion Formula",
        description: "The recipe for the Sequence 5 Marionettist potion",
        category: "potion-formula",
      },
      {
        name: "Dust of Ancient Wraiths",
        description:
          "Powdered dust from Ancient Wraiths — spirits of exceptional age and power",
        category: "main-ingredient",
      },
      {
        name: "Core Crystal of a Six-Winged Gargoyle",
        description: "The crystal core left when a Six-Winged Gargoyle is destroyed",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Successfully convert a living Beyonder into a marionette through spiritual domination",
      requirements: [
        "Overpower the will of a Beyonder target using spiritual threads",
        "Complete the marionette conversion ritual in an isolated location",
        "Maintain control of the new marionette for at least one hour",
      ],
    },
  },
];

const visionarySequences: Sequence[] = [
  {
    level: 9,
    name: "Spectator",
    classification: "Low",
    abilities: [
      {
        name: "Emotion Reading",
        description:
          "Read micro-expressions and body language to detect lies and emotions",
        type: "passive",
      },
      {
        name: "Psychological Analysis",
        description: "Quickly analyze a person's psychological state and motivations",
        type: "active",
      },
      {
        name: "Enhanced Perception",
        description: "Heightened awareness of subtle social and environmental cues",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Observe people and social dynamics without interfering",
      "Record your observations in a journal regularly",
      "Analyze motivations before taking action",
    ],
    prerequisiteItems: [
      {
        name: "Spectator Potion Formula",
        description: "The recipe for the Sequence 9 Spectator potion",
        category: "potion-formula",
      },
      {
        name: "Phantom Lizard Pituitary Gland",
        description:
          "The complete pituitary gland of a Phantom Lizard, a supernatural reptile with perception-warping properties",
        category: "main-ingredient",
      },
      {
        name: "Half-Ghost Rabbit Spinal Fluid",
        description:
          "10 ml of spinal fluid from a Half-Ghost Rabbit, which exists partially in the spirit world",
        category: "main-ingredient",
      },
      {
        name: "Chestnut Spores",
        description: "5 grams of Chestnut Spores",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Apricot Powder",
        description: "8 grams of powdered Dragon Apricot",
        category: "supplementary-ingredient",
      },
      {
        name: "Fairy Flower Petals",
        description: "Three pure white petals from a Fairy Flower",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Telepathist",
    classification: "Low",
    abilities: [
      {
        name: "Telepathy",
        description: "Read surface thoughts and send mental messages to others",
        type: "active",
      },
      {
        name: "Mental Shield",
        description: "Construct a psychic barrier to protect against mental intrusion",
        type: "active",
      },
      {
        name: "Empathic Influence",
        description: "Subtly influence the emotions of a nearby target",
        type: "active",
      },
    ],
    actingRequirements: [
      "Practice telepathic communication daily",
      "Respect mental boundaries — never probe deeply without cause",
      "Meditate to strengthen your psychic fortitude",
    ],
    prerequisiteItems: [
      {
        name: "Telepathist Potion Formula",
        description: "The recipe for the Sequence 8 Telepathist potion",
        category: "potion-formula",
      },
      {
        name: "Fruit of the Tree of Elders",
        description:
          "A fruit from the Tree of Elders, an ancient tree associated with accumulated wisdom and perception",
        category: "main-ingredient",
      },
      {
        name: "Mirror Dragon Eyes",
        description:
          "A pair of eyes from a Mirror Dragon — a creature whose gaze reflects the minds of others",
        category: "main-ingredient",
      },
      {
        name: "Chestnut Spores",
        description: "5 grams of Chestnut Spores",
        category: "supplementary-ingredient",
      },
      {
        name: "Dragon Tooth Grass Powder",
        description: "8 grams of powdered Dragon Tooth Grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Pure White Elf Flowers",
        description: "Three petals from Pure White Elf Flowers",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Establish a sustained telepathic link with another Beyonder",
      requirements: [
        "Find a willing Beyonder partner",
        "Maintain a two-way telepathic connection for one full hour",
        "Successfully transmit a complex memory through the link",
      ],
    },
  },
  {
    level: 7,
    name: "Psychiatrist",
    classification: "Mid",
    abilities: [
      {
        name: "Deep Mental Probe",
        description: "Dive into a subject's subconscious to uncover hidden memories",
        type: "active",
      },
      {
        name: "Psychological Healing",
        description:
          "Repair psychological trauma and mental afflictions through psychic therapy",
        type: "active",
      },
      {
        name: "Mental Suggestion",
        description:
          "Implant subtle suggestions that the target perceives as their own thoughts",
        type: "active",
      },
      {
        name: "Psychic Resilience",
        description: "Greatly enhanced resistance to mental corruption",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Help others resolve psychological issues on a regular basis",
      "Study the nature of the subconscious mind",
      "Maintain your own mental health through disciplined practice",
    ],
    prerequisiteItems: [
      {
        name: "Psychiatrist Potion Formula",
        description: "The recipe for the Sequence 7 Psychiatrist potion",
        category: "potion-formula",
      },
      {
        name: "Psychic Dragon Pituitary Gland",
        description: "The complete pituitary gland of an adolescent Psychic Dragon",
        category: "main-ingredient",
      },
      {
        name: "Black Monitor Lizard Spinal Fluid",
        description: "60 ml of spinal fluid from a Black Monitor Lizard",
        category: "main-ingredient",
      },
      {
        name: "Hallucinogenic Landscape Tree Fruit",
        description:
          "One fruit from a hallucinogenic landscape tree, which distorts perception in its vicinity",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Heal a patient with severe psychological damage caused by Beyonder influence",
      requirements: [
        "Identify a patient whose mind has been damaged by supernatural forces",
        "Perform psychic therapy over multiple sessions",
        "Fully restore the patient's mental stability",
      ],
    },
  },
  {
    level: 6,
    name: "Hypnotist",
    classification: "Mid",
    abilities: [
      {
        name: "Mass Hypnosis",
        description: "Place multiple targets into a hypnotic trance simultaneously",
        type: "active",
      },
      {
        name: "Memory Manipulation",
        description: "Alter, erase, or implant specific memories in a target's mind",
        type: "active",
      },
      {
        name: "Dream Invasion",
        description:
          "Enter a sleeping target's dreams and manipulate the dream environment",
        type: "active",
      },
      {
        name: "Psychic Dominance",
        description: "Passive aura that makes weaker-willed individuals more suggestible",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Practice hypnotic techniques on willing subjects weekly",
      "Study dreams and their connection to the subconscious",
      "Never lose control of your own psychic state",
    ],
    prerequisiteItems: [
      {
        name: "Hypnotist Potion Formula",
        description: "The recipe for the Sequence 6 Hypnotist potion",
        category: "potion-formula",
      },
      {
        name: "Eye of a Dreamweaver Spider",
        description: "The central eye of a spider that hunts within dreams",
        category: "main-ingredient",
      },
      {
        name: "Slumber Flower Pollen",
        description: "Pollen that induces deep sleep and vivid dreams",
        category: "supplementary-ingredient",
      },
      {
        name: "Liquid Silver Mercury",
        description: "Alchemically purified mercury that resonates with the psyche",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Enter and fully control the dream of a Beyonder-level target",
      requirements: [
        "Identify a Beyonder target of at least Sequence 8",
        "Enter their dream without being detected",
        "Reshape the dream environment three times without losing coherence",
      ],
    },
  },
  {
    level: 5,
    name: "Dreamwalker",
    classification: "Mid",
    abilities: [
      {
        name: "Dream World Access",
        description: "Open a gateway to the dream world and traverse it physically",
        type: "active",
      },
      {
        name: "Dream Materialization",
        description: "Pull objects and entities from the dream world into reality",
        type: "active",
      },
      {
        name: "Collective Dream",
        description:
          "Create a shared dream space that multiple people inhabit simultaneously",
        type: "active",
      },
      {
        name: "Subconscious Fortress",
        description:
          "Your mind is a fortified dream realm — nearly impervious to mental attack",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Spend time in the dream world regularly to maintain your connection",
      "Bridge the gap between dreams and reality for others",
      "Guard the boundary between the dream world and the waking world",
    ],
    prerequisiteItems: [
      {
        name: "Dreamwalker Potion Formula",
        description: "The recipe for the Sequence 5 Dreamwalker potion",
        category: "potion-formula",
      },
      {
        name: "Adult Mind Dragon Blood",
        description: "100 ml of blood from an adult Mind Dragon",
        category: "main-ingredient",
      },
      {
        name: "Adult Mind Dragon Scales",
        description: "Three scales from an adult Mind Dragon",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Open a stable gateway to the dream world and return safely with a materialized object",
      requirements: [
        "Brew the potion within the dream world itself",
        "Open a gateway between dream and reality that persists for one hour",
        "Bring a dream-materialized object into the waking world",
      ],
    },
  },
];

const sunSequences: Sequence[] = [
  {
    level: 9,
    name: "Bard",
    classification: "Low",
    abilities: [
      {
        name: "Holy Hymn",
        description: "Sing hymns that purify minor corruption and bolster morale",
        type: "active",
      },
      {
        name: "Minor Healing",
        description: "Channel warmth to mend small wounds and ease pain",
        type: "active",
      },
      {
        name: "Light Sensitivity",
        description: "Enhanced perception in well-lit environments",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sing or perform music daily to honor the light",
      "Spread warmth and hope to those in despair",
      "Rise with the sun and greet the dawn",
    ],
    prerequisiteItems: [
      {
        name: "Bard Potion Formula",
        description: "The recipe for the Sequence 9 Bard potion",
        category: "potion-formula",
      },
      {
        name: "Crystal Sunflower",
        description:
          "A crystallised sunflower whose petals have turned to translucent glass through sun exposure over centuries",
        category: "main-ingredient",
      },
      {
        name: "Siren Rock",
        description:
          "A resonant stone that hums with solar energy — associated with the Sun pathway's music-based power",
        category: "main-ingredient",
      },
      {
        name: "Midsummer Grass",
        description: "One blade of Midsummer Grass, harvested at the summer solstice",
        category: "supplementary-ingredient",
      },
      {
        name: "July Wine Juice",
        description: "5 drops of July Wine juice, a ferment made from sun-ripened grapes",
        category: "supplementary-ingredient",
      },
      {
        name: "Elf Dark Leaf",
        description:
          "One leaf from an Elf Dark tree, which stores sunlight in its darkened surface",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Light Suppliant",
    classification: "Low",
    abilities: [
      {
        name: "Light Beam",
        description: "Project a focused beam of purifying light",
        type: "active",
      },
      {
        name: "Healing Touch",
        description: "Heal moderate wounds and cure minor diseases through touch",
        type: "active",
      },
      {
        name: "Radiant Aura",
        description: "Emit a soft glow that repels weaker undead and evil spirits",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Pray at dawn and dusk without fail",
      "Aid the sick and wounded whenever possible",
      "Never shy away from darkness — carry light into it",
    ],
    prerequisiteItems: [
      {
        name: "Light Suppliant Potion Formula",
        description: "The recipe for the Sequence 8 Light Suppliant potion",
        category: "potion-formula",
      },
      {
        name: "Brilliance Rock",
        description:
          "A rock that stores and emits light — it glows with a pale radiance even in total darkness",
        category: "main-ingredient",
      },
      {
        name: "Golden-Edged Sunflower",
        description:
          "A sunflower with gold-edged petals, found near sites of Sun pathway activity",
        category: "supplementary-ingredient",
      },
      {
        name: "Aconite Juice",
        description: "3 drops of aconite juice, carefully measured",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Conduct a healing ceremony under direct sunlight",
      requirements: [
        "Gather those in need of healing in an open, sunlit area",
        "Channel the power of sunlight through sustained prayer",
        "Heal at least three people during the ceremony",
      ],
    },
  },
  {
    level: 7,
    name: "Solar High Priest",
    classification: "Mid",
    abilities: [
      {
        name: "Blazing Radiance",
        description: "Release an intense burst of holy light that damages evil entities",
        type: "active",
      },
      {
        name: "Purification Ritual",
        description: "Cleanse an area of spiritual corruption through extended prayer",
        type: "active",
      },
      {
        name: "Endurance of the Sun",
        description: "Enhanced physical stamina and resistance to cold and darkness",
        type: "passive",
      },
      {
        name: "Consecration",
        description: "Bless an object or location to repel evil for a duration",
        type: "active",
      },
    ],
    actingRequirements: [
      "Lead religious ceremonies and services regularly",
      "Protect the faithful and defend sacred sites",
      "Study the scriptures of the sun and embody their teachings",
    ],
    prerequisiteItems: [
      {
        name: "Solar High Priest Potion Formula",
        description: "The recipe for the Sequence 7 Solar High Priest potion",
        category: "potion-formula",
      },
      {
        name: "Phoenix Feather Fragment",
        description: "A shard of a phoenix feather, imbued with regenerative flame",
        category: "main-ingredient",
      },
      {
        name: "Sacred Incense Resin",
        description: "Resin from a tree growing in a consecrated grove",
        category: "supplementary-ingredient",
      },
      {
        name: "Dawn Dew",
        description: "Dew collected at the exact moment of sunrise from a holy site",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Purify a location corrupted by darkness or evil",
      requirements: [
        "Identify a location tainted by supernatural darkness",
        "Perform a purification ritual lasting from dawn to noon",
        "Successfully cleanse the corruption completely",
      ],
    },
  },
  {
    level: 6,
    name: "Notary",
    classification: "Mid",
    abilities: [
      {
        name: "Sacred Contract",
        description:
          "Create binding contracts enforced by supernatural power — breakers suffer divine retribution",
        type: "active",
      },
      {
        name: "Truth Detection",
        description: "Compel truth from a target during formal questioning",
        type: "active",
      },
      {
        name: "Aura of Authority",
        description:
          "Project an aura that compels respect and obedience from weaker-willed beings",
        type: "passive",
      },
      {
        name: "Holy Fire",
        description:
          "Summon flames of purification that burn evil but spare the innocent",
        type: "active",
      },
    ],
    actingRequirements: [
      "Uphold justice and enforce agreements",
      "Serve as arbiter in disputes when called upon",
      "Never break your own word or contract",
    ],
    prerequisiteItems: [
      {
        name: "Notary Potion Formula",
        description: "The recipe for the Sequence 6 Notary potion",
        category: "potion-formula",
      },
      {
        name: "Scale of a Golden Serpent",
        description: "A scale from a serpent that guards sacred contracts",
        category: "main-ingredient",
      },
      {
        name: "Ink of Binding",
        description: "Mystical ink that makes written words supernaturally binding",
        category: "supplementary-ingredient",
      },
      {
        name: "Judgment Stone Dust",
        description: "Powdered stone from the ruins of an ancient court of law",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Adjudicate a dispute between two Beyonders and enforce the outcome",
      requirements: [
        "Receive both parties' consent to your arbitration",
        "Issue a judgment backed by your Sacred Contract ability",
        "Ensure compliance from both parties",
      ],
    },
  },
  {
    level: 5,
    name: "Priest of Light",
    classification: "Mid",
    abilities: [
      {
        name: "Divine Healing",
        description:
          "Heal severe wounds and cure serious diseases through channeled light",
        type: "active",
      },
      {
        name: "Solar Judgment",
        description: "Call down a pillar of concentrated sunlight to smite a target area",
        type: "active",
      },
      {
        name: "Sanctuary",
        description:
          "Create a zone of holy light that protects all within from evil influence",
        type: "active",
      },
      {
        name: "Radiant Constitution",
        description:
          "Body is suffused with light — highly resistant to corruption, poison, and disease",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Lead a congregation or community of faith",
      "Perform major healing works at least once a week",
      "Stand as a beacon of light in times of darkness",
    ],
    prerequisiteItems: [
      {
        name: "Priest of Light Potion Formula",
        description: "The recipe for the Sequence 5 Priest of Light potion",
        category: "potion-formula",
      },
      {
        name: "Eyes of a Radiant Giant",
        description:
          "A pair of eyes from a Radiant Giant — luminous colossus creatures of the Sun pathway",
        category: "main-ingredient",
      },
      {
        name: "Blood of a Radiant Giant",
        description: "300 ml of blood from a Radiant Giant",
        category: "main-ingredient",
      },
      {
        name: "Self-Transcribed Holy Book",
        description:
          "A holy book praising the Sun, written in the practitioner's own hand — both ingredient and ritual object",
        category: "main-ingredient",
      },
    ],
    advancementRitual: {
      description: "Establish a new consecrated sanctuary and defend it from darkness",
      requirements: [
        "Choose a location in need of spiritual protection",
        "Consecrate the location through a day-long ritual",
        "Defend the sanctuary against a supernatural assault",
      ],
    },
  },
];

const deathSequences: Sequence[] = [
  {
    level: 9,
    name: "Corpse Collector",
    classification: "Low",
    abilities: [
      {
        name: "Corpse Communication",
        description: "Speak with recently deceased to learn their final moments",
        type: "active",
      },
      {
        name: "Death Sense",
        description: "Detect the presence of death, undead, and lingering spirits nearby",
        type: "passive",
      },
      {
        name: "Preserve Remains",
        description: "Slow or halt decomposition of a corpse through spiritual means",
        type: "active",
      },
    ],
    actingRequirements: [
      "Treat the dead with respect and perform proper burial rites",
      "Spend time among graves and places of death without fear",
      "Collect and catalog remains you encounter",
    ],
    prerequisiteItems: [
      {
        name: "Corpse Collector Potion Formula",
        description: "The recipe for the Sequence 9 Corpse Collector potion",
        category: "potion-formula",
      },
      {
        name: "Corpse Grass",
        description: "A grey grass that grows exclusively on the graves of Beyonders",
        category: "main-ingredient",
      },
      {
        name: "Black-faced Vulture Oil",
        description: "Rendered fat from a spiritually-attuned vulture",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Gravedigger",
    classification: "Low",
    abilities: [
      {
        name: "Undead Command",
        description:
          "Raise and command a small number of basic undead (skeletons, zombies)",
        type: "active",
      },
      {
        name: "Bone Weapon",
        description: "Shape bones into supernatural weapons",
        type: "active",
      },
      {
        name: "Death's Endurance",
        description: "Reduced need for sleep and food; resistance to cold and disease",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Dig graves and bury the dead as a service to communities",
      "Study the nature of death and undeath",
      "Protect graveyards and burial sites from desecration",
    ],
    prerequisiteItems: [
      {
        name: "Gravedigger Potion Formula",
        description: "The recipe for the Sequence 8 Gravedigger potion",
        category: "potion-formula",
      },
      {
        name: "Eye of a Death-Telling Crow",
        description:
          "The eye of a Death-Telling Crow, a corvid that can sense imminent death",
        category: "main-ingredient",
      },
      {
        name: "Blood Rose",
        description:
          "A Blood Rose harvested from a graveyard — a flower that feeds on corpse essence",
        category: "main-ingredient",
      },
      {
        name: "Death-Telling Crow Feathers",
        description: "Three feathers from a Death-Telling Crow",
        category: "supplementary-ingredient",
      },
      {
        name: "Blood Rose Leaves",
        description: "Five leaves from a graveyard Blood Rose",
        category: "supplementary-ingredient",
      },
      {
        name: "Corpse-Scented Oil",
        description: "9 drops of essential oil distilled from corpse remains",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Successfully put a restless undead to permanent rest",
      requirements: [
        "Locate an undead that refuses to stay buried",
        "Perform the rite of final rest at the undead's original grave",
        "Ensure the spirit passes on peacefully",
      ],
    },
  },
  {
    level: 7,
    name: "Spirit Medium",
    classification: "Mid",
    abilities: [
      {
        name: "Spirit Channeling",
        description: "Allow a spirit to temporarily inhabit your body to communicate",
        type: "active",
      },
      {
        name: "Ghost Walk",
        description:
          "Become partially incorporeal for a short time, passing through solid objects",
        type: "active",
      },
      {
        name: "Death Domain Awareness",
        description:
          "Sense disturbances in the boundary between life and death within a wide area",
        type: "passive",
      },
      {
        name: "Spirit Binding",
        description: "Bind a willing or weakened spirit to an object or location",
        type: "active",
      },
    ],
    actingRequirements: [
      "Commune with spirits regularly to maintain your connection to the death domain",
      "Mediate between the living and the dead",
      "Never abuse the trust of spirits who seek your aid",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Medium Potion Formula",
        description: "The recipe for the Sequence 7 Spirit Medium potion",
        category: "potion-formula",
      },
      {
        name: "Forepaw of a Ghost Phantom Cat",
        description:
          "The forepaw of a Ghost Phantom Cat, a supernatural feline that phases between the living and spirit worlds",
        category: "main-ingredient",
      },
      {
        name: "Spirit World Crystal",
        description: "A crystal formed by the condensation of spirit world energy",
        category: "main-ingredient",
      },
      {
        name: "Ghost Phantom Cat Blood",
        description: "80 ml of blood from a Ghost Phantom Cat",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit Crystal-Tainted Soil",
        description: "10 grams of soil contaminated by spirit world crystal dissolution",
        category: "supplementary-ingredient",
      },
      {
        name: "Brain Matter of the Spirit-Possessed",
        description:
          "5 ml of brain matter from a person who died from evil spirit possession",
        category: "supplementary-ingredient",
      },
      {
        name: "Natural Spirit-Blessed Leaf",
        description: "A leaf that has been blessed by a natural spirit",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Channel a powerful spirit and deliver its final message",
      requirements: [
        "Contact a spirit of at least Sequence 8 power",
        "Allow the spirit to channel through you without losing yourself",
        "Successfully deliver the spirit's message to the intended recipient",
      ],
    },
  },
  {
    level: 6,
    name: "Spirit Guide",
    classification: "Mid",
    abilities: [
      {
        name: "Gaze of Death",
        description:
          "Any living being who makes direct eye contact risks instant death; even entities of godlike power suffer devastating damage from the exchange",
        type: "active",
      },
      {
        name: "Withering Gaze",
        description:
          "Targets within your line of sight wither slowly even without direct eye contact, as if crossing the River of Death inch by inch",
        type: "passive",
      },
      {
        name: "Death's Immunity",
        description:
          "Most physical and supernatural attacks are ineffective — only purification effects remain genuinely dangerous; the body no longer dies of natural causes and gradually transforms",
        type: "passive",
      },
      {
        name: "Touch of Death and Life",
        description:
          "Touch with the left hand inflicts near-irreversible death; a subsequent touch with the right hand reverses the condition and restores life",
        type: "active",
      },
    ],
    actingRequirements: [
      "Walk among the living with your eyes lowered or averted — master the death energy in your gaze so it does not kill indiscriminately",
      "Guide every soul that approaches you seeking passage; the Spirit Guide does not refuse those who come",
      "Maintain the detachment of one who has crossed the threshold — neither fear death nor cling to the living world",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Guide Potion Formula",
        description: "The recipe for the Sequence 6 Spirit Guide potion",
        category: "potion-formula",
      },
      {
        name: "Shadow of Death",
        description:
          "The shadow cast by death itself — an incorporeal entity that inhabits objects",
        category: "main-ingredient",
      },
      {
        name: "Soul Essence of a Pale Lich",
        description:
          "The condensed soul-essence of a Pale Lich, a high-order undead sorcerer",
        category: "main-ingredient",
      },
      {
        name: "Bone Fragments of a Pale Lich",
        description:
          "Ground bones from the same Pale Lich, retaining residual death energy",
        category: "supplementary-ingredient",
      },
      {
        name: "Putrid Essence of the Deceased",
        description:
          "100 ml of putrid liquid from a long-deceased body, distilled and concentrated",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Confront the full weight of your transformation: spend three days and nights among the dead without averting your gaze, and survive the withering effect of your own reflection",
      requirements: [
        "Remain in a place of the dead for three consecutive days without shielding your eyes",
        "Witness your own reflection in still water without allowing the sight to kill you",
        "Demonstrate control of the Touch of Death by reviving with the right hand what the left hand has withered",
      ],
    },
  },
  {
    level: 5,
    name: "Gatekeeper",
    classification: "Mid",
    abilities: [
      {
        name: "Door to the Underworld",
        description:
          "Sense and control the entrance to the Underworld; solidify it as a brand on your palm and summon it at critical moments to drag targets behind the door",
        type: "active",
      },
      {
        name: "Internal Underworld",
        description:
          "Use your body as a cage to house souls, spirits, and undead — an entrance to an inner death realm opens at the centre of your brow",
        type: "active",
      },
      {
        name: "Undead Dominion",
        description:
          "Command the undead housed within your Internal Underworld, deploying them through the gate wherever you travel without drawing outward attention",
        type: "active",
      },
      {
        name: "Underworld Sense",
        description:
          "Perceive all disturbances across a vast area of the death domain; nothing that crosses the boundary between life and death escapes your awareness",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Guard the boundary between the living and the dead as a sacred responsibility",
      "Maintain and expand your Internal Underworld — ensure those housed within are ordered and at peace",
      "Never allow unauthorized passage through the gate you embody",
    ],
    prerequisiteItems: [
      {
        name: "Gatekeeper Potion Formula",
        description: "The recipe for the Sequence 5 Gatekeeper potion",
        category: "potion-formula",
      },
      {
        name: "Skull of an Underworld Wanderer",
        description:
          "The skull of an Underworld Wanderer, a creature native to the death realm",
        category: "main-ingredient",
      },
      {
        name: "Crystal Core of a Myriad-Armed Wraith",
        description:
          "The crystal core left behind when a Myriad-Armed Wraith is destroyed",
        category: "main-ingredient",
      },
      {
        name: "Death-Tainted Water",
        description: "80 ml of water permeated by the aura of the death realm",
        category: "supplementary-ingredient",
      },
      {
        name: "Underworld Wanderer Flesh",
        description: "A piece of rotten flesh from an Underworld Wanderer",
        category: "supplementary-ingredient",
      },
      {
        name: "Myriad-Armed Wraith Residue",
        description:
          "10 grams of residual powder left after destroying a Myriad-Armed Wraith",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Red Amaryllis Oil",
        description: "10 drops of essential oil from the Deep Red Amaryllis flower",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Open the gate within your own body for the first time and house your first souls, proving you can sustain the Internal Underworld",
      requirements: [
        "Prepare through extended communion with the death realm",
        "Open the Internal Underworld gate at your brow",
        "Successfully house at least three bound souls within your Internal Underworld without losing control",
      ],
    },
  },
];

const darknessSequences: Sequence[] = [
  {
    level: 9,
    name: "Sleepless",
    classification: "Low",
    abilities: [
      {
        name: "Nocturnality",
        description:
          "Grow stronger as night deepens — physical strength, intuition, and mind are all heightened after dark, and only a few hours of sleep are needed",
        type: "passive",
      },
      {
        name: "Night Vision",
        description: "See clearly through total darkness and sense dangers hidden in it",
        type: "passive",
      },
      {
        name: "Spirit Vision",
        description: "Perceive spiritual things, though without precise discernment",
        type: "active",
      },
    ],
    actingRequirements: [
      "Keep to the night — work, watch, and act under cover of darkness",
      "Cultivate stillness and concealment; move unseen and unheard",
      "Resist sleep and stand vigil while others rest",
    ],
    prerequisiteItems: [
      {
        name: "Sleepless Potion Formula",
        description: "The recipe for the Sequence 9 Sleepless potion",
        category: "potion-formula",
      },
      {
        name: "Midnight Beauty Flower",
        description:
          "One blossom of the Midnight Beauty Flower, which opens only in the dead of night",
        category: "main-ingredient",
      },
      {
        name: "Six-Footed Owl Eyes",
        description:
          "A pair of eyes from a Six-Footed Owl, a nocturnal supernatural bird",
        category: "main-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "80 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
      {
        name: "Night Vanilla Essential Oil",
        description: "10 drops of essential oil pressed from Night Vanilla",
        category: "supplementary-ingredient",
      },
      {
        name: "Midnight Beauty Leaves",
        description: "3 leaves of the Midnight Beauty Flower",
        category: "supplementary-ingredient",
      },
      {
        name: "Coffee Beans or Tea Leaves",
        description:
          "A portion of coffee beans or tea leaves, taken for symbolic meaning",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Midnight Poet",
    classification: "Low",
    abilities: [
      {
        name: "Midnight Poem",
        description:
          "Recite verses that carry supernatural force — each poem shapes a distinct effect in the dark",
        type: "active",
      },
      {
        name: "Lullaby",
        description: "Sing or speak others into drowsiness and unnatural sleep",
        type: "active",
      },
      {
        name: "Pacify",
        description: "Quiet emotions and suppress the desires and moods of those nearby",
        type: "active",
      },
    ],
    actingRequirements: [
      "Compose and recite poems by night, drawing power from the dark hours",
      "Soothe and lull the troubled rather than confront them openly",
      "Keep your true intent veiled behind verse and quiet",
    ],
    prerequisiteItems: [
      {
        name: "Midnight Poet Potion Formula",
        description: "The recipe for the Sequence 8 Midnight Poet potion",
        category: "potion-formula",
      },
      {
        name: "Red-Moon Roarer Vocal Cords",
        description:
          "The vocal cords of a Red-Moon Roarer, a creature that howls at the crimson moon",
        category: "main-ingredient",
      },
      {
        name: "Soul-Snatching Wind Chime Flower",
        description:
          "One Soul-Snatching Wind Chime Flower, whose tones unsettle the spirit",
        category: "main-ingredient",
      },
      {
        name: "Red Wine",
        description: "100 milliliters of red wine",
        category: "supplementary-ingredient",
      },
      {
        name: "Red-Moon Roarer Hair",
        description: "7 strands of hair from a Red-Moon Roarer",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Crimson Sandalwood",
        description: "10 grams of deep crimson sandalwood",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Compose and perform a Midnight Poem that bends a gathered audience to sleep",
      requirements: [
        "Gather listeners and recite an original Midnight Poem at the dead of night",
        "Channel spiritual power so the verse lulls them into slumber",
        "Hold the working until every listener has succumbed",
      ],
    },
  },
  {
    level: 7,
    name: "Nightmare",
    classification: "Mid",
    abilities: [
      {
        name: "Dream Invasion",
        description: "Enter a sleeping target's dream and move through its landscape",
        type: "active",
      },
      {
        name: "Dream Shaping",
        description: "Reshape the contents of a dream into a nightmare of your design",
        type: "active",
      },
      {
        name: "Nightmare Limbs",
        description: "Manifest shadowy limbs of nightmare-stuff to seize and strike",
        type: "active",
      },
      {
        name: "Nightmare State",
        description:
          "Cloak yourself in a dreadful, oppressive aura that weakens the resolve of others",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Walk the dreams of others and study the shape of their fears",
      "Conceal your comings and goings; let no one trace the source of the dread",
      "Master your own nightmares before you wield those of others",
    ],
    prerequisiteItems: [
      {
        name: "Nightmare Potion Formula",
        description: "The recipe for the Sequence 7 Nightmare potion",
        category: "potion-formula",
      },
      {
        name: "Dream-Eating Black Crow Heart",
        description:
          "The heart of a Dream-Eating Black Crow, a corvid that feeds on dreams",
        category: "main-ingredient",
      },
      {
        name: "Shadow of Nightmares",
        description:
          "A captured Shadow of Nightmares, the residue of a powerful bad dream",
        category: "main-ingredient",
      },
      {
        name: "Spirit-World Moon Water",
        description:
          "100 milliliters of moon water drawn from the crimson moon of the spirit world",
        category: "supplementary-ingredient",
      },
      {
        name: "Dream-Eating Crow Phantom Feather",
        description: "One phantom feather from a Dream-Eating Black Crow",
        category: "supplementary-ingredient",
      },
      {
        name: "Recorded Nightmare Pages",
        description: "Paper recording one of your own nightmares from the past fortnight",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Invade and master the nightmare of a Beyonder without being cast out",
      requirements: [
        "Enter the dream of a sleeping Beyonder undetected",
        "Twist the dream into a nightmare of your own shaping",
        "Withdraw before the dreamer wakes, leaving no trace",
      ],
    },
  },
  {
    level: 6,
    name: "Soul Assurer",
    classification: "Mid",
    abilities: [
      {
        name: "Requiem",
        description:
          "Sing a requiem that soothes restless souls and lays troubled spirits to rest",
        type: "active",
      },
      {
        name: "Soul Pacification",
        description: "Calm, pacify, and provide refuge to wandering or agitated spirits",
        type: "active",
      },
      {
        name: "Agitating",
        description: "Inversely, stir a spirit into frenzy or torment when needed",
        type: "active",
      },
      {
        name: "Heightened Spirituality",
        description: "Greatly heightened spiritual perception and ritual sensitivity",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Tend to the dead and the dreaming — bring rest to souls that cannot find it",
      "Move in silence and concealment; the Soul Assurer works unseen",
      "Hold to serenity; never let the torment of spirits become your own",
    ],
    prerequisiteItems: [
      {
        name: "Soul Assurer Potion Formula",
        description: "The recipe for the Sequence 6 Soul Assurer potion",
        category: "potion-formula",
      },
      {
        name: "Rotting Shepherd Spirit Crystal",
        description:
          "The spirit-body crystal of a Rotting Shepherd, a decayed spirit-world entity",
        category: "main-ingredient",
      },
      {
        name: "Otherworldly Deep Sleeper Skull",
        description:
          "The skull of an Otherworldly Deep Sleeper, a creature of endless slumber",
        category: "main-ingredient",
      },
      {
        name: "Blessed Holy Water",
        description: "80 milliliters of blessed holy water",
        category: "supplementary-ingredient",
      },
      {
        name: "Rotting Shepherd Pus",
        description: "7 drops of pus from a Rotting Shepherd",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Sleeper Shadow Soil",
        description:
          "17 grams of soil mingled with the shadow of an Otherworldly Deep Sleeper",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep Sleep Flower Powder",
        description: "10 grams of powdered Deep Sleep Flower",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Lay to rest a powerful, anguished spirit that resists all comfort",
      requirements: [
        "Find a tormented spirit that refuses peace",
        "Sing the Requiem and offer it refuge within the dark",
        "Settle the spirit into rest without being dragged into its anguish",
      ],
    },
  },
  {
    level: 5,
    name: "Spirit Warlock",
    classification: "Mid",
    abilities: [
      {
        name: "Spirit Commanding",
        description:
          "Summon, bind, and command a host of spirits and spirit-world creatures to fight and serve",
        type: "active",
      },
      {
        name: "Dream Invasion",
        description:
          "Enter and command the dreams of others with far greater reach than a Nightmare",
        type: "active",
      },
      {
        name: "Spirit Body Projection",
        description: "Project your own spirit body to act apart from your flesh",
        type: "active",
      },
      {
        name: "Master of the Dark",
        description:
          "Command near-total dominion over darkness and the spirit world at night",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Marshal and command spirits as a warlock of the dark night",
      "Operate from concealment, directing your spirits rather than acting openly",
      "Guard your own soul against the spirits you bind",
    ],
    prerequisiteItems: [
      {
        name: "Spirit Warlock Potion Formula",
        description: "The recipe for the Sequence 5 Spirit Warlock potion",
        category: "potion-formula",
      },
      {
        name: "Source of Mad Dreams",
        description: "A portion of the Source of Mad Dreams, wellspring of delirium",
        category: "main-ingredient",
      },
      {
        name: "Spirit Nest",
        description: "One Spirit Nest, a hive that breeds and houses spirits",
        category: "main-ingredient",
      },
      {
        name: "Source of Mad Dreams Blood",
        description: "100 milliliters of blood drawn from the Source of Mad Dreams",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit Nest Vapor",
        description: "30 milliliters of gas vented from a Spirit Nest",
        category: "supplementary-ingredient",
      },
      {
        name: "A Soul About to Disperse",
        description: "A soul body on the verge of dissipating",
        category: "supplementary-ingredient",
      },
      {
        name: "Full-Moon Milk Tooth",
        description: "A milk tooth that fell out under a full moon",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Enter the spirit world in the flesh and rejoin your own key spirit-world reflection",
      requirements: [
        "Find a way to enter the spirit world bodily rather than as a spirit",
        "Locate and merge with your own key information mirrored there",
        "Consume the potion at the moment of reunion without losing yourself",
      ],
    },
  },
];

const tyrantSequences: Sequence[] = [
  {
    level: 9,
    name: "Sailor",
    classification: "Low",
    abilities: [
      {
        name: "Aquatic Affinity",
        description:
          "Submerge and move underwater with ease, swimming and diving like a sea creature",
        type: "passive",
      },
      {
        name: "Phantom Scales",
        description:
          "Illusory scales hidden under the skin make you slippery and hard to grasp",
        type: "passive",
      },
      {
        name: "Balance",
        description: "Keep perfect footing on a heaving deck as if on solid ground",
        type: "passive",
      },
      {
        name: "Physical Enhancement",
        description: "Outstanding bodily strength beyond an ordinary person",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Live by the sea and the storm — sail, swim, and brave rough water",
      "Give vent to your temper; do not swallow your anger meekly",
      "Test yourself against wind and wave at every chance",
    ],
    prerequisiteItems: [
      {
        name: "Sailor Potion Formula",
        description: "The recipe for the Sequence 9 Sailor potion",
        category: "potion-formula",
      },
      {
        name: "Storm-Petrel Heart",
        description: "The heart of a storm petrel, a seabird that thrives in gales",
        category: "main-ingredient",
      },
      {
        name: "Deep-Sea Lvoque Fish Blood",
        description: "30 milliliters of blood from a Deep-Sea Lvoque Fish",
        category: "main-ingredient",
      },
      {
        name: "Sea Salt Crystals",
        description: "5 grams of crystals evaporated from storm-tossed seawater",
        category: "supplementary-ingredient",
      },
      {
        name: "Brineweed Extract",
        description: "8 drops of extract from brineweed, a hardy coastal plant",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "60 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Folk of Rage",
    classification: "Low",
    abilities: [
      {
        name: "Wrath",
        description:
          "Channel mounting fury into raw strength — the angrier you grow, the more powerful you become",
        type: "active",
      },
      {
        name: "Raging Blow",
        description: "Unleash a wrath-fueled strike of overwhelming force",
        type: "active",
      },
      {
        name: "Storm Resilience",
        description:
          "Greatly enhanced toughness and endurance, especially amid wind and rain",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Let your anger run free — meet provocation with the fury of the storm",
      "Stand against the powerful; bow your head to no high-handed authority",
      "Throw yourself into the heart of wind, rain, and rough sea",
    ],
    prerequisiteItems: [
      {
        name: "Folk of Rage Potion Formula",
        description: "The recipe for the Sequence 8 Folk of Rage potion",
        category: "potion-formula",
      },
      {
        name: "Furious Sea-Ape Blood",
        description:
          "The blood of a Furious Sea-Ape, a brawny Beyonder beast of the coasts",
        category: "main-ingredient",
      },
      {
        name: "Thunder-Charged Coral",
        description: "A fragment of coral that crackles with stored lightning",
        category: "main-ingredient",
      },
      {
        name: "Raging Tide Foam",
        description: "30 milliliters of foam skimmed from a storm tide",
        category: "supplementary-ingredient",
      },
      {
        name: "Sea-Ape Hair",
        description: "7 strands of coarse hair from a Furious Sea-Ape",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "60 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Master your wrath in a true storm, turning rage into controlled power",
      requirements: [
        "Stand alone against a raging storm or violent sea",
        "Let your fury rise to its peak and channel it into a single working",
        "Hold your mind together as the rage crests, neither breaking nor losing control",
      ],
    },
  },
  {
    level: 7,
    name: "Seafarer",
    classification: "Mid",
    abilities: [
      {
        name: "Navigation",
        description:
          "Unerringly find your bearings at sea and read wind, current, and weather",
        type: "active",
      },
      {
        name: "Weather Sense",
        description:
          "Sense oncoming storms, squalls, and changes in the sea before they arrive",
        type: "passive",
      },
      {
        name: "Enhanced Memory",
        description: "Sharply heightened memory and mental acuity",
        type: "passive",
      },
      {
        name: "Water Resonance",
        description: "Draw strength and recovery from contact with the open sea",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Sail the open sea and command the respect of those who travel it",
      "Pit yourself against storm and tide as a master of the waters",
      "Carry the bearing of one born to wind and weather",
    ],
    prerequisiteItems: [
      {
        name: "Seafarer Potion Formula",
        description: "The recipe for the Sequence 7 Seafarer potion",
        category: "potion-formula",
      },
      {
        name: "Storm-Whale Pituitary Gland",
        description:
          "The pituitary gland of a Storm-Whale, a titanic Beyonder of the deep",
        category: "main-ingredient",
      },
      {
        name: "Tempest Sea-Serpent Spinal Fluid",
        description: "50 milliliters of spinal fluid from a Tempest Sea-Serpent",
        category: "main-ingredient",
      },
      {
        name: "Compass-Rose Coral Powder",
        description: "8 grams of powdered Compass-Rose Coral",
        category: "supplementary-ingredient",
      },
      {
        name: "Deep-Sea Pearl Dust",
        description: "5 grams of dust ground from deep-sea pearls",
        category: "supplementary-ingredient",
      },
      {
        name: "Aged Rum",
        description: "60 milliliters of aged rum",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Cross a deadly stretch of storm-wracked sea by your own power alone",
      requirements: [
        "Set out across waters known to wreck ships, in the teeth of a storm",
        "Navigate the passage relying solely on your own senses and command of the sea",
        "Reach the far shore having mastered both the storm and your own dread",
      ],
    },
  },
  {
    level: 6,
    name: "Wind-blessed",
    classification: "Mid",
    abilities: [
      {
        name: "Wind Manipulation",
        description:
          "Summon and command the wind — gusts, gales, and cutting wind-blades",
        type: "active",
      },
      {
        name: "Flight",
        description: "Ride the wind to glide and fly through the open air",
        type: "active",
      },
      {
        name: "Wind-blades",
        description: "Loose blades of compressed air that slice through armor and stone",
        type: "active",
      },
      {
        name: "Water Control",
        description: "Exert growing command over water alongside the wind",
        type: "active",
      },
    ],
    actingRequirements: [
      "Take to the skies and the storm winds as your true element",
      "Wield wind and water with a free and untrammeled temper",
      "Answer slights with the swift fury of a gale",
    ],
    prerequisiteItems: [
      {
        name: "Wind-blessed Potion Formula",
        description: "The recipe for the Sequence 6 Wind-blessed potion",
        category: "potion-formula",
      },
      {
        name: "Gale-Roc Wing Bone",
        description:
          "A wing bone from a Gale-Roc, a great bird that nests in the high winds",
        category: "main-ingredient",
      },
      {
        name: "Cyclone Heart Crystal",
        description: "The crystallised heart of a living cyclone-spirit",
        category: "main-ingredient",
      },
      {
        name: "Storm-Cloud Vapor",
        description: "30 milliliters of vapor drawn from a thunderhead",
        category: "supplementary-ingredient",
      },
      {
        name: "Gale-Roc Feather",
        description: "3 feathers from a Gale-Roc",
        category: "supplementary-ingredient",
      },
      {
        name: "Sky-Salt Powder",
        description: "10 grams of salt powder gathered from high mountain storms",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Ride a great storm to its heart and bend its winds to your will",
      requirements: [
        "Take flight into the body of a powerful storm",
        "Seize command of its winds and turn them where you choose",
        "Descend in command of the gale rather than scattered by it",
      ],
    },
  },
  {
    level: 5,
    name: "Ocean Songster",
    classification: "Mid",
    abilities: [
      {
        name: "Lightning Manipulation",
        description:
          "Call down and hurl lightning — bolts, arrows, and shattering strikes",
        type: "active",
      },
      {
        name: "Lightning Strike",
        description: "Concentrate the storm's charge into a single devastating discharge",
        type: "active",
      },
      {
        name: "Singing",
        description:
          "Sing songs of the sea that disable, command, or bewitch those who hear",
        type: "active",
      },
      {
        name: "Sovereign of Storms",
        description:
          "Command wind, water, and lightning together as near-absolute master of weather",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Reign over sea, sky, and storm as their singer and sovereign",
      "Sing the songs of the deep and let your wrath shake the heavens",
      "Brook no defiance; answer challenge with thunder",
    ],
    prerequisiteItems: [
      {
        name: "Ocean Songster Potion Formula",
        description: "The recipe for the Sequence 5 Ocean Songster potion",
        category: "potion-formula",
      },
      {
        name: "Thunder-Leviathan Vocal Cords",
        description:
          "The vocal cords of a Thunder-Leviathan, a sea-beast wreathed in lightning",
        category: "main-ingredient",
      },
      {
        name: "Storm Core of a Sea-Tyrant",
        description: "The storm-charged core left when a Sea-Tyrant is slain",
        category: "main-ingredient",
      },
      {
        name: "Thunder-Leviathan Blood",
        description: "100 milliliters of blood from a Thunder-Leviathan",
        category: "supplementary-ingredient",
      },
      {
        name: "Lightning-Fused Sand",
        description: "10 grams of fulgurite sand fused by a sea-storm's lightning",
        category: "supplementary-ingredient",
      },
      {
        name: "Siren-Song Pearl",
        description: "A pearl that hums with the song of the deep",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Raise and command a storm at sea by your song alone",
      requirements: [
        "Stand upon the open water and sing the storm into being",
        "Bind its wind, wave, and lightning to your voice",
        "Disperse the storm at your word, proving your mastery over it",
      ],
    },
  },
];

const doorSequences: Sequence[] = [
  {
    level: 9,
    name: "Apprentice",
    classification: "Low",
    abilities: [
      {
        name: "Door Opening",
        description:
          "Open a symbolic, incorporeal door to phase yourself through walls and obstacles",
        type: "active",
      },
      {
        name: "Unrestrained Movement",
        description:
          "Slip free of restraints and barriers; you are rarely cornered or held",
        type: "passive",
      },
      {
        name: "Spatial Intuition",
        description:
          "An instinct for the layout of space and the routes that lead out of it",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Travel and roam freely — never let yourself be tied to one place",
      "Probe doors, thresholds, and passages with restless curiosity",
      "Find the way out of any space you enter",
    ],
    prerequisiteItems: [
      {
        name: "Apprentice Potion Formula",
        description: "The recipe for the Sequence 9 Apprentice potion",
        category: "potion-formula",
      },
      {
        name: "Gem-Eating Worm",
        description: "One Gem-Eating Worm, a creature that devours precious stones",
        category: "main-ingredient",
      },
      {
        name: "Phantom Crystal",
        description: "One Phantom Crystal, a stone shot through with illusory light",
        category: "main-ingredient",
      },
      {
        name: "Goat's-Beard Grass Hydrosol",
        description: "10 drops of hydrosol distilled from goat's-beard grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Ancient Well Water",
        description: "90 milliliters of water drawn from an ancient well",
        category: "supplementary-ingredient",
      },
      {
        name: "Grave-Grown Flower",
        description: "Any single flower grown from a corpse",
        category: "supplementary-ingredient",
      },
      {
        name: "Spirit-Tainted Soil",
        description: "5 grams of soil contaminated by spirit-world creatures",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Trickmaster",
    classification: "Low",
    abilities: [
      {
        name: "Flash",
        description:
          "Blink a short distance through space, vanishing and reappearing nearby",
        type: "active",
      },
      {
        name: "Escape Trick",
        description:
          "Slip out of bindings, traps, and tight corners with spatial sleight",
        type: "active",
      },
      {
        name: "Object Manipulation",
        description:
          "Shift and manipulate objects at a distance through small spatial tricks",
        type: "active",
      },
      {
        name: "Elemental Trick",
        description: "Loose minor tricks of electric shock, freezing, or sudden gas",
        type: "active",
      },
    ],
    actingRequirements: [
      "Delight in movement and misdirection — make a performance of slipping away",
      "Keep wandering; a Trickmaster belongs to the road, not a room",
      "Treat every obstacle as a puzzle of space to be tricked open",
    ],
    prerequisiteItems: [
      {
        name: "Trickmaster Potion Formula",
        description: "The recipe for the Sequence 8 Trickmaster potion",
        category: "potion-formula",
      },
      {
        name: "Spirit-Eater Stomach Sac",
        description:
          "The stomach sac of a Spirit-Eater, a creature that consumes spirits",
        category: "main-ingredient",
      },
      {
        name: "Deep-Sea Garfish Blood",
        description: "20 milliliters of blood from a Deep-Sea Garfish",
        category: "main-ingredient",
      },
      {
        name: "Hornbeam Essential Oil",
        description: "5 milliliters of essential oil pressed from hornbeam",
        category: "supplementary-ingredient",
      },
      {
        name: "Thread-Ball Grass Powder",
        description: "10 grams of powdered thread-ball grass",
        category: "supplementary-ingredient",
      },
      {
        name: "Red Chestnut Bloom",
        description: "One fully open red chestnut flower",
        category: "supplementary-ingredient",
      },
      {
        name: "Pure Water",
        description: "80 milliliters of pure water",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Escape an inescapable confinement using only spatial tricks",
      requirements: [
        "Have yourself sealed in a bound and warded space with no ordinary exit",
        "Work free using Flash, Escape Trick, and spatial sleight alone",
        "Leave behind no sign of how the escape was made",
      ],
    },
  },
  {
    level: 7,
    name: "Astrologer",
    classification: "Mid",
    abilities: [
      {
        name: "Divination Arts",
        description:
          "Read the stars and the spirit world to divine the future and the hidden",
        type: "active",
      },
      {
        name: "Spirit Vision",
        description: "Perceive the spirit world and the traces left upon it",
        type: "active",
      },
      {
        name: "Anti-Divination",
        description: "Cloak yourself and your doings against the divination of others",
        type: "passive",
      },
      {
        name: "Spiritual Intuition",
        description: "A passive sense for danger and anomalies drawn from the stars",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Chart the stars and the spirit world; let curiosity drive your study",
      "Wander far in pursuit of secret knowledge and distant skies",
      "Keep your own path veiled even as you read the paths of others",
    ],
    prerequisiteItems: [
      {
        name: "Astrologer Potion Formula",
        description: "The recipe for the Sequence 7 Astrologer potion",
        category: "potion-formula",
      },
      {
        name: "Meteor Crystal",
        description: "A crystal condensed from fallen meteoric matter",
        category: "main-ingredient",
      },
      {
        name: "Lavos Squid Blood Crystal",
        description: "A crystallised lump of blood from a Lavos Squid",
        category: "main-ingredient",
      },
      {
        name: "Clematis Powder",
        description: "10 grams of powdered clematis",
        category: "supplementary-ingredient",
      },
      {
        name: "Withered Grapevine",
        description: "One length of withered grapevine",
        category: "supplementary-ingredient",
      },
      {
        name: "Octopus Eyes",
        description: "A pair of eyes from any kind of octopus",
        category: "supplementary-ingredient",
      },
      {
        name: "Strong Liquor",
        description: "80 milliliters of strong liquor",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Chart a true and hidden course of the stars to divine a sealed secret",
      requirements: [
        "Map the stars as they truly stand, beyond ordinary astronomy",
        "Use the chart to divine a secret guarded against divination",
        "Record the working without alerting what you have spied upon",
      ],
    },
  },
  {
    level: 6,
    name: "Scribe",
    classification: "Mid",
    abilities: [
      {
        name: "Record",
        description:
          "Record the Beyonder power of another into yourself, to be replayed at need",
        type: "active",
      },
      {
        name: "Recorded Replay",
        description: "Loose a recorded ability as if it were your own, once stored",
        type: "active",
      },
      {
        name: "Spatial Storage",
        description: "Tuck objects and writings away into a small folded pocket of space",
        type: "active",
      },
      {
        name: "Perfect Recall",
        description: "Flawless memory of everything you have recorded and read",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Record, catalogue, and preserve — knowledge and power alike",
      "Roam widely to gather what is worth recording",
      "Guard your records and the spaces you fold them into",
    ],
    prerequisiteItems: [
      {
        name: "Scribe Potion Formula",
        description: "The recipe for the Sequence 6 Scribe potion",
        category: "potion-formula",
      },
      {
        name: "Complete Asman Brain",
        description:
          "One complete brain of an Asman, a knowledge-hoarding spirit-world being",
        category: "main-ingredient",
      },
      {
        name: "Cursed Object of an Ancient Wraith",
        description: "A cursed object left behind by an ancient wraith",
        category: "main-ingredient",
      },
      {
        name: "Diary Older Than Twenty-Two Years",
        description: "Three pages of a diary more than twenty-two years old",
        category: "supplementary-ingredient",
      },
      {
        name: "Quicksilver",
        description: "10 milliliters of quicksilver",
        category: "supplementary-ingredient",
      },
      {
        name: "Honeysuckle Essential Oil",
        description: "10 drops of honeysuckle essential oil",
        category: "supplementary-ingredient",
      },
      {
        name: "Three Waters",
        description: "30 milliliters each of seawater, lake water, and glacier water",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Record and faithfully replay the power of a hostile Beyonder",
      requirements: [
        "Witness and record a Beyonder ability in the midst of a true conflict",
        "Replay the recorded power exactly as its owner wielded it",
        "Keep your store of records intact through the ordeal",
      ],
    },
  },
  {
    level: 5,
    name: "Traveler",
    classification: "Mid",
    abilities: [
      {
        name: "Traveling",
        description:
          "Open doors across great distances and travel through the spirit world",
        type: "active",
      },
      {
        name: "Blink",
        description: "Teleport yourself, and what you carry, across line of sight",
        type: "active",
      },
      {
        name: "Positioning",
        description: "Fix and recall spatial coordinates, returning to them at will",
        type: "active",
      },
      {
        name: "Invisible Hand",
        description: "Reach through folded space to act on things far from your body",
        type: "active",
      },
    ],
    actingRequirements: [
      "Travel without limit — let no distance or border hold you",
      "Map the spirit world's far places and the doors between them",
      "Carry your curiosity to every threshold you can reach",
    ],
    prerequisiteItems: [
      {
        name: "Traveler Potion Formula",
        description: "The recipe for the Sequence 5 Traveler potion",
        category: "potion-formula",
      },
      {
        name: "Wandering Hide",
        description: "The Wandering Hide, the cast-off skin of a spirit-world rover",
        category: "main-ingredient",
      },
      {
        name: "Shadowless Demon Wolf Heart",
        description: "The heart of a Shadowless Demon Wolf, a beast that casts no shadow",
        category: "main-ingredient",
      },
      {
        name: "Trapped-Ghost Residual Powder",
        description: "10 grams of powder left by a trapped, dispersed ghost",
        category: "supplementary-ingredient",
      },
      {
        name: "Lemon Balm Powder",
        description: "10 grams of powdered lemon balm",
        category: "supplementary-ingredient",
      },
      {
        name: "Star Map in Spiritual Blood",
        description: "A star map drawn in spiritually-charged blood",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadowless Demon Wolf Blood",
        description: "80 milliliters of blood from a Shadowless Demon Wolf",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Anchor a network of waypoints across the spirit world to travel freely between them",
      requirements: [
        "Establish four distinct, far-flung coordinates deep within the spirit world",
        "Bind them into a single network you can traverse at will",
        "Travel the full circuit and return to your starting point unharmed",
      ],
    },
  },
];

const errorSequences: Sequence[] = [
  {
    level: 9,
    name: "Marauder",
    classification: "Low",
    abilities: [
      {
        name: "Theft",
        description:
          "Steal physical items with supernatural deftness — your hands take what they reach for",
        type: "active",
      },
      {
        name: "Agile Hands",
        description: "Extraordinary finger dexterity for sleight of hand and fine work",
        type: "passive",
      },
      {
        name: "Superior Observation",
        description: "Sense at a glance where valuables are hidden within reach",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steal and pilfer as a calling — let theft become second nature",
      "Trick and deceive your marks; never take by force what guile can lift",
      "Slip away unseen with what you have taken",
    ],
    prerequisiteItems: [
      {
        name: "Marauder Potion Formula",
        description: "The recipe for the Sequence 9 Marauder potion",
        category: "potion-formula",
      },
      {
        name: "Blood-Spotted Black Mosquito",
        description:
          "One Blood-Spotted Black Mosquito, a supernatural blood-feeding insect",
        category: "main-ingredient",
      },
      {
        name: "Candle-Eating Spirit Core",
        description: "The core of a Candle-Eating Spirit, a creature that devours flame",
        category: "main-ingredient",
      },
      {
        name: "Others' Blood",
        description: "100 milliliters of blood taken from other people",
        category: "supplementary-ingredient",
      },
      {
        name: "Nail Fragments",
        description: "Nine nail fragments, each from a different person",
        category: "supplementary-ingredient",
      },
      {
        name: "Sapphire",
        description: "One sapphire",
        category: "supplementary-ingredient",
      },
      {
        name: "Vervain Powder",
        description: "10 grams of powdered vervain",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Swindler",
    classification: "Low",
    abilities: [
      {
        name: "Eloquence",
        description: "Spin words that beguile, persuade, and disarm those who listen",
        type: "active",
      },
      {
        name: "Charm",
        description:
          "Project a charisma that lowers the guard and wins the trust of marks",
        type: "active",
      },
      {
        name: "Thought Misdirection",
        description:
          "Steer a target's attention and assumptions where you wish them to go",
        type: "active",
      },
      {
        name: "Theft",
        description: "Steal not only objects but small advantages and openings",
        type: "active",
      },
    ],
    actingRequirements: [
      "Con and beguile — let your tongue do the stealing",
      "Live by trickery; build and burn false trust as the scheme demands",
      "Vanish before the deception is discovered",
    ],
    prerequisiteItems: [
      {
        name: "Swindler Potion Formula",
        description: "The recipe for the Sequence 8 Swindler potion",
        category: "potion-formula",
      },
      {
        name: "Human-Faced Pitcher Plant",
        description:
          "One Human-Faced Pitcher Plant, a carnivorous flower bearing a human visage",
        category: "main-ingredient",
      },
      {
        name: "Charm-Swarm Larva",
        description: "One larva from a Charm-Swarm, insects that bewitch the mind",
        category: "main-ingredient",
      },
      {
        name: "Pure Water",
        description: "100 milliliters of pure water",
        category: "supplementary-ingredient",
      },
      {
        name: "Others' Tears",
        description: "20 milliliters of tears taken from other people",
        category: "supplementary-ingredient",
      },
      {
        name: "Lapis Lazuli",
        description: "One lapis lazuli",
        category: "supplementary-ingredient",
      },
      {
        name: "White Chestnut Balm",
        description: "10 grams of white chestnut balm",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Carry off a grand confidence scheme by guile without ever being unmasked",
      requirements: [
        "Construct an elaborate deception against a wary mark",
        "See the scheme through to its profitable end using words and misdirection alone",
        "Withdraw before the swindle is ever uncovered",
      ],
    },
  },
  {
    level: 7,
    name: "Cryptologist",
    classification: "Mid",
    abilities: [
      {
        name: "Decryption",
        description:
          "Unravel ciphers, codes, and hidden meanings with supernatural insight",
        type: "active",
      },
      {
        name: "Thought Theft",
        description: "Steal fragments of thought and intention from an unguarded mind",
        type: "active",
      },
      {
        name: "Superior Observation",
        description: "Read the smallest tells and the patterns others overlook",
        type: "passive",
      },
      {
        name: "Cipher Mind",
        description:
          "Hold and manipulate vast webs of code and secret knowledge in memory",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Break codes and steal secrets; let no cipher stand against you",
      "Trick understanding from the guarded and the unwilling",
      "Keep your own methods encrypted and unknowable",
    ],
    prerequisiteItems: [
      {
        name: "Cryptologist Potion Formula",
        description: "The recipe for the Sequence 7 Cryptologist potion",
        category: "potion-formula",
      },
      {
        name: "Sphinx Brain",
        description: "The brain of a Sphinx, a riddling Beyonder beast",
        category: "main-ingredient",
      },
      {
        name: "Charm-Swarm Adult",
        description: "One adult from a Charm-Swarm",
        category: "main-ingredient",
      },
      {
        name: "Sphinx Blood",
        description: "80 milliliters of blood from a Sphinx",
        category: "supplementary-ingredient",
      },
      {
        name: "Charm-Swarm Mucus",
        description: "10 drops of mucus left by a Charm-Swarm",
        category: "supplementary-ingredient",
      },
      {
        name: "Moonstone",
        description: "One moonstone",
        category: "supplementary-ingredient",
      },
      {
        name: "Wild Rose",
        description: "One wild rose",
        category: "supplementary-ingredient",
      },
      {
        name: "A Cipher of Your Own Design",
        description: "A set of codes you have devised yourself, written on paper",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Crack an unbreakable cipher and steal the secret it guards",
      requirements: [
        "Obtain a code believed to be beyond breaking",
        "Decrypt it and lift the protected secret without the owner's knowledge",
        "Leave the cipher seemingly untouched",
      ],
    },
  },
  {
    level: 6,
    name: "Prometheus",
    classification: "Mid",
    abilities: [
      {
        name: "Ability Theft",
        description:
          "Steal the Beyonder ability of another, taking their power as your own",
        type: "active",
      },
      {
        name: "Fire of Knowledge",
        description:
          "Bestow or kindle stolen power and knowledge in others, like stolen fire",
        type: "active",
      },
      {
        name: "Mental Resistance",
        description:
          "Strong resistance to mental intrusion and the imprints of stolen powers",
        type: "passive",
      },
      {
        name: "Superior Observation",
        description: "Perceive the abilities and weaknesses worth stealing in a foe",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Steal power itself — take the abilities of Beyonders as a thief takes fire",
      "Deceive and outwit those stronger than you to rob them of their strength",
      "Share or hoard your stolen fire as cunning dictates",
    ],
    prerequisiteItems: [
      {
        name: "Prometheus Potion Formula",
        description: "The recipe for the Sequence 6 Prometheus potion",
        category: "potion-formula",
      },
      {
        name: "Crystal Threadworm",
        description:
          "One Crystal Threadworm, a worm grown from crystallised spirit-matter",
        category: "main-ingredient",
      },
      {
        name: "Robed Phantom Attachment",
        description:
          "An attachment-object left by a Robed Phantom, a cloaked wandering spirit",
        category: "main-ingredient",
      },
      {
        name: "Freshly Stolen Fine Wine",
        description: "100 milliliters of fine wine that has just been stolen",
        category: "supplementary-ingredient",
      },
      {
        name: "Robed Phantom Residual Powder",
        description: "10 grams of powder left by a Robed Phantom",
        category: "supplementary-ingredient",
      },
      {
        name: "Citrine",
        description: "One citrine",
        category: "supplementary-ingredient",
      },
      {
        name: "Larch Essential Oil",
        description: "10 drops of larch essential oil",
        category: "supplementary-ingredient",
      },
      {
        name: "A Source of Fire",
        description: "One kindling source of fire",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Steal a Beyonder's signature power in the heat of conflict and wield it",
      requirements: [
        "Confront a Beyonder and pry loose their signature ability",
        "Bind the stolen power into yourself as if it had always been yours",
        "Withstand the imprint of its former owner without losing your self",
      ],
    },
  },
  {
    level: 5,
    name: "Dream Stealer",
    classification: "Mid",
    abilities: [
      {
        name: "Disguise",
        description:
          "Steal an identity at the level of heavenly mysteries, becoming another in the eyes of fate",
        type: "active",
      },
      {
        name: "Thought Usurpation",
        description: "Seize and supplant the thoughts and intentions of a target",
        type: "active",
      },
      {
        name: "Dream Intrusion",
        description: "Slip into the dreams of others to steal what they hold dear within",
        type: "active",
      },
      {
        name: "Theft of Mysteries",
        description:
          "Steal increasingly abstract things — ideas, roles, and concealed truths",
        type: "active",
      },
    ],
    actingRequirements: [
      "Steal identities, dreams, and ideas — theft now reaches beyond the material",
      "Deceive even fate; play the villain or hidden hand in others' dreams",
      "Wear stolen selves without losing the thread of your own",
    ],
    prerequisiteItems: [
      {
        name: "Dream Stealer Potion Formula",
        description: "The recipe for the Sequence 5 Dream Stealer potion",
        category: "potion-formula",
      },
      {
        name: "Dream-Eating Rat Heart",
        description: "The heart of a Dream-Eating Rat, a vermin that gnaws on dreams",
        category: "main-ingredient",
      },
      {
        name: "Spirit of Fallen Aura",
        description: "The spirit of a Fallen Aura, the lingering essence of depravity",
        category: "main-ingredient",
      },
      {
        name: "Dream-Eating Rat Blood",
        description: "30 milliliters of blood from a Dream-Eating Rat",
        category: "supplementary-ingredient",
      },
      {
        name: "Despiritualized Fallen Aura",
        description: "30 milliliters of Fallen Aura drained of its spirituality",
        category: "supplementary-ingredient",
      },
      {
        name: "Celestite",
        description: "One celestite",
        category: "supplementary-ingredient",
      },
      {
        name: "Lavender Hydrosol",
        description: "10 drops of lavender hydrosol",
        category: "supplementary-ingredient",
      },
      {
        name: "Tears of Broken Dreams",
        description: "50 milliliters of another's tears shed over a shattered ideal",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Become a recurring figure in the dreams of many, then steal away with what they hold dear",
      requirements: [
        "Take a leading role in the unconscious dreams of at least thirty people",
        "Ensure those dreams are unfolding at the moment you consume the potion",
        "Steal from within the dreams without waking the dreamers to your theft",
      ],
    },
  },
];

const hangedManSequences: Sequence[] = [
  {
    level: 9,
    name: "Secrets Suppliant",
    classification: "Low",
    abilities: [
      {
        name: "Mysticism Knowledge",
        description:
          "Innate knowledge of sacrifices and ritualistic magic, woven into the potion itself",
        type: "passive",
      },
      {
        name: "Ritualistic Magic",
        description: "Perform binding rituals and divination drawn from secret entities",
        type: "active",
      },
      {
        name: "High Spirituality",
        description: "Heightened spiritual perception and intuition for the hidden",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Seek out forbidden secrets and offer the sacrifices the rites demand",
      "Embrace self-denial and burden; give up comfort in pursuit of knowledge",
      "Bear the distortions of dark knowledge without surrendering your humanity",
    ],
    prerequisiteItems: [
      {
        name: "Secrets Suppliant Potion Formula",
        description: "The recipe for the Sequence 9 Secrets Suppliant potion",
        category: "potion-formula",
      },
      {
        name: "Shadow-Touched Toad Heart",
        description:
          "The heart of a Shadow-Touched Toad, a creature steeped in dark ritual",
        category: "main-ingredient",
      },
      {
        name: "Sacrificial Altar Ash",
        description: "Ash gathered from a stone used in blood sacrifice",
        category: "main-ingredient",
      },
      {
        name: "Black Goat's Blood",
        description: "30 milliliters of blood from a sacrificed black goat",
        category: "supplementary-ingredient",
      },
      {
        name: "Mandrake Root Powder",
        description: "9 grams of powdered mandrake root",
        category: "supplementary-ingredient",
      },
      {
        name: "Graveyard Wormwood Oil",
        description: "7 drops of oil pressed from wormwood grown in a graveyard",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: undefined,
  },
  {
    level: 8,
    name: "Listener",
    classification: "Low",
    abilities: [
      {
        name: "Listen",
        description:
          "Hear whispers carried on shadow and wind — secrets, intentions, and distant words",
        type: "active",
      },
      {
        name: "Whisper",
        description: "Send words that worm into a target's mind to unsettle or mislead",
        type: "active",
      },
      {
        name: "High Spirituality",
        description: "Greatly heightened spiritual sensitivity to the unseen",
        type: "passive",
      },
    ],
    actingRequirements: [
      "Listen for the secrets others bury; gather whispered truths",
      "Give up your own voice in the world's affairs — observe and abstain",
      "Carry the weight of what you hear without letting it corrupt you",
    ],
    prerequisiteItems: [
      {
        name: "Listener Potion Formula",
        description: "The recipe for the Sequence 8 Listener potion",
        category: "potion-formula",
      },
      {
        name: "Whispering Shadow-Bat Ears",
        description:
          "The ears of a Whispering Shadow-Bat, a creature that hears all secrets",
        category: "main-ingredient",
      },
      {
        name: "Cursed Confessional Wood",
        description: "A fragment of wood from a confessional steeped in secrets",
        category: "main-ingredient",
      },
      {
        name: "Nightshade Hydrosol",
        description: "10 drops of nightshade hydrosol",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadow-Bat Membrane",
        description: "A strip of wing membrane from a Whispering Shadow-Bat",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Candle Wax",
        description: "13 grams of wax from a black ritual candle",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Keep a vigil of silence and listening until a guarded secret reveals itself",
      requirements: [
        "Hold a long vigil in silence, denying yourself speech and comfort",
        "Listen until the shadows yield a secret hidden from all others",
        "Set down the secret faithfully without acting on it for gain",
      ],
    },
  },
  {
    level: 7,
    name: "Shadow Ascetic",
    classification: "Mid",
    abilities: [
      {
        name: "Shadow Summon",
        description: "Call shadows into form to serve, scout, and strike",
        type: "active",
      },
      {
        name: "Shadow Manipulation",
        description: "Shape, extend, and command shadows around you",
        type: "active",
      },
      {
        name: "Shadow Lurking",
        description: "Sink into shadow to move unseen and lie in wait",
        type: "active",
      },
      {
        name: "Shadow Curse",
        description: "Lay curses carried through a target's own shadow",
        type: "active",
      },
    ],
    actingRequirements: [
      "Live as an ascetic of shadow — deny the flesh and dwell in self-imposed hardship",
      "Master the shadows through discipline and sacrifice, never indulgence",
      "Take on burdens others refuse, and ask nothing in return",
    ],
    prerequisiteItems: [
      {
        name: "Shadow Ascetic Potion Formula",
        description: "The recipe for the Sequence 7 Shadow Ascetic potion",
        category: "potion-formula",
      },
      {
        name: "Shadow-Crawler Heart",
        description: "The heart of a Shadow-Crawler, a beast that lives within shadows",
        category: "main-ingredient",
      },
      {
        name: "Penitent's Hair Shirt",
        description: "A scrap of a hair shirt worn by a true penitent ascetic",
        category: "main-ingredient",
      },
      {
        name: "Shadow-Crawler Blood",
        description: "70 milliliters of blood from a Shadow-Crawler",
        category: "supplementary-ingredient",
      },
      {
        name: "Black Tourmaline Powder",
        description: "10 grams of powdered black tourmaline",
        category: "supplementary-ingredient",
      },
      {
        name: "Fasting Salt",
        description: "A pinch of salt blessed through ritual fasting",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Endure a trial of self-denial in darkness while commanding the shadows",
      requirements: [
        "Withdraw into darkness and deny yourself food, light, and ease",
        "Master your summoned shadows through the privation rather than despite it",
        "Emerge having sacrificed comfort without sacrificing your reason",
      ],
    },
  },
  {
    level: 6,
    name: "Rose Bishop",
    classification: "Mid",
    abilities: [
      {
        name: "Flesh and Blood Magic",
        description: "Work magic through flesh and blood — your own or another's",
        type: "active",
      },
      {
        name: "Flesh and Blood Servants",
        description: "Shape servants and constructs from flesh to do your bidding",
        type: "active",
      },
      {
        name: "Flesh Softening",
        description: "Soften and reshape flesh to slip through gaps or absorb blows",
        type: "passive",
      },
      {
        name: "Blood Curse",
        description: "Lay curses through a victim's flesh and blood",
        type: "active",
      },
    ],
    actingRequirements: [
      "Offer flesh and blood in sacrifice — your own offerings first of all",
      "Take up the responsibility of the rite, bearing its cost willingly",
      "Hold to your vows even as the flesh-magic tempts you toward depravity",
    ],
    prerequisiteItems: [
      {
        name: "Rose Bishop Potion Formula",
        description: "The recipe for the Sequence 6 Rose Bishop potion",
        category: "potion-formula",
      },
      {
        name: "Blood-Rose Heart",
        description: "The heart of a Blood-Rose, a flower that feeds on living blood",
        category: "main-ingredient",
      },
      {
        name: "Flesh-Weaver Spinal Fluid",
        description:
          "The spinal fluid of a Flesh-Weaver, a creature that knits living flesh",
        category: "main-ingredient",
      },
      {
        name: "Sacrificial Blood",
        description: "90 milliliters of blood freely given in sacrifice",
        category: "supplementary-ingredient",
      },
      {
        name: "Blood-Rose Petals",
        description: "7 crimson petals from a Blood-Rose",
        category: "supplementary-ingredient",
      },
      {
        name: "Carmine Sandalwood Oil",
        description: "10 drops of carmine sandalwood oil",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description: "Complete a great flesh-and-blood rite demanding genuine sacrifice",
      requirements: [
        "Prepare a flesh-and-blood working that cannot be done without true sacrifice",
        "Offer up the required cost from your own flesh and blood, not only another's",
        "Complete the rite without letting it corrupt your purpose",
      ],
    },
  },
  {
    level: 5,
    name: "Shepherd",
    classification: "Mid",
    abilities: [
      {
        name: "Grazing",
        description:
          "Graze upon souls and spirits, devouring a portion of their power to fuel your own",
        type: "active",
      },
      {
        name: "Flesh and Blood Magic",
        description: "Command greatly amplified flesh-and-blood and shadow magic",
        type: "active",
      },
      {
        name: "Devouring",
        description:
          "Consume spirits and flesh to grow your dominion and replenish yourself",
        type: "active",
      },
      {
        name: "Shepherd's Flock",
        description: "Marshal a flock of shadow- and flesh-servants bound to your will",
        type: "active",
      },
    ],
    actingRequirements: [
      "Shepherd the souls and shadows in your keeping, bearing responsibility for them",
      "Sacrifice and deny yourself for the sake of the flock you have gathered",
      "Resist the pull toward sin and degeneration that the power invites",
    ],
    prerequisiteItems: [
      {
        name: "Shepherd Potion Formula",
        description: "The recipe for the Sequence 5 Shepherd potion",
        category: "potion-formula",
      },
      {
        name: "Soul-Grazing Beast Stomach",
        description: "The stomach of a Soul-Grazing Beast, which feeds upon souls",
        category: "main-ingredient",
      },
      {
        name: "Degenerate Shepherd Crystal",
        description:
          "The spirit-crystal of a Degenerate Shepherd, a fallen flesh-magic spirit",
        category: "main-ingredient",
      },
      {
        name: "Sacrificed Soul",
        description: "A soul freely surrendered in sacrifice",
        category: "supplementary-ingredient",
      },
      {
        name: "Soul-Grazing Beast Blood",
        description: "100 milliliters of blood from a Soul-Grazing Beast",
        category: "supplementary-ingredient",
      },
      {
        name: "Shadow-Steeped Soil",
        description: "17 grams of soil steeped in a Degenerate Shepherd's shadow",
        category: "supplementary-ingredient",
      },
      {
        name: "Crimson Tree Sap",
        description: "10 drops of sap from a crimson flesh-tree",
        category: "supplementary-ingredient",
      },
    ],
    advancementRitual: {
      description:
        "Gather a flock of souls and sustain them through your own sacrifice without falling to depravity",
      requirements: [
        "Draw a number of bound souls and spirits into your keeping",
        "Sustain and shepherd them by grazing and sacrifice rather than mere devouring",
        "Hold your purpose against the depravity the power presses upon you",
      ],
    },
  },
];

export const FOOL_PATHWAY: Pathway = {
  id: 1,
  name: "Fool",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [8, 7],
  sequences: foolSequences,
};

export const VISIONARY_PATHWAY: Pathway = {
  id: 2,
  name: "Visionary",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [3, 6, 9],
  sequences: visionarySequences,
};

export const SUN_PATHWAY: Pathway = {
  id: 3,
  name: "Sun",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 6, 9],
  sequences: sunSequences,
};

export const DEATH_PATHWAY: Pathway = {
  id: 4,
  name: "Death",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [5],
  sequences: deathSequences,
};

// Darkness, Death, and Twilight Giant make up the Eternal Darkness group; only
// Darkness and Death are implemented, so they neighbor each other.
export const DARKNESS_PATHWAY: Pathway = {
  id: 5,
  name: "Darkness",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [4],
  sequences: darknessSequences,
};

// Visionary, Sun, Tyrant, White Tower, and Hanged Man make up the God Almighty
// group. Of the implemented members, all four neighbor one another within it.
export const TYRANT_PATHWAY: Pathway = {
  id: 6,
  name: "Tyrant",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 3, 9],
  sequences: tyrantSequences,
};

// Fool, Error, and Door make up the Lord of the Mysteries (Sefirah Castle)
// group — each neighbors the other two.
export const DOOR_PATHWAY: Pathway = {
  id: 7,
  name: "Door",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [1, 8],
  sequences: doorSequences,
};

export const ERROR_PATHWAY: Pathway = {
  id: 8,
  name: "Error",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [1, 7],
  sequences: errorSequences,
};

export const HANGED_MAN_PATHWAY: Pathway = {
  id: 9,
  name: "Hanged Man",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2, 3, 6],
  sequences: hangedManSequences,
};

export const ALL_PATHWAYS: Pathway[] = [
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
  DARKNESS_PATHWAY,
  TYRANT_PATHWAY,
  DOOR_PATHWAY,
  ERROR_PATHWAY,
  HANGED_MAN_PATHWAY,
];

export function getPathway(id: number): Pathway | undefined {
  return ALL_PATHWAYS.find((p) => p.id === id);
}

export function getSequence(pathwayId: number, level: number): Sequence | undefined {
  return getPathway(pathwayId)?.sequences.find((s) => s.level === level);
}

export function areNeighboringPathways(a: number, b: number): boolean {
  const pathway = getPathway(a);
  if (!pathway) return false;
  return pathway.neighboringPathways.includes(b);
}
