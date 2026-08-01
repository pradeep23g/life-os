-- =========================================================
-- PHASE 0 — Progress Hub Data Archive
-- Safely backs up existing progress hub data before dropping.
-- =========================================================

begin;

create table if not exists public.progress_hub_archive (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  archived_at timestamptz not null default now(),
  programming_skills jsonb not null default '[]'::jsonb,
  personal_skills jsonb not null default '[]'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  challenges jsonb not null default '[]'::jsonb,
  unique (user_id)
);

alter table public.progress_hub_archive enable row level security;

create policy "Users can select own archive"
  on public.progress_hub_archive
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Populate archive
insert into public.progress_hub_archive (
  user_id,
  programming_skills,
  personal_skills,
  milestones,
  challenges
)
select
  u.id as user_id,
  coalesce(
    (
      select jsonb_agg(row_to_json(ps))
      from public.programming_skills ps
      where ps.user_id = u.id
    ),
    '[]'::jsonb
  ) as programming_skills,
  coalesce(
    (
      select jsonb_agg(row_to_json(pers))
      from public.personal_skills pers
      where pers.user_id = u.id
    ),
    '[]'::jsonb
  ) as personal_skills,
  coalesce(
    (
      select jsonb_agg(row_to_json(m))
      from public.milestones m
      where m.user_id = u.id
    ),
    '[]'::jsonb
  ) as milestones,
  coalesce(
    (
      select jsonb_agg(row_to_json(c))
      from public.challenges c
      where c.user_id = u.id
    ),
    '[]'::jsonb
  ) as challenges
from auth.users u
where exists (
  select 1 from public.programming_skills where user_id = u.id
  union all
  select 1 from public.personal_skills where user_id = u.id
  union all
  select 1 from public.milestones where user_id = u.id
  union all
  select 1 from public.challenges where user_id = u.id
);

commit;
