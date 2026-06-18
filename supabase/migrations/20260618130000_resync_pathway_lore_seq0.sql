-- Resync the thirteen pathway-overview lore_entries with the canonical TS
-- source after issue #99 Part A completed Seq 4-1/0 for these pathways.
-- The earlier seed (20260613030000) predates the completion: it still names
-- only Seq 9-5, carries the pre-reconciliation Demoness names, and under-counts
-- tokens. lore_entries is the canonical-from-TS mirror (src/lib/lore/pathway-*.ts);
-- this UPDATE brings the rows back in sync (idempotent — keyed by slug).

update public.lore_entries set
  content = 'The White Tower pathway is one of the twenty-two pathways of the Beyonder world, belonging to the God Almighty family of pathways. Its Beyonders walk the road of reason, deduction, and the unveiling of secrets through scholarship and mysticism. From the lowest rung its sequences progress Reader (Sequence 9), Student of Ratiocination (8), Detective (7), Polymath (6), and Mysticism Magister (Sequence 5); its Saint and demigod rungs continue Prophet (Sequence 4), Cognizer (3), Wisdom Angel (2), and Omniscient Eye (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title White Tower (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 220
where slug = 'white-tower-pathway-overview';

update public.lore_entries set
  content = 'The Twilight Giant pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Eternal Darkness family of pathways. Its Beyonders walk the road of martial prowess, weapons mastery, and the towering strength of giants. From the lowest rung its sequences progress Warrior (Sequence 9), Pugilist (8), Weapon Master (7), Dawn Paladin (6), and Guardian (Sequence 5); its Saint and demigod rungs continue Demon Hunter (Sequence 4), Silver Knight (3), Glory (2), and Hand of God (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Twilight Giant (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 215
where slug = 'twilight-giant-pathway-overview';

update public.lore_entries set
  content = 'The Justiciar pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Order family of pathways. Its Beyonders walk the road of law, interrogation, judgment, and the enforcement of order. From the lowest rung its sequences progress Arbiter (Sequence 9), Sheriff (8), Interrogator (7), Judge (6), and Disciplinary Paladin (Sequence 5); its Saint and demigod rungs continue Imperative Mage (Sequence 4), Chaos Hunter (3), Balancer (2), and Hand of Order (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Justiciar (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 209
where slug = 'justiciar-pathway-overview';

update public.lore_entries set
  content = 'The Black Emperor pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Order family of pathways. Its Beyonders walk the road of subversion, bribery, and the corruption of order from within. From the lowest rung its sequences progress Lawyer (Sequence 9), Barbarian (8), Briber (7), Baron of Corruption (6), and Mentor of Disorder (Sequence 5); its Saint and demigod rungs continue Earl of the Fallen (Sequence 4), Frenzied Mage (3), Duke of Entropy (2), and Prince of Abolition (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Black Emperor (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 212
where slug = 'black-emperor-pathway-overview';

update public.lore_entries set
  content = 'The Red Priest pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of battle, fire, provocation, and the reaping of war. From the lowest rung its sequences progress Hunter (Sequence 9), Provoker (8), Pyromaniac (7), Conspirer (6), and Reaper (Sequence 5); its Saint and demigod rungs continue Iron-blooded Knight (Sequence 4), War Bishop (3), Weather Warlock (2), and Conqueror (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Red Priest (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 204
where slug = 'red-priest-pathway-overview';

update public.lore_entries set
  content = 'The Demoness pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of assassination, temptation, witchcraft, and affliction. From the lowest rung its sequences progress Assassin (Sequence 9), Instigator (8), Witch (7), Pleasure (6), and Affliction (Sequence 5); its Saint and demigod rungs continue Despair (Sequence 4), Unaging (3), Catastrophe (2), and Apocalypse (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Demoness (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 211
where slug = 'demoness-pathway-overview';

update public.lore_entries set
  content = 'The Mother pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Life family of pathways. Its Beyonders walk the road of cultivation, healing, harvest, and the flourishing of life. From the lowest rung its sequences progress Planter (Sequence 9), Doctor (8), Harvest Priest (7), Biologist (6), and Druid (Sequence 5); its Saint and demigod rungs continue Classical Alchemist (Sequence 4), Pallbearer (3), Desolate Matriarch (2), and Naturewalker (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Mother (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 205
where slug = 'mother-pathway-overview';

update public.lore_entries set
  content = 'The Moon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Life family of pathways. Its Beyonders walk the road of potions, beast-taming, vampirism, and the blood of the scarlet moon. From the lowest rung its sequences progress Apothecary (Sequence 9), Beast Tamer (8), Vampire (7), Potions Professor (6), and Scarlet Scholar (Sequence 5); its Saint and demigod rungs continue Shaman King (Sequence 4), High Summoner (3), Life-Giver (2), and Beauty Goddess (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Moon (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 212
where slug = 'moon-pathway-overview';

update public.lore_entries set
  content = 'The Hermit pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of occult lore, warlockry, scrolls, and the reading of the constellations. From the lowest rung its sequences progress Mystery Pryer (Sequence 9), Melee Scholar (8), Warlock (7), Scrolls Professor (6), and Constellations Master (Sequence 5); its Saint and demigod rungs continue Mysticologist (Sequence 4), Clairvoyant (3), Sage (2), and Knowledge Emperor (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Hermit (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 217
where slug = 'hermit-pathway-overview';

update public.lore_entries set
  content = 'The Paragon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of scholarship, archaeology, appraisal, craft, and the heavens. From the lowest rung its sequences progress Savant (Sequence 9), Archaeologist (8), Appraiser (7), Artisan (6), and Astronomer (Sequence 5); its Saint and demigod rungs continue Alchemist (Sequence 4), Arcane Scholar (3), Knowledge Magister (2), and Illuminator (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Paragon (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 208
where slug = 'paragon-pathway-overview';

update public.lore_entries set
  content = 'The Wheel of Fortune pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Wheel of Fortune family of pathways. Its Beyonders walk the road of fortune, luck, calamity, and the turning of fate. From the lowest rung its sequences progress Monster (Sequence 9), Robot (8), Lucky One (7), Calamity Priest (6), and Winner (Sequence 5); its Saint and demigod rungs continue Misfortune Mage (Sequence 4), Chaoswalker (3), Soothsayer (2), and Snake of Mercury (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Wheel of Fortune (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 209
where slug = 'wheel-of-fortune-pathway-overview';

update public.lore_entries set
  content = 'The Abyss pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Abyss family of pathways. Its Beyonders walk the road of crime, slaughter, devilry, and the apostasy of desire. From the lowest rung its sequences progress Criminal (Sequence 9), Unwinged Angel (8), Serial Killer (7), Devil (6), and Desire Apostle (Sequence 5); its Saint and demigod rungs continue Demon (Sequence 4), Blatherer (3), Bloody Archduke (2), and Filthy Monarch (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Abyss (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 207
where slug = 'abyss-pathway-overview';

update public.lore_entries set
  content = 'The Chained pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Abyss family of pathways. Its Beyonders walk the road of imprisonment, lunacy, monstrous transformation, and the restless dead. From the lowest rung its sequences progress Prisoner (Sequence 9), Lunatic (8), Werewolf (7), Zombie (6), and Wraith (Sequence 5); its Saint and demigod rungs continue Puppet (Sequence 4), Disciple of Silence (3), Ancient Bane (2), and Abomination (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Chained (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  sequences = ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  token_count = 207
where slug = 'chained-pathway-overview';

