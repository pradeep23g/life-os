# LIFE OS — SYSTEM ARCHITECTURE

**Status:** Authoritative System Architecture Reference  
**Last Synchronized:** September 2026 (Post-Integrity Campaign Baseline)  
**Target Repository:** `pradeep23g/life-os`

---

## 1. Project Identity & Purpose

Life OS is a **Personal Intelligence Operating System** — not a generic task manager or simple productivity dashboard.

Its purpose is to build a trustworthy, long-term behavioral ledger across all dimensions of human discipline: mental reflection, task execution, skill acquisition, physical training, focused time, and financial awareness. The system is engineered to accumulate multi-year longitudinal behavioral data, compute deterministic real-time momentum scores, and surface automated, urgency-ranked directives via the Brain Engine.

---

## 2. Technical Stack & Runtime Topology

```text
Browser Client (SPA)
  ├── React 19.2 + TypeScript 5.9 + Vite 7.3
  ├── React Router v7 (Nested routing with route-level lazy loading)
  ├── TailwindCSS v3 (True-black high-contrast design system)
  ├── TanStack React Query v5 (Exclusive server state manager & cache)
  ├── Zustand v5 (Transient operational event bus & UI state)
  ├── Lucide React (Iconography)
  └── Supabase JS v2 Client (@supabase/supabase-js)
        ↓
Backend (Supabase PostgreSQL 15+ Cloud Instance)
  ├── 28 Relational Tables with Row Level Security (auth.uid() = user_id)
  ├── 15 SQL Aggregation Views (security_invoker = true)
  ├── Durable Event Ledger (public.events, partitioned by IST date)
  └── Transient Event Queue (public.system_event_queue)
```

### Core Architectural Invariants
1. **Server State Authority:** All server reads and mutations go through TanStack React Query hooks. Components never issue raw ad-hoc Supabase queries directly.
2. **Database-First Aggregation:** Multi-day joins, longitudinal trends, and cross-domain rollups occur in PostgreSQL SQL views, never via client-side in-memory iteration.
3. **TypeScript-Only Intelligence:** Ranking algorithms, exponential moving average (EMA) momentum calculation, and context-aware directive selection run in TypeScript over view snapshot data.
4. **Strict Domain Isolation:** Features are strictly isolated by directory (`src/features/<domain>/`), unique query keys, and database tables.

---

## 3. Architectural Classifications

To prevent architectural drift and misunderstandings by developers or AI agents, system entities are classified into four explicit categories:

| Status | Definition | Examples in Life OS |
|---|---|---|
| **IMPLEMENTED** | Active, verified executable architecture running in production and verified by end-to-end test suites. | 8 active domain modules, Brain Engine, 28 RLS tables, 15 SQL views, canonical telemetry taxonomy, Document PiP. |
| **PLANNED** | Architecturally specified work targeted for subsequent development phases; not yet present in codebase. | Winter Arc visual theme overhaul, advanced mobile gestures. |
| **DEPRECATED** | Legacy interfaces or patterns slated for removal; backward compatibility preserved temporarily. | Legacy uppercase/snake_case event names recognized in fallback filters during transitions. |
| **HISTORICAL** | Archived data or immutable migration records preserved strictly for auditability and schema integrity. | `public.progress_hub_archive` table, migration files `01` through `202608230001`. |

> [!IMPORTANT]
> **No Phantom Entities:** Dropped tables such as `finance_transactions`, non-existent entities such as `workout_sets`, and deleted columns such as `weekly_plan_items.plan_id` are NOT part of the active system and MUST NOT be referenced in active code or documentation.

---

## 4. Domain Module Map & Responsibilities

`src/features/` contains 8 active domain modules plus global system infrastructure and authentication:

