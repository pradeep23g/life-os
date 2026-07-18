# LIFE OS — MODULE GUIDE

This document provides a deep reference for each Life OS feature module. It describes the internal structure, key files, data contracts, and behavioral rules for each domain.

Use this document when adding features to an existing module or debugging module-specific behavior.

---

## 1. Mission Control

**Route:** `/mission-control` (also `/`)  
**Type:** Aggregator — read-only  
**Location:** `src/features/mission-control/`

### Responsibility
Mission Control is the global system view. It aggregates summaries from every domain and the Brain Engine. It contains no data entry UI.

### Internal Structure

```
mission-control/
  api/
    useMissionControlSnapshot.ts  — Master aggregator hook
  components/
    EndOfDayCard.tsx              — Evening Sync trigger UI
  dashboard/
    MissionControl.tsx            — Primary page component
  types/
    snapshot.ts                   — MissionControlSnapshot, MetricCard, SystemEvent, BrainState
  utils/
    systemHealthEvaluator.ts      — evaluateSystemThreats, evaluateSystemStatuses
```

### Data Flow

`useMissionControlSnapshot.ts` composes data from:
- `useHabitWorkspace` (Mind OS)
- `useTasks` (Productivity Hub)
- `useJournal` (Mind OS)
- `useChallenges`, `useMilestones` (Progress Hub)
- `useEventsAnalytics` (lib)
- `useFitnessWeeklySummary` (Fitness OS)
- `useTimeAnalytics` (Time OS)
- `useTransactions` (Finance OS)
- `useSystemStatus` (System/Brain Engine)
- `useEventBus` (Zustand)

It returns a single `MissionControlSnapshot` type consumed by `MissionControl.tsx`.

### System Health Evaluation

`evaluateSystemThreats()` and `evaluateSystemStatuses()` in `systemHealthEvaluator.ts` are pure functions that take computed domain metrics and return threat indicators and system-level status assessments.

### Rules
- Never add data entry UI to Mission Control.
- Never import raw domain-specific table data here (only computed summaries from hooks).
- Brain Engine state is consumed via `useSystemStatus`.

---

## 2. Mind OS

**Route:** `/mind-os`, `/mind-os/habits`, `/mind-os/journal`  
**Type:** Reflection workspace  
**Location:** `src/features/mind-os/`

### Responsibility
Habits and journal. Cognitive protection: no execution items visible here.

### Internal Structure

```
mind-os/
  api/
    useHabits.ts    — habit CRUD, habit log CRUD, streak logic, heal flow
    useJournal.ts   — journal entry CRUD
  dashboard/
    MindOsDashboard.tsx
  habits/
    HabitsPage.tsx
  journal/
    JournalPage.tsx
  utils/            — streak computation helpers
```

### Habit Data Contract

`useHabitWorkspace()` returns:
```ts
{
  habits: HabitWithLog[]       // habits with today's log state
  longestHabitStreak: { title, streak } | null
}
```

`HabitWithLog` includes `completedToday: boolean` and `currentValue: number` computed from `habit_logs` for the current IST date.

### Journal Data Contract

`useJournal()` returns journal entries ordered by `created_at DESC`. Mood is an integer 1–5. Multi-entry same day is supported.

### Event Emission
- `MIND_HABIT_CREATED`, `MIND_HABIT_COMPLETED`, `MIND_HABIT_UNCOMPLETED`, `MIND_HABIT_COUNT_ADJUSTED`, `MIND_HABIT_DELETED`
- `MIND_HABIT_BREAK_HEALED`
- `MIND_JOURNAL_ENTRY_CREATED`, `MIND_JOURNAL_ENTRY_DELETED`

Brain invalidation: `['system-status']` after all habit and journal mutations.

---

## 3. Productivity Hub

**Route:** `/productivity-hub`, `/productivity-hub/tasks`, `/productivity-hub/planning`  
**Type:** Execution workspace  
**Location:** `src/features/productivity-hub/`

