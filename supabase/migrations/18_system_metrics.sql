create table if not exists public.system_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sync_date date not null,
  momentum_score numeric not null default 0,
  events_processed integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, sync_date)
);

alter table public.system_metrics enable row level security;

drop policy if exists "system_metrics_select_own" on public.system_metrics;
create policy "system_metrics_select_own"
on public.system_metrics
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "system_metrics_insert_own" on public.system_metrics;
create policy "system_metrics_insert_own"
on public.system_metrics
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "system_metrics_update_own" on public.system_metrics;
create policy "system_metrics_update_own"
on public.system_metrics
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
