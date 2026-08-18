create table if not exists public.user_blocks (
  id text primary key,
  blocker_id text not null references public.profiles(id) on delete cascade,
  blocked_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint user_blocks_no_self_block check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

create index if not exists user_blocks_blocker_idx on public.user_blocks (blocker_id, created_at desc);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id, created_at desc);

alter table public.user_blocks enable row level security;

drop policy if exists "Users can read their own blocks" on public.user_blocks;
drop policy if exists "Users can create their own blocks" on public.user_blocks;
drop policy if exists "Users can delete their own blocks" on public.user_blocks;

create policy "Users can read their own blocks"
  on public.user_blocks for select to authenticated
  using (auth.uid()::text = blocker_id);

create policy "Users can create their own blocks"
  on public.user_blocks for insert to authenticated
  with check (auth.uid()::text = blocker_id);

create policy "Users can delete their own blocks"
  on public.user_blocks for delete to authenticated
  using (auth.uid()::text = blocker_id);

create or replace function public.block_user(p_blocked_id text)
returns table(blocked_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blocker_id text := auth.uid()::text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_blocked_id is null or p_blocked_id = v_blocker_id then raise exception 'invalid_block_target'; end if;
  if not exists (select 1 from public.profiles where id = p_blocked_id) then raise exception 'profile_not_found'; end if;

  insert into public.user_blocks (id, blocker_id, blocked_id)
  values (format('block_%s_%s', v_blocker_id, p_blocked_id), v_blocker_id, p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;

  delete from public.matches
  where (user_id_1 = v_blocker_id and user_id_2 = p_blocked_id)
     or (user_id_1 = p_blocked_id and user_id_2 = v_blocker_id);

  delete from public.profile_likes
  where (sender_id = v_blocker_id and recipient_id = p_blocked_id)
     or (sender_id = p_blocked_id and recipient_id = v_blocker_id);

  return query select p_blocked_id;
end;
$$;

revoke all on function public.block_user(text) from public, anon, authenticated;
grant execute on function public.block_user(text) to authenticated;
