# LIFE OS — CHANGELOG

This changelog reconstructs the significant milestones in the evolution of Life OS. Entries are ordered from earliest to most recent based on migration numbering and implementation evidence.

---

## Milestone 1 — Foundation: Mind OS + Productivity Hub

**Era:** Initial development (migrations 01–03)

### Introduced
- Project bootstrapped with React + Vite + TypeScript + TailwindCSS
- React Router nested routing architecture established
- Supabase integration with Row Level Security
- `AuthContext` authentication provider
- Global sidebar (`Sidebar.tsx`) with two-tier navigation
- **Mind OS** domain: Habit tracker (binary and value-based habits, habit logs, streak tracking)
- **Journal system**: mood selector, multi-field entries, soft deletes
- **Productivity Hub** domain: Kanban task manager (To Do / Doing / Done)
- `events` table created for cross-domain analytics pipeline
- Initial domain-isolated folder structure established (`src/features/`)
- React Query with domain-prefixed cache keys (`mind-os`, `productivity-hub`)

---

## Milestone 2 — Progress Hub

**Era:** Migration 04

### Introduced
- **Progress Hub** domain at `/progress-hub`
- Programming skills tracking (level, project count)
- Milestones (create, complete, reopen)
- Personal challenges (create, status transitions)
- Progress Hub dashboard aggregating all sub-features
- Sub-navigation tab structure for multi-page modules

---

## Milestone 3 — Mind OS v2: Habit Recovery + Journal Multi-Entry

**Era:** Migrations 05–06, 14

### Introduced
- Habit break tracking: mistake reason, recovery commitment
- Habit streak heal flow
- `habit_break_heals` table for recovery context
- Journal retroactive date entry (multi-entry same day)
- Journal calendar modal with per-day mood aggregation and multi-entry badge
- Journal date modal with read-only timeline cards

---

## Milestone 4 — Planning Engine + Events/Planning v1

**Era:** Migration 07

### Introduced
- **Planning Engine** inside Productivity Hub (`/productivity-hub/planning`)
- `goals` table with CRUD and status tracking
- `weekly_plans` container with weekly focus field
- `weekly_plan_items` for plan item rows
- `weekly_reviews` for reflection capture
- Alignment health summary computed from goals/plan items
- Event emission for planning mutations added to taxonomy

---

## Milestone 5 — Fitness OS v1

**Era:** Migration 08, 13

### Introduced
- **Fitness OS** domain at `/fitness-os`
- `workouts` table with soft deletes and duration tracking
- `exercises` exercise library table
- `exercise_logs` for per-exercise set/rep/weight logs
- 90-day effort heatmap
- Weekly summary cards (active days, total minutes)
- Calendar popup and day details drawer
- Personal Records page
- Fitness OS event taxonomy established (workout CRUD, exercise CRUD, exercise log CRUD)
- Exercise library arrays support added (migration 13_fitness_library_arrays.sql)

---

## Milestone 6 — Brain Engine v1 + System Snapshot

**Era:** Migration 09

### Introduced
- `current_day_snapshot` SQL view — per-user daily facts
- `current_day_snapshot_history_14d` SQL view — 14-day rolling history
- **Brain Engine** in `src/features/system/`:
  - `analyzeMomentum.ts` — momentum score (0–100) and trend from 14-day history
  - `generateDirectives.ts` — urgency-based single actionable directive
  - `systemEngine.ts` — orchestration of momentum + directive + issues
  - `useSystemStatus.ts` — React Query hook
  - `SystemStatusCard.tsx` — Mission Control display component
  - `DailyBriefing.tsx` — momentum-band tone message
- Cross-module reactivity: `['system-status']` cache invalidation after mutations
- Brain Engine directive domains: task, habit, journal, deep-work, fitness

---

## Milestone 7 — Time OS v1

**Era:** Migration 10, 11

### Introduced
- **Time OS** domain at `/time-os`
- `time_logs` table with start/end times, duration, bucket, optional task linkage
- One active timer per user (unique index on `end_time IS NULL`)
- Buckets: `Academics`, `Deep Work`, `Admin`, `Fitness`, `Learning`
- Manual log entry support
- `GlobalTimerBar` component — active timer surface visible across all routes
- `PiPTimer.tsx` + `useDocumentPiP.ts` for Picture-in-Picture window support
- `TimeInsights` component: today total, bucket distribution, 7-day trend
- Task linkage: starting timer moves task to Doing; stopping marks task Done
- `deep_work_minutes_today` added to `current_day_snapshot` (migration 11_brain_time_integration.sql)
- Time OS events added to taxonomy (`time.time_log.started`, `time.time_log.deleted`, etc.)

---

## Milestone 8 — Finance OS v1

**Era:** Migration 12, 15

### Introduced
- **Finance OS** domain at `/finance-os`
- `finance_transactions` table (later migrated to `transactions`)
- Quick-log modal flow (mobile-first FAB trigger)
- Need/want distinction (`is_need` boolean)
- Monthly metrics: total spent, money left, daily safe limit, projected monthly spend, waste amount, top waste category
- Weekly burn card with 7-day micro-bars and baseline overrun feedback
- Decision feedback loop toasts: want spike warning, over-budget projection alert
- Finance events taxonomy: `finance.transaction.created`, `finance.transaction.deleted`
- `WANT_EXPENSE_ADDED` transient bus signal for Brain Engine reactivity

