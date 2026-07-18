# LIFE OS — DEVELOPMENT WORKFLOW

This document defines the official development workflow for Life OS.

Human developers and AI agents must follow this workflow to make changes safely without breaking existing systems, corrupting data, or violating architectural boundaries.

---

## 1. DEVELOPMENT PRINCIPLES

1. Never break existing features.
2. Avoid rewriting working systems.
3. Implement inside the correct domain module (`src/features/<module>/`).
4. Follow the cognitive boundary rule (reflection ≠ execution).
5. Every mutation either emits a durable event or is documented as non-analytical.
6. When uncertain, prefer the simplest implementation.
7. Code stability over feature speed.

---

## 2. DATABASE SAFETY RULES

The Supabase database is the core infrastructure of Life OS. Historical data integrity is non-negotiable.

### Rule 1 — Never Modify Existing Schema Without Approval

Protected tables: `habits`, `habit_logs`, `journal_entries`, `tasks`, `events`, `transactions`, `workouts`, `time_logs`, and all others listed in `SYSTEM_ARCHITECTURE.md`.

Do not:
- Drop columns
- Rename columns
- Alter existing constraints
- Delete indexes

These changes can silently break SQL views, React Query hooks, and analytics pipelines.

### Rule 2 — All Database Changes Use Migrations

Every schema change must be written as a `.sql` file in `supabase/migrations/`.

Naming convention:
- Sequenced: `NN_description.sql` (for early schema)
- Timestamped: `YYYYMMDDNNNN_description.sql` (preferred for all new migrations)

Example:
```sql
-- supabase/migrations/202607180001_add_task_tags.sql
alter table public.tasks
  add column if not exists tags text[] default '{}';
```

Never manually edit the database without a corresponding migration file.

### Rule 3 — The Observability Mandate

Every user action that changes system state must either:

1. Emit a durable event to `public.events` via `logEventSafe` using a constant from `src/lib/eventTaxonomy.ts`, **or**
2. Be explicitly documented as a non-analytical system operation in `EVENT_TAXONOMY.md`.

Durable event format: `domain.entity.action` (e.g., `mind.habit.completed`).

Transient `system_event_queue` signals are not a substitute for durable events.

### Rule 4 — Supabase Console SQL Must Be Safe

When writing raw SQL for the Supabase console:
- Always verify table and column names against the migration history.
- Never run destructive queries without a recovery plan.
- Avoid `DELETE FROM <table>` without a `WHERE` clause.
- Use `SELECT` to verify before mutating.

---

## 3. REACT QUERY PATTERNS

### Cache Key Convention

```ts
// Domain-prefixed cache key arrays:
['mind-os', 'habits']
['mind-os', 'journals']
['productivity-hub', 'tasks']
['productivity-hub', 'planning']
['progress-hub', 'milestones']
['fitness-os', 'workouts']
['time-os', 'logs']
['finance-os', 'transactions']
['system-status']
['life-os', 'events-analytics']
['data-lab', 'daily-activity-90d']
['data-lab', 'weekly-score-12w']
['data-lab', 'module-consistency-30d']
['data-lab', 'event-coverage-30d']
['data-lab', 'recent-events']
```

### Query Pattern

```ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export function useMyDomainData() {
  return useQuery({
    queryKey: ['my-domain', 'my-entity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`Failed to fetch: ${error.message}`)
      return data ?? []
    },
  })
}
```

### Mutation Pattern with Event + Invalidation

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logEventSafe } from '../../../lib/events'
import { EVENT_TYPES } from '../../../lib/eventTaxonomy'

