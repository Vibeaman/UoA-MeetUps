-- Durable campus story likes with an authenticated toggle RPC.
create table if not exists public.campus_story_likes (
  story_id text not null references public.campus_stories(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (story_id, user_id)
);

create index if not exists campus_story_likes_story_idx
  on public.campus_story_likes (story_id, created_at desc);

alter table public.campus_story_likes enable row level security;

drop policy if exists "Users can read their own campus story likes" on public.campus_story_likes;
create policy "Users can read their own campus story likes"
  on public.campus_story_likes for select to authenticated
  using (auth.uid()::text = user_id);

create or replace function public.toggle_campus_story_like(p_story_id text)
returns table(liked boolean, likes_count bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_liked boolean;
  v_story_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select exists(
    select 1
    from public.campus_stories
    where id = p_story_id
      and expires_at > timezone('utc'::text, now())
  ) into v_story_exists;

  if not v_story_exists then
    return query select false, 0::bigint;
    return;
  end if;

  if exists(
    select 1
    from public.campus_story_likes
    where story_id = p_story_id and user_id = v_user_id
  ) then
    delete from public.campus_story_likes
    where story_id = p_story_id and user_id = v_user_id;
    v_liked := false;
  else
    insert into public.campus_story_likes (story_id, user_id)
    values (p_story_id, v_user_id);
    v_liked := true;
  end if;

  return query
  select v_liked, count(*)::bigint
  from public.campus_story_likes
  where story_id = p_story_id;
end;
$$;

revoke all on function public.toggle_campus_story_like(text) from public, anon, authenticated;
grant execute on function public.toggle_campus_story_like(text) to authenticated;

-- Clients mutate story likes only through the authenticated RPC above.
revoke all on table public.campus_story_likes from anon, authenticated;
grant select on table public.campus_story_likes to authenticated;
