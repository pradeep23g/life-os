-- =========================================================
-- PHASE D1 — Signal Config Table & Signal Views
-- PHASE D1b — Finance is_need restoration
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. SIGNAL CONFIGURATION TABLE
-- ---------------------------------------------------------

create table if not exists public.data_lab_signal_config (
  signal_key text primary key,
  display_name text not null,
  weight_percent numeric not null default 0,
  weight_cap_days integer not null default 7,
  is_active boolean not null default true
);

alter table public.data_lab_signal_config enable row level security;

create policy "Signal config is readable by all authenticated users"
  on public.data_lab_signal_config
  for select
  to authenticated
  using (true);

insert into public.data_lab_signal_config (signal_key, display_name, weight_percent, weight_cap_days, is_active) values
  ('mind-habits',     'Mind / Habits', 18, 7, true),
  ('mind-journal',    'Mind / Journal', 13, 7, true),
  ('execution-tasks', 'Tasks',         18, 7, true),
  ('time-os',         'Time OS',       18, 7, true),
  ('fitness-os',      'Fitness OS',    13, 4, true),
  ('finance-os',      'Finance OS',    10, 7, true)
on conflict (signal_key) do nothing;

-- ---------------------------------------------------------
-- 2. SIGNAL VIEWS — thin wrappers on data_lab_daily_activity_90d
-- Each returns: user_id, activity_date, was_active, magnitude, metrics
-- ---------------------------------------------------------

