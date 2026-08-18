alter table public.gossip_comments
  add column if not exists author_badge text;

create table if not exists public.gossip_comment_likes (
  comment_id text not null references public.gossip_comments(id) on delete cascade,
  user_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (comment_id, user_id)
);

create index if not exists gossip_comment_likes_comment_idx on public.gossip_comment_likes (comment_id, created_at desc);

create table if not exists public.gossip_reports (
  id text primary key,
  post_id text not null references public.gossip_posts(id) on delete cascade,
  reporter_id text not null references public.profiles(id) on delete cascade,
  details text not null default '',
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  resolved_at timestamptz,
  unique (post_id, reporter_id)
);

create index if not exists gossip_reports_status_idx on public.gossip_reports (status, created_at desc);

create table if not exists public.campus_alerts (
  id text primary key,
  headline text not null,
  message text not null,
  created_by text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null default (timezone('utc'::text, now()) + interval '14 days')
);

create index if not exists campus_alerts_active_idx on public.campus_alerts (expires_at desc, created_at desc);

alter table public.gossip_comment_likes enable row level security;
alter table public.gossip_reports enable row level security;
alter table public.campus_alerts enable row level security;

drop policy if exists "Users can read their own comment likes" on public.gossip_comment_likes;
drop policy if exists "Public can read campus alerts" on public.campus_alerts;
drop policy if exists "Users can create gossip reports" on public.gossip_reports;

create policy "Users can read their own comment likes"
  on public.gossip_comment_likes for select to authenticated
  using (auth.uid()::text = user_id);

create policy "Public can read campus alerts"
  on public.campus_alerts for select to public
  using (expires_at > timezone('utc'::text, now()));

create policy "Users can create gossip reports"
  on public.gossip_reports for insert to authenticated
  with check (auth.uid()::text = reporter_id);

create or replace function public.toggle_gossip_comment_like(p_comment_id text)
returns table(likes integer, user_liked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_exists boolean;
  v_likes integer;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.gossip_comments where id = p_comment_id) then raise exception 'comment_not_found'; end if;

  select exists (
    select 1 from public.gossip_comment_likes
    where comment_id = p_comment_id and user_id = v_user_id
  ) into v_exists;

  if v_exists then
    delete from public.gossip_comment_likes where comment_id = p_comment_id and user_id = v_user_id;
  else
    insert into public.gossip_comment_likes (comment_id, user_id) values (p_comment_id, v_user_id);
  end if;

  select count(*)::integer into v_likes from public.gossip_comment_likes where comment_id = p_comment_id;
  return query select v_likes, not v_exists;
end;
$$;

create or replace function public.fetch_gossip_comments(p_post_id text)
returns table(
  id text,
  post_id text,
  author_name text,
  author_avatar text,
  author_badge text,
  is_anonymous boolean,
  content text,
  created_at timestamptz,
  likes integer,
  user_liked boolean
)
language sql
security invoker
stable
as $$
  select
    gc.id,
    gc.post_id,
    gc.author_name,
    nullif(gc.author_avatar, ''),
    gc.author_badge,
    gc.is_anonymous,
    gc.content,
    gc.created_at,
    count(gcl.user_id)::integer,
    coalesce(bool_or(gcl.user_id = auth.uid()::text), false)
  from public.gossip_comments gc
  left join public.gossip_comment_likes gcl on gcl.comment_id = gc.id
  where gc.post_id = p_post_id
  group by gc.id
  order by gc.created_at asc
  limit 200;
$$;

create or replace function public.report_gossip_post(p_post_id text, p_details text default '')
returns table(report_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_report_id text := format('gossip_report_%s_%s', p_post_id, v_user_id);
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not exists (select 1 from public.gossip_posts where id = p_post_id) then raise exception 'post_not_found'; end if;
  insert into public.gossip_reports (id, post_id, reporter_id, details)
  values (v_report_id, p_post_id, v_user_id, left(coalesce(p_details, ''), 2000))
  on conflict (post_id, reporter_id) do update set details = excluded.details;
  return query select v_report_id;
end;
$$;

revoke all on function public.toggle_gossip_comment_like(text) from public, anon, authenticated;
revoke all on function public.fetch_gossip_comments(text) from public, anon, authenticated;
revoke all on function public.report_gossip_post(text, text) from public, anon, authenticated;
grant execute on function public.toggle_gossip_comment_like(text) to authenticated;
grant execute on function public.fetch_gossip_comments(text) to public;
grant execute on function public.report_gossip_post(text, text) to authenticated;
