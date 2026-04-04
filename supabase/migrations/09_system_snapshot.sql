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
  scope.snapshot_date
from scope
left join lateral (
  select count(*) as pending_tasks_count
  from public.tasks task_item
  where task_item.user_id = scope.user_id
    and task_item.deleted_at is null
    and task_item.status <> 'Done'
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
  select task_item.title as oldest_pending_task_title
  from public.tasks task_item
  where task_item.user_id = scope.user_id
    and task_item.deleted_at is null
    and task_item.status <> 'Done'
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

create or replace view public.current_day_snapshot_history_14d
with (security_invoker = true) as
with scope as (
  select
    auth.uid() as user_id,
    (now() at time zone 'Asia/Kolkata')::date as snapshot_date
),
days as (
  select
    scope.user_id,
    generated_day::date as snapshot_date
  from scope
  cross join generate_series(
    scope.snapshot_date - interval '13 day',
    scope.snapshot_date,
    interval '1 day'
  ) as generated_day
  where scope.user_id is not null
),
task_events as (
  select
    event_item.user_id,
    event_item.event_date_ist::date as snapshot_date,
    count(distinct event_item.entity_id)::integer as tasks_completed_count
  from public.events event_item
  where event_item.domain = 'productivity-hub'
    and event_item.event_type = 'task_status_updated'
    and coalesce(event_item.payload ->> 'status', '') = 'Done'
  group by event_item.user_id, event_item.event_date_ist::date
),
habit_day_completion as (
  select
    habit_log.user_id,
    habit_log.log_date as snapshot_date,
    count(distinct habit_item.id)::integer as habits_completed_count
  from public.habit_logs habit_log
  join public.habits habit_item
    on habit_item.id = habit_log.habit_id
  where (
      habit_item.deleted_at is null
      or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > habit_log.log_date
    )
    and habit_log.value >= habit_item.target_value
  group by habit_log.user_id, habit_log.log_date
),
habit_totals as (
  select
    day_item.user_id,
    day_item.snapshot_date,
    count(habit_item.id)::integer as total_active_habits
  from days day_item
  left join public.habits habit_item
    on habit_item.user_id = day_item.user_id
   and (habit_item.created_at at time zone 'Asia/Kolkata')::date <= day_item.snapshot_date
   and (
     habit_item.deleted_at is null
     or (habit_item.deleted_at at time zone 'Asia/Kolkata')::date > day_item.snapshot_date
   )
  group by day_item.user_id, day_item.snapshot_date
),
journal_days as (
  select
    journal_item.user_id,
    (journal_item.created_at at time zone 'Asia/Kolkata')::date as snapshot_date,
    true as journal_logged
  from public.journal_entries journal_item
  where journal_item.deleted_at is null
  group by journal_item.user_id, (journal_item.created_at at time zone 'Asia/Kolkata')::date
),
workout_days as (
  select
    workout_item.user_id,
    workout_item.workout_date as snapshot_date,
    true as workout_logged
  from public.workouts workout_item
  where workout_item.deleted_at is null
  group by workout_item.user_id, workout_item.workout_date
)
select
  day_item.user_id,
  day_item.snapshot_date,
  coalesce(task_events.tasks_completed_count, 0)::integer as tasks_completed_count,
  coalesce(habit_day_completion.habits_completed_count, 0)::integer as habits_completed_count,
  coalesce(habit_totals.total_active_habits, 0)::integer as total_active_habits,
  coalesce(journal_days.journal_logged, false) as journal_logged,
  coalesce(workout_days.workout_logged, false) as workout_logged
from days day_item
left join task_events
  on task_events.user_id = day_item.user_id
 and task_events.snapshot_date = day_item.snapshot_date
left join habit_day_completion
  on habit_day_completion.user_id = day_item.user_id
 and habit_day_completion.snapshot_date = day_item.snapshot_date
left join habit_totals
  on habit_totals.user_id = day_item.user_id
 and habit_totals.snapshot_date = day_item.snapshot_date
left join journal_days
  on journal_days.user_id = day_item.user_id
 and journal_days.snapshot_date = day_item.snapshot_date
left join workout_days
  on workout_days.user_id = day_item.user_id
 and workout_days.snapshot_date = day_item.snapshot_date
order by day_item.snapshot_date asc;

grant select on public.current_day_snapshot to authenticated;
grant select on public.current_day_snapshot_history_14d to authenticated;
