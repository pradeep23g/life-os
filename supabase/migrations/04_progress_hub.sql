create extension if not exists "pgcrypto";

create table if not exists public.programming_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  language_or_tool text not null,
  proficiency_level text not null check (proficiency_level in ('Beginner', 'Intermediate', 'Advanced')),
  projects_completed integer not null default 0 check (projects_completed >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_date date not null,
  achieved_date date,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null check (status in ('Active', 'Completed', 'Failed')) default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.personal_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_name text not null,
  domain text not null check (domain in ('Academics', 'Productivity')),
  proficiency_level text not null check (proficiency_level in ('Beginner', 'Intermediate', 'Advanced')),
  projects_completed integer not null default 0 check (projects_completed >= 0),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now()
);

create index if not exists idx_programming_skills_user_id on public.programming_skills (user_id);
create index if not exists idx_milestones_user_id on public.milestones (user_id);
create index if not exists idx_milestones_target_date on public.milestones (target_date);
create index if not exists idx_challenges_user_id on public.challenges (user_id);
create index if not exists idx_challenges_status on public.challenges (status);
create index if not exists idx_personal_skills_user_id on public.personal_skills (user_id);

alter table public.programming_skills enable row level security;
alter table public.milestones enable row level security;
alter table public.challenges enable row level security;
alter table public.personal_skills enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.programming_skills to authenticated;
grant select, insert, update, delete on table public.milestones to authenticated;
grant select, insert, update, delete on table public.challenges to authenticated;
grant select, insert, update, delete on table public.personal_skills to authenticated;

drop policy if exists "Users can select own programming skills" on public.programming_skills;
drop policy if exists "Users can insert own programming skills" on public.programming_skills;
drop policy if exists "Users can update own programming skills" on public.programming_skills;
drop policy if exists "Users can delete own programming skills" on public.programming_skills;

drop policy if exists "Users can select own milestones" on public.milestones;
drop policy if exists "Users can insert own milestones" on public.milestones;
drop policy if exists "Users can update own milestones" on public.milestones;
drop policy if exists "Users can delete own milestones" on public.milestones;

drop policy if exists "Users can select own challenges" on public.challenges;
drop policy if exists "Users can insert own challenges" on public.challenges;
drop policy if exists "Users can update own challenges" on public.challenges;
drop policy if exists "Users can delete own challenges" on public.challenges;

drop policy if exists "Users can select own personal skills" on public.personal_skills;
drop policy if exists "Users can insert own personal skills" on public.personal_skills;
drop policy if exists "Users can update own personal skills" on public.personal_skills;
drop policy if exists "Users can delete own personal skills" on public.personal_skills;

create policy "Users can select own programming skills"
  on public.programming_skills
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own programming skills"
  on public.programming_skills
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own programming skills"
  on public.programming_skills
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own programming skills"
  on public.programming_skills
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own milestones"
  on public.milestones
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own milestones"
  on public.milestones
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own milestones"
  on public.milestones
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own milestones"
  on public.milestones
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own challenges"
  on public.challenges
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own challenges"
  on public.challenges
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own challenges"
  on public.challenges
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own challenges"
  on public.challenges
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can select own personal skills"
  on public.personal_skills
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own personal skills"
  on public.personal_skills
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own personal skills"
  on public.personal_skills
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own personal skills"
  on public.personal_skills
  for delete
  to authenticated
  using (auth.uid() = user_id);
