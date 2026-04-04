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
- Longest habit streak and weekly consistency metrics render.

### Mind OS
- Habits page loads and supports: create, mark done/undone, count updates, streak heal.
- Journal page supports: entry create, calendar modal, entry detail modal.
- Mind OS dashboard loads all grouped sections.

### Productivity Hub
- Tasks: create and move between `To Do`, `Doing`, `Done`.
- Planning: weekly focus save/update, goal create/status update, plan item create/status update, weekly review save/update.

### Progress Hub
- Programming skills: create, level up, add project.
- Personal skills: create, level up, add project, add progress.
- Milestones: create and toggle completion.
- Challenges: create and status transitions.

### Fitness OS
- Dashboard renders weekly cards, calendar popup/day drawer, and 90-day heatmap.
- Workouts: create, update, soft-delete, and manage exercise logs.
- Library: create, update, and soft-delete custom exercises.

## 3) Data Integrity / Schema Guard
- App remains functional if optional/new tables are not migrated yet (graceful fallbacks where defined).
- New migrations are applied and verified in Supabase before production rollout.

## 4) Event Pipeline Checks
- Core user actions create event rows in `events`.
- Event logging failures never block primary user actions.
- Weekly analytics cards render fallback values if `events` table is unavailable.
