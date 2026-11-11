-- Run after plux_friends_v17_initial_secure_schema on a newly initialized project.
-- Limits repetitive invitations and high-volume friend requests.
create or replace function public.plux_request_friend(p_handle text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare me uuid := auth.uid(); recipient uuid; req uuid; last_sent timestamptz;
begin
 if me is null then raise exception 'Войдите в аккаунт'; end if;
 select id into recipient from public.plux_profiles where handle=lower(trim(p_handle));
 if recipient is null then raise exception 'Такой пользователь не найден'; end if;
 if recipient=me then raise exception 'Нельзя добавить себя'; end if;
 if exists(select 1 from public.plux_friends where user_a=least(me,recipient) and user_b=greatest(me,recipient))
   then raise exception 'Вы уже друзья'; end if;
 if exists(select 1 from public.plux_requests where from_id=recipient and to_id=me and status='pending')
   then raise exception 'Есть входящая заявка от этого пользователя'; end if;
 if (select count(*) from public.plux_requests where from_id=me and created_at>now()-interval '1 hour') >= 10
   then raise exception 'Не больше 10 заявок за час'; end if;
 select created_at into last_sent from public.plux_requests where from_id=me and to_id=recipient;
 if last_sent is not null and last_sent>now()-interval '24 hours'
   then raise exception 'Повторную заявку можно отправить через сутки'; end if;
 insert into public.plux_requests(from_id,to_id,status) values(me,recipient,'pending')
 on conflict(from_id,to_id) do update set status='pending',created_at=now()
 returning id into req;
 return req;
end $$;
revoke execute on function public.plux_request_friend(text) from public, anon;
grant execute on function public.plux_request_friend(text) to authenticated;
