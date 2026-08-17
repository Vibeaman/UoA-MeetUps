-- Tighten function grants and add read-only ownership policies for RPC backing tables.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

create policy "Authenticated users can read their own poll votes"
  on public.campus_poll_votes for select to authenticated
  using (auth.uid()::text = user_id);

create policy "Authenticated users can read their own gossip reactions"
  on public.gossip_reactions for select to authenticated
  using (auth.uid()::text = user_id);

revoke all on function public.vote_campus_poll(text, text) from public, anon, authenticated;
revoke all on function public.react_to_gossip_post(text, text) from public, anon, authenticated;
grant execute on function public.vote_campus_poll(text, text) to authenticated;
grant execute on function public.react_to_gossip_post(text, text) to authenticated;
