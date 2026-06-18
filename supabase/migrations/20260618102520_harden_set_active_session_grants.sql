-- Lock down the set_active_session RPC to signed-in players only, matching the
-- purchase_listing / rate_world_message convention (and clearing the Supabase
-- security advisor's "anon can execute SECURITY DEFINER function" warning). An
-- anon caller's auth.uid() is null and would match no rows anyway, but the RPC
-- should never be exposed unauthenticated.
--
-- This mirrors the migration already recorded in the remote history (it was
-- applied out-of-band alongside the create_game_sessions migration); kept as its
-- own versioned file so `supabase/migrations/` matches the remote project 1:1.

revoke all on function public.set_active_session(uuid) from public, anon;
grant execute on function public.set_active_session(uuid) to authenticated;
