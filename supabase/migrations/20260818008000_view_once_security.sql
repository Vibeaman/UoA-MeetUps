create table if not exists public.chat_security_events (
  id text primary key,
  match_id text not null references public.matches(id) on delete cascade,
  message_id text not null references public.messages(id) on delete cascade,
  actor_id text not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('capture_attempt')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists chat_security_events_match_idx
  on public.chat_security_events (match_id, created_at desc);

alter table public.chat_security_events enable row level security;

drop policy if exists "Match participants can read security events" on public.chat_security_events;
drop policy if exists "Match participants can record security events" on public.chat_security_events;

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

create or replace function public.consume_view_once_message(p_message_id text)
returns table(consumed boolean, image_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text := auth.uid()::text;
  v_is_view_once boolean;
  v_was_viewed boolean;
  v_image_url text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select msg.is_view_once, msg.view_once_viewed, msg.image_url
    into v_is_view_once, v_was_viewed, v_image_url
  from public.messages msg
  join public.matches m on m.id = msg.match_id
  where msg.id = p_message_id
    and (v_user_id = m.user_id_1 or v_user_id = m.user_id_2)
  for update of msg;

  if not found or not coalesce(v_is_view_once, false) or coalesce(v_was_viewed, false) then
    return query select false, null::text;
    return;
  end if;

  update public.messages
  set view_once_viewed = true
  where id = p_message_id;

  return query select true, v_image_url;
end;
$$;

revoke all on function public.consume_view_once_message(text) from public, anon, authenticated;
grant execute on function public.consume_view_once_message(text) to authenticated;

-- Realtime is used only for participant-scoped capture alerts; RLS still controls reads.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'chat_security_events'
  ) then
    alter publication supabase_realtime add table public.chat_security_events;
  end if;
end;
$$;
