alter table public.habits
  add column if not exists habit_type text not null default 'binary';

alter table public.habits
  drop constraint if exists habits_habit_type_check;

alter table public.habits
  add constraint habits_habit_type_check
    check (habit_type in ('binary', 'target'));

update public.habits
set habit_type = case
  when coalesce(target_value, 1) > 1 or unit is not null then 'target'
  else 'binary'
end
where habit_type is null
   or habit_type not in ('binary', 'target');

alter table public.habit_logs
  add column if not exists log_date date;

update public.habit_logs
set log_date = (logged_at at time zone 'Asia/Kolkata')::date
where log_date is null;

alter table public.habit_logs
  alter column log_date set not null;

alter table public.habit_logs
  add column if not exists struggle_note text;

delete from public.habit_logs older
using public.habit_logs newer
where older.habit_id = newer.habit_id
  and older.log_date = newer.log_date
  and (
    older.created_at < newer.created_at
    or (older.created_at = newer.created_at and older.id < newer.id)
  );

create unique index if not exists idx_habit_logs_habit_date_unique
  on public.habit_logs (habit_id, log_date);

create index if not exists idx_habit_logs_user_log_date
  on public.habit_logs (user_id, log_date desc);

create table if not exists public.habit_streak_breaks (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  break_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  healed_at timestamptz,
  unique (habit_id, break_date)
);

create table if not exists public.habit_streak_heals (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  break_id uuid not null references public.habit_streak_breaks (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (break_id)
);

create index if not exists idx_habit_streak_breaks_user_date
  on public.habit_streak_breaks (user_id, break_date desc);

create index if not exists idx_habit_streak_breaks_habit_date
  on public.habit_streak_breaks (habit_id, break_date desc);

create index if not exists idx_habit_streak_heals_user_created
  on public.habit_streak_heals (user_id, created_at desc);

alter table public.habit_streak_breaks enable row level security;
alter table public.habit_streak_heals enable row level security;

grant select, insert, update, delete on table public.habit_streak_breaks to authenticated;
grant select, insert, update, delete on table public.habit_streak_heals to authenticated;

drop policy if exists "Users can select own habit streak breaks" on public.habit_streak_breaks;
drop policy if exists "Users can insert own habit streak breaks" on public.habit_streak_breaks;
drop policy if exists "Users can update own habit streak breaks" on public.habit_streak_breaks;
drop policy if exists "Users can delete own habit streak breaks" on public.habit_streak_breaks;

drop policy if exists "Users can select own habit streak heals" on public.habit_streak_heals;
drop policy if exists "Users can insert own habit streak heals" on public.habit_streak_heals;
drop policy if exists "Users can update own habit streak heals" on public.habit_streak_heals;
drop policy if exists "Users can delete own habit streak heals" on public.habit_streak_heals;

create policy "Users can select own habit streak breaks"
  on public.habit_streak_breaks
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit streak breaks"
  on public.habit_streak_breaks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit streak breaks"
  on public.habit_streak_breaks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habit streak breaks"
  on public.habit_streak_breaks
  for delete
  using (auth.uid() = user_id);

create policy "Users can select own habit streak heals"
  on public.habit_streak_heals
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own habit streak heals"
  on public.habit_streak_heals
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own habit streak heals"
  on public.habit_streak_heals
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own habit streak heals"
  on public.habit_streak_heals
  for delete
  using (auth.uid() = user_id);

create or replace function public.enforce_habit_streak_heal_monthly_limit()
returns trigger
language plpgsql
as $$
declare
  month_start date;
  month_end date;
  heal_count integer;
begin
  month_start := date_trunc('month', (now() at time zone 'Asia/Kolkata'))::date;
  month_end := (month_start + interval '1 month')::date;

  select count(*)
    into heal_count
  from public.habit_streak_heals
  where user_id = new.user_id
    and ((created_at at time zone 'Asia/Kolkata')::date) >= month_start
    and ((created_at at time zone 'Asia/Kolkata')::date) < month_end;

  if heal_count >= 5 then
    raise exception 'Monthly streak heal limit reached (max 5 heals).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_habit_streak_heal_monthly_limit on public.habit_streak_heals;

create trigger trg_enforce_habit_streak_heal_monthly_limit
before insert on public.habit_streak_heals
for each row
execute function public.enforce_habit_streak_heal_monthly_limit();

alter table public.journal_entries
  add column if not exists what_went_good text;

alter table public.journal_entries
  add column if not exists what_you_learned text;

alter table public.journal_entries
  add column if not exists brief_about_day text;

update public.journal_entries
set went_well = null,
    went_wrong = null,
    lesson_learned = null
where went_well is not null
   or went_wrong is not null
   or lesson_learned is not null;
