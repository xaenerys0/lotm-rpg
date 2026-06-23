-- Canon-correction pass for the Leonard Mitchell dossier (follow-up to issue
-- #92), corpus-verified against corpus/novel. The review of the canon-character
-- takeover presets surfaced a factual error that also lived in this DB-seeded
-- dossier: when Klein first meets Leonard he is already a SEQUENCE 8 MIDNIGHT
-- POET on the Darkness pathway (the novel: "Leonard Mitchell. Sequence 8's
-- Midnight Poet."), not a Sequence 9 Sleepless. The dossier framed his current
-- state as Sequence 9 "advancing to Sequence 8 during the Tingen arc", which is
-- inverted — Seq 9 Sleepless is his PAST. Brings the row to the corrected TS
-- source (src/lib/lore/npcs.ts). Upsert = delete-then-insert (re-runnable).
-- TS is canonical. Data-only — no schema change, so no database.ts update.

delete from public.lore_entries where slug = 'npc-leonard-mitchell';
insert into public.lore_entries (slug, title, category, content, pathway, epoch, city, npcs, sequences, tags, token_count)
values (
  'npc-leonard-mitchell',
  'Leonard Mitchell — Nighthawk and Poet',
  'npc',
  'Leonard Mitchell is a young Nighthawk serving on the Tingen team and one of Klein Moretti''s earliest companions. When Klein meets him he is a Sequence 8 Midnight Poet on the Darkness pathway (he was a Sequence 9 Sleepless earlier in his career), notable for his poetic sensibility, good looks, and a habit of composing verses in his head during tense situations. He is observant, empathetic, and genuinely committed to protecting civilians from supernatural threats. Leonard harbors a significant secret: he is the host of Pallez Zoroast, a powerful Beyonder of the Error pathway, who resides within Leonard''s body as a symbiotic entity. Pallez provides Leonard with occasional guidance and enhanced abilities but also represents a constant danger — the Angel''s own agenda may not always align with Leonard''s. In the Tarot Club, Leonard later becomes "The Star." His friendship with Klein is one of the narrative''s most enduring relationships, and he plays a critical role in later volumes. In Tingen, Leonard serves as Klein''s partner on investigations and provides the reader''s window into the Nighthawks'' daily operations.',
  'darkness',
  5,
  'tingen',
  ARRAY['Leonard Mitchell', 'Pallez Zoroast'],
  ARRAY[9, 8],
  ARRAY['nighthawks', 'tarot-club', 'the-star', 'darkness-pathway'],
  250
);
