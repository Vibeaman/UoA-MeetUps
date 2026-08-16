-- ============================================================================
-- UniAbuja MeetUps (UoA) - Supabase PostgreSQL Database Schema
-- ============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  matric_number TEXT NOT NULL,
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
  instagram TEXT,
  snapchat TEXT,
  phone_whatsapp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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

-- 4. Identity Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  matric_number TEXT NOT NULL,
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

-- 5. Safety & Disciplinary Reports
CREATE TABLE IF NOT EXISTS user_reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reporter_name TEXT NOT NULL,
  target_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_name TEXT NOT NULL,
  target_matric TEXT NOT NULL,
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
  author_department TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  anonymous_alias TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
