-- =========================================================
-- PHASE 1 — Database Schema (Learning OS tables + Progress Hub retirement)
-- =========================================================

begin;

-- ---------------------------------------------------------
-- 1. LEARNING OS TABLES
-- ---------------------------------------------------------

create table if not exists public.learning_roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text,
  description text,
  status text not null default 'active' check (status in ('active', 'paused', 'completed', 'abandoned')),
  start_date date,
  target_end_date date,
  actual_end_date date,
  color text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_stages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  order_index int not null,
  title text not null,
  subtitle text,
  note text,
  color text,
  start_date date,
  end_date date,
  is_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stage_id uuid not null references public.learning_stages(id) on delete cascade,
  order_index int not null,
  slot text,
  title text not null,
  description text,
  estimated_minutes int,
  tags text[] default '{}'::text[],
  target_date date,
  is_skipped boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_session_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.learning_sessions(id) on delete set null,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  time_log_id uuid references public.time_logs(id) on delete set null,
  logged_at timestamptz not null default now(),
  duration_minutes int,
  metrics jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  stage_id uuid references public.learning_stages(id) on delete cascade,
  title text not null,
  achieved boolean not null default false,
  achieved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  stage_id uuid references public.learning_stages(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  repo_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.learning_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  roadmap_id uuid not null references public.learning_roadmaps(id) on delete cascade,
  stage_id uuid references public.learning_stages(id) on delete set null,
  session_id uuid references public.learning_sessions(id) on delete set null,
  content text not null,
  reflection_type text not null default 'general' check (reflection_type in ('general', 'weekly_milestone', 'teach_back_test')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes
create index if not exists idx_learning_stages_roadmap on public.learning_stages (roadmap_id);
create index if not exists idx_learning_sessions_stage on public.learning_sessions (stage_id);
create index if not exists idx_learning_session_logs_session on public.learning_session_logs (session_id);
create index if not exists idx_learning_session_logs_roadmap_date on public.learning_session_logs (roadmap_id, logged_at desc);

create index if not exists idx_learning_roadmaps_user on public.learning_roadmaps(user_id);
create index if not exists idx_learning_stages_user on public.learning_stages(user_id);
create index if not exists idx_learning_sessions_user on public.learning_sessions(user_id);
create index if not exists idx_learning_session_logs_user on public.learning_session_logs(user_id);
create index if not exists idx_learning_milestones_user on public.learning_milestones(user_id);
create index if not exists idx_learning_projects_user on public.learning_projects(user_id);
create index if not exists idx_learning_reflections_user on public.learning_reflections(user_id);

-- RLS
alter table public.learning_roadmaps enable row level security;
alter table public.learning_stages enable row level security;
alter table public.learning_sessions enable row level security;
alter table public.learning_session_logs enable row level security;
alter table public.learning_milestones enable row level security;
alter table public.learning_projects enable row level security;
alter table public.learning_reflections enable row level security;

-- Policies (all use simple auth.uid() = user_id)
create policy "Users can select own learning roadmaps" on public.learning_roadmaps for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning roadmaps" on public.learning_roadmaps for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning roadmaps" on public.learning_roadmaps for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning roadmaps" on public.learning_roadmaps for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning stages" on public.learning_stages for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning stages" on public.learning_stages for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning stages" on public.learning_stages for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning stages" on public.learning_stages for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning sessions" on public.learning_sessions for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning sessions" on public.learning_sessions for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning sessions" on public.learning_sessions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning sessions" on public.learning_sessions for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning session logs" on public.learning_session_logs for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning session logs" on public.learning_session_logs for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning session logs" on public.learning_session_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning session logs" on public.learning_session_logs for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning milestones" on public.learning_milestones for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning milestones" on public.learning_milestones for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning milestones" on public.learning_milestones for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning milestones" on public.learning_milestones for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning projects" on public.learning_projects for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning projects" on public.learning_projects for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning projects" on public.learning_projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning projects" on public.learning_projects for delete to authenticated using (auth.uid() = user_id);

create policy "Users can select own learning reflections" on public.learning_reflections for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own learning reflections" on public.learning_reflections for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own learning reflections" on public.learning_reflections for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own learning reflections" on public.learning_reflections for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------
-- 2. SQL VIEWS
-- ---------------------------------------------------------

create or replace view public.learning_stage_progress
with (security_invoker = true) as
select
  st.id as stage_id,
  st.roadmap_id,
  count(s.id)::integer as total_sessions,
  count(s.id) filter (where s.is_skipped or exists (
    select 1 from public.learning_session_logs lsl 
    where lsl.session_id = s.id 
      and lsl.deleted_at is null
  ))::integer as completed_sessions,
  case
    when count(s.id) = 0 then 0
    else round(
      100.0 * count(s.id) filter (where s.is_skipped or exists (
        select 1 from public.learning_session_logs lsl 
        where lsl.session_id = s.id 
          and lsl.deleted_at is null
      )) / count(s.id)
    )::integer
  end as pct_complete
from public.learning_stages st
left join public.learning_sessions s 
  on s.stage_id = st.id 
  and s.deleted_at is null
where st.deleted_at is null
group by st.id, st.roadmap_id;

grant select on public.learning_stage_progress to authenticated;

create or replace view public.learning_roadmap_progress
with (security_invoker = true) as
select
  r.id as roadmap_id,
  count(s.id)::integer as total_sessions,
  count(s.id) filter (where s.is_skipped or exists (
    select 1 from public.learning_session_logs lsl 
    where lsl.session_id = s.id 
      and lsl.deleted_at is null
  ))::integer as completed_sessions,
  case
    when count(s.id) = 0 then 0
    else round(
      100.0 * count(s.id) filter (where s.is_skipped or exists (
        select 1 from public.learning_session_logs lsl 
        where lsl.session_id = s.id 
          and lsl.deleted_at is null
      )) / count(s.id)
    )::integer
  end as pct_complete
from public.learning_roadmaps r
left join public.learning_stages st 
  on st.roadmap_id = r.id 
  and st.deleted_at is null
left join public.learning_sessions s 
  on s.stage_id = st.id 
  and s.deleted_at is null
where r.deleted_at is null
group by r.id;

grant select on public.learning_roadmap_progress to authenticated;

-- ---------------------------------------------------------
-- 3. PROGRESS HUB RETIREMENT (Drop old tables)
-- ---------------------------------------------------------
drop table if exists public.challenges cascade;
drop table if exists public.milestones cascade;
drop table if exists public.personal_skills cascade;
drop table if exists public.programming_skills cascade;

-- ---------------------------------------------------------
-- 4. UPDATE DOMAIN CONSTRAINTS
-- ---------------------------------------------------------

alter table public.events drop constraint if exists events_domain_check;
alter table public.goals drop constraint if exists goals_domain_check;

-- Update existing data to reflect new domain
update public.events set domain = 'learning-os' where domain = 'progress-hub';
update public.goals set domain = 'learning-os' where domain = 'progress-hub';

alter table public.events add constraint events_domain_check 
  check (domain in (
    'mind-os',
    'productivity-hub',
    'learning-os',
    'mission-control',
    'fitness-os',
    'finance-os',
    'time-os'
  ));

alter table public.goals add constraint goals_domain_check 
  check (domain in (
    'mind-os',
    'productivity-hub',
    'learning-os',
    'fitness-os',
    'finance-os'
  ));

commit;
