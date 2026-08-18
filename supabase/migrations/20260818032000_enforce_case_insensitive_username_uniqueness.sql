-- Usernames are public login identities and must be unique regardless of case or surrounding whitespace.
drop index if exists public.profiles_username_unique;

create unique index if not exists profiles_username_ci_unique
  on public.profiles ((lower(trim(username))))
  where username is not null and trim(username) <> '';

comment on index public.profiles_username_ci_unique is
  'Prevents two profiles from claiming the same username, ignoring case and surrounding whitespace.';

notify pgrst, 'reload schema';

