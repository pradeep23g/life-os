create extension if not exists "pgcrypto";

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  "timestamp" timestamptz not null default now()
);

create index if not exists idx_transactions_user_timestamp
  on public.transactions (user_id, "timestamp" desc);

create index if not exists idx_transactions_user_type_timestamp
  on public.transactions (user_id, type, "timestamp" desc);

alter table public.transactions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists "Users can select own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;

create policy "Users can select own transactions"
  on public.transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);

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
      check (domain in ('mind-os', 'productivity-hub', 'progress-hub', 'mission-control', 'fitness-os', 'finance-os', 'time-os'));
  end if;
end $$;
