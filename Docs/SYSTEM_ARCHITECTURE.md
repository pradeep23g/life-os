# LIFE OS — SYSTEM ARCHITECTURE

This document is the authoritative reference for the Life OS technical architecture.
Source of truth: the implementation. This document reflects the code as it exists, not as it was planned.

---

## 1. PROJECT IDENTITY

Life OS is a **Personal Intelligence Operating System** — not a productivity application.

Its purpose is to build a trustworthy, long-term behavioral record across multiple life domains: reflection, execution, physical discipline, financial awareness, and time intelligence. The system is designed to accumulate years of behavioral data and surface meaningful patterns.

---

## 2. ARCHITECTURE OVERVIEW

```
Browser Client
  └── React 19 + Vite 7 (SPA)
        └── React Router v7 (Nested routing)
        └── TailwindCSS v3 (Utility-first styling)
        └── Zustand v5 (Event Bus store only)
        └── React Query v5 (All server state)
              └── Supabase JS v2 (API client)
                    └── Supabase (hosted PostgreSQL)
                          └── PostgreSQL + RLS
                          └── SQL Views (aggregation layer)
```

**Key architectural invariants:**
- All server reads and writes go through React Query hooks.
- All database aggregation occurs in SQL views, not in TypeScript.
- TypeScript performs scoring, classification, and intelligence logic only.
- Domain boundaries are strictly enforced at the folder, hook, and cache-key level.

---

## 3. DOMAIN MODULE MAP

`src/features/` contains ten isolated domain modules:

| Module | Path | Responsibility |
|---|---|---|
| Mission Control | `mission-control/` | Aggregator dashboard; reads summaries from all domains |
| Mind OS | `mind-os/` | Reflection: habits, journaling |
| Productivity Hub | `productivity-hub/` | Execution: tasks, planning |
| Progress Hub | `progress-hub/` | Learning: milestones, challenges, skills |
| Fitness OS | `fitness-os/` | Physical tracking: workouts, exercise library |
| Time OS | `time-os/` | Focused time logging; global active timer |
| Finance OS | `finance-os/` | Behavioral spending ledger |
| Data Lab | `data-lab/` | Analytics engine; cross-domain behavioral intelligence |
| System | `system/` | Brain Engine; Evening Sync; feedback toasts |
| Auth | `auth/` | Supabase authentication page |

### Cognitive Boundary Rule

**Reflection** (Mind OS) and **Execution** (Productivity Hub) are intentionally separated.
Showing execution pressure (pending tasks) inside a reflection context (journal) triggers cognitive anxiety (Zeigarnik Effect). This boundary is a hard architectural constraint, not a style preference.

---

## 4. ROUTING ARCHITECTURE

Routes are declared in `src/App.tsx`. The structure uses nested React Router routes with layout components.

```
/auth                    → AuthPage (public)
/ (ProtectedRoute)
  / (AppShell)
    /                    → MissionControl (index)
    /mission-control     → MissionControl
    /mind-os             → MindOsLayout
      /                  → MindOsDashboard (index)
      /habits            → HabitsPage
      /journal           → JournalPage
    /productivity-hub    → ProductivityHubLayout
      /                  → ProductivityHubDashboard (index)
      /tasks             → TasksPage
      /planning          → PlanningPage
    /progress-hub        → ProgressHubLayout
      /                  → ProgressHubDashboard (index)
      /programming       → ProgrammingProgressPage
      /personal-skills   → PersonalSkillsPage
      /milestones        → MilestonesPage
      /challenges        → ChallengesPage
    /fitness-os          → FitnessOsLayout
      /                  → FitnessOsDashboard (index)
      /workouts          → WorkoutsPage
      /library           → FitnessLibraryPage
      /pr                → PersonalRecordsPage
    /time-os             → TimeOSPage
    /finance-os          → FinanceDashboard
    /data-lab            → DataLabPage
    /*                   → redirect to /
```

