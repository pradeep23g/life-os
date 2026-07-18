# LIFE OS — AGENTS GUIDE

This is the primary orientation document for any AI agent or human contributor working on Life OS.

Read this file before reading any other documentation. It defines identity, philosophy, and operating rules.

---

## WHAT IS LIFE OS

Life OS is a **Personal Intelligence Operating System**.

It is not a productivity app. It is not a to-do list. It is not a habit tracker.

It is a long-term behavioral operating system: a system designed to accumulate years of real life data across multiple domains, detect patterns, and surface actionable intelligence about a person's actual behavior.

The project is expected to evolve over years. Every decision must respect that timeline.

---

## SIX PILLARS

Every module maps back to one of these pillars:

| # | Pillar | Module |
|---|---|---|
| 1 | Awareness | Mind OS (Journal) |
| 2 | Mind | Mind OS (Habits) |
| 3 | Body | Fitness OS |
| 4 | Execution | Productivity Hub, Time OS |
| 5 | Growth | Progress Hub |
| 6 | Cognitive Protection | Separation of reflection and execution |

Pillar 6 is an architectural invariant, not a preference. Reflection and execution must never be mixed in the same UI surface.

---

## SYSTEM MODULES

### Mission Control
- Path: `/mission-control`
- The global aggregator dashboard.
- Reads summaries from every domain module.
- Contains the Brain Engine hero panel (momentum, directive, issues).
- **Does not contain data entry UI.** Read-only aggregated view only.

### Mind OS
- Path: `/mind-os`, `/mind-os/habits`, `/mind-os/journal`
- Reflection workspace.
- **Habit Tracker:** value-based and binary habits, streak tracking, mistake/heal recovery flows, calendar modal.
- **Journal:** mood selector, multi-field entries, retroactive date entry, calendar modal with per-day aggregation.
- **Strict rule:** No execution items (tasks, deadlines) visible here.

### Productivity Hub
- Path: `/productivity-hub`, `/productivity-hub/tasks`, `/productivity-hub/planning`
- Execution workspace.
- **Tasks:** Kanban (To Do / Doing / Done), task creation, priority, Start Focus timer integration.
- **Planning:** weekly focus, goals CRUD, weekly plan items, weekly review, alignment health.
- **Strict rule:** No journaling or emotional reflection UI here.

### Progress Hub
- Path: `/progress-hub`, `/progress-hub/programming`, `/progress-hub/personal-skills`, `/progress-hub/milestones`, `/progress-hub/challenges`
- Learning and growth workspace.
- Programming skills, personal skills, milestones, challenges.

### Fitness OS
- Path: `/fitness-os`, `/fitness-os/workouts`, `/fitness-os/library`, `/fitness-os/pr`
- Physical discipline tracking.
- Workouts with exercise logs, exercise library, personal records.
- 90-day effort heatmap, weekly summary cards.

### Time OS
- Path: `/time-os`
- Focused time tracking. One active timer per user.
- Buckets: `Academics`, `Deep Work`, `Admin`, `Fitness`, `Learning`.
- Optional task linkage (Start Focus → moves task to Doing; stop → Done).
- Global timer bar visible across all pages.

### Finance OS
- Path: `/finance-os`
- Behavioral spending ledger.
- Need/want distinction (`is_need` flag).
- Monthly metrics, weekly burn bars, decision feedback toasts.

### Data Lab
- Path: `/data-lab`
- Read-only analytics and observability engine.
- Three tabs: Overview, Behavior, Telemetry.
- Powered by SQL aggregation views. Never mutates data.

### System (Internal)
- Not a user-facing route.
- Contains: Brain Engine, Evening Sync, SystemFeedbackToast.
- Lives in `src/features/system/`.

---

## TECH STACK

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Build | Vite | 7 |
| Language | TypeScript | 5.9 |
| Styling | TailwindCSS | 3 |
| Routing | React Router | 7 |
| Server state | React Query (@tanstack/react-query) | 5 |
| Client state | Zustand | 5 |
| Backend | Supabase (PostgreSQL + RLS) | hosted |
| Supabase JS | @supabase/supabase-js | 2 |
| Deployment | Vercel | — |

---

## FOLDER STRUCTURE

