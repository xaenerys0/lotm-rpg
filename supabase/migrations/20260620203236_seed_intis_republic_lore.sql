-- Seed the Intis Republic lore (world build-out 6, issue #135):
-- the Intis nation overview + Trier's arts/politics + the wider Republic
-- (locations, deepening the trier.ts stub), the Church of the Eternal Blazing
-- Sun's Trier structure & members and the gated Aurora Order true-nature depth
-- (organizations), and the Trier NPCs Saint Viève, Cardinal Plessy Descartes,
-- and the Deacon-Purifier Angoulême de François (8 entries total).
-- Generated from the TS source (src/lib/lore/{trier,organizations,npcs}.ts — the
-- canonical data); same lore_entries INSERT format as the earlier seed
-- migrations. `narratorOnly` is a TS-only prompt flag (no column), intentionally
-- not persisted. Parity (TS <-> rows) verified via the Supabase MCP after apply.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'intis-republic-overview',
  'The Intis Republic — Overview',
  'location',
  'The Intis Republic is one of the four great nations of the Northern Continent and, after the Loen Kingdom, the second strongest — followed by the Feynapotter Kingdom and the Feysac Empire. It occupies the heart of the continent''s west: the Fog Sea at its back, the Feysac Empire to the north, the Loen Kingdom to the east across the Hornacis range and the Midseashire lakes, and Feynapotter, Lenburg, and Masin to the south. It was founded by the Sauron Family after the Trunsoest Empire fell, ruling first as the Intis Kingdom — until the transmigrator-emperor Roselle Gustav overthrew the Sauron crown and, after much upheaval, left behind the parliamentary Republic that governs today under the slogan "Freedom, Equality, Fraternity." Its capital is sunlit Trier, where the Srenzo and Ryan rivers meet; its coin is the verl d''or and the coppet. Two Churches share its faith — the Church of the Eternal Blazing Sun and the Church of the God of Steam and Machinery — and a nation that prides itself on liberty is also a nation of feverish politics, where parliamentary ambition, revolutionary ferment, and the radiant order of the sun-faith all pull against one another.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'intis-republic', 'nation', 'fifth-epoch'],
  230
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'trier-arts-and-revolution',
  'Trier — The City of Fashion & Its Politics',
  'location',
  'Trier wears two faces. By day it is the City of Fashion, a world-class sanctuary for artists, musicians, and novelists, where idlers walk turtles on leads to advertise their leisure, salons argue aesthetics over coffee, and a figure in a black hood draws no second glance among so much studied eccentricity. Beneath the elegance runs a hotter current: Intis is a republic, not a monarchy, and Trier is the crucible of its politics. Nearly forty seats of the National Convention are split among the city''s twenty quartiers, but seats and prosperity are not shared evenly — wealthier Greater Trier carries a weight the poorer quartiers resent — and that grievance feeds an endless ferment of student radicals, pamphleteers, political clubs, and street-corner orators shouting liberty into the gaslight. Art and revolution feed each other here: a song or a satire can move a quartier faster than a speech, and the same cafés that host the avant-garde host the conspirators. It is a beautiful, restless city, forever performing its own freedom even as the police of each quartier watch the crowds for the ones who mean it.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['setting', 'trier', 'intis-republic', 'politics', 'arts', 'fifth-epoch'],
  235
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'intis-wider-republic',
  'The Intis Republic — Beyond Trier',
  'location',
  'The Republic is more than its sunlit capital. To the south lie the provincial reaches toward Lenburg and Masin, farm country and lesser towns that send their grain and their grievances up to Trier. To the north stretches the Fog Sea Province, the cold borderland that screens Intis from the Feysac Empire, and beyond the western coast the Fog Sea itself, out of which rise the Republic''s island holdings in the Fog Sea Archipelago. Farthest of all is West Balam, the Intisian colony on the distant Southern Continent, won in the great age of colonisation and held in uneasy rivalry with Loen''s own colonies there. The Church of the Eternal Blazing Sun and the Church of the God of Steam and Machinery both reach into these provinces, but their grip loosens with distance from Trier, and the farther corners of the Republic — fog-bound coast, frontier province, and overseas colony alike — are exactly the kind of half-watched country where the Beyonder world does its quietest work.',
  null,
  5,
  'trier',
  '{}',
  '{}',
  ARRAY['geography', 'setting', 'intis-republic', 'provinces', 'fifth-epoch'],
  210
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'blazing-sun-church-members',
  'Church of the Eternal Blazing Sun — Trier Structure & Members',
  'organization',
  'In Trier the Church of the Eternal Blazing Sun is no distant authority but the visible spiritual power of the capital, ruled from Saint Viève Cathedral in the Island District. The Trier diocese is overseen by Cardinal Plessy Descartes, an elderly, radiant churchman about whom the very shadows seem to thin; beneath the cardinals stand the deacons, priests, and the white-and-gold-robed clergy who greet the dawn with raised heads and outspread arms. The Church reveres Saint Viève — the one female angel named in its Bible — as a guardian angel of Trier, and her cathedral is the heart of the city''s sun-worship. Its stern hand is the Inquisition: its Purifiers hunt heresy, corruption, and the servants of the Outer Deities, and a senior Purifier like the Deacon Angoulême de François may hold civic power too, doubling as a Deputy Assistant Commissioner of Trier''s police. The Church controls the Sun pathway and keeps poor relations with the Churches of the Lord of Storms and of the God of Knowledge and Wisdom; in the Republic it shares the faith of the people with the Church of the God of Steam and Machinery.',
  null,
  5,
  'trier',
  '{"Plessy Descartes","Viève","Angoulême de François"}',
  '{}',
  ARRAY['organization', 'eternal-blazing-sun', 'sun-pathway', 'trier', 'inquisition', 'religion'],
  245
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'aurora-order-true-nature',
  'The Aurora Order — The True Creator''s Cult',
  'organization',
  'Behind the newspapers'' picture of a mere terrorist cult, the Aurora Order is a secret organisation perhaps two or three centuries old that worships the True Creator — and its true nature is far stranger than arson and assassination. The Order''s primary pathway is the Hanged Man, with reach into the Wheel of Fortune and (through traitors of the Abraham Family) the Door; its god, the True Creator, is a Sequence 0 Hanged Man born as a negative personality from the very corpse and spirit of the Ancient Sun God, which is why the Order preaches that "He" is the rightful heir to the Ancient Sun God''s legacy, the father of all living things in whom divinity dwells. Its symbol is no orthodox emblem but an idol: a naked male god hung upside-down on a cross, pierced with rusted nails, his face blurred but for tight-shut eyes. The Order is structured into seven Saints and twenty-two Oracles — Beyonders from Sequence 7 down to 5 who take single letters of the alphabet for code names and convene the Beyonder gatherings — and it operates across both the Loen Kingdom and the Intis Republic. It is the sworn enemy of the orthodox Churches, the Tarot Club, and the Rose School of Thought, and it has an uncanny gift for sniffing out the servants of the Outer Deities. Its members are lunatics or lunatics-in-waiting, and its true aim is nothing less than to bring its god down into the world.',
  null,
  5,
  null,
  '{}',
  '{4}',
  ARRAY['aurora-order', 'true-creator', 'hanged-man-pathway', 'secret-organization', 'spoiler'],
  270
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-saint-vieve',
  'Saint Viève — Guardian Angel of Trier',
  'npc',
  'Saint Viève is the only female angel named in the Bible of the Church of the Eternal Blazing Sun, venerated as one of the three guardian angels of Trier and the namesake of the great cathedral that crowns the Island District. To the faithful of the sunlit capital she is the radiant protector of their city; in truth she is an Angel-tier Beyonder of the Sun pathway, a figure draped in white robes shot with gold who seems crafted from pure light — emerald-eyed, blond, translucent, and divine. Her ties are to the Church she serves and to the city she guards: she answers the cathedral''s gravest needs, descends against the servants of the Outer Deities when they threaten Trier, and stands among the powers that have held the capital safe across the ages. Most Trierans will never see her with their own eyes; that they believe in her at all is the measure of how deeply the Blazing Sun is woven into the life of the City of Fashion.',
  null,
  5,
  'trier',
  '{"Viève"}',
  '{1}',
  ARRAY['trier', 'eternal-blazing-sun', 'angel', 'sun-pathway', 'guardian'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-plessy-descartes',
  'Cardinal Plessy Descartes — Head of the Trier Diocese',
  'npc',
  'Cardinal Plessy Descartes oversees the Trier diocese of the Church of the Eternal Blazing Sun from Saint Viève Cathedral in the Island District. An elderly man with high cheekbones and grizzled blond hair, his manner is mild rather than stern, yet a faint radiance clings to him that makes direct eye contact difficult and seems to leave a room without shadows — the mark of a Saint-tier Beyonder of the Sun pathway. He is the Church''s senior authority in the capital: he commands its clergy, blesses its rites, and directs its sterner work, summoning Purifiers of the Inquisition to Saint Viève Cathedral and raising the deserving among them to the rank of deacon. Patient, watchful, and utterly devoted to the radiant order of the sun-faith, the Cardinal is the human face of the Church''s power in Trier — the man through whom its will reaches both the pulpit and the shadows the Inquisition is set to burn.',
  null,
  5,
  'trier',
  '{"Plessy Descartes"}',
  '{4}',
  ARRAY['trier', 'eternal-blazing-sun', 'cardinal', 'sun-pathway', 'inquisition'],
  215
);

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-angouleme-de-francois',
  'Angoulême de François — Deacon-Purifier of the Inquisition',
  'npc',
  'Angoulême de François is a deacon of the Church of the Eternal Blazing Sun''s Inquisition in Trier and, in the same breath, a Deputy Assistant Commissioner of the city''s police — a man who holds both the sacred and the civic authority over Quartier 13. A blond Sun-pathway Beyonder of the Saint tier (a Sequence 4 "Unshadowed"), he hunts heresy, corruption, and the servants of the Outer Deities with the same cold competence he brings to ordinary crime, teaching his subordinates that even beneath the sun there are shadows one must learn to use, to eliminate, or to coexist with. He answers to Cardinal Plessy Descartes and leads a small team of his own — among them Imre, Valentine de Lacourt, and Antoine. Bridging cathedral and constabulary, the Inquisition and the law, Angoulême is exactly the sort of figure the Republic''s capital runs on: a believer with a badge, equally at home blessing a congregation and interrogating a suspect, and a dangerous man to deceive on either count.',
  null,
  5,
  'trier',
  '{"Angoulême de François","Plessy Descartes","Valentine de Lacourt"}',
  '{4}',
  ARRAY['trier', 'eternal-blazing-sun', 'inquisition', 'sun-pathway', 'police'],
  225
);
