-- Per-user rate limiting (follow-up to the hosted Ollama Cloud embedding proxy).
-- The /api/proxy/ollama-cloud/api/embed route spends the OPERATOR's ollama.com
-- key on behalf of every signed-in player, so a single authenticated account
-- could otherwise run up the operator's bill. This adds an atomic, server-side,
-- per-user fixed-window counter.
--
-- Keyed by (user_id, bucket) so the same table serves future operator-funded
-- limits (chat/images) without another migration. The table is written ONLY
-- through the SECURITY DEFINER RPC below (which bypasses RLS); RLS is enabled
-- with NO policies, so a player can neither read nor tamper with their own
-- counter directly (same posture as world_message_votes, which is RPC-only).

create table public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null,
  window_start timestamptz not null default now(),
  counter integer not null default 0,
  primary key (user_id, bucket)
);

comment on table public.rate_limits is
  'Per-user fixed-window request counters. Written only via check_rate_limit().';

alter table public.rate_limits enable row level security;
-- No policies on purpose: all access goes through the SECURITY DEFINER RPC.

-- Atomic fixed-window check-and-increment for the calling user (auth.uid()).
-- A single INSERT ... ON CONFLICT DO UPDATE holds the row lock, so concurrent
-- calls serialize — no read-then-write race (cf. purchase_listing's FOR UPDATE).
-- Resets the window in place when it has elapsed, else increments; the request
-- is allowed when the post-increment counter is within p_max_requests.
create or replace function public.check_rate_limit(
  p_bucket text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_counter integer;
  v_window_start timestamptz;
begin
  insert into public.rate_limits as rl (user_id, bucket, window_start, counter)
  values (auth.uid(), p_bucket, v_now, 1)
  on conflict (user_id, bucket) do update
    set
      counter = case
        when rl.window_start < v_now - make_interval(secs => p_window_seconds) then 1
        else rl.counter + 1
      end,
      window_start = case
        when rl.window_start < v_now - make_interval(secs => p_window_seconds) then v_now
        else rl.window_start
      end
  returning rl.counter, rl.window_start into v_counter, v_window_start;

  return query
    select
      v_counter <= p_max_requests,
      greatest(p_max_requests - v_counter, 0),
      v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;
