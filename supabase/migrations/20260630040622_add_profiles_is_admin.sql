-- Admin flag for the dev/test utilities surface (gated /dev/admin page).
-- One per auth user; defaults false. The existing "Users can read own profile"
-- SELECT policy already exposes it to its owner, so no new read policy is needed.
alter table public.profiles
  add column is_admin boolean not null default false;

-- Anti-self-escalation: the existing "Users can update own profile" policy lets
-- a user write every column of their OWN row, which would otherwise let them
-- flip their own is_admin from the client. This BEFORE UPDATE trigger pins
-- is_admin to its prior value whenever the request carries an authenticated user
-- (auth.uid() is non-null — i.e. a normal PostgREST client). Admins are therefore
-- set ONLY via the Supabase Dashboard / service role (where auth.uid() is null),
-- never by a player editing their profile.
create or replace function public.protect_profile_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_profile_admin_flag();
