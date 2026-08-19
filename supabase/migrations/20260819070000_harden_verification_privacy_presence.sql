-- Harden verification request integrity, profile privacy, and presence tracking.

alter table public.verification_requests
  drop constraint if exists verification_requests_status_check;

alter table public.verification_requests
  add constraint verification_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create or replace function public.normalize_verification_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  v_profile public.profiles%rowtype;
begin
  if v_role in ('service_role', 'supabase_admin') then
    return new;
  end if;

  if auth.uid() is null or auth.uid()::text <> new.user_id then
    raise exception 'verification_user_mismatch';
  end if;

  select * into v_profile from public.profiles where id = new.user_id;
  if not found then
    raise exception 'verification_profile_not_found';
  end if;

  if nullif(trim(coalesce(new.live_selfie_photo, '')), '') is null then
    raise exception 'verification_selfie_required';
  end if;

  new.user_name := v_profile.name;
  new.username := v_profile.username;
  new.faculty := v_profile.faculty;
  new.department := v_profile.department;
  new.profile_photo := coalesce(v_profile.photos[1], '');
  new.status := 'pending';
  new.admin_note := null;
  new.reviewed_at := null;
  new.submitted_at := now();
  return new;
end;
$$;

drop trigger if exists normalize_verification_request on public.verification_requests;
create trigger normalize_verification_request
before insert on public.verification_requests
for each row execute function public.normalize_verification_request();

drop policy if exists "Users can submit their own verification requests" on public.verification_requests;
create policy "Users can submit their own verification requests"
  on public.verification_requests for insert to authenticated
  with check (auth.uid()::text = user_id and status = 'pending');

revoke insert on table public.verification_requests from anon, authenticated;
grant insert (
  id,
  user_id,
  profile_photo,
  live_selfie_photo,
  student_id_photo
) on table public.verification_requests to authenticated;

alter table public.profiles
  add column if not exists is_online BOOLEAN NOT NULL DEFAULT false,
  add column if not exists last_active TIMESTAMP WITH TIME ZONE;

create index if not exists profiles_last_active_idx
  on public.profiles (last_active desc)
  where is_online = true;

create or replace function public.update_presence(p_is_online boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set is_online = coalesce(p_is_online, true),
      last_active = now()
  where id = auth.uid()::text;
end;
$$;

revoke all on function public.update_presence(boolean) from public, anon, authenticated;
grant execute on function public.update_presence(boolean) to authenticated;

revoke select on table public.profiles from anon, authenticated;
grant select (
  id,
  name,
  age,
  username,
  gender,
  faculty,
  department,
  level,
  campus_location,
  bio,
  photos,
  interests,
  looking_for,
  mode,
  is_verified,
  verification_status,
  badges,
  is_banned,
  boost_expires_at,
  instagram,
  snapchat,
  is_online,
  last_active,
  created_at
) on table public.profiles to anon, authenticated;