**AppShell** provides:
- Desktop sidebar (collapsible rail: 80px compact / 288px expanded, persisted to `sessionStorage`)
- Mobile drawer with hamburger toggle
- Sticky top header with contextual module title
- Global overlays: `GlobalTimerBar`, `SystemFeedbackToast`, `CommandPalette`
- Per-route `AppErrorBoundary`

---

## 5. NAVIGATION SYSTEM

### Tier 1 — Global Sidebar (`src/layout/Sidebar.tsx`)

Fixed left rail with per-module NavLinks. Module order as defined in `navItems`:

1. Mission Control
2. Mind OS
3. Productivity Hub
4. Time OS
5. Finance OS
6. Data Lab
7. Fitness OS
8. Progress Hub

Supports compact (icon-only) and expanded (icon + label) modes. Includes user email display, profile button, and sign-out.

### Tier 2 — Module Sub-Navigation

Each multi-page module renders a horizontal tab bar via its layout component (`MindOsLayout`, `ProductivityHubLayout`, etc.). These use `NavLink` with `end` prop for exact matching.

---

## 6. STATE MANAGEMENT

### React Query (Server State)

All database-backed state uses `@tanstack/react-query`. Cache keys follow strict domain prefixing:

```
['mind-os', 'habits']
['mind-os', 'journals']
['productivity-hub', 'tasks']
['productivity-hub', 'planning']
['progress-hub', ...]
['fitness-os', ...]
['time-os', ...]
['finance-os', ...]
['system-status']
['life-os', 'events-analytics']
['data-lab', 'daily-activity-90d']
['data-lab', 'weekly-score-12w']
['data-lab', 'module-consistency-30d']
['data-lab', 'event-coverage-30d']
['data-lab', 'recent-events']
```

Domain isolation at the cache key level prevents cross-domain query invalidation.

### Zustand (Event Bus)

`src/store/useEventBus.ts` is the single Zustand store. It serves one purpose: maintaining an in-memory ring buffer of `EventBusEvent` objects (max 50 entries) for immediate Brain Engine reactivity and Evening Sync processing.

Event types emitted through the bus: `DEEP_WORK_COMPLETED`, `WANT_EXPENSE_ADDED`, `WORKOUT_COMPLETED`, `HABIT_FAILED`.

Every `emitEvent` call also asynchronously inserts into `public.system_event_queue`. This is the **transient operational channel**, distinct from the **durable analytics channel** (`public.events`).

### Auth State

`src/lib/AuthContext.tsx` provides a React Context with `user` and `loading` from Supabase's `onAuthStateChange`. All protected routes wrap in `ProtectedRoute` which checks this context.

---

## 7. DATA FLOW PATTERN

```
User Action
  → Domain hook mutation (React Query useMutation)
  → supabase.from(...).insert/update/delete
  → logEventSafe() → public.events (durable, async, non-blocking)
  → emitEvent() → useEventBus → public.system_event_queue (transient, async)
  → queryClient.invalidateQueries({ queryKey: [...] })
  → React Query refetch
  → UI re-render
```

**Mutation safety rule:** Event writes and system_event_queue inserts are fire-and-forget. They must never block or throw on the primary user-facing mutation path.

---

## 8. SQL AGGREGATION LAYER

All high-level system status and analytics use SQL views rather than client-side table scans. This is the SQL-first aggregation principle.

### Brain Engine Views

| View | Description |
|---|---|
| `public.current_day_snapshot` | Per-user: pending tasks, habits completed, journal logged, workout days this week, deep work minutes today |
| `public.current_day_snapshot_history_14d` | 14-day rolling history for momentum trend calculation |

Both views use `security_invoker = true` and `auth.uid()` for RLS enforcement.

### Data Lab Views

| View | Window | Description |
|---|---|---|
| `public.data_lab_daily_activity_90d` | 90 days | Per-day: habits, journal, tasks, focus time, workouts, finance |
| `public.data_lab_weekly_system_score_12w` | 12 weeks | Per-week: aggregated system score, all domain day counts |
| `public.data_lab_module_consistency_30d` | 30 days | Per-module: active days and consistency percentage |
| `public.data_lab_event_coverage_30d` | 30 days | Per event type: event count, active days, date range |

