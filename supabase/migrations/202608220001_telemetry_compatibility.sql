-- 1. Create missing foreign key indexes
create index if not exists idx_habit_streak_heals_habit on public.habit_streak_heals (habit_id);
create index if not exists idx_habit_streak_heals_break on public.habit_streak_heals (break_id);
create index if not exists idx_weekly_plan_items_task on public.weekly_plan_items (linked_task_id);
create index if not exists idx_weekly_plan_items_habit on public.weekly_plan_items (linked_habit_id);
create index if not exists idx_exercise_logs_exercise on public.exercise_logs (exercise_id);
create index if not exists idx_time_logs_task on public.time_logs (task_id);
create index if not exists idx_learning_session_logs_time_log on public.learning_session_logs (time_log_id);
create index if not exists idx_learning_milestones_roadmap on public.learning_milestones (roadmap_id);
create index if not exists idx_learning_milestones_stage on public.learning_milestones (stage_id);
create index if not exists idx_learning_projects_roadmap on public.learning_projects (roadmap_id);
create index if not exists idx_learning_projects_stage on public.learning_projects (stage_id);
create index if not exists idx_learning_reflections_roadmap on public.learning_reflections (roadmap_id);
create index if not exists idx_learning_reflections_stage on public.learning_reflections (stage_id);
create index if not exists idx_learning_reflections_session on public.learning_reflections (session_id);

-- 2. Update current_day_snapshot_history_14d with compatibility mapping
drop view if exists public.current_day_snapshot_history_14d cascade;
create or replace view public.current_day_snapshot_history_14d
with (security_invoker = true) as
with scope as (
  select auth.uid() as user_id, (now() at time zone 'Asia/Kolkata')::date as snapshot_date
),
days as (
  select scope.user_id, generated_day::date as snapshot_date
  from scope cross join generate_series(scope.snapshot_date - interval '13 day', scope.snapshot_date, interval '1 day') as generated_day
  where scope.user_id is not null
),
task_events as (
  select event_item.user_id, event_item.event_date_ist::date as snapshot_date, count(distinct event_item.entity_id)::integer as tasks_completed_count
  from public.events event_item
  where event_item.domain = 'productivity-hub'
    and event_item.event_type in ('task_status_updated', 'productivity.task.status_changed')
    and coalesce(event_item.payload ->> 'status', '') = 'Done'
  group by event_item.user_id, event_item.event_date_ist::date
),
habit_day_completion as (
  select habit_log.user_id, habit_log.log_date as snapshot_date, count(distinct habit_item.id)::integer as habits_completed_count
  from public.habit_logs habit_log
  join public.habits habit_item on habit_item.id = habit_log.habit_id
  where (habit_item.deleted_at is null or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > habit_log.log_date)
    and habit_log.value >= habit_item.target_value
  group by habit_log.user_id, habit_log.log_date
),
habit_totals as (
  select day_item.user_id, day_item.snapshot_date, count(habit_item.id)::integer as total_active_habits
  from days day_item
  left join public.habits habit_item on habit_item.user_id = day_item.user_id
   and (habit_item.created_at at time zone 'Asia/Kolkata')::date <= day_item.snapshot_date
   and (habit_item.deleted_at is null or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > day_item.snapshot_date)
  group by day_item.user_id, day_item.snapshot_date
),
journal_days as (
  select journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date as snapshot_date, true as journal_logged
  from public.journal_entries journal_item
  where journal_item.deleted_at is null
  group by journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date
),
workout_days as (
  select workout_item.user_id, workout_item.workout_date as snapshot_date, true as workout_logged
  from public.workouts workout_item
  where workout_item.deleted_at is null
  group by workout_item.user_id, workout_item.workout_date
)
select day_item.user_id, day_item.snapshot_date,
  coalesce(task_events.tasks_completed_count, 0)::integer as tasks_completed_count,
  coalesce(habit_day_completion.habits_completed_count, 0)::integer as habits_completed_count,
  coalesce(habit_totals.total_active_habits, 0)::integer as total_active_habits,
  coalesce(journal_days.journal_logged, false) as journal_logged,
  coalesce(workout_days.workout_logged, false) as workout_logged