| Module | Route | Directory | Primary Responsibility |
|---|---|---|---|
| **Mission Control** | `/mission-control` (`/`) | `src/features/mission-control/` | Executive command center; displays Brain Engine momentum, real 14-day EMA sparklines, daily directives, 7-domain health, and Evening Sync closure card. |
| **Mind OS** | `/mind-os` | `src/features/mind-os/` | Reflection workspace: daily habits with streak calculation, retroactive break logging, heal tokens (max 5/month), and multi-entry daily mood/reflection journaling. |
| **Productivity Hub** | `/productivity-hub` | `src/features/productivity-hub/` | Execution workspace: deadline-constrained task ledger, weekly planning engine, high-level goals, backlog Kanban board, and weekly reviews. |
| **Learning OS** | `/learning-os` | `src/features/learning-os/` | Skill acquisition engine: structured roadmaps, sequential curriculum stages, atomic study sessions, session logs, milestones, projects, and reflections. |
| **Fitness OS** | `/fitness-os` | `src/features/fitness-os/` | Physical discipline workspace: live workout execution (single active session invariant), exercise library, set/rep/weight logging, and personal records (PRs). |
| **Time OS** | `/time-os` | `src/features/time-os/` | Focused time intelligence: active timer (single-timer database constraint), Document Picture-in-Picture (PiP) companion, manual time logs, and bucket analytics. |
| **Finance OS** | `/finance-os` | `src/features/finance-os/` | Behavioral spending ledger: income and expense tracking with strict Need vs Want classification to measure discretionary financial discipline. |
| **Data Lab** | `/data-lab` | `src/features/data-lab/` | Behavioral intelligence workbench: 90-day activity rollups, 30-day module consistency, 12-week system score, habit streak rivers, correlation, and telemetry health. |
| **System** | Global Overlay | `src/features/system/` | Core intelligence: Brain Engine momentum analysis, domain signal rules, directive generation, transient event bus, and daily Evening Sync ritual. |
| **Auth** | `/auth` | `src/features/auth/` | Supabase email/password authentication, session persistence, and protected route interception. |

---

## 5. Cognitive Boundary Invariant

**Reflection (Mind OS) and Execution (Productivity Hub) are strictly decoupled.**

Presenting execution pressure (e.g. overdue tasks, urgent deadlines, backlog counts) within a reflective context (e.g. evening journaling or habit streak review) triggers cognitive anxiety (the Zeigarnik Effect) and degrades contemplation quality.

- **Mind OS** components never import task queries, render task lists, or display pending task indicators.
- **Productivity Hub** components never display mood scores or journal entries.
- **Mission Control** is the sole unified executive surface where cross-domain summaries converge.

---

## 6. Routing Architecture

