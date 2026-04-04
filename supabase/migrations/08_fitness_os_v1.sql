create extension if not exists "pgcrypto";

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'events'
  ) then
    alter table public.events
      drop constraint if exists events_domain_check;

    alter table public.events
      add constraint events_domain_check
      check (domain in ('mind-os', 'productivity-hub', 'progress-hub', 'mission-control', 'fitness-os'));
  end if;
end $$;

create table if not exists public.fitness_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  equipment text,
  primary_muscle text,
  default_unit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_date date not null,
  title text not null,
  session_type text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.fitness_exercises (id),
  order_index integer not null default 0 check (order_index >= 0),
  sets integer check (sets >= 0),
  reps_total integer check (reps_total >= 0),
  weight_kg numeric(8, 2) check (weight_kg >= 0),
  duration_minutes integer check (duration_minutes >= 0),
  distance_km numeric(8, 2) check (distance_km >= 0),
  rpe integer check (rpe between 1 and 10),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (workout_id, order_index)
);

create index if not exists idx_fitness_exercises_user on public.fitness_exercises (user_id, created_at desc);
create index if not exists idx_fitness_exercises_active on public.fitness_exercises (user_id, name) where deleted_at is null;
create index if not exists idx_workouts_user_date on public.workouts (user_id, workout_date desc, created_at desc);
create index if not exists idx_workouts_active on public.workouts (user_id, workout_date desc) where deleted_at is null;
create index if not exists idx_exercise_logs_workout on public.exercise_logs (workout_id, order_index);
create index if not exists idx_exercise_logs_active on public.exercise_logs (user_id, workout_id, order_index) where deleted_at is null;

alter table public.fitness_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.exercise_logs enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.fitness_exercises to authenticated;
grant select, insert, update, delete on table public.workouts to authenticated;
grant select, insert, update, delete on table public.exercise_logs to authenticated;

drop policy if exists "Users can select own fitness exercises" on public.fitness_exercises;
drop policy if exists "Users can insert own fitness exercises" on public.fitness_exercises;
drop policy if exists "Users can update own fitness exercises" on public.fitness_exercises;
drop policy if exists "Users can delete own fitness exercises" on public.fitness_exercises;

drop policy if exists "Users can select own workouts" on public.workouts;
drop policy if exists "Users can insert own workouts" on public.workouts;
drop policy if exists "Users can update own workouts" on public.workouts;
drop policy if exists "Users can delete own workouts" on public.workouts;

drop policy if exists "Users can select own exercise logs" on public.exercise_logs;
drop policy if exists "Users can insert own exercise logs" on public.exercise_logs;
drop policy if exists "Users can update own exercise logs" on public.exercise_logs;
drop policy if exists "Users can delete own exercise logs" on public.exercise_logs;

create policy "Users can select own fitness exercises"
  on public.fitness_exercises
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own fitness exercises"
  on public.fitness_exercises
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own fitness exercises"
  on public.fitness_exercises
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own fitness exercises"
  on public.fitness_exercises
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own workouts"
  on public.workouts
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own workouts"
  on public.workouts
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own workouts"
  on public.workouts
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own workouts"
  on public.workouts
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own exercise logs"
  on public.exercise_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own exercise logs"
  on public.exercise_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own exercise logs"
  on public.exercise_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own exercise logs"
  on public.exercise_logs
  for delete
  to authenticated
  using (auth.uid() = user_id);
