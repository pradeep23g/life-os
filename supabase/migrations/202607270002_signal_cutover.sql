-- =========================================================
-- PHASE D2 — Cutover: Rebuild consuming views to use
-- signal views + config table
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. REBUILD data_lab_module_consistency_30d
-- Uses explicit union all over signal views, joined to
-- config table for display_name. No dynamic SQL.
-- ---------------------------------------------------------

create or replace view public.data_lab_module_consistency_30d
with (security_invoker = true) as
with date_boundary as (
  select ((now() at time zone 'Asia/Kolkata')::date - interval '29 day')::date as cutoff
),
module_rows as (
  select 'mind-habits' as signal_key, user_id, activity_date, was_active
    from public.data_lab_signal_mind_habits
    where activity_date >= (select cutoff from date_boundary)
  union all
  select 'mind-journal', user_id, activity_date, was_active
    from public.data_lab_signal_mind_journal
    where activity_date >= (select cutoff from date_boundary)
  union all
  select 'execution-tasks', user_id, activity_date, was_active
    from public.data_lab_signal_execution_tasks
    where activity_date >= (select cutoff from date_boundary)
  union all
  select 'time-os', user_id, activity_date, was_active
    from public.data_lab_signal_time_os
    where activity_date >= (select cutoff from date_boundary)
  union all
  select 'fitness-os', user_id, activity_date, was_active
    from public.data_lab_signal_fitness_os
    where activity_date >= (select cutoff from date_boundary)
  union all
  select 'finance-os', user_id, activity_date, was_active
    from public.data_lab_signal_finance_os
    where activity_date >= (select cutoff from date_boundary)
)
select
  mr.user_id,
  sc.display_name as module_name,
  count(*)::integer as days_observed,
  count(*) filter (where mr.was_active)::integer as active_days,
  round((count(*) filter (where mr.was_active)::numeric / nullif(count(*), 0)::numeric) * 100)::integer as consistency_percent,
  max(mr.activity_date) filter (where mr.was_active) as last_active_date
from module_rows mr
join public.data_lab_signal_config sc
  on sc.signal_key = mr.signal_key
where sc.is_active = true
group by mr.user_id, sc.display_name
order by consistency_percent desc, sc.display_name asc;

grant select on public.data_lab_module_consistency_30d to authenticated;

-- ---------------------------------------------------------
-- 2. REBUILD data_lab_weekly_system_score_12w
-- Uses signal views + config table for generic weighted scoring.
-- System breadth term kept as a separate, non-signal metric (10 pts).
-- ---------------------------------------------------------

create or replace view public.data_lab_weekly_system_score_12w
with (security_invoker = true) as
with date_boundary as (
  select date_trunc('week', ((now() at time zone 'Asia/Kolkata')::date - interval '83 day')::timestamp)::date as cutoff
),
daily as (
  select *
  from public.data_lab_daily_activity_90d
),
-- Per-signal active days, computed from signal views
signal_daily as (
  select 'mind-habits' as signal_key, user_id, activity_date, was_active
    from public.data_lab_signal_mind_habits
  union all
  select 'mind-journal', user_id, activity_date, was_active
    from public.data_lab_signal_mind_journal
  union all
  select 'execution-tasks', user_id, activity_date, was_active
    from public.data_lab_signal_execution_tasks
  union all
  select 'time-os', user_id, activity_date, was_active
    from public.data_lab_signal_time_os
  union all
  select 'fitness-os', user_id, activity_date, was_active
    from public.data_lab_signal_fitness_os
  union all
  select 'finance-os', user_id, activity_date, was_active
    from public.data_lab_signal_finance_os
),
-- Weekly aggregation of the rich daily data (for detail columns)
weekly_detail as (
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
),
-- Per-signal weekly active days for generic scoring
signal_weekly as (
  select
    sd.user_id,
    date_trunc('week', sd.activity_date::timestamp)::date as week_start_date,
    sd.signal_key,
    count(*) filter (where sd.was_active)::integer as active_days
  from signal_daily sd
  group by sd.user_id, date_trunc('week', sd.activity_date::timestamp)::date, sd.signal_key
),
-- Generic weighted score per user per week from config table
signal_score as (
  select
    sw.user_id,
    sw.week_start_date,
    sum(
      sc.weight_percent * least(sw.active_days, sc.weight_cap_days)::numeric / sc.weight_cap_days
    ) as weighted_signal_score
  from signal_weekly sw
  join public.data_lab_signal_config sc
    on sc.signal_key = sw.signal_key
  where sc.is_active = true
    and sc.weight_percent > 0
  group by sw.user_id, sw.week_start_date
),
-- System breadth: how many distinct signals were active on average per day
-- Denominator is count of active signals in config (dynamic)
breadth_score as (
  select
    wd.user_id,
    wd.week_start_date,
    least(wd.avg_active_systems, (select count(*) from public.data_lab_signal_config where is_active = true))::numeric
      / nullif((select count(*) from public.data_lab_signal_config where is_active = true), 0)::numeric
      * 10 as breadth_points
  from weekly_detail wd
)
select
  wd.*,
  round(
    coalesce(ss.weighted_signal_score, 0) + coalesce(bs.breadth_points, 0)
  )::integer as weekly_system_score
from weekly_detail wd
left join signal_score ss
  on ss.user_id = wd.user_id
 and ss.week_start_date = wd.week_start_date
left join breadth_score bs
  on bs.user_id = wd.user_id
 and bs.week_start_date = wd.week_start_date
where wd.week_start_date >= (select cutoff from date_boundary)
order by wd.week_start_date desc;

grant select on public.data_lab_weekly_system_score_12w to authenticated;

commit;
