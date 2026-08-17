-- Persisted Profile Boost
-- An active boost is represented by a future expiration timestamp.

alter table public.profiles
  add column if not exists boost_expires_at timestamptz;

create index if not exists profiles_active_boost_idx
  on public.profiles (boost_expires_at desc)
  where boost_expires_at is not null;

comment on column public.profiles.boost_expires_at is 'UTC timestamp at which the profile boost stops affecting discovery ordering.';

create or replace function public.activate_profile_boost(p_duration_seconds integer default 1800)
returns table(boost_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_duration_seconds <> 1800 then
    raise exception 'invalid_duration';
  end if;

  select p.boost_expires_at
    into v_expires_at
  from public.profiles p
  where p.id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if v_expires_at is not null and v_expires_at > timezone('utc'::text, now()) then
    raise exception 'boost_already_active';
  end if;

  update public.profiles p
  set boost_expires_at = timezone('utc'::text, now()) + make_interval(secs => p_duration_seconds)
  where p.id = v_user_id
  returning p.boost_expires_at into v_expires_at;

  return query select v_expires_at;
end;
$$;

revoke all on function public.activate_profile_boost(integer) from public, anon, authenticated;
grant execute on function public.activate_profile_boost(integer) to authenticated;