### Responsibility
Tasks and planning. No reflection content here.

### Internal Structure

```
productivity-hub/
  api/
    useTasks.ts     — task CRUD, status transitions
    usePlanning.ts  — goals, weekly plans, plan items, reviews
  dashboard/
    ProductivityHubDashboard.tsx
  tasks/
    TasksPage.tsx
  planning/
    PlanningPage.tsx
```

### Task Data Contract

`useTasks()` returns all non-deleted tasks (`deleted_at IS NULL`). Each task has `is_completed` boolean for reliable filtering. Status field: `To Do`, `Doing`, `Done`.

Task-linked timer: when a task has `status = 'Doing'` and a Time OS session is stopped, `is_completed` becomes `true` and `status` becomes `Done`.

### Planning Data Contract

`usePlanning()` returns goals, the current week's plan, plan items, and the current week's review in a single composed result.

### Event Emission
- `PRODUCTIVITY_TASK_CREATED`, `PRODUCTIVITY_TASK_STATUS_CHANGED`
- `PRODUCTIVITY_WEEKLY_PLAN_CREATED`, `PRODUCTIVITY_WEEKLY_PLAN_UPDATED`
- `PRODUCTIVITY_GOAL_CREATED`, `PRODUCTIVITY_GOAL_STATUS_CHANGED`
- `PRODUCTIVITY_WEEKLY_PLAN_ITEM_CREATED`, `PRODUCTIVITY_WEEKLY_PLAN_ITEM_UPDATED`
- `PRODUCTIVITY_WEEKLY_REVIEW_UPSERTED`

Brain invalidation: `['system-status']` after task mutations.

---

## 4. Progress Hub

**Route:** `/progress-hub`, `/progress-hub/programming`, `/progress-hub/personal-skills`, `/progress-hub/milestones`, `/progress-hub/challenges`  
**Type:** Growth workspace  
**Location:** `src/features/progress-hub/`

### Internal Structure

```
progress-hub/
  api/
    useProgress.ts   — programming skills, personal skills, milestones, challenges
  dashboard/
    ProgressHubDashboard.tsx
  milestones/
    MilestonesPage.tsx
  challenges/
    ChallengesPage.tsx
  programming/
    ProgrammingProgressPage.tsx
  personal-skills/
    PersonalSkillsPage.tsx
```

### Event Emission
- Programming skill events (created, level changed, project count incremented)
- Personal skill events (created, level changed, project count incremented, progress incremented)
- Milestone events (created, completed, reopened)
- Challenge events (created, status changed)

---

## 5. Fitness OS

**Route:** `/fitness-os`, `/fitness-os/workouts`, `/fitness-os/library`, `/fitness-os/pr`  
**Type:** Physical tracking  
**Location:** `src/features/fitness-os/`

### Internal Structure

```
fitness-os/
  api/
    useFitness.ts      — workouts, exercises, exercise_logs, weekly summary
  pages/
    Dashboard.tsx
    Library.tsx
  workouts/
    WorkoutsPage.tsx
  library/
    PersonalRecordsPage.tsx
  utils/               — fitness computation helpers
```

### Data Contracts

`useFitnessWeeklySummary()` returns:
```ts
{
  activeWorkoutDaysThisWeek: number
  totalSessionMinutesThisWeek: number
}
```

This is consumed by `useMissionControlSnapshot` for the Brain Engine.

Soft deletes: `workouts.deleted_at`, `exercises.deleted_at`, `exercise_logs.deleted_at`.

Workout completion: `end_time IS NOT NULL` marks a workout as complete.

### Event Emission
- All workout CRUD events
- All exercise CRUD events
- All exercise log CRUD events
- `WORKOUT_COMPLETED` transient bus signal when workout ends

---

## 6. Time OS

**Route:** `/time-os`  
**Type:** Focused time tracking  
**Location:** `src/features/time-os/`

### Internal Structure

