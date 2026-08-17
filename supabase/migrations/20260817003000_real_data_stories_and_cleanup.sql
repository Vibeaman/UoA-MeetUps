-- Real data migration: shared campus stories and removal of repository seed rows.

create table if not exists public.campus_stories (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  story_image text not null,
  caption text not null check (char_length(caption) between 1 and 140),
  tag text not null default 'Campus Vibe',
  created_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null default (timezone('utc'::text, now()) + interval '24 hours')
);

create index if not exists campus_stories_active_idx
  on public.campus_stories (expires_at desc, created_at desc);

alter table public.campus_stories enable row level security;

drop policy if exists "Public can read active campus stories" on public.campus_stories;
create policy "Public can read active campus stories"
  on public.campus_stories for select
  to anon, authenticated
  using (expires_at > timezone('utc'::text, now()));

drop policy if exists "Authenticated users can create their own stories" on public.campus_stories;
create policy "Authenticated users can create their own stories"
  on public.campus_stories for insert
  to authenticated
  with check (auth.uid()::text = user_id);

drop policy if exists "Authors can update their own stories" on public.campus_stories;
create policy "Authors can update their own stories"
  on public.campus_stories for update
  to authenticated
  using (auth.uid()::text = user_id or public.is_admin())
  with check (auth.uid()::text = user_id or public.is_admin());

drop policy if exists "Authors and admins can delete stories" on public.campus_stories;
create policy "Authors and admins can delete stories"
  on public.campus_stories for delete
  to authenticated
  using (auth.uid()::text = user_id or public.is_admin());

-- Remove only the known repository-generated seed rows. User-created rows are untouched.
delete from public.gossip_reactions where post_id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.gossip_comments where post_id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.gossip_posts where id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.campus_poll_votes where poll_id in ('poll_01', 'poll_02', 'poll_03', 'poll_04');
delete from public.campus_polls where id in ('poll_01', 'poll_02', 'poll_03', 'poll_04');
delete from public.campus_stories where id in ('story_01', 'story_02', 'story_03', 'story_04', 'story_05');
delete from public.user_reports where id in ('report_01', 'report_02');
delete from public.verification_requests where id in ('ver_01', 'ver_02');
delete from public.profiles where id in ('user_me_01', 'user_01', 'user_02', 'user_03', 'user_04', 'user_05', 'user_06', 'user_07', 'user_08');
