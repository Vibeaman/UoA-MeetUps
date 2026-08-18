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
security definer
set search_path = public
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

revoke all on function public.fetch_gossip_comments(text) from public, anon, authenticated;
grant execute on function public.fetch_gossip_comments(text) to public;
