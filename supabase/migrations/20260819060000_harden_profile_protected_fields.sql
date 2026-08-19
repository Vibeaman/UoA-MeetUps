-- Prevent ordinary authenticated clients from changing protected profile state.
-- Admin Edge Functions use the service role and remain able to apply moderation changes.

create or replace function public.guard_profile_protected_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_is_admin boolean := false;
begin
  if v_role in ('service_role', 'supabase_admin') then
    return new;
  end if;

  begin
    v_is_admin := public.is_admin();
  exception when others then
    v_is_admin := false;
  end;

  if v_is_admin then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.is_verified, false)
      or new.verification_status is distinct from 'unverified'
      or coalesce(array_length(new.badges, 1), 0) > 0
      or coalesce(new.is_banned, false)
      or new.boost_expires_at is not null then
      raise exception 'protected_profile_fields';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.is_verified is distinct from old.is_verified
      or new.verification_status is distinct from old.verification_status
      or new.badges is distinct from old.badges
      or new.is_banned is distinct from old.is_banned
      or new.boost_expires_at is distinct from old.boost_expires_at then
      raise exception 'protected_profile_fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_protected_fields on public.profiles;
create trigger guard_profile_protected_fields
before insert or update on public.profiles
for each row execute function public.guard_profile_protected_fields();

revoke update (is_verified, verification_status, badges, is_banned, boost_expires_at)
  on table public.profiles from anon, authenticated;

grant execute on function public.guard_profile_protected_fields() to authenticated;
