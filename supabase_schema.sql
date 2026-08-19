-- ============================================================================
-- UniAbuja MeetUps (UoA) - Supabase PostgreSQL Database Schema
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  username TEXT,
  gender TEXT NOT NULL DEFAULT 'Prefer not to say' CHECK (gender IN ('Male', 'Female', 'Non-binary', 'Prefer not to say')),
  matric_number TEXT,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  level TEXT NOT NULL,
  campus_location TEXT NOT NULL,
  bio TEXT NOT NULL,
  photos TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'normal', -- 'normal' or 'lowkey'
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- 'unverified' | 'pending' | 'verified' | 'rejected'
  badges TEXT[] NOT NULL DEFAULT '{}',
  is_banned BOOLEAN NOT NULL DEFAULT false,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  instagram TEXT,
  snapchat TEXT,
  phone_whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_ci_unique
  ON public.profiles ((lower(trim(username))))
  WHERE username IS NOT NULL AND trim(username) <> '';

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

  select p.boost_expires_at into v_expires_at
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

-- 2. Swipes & Matches Table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_id_1 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  is_lowkey_match BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS profile_likes (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  like_type TEXT NOT NULL CHECK (like_type IN ('like', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT profile_likes_no_self_like CHECK (sender_id <> recipient_id),
  CONSTRAINT profile_likes_unique_pair UNIQUE (sender_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS profile_likes_recipient_idx ON profile_likes (recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS profile_likes_sender_idx ON profile_likes (sender_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_profile_like(p_recipient_id TEXT, p_like_type TEXT DEFAULT 'like')
RETURNS TABLE(matched BOOLEAN, match_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id TEXT := auth.uid()::text;
  v_sender_banned BOOLEAN;
  v_recipient_banned BOOLEAN;
  v_user_id_1 TEXT;
  v_user_id_2 TEXT;
  v_match_id TEXT;
  v_reciprocal_exists BOOLEAN;
  v_expiry TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now()) + interval '7 days';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_recipient_id IS NULL OR p_recipient_id = v_sender_id THEN RAISE EXCEPTION 'invalid_recipient'; END IF;
  IF p_like_type NOT IN ('like', 'super_like') THEN RAISE EXCEPTION 'invalid_like_type'; END IF;

  SELECT is_banned INTO v_sender_banned FROM public.profiles WHERE id = v_sender_id;
  SELECT is_banned INTO v_recipient_banned FROM public.profiles WHERE id = p_recipient_id;
  IF v_sender_banned IS NULL OR v_recipient_banned IS NULL THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  IF v_sender_banned OR v_recipient_banned THEN RAISE EXCEPTION 'account_unavailable'; END IF;

  INSERT INTO public.profile_likes (id, sender_id, recipient_id, like_type, updated_at)
  VALUES (format('like_%s_%s', v_sender_id, p_recipient_id), v_sender_id, p_recipient_id, p_like_type, timezone('utc'::text, now()))
  ON CONFLICT (sender_id, recipient_id)
  DO UPDATE SET like_type = excluded.like_type, updated_at = excluded.updated_at;

  SELECT EXISTS (
    SELECT 1 FROM public.profile_likes
    WHERE sender_id = p_recipient_id AND recipient_id = v_sender_id
  ) INTO v_reciprocal_exists;
  IF NOT v_reciprocal_exists THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;

  v_user_id_1 := least(v_sender_id, p_recipient_id);
  v_user_id_2 := greatest(v_sender_id, p_recipient_id);
  v_match_id := format('match_%s_%s', v_user_id_1, v_user_id_2);

  INSERT INTO public.matches (id, user_id_1, user_id_2, expires_at, last_message, last_message_time, is_lowkey_match)
  SELECT v_match_id, v_user_id_1, v_user_id_2, v_expiry,
    'You matched! Say hello before the 7-day timer expires 🔥', timezone('utc'::text, now()),
    (p.mode = 'lowkey' OR recipient.mode = 'lowkey')
  FROM public.profiles p
  JOIN public.profiles recipient ON recipient.id = p_recipient_id
  WHERE p.id = v_sender_id
  ON CONFLICT (id) DO UPDATE SET expires_at = greatest(public.matches.expires_at, excluded.expires_at);

  RETURN QUERY SELECT true, v_match_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_profile_like(TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_profile_like(TEXT, TEXT) TO authenticated;

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  image_url TEXT,
  is_view_once BOOLEAN DEFAULT false,
  view_once_viewed BOOLEAN DEFAULT false,
  voice_note_url TEXT,
  voice_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  read BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS chat_security_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('capture_attempt')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS chat_security_events_match_idx ON chat_security_events (match_id, created_at DESC);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_security_events'
  ) then
    alter publication supabase_realtime add table public.chat_security_events;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.consume_view_once_message(p_message_id TEXT)
RETURNS TABLE(consumed BOOLEAN, image_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_is_view_once BOOLEAN;
  v_was_viewed BOOLEAN;
  v_image_url TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT msg.is_view_once, msg.view_once_viewed, msg.image_url
    INTO v_is_view_once, v_was_viewed, v_image_url
  FROM public.messages msg
  JOIN public.matches m ON m.id = msg.match_id
  WHERE msg.id = p_message_id
    AND (v_user_id = m.user_id_1 OR v_user_id = m.user_id_2)
  FOR UPDATE OF msg;
  IF NOT FOUND OR NOT COALESCE(v_is_view_once, false) OR COALESCE(v_was_viewed, false) THEN
    RETURN QUERY SELECT false, NULL::TEXT;
    RETURN;
  END IF;
  UPDATE public.messages SET view_once_viewed = true WHERE id = p_message_id;
  RETURN QUERY SELECT true, v_image_url;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_view_once_message(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_view_once_message(TEXT) TO authenticated;

CREATE TABLE IF NOT EXISTS user_blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_blocks_no_self_block CHECK (blocker_id <> blocked_id),
  CONSTRAINT user_blocks_unique_pair UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocker_idx ON user_blocks (blocker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks (blocked_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.block_user(p_blocked_id TEXT)
RETURNS TABLE(blocked_id TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blocker_id TEXT := auth.uid()::text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF p_blocked_id IS NULL OR p_blocked_id = v_blocker_id THEN RAISE EXCEPTION 'invalid_block_target'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_blocked_id) THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  INSERT INTO public.user_blocks (id, blocker_id, blocked_id)
  VALUES (format('block_%s_%s', v_blocker_id, p_blocked_id), v_blocker_id, p_blocked_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  DELETE FROM public.matches
  WHERE (user_id_1 = v_blocker_id AND user_id_2 = p_blocked_id)
     OR (user_id_1 = p_blocked_id AND user_id_2 = v_blocker_id);
  DELETE FROM public.profile_likes
  WHERE (sender_id = v_blocker_id AND recipient_id = p_blocked_id)
     OR (sender_id = p_blocked_id AND recipient_id = v_blocker_id);
  RETURN QUERY SELECT p_blocked_id;
END;
$$;

REVOKE ALL ON FUNCTION public.block_user(TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_user(TEXT) TO authenticated;

-- 4. Identity Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  username TEXT,
  matric_number TEXT,
  faculty TEXT NOT NULL,
  department TEXT NOT NULL,
  profile_photo TEXT NOT NULL,
  live_selfie_photo TEXT NOT NULL,
  student_id_photo TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- A student may have many historical requests, but only one request awaiting review.
CREATE UNIQUE INDEX IF NOT EXISTS verification_requests_one_pending_per_user_idx
  ON public.verification_requests (user_id)
  WHERE status = 'pending';

-- 5. Safety & Disciplinary Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  target_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_name TEXT NOT NULL,
  target_username TEXT,
  target_matric TEXT,
  target_photo TEXT,
  reason TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'resolved' | 'banned'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. Campus Gossip & Tea Board Posts
CREATE TABLE IF NOT EXISTS gossip_posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  author_department TEXT NOT NULL,
  author_level TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  anonymous_alias TEXT,
  tag TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  spicy_count INTEGER DEFAULT 0,
  cap_count INTEGER DEFAULT 0,
  facts_count INTEGER DEFAULT 0,
  tea_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Gossip Post Comments
CREATE TABLE IF NOT EXISTS gossip_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES gossip_posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT NOT NULL,
  author_badge TEXT,
  author_department TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  anonymous_alias TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS gossip_comment_likes (
  comment_id TEXT NOT NULL REFERENCES gossip_comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS gossip_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES gossip_posts(id) ON DELETE CASCADE,
  reporter_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (post_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS campus_alerts (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (timezone('utc'::text, now()) + interval '14 days')
);

CREATE OR REPLACE FUNCTION public.toggle_gossip_comment_like(p_comment_id TEXT)
RETURNS TABLE(likes INTEGER, user_liked BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_exists BOOLEAN;
  v_likes INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.gossip_comments WHERE id = p_comment_id) THEN RAISE EXCEPTION 'comment_not_found'; END IF;
  SELECT EXISTS (SELECT 1 FROM public.gossip_comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id) INTO v_exists;
  IF v_exists THEN
    DELETE FROM public.gossip_comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id;
  ELSE
    INSERT INTO public.gossip_comment_likes (comment_id, user_id) VALUES (p_comment_id, v_user_id);
  END IF;
  SELECT count(*)::integer INTO v_likes FROM public.gossip_comment_likes WHERE comment_id = p_comment_id;
  RETURN QUERY SELECT v_likes, NOT v_exists;
END;
$$;

CREATE OR REPLACE FUNCTION public.fetch_gossip_comments(p_post_id TEXT)
RETURNS TABLE(id TEXT, post_id TEXT, author_name TEXT, author_avatar TEXT, author_badge TEXT, is_anonymous BOOLEAN, content TEXT, created_at TIMESTAMPTZ, likes INTEGER, user_liked BOOLEAN)
LANGUAGE SQL SECURITY INVOKER STABLE AS $$
  SELECT gc.id, gc.post_id, gc.author_name, nullif(gc.author_avatar, ''), gc.author_badge, gc.is_anonymous, gc.content, gc.created_at,
    count(gcl.user_id)::integer, coalesce(bool_or(gcl.user_id = auth.uid()::text), false)
  FROM public.gossip_comments gc
  LEFT JOIN public.gossip_comment_likes gcl ON gcl.comment_id = gc.id
  WHERE gc.post_id = p_post_id
  GROUP BY gc.id
  ORDER BY gc.created_at ASC
  LIMIT 200;
$$;

CREATE OR REPLACE FUNCTION public.report_gossip_post(p_post_id TEXT, p_details TEXT DEFAULT '')
RETURNS TABLE(report_id TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id TEXT := auth.uid()::text;
  v_report_id TEXT := format('gossip_report_%s_%s', p_post_id, v_user_id);
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.gossip_posts WHERE id = p_post_id) THEN RAISE EXCEPTION 'post_not_found'; END IF;
  INSERT INTO public.gossip_reports (id, post_id, reporter_id, details)
  VALUES (v_report_id, p_post_id, v_user_id, left(coalesce(p_details, ''), 2000))
  ON CONFLICT (post_id, reporter_id) DO UPDATE SET details = excluded.details;
  RETURN QUERY SELECT v_report_id;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_gossip_comment_like(TEXT) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.fetch_gossip_comments(TEXT) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.report_gossip_post(TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_gossip_comment_like(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_gossip_comments(TEXT) TO public;
GRANT EXECUTE ON FUNCTION public.report_gossip_post(TEXT, TEXT) TO authenticated;

-- 8. Campus Polls
CREATE TABLE IF NOT EXISTS campus_polls (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of { id, text, votes }
  total_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 9. Public read / authenticated write policies for community surfaces
-- These policies allow signed-out visitors to observe content while requiring
-- a Supabase Auth session for votes, poll suggestions, posts, comments, and edits.
alter table campus_polls enable row level security;
alter table gossip_posts enable row level security;
alter table gossip_comments enable row level security;

drop policy if exists "Public can read campus polls" on campus_polls;
create policy "Public can read campus polls"
  on campus_polls for select
  using (true);

drop policy if exists "Authenticated users can create campus polls" on campus_polls;
create policy "Authenticated users can create campus polls"
  on campus_polls for insert to authenticated
  with check (true);

drop policy if exists "Authenticated users can update campus polls" on campus_polls;
create policy "Authenticated users can update campus polls"
  on campus_polls for update to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read gossip posts" on gossip_posts;
create policy "Public can read gossip posts"
  on gossip_posts for select
  using (true);

drop policy if exists "Authenticated users can create gossip posts" on gossip_posts;
create policy "Authenticated users can create gossip posts"
  on gossip_posts for insert to authenticated
  with check (true);

drop policy if exists "Authenticated users can update gossip posts" on gossip_posts;
create policy "Authenticated users can update gossip posts"
  on gossip_posts for update to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read gossip comments" on gossip_comments;
create policy "Public can read gossip comments"
  on gossip_comments for select
  using (true);

drop policy if exists "Authenticated users can create gossip comments" on gossip_comments;
create policy "Authenticated users can create gossip comments"
  on gossip_comments for insert to authenticated
  with check (true);


-- 10. User media storage for gallery uploads
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view UoA MeetUps media" on storage.objects;
create policy "Public can view UoA MeetUps media"
  on storage.objects for select
  using (bucket_id = 'user-media');

drop policy if exists "Authenticated users can upload their own media" on storage.objects;
create policy "Authenticated users can upload their own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'user-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Authenticated users can update their own media" on storage.objects;
create policy "Authenticated users can update their own media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'user-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'user-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Authenticated users can delete their own media" on storage.objects;
create policy "Authenticated users can delete their own media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'user-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );


-- Secure admin and least-privilege RLS migration (also available under supabase/migrations) --
-- Secure admin authorization and least-privilege RLS policies.
-- The admin-auth Edge Function validates the staff password server-side.
-- Supabase service_role remains the only unrestricted database role.

alter table public.campus_polls
  add column if not exists created_by text;

create table if not exists public.campus_poll_votes (
  poll_id text not null references public.campus_polls(id) on delete cascade,
  user_id text not null,
  option_id text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (poll_id, user_id)
);

create table if not exists public.gossip_reactions (
  post_id text not null references public.gossip_posts(id) on delete cascade,
  user_id text not null,
  reaction_type text not null check (reaction_type in ('spicy', 'cap', 'facts', 'tea')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (post_id, user_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.profile_likes enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.chat_security_events enable row level security;
alter table public.verification_requests enable row level security;
alter table public.user_reports enable row level security;
alter table public.gossip_posts enable row level security;
alter table public.gossip_comments enable row level security;
alter table public.gossip_comment_likes enable row level security;
alter table public.gossip_reports enable row level security;
alter table public.campus_alerts enable row level security;
alter table public.campus_polls enable row level security;
alter table public.campus_poll_votes enable row level security;
alter table public.gossip_reactions enable row level security;

-- Remove the original broad community update policies and any prior hardening names.
drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;
drop policy if exists "Users can read their own matches" on public.matches;
drop policy if exists "Users can create matches involving themselves" on public.matches;
drop policy if exists "Users can update their own matches" on public.matches;
drop policy if exists "Users can delete their own matches" on public.matches;
drop policy if exists "Users can read likes involving themselves" on public.profile_likes;
drop policy if exists "Users can create their own likes" on public.profile_likes;
drop policy if exists "Users can update their own likes" on public.profile_likes;
drop policy if exists "Users can delete their own likes" on public.profile_likes;
drop policy if exists "Users can read their own blocks" on public.user_blocks;
drop policy if exists "Users can create their own blocks" on public.user_blocks;
drop policy if exists "Users can delete their own blocks" on public.user_blocks;
drop policy if exists "Match participants can read security events" on public.chat_security_events;
drop policy if exists "Match participants can record security events" on public.chat_security_events;
drop policy if exists "Match participants can read messages" on public.messages;
drop policy if exists "Users can send messages in their matches" on public.messages;
drop policy if exists "Message senders can delete messages" on public.messages;
drop policy if exists "Users can submit their own verification requests" on public.verification_requests;
drop policy if exists "Users can read their own verification requests" on public.verification_requests;
drop policy if exists "Admins can review verification requests" on public.verification_requests;
drop policy if exists "Users can submit their own reports" on public.user_reports;
drop policy if exists "Users can read their own reports" on public.user_reports;
drop policy if exists "Admins can review reports" on public.user_reports;
drop policy if exists "Public can read campus polls" on public.campus_polls;
drop policy if exists "Authenticated users can create campus polls" on public.campus_polls;
drop policy if exists "Authenticated users can update campus polls" on public.campus_polls;
drop policy if exists "Admins can manage campus polls" on public.campus_polls;
drop policy if exists "Public can read gossip posts" on public.gossip_posts;
drop policy if exists "Authenticated users can create gossip posts" on public.gossip_posts;
drop policy if exists "Authenticated users can update gossip posts" on public.gossip_posts;
drop policy if exists "Users can update their own gossip posts" on public.gossip_posts;
drop policy if exists "Users can delete their own gossip posts" on public.gossip_posts;
drop policy if exists "Admins can moderate gossip posts" on public.gossip_posts;
drop policy if exists "Public can read gossip comments" on public.gossip_comments;
drop policy if exists "Authenticated users can create gossip comments" on public.gossip_comments;
drop policy if exists "Users can update their own gossip comments" on public.gossip_comments;
drop policy if exists "Users can delete their own gossip comments" on public.gossip_comments;
drop policy if exists "Users can read their own comment likes" on public.gossip_comment_likes;
drop policy if exists "Users can create gossip reports" on public.gossip_reports;
drop policy if exists "Admins can review gossip reports" on public.gossip_reports;
drop policy if exists "Admins can update gossip reports" on public.gossip_reports;
drop policy if exists "Public can read campus alerts" on public.campus_alerts;
drop policy if exists "Authenticated users can read their own poll votes" on public.campus_poll_votes;
drop policy if exists "Authenticated users can read their own gossip reactions" on public.gossip_reactions;

create policy "Public can read profiles"
  on public.profiles for select to public
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid()::text = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid()::text = id)
  with check (auth.uid()::text = id);

create policy "Admins can update profiles"
  on public.profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can delete their own profile"
  on public.profiles for delete to authenticated
  using (auth.uid()::text = id);

create policy "Users can read their own matches"
  on public.matches for select to authenticated
  using (auth.uid()::text = user_id_1 or auth.uid()::text = user_id_2);

create policy "Users can create matches involving themselves"
  on public.matches for insert to authenticated
  with check (auth.uid()::text = user_id_1 or auth.uid()::text = user_id_2);

create policy "Users can update their own matches"
  on public.matches for update to authenticated
  using (auth.uid()::text = user_id_1 or auth.uid()::text = user_id_2)
  with check (auth.uid()::text = user_id_1 or auth.uid()::text = user_id_2);

create policy "Users can delete their own matches"
  on public.matches for delete to authenticated
  using (auth.uid()::text = user_id_1 or auth.uid()::text = user_id_2);

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

create policy "Users can read their own blocks"
  on public.user_blocks for select to authenticated
  using (auth.uid()::text = blocker_id);

create policy "Users can create their own blocks"
  on public.user_blocks for insert to authenticated
  with check (auth.uid()::text = blocker_id);

create policy "Users can delete their own blocks"
  on public.user_blocks for delete to authenticated
  using (auth.uid()::text = blocker_id);

create policy "Match participants can read security events"
  on public.chat_security_events for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = chat_security_events.match_id
        and (auth.uid()::text = m.user_id_1 or auth.uid()::text = m.user_id_2)
    )
  );

create policy "Match participants can record security events"
  on public.chat_security_events for insert to authenticated
  with check (
    auth.uid()::text = actor_id
    and exists (
      select 1 from public.matches m
      join public.messages msg on msg.match_id = m.id
      where m.id = chat_security_events.match_id
        and msg.id = chat_security_events.message_id
        and (auth.uid()::text = m.user_id_1 or auth.uid()::text = m.user_id_2)
    )
  );

create policy "Match participants can read messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (auth.uid()::text = m.user_id_1 or auth.uid()::text = m.user_id_2)
    )
  );

create policy "Users can send messages in their matches"
  on public.messages for insert to authenticated
  with check (
    auth.uid()::text = sender_id
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (auth.uid()::text = m.user_id_1 or auth.uid()::text = m.user_id_2)
    )
  );

create policy "Message senders can delete messages"
  on public.messages for delete to authenticated
  using (auth.uid()::text = sender_id);

create policy "Users can submit their own verification requests"
  on public.verification_requests for insert to authenticated
  with check (auth.uid()::text = user_id);

create policy "Users can read their own verification requests"
  on public.verification_requests for select to authenticated
  using (auth.uid()::text = user_id);

create policy "Admins can review verification requests"
  on public.verification_requests for select to authenticated
  using (public.is_admin());

create policy "Admins can update verification requests"
  on public.verification_requests for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Users can submit their own reports"
  on public.user_reports for insert to authenticated
  with check (auth.uid()::text = reporter_id);

create policy "Users can read their own reports"
  on public.user_reports for select to authenticated
  using (auth.uid()::text = reporter_id);

create policy "Admins can review reports"
  on public.user_reports for select to authenticated
  using (public.is_admin());

create policy "Admins can update reports"
  on public.user_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read campus polls"
  on public.campus_polls for select to public
  using (true);

create policy "Authenticated users can create campus polls"
  on public.campus_polls for insert to authenticated
  with check (auth.uid()::text = created_by);

create policy "Admins can manage campus polls"
  on public.campus_polls for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read gossip posts"
  on public.gossip_posts for select to public
  using (true);

create policy "Authenticated users can create gossip posts"
  on public.gossip_posts for insert to authenticated
  with check (auth.uid()::text = author_id);

create policy "Users can update their own gossip posts"
  on public.gossip_posts for update to authenticated
  using (auth.uid()::text = author_id)
  with check (auth.uid()::text = author_id);

create policy "Users can delete their own gossip posts"
  on public.gossip_posts for delete to authenticated
  using (auth.uid()::text = author_id);

create policy "Admins can moderate gossip posts"
  on public.gossip_posts for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read gossip comments"
  on public.gossip_comments for select to public
  using (true);

create policy "Authenticated users can create gossip comments"
  on public.gossip_comments for insert to authenticated
  with check (auth.uid()::text = author_id);

create policy "Users can update their own gossip comments"
  on public.gossip_comments for update to authenticated
  using (auth.uid()::text = author_id)
  with check (auth.uid()::text = author_id);

create policy "Users can delete their own gossip comments"
  on public.gossip_comments for delete to authenticated
  using (auth.uid()::text = author_id);

create policy "Users can read their own comment likes"
  on public.gossip_comment_likes for select to authenticated
  using (auth.uid()::text = user_id);

create policy "Users can create gossip reports"
  on public.gossip_reports for insert to authenticated
  with check (auth.uid()::text = reporter_id);

create policy "Admins can review gossip reports"
  on public.gossip_reports for select to authenticated
  using (public.is_admin());

create policy "Admins can update gossip reports"
  on public.gossip_reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Public can read campus alerts"
  on public.campus_alerts for select to public
  using (expires_at > timezone('utc'::text, now()));

-- Votes and reactions are private write models. Clients mutate them only through
-- the SECURITY DEFINER functions below, which validate the authenticated user.
create or replace function public.vote_campus_poll(p_poll_id text, p_option_id text)
returns table(total_votes integer, options jsonb, user_voted_option_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_current_option text;
  v_options jsonb;
  v_delta integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select cp.options into v_options
  from public.campus_polls cp
  where cp.id = p_poll_id;

  if v_options is null then
    raise exception 'poll_not_found';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(v_options) as item(option)
    where item.option ->> 'id' = p_option_id
  ) then
    raise exception 'poll_option_not_found';
  end if;

  select cpv.option_id into v_current_option
  from public.campus_poll_votes cpv
  where cpv.poll_id = p_poll_id and cpv.user_id = v_user_id;

  if v_current_option = p_option_id then
    return query
      select cp.total_votes, cp.options, v_current_option
      from public.campus_polls cp
      where cp.id = p_poll_id;
    return;
  end if;

  if v_current_option is null then
    v_delta := 1;
  end if;

  insert into public.campus_poll_votes (poll_id, user_id, option_id)
  values (p_poll_id, v_user_id, p_option_id)
  on conflict (poll_id, user_id) do update
    set option_id = excluded.option_id;

  update public.campus_polls cp
  set options = updated.options,
      total_votes = coalesce(cp.total_votes, 0) + v_delta
  from (
    select jsonb_agg(
      case
        when item.option ->> 'id' = p_option_id then
          jsonb_set(item.option, '{votes}', to_jsonb(coalesce((item.option ->> 'votes')::integer, 0) + 1), true)
        when v_current_option is not null and item.option ->> 'id' = v_current_option then
          jsonb_set(item.option, '{votes}', to_jsonb(greatest(coalesce((item.option ->> 'votes')::integer, 0) - 1, 0)), true)
        else item.option
      end
      order by item.ordinality
    ) as options
    from jsonb_array_elements(v_options) with ordinality as item(option, ordinality)
  ) as updated
  where cp.id = p_poll_id;

  return query
    select cp.total_votes, cp.options, p_option_id
    from public.campus_polls cp
    where cp.id = p_poll_id;
end;
$$;

create or replace function public.react_to_gossip_post(p_post_id text, p_reaction_type text)
returns table(spicy_count integer, cap_count integer, facts_count integer, tea_count integer, user_reaction text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_current_reaction text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_reaction_type not in ('spicy', 'cap', 'facts', 'tea') then
    raise exception 'invalid_reaction_type';
  end if;

  if not exists (select 1 from public.gossip_posts gp where gp.id = p_post_id) then
    raise exception 'post_not_found';
  end if;

  select gr.reaction_type into v_current_reaction
  from public.gossip_reactions gr
  where gr.post_id = p_post_id and gr.user_id = v_user_id;

  if v_current_reaction = p_reaction_type then
    delete from public.gossip_reactions
    where post_id = p_post_id and user_id = v_user_id;
  else
    insert into public.gossip_reactions (post_id, user_id, reaction_type)
    values (p_post_id, v_user_id, p_reaction_type)
    on conflict (post_id, user_id) do update
      set reaction_type = excluded.reaction_type;
  end if;

  update public.gossip_posts gp
  set spicy_count = counts.spicy_count,
      cap_count = counts.cap_count,
      facts_count = counts.facts_count,
      tea_count = counts.tea_count
  from (
    select
      count(*) filter (where gr.reaction_type = 'spicy')::integer as spicy_count,
      count(*) filter (where gr.reaction_type = 'cap')::integer as cap_count,
      count(*) filter (where gr.reaction_type = 'facts')::integer as facts_count,
      count(*) filter (where gr.reaction_type = 'tea')::integer as tea_count
    from public.gossip_reactions gr
    where gr.post_id = p_post_id
  ) as counts
  where gp.id = p_post_id;

  return query
    select gp.spicy_count, gp.cap_count, gp.facts_count, gp.tea_count,
      case when v_current_reaction = p_reaction_type then null else p_reaction_type end
    from public.gossip_posts gp
    where gp.id = p_post_id;
end;
$$;

revoke all on function public.vote_campus_poll(text, text) from public;
revoke all on function public.react_to_gossip_post(text, text) from public;
grant execute on function public.vote_campus_poll(text, text) to authenticated;
grant execute on function public.react_to_gossip_post(text, text) to authenticated;

-- No direct client policy is granted on these tables; the RPCs are the only
-- authenticated mutation path and both functions validate auth.uid().


-- Tighten RPC grants and private vote/reaction RLS --
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

-- Remove only known repository-generated seed rows. User-created rows are untouched.
delete from public.gossip_reactions where post_id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.gossip_comments where post_id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.gossip_posts where id in ('gossip_01', 'gossip_02', 'gossip_03', 'gossip_04', 'gossip_05');
delete from public.campus_poll_votes where poll_id in ('poll_01', 'poll_02', 'poll_03', 'poll_04');
delete from public.campus_polls where id in ('poll_01', 'poll_02', 'poll_03', 'poll_04');
delete from public.campus_stories where id in ('story_01', 'story_02', 'story_03', 'story_04', 'story_05');
delete from public.user_reports where id in ('report_01', 'report_02');
delete from public.verification_requests where id in ('ver_01', 'ver_02');
delete from public.profiles where id in ('user_me_01', 'user_01', 'user_02', 'user_03', 'user_04', 'user_05', 'user_06', 'user_07', 'user_08');


-- 17. Admin payment and engagement telemetry
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_reference TEXT NOT NULL UNIQUE,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_id TEXT,
  amount_kobo BIGINT NOT NULL CHECK (amount_kobo >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.premium_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('weekly', 'monthly', 'semester')),
  provider_reference TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'revoked', 'refunded')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS premium_entitlements_user_status_idx
  ON public.premium_entitlements (user_id, status, expires_at DESC);

ALTER TABLE public.premium_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own premium entitlement" ON public.premium_entitlements;
CREATE POLICY "Users can read own premium entitlement"
  ON public.premium_entitlements FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id);

REVOKE ALL ON public.premium_entitlements FROM anon;
REVOKE ALL ON public.premium_entitlements FROM authenticated;
GRANT SELECT ON public.premium_entitlements TO authenticated;

CREATE TABLE IF NOT EXISTS public.site_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can read own payment transactions"
  ON public.payment_transactions FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert own site sessions" ON public.site_sessions;
CREATE POLICY "Users can insert own site sessions"
  ON public.site_sessions FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own site sessions" ON public.site_sessions;
CREATE POLICY "Users can update own site sessions"
  ON public.site_sessions FOR UPDATE TO anon, authenticated
  USING (user_id IS NULL OR auth.uid()::text = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid()::text = user_id);


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


-- Account-scoped notifications generated by trusted database events.
create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id text not null references public.profiles(id) on delete cascade,
  actor_id text references public.profiles(id) on delete set null,
  actor_name text,
  actor_avatar text,
  type text not null check (type in ('story_like', 'profile_like', 'match', 'message', 'verification')),
  entity_id text,
  title text not null,
  body text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  read_at timestamptz
);

create index if not exists app_notifications_recipient_idx
  on public.app_notifications (recipient_id, created_at desc);

alter table public.app_notifications enable row level security;

drop policy if exists "Users can read their own notifications" on public.app_notifications;
create policy "Users can read their own notifications"
  on public.app_notifications for select to authenticated
  using (auth.uid()::text = recipient_id);

drop policy if exists "Users can mark their own notifications read" on public.app_notifications;
create policy "Users can mark their own notifications read"
  on public.app_notifications for update to authenticated
  using (auth.uid()::text = recipient_id)
  with check (auth.uid()::text = recipient_id);

revoke all on table public.app_notifications from anon, authenticated;
grant select, update on table public.app_notifications to authenticated;

create or replace function public.notify_story_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text;
  v_actor_name text;
  v_actor_avatar text;
begin
  select s.user_id into v_owner_id from public.campus_stories s where s.id = new.story_id;
  if v_owner_id is null or v_owner_id = new.user_id then return new; end if;
  select p.name, coalesce(p.photos[1], '') into v_actor_name, v_actor_avatar from public.profiles p where p.id = new.user_id;
  insert into public.app_notifications (recipient_id, actor_id, actor_name, actor_avatar, type, entity_id, title, body)
  values (v_owner_id, new.user_id, coalesce(v_actor_name, 'A UniAbuja student'), nullif(v_actor_avatar, ''), 'story_like', new.story_id, 'Someone liked your story', coalesce(v_actor_name, 'A UniAbuja student') || ' liked your campus story.');
  return new;
end;
$$;

drop trigger if exists campus_story_like_notification on public.campus_story_likes;
create trigger campus_story_like_notification after insert on public.campus_story_likes for each row execute function public.notify_story_like();

create or replace function public.notify_profile_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_actor_name text; v_actor_avatar text;
begin
  select p.name, coalesce(p.photos[1], '') into v_actor_name, v_actor_avatar from public.profiles p where p.id = new.sender_id;
  if new.sender_id = new.recipient_id then return new; end if;
  insert into public.app_notifications (recipient_id, actor_id, actor_name, actor_avatar, type, entity_id, title, body)
  values (new.recipient_id, new.sender_id, coalesce(v_actor_name, 'A UniAbuja student'), nullif(v_actor_avatar, ''), 'profile_like', new.sender_id, case when new.like_type = 'super_like' then 'You received a Super Like' else 'You received a new Like' end, coalesce(v_actor_name, 'A UniAbuja student') || case when new.like_type = 'super_like' then ' sent you a Super Like.' else ' liked your profile.' end);
  return new;
end;
$$;

drop trigger if exists profile_like_notification on public.profile_likes;
create trigger profile_like_notification after insert on public.profile_likes for each row execute function public.notify_profile_like();

create or replace function public.notify_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_user_name text; v_user_avatar text; v_other_name text; v_other_avatar text;
begin
  select p.name, coalesce(p.photos[1], '') into v_user_name, v_user_avatar from public.profiles p where p.id = new.user_id_1;
  select p.name, coalesce(p.photos[1], '') into v_other_name, v_other_avatar from public.profiles p where p.id = new.user_id_2;
  insert into public.app_notifications (recipient_id, actor_id, actor_name, actor_avatar, type, entity_id, title, body)
  values (new.user_id_1, new.user_id_2, v_other_name, nullif(v_other_avatar, ''), 'match', new.id, 'It’s a Match', coalesce(v_other_name, 'A student') || ' matched with you.'),
         (new.user_id_2, new.user_id_1, v_user_name, nullif(v_user_avatar, ''), 'match', new.id, 'It’s a Match', coalesce(v_user_name, 'A student') || ' matched with you.');
  return new;
end;
$$;

drop trigger if exists match_notification on public.matches;
create trigger match_notification after insert on public.matches for each row execute function public.notify_match();

create or replace function public.notify_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_recipient_id text; v_actor_name text; v_actor_avatar text; v_preview text;
begin
  select case when m.user_id_1 = new.sender_id then m.user_id_2 else m.user_id_1 end into v_recipient_id from public.matches m where m.id = new.match_id;
  if v_recipient_id is null then return new; end if;
  select p.name, coalesce(p.photos[1], '') into v_actor_name, v_actor_avatar from public.profiles p where p.id = new.sender_id;
  v_preview := case when coalesce(new.image_url, '') <> '' then 'Sent you a photo.' else left(nullif(new.text, ''), 90) end;
  insert into public.app_notifications (recipient_id, actor_id, actor_name, actor_avatar, type, entity_id, title, body)
  values (v_recipient_id, new.sender_id, v_actor_name, nullif(v_actor_avatar, ''), 'message', new.match_id, 'New message', coalesce(v_actor_name, 'A match') || ': ' || coalesce(v_preview, 'Sent you a message.'));
  return new;
end;
$$;

drop trigger if exists message_notification on public.messages;
create trigger message_notification after insert on public.messages for each row execute function public.notify_message();

create or replace function public.notify_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_body text;
begin
  if old.status is not distinct from new.status or new.status not in ('approved', 'rejected') then return new; end if;
  v_body := case when new.status = 'approved' then 'Your UniAbuja identity verification was approved.' else 'Your verification needs attention: ' || coalesce(new.admin_note, 'Please review your submission and try again.') end;
  insert into public.app_notifications (recipient_id, type, entity_id, title, body)
  values (new.user_id, 'verification', new.id, case when new.status = 'approved' then 'Verification approved' else 'Verification update' end, v_body);
  return new;
end;
$$;

drop trigger if exists verification_notification on public.verification_requests;
create trigger verification_notification after update of status on public.verification_requests for each row execute function public.notify_verification();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_notifications') then
    alter publication supabase_realtime add table public.app_notifications;
  end if;
end;
$$;


-- 15. Protect verification, moderation, badge, and boost fields from client writes
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


-- Restrict authenticated profile updates to editable columns only.
revoke update on table public.profiles from anon, authenticated;
grant update (
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
  instagram,
  snapchat
) on table public.profiles to authenticated;


-- Publish chat message inserts for realtime delivery.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end;
$$;
