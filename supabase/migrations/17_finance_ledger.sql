create extension if not exists "pgcrypto";

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  category text not null,
  is_need boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_finance_transactions_user_created_at
  on public.finance_transactions (user_id, created_at desc);

create index if not exists idx_finance_transactions_user_need_created_at
  on public.finance_transactions (user_id, is_need, created_at desc);

alter table public.finance_transactions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.finance_transactions to authenticated;

drop policy if exists "Users can select own finance transactions" on public.finance_transactions;
drop policy if exists "Users can insert own finance transactions" on public.finance_transactions;
drop policy if exists "Users can update own finance transactions" on public.finance_transactions;
drop policy if exists "Users can delete own finance transactions" on public.finance_transactions;

create policy "Users can select own finance transactions"
  on public.finance_transactions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own finance transactions"
  on public.finance_transactions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own finance transactions"
  on public.finance_transactions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own finance transactions"
  on public.finance_transactions
  for delete
  to authenticated
  using (auth.uid() = user_id);
