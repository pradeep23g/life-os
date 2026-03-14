create extension if not exists "pgcrypto";

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_value integer not null default 1 check (target_value > 0),
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value integer not null default 1 check (value >= 0),
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood integer not null check (mood between 1 and 5),
  went_well text,
  went_wrong text,
  lesson_learned text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_habits_user_id on public.habits (user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs (habit_id);
create index if not exists idx_habit_logs_user_id on public.habit_logs (user_id);
create index if not exists idx_journal_entries_user_id on public.journal_entries (user_id);

alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "Users can select own habits" on public.habits;
drop policy if exists "Users can insert own habits" on public.habits;
drop policy if exists "Users can update own habits" on public.habits;
drop policy if exists "Users can delete own habits" on public.habits;

drop policy if exists "Users can select own habit logs" on public.habit_logs;
drop policy if exists "Users can insert own habit logs" on public.habit_logs;
drop policy if exists "Users can update own habit logs" on public.habit_logs;
drop policy if exists "Users can delete own habit logs" on public.habit_logs;

drop policy if exists "Users can select own journal entries" on public.journal_entries;
drop policy if exists "Users can insert own journal entries" on public.journal_entries;
drop policy if exists "Users can update own journal entries" on public.journal_entries;
drop policy if exists "Users can delete own journal entries" on public.journal_entries;

create policy "Users can select own habits"
  on public.habits
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own habits"
  on public.habits
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habits"
  on public.habits
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habits"
  on public.habits
  for delete
  using (auth.uid() = user_id);

create policy "Users can select own habit logs"
  on public.habit_logs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit logs"
  on public.habit_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit logs"
  on public.habit_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habit logs"
  on public.habit_logs
  for delete
  using (auth.uid() = user_id);

create policy "Users can select own journal entries"
  on public.journal_entries
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own journal entries"
  on public.journal_entries
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own journal entries"
  on public.journal_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own journal entries"
  on public.journal_entries
  for delete
  using (auth.uid() = user_id);
