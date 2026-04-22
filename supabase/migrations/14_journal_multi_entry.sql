do $$
declare
  constraint_name text;
begin
  -- Drop unique constraints that enforce one entry per day for a user.
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'journal_entries'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%user_id%'
      and (
        pg_get_constraintdef(c.oid) ilike '%date%'
        or pg_get_constraintdef(c.oid) ilike '%created_at%'
      )
  loop
    execute format('alter table public.journal_entries drop constraint if exists %I', constraint_name);
  end loop;
end $$;

do $$
declare
  idx_name text;
begin
  -- Drop unique indexes (including expression indexes) that enforce one entry per day.
  for idx_name in
    select i.indexname
    from pg_indexes i
    where i.schemaname = 'public'
      and i.tablename = 'journal_entries'
      and i.indexdef ilike 'create unique index%'
      and i.indexdef ilike '%user_id%'
      and (
        i.indexdef ilike '%date%'
        or i.indexdef ilike '%created_at%'
      )
  loop
    execute format('drop index if exists public.%I', idx_name);
  end loop;
end $$;

alter table public.journal_entries
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_journal_entries_user_created_at
  on public.journal_entries (user_id, created_at desc)
  where deleted_at is null;
