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

grant select on public.current_day_snapshot to authenticated;
