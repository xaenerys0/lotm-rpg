-- Session ids are opaque client strings, not always UUIDs.
--
-- game_sessions.id was uuid, but the app generates non-UUID ids for admin test
-- characters ("admin-<uuid>", @/lib/game/admin-tools) and the dev scene-art
-- character ("dev-test-character", @/lib/game/dev-tools). The uuid column
-- silently rejected their upsert, so those saves never reached the cloud (only
-- their journal rows did — journal_entries.session_id is already text). Widen the
-- column to text to match how the app treats session ids everywhere else (and the
-- sibling journal_entries table), so every character syncs fully.

alter table public.game_sessions
  alter column id type text using id::text;

-- The active-character RPC took a uuid; re-create it with a text parameter (the
-- signature changes, so drop the old overload first), then restore the
-- signed-in-only EXECUTE grant (matching 20260618102520).
drop function if exists public.set_active_session(uuid);

create or replace function public.set_active_session(p_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.game_sessions
    set is_active = false
    where user_id = auth.uid() and is_active and id <> p_id;
  update public.game_sessions
    set is_active = true
    where user_id = auth.uid() and id = p_id;
end;
$$;

revoke all on function public.set_active_session(text) from public, anon;
grant execute on function public.set_active_session(text) to authenticated;
