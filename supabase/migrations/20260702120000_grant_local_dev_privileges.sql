-- Local-dev privilege parity (cross-device sync + admin gate + RAG loader).
--
-- Fresh local Supabase projects (and `supabase db reset`) do not automatically
-- mirror the dashboard/SQL grants that were applied over time in production.
-- Without these, the authenticated browser client gets 403 on every app table
-- and the service_role RAG loader cannot upsert the corpus. This migration
-- restores the expected privileges idempotently.
--
-- NOTE: source_chunks / chunk_embeddings stay DENIED to authenticated/an anon;
-- that intentional RLS design is preserved below by granting them only to
-- service_role.

-- App tables the authenticated browser client reads/writes.
grant select, insert, update, delete on public.game_sessions to authenticated;
grant select, insert, update, delete on public.journal_entries to authenticated;
grant select, insert, update, delete on public.journal_annotations to authenticated;
grant select, insert, update, delete on public.world_memory to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.world_messages to authenticated;

-- Sequence usage for authenticated (defensive; tables today use uuid defaults,
-- but future serial columns should not break locally).
grant usage, select on all sequences in schema public to authenticated;

-- RAG corpus loader uses service_role from scripts/rag/load.ts.
grant select, insert, update, delete on public.source_chunks to service_role;
grant select, insert, update, delete on public.chunk_embeddings to service_role;
grant usage, select on all sequences in schema public to service_role;
