-- Harden gossip author metadata and add persisted view counting.

create table if not exists public.gossip_post_views (
  post_id text not null references public.gossip_posts(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

create index if not exists gossip_post_views_post_idx
  on public.gossip_post_views (post_id, created_at desc);

alter table public.gossip_post_views enable row level security;
revoke all on public.gossip_post_views from public, anon, authenticated;

create or replace function public.normalize_gossip_post()
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

  if auth.uid() is null or auth.uid()::text <> new.author_id then
    raise exception 'gossip_author_mismatch';
  end if;

  select * into v_profile from public.profiles where id = new.author_id;
  if not found then
    raise exception 'gossip_author_not_found';
  end if;

  new.author_name := case
    when coalesce(new.is_anonymous, false)
      then coalesce(nullif(trim(new.anonymous_alias), ''), 'Anonymous Student 🎭')
    else v_profile.name
  end;
  new.author_avatar := case
    when coalesce(new.is_anonymous, false) then ''
    else coalesce(v_profile.photos[1], '')
  end;
  new.author_department := case
    when coalesce(new.is_anonymous, false) then 'UniAbuja Campus'
    else v_profile.department
  end;
  new.author_level := case
    when coalesce(new.is_anonymous, false) then ''
    else v_profile.level
  end;
  new.anonymous_alias := case
    when coalesce(new.is_anonymous, false)
      then coalesce(nullif(trim(new.anonymous_alias), ''), 'Anonymous Student 🎭')
    else null
  end;
  new.spicy_count := 0;
  new.cap_count := 0;
  new.facts_count := 0;
  new.tea_count := 0;
  new.views_count := 0;
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists normalize_gossip_post on public.gossip_posts;
create trigger normalize_gossip_post
before insert on public.gossip_posts
for each row execute function public.normalize_gossip_post();

drop policy if exists "Authenticated users can create gossip posts" on public.gossip_posts;
create policy "Authenticated users can create gossip posts"
  on public.gossip_posts for insert to authenticated
  with check (auth.uid()::text = author_id);

revoke insert on public.gossip_posts from anon, authenticated;
grant insert (
  id,
  author_id,
  is_anonymous,
  anonymous_alias,
  tag,
  content,
  image_url,
  created_at
) on public.gossip_posts to authenticated;

revoke update on public.gossip_posts from anon, authenticated;

create or replace function public.record_gossip_view(p_post_id text)
returns table(views_count integer, recorded boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_inserted integer := 0;
  v_views integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (select 1 from public.gossip_posts where id = p_post_id) then
    raise exception 'post_not_found';
  end if;

  insert into public.gossip_post_views (post_id, user_id)
  values (p_post_id, v_user_id)
  on conflict (post_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;

  if v_inserted > 0 then
    update public.gossip_posts
    set views_count = coalesce(views_count, 0) + 1
    where id = p_post_id
    returning gossip_posts.views_count into v_views;
  else
    select coalesce(gp.views_count, 0) into v_views
    from public.gossip_posts gp
    where gp.id = p_post_id;
  end if;

  return query select coalesce(v_views, 0), v_inserted > 0;
end;
$$;

revoke all on function public.record_gossip_view(text) from public, anon, authenticated;
grant execute on function public.record_gossip_view(text) to authenticated;
