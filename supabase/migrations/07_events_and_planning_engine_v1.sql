create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null check (domain in ('mind-os', 'productivity-hub', 'progress-hub', 'mission-control')),
  entity_type text not null,
  entity_id uuid,
  event_type text not null,
  event_date_ist date not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_events_user_date_ist on public.events (user_id, event_date_ist desc);
create index if not exists idx_events_domain_event_type on public.events (domain, event_type, event_date_ist desc);
create index if not exists idx_events_entity_lookup on public.events (entity_type, entity_id, event_date_ist desc);

alter table public.events enable row level security;

grant select, insert, update, delete on table public.events to authenticated;

drop policy if exists "Users can select own events" on public.events;
drop policy if exists "Users can insert own events" on public.events;
drop policy if exists "Users can update own events" on public.events;
drop policy if exists "Users can delete own events" on public.events;

create policy "Users can select own events"
  on public.events
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own events"
  on public.events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on public.events
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own events"
  on public.events
  for delete
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  domain text not null check (domain in ('mind-os', 'productivity-hub', 'progress-hub', 'fitness-os', 'finance-os')),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  target_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_goals_user_status on public.goals (user_id, status, created_at desc);
create index if not exists idx_goals_user_target_date on public.goals (user_id, target_date);

create table if not exists public.weekly_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  title text not null,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  order_index integer not null default 0 check (order_index >= 0),
  status text not null default 'Planned' check (status in ('Planned', 'Doing', 'Done', 'Dropped')),
  goal_id uuid references public.goals (id) on delete set null,
  linked_task_id uuid references public.tasks (id) on delete set null,
  linked_habit_id uuid references public.habits (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date, order_index)
);

create index if not exists idx_weekly_plan_items_user_week on public.weekly_plan_items (user_id, week_start_date desc);
create index if not exists idx_weekly_plan_items_user_status on public.weekly_plan_items (user_id, status, week_start_date desc);
create index if not exists idx_weekly_plan_items_goal on public.weekly_plan_items (goal_id);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  wins text,
  blockers text,
  next_adjustments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create index if not exists idx_weekly_reviews_user_week on public.weekly_reviews (user_id, week_start_date desc);

alter table public.goals enable row level security;
alter table public.weekly_plan_items enable row level security;
alter table public.weekly_reviews enable row level security;

grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.weekly_plan_items to authenticated;
grant select, insert, update, delete on table public.weekly_reviews to authenticated;

drop policy if exists "Users can select own goals" on public.goals;
drop policy if exists "Users can insert own goals" on public.goals;
drop policy if exists "Users can update own goals" on public.goals;
drop policy if exists "Users can delete own goals" on public.goals;

drop policy if exists "Users can select own weekly plan items" on public.weekly_plan_items;
drop policy if exists "Users can insert own weekly plan items" on public.weekly_plan_items;
drop policy if exists "Users can update own weekly plan items" on public.weekly_plan_items;
drop policy if exists "Users can delete own weekly plan items" on public.weekly_plan_items;

drop policy if exists "Users can select own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can insert own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can update own weekly reviews" on public.weekly_reviews;
drop policy if exists "Users can delete own weekly reviews" on public.weekly_reviews;

create policy "Users can select own goals"
  on public.goals
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own weekly plan items"
  on public.weekly_plan_items
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own weekly plan items"
  on public.weekly_plan_items
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own weekly plan items"
  on public.weekly_plan_items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own weekly plan items"
  on public.weekly_plan_items
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own weekly reviews"
  on public.weekly_reviews
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own weekly reviews"
  on public.weekly_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own weekly reviews"
  on public.weekly_reviews
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own weekly reviews"
  on public.weekly_reviews
  for delete
  to authenticated
  using (auth.uid() = user_id);
