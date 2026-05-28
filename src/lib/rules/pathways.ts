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

export const FOOL_PATHWAY: Pathway = {
  id: 1,
  name: "Fool",
  group: "mysteries",
  sefirah: "Sefirah Castle",
  neighboringPathways: [],
  sequences: foolSequences,
};

export const VISIONARY_PATHWAY: Pathway = {
  id: 2,
  name: "Visionary",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [3],
  sequences: visionarySequences,
};

export const SUN_PATHWAY: Pathway = {
  id: 3,
  name: "Sun",
  group: "god-almighty",
  sefirah: "Chaos Sea",
  neighboringPathways: [2],
  sequences: sunSequences,
};

export const DEATH_PATHWAY: Pathway = {
  id: 4,
  name: "Death",
  group: "eternal-darkness",
  sefirah: "River of Eternal Darkness",
  neighboringPathways: [],
  sequences: deathSequences,
};

export const ALL_PATHWAYS: Pathway[] = [
  FOOL_PATHWAY,
  VISIONARY_PATHWAY,
  SUN_PATHWAY,
  DEATH_PATHWAY,
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
