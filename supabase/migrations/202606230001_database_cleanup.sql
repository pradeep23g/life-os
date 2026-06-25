DROP VIEW IF EXISTS public.data_lab_weekly_system_score_12w, public.data_lab_module_consistency_30d, public.data_lab_daily_activity_90d;

begin;

-- =========================================================
-- 1. FINANCE CLEANUP
-- =========================================================

insert into public.transactions (
  id,
  user_id,
  amount,
  type,
  category,
  "timestamp"
)
select
  legacy.id,
  legacy.user_id,
  legacy.amount,
  'expense',
  legacy.category,
  legacy.created_at
from public.finance_transactions legacy
on conflict (id) do nothing;

drop table if exists public.finance_transactions;

-- =========================================================
-- 2. TASK SCHEMA OVERHAUL
-- =========================================================

alter table public.tasks
  add column if not exists deadline_type text not null default 'no_deadline',
  add column if not exists deadline_date date,
  add column if not exists is_completed boolean not null default false;

update public.tasks
set deadline_type = 'no_deadline'
where deadline_type is null
   or deadline_type not in ('same_day', 'no_deadline', 'specific_date');

update public.tasks
set is_completed = false
where is_completed is null;

update public.tasks
set is_completed = true
where status = 'Done';

alter table public.tasks
  drop constraint if exists tasks_deadline_type_check;

alter table public.tasks
  add constraint tasks_deadline_type_check
  check (deadline_type in ('same_day', 'no_deadline', 'specific_date'));

alter table public.tasks
  drop constraint if exists tasks_specific_date_requires_deadline_date_check;

alter table public.tasks
  add constraint tasks_specific_date_requires_deadline_date_check
  check (
    deadline_type <> 'specific_date'
    or deadline_date is not null
  );

-- =========================================================
-- 3. RECREATE STATUS-DEPENDENT SYSTEM VIEW
-- =========================================================

create or replace view public.current_day_snapshot
with (security_invoker = true) as
with scope as (
  select
    auth.uid() as user_id,
    (now() at time zone 'Asia/Kolkata')::date as snapshot_date,
    date_trunc('week', now() at time zone 'Asia/Kolkata')::date as week_start_date
)
select
  scope.user_id,
  coalesce(task_counts.pending_tasks_count, 0)::integer as pending_tasks_count,
  coalesce(habit_counts.habits_completed_today, 0)::integer as habits_completed_today,
  coalesce(habit_counts.total_active_habits, 0)::integer as total_active_habits,
  coalesce(journal_counts.journal_logged_today, false) as journal_logged_today,
  coalesce(workout_counts.workout_days_this_week, 0)::integer as workout_days_this_week,
  oldest_task.oldest_pending_task_title,
  newest_habit.newest_active_habit_title,
  scope.snapshot_date,
  coalesce(deep_work_counts.deep_work_minutes_today, 0)::integer as deep_work_minutes_today
from scope
left join lateral (
  select count(*) as pending_tasks_count
  from public.tasks task_item
  where task_item.user_id = scope.user_id
    and task_item.deleted_at is null
    and task_item.is_completed = false
) as task_counts on true
left join lateral (
  select
    count(*) as total_active_habits,
    count(distinct habit_item.id) filter (
      where habit_log.log_date = scope.snapshot_date
        and habit_log.value >= habit_item.target_value
    ) as habits_completed_today
  from public.habits habit_item
  left join public.habit_logs habit_log
    on habit_log.habit_id = habit_item.id
   and habit_log.user_id = scope.user_id
   and habit_log.log_date = scope.snapshot_date
  where habit_item.user_id = scope.user_id
    and (
      habit_item.deleted_at is null
      or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > scope.snapshot_date
    )
) as habit_counts on true
left join lateral (
  select exists (
    select 1
    from public.journal_entries journal_item
    where journal_item.user_id = scope.user_id
      and journal_item.deleted_at is null
      and (journal_item.created_at at time zone 'Asia/Kolkata')::date = scope.snapshot_date
  ) as journal_logged_today
) as journal_counts on true
left join lateral (
  select count(distinct workout_item.workout_date) as workout_days_this_week
  from public.workouts workout_item
  where workout_item.user_id = scope.user_id
    and workout_item.deleted_at is null
    and workout_item.workout_date >= scope.week_start_date
    and workout_item.workout_date <= scope.snapshot_date
) as workout_counts on true
left join lateral (
  select coalesce(sum(coalesce(time_log.duration_minutes, 0)), 0)::integer as deep_work_minutes_today
  from public.time_logs time_log
  where time_log.user_id = scope.user_id
    and time_log.bucket in ('Deep Work', 'Learning')
    and time_log.end_time is not null
    and (time_log.start_time at time zone 'Asia/Kolkata')::date = scope.snapshot_date
) as deep_work_counts on true
left join lateral (
  select task_item.title as oldest_pending_task_title
  from public.tasks task_item
  where task_item.user_id = scope.user_id
    and task_item.deleted_at is null
    and task_item.is_completed = false
  order by task_item.created_at asc
  limit 1
) as oldest_task on true
left join lateral (
  select habit_item.title as newest_active_habit_title
  from public.habits habit_item
  where habit_item.user_id = scope.user_id
    and habit_item.deleted_at is null
  order by habit_item.created_at desc
  limit 1
) as newest_habit on true
where scope.user_id is not null;

grant select on public.current_day_snapshot to authenticated;

-- =========================================================
-- 4. DROP DEPRECATED KANBAN COLUMNS
-- =========================================================

alter table public.tasks
  drop column if exists priority,
  drop column if exists status;

-- =========================================================
-- 5. CALENDAR LEDGER INDEXES
-- =========================================================

create index if not exists idx_tasks_user_completion_deadline
  on public.tasks (user_id, is_completed, deadline_type, deadline_date)
  where deleted_at is null;

create index if not exists idx_tasks_user_deadline_date
  on public.tasks (user_id, deadline_date)
  where deleted_at is null
    and deadline_type = 'specific_date';

create index if not exists idx_tasks_user_created_active
  on public.tasks (user_id, created_at desc)
  where deleted_at is null;

-- =========================================================
-- 6. RECREATE DATA LAB VIEWS
-- =========================================================

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
    0::numeric(12,2) as need_spent,
    0::numeric(12,2) as want_spent,
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
  0::numeric(12,2) as need_spent,
  0::numeric(12,2) as want_spent,
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