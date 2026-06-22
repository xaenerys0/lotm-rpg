-- Canon-correction pass for two NPC dossiers (follow-up to issue #92),
-- corpus-verified against corpus/wiki + corpus/novel. The review of the
-- canon-character takeover presets surfaced two factual errors that also live
-- in these DB-seeded dossiers:
--   * Emlyn White: a Sanguine is BORN at Sequence 7 (a Vampire) on the Moon
--     pathway, not Sequence 9; and his origin was inverted — EMLYN caught a
--     thief and confiscated the Master Key himself, got lost by the cursed key,
--     and was caught by Father Utravsky, who planted a psychological compulsion
--     to keep him at the Church. The "Utravsky gave him his own blood" detail
--     was not canon and is removed.
--   * Derrick Berg: his parents are DEAD — the City of Silver's curse (the dead
--     must be slain by their own kin, or rise as wraiths) forced him to kill
--     them himself, the grief that drove him to pray and become The Sun. The
--     "living family / brotherhood of defenders / faith of the abandoned"
--     framing is corrected to his lost home and the Ancient Sun God (the
--     Creator) his people keep faith with.
-- Brings the affected rows to the corrected TS source (src/lib/lore/npcs.ts).
-- Upsert = delete-then-insert (re-runnable). TS is canonical. Data-only — no
-- schema change, so no src/lib/types/database.ts update.

delete from public.lore_entries where slug = 'npc-derrick-berg';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-derrick-berg',
  'Derrick Berg — The Sun of the Tarot Club',
  'npc',
  'Derrick Berg is a young man — barely more than a boy — born and raised in the City of Silver, one of the surviving cities of the Forsaken Land of the Gods, and one of the rare souls to leave it by the Dream-World passage. A devout, earnest Beyonder of the Sun pathway, he was shaped by the City''s terrible curse: when its people die they must be slain by their own kin, or else rise as wraiths, and Derrick was forced to put his own parents to death by his hand — a grief that drove him, in desperation, to pray to the Ancient Sun God, the Creator his people keep faith with in their abandoned land. That prayer opened his way out. He becomes a member of the Tarot Club under the code name "The Sun," where his sincerity and the Sun pathway''s strength make him both a reliable ally and, at times, an unwitting source of comedy among subtler members. His defining ties are to his lost home and its faith and — through the Tarot Club — a growing bond with The Fool (Klein Moretti) and the other members "above the gray fog." Derrick''s arc is one of a sheltered believer discovering how vast and dangerous the real world is, without ever losing the openhearted decency the City raised in him.',
  null,
  5,
  'silver',
  ARRAY['Derrick Berg'],
  '{}',
  ARRAY['forsaken-land', 'city-of-silver', 'tarot-club', 'the-sun', 'sun-pathway'],
  220
);

delete from public.lore_entries where slug = 'npc-emlyn-white';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-emlyn-white',
  'Emlyn White — The Sanguine of the Harvest Church',
  'npc',
  'Emlyn White — once known as Bai Ailin — is a young Sanguine who came into the keeping of the Harvest Church in Backlund and became a believer of the Earth Mother. As a Sanguine he was born a Beyonder of the Moon Pathway at Sequence 7, a Vampire, and over his arc he rises from Shaman King to Life-Giver to become a high-ranking deacon, or Hierophant, of the life-faith and the representative of Backlund''s Sanguines after they merged with the Church. His road to the Church was a crooked one: he caught a thief and confiscated the man''s Master Key, but the cursed key left him hopelessly lost, and he was caught by Father Utravsky, the towering ex-pirate bishop, who planted a psychological compulsion to keep him at the Harvest Church to work off his crimes. Emlyn first despised Utravsky as a "dirty old man" before — against his will — growing sympathetic to the life-faith and coming to respect him. In the Tarot Club, that strange gathering of the Fool''s chosen, he is known as The Moon, and he befriended the detective Sherlock Moriarty.',
  null,
  5,
  'backlund',
  ARRAY['Emlyn White', 'Utravsky', 'Klein Moretti'],
  ARRAY[4, 2],
  ARRAY['earth-mother', 'harvest-church', 'sanguine', 'moon-pathway', 'tarot-club', 'backlund'],
  215
);