from days day_item
left join task_events on task_events.user_id = day_item.user_id and task_events.snapshot_date = day_item.snapshot_date
left join habit_day_completion on habit_day_completion.user_id = day_item.user_id and habit_day_completion.snapshot_date = day_item.snapshot_date
left join habit_totals on habit_totals.user_id = day_item.user_id and habit_totals.snapshot_date = day_item.snapshot_date
left join journal_days on journal_days.user_id = day_item.user_id and journal_days.snapshot_date = day_item.snapshot_date
left join workout_days on workout_days.user_id = day_item.user_id and workout_days.snapshot_date = day_item.snapshot_date
order by day_item.snapshot_date asc;

grant select on public.current_day_snapshot_history_14d to authenticated;

-- 3. Update data_lab_daily_activity_90d with compatibility mapping
drop view if exists public.data_lab_daily_activity_90d cascade;
create or replace view public.data_lab_daily_activity_90d
with (security_invoker = true) as
with scope as (
  select auth.uid() as user_id, (now() at time zone 'Asia/Kolkata')::date as today
),
days as (
  select scope.user_id, generated_day::date as activity_date
  from scope cross join generate_series(scope.today - interval '89 day', scope.today, interval '1 day') as generated_day
  where scope.user_id is not null
),
habit_totals as (
  select day_item.user_id, day_item.activity_date, count(habit_item.id)::integer as active_habits
  from days day_item
  left join public.habits habit_item on habit_item.user_id = day_item.user_id
   and (habit_item.created_at at time zone 'Asia/Kolkata')::date <= day_item.activity_date
   and (habit_item.deleted_at is null or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > day_item.activity_date)
  group by day_item.user_id, day_item.activity_date
),
habit_completed as (
  select habit_log.user_id, habit_log.log_date as activity_date, count(distinct habit_log.habit_id)::integer as habits_completed
  from public.habit_logs habit_log
  join public.habits habit_item on habit_item.id = habit_log.habit_id
  where habit_log.user_id = auth.uid() and habit_log.value >= habit_item.target_value
  group by habit_log.user_id, habit_log.log_date
),
journal_daily as (
  select journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date as activity_date, count(*)::integer as journal_entries, avg(journal_item.mood)::numeric(5,2) as avg_mood
  from public.journal_entries journal_item
  where journal_item.user_id = auth.uid() and journal_item.deleted_at is null
  group by journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date
),
task_daily as (
  select event_item.user_id, event_item.event_date_ist::date as activity_date,
    count(*) filter (where event_item.event_type in ('task_created', 'productivity.task.created'))::integer as tasks_created,
    count(*) filter (where event_item.event_type in ('task_status_updated', 'productivity.task.status_changed') and coalesce(event_item.payload ->> 'status', '') = 'Done')::integer as tasks_completed
  from public.events event_item
  where event_item.user_id = auth.uid() and event_item.domain = 'productivity-hub'
  group by event_item.user_id, event_item.event_date_ist::date
),
time_daily as (
  select time_log.user_id, (time_log.start_time at time zone 'Asia/Kolkata')::date as activity_date,
    coalesce(sum(time_log.duration_minutes), 0)::integer as total_focus_minutes,
    coalesce(sum(time_log.duration_minutes) filter (where time_log.bucket in ('Deep Work', 'Learning')), 0)::integer as deep_work_minutes,
    count(*)::integer as focus_sessions
  from public.time_logs time_log
  where time_log.user_id = auth.uid() and time_log.end_time is not null
  group by time_log.user_id, (time_log.start_time at time zone 'Asia/Kolkata')::date
),
fitness_daily as (
  select workout_item.user_id, workout_item.workout_date as activity_date, count(*)::integer as workouts_logged, coalesce(sum(workout_item.duration_minutes), 0)::integer as workout_minutes
  from public.workouts workout_item
  where workout_item.user_id = auth.uid() and workout_item.deleted_at is null and workout_item.end_time is not null
  group by workout_item.user_id, workout_item.workout_date
),
finance_daily as (
  select transaction_item.user_id, (transaction_item."timestamp" at time zone 'Asia/Kolkata')::date as activity_date,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense'), 0)::numeric(12,2) as total_spent,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense' and transaction_item.is_need = true), 0)::numeric(12,2) as need_spent,
    coalesce(sum(transaction_item.amount) filter (where transaction_item.type = 'expense' and transaction_item.is_need = false), 0)::numeric(12,2) as want_spent,
    count(*)::integer as finance_entries
  from public.transactions transaction_item
  where transaction_item.user_id = auth.uid()
  group by transaction_item.user_id, (transaction_item."timestamp" at time zone 'Asia/Kolkata')::date
),
learning_daily as (
  select user_id, (logged_at at time zone 'Asia/Kolkata')::date as activity_date, count(*)::integer as learning_sessions_logged
  from public.learning_session_logs
  where user_id = auth.uid() and deleted_at is null
  group by user_id, (logged_at at time zone 'Asia/Kolkata')::date
),
events_daily as (
  select event_item.user_id, event_item.event_date_ist::date as activity_date, count(*)::integer as events_logged, count(distinct event_item.domain)::integer as active_domains
  from public.events event_item
  where event_item.user_id = auth.uid()
  group by event_item.user_id, event_item.event_date_ist::date
)
select day_item.user_id, day_item.activity_date,
  coalesce(habit_totals.active_habits, 0)::integer as active_habits,
  coalesce(habit_completed.habits_completed, 0)::integer as habits_completed,
  case when coalesce(habit_totals.active_habits, 0) = 0 then 0
  else round((coalesce(habit_completed.habits_completed, 0)::numeric / habit_totals.active_habits::numeric) * 100) end::integer as habit_completion_percent,
  coalesce(journal_daily.journal_entries, 0)::integer as journal_entries, coalesce(journal_daily.avg_mood, 0)::numeric(5,2) as avg_mood,
  coalesce(task_daily.tasks_created, 0)::integer as tasks_created, coalesce(task_daily.tasks_completed, 0)::integer as tasks_completed,
  coalesce(time_daily.total_focus_minutes, 0)::integer as total_focus_minutes, coalesce(time_daily.deep_work_minutes, 0)::integer as deep_work_minutes, coalesce(time_daily.focus_sessions, 0)::integer as focus_sessions,
  coalesce(fitness_daily.workouts_logged, 0)::integer as workouts_logged, coalesce(fitness_daily.workout_minutes, 0)::integer as workout_minutes,
  coalesce(finance_daily.total_spent, 0)::numeric(12,2) as total_spent, coalesce(finance_daily.need_spent, 0)::numeric(12,2) as need_spent, coalesce(finance_daily.want_spent, 0)::numeric(12,2) as want_spent, coalesce(finance_daily.finance_entries, 0)::integer as finance_entries,
  coalesce(learning_daily.learning_sessions_logged, 0)::integer as learning_sessions_logged,
  coalesce(events_daily.events_logged, 0)::integer as events_logged, coalesce(events_daily.active_domains, 0)::integer as active_domains,
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

