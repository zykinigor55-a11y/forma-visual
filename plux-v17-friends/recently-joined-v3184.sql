-- PLUX V31.8.4: optional, authenticated public discovery, never triggered just by install.
create table if not exists public.plux_discovery_opt_in (
  user_id uuid primary key references public.plux_profiles(id) on delete cascade,
  joined_at timestamptz not null default now()
);
alter table public.plux_discovery_opt_in enable row level security;
grant select,insert,delete on public.plux_discovery_opt_in to authenticated;
revoke all on public.plux_discovery_opt_in from anon;
create index if not exists plux_discovery_newest_idx on public.plux_discovery_opt_in(joined_at desc);
create policy plux_discovery_list_authenticated on public.plux_discovery_opt_in
 for select to authenticated using (true);
create policy plux_discovery_join_self on public.plux_discovery_opt_in
 for insert to authenticated with check (user_id = (select auth.uid()));
create policy plux_discovery_leave_self on public.plux_discovery_opt_in
 for delete to authenticated using (user_id = (select auth.uid()));