**Design rule:** SQL views return facts only (counts, booleans, dates, titles). TypeScript performs all scoring, ranking, and intelligence derivation.

---

## 9. BRAIN ENGINE

The Brain Engine lives in `src/features/system/`. It transforms raw system facts into a prioritized action directive and a momentum assessment.

### Components

| File | Responsibility |
|---|---|
| `engine/types.ts` | All Brain Engine TypeScript types |
| `engine/analyzeMomentum.ts` | Derives `MomentumAnalysis` (0–100 score, trend direction) from 14-day history and live events |
| `engine/generateDirectives.ts` | Builds `DirectiveResult` via urgency scoring across 5 domains |
| `engine/systemEngine.ts` | Orchestrates: calls analyzeMomentum + generateDirectives, detects issues, builds `SystemStatus` |
| `api/useSystemStatus.ts` | React Query hook; fetches snapshot views, computes `SystemStatus` via `getSystemStatus()` |
| `api/useEveningSync.ts` | Evening Sync mutation; reads `system_event_queue`, computes momentum delta, writes to `system_metrics`, clears queue and Zustand bus |
| `components/SystemStatusCard.tsx` | Mission Control system status display with directive CTA |
| `components/BrainEngineHero.tsx` | Full Brain Engine hero panel in Mission Control |
| `components/DailyBriefing.tsx` | Momentum-band-based tone message |
| `components/SystemFeedbackToast.tsx` | Global toast notification surface |

### Directive Domain Priority

The Brain Engine evaluates urgency across five domains in this order when scores are tied:

1. `task` — pending tasks × 2
2. `habit` — unfinished habits × 2
3. `journal` — 5 if not logged today
4. `deep-work` — 6 if zero, 4 if under 60 min
5. `fitness` — 100 override if past Wednesday with zero workouts; 3 if under 2 days

The domain with the highest urgency score wins. The directive provides a label, reason, and navigation route.

### Cross-Module Reactivity

After any successful task/habit/journal/fitness/time mutation, the owning hook must call:
```ts
queryClient.invalidateQueries({ queryKey: ['system-status'] })
```
This triggers an immediate Brain Engine re-evaluation without a page reload.

---

## 10. EVENT SYSTEM

Life OS maintains two distinct event channels:

### Durable Analytics Events — `public.events`

Written via `logEventSafe()` in `src/lib/events.ts`. These are permanent behavioral records.

Schema: `user_id`, `domain`, `entity_type`, `entity_id`, `event_type`, `event_date_ist`, `payload`, `created_at`.

`event_date_ist` stores the India Standard Time date string (`YYYY-MM-DD`) for all timezone-correct analytics.

All canonical event constants are in `src/lib/eventTaxonomy.ts`. New event types must be added there; inline strings are forbidden.

### Transient Operational Events — `public.system_event_queue`

Written via `useEventBus.emitEvent()`. These are ephemeral signals for:
- Brain Engine live reactivity
- Evening Sync momentum calculation

Rows are deleted during Evening Sync after processing. They are **not** an analytics source of truth.

### Date Utilities

`src/lib/events.ts` exports three timezone-aware date helpers:
- `toIndiaDateKey(input)` — converts any date to `YYYY-MM-DD` in IST
- `getCurrentIndiaWeekStart(date)` — returns the Monday of the current IST week
- `addDaysToDateKey(dateKey, days)` — offset a `YYYY-MM-DD` string by N days

---

## 11. DATA LAB MODULE

Data Lab (`src/features/data-lab/`) is the behavioral analytics engine. It is a read-only observability surface — it never mutates data.

### Internal Architecture

