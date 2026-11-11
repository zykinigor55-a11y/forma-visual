-- PLUX Friends V17: execute once in a new Supabase project's SQL editor.
-- This is a fresh-install migration. Do not run on an existing schema with same table names.

create table public.plux_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null default 'Участник' check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now()
);

create function public.plux_new_user() returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.plux_profiles(id,handle,display_name)
  values (new.id,'user_'||substr(replace(new.id::text,'-',''),1,16),'Участник');
  return new;
end $$;
create trigger plux_auth_profile after insert on auth.users
for each row execute function public.plux_new_user();

create table public.plux_requests (
 id uuid primary key default gen_random_uuid(),
 from_id uuid not null references public.plux_profiles(id) on delete cascade,
 to_id uuid not null references public.plux_profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted','declined')),
 created_at timestamptz not null default now(),
 unique(from_id,to_id), check (from_id<>to_id)
);
create index plux_requests_to on public.plux_requests(to_id,status,created_at desc);

create table public.plux_friends (
 user_a uuid not null references public.plux_profiles(id) on delete cascade,
 user_b uuid not null references public.plux_profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(user_a,user_b), check(user_a<user_b)
);
create index plux_friends_b on public.plux_friends(user_b);

create table public.plux_dialogs (
 id uuid primary key default gen_random_uuid(),
 user_a uuid not null references public.plux_profiles(id) on delete cascade,
 user_b uuid not null references public.plux_profiles(id) on delete cascade,
 created_at timestamptz not null default now(),
 unique(user_a,user_b), check(user_a<user_b)
);

create table public.plux_messages (
 id uuid primary key default gen_random_uuid(),
 dialog_id uuid not null references public.plux_dialogs(id) on delete cascade,
 sender_id uuid not null references public.plux_profiles(id) on delete cascade,
 content text not null default '' check (char_length(content)<=4000),
 photo_path text check (photo_path is null or char_length(photo_path)<=240),
 created_at timestamptz not null default now(),
 check (char_length(trim(content))>0 or photo_path is not null)
);
create index plux_messages_dialog on public.plux_messages(dialog_id,created_at desc);

alter table public.plux_profiles enable row level security;
alter table public.plux_requests enable row level security;
alter table public.plux_friends enable row level security;
alter table public.plux_dialogs enable row level security;
alter table public.plux_messages enable row level security;

revoke all on public.plux_profiles,public.plux_requests,public.plux_friends,public.plux_dialogs,public.plux_messages from anon,authenticated;
grant select on public.plux_profiles to authenticated;
grant update(handle,display_name) on public.plux_profiles to authenticated;
grant select on public.plux_requests,public.plux_friends,public.plux_dialogs to authenticated;
grant select,insert on public.plux_messages to authenticated;

create policy plux_profiles_read on public.plux_profiles for select to authenticated using(true);
create policy plux_profiles_self_edit on public.plux_profiles for update to authenticated
  using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy plux_requests_self_read on public.plux_requests for select to authenticated
  using(from_id=(select auth.uid()) or to_id=(select auth.uid()));
create policy plux_friends_self_read on public.plux_friends for select to authenticated
  using(user_a=(select auth.uid()) or user_b=(select auth.uid()));
create policy plux_dialogs_self_read on public.plux_dialogs for select to authenticated
  using(user_a=(select auth.uid()) or user_b=(select auth.uid()));
create policy plux_messages_self_read on public.plux_messages for select to authenticated using(
 exists(select 1 from public.plux_dialogs d
   where d.id=dialog_id and ((select auth.uid())=d.user_a or (select auth.uid())=d.user_b))
);
create policy plux_messages_self_insert on public.plux_messages for insert to authenticated with check(
 sender_id=(select auth.uid())
 and exists(select 1 from public.plux_dialogs d
   where d.id=dialog_id and ((select auth.uid())=d.user_a or (select auth.uid())=d.user_b))
 and (photo_path is null or photo_path like dialog_id::text||'/'||(select auth.uid())::text||'/%')
);

-- All mutations to friendship are server-side RPC calls; clients cannot add friends directly.
create function public.plux_request_friend(p_handle text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); recipient uuid; req uuid;
begin
 if me is null then raise exception 'Войдите в аккаунт'; end if;
 select id into recipient from public.plux_profiles where handle=lower(trim(p_handle));
 if recipient is null then raise exception 'Такой пользователь не найден'; end if;
 if recipient=me then raise exception 'Нельзя добавить себя'; end if;
 if exists(select 1 from public.plux_friends where user_a=least(me,recipient) and user_b=greatest(me,recipient))
   then raise exception 'Вы уже друзья'; end if;
 if exists(select 1 from public.plux_requests where from_id=recipient and to_id=me and status='pending')
   then raise exception 'У вас уже есть входящая заявка от этого пользователя'; end if;
 insert into public.plux_requests(from_id,to_id,status)
 values(me,recipient,'pending')
 on conflict(from_id,to_id) do update set status='pending',created_at=now()
 returning id into req;
 return req;
end $$;

create function public.plux_accept_friend(p_request_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare rec public.plux_requests%rowtype; me uuid := auth.uid();
begin
 update public.plux_requests set status='accepted'
 where id=p_request_id and to_id=me and status='pending'
 returning * into rec;
 if not found then raise exception 'Заявка не найдена'; end if;
 insert into public.plux_friends(user_a,user_b)
 values(least(rec.from_id,rec.to_id),greatest(rec.from_id,rec.to_id))
 on conflict do nothing;
 return true;
end $$;

create function public.plux_start_dialog(p_friend_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); ident uuid;
begin
 if me is null or p_friend_id is null or me=p_friend_id then raise exception 'Нет доступа'; end if;
 if not exists(select 1 from public.plux_friends
   where user_a=least(me,p_friend_id) and user_b=greatest(me,p_friend_id))
   then raise exception 'Начать чат можно только с другом'; end if;
 insert into public.plux_dialogs(user_a,user_b)
 values(least(me,p_friend_id),greatest(me,p_friend_id))
 on conflict(user_a,user_b) do update set user_a=excluded.user_a
 returning id into ident;
 return ident;
end $$;

revoke all on function public.plux_request_friend(text),
 public.plux_accept_friend(uuid), public.plux_start_dialog(uuid) from public,anon;
grant execute on function public.plux_request_friend(text),
 public.plux_accept_friend(uuid), public.plux_start_dialog(uuid) to authenticated;

-- Private photos; only chat members can read. No public gallery.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('plux-friends','plux-friends',false,6291456,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

create policy plux_chat_photo_read on storage.objects for select to authenticated using(
 bucket_id='plux-friends' and exists(
 select 1 from public.plux_dialogs d
 where d.id::text=split_part(name,'/',1)
   and ((select auth.uid())=d.user_a or (select auth.uid())=d.user_b))
);
create policy plux_chat_photo_upload on storage.objects for insert to authenticated with check(
 bucket_id='plux-friends'
 and split_part(name,'/',2)=(select auth.uid())::text
 and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}/[a-f0-9-]{36}\.(jpg|png|webp)$'
 and exists(select 1 from public.plux_dialogs d where d.id::text=split_part(name,'/',1)
   and ((select auth.uid())=d.user_a or (select auth.uid())=d.user_b))
);
