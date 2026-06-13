-- Seed lore entries for the thirteen additional pathways (issue #28)
-- White Tower, Twilight Giant, Justiciar, Black Emperor, Red Priest, Demoness,
-- Mother, Moon, Hermit, Paragon, Wheel of Fortune, Abyss, Chained (overview entries).
-- Generated from src/lib/lore/pathway-*.ts (TS source is canonical).

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'white-tower-pathway-overview',
  'White Tower Pathway — Overview',
  'pathway',
  'The White Tower pathway is one of the twenty-two pathways of the Beyonder world, belonging to the God Almighty family of pathways. Its Beyonders walk the road of reason, deduction, and the unveiling of secrets through scholarship and mysticism. From the lowest rung its sequences progress Reader (Sequence 9), Student of Ratiocination (8), Detective (7), Polymath (6), and Mysticism Magister (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'white tower',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['white-tower-pathway', 'god-almighty-group', 'overview'],
  175
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'twilight-giant-pathway-overview',
  'Twilight Giant Pathway — Overview',
  'pathway',
  'The Twilight Giant pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Eternal Darkness family of pathways. Its Beyonders walk the road of martial prowess, weapons mastery, and the towering strength of giants. From the lowest rung its sequences progress Warrior (Sequence 9), Pugilist (8), Weapon Master (7), Dawn Paladin (6), and Guardian (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'twilight giant',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['twilight-giant-pathway', 'eternal-darkness-group', 'overview'],
  170
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'justiciar-pathway-overview',
  'Justiciar Pathway — Overview',
  'pathway',
  'The Justiciar pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Order family of pathways. Its Beyonders walk the road of law, interrogation, judgment, and the enforcement of order. From the lowest rung its sequences progress Arbiter (Sequence 9), Sheriff (8), Interrogator (7), Judge (6), and Disciplinary Paladin (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'justiciar',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['justiciar-pathway', 'order-group', 'overview'],
  164
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'black-emperor-pathway-overview',
  'Black Emperor Pathway — Overview',
  'pathway',
  'The Black Emperor pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Order family of pathways. Its Beyonders walk the road of subversion, bribery, and the corruption of order from within. From the lowest rung its sequences progress Lawyer (Sequence 9), Barbarian (8), Briber (7), Baron of Corruption (6), and Mentor of Disorder (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'black emperor',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['black-emperor-pathway', 'order-group', 'overview'],
  167
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'red-priest-pathway-overview',
  'Red Priest Pathway — Overview',
  'pathway',
  'The Red Priest pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of battle, fire, provocation, and the reaping of war. From the lowest rung its sequences progress Hunter (Sequence 9), Provoker (8), Pyromaniac (7), Conspirer (6), and Reaper (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'red priest',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['red-priest-pathway', 'combat-group', 'overview'],
  159
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'demoness-pathway-overview',
  'Demoness Pathway — Overview',
  'pathway',
  'The Demoness pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Combat family of pathways. Its Beyonders walk the road of assassination, temptation, witchcraft, and affliction. From the lowest rung its sequences progress Assassin (Sequence 9), Instigator (8), Witch (7), Demoness of Pleasure (6), and Demoness of Affliction (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'demoness',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['demoness-pathway', 'combat-group', 'overview'],
  166
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'mother-pathway-overview',
  'Mother Pathway — Overview',
  'pathway',
  'The Mother pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Life family of pathways. Its Beyonders walk the road of cultivation, healing, harvest, and the flourishing of life. From the lowest rung its sequences progress Planter (Sequence 9), Doctor (8), Harvest Priest (7), Biologist (6), and Druid (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'mother',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['mother-pathway', 'life-group', 'overview'],
  160
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'moon-pathway-overview',
  'Moon Pathway — Overview',
  'pathway',
  'The Moon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Life family of pathways. Its Beyonders walk the road of potions, beast-taming, vampirism, and the blood of the scarlet moon. From the lowest rung its sequences progress Apothecary (Sequence 9), Beast Tamer (8), Vampire (7), Potions Professor (6), and Scarlet Scholar (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'moon',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['moon-pathway', 'life-group', 'overview'],
  167
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'hermit-pathway-overview',
  'Hermit Pathway — Overview',
  'pathway',
  'The Hermit pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of occult lore, warlockry, scrolls, and the reading of the constellations. From the lowest rung its sequences progress Mystery Pryer (Sequence 9), Melee Scholar (8), Warlock (7), Scrolls Professor (6), and Constellations Master (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'hermit',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['hermit-pathway', 'knowledge-group', 'overview'],
  172
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'paragon-pathway-overview',
  'Paragon Pathway — Overview',
  'pathway',
  'The Paragon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Knowledge family of pathways. Its Beyonders walk the road of scholarship, archaeology, appraisal, craft, and the heavens. From the lowest rung its sequences progress Savant (Sequence 9), Archaeologist (8), Appraiser (7), Artisan (6), and Astronomer (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'paragon',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['paragon-pathway', 'knowledge-group', 'overview'],
  163
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'wheel-of-fortune-pathway-overview',
  'Wheel of Fortune Pathway — Overview',
  'pathway',
  'The Wheel of Fortune pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Wheel of Fortune family of pathways. Its Beyonders walk the road of fortune, luck, calamity, and the turning of fate. From the lowest rung its sequences progress Monster (Sequence 9), Robot (8), Lucky One (7), Calamity Priest (6), and Winner (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'wheel of fortune',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['wheel-of-fortune-pathway', 'wheel-of-fortune-group', 'overview'],
  164
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'abyss-pathway-overview',
  'Abyss Pathway — Overview',
  'pathway',
  'The Abyss pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Abyss family of pathways. Its Beyonders walk the road of crime, slaughter, devilry, and the apostasy of desire. From the lowest rung its sequences progress Criminal (Sequence 9), Unwinged Angel (8), Serial Killer (7), Devil (6), and Desire Apostle (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'abyss',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['abyss-pathway', 'abyss-group', 'overview'],
  162
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'chained-pathway-overview',
  'Chained Pathway — Overview',
  'pathway',
  'The Chained pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Abyss family of pathways. Its Beyonders walk the road of imprisonment, lunacy, monstrous transformation, and the restless dead. From the lowest rung its sequences progress Prisoner (Sequence 9), Lunatic (8), Werewolf (7), Zombie (6), and Wraith (Sequence 5); the higher Saint, Angel, and True God sequences exist in canon but are not yet chronicled here. Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'chained',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5],
  ARRAY['chained-pathway', 'abyss-group', 'overview'],
  162
);