```
data-lab/
  api/         useDataLab.ts          — React Query hooks for all 5 SQL views
  types/       types.ts               — All Data Lab TypeScript types
  metrics/     *.ts (11 files)        — Pure metric computation functions
  transforms/  behavior.ts, overview.ts, telemetry.ts — Chart-ready data transforms
  utils/       format.ts, period.ts, stats.ts          — Shared math/formatting helpers
  hooks/       useDataLabMetrics.ts, useDataMaturity.ts
  store/       useDataLabStore.ts     — Zustand slice for UI state (active tab, period)
  pages/       DataLabPage.tsx, OverviewTab.tsx, BehaviorTab.tsx, TelemetryTab.tsx
  components/  cards/, charts/, telemetry/, shared/
```

### Three Tabs

| Tab | Surface |
|---|---|
| Overview | WeeklyScoreSummary, ModuleConsistencyCard, BehaviorDriftCard, WeeklyScoreCard, ModuleConsistencyTable |
| Behavior | ContributionCalendar, BehaviorTimeline, HabitStreakRivers, CorrelationMatrix, MomentumDistribution, ActivityHistogram, BehaviorInsightsPanel, CorrelationExplorerCard |
| Telemetry | TelemetryHealthCard, SystemHealthPanel, RecentEventStream, EventCoverageTable, EventFrequencyHistogram, EventWaterfall, RecentActivityLog |

### Analytics Period

`AnalyticsPeriod = '7d' | '30d' | '90d' | 'all'`. The `PeriodSelector` component filters metrics for display; underlying data fetches always load the full view window (90d / 12w / 30d).

### Data Maturity

`DataMaturityLevel = 'insufficient' | 'experimental' | 'stable'` guards advanced analytics (e.g., correlation matrix) behind minimum data requirements computed in `useDataMaturity.ts`.

---

## 12. DATABASE SCHEMA OVERVIEW

### Core Domain Tables

| Table | Domain | Key Columns |
|---|---|---|
| `habits` | Mind OS | `id`, `user_id`, `title`, `target_value`, `deleted_at` |
| `habit_logs` | Mind OS | `id`, `user_id`, `habit_id`, `log_date`, `value` |
| `habit_break_heals` | Mind OS | habit recovery tracking |
| `journal_entries` | Mind OS | `id`, `user_id`, `mood`, `created_at`, `deleted_at` |
| `tasks` | Productivity Hub | `id`, `user_id`, `title`, `status`, `priority`, `is_completed`, `deadline_type`, `deadline_date`, `deleted_at` |
| `goals` | Productivity Hub | planning goals |
| `weekly_plans` | Productivity Hub | weekly focus container |
| `weekly_plan_items` | Productivity Hub | plan item rows |
| `weekly_reviews` | Productivity Hub | weekly review entries |
| `programming_skills` | Progress Hub | skills, levels, projects |
| `personal_skills` | Progress Hub | personal skill tracking |
| `milestones` | Progress Hub | milestone CRUD |
| `challenges` | Progress Hub | challenge lifecycle |
| `workouts` | Fitness OS | `id`, `user_id`, `workout_date`, `duration_minutes`, `end_time`, `deleted_at` |
| `exercises` | Fitness OS | exercise library |
| `exercise_logs` | Fitness OS | per-exercise set/rep/weight logs |
| `time_logs` | Time OS | `id`, `user_id`, `start_time`, `end_time`, `duration_minutes`, `bucket`, `task_id` |
| `transactions` | Finance OS | `id`, `user_id`, `amount`, `type`, `category`, `is_need`, `timestamp` |
| `events` | System | cross-domain durable analytics events |
| `system_event_queue` | System | transient operational signals |
| `system_metrics` | System | daily Evening Sync momentum snapshots |

### Security Model

- Row Level Security (RLS) is enabled on all domain tables.
- Policy pattern: `auth.uid() = user_id`.
- All SQL views use `security_invoker = true` to inherit the calling user's RLS context.
- Schema changes require migration files in `supabase/migrations/`.

### Migration Naming

Numbered prefix: `01_`, `02_`, ... for initial sequenced migrations.
Timestamped: `YYYYMMDDNNNN_description.sql` for post-baseline migrations.

---

## 13. TIME OS ARCHITECTURE