Routes are defined in [src/App.tsx](file:///C:/Users/gpk74/life-os/src/App.tsx) with route-level code splitting via `React.lazy()` and `Suspense`:

```text
/auth                         → AuthPage (public authentication)
/ (ProtectedRoute)
  / (AppShell)
    /                         → MissionControl (dashboard index)
    /mission-control          → MissionControl
    /mind-os                  → MindOsLayout
      /                       → MindOsDashboard (index)
      /habits                 → HabitsPage
      /journal                → JournalPage
    /productivity-hub         → ProductivityHubLayout
      /                       → ProductivityHubDashboard (index)
      /tasks                  → TasksPage
      /planning               → PlanningPage
    /learning-os              → LearningOSLayout
      /                       → RoadmapDashboard (index)
      /explore                → ExplorePage
      /analytics              → AnalyticsPage
      /roadmap/:id            → RoadmapDetailView
    /fitness-os               → FitnessOsLayout
      /                       → FitnessOsDashboard (index)
      /workouts               → WorkoutsPage
      /library                → FitnessLibraryPage
      /pr                     → PersonalRecordsPage
    /time-os                  → TimeOSPage
    /finance-os               → FinanceDashboard
    /data-lab                 → DataLabPage
    /*                        → Wildcard redirection to /
```

---

## 7. Brain Engine & System Intelligence Flow

The Brain Engine (`src/features/system/engine/`) is the central intelligence pipeline of Life OS. It synthesizes real-time metrics across all 7 behavioral domains to produce deterministic momentum scores, urgency-ranked directives, and system confidence:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRES LAYER                         │
│                                                                        │
│  current_day_snapshot                   current_day_snapshot_history_14d│
│  (14-column real-time rollup)           (14 consecutive daily records) │
│           │                                           │                │
└───────────┼───────────────────────────────────────────┼────────────────┘
            │                                           │
            ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   REACT QUERY DATA ACCESS LAYER                        │
│                                                                        │
│  useSystemStatus() ──→ Queries 14 columns from current_day_snapshot    │
│                        (including budget_utilization & want_expenses)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BRAIN ENGINE PIPELINE                           │
│                                                                        │
│  1. Domain Signal Evaluation (domainSignals.ts)                        │
│     ├── Mind OS: Inactive habit checks, missing journal entries        │
│     ├── Execution: Pending task counts and backlog pressure            │
│     ├── Fitness OS: Weekly workout consistency & mid-week coach alerts │
│     ├── Time OS: Deep work duration today (< 60 min alerts)           │
│     ├── Learning OS: Stalled learning roadmaps (> 7 days inactivity)  │
│     └── Finance OS: Budget utilization (> 75%, > 90%) & want spikes    │
│                                                                        │
│  2. Momentum Scoring (analyzeMomentum.ts)                              │
│     ├── Evaluates daily weighted activity over 14-day history          │
│     │   (Tasks 35%, Habits 35%, Journal 15%, Fitness 15%)             │
│     ├── Computes Exponential Moving Average (EMA, alpha = 0.6)         │
│     ├── Computes symmetric trend delta (latest EMA vs previous EMA)    │
│     │   (delta > 2: 'rising', delta < -2: 'falling', else 'stable')   │
│     ├── Intra-day Deep Work Boost: +4 points if deep work > 120 min    │
│     └── Low Momentum Gain: Accelerates momentum if score < 20          │
│                                                                        │
│  3. Directive Generation (generateDirectives.ts)                       │
│     ├── Calculates urgency scores per domain                           │
│     ├── Selects top domain (task, habit, journal, deep-work, etc.)    │
│     └── Generates context-aware action label, rationale, and route     │
│                                                                        │
│  4. Deterministic System Confidence (systemHealthEvaluator.ts)         │
│     ├── 35% Data Freshness (snapshot date matching IST today)          │
│     ├── 35% Data Completeness (depth of 14-day rolling history)        │
│     └── 30% Signal Coverage (observable presence across all 7 domains)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MISSION CONTROL CONSUMPTION                     │
│                                                                        │
│  useMissionControlSnapshot()                                           │
│    ├── Displays real EMA sparkline (bars with tooltips; flat 0 on empty)│
│    ├── Renders calculated confidence indicator (no hardcoded 87)       │
│    ├── Displays authoritative snapshot date                            │
│    ├── Queries DB-authoritative pending events count                   │
│    └── Renders 7-domain Live System Status cards                       │
└────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **No Simulated Intelligence:** Mission Control sparklines display the actual `emaSeries` calculated from PostgreSQL historical views. If history is empty, an honest flat baseline at 0 is displayed. No synthetic offsets (`momentum ± 2`, `momentum ± 5`) are generated.

---

## 8. Telemetry & Dual Pipeline Architecture

Life OS maintains two distinct event channels to separate permanent analytical storage from immediate operational feedback:

```text
USER ACTION (in DOM)
    ↓
Feature Mutation Hook (TanStack React Query)
    │
    ├── (Durable Analytics)  ──→ logEventSafe() ──→ public.events ──→ SQL Views ──→ Data Lab
    │                                                                           └── Brain Engine
    └── (Transient Signals)  ──→ emitEvent()    ──→ public.system_event_queue ──→ Evening Sync
```

### 8.1 Durable Analytics Channel (`public.events`)
- **Nature:** Permanent, append-only, immutable audit ledger.
- **Contract:** Uses strict canonical dot-notation strings defined in `src/lib/eventTaxonomy.ts` (`<domain>.<entity>.<action>`).
- **Date Bucketing:** Every event records `event_date_ist` (`YYYY-MM-DD` in Indian Standard Time, `Asia/Kolkata`).
- **Consumers:** 90-day activity views, 30-day coverage views, 12-week system score, Data Lab behavior tabs.

### 8.2 Transient Operational Channel (`public.system_event_queue`)
- **Nature:** Short-term operational queue for intra-day signals and Evening Sync delta aggregation.
- **EventBus Store (`src/store/useEventBus.ts`):**
  - **Peek-and-Splice Invariant:** Batches are retained in memory until PostgreSQL insertion succeeds without error.
  - **Exponential Backoff:** Retries failed flushes (1s, 2s, 4s, up to 30s).
  - **Dead-Letter Quarantine:** Events failing 5 consecutive retries are quarantined to prevent head-of-line blocking.
  - **Auth Drop Resilience:** Pauses flush and preserves queue when auth is temporarily unavailable.
  - **Bounded Memory:** In-memory queue capped at 200 items (`MAX_QUEUE_CAPACITY`); recent events capped at 50 with 24-hour TTL pruning.
  - **Consumers:** Flushed and aggregated into daily momentum delta during the Evening Sync ritual.

---

## 9. System Event Queue & Evening Sync Protocol

The Evening Sync ritual (`src/features/system/api/useEveningSync.ts`) finalizes the day's behavioral balance:

1. **Unbounded Historical Processing:** Queries `public.system_event_queue` ordered by `created_at ASC` in bounded batches of 50. Does NOT restrict queries to the current calendar day, ensuring events from previous days are never stranded.
2. **Momentum Delta Aggregation:**
   $$\Delta = (3 \times \text{Deep Work}) + (2 \times \text{Workouts}) - (2 \times \text{Habit Fails}) - (1 \times \text{Want Expenses})$$
   Recognizes both canonical event types (`fitness.workout.completed`, `time.session.logged`, `finance.transaction.created`) and legacy operational signals (`WORKOUT_COMPLETED`, `DEEP_WORK_COMPLETED`, `WANT_EXPENSE_ADDED`).
3. **Persistence Before Deletion:** Upserts the day's record into `public.system_metrics` (`onConflict: 'user_id,sync_date'`). Events are deleted from `public.system_event_queue` **only after** `system_metrics` upsert succeeds.
4. **Canonical Completion Event:** Emits `system.evening_sync.completed` via `logEventSafe()`.
5. **Cache Invalidation:** Invalidates `systemStatusQueryKey` and `['system-event-queue-count']` to immediately refresh UI counters.

---

## 10. Data Lab Behavioral Analytics Workbench

Data Lab (`src/features/data-lab/`) is a read-only analytical workbench powered directly by PostgreSQL views:

- **Overview Tab:** 12-week system score, GitHub-style 90-day contribution calendar, multi-domain activity histogram.
- **Behavior Tab:** 30-day module consistency percentages, habit streak rivers, behavioral drift metrics, and cross-domain correlation matrices.
- **Telemetry Tab:** Real-time event stream from `events`, 30-day event type coverage breakdown, and silent event detection.
- **Complete 7-Domain Coverage:** Integrates Mind/Habits, Mind/Journal, Productivity/Tasks, Fitness OS, Time OS, Finance OS, and Learning OS.
- **Normalized Key Matching:** Lookup functions use whitespace-agnostic key normalization (`normalizeKey()`) to ensure seamless matching between database view identifiers (`'Mind / Habits'`) and UI components.

---

## 11. Learning OS Domain Architecture

Learning OS (`src/features/learning-os/`) provides structured skill curriculum management:

- **Hierarchy:** `learning_roadmaps` $\rightarrow$ `learning_stages` $\rightarrow$ `learning_sessions` $\rightarrow$ `learning_session_logs`.
- **Advanced Entities:** `learning_milestones`, `learning_projects`, `learning_reflections`.
- **Query Separation:**
  - `useRecentSessionLogs()`: Restricts feed to `.limit(20)` for dashboard performance.
  - `useSessionAnalytics()`: Queries full history without arbitrary limits to compute accurate lifetime study hours, total minutes, and velocity.
- **Time OS Integration:** Study sessions link to focus timers via `time_log_id`.

---

## 12. Database Interaction Model & Security

1. **Row Level Security (RLS):** Active on all 28 tables. Every query executes with `auth.uid() = user_id`.
2. **Security Invoker Views:** All 15 SQL views specify `WITH (security_invoker = true)` to execute under the caller's RLS security context.
3. **Single Active Timer Constraint:** Enforced by PostgreSQL partial unique index:
   ```sql
   CREATE UNIQUE INDEX idx_time_logs_single_active 
   ON public.time_logs(user_id) 
   WHERE end_time IS NULL;
   ```
4. **Authoritative Types:** `src/types/database.types.ts` is regenerated strictly via Supabase CLI against the live remote database. Manual editing is prohibited.

---

## 13. Shared Infrastructure & App Shell

- **Desktop Sidebar:** Collapsible navigation rail (80px compact / 288px expanded) with accessible `aria-label` attributes, persisted in `sessionStorage`.
- **Mobile Drawer:** Slide-out drawer with backdrop blur, hamburger trigger, and escape-key handling.
- **Global Overlays:**
  - `GlobalTimerBar`: Sticky floating timer bar for running focus sessions.
  - `Document PiP`: Picture-in-Picture window for distraction-free focus tracking.
  - `SystemFeedbackToast`: Transient micro-interaction feedback.
  - `CommandPalette`: Keyboard-accessible quick navigation (`Ctrl+K` / `Cmd+K`).

