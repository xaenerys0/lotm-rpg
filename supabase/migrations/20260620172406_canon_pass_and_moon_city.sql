-- Canon-correction pass + Moon City (issues #132/#133), corpus-verified.
-- A resync migration (the resync_pathway_lore_seq0 pattern): brings the
-- affected lore_entries rows to the corrected TS source (src/lib/lore/*).
-- NPC fixes: Pallez Zoroast -> Error pathway; Old Neil -> Hermit; Ince Zangwill
-- -> Death/Darkness. Pathway group fixes for abyss/chained (Fountain of Darkness),
-- black-emperor/justiciar (Trickster Apostle), moon/mother (Goddess of Origin),
-- wheel-of-fortune (Key of Light). Adds Moon City (city-keyed 'moon', gated apart
-- from the City of Silver) + High Priest Nim, and re-keys the gray-fog edge to Moon.
-- Upsert = delete-then-insert (re-runnable). TS is canonical.

delete from public.lore_entries where slug = 'npc-leonard-mitchell';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-leonard-mitchell',
  'Leonard Mitchell — Nighthawk and Poet',
  'npc',
  'Leonard Mitchell is a young Nighthawk serving on the Tingen team and one of Klein Moretti''s earliest companions. A Sequence 9 Sleepless on the Darkness pathway (advancing to Sequence 8 during the Tingen arc), Leonard is notable for his poetic sensibility, good looks, and a habit of composing verses in his head during tense situations. He is observant, empathetic, and genuinely committed to protecting civilians from supernatural threats. Leonard harbors a significant secret: he is the host of Pallez Zoroast, a powerful Beyonder of the Error pathway, who resides within Leonard''s body as a symbiotic entity. Pallez provides Leonard with occasional guidance and enhanced abilities but also represents a constant danger — the Angel''s own agenda may not always align with Leonard''s. In the Tarot Club, Leonard later becomes "The Star." His friendship with Klein is one of the narrative''s most enduring relationships, and he plays a critical role in later volumes. In Tingen, Leonard serves as Klein''s partner on investigations and provides the reader''s window into the Nighthawks'' daily operations.',
  'darkness',
  5,
  'tingen',
  ARRAY['Leonard Mitchell', 'Pallez Zoroast'],
  ARRAY[9, 8],
  ARRAY['nighthawks', 'tarot-club', 'the-star', 'darkness-pathway'],
  250
);

delete from public.lore_entries where slug = 'npc-old-neil';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-old-neil',
  'Old Neil — Nighthawk Artificer',
  'npc',
  'Old Neil is the Tingen Nighthawks'' resident artificer and historian, an elderly man who serves as the team''s expert on mystical artifacts, ritual materials, and Beyonder history. He maintains the team''s equipment, identifies recovered artifacts, and provides technical support for operations. Old Neil is warm, grandfatherly, and generous with his knowledge — he teaches Klein about ritual practices, artifact handling, and the practical aspects of the Beyonder world that formal training doesn''t cover. He follows the Hermit pathway at a low sequence level (a Sequence 9 Mystery Pryer), giving him analytical and knowledge-gathering abilities. Old Neil''s fate becomes one of the Tingen arc''s most poignant tragedies: he is manipulated into attempting an advancement ritual that goes wrong, leading to his loss of control. His transformation into an uncontrolled aberration forces the Nighthawks team to confront and put down one of their own — an event that deeply affects Klein and demonstrates the ever-present danger of Beyonder advancement. Old Neil''s death serves as a formative trauma that shapes Klein''s cautious approach to advancement throughout the narrative.',
  null,
  5,
  'tingen',
  ARRAY['Old Neil'],
  ARRAY[9, 8],
  ARRAY['nighthawks', 'artificer', 'mentor', 'tragedy', 'loss-of-control'],
  240
);

delete from public.lore_entries where slug = 'npc-ince-zangwill';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-ince-zangwill',
  'Ince Zangwill — The Fallen Nighthawk',
  'npc',
  'Ince Zangwill is a former high-ranking Nighthawk who serves as the primary antagonist of the Tingen arc. A Beyonder who began on the Death pathway as a Sequence 5 Gatekeeper and later crossed into the Darkness pathway (a Sequence 4 Nightwatcher), Zangwill possesses the "0-08" card — one of the most dangerous sealed artifacts in the Church of the Evernight Goddess''s possession. This living, malevolent playing card can manipulate fate and probability, making Zangwill extraordinarily dangerous. Zangwill betrayed the Nighthawks by stealing the card and fleeing, becoming a fugitive pursued by the church. His return to Tingen drives the climactic events of Volume 1: he orchestrates a series of incidents that culminate in a deadly confrontation where Klein Moretti is killed. Zangwill''s motivations are complex — the 0-08 card''s corrupting influence has warped his mind, and his actions serve both his own ambitions and the card''s mysterious agenda. He represents the danger of powerful artifacts corrupting their wielders and the threat that rogue Beyonders pose to both the mundane and supernatural worlds. Klein''s eventual revenge against Zangwill becomes a driving motivation that spans multiple volumes.',
  'darkness',
  5,
  'tingen',
  ARRAY['Ince Zangwill'],
  ARRAY[5],
  ARRAY['antagonist', 'nighthawks', '0-08-card', 'darkness-pathway', 'betrayal'],
  245
);

delete from public.lore_entries where slug = 'npc-nim';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-nim',
  'Nim — High Priest of Moon City',
  'npc',
  'Nim is one of the three High Priests who hold Moon City together against the dead land — an old man wrapped in dark beast-hide, his grey hair unkempt, his face seamed with cracks that are not only age. A demigod-tier Beyonder of the Darkness path (a Sequence 4 Nightwatcher), he is the closest thing the isolated city has to a guardian and a king: he keeps the old rites, rations the city''s strength, and carries the weight of its ancient duty to watch the gray fog. Hard, patient, and unsentimental in the way only a man who has buried generations can be, Nim is nonetheless not cruel — every harsh choice he makes is bent toward one end, that Moon City last another year. His ties are to his fellow High Priests, to the watchful people in his charge, and to a duty laid on the city by a god who no longer answers.',
  null,
  5,
  'moon',
  ARRAY['Nim'],
  ARRAY[4],
  ARRAY['forsaken-land', 'moon-city', 'high-priest', 'darkness-pathway'],
  205
);

delete from public.lore_entries where slug = 'abyss-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'abyss-pathway-overview',
  'Abyss Pathway — Overview',
  'pathway',
  'The Abyss pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of crime, slaughter, devilry, and the apostasy of desire. From the lowest rung its sequences progress Criminal (Sequence 9), Unwinged Angel (8), Serial Killer (7), Devil (6), and Desire Apostle (Sequence 5); its Saint and demigod rungs continue Demon (Sequence 4), Blatherer (3), Bloody Archduke (2), and Filthy Monarch (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Abyss (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'abyss',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['abyss-pathway', 'abyss-group', 'overview'],
  207
);

delete from public.lore_entries where slug = 'chained-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'chained-pathway-overview',
  'Chained Pathway — Overview',
  'pathway',
  'The Chained pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Fountain of Darkness group of pathways. Its Beyonders walk the road of imprisonment, lunacy, monstrous transformation, and the restless dead. From the lowest rung its sequences progress Prisoner (Sequence 9), Lunatic (8), Werewolf (7), Zombie (6), and Wraith (Sequence 5); its Saint and demigod rungs continue Puppet (Sequence 4), Disciple of Silence (3), Ancient Bane (2), and Abomination (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Chained (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'chained',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['chained-pathway', 'abyss-group', 'overview'],
  207
);

delete from public.lore_entries where slug = 'black-emperor-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'black-emperor-pathway-overview',
  'Black Emperor Pathway — Overview',
  'pathway',
  'The Black Emperor pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Trickster Apostle group of pathways. Its Beyonders walk the road of subversion, bribery, and the corruption of order from within. From the lowest rung its sequences progress Lawyer (Sequence 9), Barbarian (8), Briber (7), Baron of Corruption (6), and Mentor of Disorder (Sequence 5); its Saint and demigod rungs continue Earl of the Fallen (Sequence 4), Frenzied Mage (3), Duke of Entropy (2), and Prince of Abolition (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Black Emperor (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'black emperor',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['black-emperor-pathway', 'order-group', 'overview'],
  212
);

delete from public.lore_entries where slug = 'justiciar-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'justiciar-pathway-overview',
  'Justiciar Pathway — Overview',
  'pathway',
  'The Justiciar pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Trickster Apostle group of pathways. Its Beyonders walk the road of law, interrogation, judgment, and the enforcement of order. From the lowest rung its sequences progress Arbiter (Sequence 9), Sheriff (8), Interrogator (7), Judge (6), and Disciplinary Paladin (Sequence 5); its Saint and demigod rungs continue Imperative Mage (Sequence 4), Chaos Hunter (3), Balancer (2), and Hand of Order (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Justiciar (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'justiciar',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['justiciar-pathway', 'order-group', 'overview'],
  209
);

delete from public.lore_entries where slug = 'moon-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'moon-pathway-overview',
  'Moon Pathway — Overview',
  'pathway',
  'The Moon pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Goddess of Origin group of pathways. Its Beyonders walk the road of potions, beast-taming, vampirism, and the blood of the scarlet moon. From the lowest rung its sequences progress Apothecary (Sequence 9), Beast Tamer (8), Vampire (7), Potions Professor (6), and Scarlet Scholar (Sequence 5); its Saint and demigod rungs continue Shaman King (Sequence 4), High Summoner (3), Life-Giver (2), and Beauty Goddess (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Moon (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'moon',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['moon-pathway', 'life-group', 'overview'],
  212
);

delete from public.lore_entries where slug = 'mother-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'mother-pathway-overview',
  'Mother Pathway — Overview',
  'pathway',
  'The Mother pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Goddess of Origin group of pathways. Its Beyonders walk the road of cultivation, healing, harvest, and the flourishing of life. From the lowest rung its sequences progress Planter (Sequence 9), Doctor (8), Harvest Priest (7), Biologist (6), and Druid (Sequence 5); its Saint and demigod rungs continue Classical Alchemist (Sequence 4), Pallbearer (3), Desolate Matriarch (2), and Naturewalker (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Mother (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'mother',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['mother-pathway', 'life-group', 'overview'],
  205
);

delete from public.lore_entries where slug = 'wheel-of-fortune-pathway-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'wheel-of-fortune-pathway-overview',
  'Wheel of Fortune Pathway — Overview',
  'pathway',
  'The Wheel of Fortune pathway is one of the twenty-two pathways of the Beyonder world, belonging to the Key of Light group of pathways. Its Beyonders walk the road of fortune, luck, calamity, and the turning of fate. From the lowest rung its sequences progress Monster (Sequence 9), Robot (8), Lucky One (7), Calamity Priest (6), and Winner (Sequence 5); its Saint and demigod rungs continue Misfortune Mage (Sequence 4), Chaoswalker (3), Soothsayer (2), and Snake of Mercury (Sequence 1), culminating in the Sequence 0 Above-the-Sequence title Wheel of Fortune (these higher-rung names are canon; their abilities and lore depth remain provisional, issue #99). Like every pathway, advancement depends on brewing and digesting each sequence''s potion through the Acting Method — living the role until the potion''s characteristics settle — never on raw power alone.',
  'wheel of fortune',
  5,
  null,
  '{}',
  ARRAY[9, 8, 7, 6, 5, 4, 3, 2, 1],
  ARRAY['wheel-of-fortune-pathway', 'wheel-of-fortune-group', 'overview'],
  209
);

delete from public.lore_entries where slug = 'forsaken-land-eastern-grayfog';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'forsaken-land-eastern-grayfog',
  'The Forsaken Land — The Gray-Fog Eastern Edge',
  'location',
  'At the far eastern rim of the Forsaken Land the dead country ends in a wall of unmoving gray fog — the same dread, world-ending barrier that the elders of other lands speak of in their oldest fears. Beyond it, Moon City''s deepest lore holds, lies the sealed Western Continent, another place cut off from the world; the gray fog is the seam between two sealings. The fog does not drift and cannot be safely entered: those who walk in do not return. It was Moon City, in the eastern reaches, that the fallen god set to watch this barrier, and it is Moon City that watches it still. For the few who understand what it borders, it is a reminder that the Forsaken Land is not the only continent the world has shut away.',
  null,
  5,
  'moon',
  '{}',
  ARRAY[4],
  ARRAY['forsaken-land', 'moon-city', 'gray-fog', 'western-continent', 'fifth-epoch'],
  185
);

delete from public.lore_entries where slug = 'moon-city-overview';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'moon-city-overview',
  'Moon City — Overview',
  'location',
  'Moon City is an isolated city of the Forsaken Land''s eastern reaches, a hard, walled place beneath the same perpetual lightning that walks the sky of the whole sealed continent. Its people are descended from an older time and have lived for as long as memory reaches in near-total isolation, cut off by the dead country, the sealing sea, and the wall of gray fog to the east. They are an inward, watchful folk, worn by generations of bare survival in a land that yields little but monsters and mutated growth, and governed by three High Priests who keep the old rites and hold the city together. To a newcomer Moon City is grim and guarded — a people who have endured the end of the world by forgetting there was ever anything else, and who do not, at first, believe that any other living city of the Forsaken Land still stands.',
  null,
  5,
  'moon',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'moon-city', 'geography', 'fifth-epoch'],
  200
);

delete from public.lore_entries where slug = 'moon-city-people';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'moon-city-people',
  'Moon City — The Watchful People',
  'location',
  'Moon City endures under three High Priests, each a demigod-tier Beyonder who shoulders the survival of the city: by canon they walk the Darkness, Red Priest, and Justiciar paths, the deepest powers the city still keeps after ages of lost formulas and ingredients. Below them the people scrape a living from a poisoned land — there is no safe food, so they take the flesh of monsters and the fruit of mutated growth, and pay for it in shortened lives, sickness, and the slow spread of deformity through their children. Those who feel themselves begin to lose control walk out into the dark with a torch and never return. It is a society organised wholly around lasting one more generation: disciplined, fatalistic, and bound to its priests, with little room for the soft or the curious. Strength here is measured by what one can endure, and belonging by taking up a share of the watch.',
  null,
  5,
  'moon',
  '{}',
  '{}',
  ARRAY['forsaken-land', 'moon-city', 'society', 'fifth-epoch'],
  205
);

delete from public.lore_entries where slug = 'moon-city-fog-watch';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'moon-city-fog-watch',
  'Moon City — The Watch on the Gray Fog',
  'location',
  'Moon City''s deepest purpose is a duty older than anyone living. In the elder ages the city belonged to the Sanguines — the vampire-kin of the scarlet moon — before their civilisation was destroyed; the survivors came under the Ancient Sun God, and when he reigned he set Moon City to a single charge: to watch the wall of gray fog at the eastern edge of the world, to mark whatever might come out of it, and to seek a way through. For more than three thousand years, long after the god fell silent, the city has kept that watch — sending expeditions into the dark that mostly do not return, praying to a god who no longer answers, and listening at the fog for the voices its priests swear are there. Few outside the city''s inner order understand what the fog truly seals, or that the duty is the reason Moon City still exists at all.',
  null,
  5,
  'moon',
  '{}',
  ARRAY[4],
  ARRAY['forsaken-land', 'moon-city', 'gray-fog', 'ancient-sun-god', 'secret', 'fifth-epoch'],
  210
);
