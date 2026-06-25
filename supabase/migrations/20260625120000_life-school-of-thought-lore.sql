-- Seed the Life School of Thought lore (world build-out, issue #183 follow-up):
-- the secret Fifth-Epoch Wheel-of-Fortune organisation based in Backlund, and its
-- president Will Auceptin (Sequence 2 Angel). These two entries support the new
-- `backlund-life-school-member` start archetype.
--
-- `narratorOnly` is a TS-only prompt flag (no column), intentionally not persisted.
-- TS source is canonical (`src/lib/lore/{organizations,npcs}.ts`).
-- Data-only — no schema change, so no database.ts update.

insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'life-school-of-thought-overview',
  'Life School of Thought — Overview',
  'organization',
  'The Life School of Thought is a Fifth-Epoch secret organisation controlling the Wheel of Fortune pathway. Operating primarily from Backlund, it studies fate and luck — its president holds that a Beyonder of the Fate pathway must pay the price before awaiting fate''s bestowment, not the reverse. When its president vanished from public life, the organisation fractured: a branch that also held parts of the Moon pathway defected to the Rose School of Thought''s indulgence faction. As of 1358 the Life School of Thought is an ally of the Tarot Club.',
  null,
  5,
  null,
  ARRAY[]::text[],
  ARRAY[]::int[],
  ARRAY['life-school-of-thought', 'wheel-of-fortune', 'secret-organization', 'backlund'],
  175
),
(
  'npc-will-auceptin',
  'Will Auceptin — President of the Life School of Thought',
  'npc',
  'Will Auceptin is the president of the Life School of Thought and a Beyonder of the Wheel of Fortune pathway at Sequence 2. Though he appears as a child of ten to twelve — dignified, pitch-black-eyed, about 1.4 metres tall with a missing left calf — he is an ancient being who rose to Angel during the Fourth Epoch. He is an ally of the Tarot Club. To evade a predicted threat, he undertook a full restart under the identity "Will Ceres", son of Aaron Ceres, residing at 3 Burningham Road, Hillston Borough, Backlund.',
  null,
  5,
  'backlund',
  ARRAY['Will Auceptin'],
  ARRAY[2],
  ARRAY['life-school-of-thought', 'wheel-of-fortune', 'backlund', 'angel', 'tarot-club', 'spoiler'],
  175
);