- **Primary table:** `public.time_logs`
- **One active timer invariant:** `end_time IS NULL` unique index per user
- **Buckets:** `Academics`, `Deep Work`, `Admin`, `Fitness`, `Learning`
- **Task linkage:** optional `task_id` foreign key; starting a linked timer moves the task to `Doing`, stopping marks it `Done`
- **Global Timer Bar:** `GlobalTimerBar.tsx` visible across all routes via AppShell
- **Picture-in-Picture:** `PiPTimer.tsx` + `useDocumentPiP.ts` hook for PiP window support
- **Analytics:** `useTimeAnalytics.ts` provides today total, bucket distribution, 7-day trend

---

## 14. FINANCE OS ARCHITECTURE

- **Primary table:** `public.transactions` (migrated from legacy `finance_transactions` in migration `202606230001`)
- **Transaction type:** `is_need` boolean tracks need vs. want distinction
- **Derived metrics:** computed in TypeScript in `useFinance.ts` — total spent, money left, daily safe limit, projected monthly, waste amount
- **Event emission:** `finance.transaction.created` / `finance.transaction.deleted` via `logEventSafe`
- **Bus signal:** `WANT_EXPENSE_ADDED` via `useEventBus.emitEvent` when `is_need = false`
- **Decision feedback:** toast warnings for want spikes above safe limit and over-budget projections

---

## 15. SHARED INFRASTRUCTURE

| File | Location | Purpose |
|---|---|---|
| `supabase.ts` | `src/lib/` | Supabase client singleton |
| `AuthContext.tsx` | `src/lib/` | Auth state provider and `useAuth` hook |
| `events.ts` | `src/lib/` | `logEventSafe`, `toIndiaDateKey`, week utilities |
| `eventTaxonomy.ts` | `src/lib/` | `EVENT_TYPES` constants, `LifeOsEventType` union |
| `useEventsAnalytics.ts` | `src/lib/` | Weekly events analytics hook for Mission Control |
| `useEventBus.ts` | `src/store/` | Zustand event bus store |
| `useDocumentPiP.ts` | `src/hooks/` | Document Picture-in-Picture API hook |
| `AppErrorBoundary.tsx` | `src/components/` | Per-route error isolation boundary |
| `CommandPalette.tsx` | `src/components/` | Global command palette (keyboard-driven navigation) |

---

## 16. UI SYSTEM CONTRACT

**Theme:** True-black dark mode only.

| Token | Value |
|---|---|
| Page background | `#000000` (Tailwind `bg-black`) |
| Card/surface | `#0a0a0a` (custom `bg-surface`) |
| Border | `#222222` (custom `border-border`) |
| Primary text | Tailwind `text-slate-100` |
| Secondary text | Tailwind `text-slate-400` |

**Custom Tailwind tokens** (`tailwind.config.js`):
```js
colors: {
  surface: '#0a0a0a',
  border:  '#222222',
}
```

**Standard card frame:**
```
rounded-xl border border-border bg-surface p-4
```

**No animation libraries.** No heavy UI component libraries. Tailwind utility classes and inline SVG icons only.

---

## 17. RELEASE VERIFICATION

```bash
npm run lint          # ESLint
npm run build         # tsc -b && vite build
npm run verify:release  # lint + build combined
```

All three must pass before any production deployment. See `RELEASE_GATE_CHECKLIST.md` for full manual verification steps.

---

## 18. ARCHITECTURAL INVARIANTS (NEVER VIOLATE)

1. Mission Control reads summaries only; it never contains raw domain data entry UI.
2. Reflection (Mind OS) and Execution (Productivity Hub) are cognitively separated.
3. SQL views return facts. TypeScript computes intelligence.
4. All durable event types are constants in `src/lib/eventTaxonomy.ts`.
5. `logEventSafe` failures must never block primary mutations.
6. Every schema change requires a migration file.
7. React Query cache keys are domain-prefixed.
8. Data Lab is read-only; it never mutates application state.
9. The `current_day_snapshot` and `current_day_snapshot_history_14d` views are the Brain Engine's only data inputs.
10. One active Time OS timer per user at all times (enforced by DB unique index).
