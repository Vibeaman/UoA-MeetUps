-- Replace the broad profile UPDATE grant with an editable-column allowlist.
-- Protected verification, moderation, badge, boost, legacy identity, and contact columns
-- remain writable only through trusted server-side workflows.

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