create or replace view public.data_lab_signal_mind_habits
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (habits_completed > 0) as was_active,
  habits_completed as magnitude,
  jsonb_build_object(
    'active_habits', active_habits,
    'habit_completion_percent', habit_completion_percent
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_mind_habits to authenticated;

create or replace view public.data_lab_signal_mind_journal
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (journal_entries > 0) as was_active,
  journal_entries as magnitude,
  jsonb_build_object(
    'avg_mood', avg_mood
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_mind_journal to authenticated;

create or replace view public.data_lab_signal_execution_tasks
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (tasks_completed > 0) as was_active,
  tasks_completed as magnitude,
  jsonb_build_object(
    'tasks_created', tasks_created
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_execution_tasks to authenticated;

create or replace view public.data_lab_signal_time_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (deep_work_minutes > 0) as was_active,
  deep_work_minutes as magnitude,
  jsonb_build_object(
    'total_focus_minutes', total_focus_minutes,
    'focus_sessions', focus_sessions
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_time_os to authenticated;

create or replace view public.data_lab_signal_fitness_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (workouts_logged > 0) as was_active,
  workouts_logged as magnitude,
  jsonb_build_object(
    'workout_minutes', workout_minutes
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_fitness_os to authenticated;

create or replace view public.data_lab_signal_finance_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (finance_entries > 0) as was_active,
  finance_entries as magnitude,
  jsonb_build_object(
    'total_spent', total_spent,
    'need_spent', need_spent,
    'want_spent', want_spent
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_finance_os to authenticated;

-- ---------------------------------------------------------
-- 3. PHASE D1b — FINANCE is_need RESTORATION
-- ---------------------------------------------------------

alter table public.transactions
  add column if not exists is_need boolean;

-- Rebuild data_lab_daily_activity_90d with real is_need in finance_daily CTE.
-- The full view is recreated because the finance_daily CTE and
-- need_spent/want_spent output columns change.

drop view if exists
  public.data_lab_weekly_system_score_12w,
  public.data_lab_module_consistency_30d,
  public.data_lab_signal_mind_habits,
  public.data_lab_signal_mind_journal,
  public.data_lab_signal_execution_tasks,
  public.data_lab_signal_time_os,
  public.data_lab_signal_fitness_os,
  public.data_lab_signal_finance_os;

drop view if exists public.data_lab_daily_activity_90d;

create or replace view public.data_lab_daily_activity_90d
with (security_invoker = true) as
with scope as (
  select
    auth.uid() as user_id,
    (now() at time zone 'Asia/Kolkata')::date as today
),
days as (
  select
    scope.user_id,
    generated_day::date as activity_date
  from scope
  cross join generate_series(
    scope.today - interval '89 day',
    scope.today,
    interval '1 day'
  ) as generated_day
  where scope.user_id is not null
),
habit_totals as (
  select
    day_item.user_id,
    day_item.activity_date,
    count(habit_item.id)::integer as active_habits
  from days day_item
  left join public.habits habit_item
    on habit_item.user_id = day_item.user_id
   and (habit_item.created_at at time zone 'Asia/Kolkata')::date <= day_item.activity_date
   and (
     habit_item.deleted_at is null
     or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > day_item.activity_date
   )
  group by day_item.user_id, day_item.activity_date
),
habit_completed as (
  select
    habit_log.user_id,
    habit_log.log_date as activity_date,
    count(distinct habit_log.habit_id)::integer as habits_completed
  from public.habit_logs habit_log
  join public.habits habit_item
    on habit_item.id = habit_log.habit_id
  where habit_log.user_id = auth.uid()
    and habit_log.value >= habit_item.target_value
  group by habit_log.user_id, habit_log.log_date
),
journal_daily as (
  select
    journal_item.user_id,
    (journal_item.created_at at time zone 'Asia/Kolkata')::date as activity_date,
    count(*)::integer as journal_entries,
    avg(journal_item.mood)::numeric(5,2) as avg_mood
  from public.journal_entries journal_item
  where journal_item.user_id = auth.uid()
    and journal_item.deleted_at is null
  group by journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date
),
task_daily as (
  select
    event_item.user_id,
    event_item.event_date_ist::date as activity_date,
    count(*) filter (where event_item.event_type = 'task_created')::integer as tasks_created,
    count(*) filter (
      where event_item.event_type = 'task_status_updated'
        and coalesce(event_item.payload ->> 'status', '') = 'Done'
    )::integer as tasks_completed
  from public.events event_item
  where event_item.user_id = auth.uid()
    and event_item.domain = 'productivity-hub'
  group by event_item.user_id, event_item.event_date_ist::date
),
time_daily as (
  select
    time_log.user_id,
    (time_log.start_time at time zone 'Asia/Kolkata')::date as activity_date,
    coalesce(sum(time_log.duration_minutes), 0)::integer as total_focus_minutes,
    coalesce(sum(time_log.duration_minutes) filter (
      where time_log.bucket in ('Deep Work', 'Learning')
    ), 0)::integer as deep_work_minutes,
    count(*)::integer as focus_sessions
  from public.time_logs time_log
  where time_log.user_id = auth.uid()
    and time_log.end_time is not null
  group by time_log.user_id, (time_log.start_time at time zone 'Asia/Kolkata')::date
),
fitness_daily as (
  select
    workout_item.user_id,
    workout_item.workout_date as activity_date,
    count(*)::integer as workouts_logged,
    coalesce(sum(workout_item.duration_minutes), 0)::integer as workout_minutes
  from public.workouts workout_item
  where workout_item.user_id = auth.uid()
    and workout_item.deleted_at is null
    and workout_item.end_time is not null
  group by workout_item.user_id, workout_item.workout_date
),
finance_daily as (
  select
    transaction_item.user_id,
    (transaction_item."timestamp" at time zone 'Asia/Kolkata')::date as activity_date,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense'), 0)::numeric(12,2) as total_spent,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense' and transaction_item.is_need = true), 0)::numeric(12,2) as need_spent,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense' and transaction_item.is_need = false), 0)::numeric(12,2) as want_spent,
    count(*)::integer as finance_entries
  from public.transactions transaction_item
  where transaction_item.user_id = auth.uid()
  group by transaction_item.user_id, (transaction_item."timestamp" at time zone 'Asia/Kolkata')::date
),
events_daily as (
  select
    event_item.user_id,
    event_item.event_date_ist::date as activity_date,
    count(*)::integer as events_logged,
    count(distinct event_item.domain)::integer as active_domains
  from public.events event_item
  where event_item.user_id = auth.uid()
  group by event_item.user_id, event_item.event_date_ist::date
)
select
  day_item.user_id,
  day_item.activity_date,

  coalesce(habit_totals.active_habits, 0)::integer as active_habits,
  coalesce(habit_completed.habits_completed, 0)::integer as habits_completed,
  case
    when coalesce(habit_totals.active_habits, 0) = 0 then 0
    else round((coalesce(habit_completed.habits_completed, 0)::numeric / habit_totals.active_habits::numeric) * 100)
  end::integer as habit_completion_percent,

  coalesce(journal_daily.journal_entries, 0)::integer as journal_entries,
  coalesce(journal_daily.avg_mood, 0)::numeric(5,2) as avg_mood,

  coalesce(task_daily.tasks_created, 0)::integer as tasks_created,
  coalesce(task_daily.tasks_completed, 0)::integer as tasks_completed,

  coalesce(time_daily.total_focus_minutes, 0)::integer as total_focus_minutes,
  coalesce(time_daily.deep_work_minutes, 0)::integer as deep_work_minutes,
  coalesce(time_daily.focus_sessions, 0)::integer as focus_sessions,

  coalesce(fitness_daily.workouts_logged, 0)::integer as workouts_logged,
  coalesce(fitness_daily.workout_minutes, 0)::integer as workout_minutes,

  coalesce(finance_daily.total_spent, 0)::numeric(12,2) as total_spent,
  coalesce(finance_daily.need_spent, 0)::numeric(12,2) as need_spent,
  coalesce(finance_daily.want_spent, 0)::numeric(12,2) as want_spent,
  coalesce(finance_daily.finance_entries, 0)::integer as finance_entries,

  coalesce(events_daily.events_logged, 0)::integer as events_logged,
  coalesce(events_daily.active_domains, 0)::integer as active_domains,

  (
    case when coalesce(habit_completed.habits_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(journal_daily.journal_entries, 0) > 0 then 1 else 0 end +
    case when coalesce(task_daily.tasks_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(time_daily.deep_work_minutes, 0) > 0 then 1 else 0 end +
    case when coalesce(fitness_daily.workouts_logged, 0) > 0 then 1 else 0 end +
    case when coalesce(finance_daily.finance_entries, 0) > 0 then 1 else 0 end
  )::integer as active_system_count
from days day_item
left join habit_totals
  on habit_totals.user_id = day_item.user_id
 and habit_totals.activity_date = day_item.activity_date
left join habit_completed
  on habit_completed.user_id = day_item.user_id
 and habit_completed.activity_date = day_item.activity_date
left join journal_daily
  on journal_daily.user_id = day_item.user_id
 and journal_daily.activity_date = day_item.activity_date
left join task_daily
  on task_daily.user_id = day_item.user_id
 and task_daily.activity_date = day_item.activity_date
left join time_daily
  on time_daily.user_id = day_item.user_id
 and time_daily.activity_date = day_item.activity_date
left join fitness_daily
  on fitness_daily.user_id = day_item.user_id
 and fitness_daily.activity_date = day_item.activity_date
left join finance_daily
  on finance_daily.user_id = day_item.user_id
 and finance_daily.activity_date = day_item.activity_date
left join events_daily
  on events_daily.user_id = day_item.user_id
 and events_daily.activity_date = day_item.activity_date
order by day_item.activity_date desc;

grant select on public.data_lab_daily_activity_90d to authenticated;

-- Recreate signal views after daily activity view rebuild

create or replace view public.data_lab_signal_mind_habits
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (habits_completed > 0) as was_active,
  habits_completed as magnitude,
  jsonb_build_object(
    'active_habits', active_habits,
    'habit_completion_percent', habit_completion_percent
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_mind_habits to authenticated;

create or replace view public.data_lab_signal_mind_journal
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (journal_entries > 0) as was_active,
  journal_entries as magnitude,
  jsonb_build_object(
    'avg_mood', avg_mood
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_mind_journal to authenticated;

create or replace view public.data_lab_signal_execution_tasks
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (tasks_completed > 0) as was_active,
  tasks_completed as magnitude,
  jsonb_build_object(
    'tasks_created', tasks_created
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_execution_tasks to authenticated;

create or replace view public.data_lab_signal_time_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (deep_work_minutes > 0) as was_active,
  deep_work_minutes as magnitude,
  jsonb_build_object(
    'total_focus_minutes', total_focus_minutes,
    'focus_sessions', focus_sessions
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_time_os to authenticated;

create or replace view public.data_lab_signal_fitness_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (workouts_logged > 0) as was_active,
  workouts_logged as magnitude,
  jsonb_build_object(
    'workout_minutes', workout_minutes
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_fitness_os to authenticated;

create or replace view public.data_lab_signal_finance_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (finance_entries > 0) as was_active,
  finance_entries as magnitude,
  jsonb_build_object(
    'total_spent', total_spent,
    'need_spent', need_spent,
    'want_spent', want_spent
  ) as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_finance_os to authenticated;

-- Recreate the two consuming views that were dropped as dependencies

create or replace view public.data_lab_weekly_system_score_12w
with (security_invoker = true) as
with daily as (
  select *
  from public.data_lab_daily_activity_90d
),
weekly as (
  select
    user_id,
    date_trunc('week', activity_date::timestamp)::date as week_start_date,

    count(*)::integer as days_observed,

    count(*) filter (where habits_completed > 0)::integer as habit_active_days,
    count(*) filter (where journal_entries > 0)::integer as journal_days,
    count(*) filter (where tasks_completed > 0)::integer as task_completion_days,
    count(*) filter (where deep_work_minutes > 0)::integer as deep_work_days,
    count(*) filter (where workouts_logged > 0)::integer as workout_days,
    count(*) filter (where finance_entries > 0)::integer as finance_logged_days,

    sum(habits_completed)::integer as habits_completed,
    avg(habit_completion_percent)::numeric(5,2) as avg_habit_completion_percent,

    sum(journal_entries)::integer as journal_entries,
    avg(nullif(avg_mood, 0))::numeric(5,2) as avg_mood,

    sum(tasks_created)::integer as tasks_created,
    sum(tasks_completed)::integer as tasks_completed,

    sum(total_focus_minutes)::integer as total_focus_minutes,
    sum(deep_work_minutes)::integer as deep_work_minutes,

    sum(workouts_logged)::integer as workouts_logged,
    sum(workout_minutes)::integer as workout_minutes,

    sum(total_spent)::numeric(12,2) as total_spent,
    sum(need_spent)::numeric(12,2) as need_spent,
    sum(want_spent)::numeric(12,2) as want_spent,

    avg(active_system_count)::numeric(5,2) as avg_active_systems,
    sum(events_logged)::integer as events_logged
  from daily
  group by user_id, date_trunc('week', activity_date::timestamp)::date
)
select
  *,
  round(
    (
      least(habit_active_days, 7)::numeric / 7 * 20 +
      least(journal_days, 7)::numeric / 7 * 15 +
      least(task_completion_days, 7)::numeric / 7 * 20 +
      least(deep_work_days, 7)::numeric / 7 * 20 +
      least(workout_days, 4)::numeric / 4 * 15 +
      least(avg_active_systems, 6)::numeric / 6 * 10
    )
  )::integer as weekly_system_score
from weekly
where week_start_date >= date_trunc('week', ((now() at time zone 'Asia/Kolkata')::date - interval '83 day')::timestamp)::date
order by week_start_date desc;

grant select on public.data_lab_weekly_system_score_12w to authenticated;

create or replace view public.data_lab_module_consistency_30d
with (security_invoker = true) as
with daily as (
  select *
  from public.data_lab_daily_activity_90d
  where activity_date >= ((now() at time zone 'Asia/Kolkata')::date - interval '29 day')
),
module_rows as (
  select user_id, 'Mind / Habits' as module_name, activity_date, habits_completed > 0 as was_active from daily
  union all
  select user_id, 'Mind / Journal', activity_date, journal_entries > 0 from daily
  union all
  select user_id, 'Tasks', activity_date, tasks_completed > 0 from daily
  union all
  select user_id, 'Time OS', activity_date, deep_work_minutes > 0 from daily
  union all
  select user_id, 'Fitness OS', activity_date, workouts_logged > 0 from daily
  union all
  select user_id, 'Finance OS', activity_date, finance_entries > 0 from daily
)
select
  user_id,
  module_name,
  count(*)::integer as days_observed,
  count(*) filter (where was_active)::integer as active_days,
  round((count(*) filter (where was_active)::numeric / nullif(count(*), 0)::numeric) * 100)::integer as consistency_percent,
  max(activity_date) filter (where was_active) as last_active_date
from module_rows
group by user_id, module_name
order by consistency_percent desc, module_name asc;

grant select on public.data_lab_module_consistency_30d to authenticated;

commit;