---

## Milestone 9 — System Event Queue + Evening Sync + System Metrics

**Era:** Migrations 16–17

### Introduced
- `system_metrics` table — daily Evening Sync momentum snapshots
- `system_event_queue` table — transient operational signals (DEEP_WORK_COMPLETED, WORKOUT_COMPLETED, HABIT_FAILED, WANT_EXPENSE_ADDED)
- **Event Bus** (`useEventBus.ts` Zustand store) — in-memory ring buffer (max 50 events)
- **Evening Sync** (`useEveningSync.ts`) — user-triggered daily sync:
  - Reads `system_event_queue` for the current IST day
  - Computes momentum delta from signal counts
  - Writes `system_metrics` row
  - Deletes processed queue entries
  - Clears Zustand event bus
- Dual event channel architecture established: durable `events` vs. transient `system_event_queue`

---

## Milestone 10 — Personal Skills in Progress Hub

**Era:** Later progress hub development

### Introduced
- `personal_skills` table (distinct from `programming_skills`)
- Personal skill level tracking
- Personal skill project count
- Personal skill progress increments
- Progress Hub event taxonomy expanded with personal skill events

---

## Milestone 11 — Data Integrity Indexes

**Era:** Migration 202606200001

### Introduced
- Performance and integrity indexes on core analytics tables
- Index foundations for Data Lab view performance

---

## Milestone 12 — Data Lab v1: SQL Analytics Views + UI

**Era:** Migration 202606200002

### Introduced
- **Data Lab** domain at `/data-lab`
- Three SQL aggregation views:
  - `data_lab_daily_activity_90d` — 90-day per-day activity matrix
  - `data_lab_weekly_system_score_12w` — 12-week weekly scores
  - `data_lab_module_consistency_30d` — 30-day per-module consistency
- `data_lab_event_coverage_30d` — 30-day event type coverage view
- Data Lab UI with three tabs: Overview, Behavior, Telemetry
- Metrics engine (11 computation files): consistency, correlation, drift, insights, momentum, rhythm, streaks, systemHealth, telemetryHealth, weeklyScore
- Chart components: ContributionCalendar, BehaviorTimeline, HabitStreakRivers, CorrelationMatrix, MomentumDistribution, ActivityHistogram, EventFrequencyHistogram, EventWaterfall
- Card components: WeeklyScoreSummary, ModuleConsistencyCard, BehaviorDriftCard, BehaviorInsightsPanel, CorrelationExplorerCard
- Telemetry components: TelemetryHealthCard, SystemHealthPanel, RecentEventStream
- Analytics period selector: `7d | 30d | 90d | all`
- Data maturity system: `insufficient | experimental | stable`
- `useDataLabStore` Zustand slice for UI state (active tab, period)

---

## Milestone 13 — Database Cleanup + Schema Hardening

**Era:** Migration 202606230001

### Introduced
- **Finance table migration**: all rows from `finance_transactions` → `transactions`, legacy table dropped
- `transactions` table gets `type` column (`'expense'` default)
- **Task schema overhaul**:
  - `is_completed boolean NOT NULL DEFAULT false` added
  - `deadline_type text` with constraint: `same_day | no_deadline | specific_date`
  - `deadline_date date` with constraint (required if `deadline_type = 'specific_date'`)
  - `is_completed` backfilled from `status = 'Done'`
- `current_day_snapshot` view recreated to use `is_completed = false` for pending task count
- Data Lab views dropped and recreated as part of migration
- `['system-status']` now correctly reflects `is_completed`-based pending task counts

---

## Milestone 14 — Mission Control Redesign + Brain Engine Hero

**Era:** Mission Control v2

### Introduced
- `useMissionControlSnapshot.ts` aggregator hook — single hook consuming all domain data
- `evaluateSystemThreats` and `evaluateSystemStatuses` logic in `systemHealthEvaluator.ts`
- `MissionControlSnapshot`, `MetricCard`, `SystemEvent`, `BrainState` type contracts
- `BrainEngineHero.tsx` — full Brain Engine hero panel with momentum, directive, threats
- Mission Control metric cards: Average Mood, Pending Tasks, Fitness This Week, Habit Streak
- Recent system events surface (from Zustand event bus)
- Snapshot types (`snapshot.ts`) introduced for Mission Control domain

---

## Milestone 15 — Data Lab Refactor + Metrics Engine Separation

**Era:** Post Data Lab v1

### Refactored
- Data Lab internal architecture separated into distinct layers:
  - `api/` — React Query hooks only
  - `metrics/` — pure computation functions (11 files)
  - `transforms/` — chart-ready data transforms (behavior, overview, telemetry)
  - `utils/` — math/formatting helpers (format, period, stats)
  - `hooks/` — composition hooks (`useDataLabMetrics`, `useDataMaturity`)
- `useDataLab.ts` (single file) replaced by this layered architecture
- `useDataLabMetrics.ts` composes API data through metrics computations
- Types moved to `types/types.ts` with clean separation of metric models and chart-ready types
