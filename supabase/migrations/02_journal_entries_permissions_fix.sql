-- Journal table permission + RLS patch for authenticated users
alter table public.journal_entries enable row level security;

grant usage on schema public to authenticated;
grant select, insert on table public.journal_entries to authenticated;

drop policy if exists "Users can select own journal entries" on public.journal_entries;
drop policy if exists "Users can insert own journal entries" on public.journal_entries;
drop policy if exists "Users can select their own entries" on public.journal_entries;
drop policy if exists "Users can insert their own entries" on public.journal_entries;

create policy "Users can select their own entries"
  on public.journal_entries
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own entries"
  on public.journal_entries
  for insert
  to authenticated
  with check (auth.uid() = user_id);
