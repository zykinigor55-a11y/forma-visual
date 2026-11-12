-- PLUX V31.8 profile avatars. Existing Friends tables and private chat photos remain untouched.
-- Avatar photos are intentionally PUBLIC for display in user search / Friends. Upload/delete is owner-only.
alter table public.plux_profiles add column if not exists avatar_path text;

alter table public.plux_profiles
 add constraint plux_profiles_avatar_owner
 check (
   avatar_path is null
   or (
      avatar_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.webp$'
      and split_part(avatar_path,'/',1)=id::text
   )
 );

grant update(avatar_path) on public.plux_profiles to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values ('plux-avatars','plux-avatars',true,2097152,array['image/webp'])
 on conflict(id) do update set public=true, file_size_limit=2097152, allowed_mime_types=array['image/webp'];

create policy plux_avatar_upload on storage.objects
 for insert to authenticated
 with check (
   bucket_id='plux-avatars'
   and split_part(name,'/',1)=(select auth.uid())::text
   and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.webp$'
 );

create policy plux_avatar_delete on storage.objects
 for delete to authenticated
 using (
   bucket_id='plux-avatars'
   and split_part(name,'/',1)=(select auth.uid())::text
 );
