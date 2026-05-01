# Life OS Release Gate Checklist

Every weekly release must pass this gate before merge or deployment.

## 1) Required Commands

Run from repo root:

- `npm run lint`
- `npm run build`
- `npm run verify:release`

## 2) Core Journey Checks

### Mission Control
- Dashboard loads without errors.
- Mind OS snapshot card renders correctly.
- Brain Engine card loads at top system section with:
  - momentum/trend
  - issues list
  - next move CTA route working
  - daily briefing message

### Mind OS
- Habits page supports:
  - create habit
  - mark done/undone
  - target count updates (+/- and keyboard set for today)
  - mistake reason + recovery commitment save
  - streak heal flow
  - calendar modal with done/break/healed filters
- Journal page supports:
  - modal entry creation
  - retroactive date-based entry creation (multi-entry same day)
  - calendar modal with per-day mood aggregation + multi-entry badge
  - date modal with read-only timeline cards and preserved text formatting
  - dashboard streak and correlation sections

### Productivity Hub
- Tasks:
  - create task
  - move across `To Do` / `Doing` / `Done`
  - `Start Focus` opens timer flow correctly
- Planning:
  - weekly focus save/update
  - goal create/status update
  - plan item create/status update
  - weekly review save/update
  - alignment metrics render

### Progress Hub
- Programming skills: create, level up, add project.
- Personal skills: create, level up, add project, add progress.
- Milestones: create and toggle completion.
- Challenges: create and status transitions.

### Fitness OS
- Dashboard renders weekly cards, calendar popup/day drawer, and 90-day heatmap.
- Workouts: create, update, soft-delete, and manage exercise logs.
- Library: create, update, and soft-delete custom exercises.

### Time OS
- Active timer persists across route change/refresh.
- Start timer, stop timer, and manual log save all succeed.
- Task-linked timer:
  - on start -> task moves to `Doing`
  - on stop -> task moves to `Done`
- Time insights render:
  - today total minutes
  - bucket distribution bar + legend
  - 7-day trend mini bars
- Global timer control visible and route link works.

### Finance OS
- Finance dashboard renders:
  - total spent
  - money left
  - days left
  - daily safe limit
  - projected monthly spend status
  - waste card and top waste category
- Weekly burn card renders:
  - weekly total vs baseline
  - 7 daily mini-bars
  - spike coloring and projection status text
- Quick-log modal flow:
  - opens from FAB
  - amount/category/need-want/note save works
  - custom category flow works (`Other`)
- Decision feedback loop:
  - want spike over safe limit shows warning toast
  - over-budget projection shows alert toast
  - normal entry shows success toast

## 3) Data Integrity / Schema Guard
- App remains functional if optional/new tables are not migrated yet (graceful fallbacks where defined).
- New migrations are applied and verified in Supabase before production rollout.
- Snapshot views exist and return expected factual rows:
  - `current_day_snapshot`
  - `current_day_snapshot_history_14d`

## 4) Event Pipeline Checks
- Core user actions create event rows in `events`.
- Event logging failures never block primary user actions.
- Weekly analytics cards render fallback values if `events` is unavailable.

## 5) Brain Reactivity Checks
- After successful task/habit/journal/fitness/time mutations,
  `queryClient.invalidateQueries({ queryKey: ['system-status'] })`
  (directly or via shared invalidation helper) causes Brain Engine refresh.
- Deep work minutes are reflected in snapshot-backed Brain status once migration is applied.
