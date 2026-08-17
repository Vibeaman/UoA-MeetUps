create table if not exists public.payment_transactions (
  id text primary key,
  provider text not null default 'paystack',
  provider_reference text not null unique,
  user_id text references public.profiles(id) on delete set null,
  plan_id text,
  amount_kobo bigint not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  status text not null check (status in ('pending', 'success', 'failed', 'abandoned', 'refunded')),
  paid_at timestamp with time zone,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists payment_transactions_status_paid_at_idx
  on public.payment_transactions (status, paid_at desc);

create table if not exists public.site_sessions (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  anonymous_id text,
  started_at timestamp with time zone not null,
  last_seen_at timestamp with time zone not null,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  ended_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  check (user_id is not null or anonymous_id is not null)
);

create index if not exists site_sessions_last_seen_idx
  on public.site_sessions (last_seen_at desc);

create index if not exists site_sessions_user_id_idx
  on public.site_sessions (user_id);

alter table public.payment_transactions enable row level security;
alter table public.site_sessions enable row level security;

drop policy if exists "Users can read own payment transactions" on public.payment_transactions;
drop policy if exists "Admins can review payment transactions" on public.payment_transactions;
drop policy if exists "Users can insert own site sessions" on public.site_sessions;
drop policy if exists "Users can update own site sessions" on public.site_sessions;

create policy "Users can read own payment transactions"
  on public.payment_transactions for select to authenticated
  using (auth.uid()::text = user_id);

create policy "Admins can review payment transactions"
  on public.payment_transactions for select to authenticated
  using (public.is_admin());

create policy "Users can insert own site sessions"
  on public.site_sessions for insert to anon, authenticated
  with check (user_id is null or auth.uid()::text = user_id);

create policy "Users can update own site sessions"
  on public.site_sessions for update to anon, authenticated
  using (user_id is null or auth.uid()::text = user_id)
  with check (user_id is null or auth.uid()::text = user_id);
