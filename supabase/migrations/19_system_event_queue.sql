create table if not exists public.system_event_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table public.system_event_queue enable row level security;

drop policy if exists "system_event_queue_select_own" on public.system_event_queue;
create policy "system_event_queue_select_own"
on public.system_event_queue
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "system_event_queue_insert_own" on public.system_event_queue;
create policy "system_event_queue_insert_own"
on public.system_event_queue
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "system_event_queue_delete_own" on public.system_event_queue;
create policy "system_event_queue_delete_own"
on public.system_event_queue
for delete
to authenticated
using (auth.uid() = user_id);
