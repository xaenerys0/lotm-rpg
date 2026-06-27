// AUTO-GENERATED — do not edit by hand.
//
// Source: corpus/wiki Module:Sequence/standard (the committed Fandom dump).
// Regenerate with: pnpm rag:advancement-canon
//
// The canon main-ingredient MATERIALS for each rung (the monster materials a
// potion's primary main ingredient is drawn from), cleaned of wiki cruft. Only
// the rungs the wiki documents a material for appear; the rest take the canon
// "Or a {role} Beyonder Characteristic" option. The rules engine overlays the
// PRIMARY (first) material as the rung's single main ingredient (the others are
// canon alternatives, surfaced in the item description).

/** pathwayId -> sequence level (9-1) -> the canon main-ingredient materials. */
export const MAIN_INGREDIENTS: Record<number, Record<number, string[]>> = {
  1: {
    9: ["Lavos Squid's Blood", "Stellar Aqua Crystal"],
    8: ["Hornacis Gray Mountain Goat Horn", "Human-Faced Rose Complete Stalk"],
    7: [
      "True Root of a Mist Treant",
      "The spinal fluid of a Dark Patterned Black Panther",
    ],
    6: [
      "Mutated pituitary gland of a Thousand-faced Hunter",
      "Human-Skined Shadow's Characteristic",
    ],
    5: ["Dust of Ancient Wraiths", "Core crystal of a Six-Winged Gargoyle"],
    4: ["Bizarro Bane's Main Eye", "True Soul Body of a Spirit World Plunderer"],
    3: ["Hound of Fulgrim pair of eyes", "Demonic Wolf of Fog's Transformed Heart"],
    2: ["Heart of a Dark Demonic Wolf"],
  },
  2: {
    9: ["Matured Manhal Fish's Eyeball", "Goat-horned blackfish blood"],
    8: ["Rainbow Salamander's complete pituitary gland", "Farsman Rabbit's spinal fluid"],
    7: ["Fruit of the Tree of Elders", "Eyes from a Mirror Dragon"],
    6: [
      "Black-hunting Giant Lizard's spinal fluid",
      "Fruit of an Illusory Chime Tree",
      "Pituitary gland of an adolescent Mind Dragon",
    ],
    5: [
      "Dream Catcher's Heart",
      "Mind Illusion Crystal",
      "Adult mind dragon's complete brain",
    ],
    4: ["Complete brain of an Elderly Mind Dragon", "Crystalline heart of a Tree Mentor"],
    3: ["The crystalline heart of the Treant King"],
  },
  3: {
    9: [
      "Crystal Sunflower",
      "Adult Flint Bird's Tail Feather",
      "Fire Bird's tail feather",
      "Siren Rock",
      "Singing Sunflower",
    ],
    8: [
      "Brilliance Rock",
      "Powder of Dazzling Soul",
      "Blood of a Mirror Hedgehog",
      "Heart of a Magma Titan",
    ],
    7: ["Red comb of a Dawn Rooster", "Fruit of a Radiance Spirit Pact Tree"],
    6: ["Crystalized roots of the Tree of Elders", "Feathers of a Spirit Pact Bird"],
    5: ["Red comb of a King of Dawn Roosters", "Pure White Brilliant Rock"],
    4: [
      "Sun Divine Bird's tail feathers",
      "Holy Brilliance Rock",
      "Golden blood from Sequence 0: Sun",
    ],
  },
  6: {
    9: ["Murloc's bladder"],
    6: [
      "Crystalline feathers of a Blue Shadow Falcon",
      "Dragon-Eyed Sea Condor eyeballs",
    ],
  },
  7: {
    9: ["Gem-Devouring Worm", "Illusion Crystal"],
    8: ["Stomach pouch of a Spirit Eater", "Deep Sea Marlin's blood"],
    7: ["Meteorite Crystal", "Lavos Squid's Crystallized Blood"],
    6: ["Complete brain of an Asmann", "Cursed artifacts of an ancient wraith"],
  },
  12: {
    8: ["Pair of Terror Demon Worm's eyes", "Silver War Bear's right palm"],
    7: ["Horn of a Flash-patterned Black Snake", "Dust of a Lake Spirit"],
  },
  13: {
    8: ["Grass of Madness", "Core horn crystal of a Land Rhinoceros"],
    7: ["Weeping Infant Flower", "Strange-faced Cannabis Crystal"],
  },
  14: {
    7: ["Fire Salamander gland", "Magma Elf core"],
    6: ["Black Hunting Spider Composite Eyes", "Sphinx Brain"],
    5: ["Gray Demonic Wolf's front claws", "Forest Hunter's tongue"],
    4: ["Magma Giant's core", "Stone of Catastrophe"],
    3: ["Heart of a Bipolar Centaur", "Core of a War Comet"],
    2: ["Skull of a Weather Giant", "Core of a Mist Jellyfish"],
  },
  15: {
    9: ["Shadow Poison Flower", "Serpent-Bodied Monster Bird"],
    8: ["Demon Throat Honeyguide's heart", "Dark Prowler's poison sac"],
    7: ["Abyss Demonic Fish Blood", "Agate Pacock Egg"],
    6: ["Succubus eyes", "Black Widow Spider Silk Gland"],
    5: ["Head of a Flower-Faced Bat", "Gallbladder of a Two-Tailed Black Snake"],
    4: ["Plague Mother Serpent's Venom Sac", "Silver Hunter's Crystal"],
    3: ["Heart of a Mirror God", "Gorgon eyes"],
  },
  17: {
    9: ["Horn of an adult Flying Unicorn", "Royal Jellyfish's venom crystal"],
    8: ["Spring of the Elves Marrow Crystal"],
  },
};
