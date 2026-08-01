-- =========================================================
-- PHASE 5 — Data Lab & Brain Engine Integration
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. DATA LAB: Rebuild daily view + create signal view
-- ---------------------------------------------------------

drop view if exists
  public.data_lab_weekly_system_score_12w,
  public.data_lab_module_consistency_30d,
  public.data_lab_signal_mind_habits,
  public.data_lab_signal_mind_journal,
  public.data_lab_signal_execution_tasks,
  public.data_lab_signal_time_os,
  public.data_lab_signal_fitness_os,
  public.data_lab_signal_finance_os,
  public.data_lab_signal_learning_os cascade;

drop view if exists public.data_lab_daily_activity_90d cascade;

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
learning_daily as (
  select
    user_id,
    (logged_at at time zone 'Asia/Kolkata')::date as activity_date,
    count(*)::integer as learning_sessions_logged
  from public.learning_session_logs
  where user_id = auth.uid()
    and deleted_at is null
  group by user_id, (logged_at at time zone 'Asia/Kolkata')::date
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

  coalesce(learning_daily.learning_sessions_logged, 0)::integer as learning_sessions_logged,

  coalesce(events_daily.events_logged, 0)::integer as events_logged,
  coalesce(events_daily.active_domains, 0)::integer as active_domains,

  (
    case when coalesce(habit_completed.habits_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(journal_daily.journal_entries, 0) > 0 then 1 else 0 end +
    case when coalesce(task_daily.tasks_completed, 0) > 0 then 1 else 0 end +
    case when coalesce(time_daily.deep_work_minutes, 0) > 0 then 1 else 0 end +
    case when coalesce(fitness_daily.workouts_logged, 0) > 0 then 1 else 0 end +
    case when coalesce(finance_daily.finance_entries, 0) > 0 then 1 else 0 end +
    case when coalesce(learning_daily.learning_sessions_logged, 0) > 0 then 1 else 0 end
  )::integer as active_system_count
from days day_item
left join habit_totals on habit_totals.user_id = day_item.user_id and habit_totals.activity_date = day_item.activity_date
left join habit_completed on habit_completed.user_id = day_item.user_id and habit_completed.activity_date = day_item.activity_date
left join journal_daily on journal_daily.user_id = day_item.user_id and journal_daily.activity_date = day_item.activity_date
left join task_daily on task_daily.user_id = day_item.user_id and task_daily.activity_date = day_item.activity_date
left join time_daily on time_daily.user_id = day_item.user_id and time_daily.activity_date = day_item.activity_date
left join fitness_daily on fitness_daily.user_id = day_item.user_id and fitness_daily.activity_date = day_item.activity_date
left join finance_daily on finance_daily.user_id = day_item.user_id and finance_daily.activity_date = day_item.activity_date
left join learning_daily on learning_daily.user_id = day_item.user_id and learning_daily.activity_date = day_item.activity_date
left join events_daily on events_daily.user_id = day_item.user_id and events_daily.activity_date = day_item.activity_date
order by day_item.activity_date desc;

grant select on public.data_lab_daily_activity_90d to authenticated;

-- Recreate 6 existing signal views + new learning signal view
create or replace view public.data_lab_signal_mind_habits with (security_invoker = true) as select user_id, activity_date, (habits_completed > 0) as was_active, habits_completed as magnitude, jsonb_build_object('active_habits', active_habits, 'habit_completion_percent', habit_completion_percent) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_mind_habits to authenticated;
create or replace view public.data_lab_signal_mind_journal with (security_invoker = true) as select user_id, activity_date, (journal_entries > 0) as was_active, journal_entries as magnitude, jsonb_build_object('avg_mood', avg_mood) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_mind_journal to authenticated;
create or replace view public.data_lab_signal_execution_tasks with (security_invoker = true) as select user_id, activity_date, (tasks_completed > 0) as was_active, tasks_completed as magnitude, jsonb_build_object('tasks_created', tasks_created) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_execution_tasks to authenticated;
create or replace view public.data_lab_signal_time_os with (security_invoker = true) as select user_id, activity_date, (deep_work_minutes > 0) as was_active, deep_work_minutes as magnitude, jsonb_build_object('total_focus_minutes', total_focus_minutes, 'focus_sessions', focus_sessions) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_time_os to authenticated;
create or replace view public.data_lab_signal_fitness_os with (security_invoker = true) as select user_id, activity_date, (workouts_logged > 0) as was_active, workouts_logged as magnitude, jsonb_build_object('workout_minutes', workout_minutes) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_fitness_os to authenticated;
create or replace view public.data_lab_signal_finance_os with (security_invoker = true) as select user_id, activity_date, (finance_entries > 0) as was_active, finance_entries as magnitude, jsonb_build_object('total_spent', total_spent, 'need_spent', need_spent, 'want_spent', want_spent) as metrics from public.data_lab_daily_activity_90d;
grant select on public.data_lab_signal_finance_os to authenticated;

-- Create Learning OS signal view
create or replace view public.data_lab_signal_learning_os
with (security_invoker = true) as
select
  user_id,
  activity_date,
  (learning_sessions_logged > 0) as was_active,
  learning_sessions_logged as magnitude,
  '{}'::jsonb as metrics
from public.data_lab_daily_activity_90d;

grant select on public.data_lab_signal_learning_os to authenticated;

-- Insert Learning OS into config
insert into data_lab_signal_config
  (signal_key, display_name, weight_percent, weight_cap_days, is_active)
values
  ('learning-os', 'Learning OS', 10, 7, true)
on conflict (signal_key) do nothing;

-- ---------------------------------------------------------
-- 2. REBUILD data_lab_module_consistency_30d
-- ---------------------------------------------------------
create or replace view public.data_lab_module_consistency_30d
with (security_invoker = true) as
with date_boundary as (
  select ((now() at time zone 'Asia/Kolkata')::date - interval '29 day')::date as cutoff
),
module_rows as (
  select 'mind-habits' as signal_key, user_id, activity_date, was_active from public.data_lab_signal_mind_habits where activity_date >= (select cutoff from date_boundary)
  union all select 'mind-journal', user_id, activity_date, was_active from public.data_lab_signal_mind_journal where activity_date >= (select cutoff from date_boundary)
  union all select 'execution-tasks', user_id, activity_date, was_active from public.data_lab_signal_execution_tasks where activity_date >= (select cutoff from date_boundary)
  union all select 'time-os', user_id, activity_date, was_active from public.data_lab_signal_time_os where activity_date >= (select cutoff from date_boundary)
  union all select 'fitness-os', user_id, activity_date, was_active from public.data_lab_signal_fitness_os where activity_date >= (select cutoff from date_boundary)
  union all select 'finance-os', user_id, activity_date, was_active from public.data_lab_signal_finance_os where activity_date >= (select cutoff from date_boundary)
  union all select 'learning-os', user_id, activity_date, was_active from public.data_lab_signal_learning_os where activity_date >= (select cutoff from date_boundary)
)
select
  mr.user_id,
  sc.display_name as module_name,
  count(*)::integer as days_observed,
  count(*) filter (where mr.was_active)::integer as active_days,
  round((count(*) filter (where mr.was_active)::numeric / nullif(count(*), 0)::numeric) * 100)::integer as consistency_percent,
  max(mr.activity_date) filter (where mr.was_active) as last_active_date
from module_rows mr
join public.data_lab_signal_config sc on sc.signal_key = mr.signal_key
where sc.is_active = true
group by mr.user_id, sc.display_name
order by consistency_percent desc, sc.display_name asc;
grant select on public.data_lab_module_consistency_30d to authenticated;

-- ---------------------------------------------------------
-- 3. REBUILD data_lab_weekly_system_score_12w
-- ---------------------------------------------------------
create or replace view public.data_lab_weekly_system_score_12w
with (security_invoker = true) as
with date_boundary as (
  select date_trunc('week', ((now() at time zone 'Asia/Kolkata')::date - interval '83 day')::timestamp)::date as cutoff
),
daily as (
  select * from public.data_lab_daily_activity_90d
),
signal_daily as (
  select 'mind-habits' as signal_key, user_id, activity_date, was_active from public.data_lab_signal_mind_habits
  union all select 'mind-journal', user_id, activity_date, was_active from public.data_lab_signal_mind_journal
  union all select 'execution-tasks', user_id, activity_date, was_active from public.data_lab_signal_execution_tasks
  union all select 'time-os', user_id, activity_date, was_active from public.data_lab_signal_time_os
  union all select 'fitness-os', user_id, activity_date, was_active from public.data_lab_signal_fitness_os
  union all select 'finance-os', user_id, activity_date, was_active from public.data_lab_signal_finance_os
  union all select 'learning-os', user_id, activity_date, was_active from public.data_lab_signal_learning_os
),
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
    count(*) filter (where learning_sessions_logged > 0)::integer as learning_logged_days,
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
signal_weekly as (
  select
    sd.user_id,
    date_trunc('week', sd.activity_date::timestamp)::date as week_start_date,
    sd.signal_key,
    count(*) filter (where sd.was_active)::integer as active_days
  from signal_daily sd
  group by sd.user_id, date_trunc('week', sd.activity_date::timestamp)::date, sd.signal_key
),
signal_score as (
  select
    sw.user_id,
    sw.week_start_date,
    sum(
      sc.weight_percent * least(sw.active_days, sc.weight_cap_days)::numeric / sc.weight_cap_days
    ) as weighted_signal_score
  from signal_weekly sw
  join public.data_lab_signal_config sc on sc.signal_key = sw.signal_key
  where sc.is_active = true and sc.weight_percent > 0
  group by sw.user_id, sw.week_start_date
),
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
left join signal_score ss on ss.user_id = wd.user_id and ss.week_start_date = wd.week_start_date
left join breadth_score bs on bs.user_id = wd.user_id and bs.week_start_date = wd.week_start_date
where wd.week_start_date >= (select cutoff from date_boundary)
order by wd.week_start_date desc;
grant select on public.data_lab_weekly_system_score_12w to authenticated;

-- ---------------------------------------------------------
-- 4. BRAIN ENGINE SNAPSHOT
-- ---------------------------------------------------------
drop view if exists public.current_day_snapshot cascade;
create or replace view public.current_day_snapshot as
with user_scope as (
  select auth.uid() as user_id, (now() at time zone 'Asia/Kolkata')::date as today
),
tasks as (
  select us.user_id, count(*) as pending_tasks, min(title) filter (where created_at = (select min(created_at) from public.tasks where is_completed = false and user_id = us.user_id)) as oldest_pending_task
  from public.tasks, user_scope us
  where is_completed = false and public.tasks.user_id = us.user_id
  group by us.user_id
),
habits as (
  select us.user_id, count(*) as total_active, min(title) filter (where created_at = (select max(created_at) from public.habits where deleted_at is null and user_id = us.user_id)) as newest_habit
  from public.habits, user_scope us
  where deleted_at is null and public.habits.user_id = us.user_id
  group by us.user_id
),
habit_logs_today as (
  select hl.user_id, count(distinct hl.habit_id) as completed_today
  from public.habit_logs hl
  join public.habits h on h.id = hl.habit_id
  join user_scope us on hl.user_id = us.user_id and hl.log_date = us.today
  where hl.value >= h.target_value
  group by hl.user_id
),
journal as (
  select us.user_id, count(*) > 0 as logged_today
  from public.journal_entries, user_scope us
  where deleted_at is null and (created_at at time zone 'Asia/Kolkata')::date = us.today and public.journal_entries.user_id = us.user_id
  group by us.user_id
),
workouts as (
  select us.user_id, count(*) as days_this_week
  from public.workouts, user_scope us
  where deleted_at is null and end_time is not null and public.workouts.user_id = us.user_id
    and workout_date >= date_trunc('week', us.today::timestamp)::date
  group by us.user_id
),
time_logs as (
  select us.user_id, coalesce(sum(duration_minutes), 0) as deep_work_minutes
  from public.time_logs, user_scope us
  where end_time is not null and public.time_logs.user_id = us.user_id
    and (start_time at time zone 'Asia/Kolkata')::date = us.today
    and bucket in ('Deep Work', 'Learning')
  group by us.user_id
),
learning_stats as (
  select user_id,
    (select count(*) from public.learning_roadmaps where status = 'active' and deleted_at is null and user_id = us.user_id) as active_roadmaps,
    (select count(*) from public.learning_session_logs where (logged_at at time zone 'Asia/Kolkata')::date >= us.today - interval '6 day' and deleted_at is null and user_id = us.user_id) as sessions_logged_7d
  from user_scope us
)
select
  us.user_id,
  us.today as snapshot_date,
  coalesce(t.pending_tasks, 0)::integer as pending_tasks_count,
  coalesce(h.total_active, 0)::integer as total_active_habits,
  coalesce(hlt.completed_today, 0)::integer as habits_completed_today,
  coalesce(j.logged_today, false) as journal_logged_today,
  coalesce(w.days_this_week, 0)::integer as workout_days_this_week,
  coalesce(tl.deep_work_minutes, 0)::integer as deep_work_minutes_today,
  coalesce(ls.sessions_logged_7d, 0)::integer as learning_sessions_logged_7d,
  coalesce(ls.active_roadmaps, 0)::integer as active_roadmaps_count,
  t.oldest_pending_task as oldest_pending_task_title,
  h.newest_habit as newest_active_habit_title
from user_scope us
left join tasks t on t.user_id = us.user_id
left join habits h on h.user_id = us.user_id
left join habit_logs_today hlt on hlt.user_id = us.user_id
left join journal j on j.user_id = us.user_id
left join workouts w on w.user_id = us.user_id
left join time_logs tl on tl.user_id = us.user_id
left join learning_stats ls on ls.user_id = us.user_id;

grant select on public.current_day_snapshot to authenticated;

commit;
