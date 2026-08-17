-- Username identity migration
-- Keep legacy matric columns nullable for existing rows and backward compatibility.

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  alter column matric_number drop not null;

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;

alter table public.verification_requests
  add column if not exists username text;

alter table public.verification_requests
  alter column matric_number drop not null;

alter table public.user_reports
  add column if not exists target_username text;

alter table public.user_reports
  alter column target_matric drop not null;

comment on column public.profiles.username is 'Public login identity: 3-24 lowercase letters, numbers, or underscores.';
comment on column public.verification_requests.username is 'Username submitted for identity verification.';
comment on column public.user_reports.target_username is 'Username of the reported profile.';

notify pgrst, 'reload schema';

-- Username login is resolved server-side by the username-login Edge Function.
-- The browser never receives or stores the service-role key.
