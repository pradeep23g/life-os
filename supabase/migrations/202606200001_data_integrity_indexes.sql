do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'events'
  ) then
    alter table public.events
      drop constraint if exists events_domain_check;

    alter table public.events
      add constraint events_domain_check
      check (domain in (
        'mind-os',
        'productivity-hub',
        'progress-hub',
        'mission-control',
        'fitness-os',
        'finance-os',
        'time-os'
      ));
  end if;
end $$;

create index if not exists idx_events_user_domain_type_date
  on public.events (user_id, domain, event_type, event_date_ist desc);

create index if not exists idx_events_user_task_done_date
  on public.events (user_id, event_date_ist desc)
  where domain = 'productivity-hub'
    and event_type = 'task_status_updated'
    and (payload ->> 'status') = 'Done';

create index if not exists idx_journal_entries_user_ist_date_active
  on public.journal_entries (
    user_id,
    ((created_at at time zone 'Asia/Kolkata')::date)
  )
  where deleted_at is null;

create index if not exists idx_time_logs_user_ist_start_date_completed
  on public.time_logs (
    user_id,
    ((start_time at time zone 'Asia/Kolkata')::date)
  )
  where end_time is not null;

create index if not exists idx_finance_transactions_user_ist_date
  on public.finance_transactions (
    user_id,
    ((created_at at time zone 'Asia/Kolkata')::date)
  );

create index if not exists idx_workouts_user_date_completed
  on public.workouts (user_id, workout_date desc)
  where deleted_at is null
    and end_time is not null;

create index if not exists idx_habits_user_created_deleted
  on public.habits (user_id, created_at, deleted_at);

create index if not exists idx_system_event_queue_user_created
  on public.system_event_queue (user_id, created_at);
