-- Replace consume_view_once_message to null out image_url after consuming
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
  set view_once_viewed = true,
      image_url = null
  where id = p_message_id;

  return query select true, v_image_url;
end;
$$;

-- RPC to delete the storage object for a consumed view-once photo
create or replace function public.delete_view_once_media(p_storage_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  
  if not starts_with(p_storage_path, 'chat/') then
    raise exception 'invalid_path';
  end if;

  delete from storage.objects
  where bucket_id = 'user-media'
    and name = p_storage_path;
end;
$$;

revoke all on function public.delete_view_once_media(text) from public, anon, authenticated;
grant execute on function public.delete_view_once_media(text) to authenticated;