```
life-os/
  Docs/                    — All documentation
  public/                  — Static assets
  scripts/                 — Build/tooling scripts
  supabase/migrations/     — SQL migration files
  src/
    App.tsx                — Root router and layout definitions
    main.tsx               — React root mount
    index.css              — Global base styles
    components/            — Shared non-domain components (AppErrorBoundary, CommandPalette)
    hooks/                 — Shared hooks (useDocumentPiP)
    layout/                — Shell layout components (Sidebar)
    lib/                   — Shared utilities (supabase, auth, events, eventTaxonomy, useEventsAnalytics)
    store/                 — Zustand stores (useEventBus only)
    features/
      auth/                — AuthPage
      mission-control/     — Aggregator dashboard + Brain Engine integration
      mind-os/             — Habits, Journal
      productivity-hub/    — Tasks, Planning
      progress-hub/        — Programming skills, Personal skills, Milestones, Challenges
      fitness-os/          — Workouts, Library, Personal Records
      time-os/             — Timer, Analytics, GlobalTimerBar
      finance-os/          — Transactions, Finance Dashboard
      data-lab/            — Analytics engine (read-only)
      system/              — Brain Engine, Evening Sync, Feedback toasts
```

Each feature module follows an internal structure:

```
features/<module>/
  api/          — React Query hooks (reads and mutations)
  components/   — UI components
  pages/ or dashboard/  — Top-level page components (route targets)
  types/        — TypeScript types
  utils/        — Pure utility functions
  hooks/        — Module-specific hooks
  store/        — Module-specific Zustand slices (if needed)
  metrics/      — Pure metric computation (Data Lab only)
  transforms/   — Chart-ready data transforms (Data Lab only)
```

---

## DEVELOPMENT COMMANDS

Run from `life-os/` root:

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm ci` | Clean lockfile-based install |
| `npm run dev` | Start Vite dev server (localhost:5173) |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check + production build |
| `npm run preview` | Serve production build locally |
| `npm run verify:release` | lint + build (pre-deployment check) |

**Pre-commit minimum:** `npm run lint && npm run build` must both pass.

---

## OPERATING RULES FOR AGENTS

### Before Implementing Anything

1. Read `SYSTEM_ARCHITECTURE.md` for context.
2. Search the existing implementation for reusable hooks, components, and types.
3. Verify the domain boundary the change belongs to.
4. Check if the mutation requires a durable event (see `EVENT_TAXONOMY.md`).

### Domain Isolation

- Features live inside `src/features/<module>/`.
- A feature hook must not import from another feature's internal `api/` or `components/` folder.
- Cross-domain reads are allowed only in Mission Control and Data Lab (aggregators).
- Shared logic belongs in `src/lib/` or `src/components/`.

### Database Rules

- **Never modify schema without a migration file.**
- Never drop, rename, or alter columns without explicit approval.
- Never assume schema; inspect migrations first.
- RLS is always enabled. Every query is user-scoped via `auth.uid() = user_id`.

### Event Rules

- Every mutation that changes system state must either emit a durable event via `logEventSafe` or be documented as non-analytical in `EVENT_TAXONOMY.md`.
- Use constants from `src/lib/eventTaxonomy.ts` only. No inline event strings.
- `logEventSafe` failures are fire-and-forget. They must never block user actions.

### React Query Rules

- Cache keys must be domain-prefixed arrays.
- After mutations, invalidate the owning domain's cache key.
- After any task/habit/journal/fitness/time mutation, also invalidate `['system-status']` for Brain Engine reactivity.

### UI Rules

- No external UI component libraries.
- No animation frameworks.
- Styling via Tailwind utility classes only.
- Standard card: `rounded-xl border border-border bg-surface p-4`.
- Never mix reflection and execution in the same view.

### Implementation Strategy

- Solve with the smallest safe change.
- Prefer modifying one file over rewriting ten.
- Prefer isolated improvements over architectural rewrites.
- Divide large changes into independent strikes.

---

## SOURCE OF TRUTH PRIORITY

When the code and documentation conflict, **code wins**.

When documents conflict with each other, consult in this order:
1. `SYSTEM_ARCHITECTURE.md`
2. `DEV_WORKFLOW.md`
3. `EVENT_TAXONOMY.md`
4. `UI_SYSTEM.md`
5. `PROJECT_ROADMAP.md`
6. `LIFE_RULES.md`
7. Other documents

---

## DELIVERABLE TEMPLATE

Every implementation must conclude with a summary including:

- **Files Modified**
- **Reason**
- **Architectural Impact**
- **Database Impact**
- **Telemetry Impact** (events emitted or intentionally omitted)
- **Breaking Changes**
- **Build Verification** (state whether `npm run lint` and `npm run build` were run and passed)