```
time-os/
  api/
    useTimeLogs.ts       — timer CRUD, active timer detection, task linkage
    useTimeAnalytics.ts  — today total, distribution, 7-day trend
  components/
    GlobalTimerBar.tsx   — global visible timer surface
    PiPTimer.tsx         — Document PiP timer window
    TimeInsights.tsx     — Analytics display component
  pages/
    TimeOSPage.tsx
  dashboard/             — Time OS dashboard components
```

### Active Timer Invariant

Only one active timer per user at any time. The database enforces this via a unique index on `(user_id)` where `end_time IS NULL`. The application checks for an existing active timer before starting a new one.

### Task Linkage

When starting a timer with a task linked:
1. Task status → `Doing`
2. `PRODUCTIVITY_TASK_STATUS_CHANGED` event emitted
3. `['productivity-hub', 'tasks']` and `['system-status']` invalidated

When stopping a linked timer:
1. Task `is_completed` → `true`, `status` → `Done`
2. `PRODUCTIVITY_TASK_STATUS_CHANGED` event emitted
3. Caches invalidated

### Analytics

`useTimeAnalytics()` returns:
```ts
{
  todayDistribution: { bucket: string, minutes: number }[]
  todayTotal: number
  weeklyTrend: { date: string, minutes: number }[]
}
```

`deep_work_minutes_today` is derived by the `current_day_snapshot` view from `time_logs WHERE bucket IN ('Deep Work', 'Learning')`.

### Event Emission
- `TIME_TIME_LOG_STARTED`, `TIME_TIME_LOG_DELETED`
- `TIME_SESSION_LOGGED`, `TIME_SESSION_DELETED`, `TIME_SESSION_STARTED`
- `DEEP_WORK_COMPLETED` transient bus signal when deep work session stops

---

## 7. Finance OS

**Route:** `/finance-os`  
**Type:** Behavioral spending awareness  
**Location:** `src/features/finance-os/`

### Internal Structure

```
finance-os/
  api/
    useFinance.ts       — transaction CRUD, derived finance summary
  components/
    TransactionForm.tsx — Quick-log modal (FAB trigger)
    (other display components)
  pages/
    FinanceDashboard.tsx
  config.ts             — Finance configuration constants
```

### Finance Summary Contract

`useTransactions()` returns:
```ts
{
  transactions: Transaction[]
  summary: {
    totalSpent: number
    totalAvailable: number
    dailySafeLimit: number
    projectedMonthlySpend: number
    wasteAmount: number
    topWasteCategory: string | null
    daysRemainingInMonth: number
  }
}
```

All derived values are computed in TypeScript from raw `transactions` rows. No server-side aggregation.

### Decision Feedback

After each transaction log:
1. If `is_need = false` and amount > daily safe limit: warning toast + `WANT_EXPENSE_ADDED` bus signal
2. If projected monthly > total available: alert toast
3. Otherwise: success toast

### Event Emission
- `FINANCE_TRANSACTION_CREATED`, `FINANCE_TRANSACTION_DELETED`
- `WANT_EXPENSE_ADDED` transient bus signal for want transactions

---

## 8. Data Lab

**Route:** `/data-lab`  
**Type:** Read-only analytics engine  
**Location:** `src/features/data-lab/`

### Internal Structure

```
data-lab/
  api/
    useDataLab.ts            — 5 React Query hooks for SQL views
  types/
    types.ts                 — All Data Lab TypeScript types
  metrics/                   — 11 pure computation files
    consistency.ts, correlation.ts, drift.ts, index.ts,
    insights.ts, momentum.ts, rhythm.ts, streaks.ts,
    systemHealth.ts, telemetryHealth.ts, weeklyScore.ts
  transforms/
    behavior.ts              — Behavior tab chart transforms
    overview.ts              — Overview tab transforms
    telemetry.ts             — Telemetry tab transforms
  utils/
    format.ts                — Display formatting helpers
    period.ts                — Period filtering logic
    stats.ts                 — Statistical utilities (correlation, etc.)
  hooks/
    useDataLabMetrics.ts     — Composes API data → metrics → transforms
    useDataMaturity.ts       — Data maturity level assessment
  store/
    useDataLabStore.ts       — Zustand: active tab, selected period
  pages/
    DataLabPage.tsx          — Shell with tabs
    OverviewTab.tsx          — Overview tab content
    BehaviorTab.tsx          — Behavior tab content
    TelemetryTab.tsx         — Telemetry tab content
  components/
    cards/                   — Summary card components
    charts/                  — Visualization components
    telemetry/               — Telemetry-specific components
    shared/                  — Shared UI (DataLabSection, PeriodSelector, Tooltip, etc.)
```

