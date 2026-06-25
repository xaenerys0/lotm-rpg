-- Organization-representation archetype lore (issue #183 follow-up):
-- supports four new start archetypes (Psychology Alchemists, Rose School
-- Temperance exile, Mandated Punishers of the storm-faith, Machinery Hivemind).
-- All affiliation orgs already exist; this seeds the one new NPC the Psychology
-- Alchemists archetype ties to, splits the Psychology Alchemists overview's deep
-- spoiler into a gated inner-secret (the aurora-order / church-inner-secret
-- pattern), and de-spoilers the surface overview.
--
-- `narratorOnly` is a TS-only prompt flag (no column), intentionally not
-- persisted. TS source is canonical (`src/lib/lore/{npcs,organizations}.ts`).
-- Data-only — no schema change, so no database.ts update.

-- 1. New NPC: Daxter Guderian (Psychology Alchemists, Tingen, Visionary Seq 9).
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-daxter-guderian',
  'Daxter Guderian — The Asylum Doctor',
  'npc',
  'Daxter Guderian is a doctor of the Greenhill Mental Asylum in Tingen City, and behind that respectable face a Beyonder of the Visionary pathway and a member of the secret Psychology Alchemists — a Sequence 9 Spectator who was drawn into the order through the asylum, where troubled minds and quiet recruitment go hand in hand. He buys his advancement ingredients at the underground market beneath the Evil Dragon Bar, trading the Alchemists'' contribution points for formulas, and keeps the loose, scholarly faith of an organisation that styles itself a circle of mind-scientists. Cautious by nature and easily frightened, he is no fanatic — a junior member who knows little of the powers above him and would rather study consciousness than die for it. When the bounty hunter Gehrman Sparrow leans on him he folds quickly, becoming an informant on the Visionary pathway and the Alchemists'' Tingen presence; he later parts with a Telepathist formula. To the city he is only a slightly nervous alienist; to those who know the Beyonder world he is a thread leading into a far larger web.',
  null,
  5,
  'tingen',
  ARRAY['Daxter Guderian'],
  ARRAY[9],
  ARRAY['psychology-alchemists', 'visionary-pathway', 'tingen', 'informant', 'secret-organization'],
  230
);

-- 2. New gated inner-secret for the Psychology Alchemists (no pathway/city key
-- so selectCuratedLore never injects it).
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'psychology-alchemists-inner-secret',
  'Psychology Alchemists — The Hand Behind the Mind',
  'organization',
  'The Psychology Alchemists believe themselves explorers of the mind; few among them know whose mind they truly serve. The seminar that founded the order stumbled upon relics left by Hermes, one of the ancient Mind Dragons, and through that inheritance the order long ago became a division of the Twilight Hermit Order, functioning under the will of the Angel of Imagination, Adam — a Sequence 1 Author of the Visionary pathway and a child of the Ancient Sun God. Its true seat is no earthly chapter but the Garden of Eden, a mystical city within the Sea of Collective Consciousness that can be reached wherever two minds are near. It is governed by councillors who wear personas named for the Seven Deadly Sins beneath a President, each presiding over a nation or great city, trading formulas for the contribution and the secrets of their initiates. The rank and file, studying consciousness in good faith, are the harvest and the instrument of powers they will never be told the names of.',
  null,
  5,
  null,
  ARRAY[]::text[],
  ARRAY[4],
  ARRAY['psychology-alchemists', 'twilight-hermit-order', 'adam', 'secret', 'spoiler'],
  230
);

-- 3. De-spoiler the surface overview (the deep Twilight-Hermit-Order/Adam control
-- moved to the gated inner-secret above; this surface is pathway-keyed and is
-- injected into every Visionary character, so it must not carry the spoiler).
update public.lore_entries
set content = 'The Psychology Alchemists are a secret society of the Visionary pathway that wears the face of a scholarly circle — enthusiasts who hold that the mind has limitless power and infinite wonders, studying consciousness, the subconscious, hypnosis, and the travel of dreams. Compared with the great Beyonder organisations their structure is loose, more a society of like-minded mind-scientists than a disciplined order: doctors, academics, and curious intellectuals drawn together across several nations. For a Visionary Beyonder outside the orthodox churches they are one of the chief sources of potion formulas and advancement guidance, traded for contribution points earned by study and service. Their cosmology likens a person''s consciousness to an island, the subconscious to the sea beneath it, and the collective subconscious to the surrounding ocean. They keep to the shadows the orthodox churches would hunt, recruiting quietly — often through asylums and lecture-halls — and testing initiates before any true initiation; a junior member knows little beyond their own local circle and the formulas it can offer.',
    npcs = ARRAY['Daxter Guderian'],
    tags = ARRAY['psychology-alchemists', 'visionary-pathway', 'secret-organization'],
    token_count = 215
where slug = 'psychology-alchemists-overview';
