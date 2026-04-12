alter table public.workouts
  add column if not exists start_time timestamptz,
  add column if not exists end_time timestamptz;

update public.workouts
set
  start_time = coalesce(start_time, created_at),
  end_time = coalesce(
    end_time,
    coalesce(start_time, created_at) + make_interval(mins => greatest(coalesce(duration_minutes, 0), 0))
  )
where start_time is null;

create index if not exists idx_workouts_user_active_session
  on public.workouts (user_id, created_at desc)
  where end_time is null and deleted_at is null;

create unique index if not exists idx_workouts_single_active_session_per_user
  on public.workouts (user_id)
  where end_time is null and deleted_at is null;
