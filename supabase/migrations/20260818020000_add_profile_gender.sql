alter table public.profiles
  add column if not exists gender text not null default 'Prefer not to say';

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (gender in ('Male', 'Female', 'Non-binary', 'Prefer not to say'));

create index if not exists profiles_gender_idx on public.profiles (gender);
