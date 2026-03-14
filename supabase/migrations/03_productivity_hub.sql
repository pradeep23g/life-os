create extension if not exists "pgcrypto";

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'To Do' check (status in ('To Do', 'Doing', 'Done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  focus_text text not null,
  week_start_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_user_id on public.tasks (user_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);
create index if not exists idx_weekly_plans_user_id on public.weekly_plans (user_id);
create index if not exists idx_weekly_plans_week_start on public.weekly_plans (week_start_date desc);

alter table public.tasks enable row level security;
alter table public.weekly_plans enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.weekly_plans to authenticated;

drop policy if exists "Users can select own tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can delete own tasks" on public.tasks;

drop policy if exists "Users can select own weekly plans" on public.weekly_plans;
drop policy if exists "Users can insert own weekly plans" on public.weekly_plans;
drop policy if exists "Users can update own weekly plans" on public.weekly_plans;
drop policy if exists "Users can delete own weekly plans" on public.weekly_plans;

create policy "Users can select own tasks"
  on public.tasks
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own weekly plans"
  on public.weekly_plans
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own weekly plans"
  on public.weekly_plans
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own weekly plans"
  on public.weekly_plans
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own weekly plans"
  on public.weekly_plans
  for delete
  to authenticated
  using (auth.uid() = user_id);