### Rules
- Data Lab never calls mutations. It is 100% read-only.
- Data Lab imports from `api/useDataLab.ts` only. It does not import domain hooks directly.
- All metric computation is pure functions in `metrics/`. No side effects.
- Chart components receive pre-processed data from transforms; they do not compute metrics.

### Data Maturity

```ts
type DataMaturityLevel = 'insufficient' | 'experimental' | 'stable'
```

Computed in `useDataMaturity.ts` based on minimum data thresholds. Advanced analytics (correlation matrix, cross-domain insights) are guarded behind the maturity check.

---

## 9. System (Brain Engine)

**Route:** None (internal only)  
**Location:** `src/features/system/`

### Internal Structure

```
system/
  api/
    useSystemStatus.ts      — React Query hook for Brain Engine status
    useEveningSync.ts       — Evening Sync mutation
  engine/
    types.ts                — All Brain Engine types
    analyzeMomentum.ts      — Momentum score + trend from 14-day history
    generateDirectives.ts   — Urgency scoring + directive generation
    systemEngine.ts         — Orchestration: getSystemStatus()
  components/
    BrainEngineHero.tsx     — Full hero panel for Mission Control
    SystemStatusCard.tsx    — Compact status + CTA card
    DailyBriefing.tsx       — Momentum-band tone message
    SystemFeedbackToast.tsx — Global toast notification
  feedback.ts               — Toast feedback utilities
```

### Brain Engine Flow

```
useSystemStatus()
  → fetchSystemStatusFacts()
       → current_day_snapshot (maybeSingle)
       → current_day_snapshot_history_14d (ordered)
  → getSystemStatus(snapshot, history, recentEvents)
       → analyzeMomentum(history, deepWorkMinutes, recentEvents)
       → generateDirectives(snapshot)
       → detectIssues(snapshot)
       → buildMomentumExplanation(snapshot)
  → returns SystemStatus
```

### Key Types

```ts
type SystemStatus = {
  momentum: MomentumAnalysis          // score 0-100, trend direction
  directive: { action, label, reason, route }
  issues: SystemIssue[]               // detected issues with severity
  momentumExplanation: string[]       // human-readable reasons
  snapshotDate: string | null
  topDirectiveDomain: DirectiveDomain
  urgency: UrgencyScores
}
```

### Evening Sync

`useEveningSync()` is a React Query `useMutation`. The user triggers it manually from the End of Day card in Mission Control.

Flow:
1. Fetch today's `system_event_queue` entries
2. Count DEEP_WORK_COMPLETED, WORKOUT_COMPLETED, HABIT_FAILED, WANT_EXPENSE_ADDED
3. Compute `momentumDelta = (deepWork × 3) + (workout × 2) − (habitFail × 2) − wantExpense`
4. Clamp to 0–100 and write to `system_metrics`
5. Delete processed queue entries
6. Clear Zustand event bus

---

## 10. Auth

**Route:** `/auth`  
**Location:** `src/features/auth/`

Simple Supabase email/password auth page. `AuthContext` in `src/lib/AuthContext.tsx` provides `user` and `loading` to the entire app via React Context.

`ProtectedRoute` in `App.tsx` checks `user` from `useAuth()`. Unauthenticated users are redirected to `/auth`.
