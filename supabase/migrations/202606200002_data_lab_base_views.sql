create or replace view public.data_lab_daily_activity_90d
with (security_invoker = true) as
with scope as (
  select
    auth.uid() as user_id,
    (now() at time zone 'Asia/Kolkata')::date as today_ist
),
days as (
  select
    scope.user_id,
    generated_day::date as activity_date
  from scope
  cross join generate_series(
    scope.today_ist - interval '89 day',
    scope.today_ist,
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
    avg(journal_item.mood)::numeric(5, 2) as avg_mood
  from public.journal_entries journal_item
  where journal_item.user_id = auth.uid()
    and journal_item.deleted_at is null
  group by journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date
),
task_events_daily as (
  select
    event_item.user_id,
    event_item.event_date_ist::date as activity_date,
    count(*) filter (
      where event_item.domain = 'productivity-hub'
        and event_item.event_type = 'task_created'
    )::integer as tasks_created,
    count(*) filter (
      where event_item.domain = 'productivity-hub'
        and event_item.event_type = 'task_status_updated'
        and coalesce(event_item.payload ->> 'status', '') = 'Done'
    )::integer as tasks_completed
  from public.events event_item
  where event_item.user_id = auth.uid()
    and event_item.event_date_ist >= ((now() at time zone 'Asia/Kolkata')::date - interval '89 day')
  group by event_item.user_id, event_item.event_date_ist::date
),
time_daily as (
  select
    time_log.user_id,
    (time_log.start_time at time zone 'Asia/Kolkata')::date as activity_date,
    coalesce(sum(coalesce(time_log.duration_minutes, 0)), 0)::integer as total_focus_minutes,
    coalesce(sum(coalesce(time_log.duration_minutes, 0)) filter (
      where time_log.bucket in ('Deep Work', 'Learning')
    ), 0)::integer as deep_work_minutes
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
    coalesce(sum(coalesce(workout_item.duration_minutes, 0)), 0)::integer as workout_minutes
  from public.workouts workout_item
  where workout_item.user_id = auth.uid()
    and workout_item.deleted_at is null
    and workout_item.end_time is not null
  group by workout_item.user_id, workout_item.workout_date
),
finance_daily as (
  select
    finance_item.user_id,
    (finance_item.created_at at time zone 'Asia/Kolkata')::date as activity_date,
    count(*)::integer as finance_entries,
    coalesce(sum(finance_item.amount), 0)::numeric(12, 2) as total_spent,
    coalesce(sum(finance_item.amount) filter (where finance_item.is_need), 0)::numeric(12, 2) as need_spent,
    coalesce(sum(finance_item.amount) filter (where not finance_item.is_need), 0)::numeric(12, 2) as want_spent
  from public.finance_transactions finance_item
  where finance_item.user_id = auth.uid()
  group by finance_item.user_id, (finance_item.created_at at time zone 'Asia/Kolkata')::date
)
select
  day_item.user_id,
  day_item.activity_date,
  coalesce(habit_totals.active_habits, 0)::integer as active_habits,
  coalesce(habit_completed.habits_completed, 0)::integer as habits_completed,
  coalesce(journal_daily.journal_entries, 0)::integer as journal_entries,
  coalesce(journal_daily.avg_mood, 0)::numeric(5, 2) as avg_mood,
  coalesce(task_events_daily.tasks_created, 0)::integer as tasks_created,
  coalesce(task_events_daily.tasks_completed, 0)::integer as tasks_completed,
  coalesce(time_daily.total_focus_minutes, 0)::integer as total_focus_minutes,
  coalesce(time_daily.deep_work_minutes, 0)::integer as deep_work_minutes,
  coalesce(fitness_daily.workouts_logged, 0)::integer as workouts_logged,
  coalesce(fitness_daily.workout_minutes, 0)::integer as workout_minutes,
  coalesce(finance_daily.finance_entries, 0)::integer as finance_entries,
  coalesce(finance_daily.total_spent, 0)::numeric(12, 2) as total_spent,
  coalesce(finance_daily.need_spent, 0)::numeric(12, 2) as need_spent,
  coalesce(finance_daily.want_spent, 0)::numeric(12, 2) as want_spent,
  (
    case when coalesce(habit_completed.habits_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(journal_daily.journal_entries, 0) > 0 then 1 else 0 end +
    case when coalesce(task_events_daily.tasks_created, 0) > 0 or coalesce(task_events_daily.tasks_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(time_daily.total_focus_minutes, 0) > 0 then 1 else 0 end +
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
left join task_events_daily
  on task_events_daily.user_id = day_item.user_id
 and task_events_daily.activity_date = day_item.activity_date
left join time_daily
  on time_daily.user_id = day_item.user_id
 and time_daily.activity_date = day_item.activity_date
left join fitness_daily
  on fitness_daily.user_id = day_item.user_id
 and fitness_daily.activity_date = day_item.activity_date
left join finance_daily
  on finance_daily.user_id = day_item.user_id
 and finance_daily.activity_date = day_item.activity_date
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
    count(*) filter (where habits_completed > 0)::integer as habit_days,
    count(*) filter (where journal_entries > 0)::integer as journal_days,
    count(*) filter (where tasks_created > 0 or tasks_completed > 0)::integer as task_days,
    count(*) filter (where deep_work_minutes > 0)::integer as deep_work_days,
    count(*) filter (where workouts_logged > 0)::integer as workout_days,
    avg(active_system_count)::numeric(8, 2) as avg_active_system_count,
    sum(habits_completed)::integer as habits_completed,
    sum(journal_entries)::integer as journal_entries,
    sum(tasks_created)::integer as tasks_created,
    sum(tasks_completed)::integer as tasks_completed,
    sum(total_focus_minutes)::integer as total_focus_minutes,
    sum(deep_work_minutes)::integer as deep_work_minutes,
    sum(workouts_logged)::integer as workouts_logged,
    sum(workout_minutes)::integer as workout_minutes,
    sum(finance_entries)::integer as finance_entries,
    sum(total_spent)::numeric(12, 2) as total_spent,
    sum(need_spent)::numeric(12, 2) as need_spent,
    sum(want_spent)::numeric(12, 2) as want_spent
  from daily
  group by user_id, date_trunc('week', activity_date::timestamp)::date
)
select
  weekly.*,
  round(
    least(weekly.habit_days, 7)::numeric / 7 * 20 +
    least(weekly.journal_days, 7)::numeric / 7 * 15 +
    least(weekly.task_days, 7)::numeric / 7 * 20 +
    least(weekly.deep_work_days, 7)::numeric / 7 * 20 +
    least(weekly.workout_days, 4)::numeric / 4 * 15 +
    least(weekly.avg_active_system_count, 6)::numeric / 6 * 10
  )::integer as weekly_system_score
from weekly
where weekly.week_start_date >= date_trunc(
  'week',
  (((now() at time zone 'Asia/Kolkata')::date - interval '83 day')::timestamp)
)::date
order by weekly.week_start_date desc;

grant select on public.data_lab_weekly_system_score_12w to authenticated;

create or replace view public.data_lab_module_consistency_30d
with (security_invoker = true) as
with daily as (
  select *
  from public.data_lab_daily_activity_90d
  where activity_date >= ((now() at time zone 'Asia/Kolkata')::date - interval '29 day')
),
module_rows as (
  select user_id, 'Mind/Habits'::text as module_name, activity_date, habits_completed > 0 as was_active
  from daily
  union all
  select user_id, 'Mind/Journal'::text as module_name, activity_date, journal_entries > 0 as was_active
  from daily
  union all
  select user_id, 'Tasks'::text as module_name, activity_date, (tasks_created > 0 or tasks_completed > 0) as was_active
  from daily
  union all
  select user_id, 'Time OS'::text as module_name, activity_date, total_focus_minutes > 0 as was_active
  from daily
  union all
  select user_id, 'Fitness OS'::text as module_name, activity_date, workouts_logged > 0 as was_active
  from daily
  union all
  select user_id, 'Finance OS'::text as module_name, activity_date, finance_entries > 0 as was_active
  from daily
)
select
  module_rows.user_id,
  module_rows.module_name,
  count(*)::integer as days_observed,
  count(*) filter (where module_rows.was_active)::integer as active_days,
  round((count(*) filter (where module_rows.was_active)::numeric / nullif(count(*), 0)::numeric) * 100)::integer as consistency_percent,
  max(module_rows.activity_date) filter (where module_rows.was_active) as last_active_date
from module_rows
group by module_rows.user_id, module_rows.module_name
order by module_rows.module_name asc;

grant select on public.data_lab_module_consistency_30d to authenticated;

create or replace view public.data_lab_event_coverage_30d
with (security_invoker = true) as
select
  event_item.user_id,
  event_item.domain,
  event_item.event_type,
  count(*)::integer as event_count,
  count(distinct event_item.event_date_ist)::integer as active_days,
  min(event_item.event_date_ist)::date as first_seen_date,
  max(event_item.event_date_ist)::date as last_seen_date
from public.events event_item
where event_item.user_id = auth.uid()
  and event_item.event_date_ist >= ((now() at time zone 'Asia/Kolkata')::date - interval '29 day')
group by event_item.user_id, event_item.domain, event_item.event_type
order by event_item.domain asc, event_item.event_type asc;

grant select on public.data_lab_event_coverage_30d to authenticated;