export function useCreateMyEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MyInput) => {
      const { data, error } = await supabase
        .from('my_table')
        .insert({ ...input, user_id: userId })
        .select()
        .single()

      if (error) throw error

      await logEventSafe({
        domain: 'my-domain',
        entityType: 'my_entity',
        entityId: data.id,
        eventType: EVENT_TYPES.MY_ENTITY_CREATED,
        payload: { my_entity_id: data.id },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-domain', 'my-entity'] })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}
```

### Brain Engine Invalidation Rule

After any successful mutation in the following domains, always invalidate `['system-status']`:
- `mind-os` (habits, journals)
- `productivity-hub` (tasks)
- `fitness-os` (workouts)
- `time-os` (time logs)

This causes an immediate Brain Engine re-evaluation.

---

## 4. FRONTEND DEVELOPMENT RULES

### Technology Constraints

- Framework: React + Vite
- Routing: React Router (nested routes)
- Styling: TailwindCSS
- State: React Query (server) + Zustand (Event Bus only)
- No heavy UI component libraries (Material UI, Ant Design, Radix, etc.)
- No animation frameworks (Framer Motion, etc. for simple transitions)
- No chart libraries; all charts are hand-coded SVG/CSS

### Component Placement Rules

Components must live inside the module they belong to:

```
features/
  mind-os/
    api/           useHabits.ts, useJournal.ts
    components/    HabitCard.tsx, MoodSelector.tsx
    habits/        HabitsPage.tsx
    journal/       JournalPage.tsx
    dashboard/     MindOsDashboard.tsx
    utils/         ...
```

Never place domain components in `src/components/`. That folder is for shared non-domain components only (currently: `AppErrorBoundary`, `CommandPalette`).

### Routing Rules

Pages map to React Router nested routes defined in `App.tsx`.

When adding a new route:
1. Create the page component inside the correct feature folder.
2. Import it in `App.tsx`.
3. Add a `<Route>` inside the correct layout.
4. Add a sub-nav `LocalNavLink` in the layout component if it's a tab-level page.
5. Add a title case to `getShellTitle()` in `App.tsx`.

### UI Standards

Standard card frame used across all modules:
```
rounded-xl border border-border bg-surface p-4
```

Color tokens:
- `bg-black` — page background
- `bg-surface` (`#0a0a0a`) — card/surface background
- `border-border` (`#222222`) — all borders
- `text-slate-100` — primary text
- `text-slate-400` — secondary/muted text

Never introduce custom color values outside the established system.

---

## 5. ERROR HANDLING

### Supabase Query Errors

Always check for errors on every Supabase call:

```ts
const { data, error } = await supabase.from('table').select('*')
if (error) throw new Error(`Failed to fetch: ${error.message}`)
```

### Missing Table/View Graceful Fallback

For tables or views that may not exist during migration transitions:

```ts
function isMissingTableError(error: unknown, tableName: string): boolean {
  // Check for PostgreSQL error codes 42P01 (table not found) or PostgREST 205
  ...
}

if (isMissingTableError(error, 'my_view')) {
  return [] // Return empty fallback, don't throw
}
```

This pattern is used throughout the codebase to ensure graceful degradation when migrations have not yet been applied.

### logEventSafe

Always use `logEventSafe` (never direct `supabase.from('events').insert`). It is wrapped in try/catch and silently swallows failures so event logging never blocks user actions.

---

## 6. FEATURE DEVELOPMENT FLOW

When implementing a new feature:

1. **Read** `SYSTEM_ARCHITECTURE.md` to confirm the module boundary.
2. **Search** existing hooks and components; reuse before creating.
3. **Write** the Supabase migration if a schema change is needed.
4. **Implement** the React Query hook in `features/<module>/api/`.
5. **Build** the UI component in `features/<module>/components/` or `pages/`.
6. **Connect** the route in `App.tsx` if it's a new page.
7. **Add** durable event emission after each state-changing mutation.
8. **Invalidate** the correct cache keys including `['system-status']` if applicable.
9. **Run** `npm run lint && npm run build` to verify.
10. **Test** all related journeys per `RELEASE_GATE_CHECKLIST.md`.

---

## 7. BUG FIX PROCESS

1. Identify the source file and domain.
2. Verify the Supabase query (table name, column names, filters).
3. Verify the React Query cache key and invalidation.
4. Verify UI rendering logic.
5. Apply the minimal fix — never rewrite entire systems to fix a small bug.

---

## 8. GIT WORKFLOW

Commit message format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

Examples:
```
feat(productivity-hub): add task deadline_date field
fix(mind-os): correct habit streak calculation for skipped days
docs: update EVENT_TAXONOMY with new fitness events
chore(migrations): add data_lab_event_coverage_30d view
```

Avoid vague commits: `update stuff`, `fix bug`, `wip`.

---

## 9. SAFE VS. APPROVAL-REQUIRED OPERATIONS

### Safe — No Approval Required

- Reading files
- Modifying React components within established domains
- Adding new components inside correct feature folders
- Adding React Query hooks using existing tables
- Updating Tailwind styling
- Creating new SQL views that read existing tables
- Implementing nested UI layouts

### Requires Approval

- Adding or dropping table columns
- Dropping or renaming tables
- Modifying RLS policies
- Changing authentication logic
- Installing new npm dependencies
- Modifying environment variables
- Restructuring the top-level architecture

### Requires Explicit User Approval

- Destructive data migrations
- Dropping production tables
- Modifying the events schema
- Any change that could cause data loss

---

## 10. PERFORMANCE REQUIREMENTS

- Bundle size: minimize. No large dependencies without justification.
- Avoid unnecessary re-renders across domain boundaries.
- Use React Query caching to prevent redundant fetches.
- SQL views do aggregation; TypeScript does not perform O(n) table scans.
- No heavy client-side computations on large datasets.

---

## 11. RESPONSIVE DESIGN TESTING

Test both:
- **Desktop** — sidebar rail visible, multi-column grids, expanded layouts
- **Mobile** — hamburger drawer, stacked cards, horizontal scrollable tabs

Use browser DevTools device simulation for mobile testing.

---

## 12. PRE-COMMIT CHECKLIST

Before any commit:

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Feature works in both desktop and mobile viewports
- [ ] Cognitive boundaries are intact
- [ ] Database writes succeed and are verified
- [ ] No console errors
- [ ] Durable event emission verified (or documented as non-analytical)
- [ ] Brain Engine reactivity verified if applicable (system-status invalidated)
