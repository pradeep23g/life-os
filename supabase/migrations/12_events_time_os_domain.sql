do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'events'
  ) then
    alter table public.events
      drop constraint if exists events_domain_check;

    alter table public.events
      add constraint events_domain_check
      check (domain in ('mind-os', 'productivity-hub', 'progress-hub', 'mission-control', 'fitness-os', 'time-os'));
  end if;
end $$;
