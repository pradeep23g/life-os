create extension if not exists "pgcrypto";

create table if not exists public.time_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  bucket text not null check (bucket in ('Academics', 'Deep Work', 'Admin', 'Fitness', 'Learning')),
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_time_logs_user_start
  on public.time_logs (user_id, start_time desc);

create index if not exists idx_time_logs_user_end
  on public.time_logs (user_id, end_time desc);

create unique index if not exists idx_time_logs_single_active_per_user
  on public.time_logs (user_id)
  where end_time is null;

alter table public.time_logs enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.time_logs to authenticated;

drop policy if exists "Users can select own time logs" on public.time_logs;
drop policy if exists "Users can insert own time logs" on public.time_logs;
drop policy if exists "Users can update own time logs" on public.time_logs;
drop policy if exists "Users can delete own time logs" on public.time_logs;

create policy "Users can select own time logs"
  on public.time_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own time logs"
  on public.time_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own time logs"
  on public.time_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own time logs"
  on public.time_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);
