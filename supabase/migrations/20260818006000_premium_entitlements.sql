create table if not exists public.premium_entitlements (
  id text primary key,
  user_id text not null unique references public.profiles(id) on delete cascade,
  plan_id text not null check (plan_id in ('weekly', 'monthly', 'semester')),
  provider_reference text unique,
  status text not null check (status in ('active', 'expired', 'revoked', 'refunded')),
  starts_at timestamptz not null default timezone('utc'::text, now()),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists premium_entitlements_user_status_idx
  on public.premium_entitlements (user_id, status, expires_at desc);

alter table public.premium_entitlements enable row level security;

drop policy if exists "Users can read own premium entitlement" on public.premium_entitlements;
create policy "Users can read own premium entitlement"
  on public.premium_entitlements for select to authenticated
  using (auth.uid()::text = user_id);

revoke all on public.premium_entitlements from anon;
revoke all on public.premium_entitlements from authenticated;
grant select on public.premium_entitlements to authenticated;
