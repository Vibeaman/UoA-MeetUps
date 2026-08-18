create table if not exists public.profile_likes (
  id text primary key,
  sender_id text not null references public.profiles(id) on delete cascade,
  recipient_id text not null references public.profiles(id) on delete cascade,
  like_type text not null check (like_type in ('like', 'super_like')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint profile_likes_no_self_like check (sender_id <> recipient_id),
  constraint profile_likes_unique_pair unique (sender_id, recipient_id)
);

create index if not exists profile_likes_recipient_idx
  on public.profile_likes (recipient_id, created_at desc);

create index if not exists profile_likes_sender_idx
  on public.profile_likes (sender_id, created_at desc);

alter table public.profile_likes enable row level security;

drop policy if exists "Users can read likes involving themselves" on public.profile_likes;
drop policy if exists "Users can create their own likes" on public.profile_likes;
drop policy if exists "Users can update their own likes" on public.profile_likes;
drop policy if exists "Users can delete their own likes" on public.profile_likes;

create policy "Users can read likes involving themselves"
  on public.profile_likes for select to authenticated
  using (auth.uid()::text = sender_id or auth.uid()::text = recipient_id);

create policy "Users can create their own likes"
  on public.profile_likes for insert to authenticated
  with check (auth.uid()::text = sender_id);

create policy "Users can update their own likes"
  on public.profile_likes for update to authenticated
  using (auth.uid()::text = sender_id)
  with check (auth.uid()::text = sender_id);

create policy "Users can delete their own likes"
  on public.profile_likes for delete to authenticated
  using (auth.uid()::text = sender_id);

create or replace function public.record_profile_like(
  p_recipient_id text,
  p_like_type text default 'like'
)
returns table(matched boolean, match_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id text := auth.uid()::text;
  v_sender_banned boolean;
  v_recipient_banned boolean;
  v_user_id_1 text;
  v_user_id_2 text;
  v_match_id text;
  v_reciprocal_exists boolean;
  v_expiry timestamptz := timezone('utc'::text, now()) + interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_recipient_id is null or p_recipient_id = v_sender_id then
    raise exception 'invalid_recipient';
  end if;

  if p_like_type not in ('like', 'super_like') then
    raise exception 'invalid_like_type';
  end if;

  select is_banned into v_sender_banned
  from public.profiles
  where id = v_sender_id;

  select is_banned into v_recipient_banned
  from public.profiles
  where id = p_recipient_id;

  if v_sender_banned is null or v_recipient_banned is null then
    raise exception 'profile_not_found';
  end if;

  if v_sender_banned or v_recipient_banned then
    raise exception 'account_unavailable';
  end if;

  insert into public.profile_likes (id, sender_id, recipient_id, like_type, updated_at)
  values (
    format('like_%s_%s', v_sender_id, p_recipient_id),
    v_sender_id,
    p_recipient_id,
    p_like_type,
    timezone('utc'::text, now())
  )
  on conflict (sender_id, recipient_id)
  do update set like_type = excluded.like_type, updated_at = excluded.updated_at;

  select exists (
    select 1
    from public.profile_likes
    where sender_id = p_recipient_id
      and recipient_id = v_sender_id
  ) into v_reciprocal_exists;

  if not v_reciprocal_exists then
    return query select false, null::text;
    return;
  end if;

  v_user_id_1 := least(v_sender_id, p_recipient_id);
  v_user_id_2 := greatest(v_sender_id, p_recipient_id);
  v_match_id := format('match_%s_%s', v_user_id_1, v_user_id_2);

  insert into public.matches (
    id,
    user_id_1,
    user_id_2,
    expires_at,
    last_message,
    last_message_time,
    is_lowkey_match
  )
  select
    v_match_id,
    v_user_id_1,
    v_user_id_2,
    v_expiry,
    'You matched! Say hello before the 7-day timer expires 🔥',
    timezone('utc'::text, now()),
    (p.mode = 'lowkey' or recipient.mode = 'lowkey')
  from public.profiles p
  join public.profiles recipient on recipient.id = p_recipient_id
  where p.id = v_sender_id
  on conflict (id)
  do update set expires_at = greatest(public.matches.expires_at, excluded.expires_at);

  return query select true, v_match_id;
end;
$$;

revoke all on function public.record_profile_like(text, text) from public, anon, authenticated;
grant execute on function public.record_profile_like(text, text) to authenticated;