-- 4. Update current_day_snapshot with Finance integration
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
),
finance_stats as (
  select us.user_id,
    coalesce(sum(amount) filter (where type = 'expense' and "timestamp" >= date_trunc('month', us.today::timestamp)), 0) as month_total_spent,
    count(*) filter (where type = 'expense' and is_need = false and "timestamp" >= (now() at time zone 'Asia/Kolkata') - interval '7 day') as recent_want_expenses_count
  from public.transactions, user_scope us
  where public.transactions.user_id = us.user_id
  group by us.user_id
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
  h.newest_habit as newest_active_habit_title,
  coalesce((fs.month_total_spent / 50000.0) * 100, 0)::numeric as budget_utilization_percentage,
  coalesce(fs.recent_want_expenses_count, 0)::integer as recent_want_expenses_count
from user_scope us
left join tasks t on t.user_id = us.user_id
left join habits h on h.user_id = us.user_id
left join habit_logs_today hlt on hlt.user_id = us.user_id
left join journal j on j.user_id = us.user_id
left join workouts w on w.user_id = us.user_id
left join time_logs tl on tl.user_id = us.user_id
left join learning_stats ls on ls.user_id = us.user_id
left join finance_stats fs on fs.user_id = us.user_id;

grant select on public.current_day_snapshot to authenticated;

-- 5. Update partial index for task completion events
drop index if exists public.idx_events_user_task_done_date;
create index if not exists idx_events_user_task_done_date
  on public.events (user_id, event_date_ist desc)
  where domain = 'productivity-hub'
    and event_type in ('task_status_updated', 'productivity.task.status_changed')
    and (payload ->> 'status') = 'Done';
