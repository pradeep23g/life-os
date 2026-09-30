---
status: "historical"
frozen_commit: "ad488a2"
domain: "historical"
---

# LIFE OS — PHASE 1 HISTORICAL BASELINE (Frozen at commit ad488a2, Sept 5 2026)

> [!WARNING]
> **HISTORICAL ARCHIVE NOTICE (FROZEN BASELINE):**  
> This document is a **historical snapshot** representing the state of Life OS at commit `ad488a2` (September 5, 2026, conclusion of the Phase 1 Integrity Campaign).  
> The active codebase has evolved into **Winter Arc 2.0** (Commit `77d1a5b`+) with 33 base tables, 14 client routes, Astrolabe Orb Navigation, Chronos Time OS, and Fitness Kinetic Ledger.  
> **For current active architecture and rapid agent onboarding, consult [`docs/AGENT_QUICKSTART.md`](../AGENT_QUICKSTART.md) and [`docs/architecture/SYSTEM_ARCHITECTURE.md`](../architecture/SYSTEM_ARCHITECTURE.md).**

- **Audit & Handoff Date:** September 5, 2026 (Historical Freeze)  
- **Repository Commit / HEAD:** `ad488a2aad4bca54fd13629b02d60cf3a0edf2d3`  
- **Integrity Campaign Status:** Complete (All Waves 0–5 Concluded & Pushed to GitHub)  
- **Current Project Status:** Historical Baseline. Active system is Winter Arc 2.0.

---

## 1. Operating Rules & Document Intent

This document is the **authoritative, forensic technical briefing** of the Life OS codebase, written specifically for ingestion by future AI assistants (such as ChatGPT) and senior engineers. It provides the exact, unvarnished reality of the repository at commit `ad488a2`.

### Guiding Directives for Reading this Document
1. **Repository Truth Over Handoff Claims:** This document reflects the verified codebase, PostgreSQL schema, generated types, and runtime test results.
2. **Classification Standard:** Every architectural entity and feature in this document is explicitly classified into one of five states:
   - **`[VERIFIED CURRENT STATE]`**: Implemented in code, backed by database schema/views, and proven by automated tests.
   - **`[IMPLEMENTED BUT NOT RUNTIME-VERIFIED]`**: Implemented in components/hooks, but lacks dedicated automated browser E2E coverage.
   - **`[KNOWN LIMITATION]`**: A conscious architectural boundary or missing sub-feature in current code.
   - **`[FUTURE / NOT IMPLEMENTED]`**: Planned for subsequent phases (e.g., Phase 2 Winter Arc).
   - **`[HISTORICAL / RETIRED]`**: Legacy structures intentionally preserved for data continuity or deleted in earlier waves.

---

## 2. Executive Current State

### "What is Life OS Right Now?"

Life OS is a **personal behavioral intelligence operating system** built as a single-page web application (SPA) backed by a hosted PostgreSQL database. It is engineered to accumulate years of longitudinal life data, detect cross-domain behavioral momentum, and surface real-time actionable directives.

```
┌────────────────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT (SPA)                           │
│  React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 3.4 + React Router 7 │
│                                                                        │
│  State Management:                                                     │
│   • TanStack React Query v5 (Server state, caching, invalidation)      │
│   • Zustand v5 (Transient client event queue & in-memory bus)          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │ Mutations & Queries            │ Telemetry Emitters
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPABASE POSTGRESQL 15+                         │
│                                                                        │
│  Base Tables (27):                                                     │
│   • 26 Active Domain Tables (Habits, Tasks, Time, Workouts, etc.)      │
│   • 1 Historical Archive Table (progress_hub_archive)                  │
│   • Row Level Security (RLS) enabled on all tables                     │
│                                                                        │
│  Aggregation Views (15, security_invoker = true):                      │
│   • current_day_snapshot (14 cols) & history_14d (7 cols)              │
│   • data_lab_daily_activity_90d (20 cols) & weekly_score_12w (25 cols) │
│   • data_lab_module_consistency_30d & data_lab_event_coverage_30d     │
│   • 7 domain signal views & 2 learning progress views                  │
└───────────────────┬────────────────────────────────────────────────────┘
                    │ View Projections
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE BRAIN ENGINE                           │
│  Deterministic TypeScript Intelligence (systemEngine.ts):             │
│   • analyzeMomentum.ts: 7-day EMA (α = 0.6), cold-start flat baseline  │
│   • domainSignals.ts: 7-domain anomaly detection                       │
│   • generateDirectives.ts: Heuristic urgency ranking & single CTA      │
│   • systemHealthEvaluator.ts: Confidence = 35% Fresh + 35% Comp + 30% Cov│
└───────────────────┬────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  EXECUTIVE PRESENTATION & OVERLAYS                     │
│   • Mission Control (/mission-control) executive dashboard             │
│   • Document Picture-in-Picture (PiP) focus timer companion           │
│   • Evening Sync ritual (50-event batch queue drain -> system_metrics) │
└────────────────────────────────────────────────────────────────────────┘
```

### What Life OS Is NOT
- **NOT a generic CRUD todo list:** It enforces hard boundaries between reflection (Mind OS) and execution pressure (Productivity Hub).
- **NOT an external AI/LLM wrapper:** The Brain Engine runs 100% deterministically in TypeScript and PostgreSQL views with zero external API calls, zero latency, and zero token costs.
- **NOT a mock application:** All mock data, hardcoded sparklines, synthetic confidence scores, and fabricated finance budgets were completely eliminated during the System Integrity Campaign.

---

## 3. Active System / Module Inventory

Life OS is composed of **8 user-facing domain modules** plus **2 system-level modules**:

| Module Name | Route | Primary Database Tables | Primary Views | Brain Engine Integration | Data Lab Integration | Maturity Status |
|---|---|---|---|---|---|---|
| **Mission Control** | `/mission-control` | Read-only aggregator | `current_day_snapshot`, `current_day_snapshot_history_14d` | Host view for Brain Engine Hero, EMA sparkline, directives, and system cards | Consumes 30-day domain coverage for confidence | `[VERIFIED CURRENT STATE]` |
| **Mind OS** | `/mind-os` | `habits`, `habit_logs`, `habit_streak_breaks`, `habit_streak_heals`, `journal_entries` | `data_lab_signal_habits`, `data_lab_signal_journal` | Contributes habits completed today, total active habits, newest habit title, journal logged today | 90-day daily activity rollup, 30-day consistency with whitespace normalization | `[VERIFIED CURRENT STATE]` |
| **Productivity Hub** | `/productivity-hub` | `tasks`, `weekly_plans`, `goals`, `weekly_plan_items`, `weekly_reviews` | `data_lab_signal_tasks` | Contributes pending tasks count, oldest pending task title | 90-day tasks created & completed | `[VERIFIED CURRENT STATE]` |
| **Learning OS** | `/learning-os` | `learning_roadmaps`, `learning_stages`, `learning_sessions`, `learning_session_logs`, `learning_milestones`, `learning_projects`, `learning_reflections` | `learning_roadmap_progress`, `learning_stage_progress`, `data_lab_signal_learning` | Contributes active roadmaps count, learning sessions logged in last 7 days | 90-day learning sessions logged rollup | `[VERIFIED CURRENT STATE]` (Core curriculum UI verified; milestones/projects/reflections schema-only) |
| **Fitness OS** | `/fitness-os` | `workouts`, `exercise_logs`, `fitness_exercises` | `data_lab_signal_fitness` | Contributes workout days this week; triggers coach-mode override past Wednesday | 90-day workout sessions & minutes rollup | `[VERIFIED CURRENT STATE]` |
| **Time OS** | `/time-os` | `time_logs` | `data_lab_signal_time` | Contributes deep work minutes today; boosts momentum if >120 mins | 90-day total focus minutes rollup | `[VERIFIED CURRENT STATE]` |
| **Finance OS** | `/finance-os` | `transactions` | `data_lab_signal_finance` | Contributes budget utilization percentage (nullable) and recent want expenses count (>3 alerts) | 90-day need vs want expenditure rollups | `[VERIFIED CURRENT STATE]` |
| **Data Lab** | `/data-lab` | `data_lab_signal_config` | `data_lab_daily_activity_90d`, `data_lab_module_consistency_30d`, `data_lab_weekly_system_score_12w`, `data_lab_event_coverage_30d` | Read-only analytics engine verifying telemetry health and cross-domain balance | Native host domain | `[VERIFIED CURRENT STATE]` |
| **System** | Global | `system_event_queue`, `system_metrics`, `events` | All snapshot and signal views | Implements momentum scoring, domain anomalies, directive ranking, and Evening Sync | Aggregates daily telemetry metrics into `system_metrics` | `[VERIFIED CURRENT STATE]` |
| **Auth** | `/auth` | `auth.users` (Supabase managed) | None | Authenticates session; injects `user.id` into all RLS policies | None | `[VERIFIED CURRENT STATE]` |

---

## 4. System Architecture & Layered Data Flow

The system operates across six distinct layers:

### Layer 1: Presentation & UI Layer (`src/features/*/pages/`, `components/`)
- Pure React 19 functional components utilizing Tailwind CSS 3.4 with an OLED true-black palette (`#000000` background, `#0a0a0a` surfaces, `#222222` borders).
- Navigation is split between desktop sidebar rail (`src/layout/Sidebar.tsx`) and mobile bottom navigation drawer.
- Global overlay components: `GlobalTimerBar` (fixed focus bar), `PiPTimer` (native HTML5 Document Picture-in-Picture window overlay), and `SystemFeedbackToast`.
- **Cognitive Invariant:** Reflection UI (Mind OS) and Execution UI (Productivity Hub) never share screen space.

### Layer 2: Server State & API Hook Layer (`src/features/*/api/`)
- Exclusively managed by **TanStack React Query v5**.
- Queries execute asynchronous Supabase PostgREST calls with explicit namespaces (`['mind-os', 'habits']`, `['system-status']`, etc.).
- Mutations execute optimistic or transactional updates and explicitly invalidate affected query keys on success.

### Layer 3: Dual Telemetry Pipeline Layer
Every user mutation splits into two distinct paths:
1. **Permanent Analytics Pipeline (`src/lib/events.ts` -> `logEventSafe()`):**
   - Directly inserts an immutable event record into `public.events`.
   - Records `user_id`, `domain`, `entity_type`, `entity_id`, `event_type`, `event_date_ist`, and `payload`.
   - Used by PostgreSQL views for 30-day, 90-day, and 12-week longitudinal rollups.
2. **Transient Operational Pipeline (`src/store/useEventBus.ts` -> `useEventBus`):**
   - Pushes an event to client-side Zustand store `backgroundQueue`.
   - Flushes in batches of 10 to `public.system_event_queue` using **transactional peek-and-splice** (events remain in memory until Supabase confirms insertion).
   - Backed by exponential backoff (1s–30s), dead-letter quarantine (5 failed attempts), and bounded memory (`MAX_QUEUE_CAPACITY = 200`, `MAX_RECENT_EVENTS = 50`, `RECENT_EVENTS_TTL_MS = 24h`).
   - Read by the **Evening Sync** ritual to calculate daily score adjustments before draining.

### Layer 4: Database & SQL Aggregation Layer (`supabase/migrations/`)
- Hosted PostgreSQL 15+ with Row Level Security enforced across all tables (`auth.uid() = user_id`).
- Aggregations, multi-day rollups, and cross-domain joins live inside **15 SQL Views** created with `security_invoker = true`.
- Zero client-side loops are required to assemble historical daily activity or snapshot status.

### Layer 5: Intelligence & Brain Engine Layer (`src/features/system/engine/`)
- Evaluates live database view rows into actionable executive state:
  - `analyzeMomentum.ts`: Calculates 7-day Exponential Moving Average ($\alpha = 0.6$).
  - `domainSignals.ts`: Evaluates anomaly rules across all 7 operational domains.
  - `generateDirectives.ts`: Evaluates heuristic urgency scores and selects a single primary directive.
  - `systemHealthEvaluator.ts`: Computes deterministic system confidence percentage.

### Layer 6: Executive Synthesis & Rituals (`src/features/mission-control/`)
- Surfaces the Brain Engine state on Mission Control.
- Executes the **Evening Sync Ritual** (`useEveningSync.ts`): drains up to 50 items from `system_event_queue`, computes daily momentum delta, upserts into `system_metrics`, and emits `system.evening_sync.completed`.

---

## 5. Database Ground Truth

The database schema was generated from migrations and verified byte-for-byte against the remote Supabase database (`db.lhxwyzceiaopetrhcugr.supabase.co`).

### 5.1 Active Base Tables (26 Active + 1 Historical Archive = 27 Base Tables)

```
Database Tables
├── Mind OS
│   ├── habits                    (id, user_id, title, target_type, target_count, current_streak, best_streak, is_archived)
│   ├── habit_logs               (id, user_id, habit_id, logged_date, count_completed)
│   ├── habit_streak_breaks      (id, user_id, habit_id, broken_date, streak_length)
│   ├── habit_streak_heals       (id, user_id, habit_id, healed_date, reason) [5/month limit enforced]
│   └── journal_entries          (id, user_id, entry_date, mood_score, title, content)
├── Productivity Hub
│   ├── tasks                    (id, user_id, title, status, priority, deadline_type, due_date, completed_at)
│   ├── weekly_plans             (id, user_id, week_start_date, focus_theme, status)
│   ├── goals                    (id, user_id, title, timeframe, status, target_date)
│   ├── weekly_plan_items        (id, user_id, weekly_plan_id, task_id, title, is_completed)
│   └── weekly_reviews           (id, user_id, weekly_plan_id, review_date, reflection, rating)
├── Learning OS
│   ├── learning_roadmaps        (id, user_id, title, description, color, status, start_date, target_end_date)
│   ├── learning_stages          (id, user_id, roadmap_id, title, order_index, is_skipped)
│   ├── learning_sessions        (id, user_id, stage_id, title, order_index, estimated_minutes, is_skipped)
│   ├── learning_session_logs    (id, user_id, roadmap_id, session_id, time_log_id, duration_minutes, notes)
│   ├── learning_milestones      (id, user_id, roadmap_id, title, target_date, is_reached) [Schema-only]
│   ├── learning_projects        (id, user_id, roadmap_id, title, repo_url, status) [Schema-only]
│   └── learning_reflections     (id, user_id, roadmap_id, stage_id, content) [Schema-only]
├── Fitness OS
│   ├── workouts                 (id, user_id, start_time, end_time, title, notes)
│   ├── fitness_exercises        (id, user_id, name, category, is_custom)
│   └── exercise_logs            (id, user_id, workout_id, exercise_id, set_number, reps, weight_kg, duration_seconds)
├── Time OS
│   └── time_logs                (id, user_id, task_id, bucket, duration_minutes, start_time, end_time, is_active)
├── Finance OS
│   └── transactions             (id, user_id, amount, type, category, is_want, description, transaction_date)
├── System / Telemetry
│   ├── events                   (id, user_id, domain, entity_type, entity_id, event_type, event_date_ist, payload)
│   ├── system_event_queue       (id, user_id, event_type, payload, created_at)
│   └── system_metrics           (id, user_id, sync_date, momentum_score, events_processed, created_at)
├── Data Lab
│   └── data_lab_signal_config   (signal_key, display_name, weight_percent, weight_cap_days, is_active)
└── Historical Archive
    └── progress_hub_archive     (id, user_id, original_table, payload, archived_at) [ADR-007]
```

### 5.2 SQL Aggregation Views (15 Views, All `security_invoker = true`)

1. **`current_day_snapshot` (14 columns):**
   - Columns: `user_id`, `snapshot_date`, `pending_tasks_count`, `habits_completed_today`, `total_active_habits`, `journal_logged_today`, `workout_days_this_week`, `deep_work_minutes_today`, `oldest_pending_task_title`, `newest_active_habit_title`, `learning_sessions_logged_7d`, `active_roadmaps_count`, `budget_utilization_percentage`, `recent_want_expenses_count`.
   - Queried directly by `useSystemStatus.ts`.
2. **`current_day_snapshot_history_14d` (7 columns):**
   - Columns: `user_id`, `snapshot_date`, `tasks_completed_count`, `habits_completed_count`, `total_active_habits`, `journal_logged`, `workout_logged`.
   - Queried by `analyzeMomentum.ts` for 7-day EMA calculation.
3. **`data_lab_daily_activity_90d` (20 columns):**
   - 90-day multi-domain rollup feeding the Data Lab contribution calendar and activity histogram.
4. **`data_lab_module_consistency_30d` (6 columns):**
   - 30-day percentage consistency per module (`module_name`, `consistency_percent`, `active_days`, `days_observed`, `last_active_date`). Outputs spaced keys (`'Mind / Habits'`).
5. **`data_lab_event_coverage_30d` (7 columns):**
   - Telemetry health stream calculating active days and event counts per domain over 30 days.
6. **`data_lab_weekly_system_score_12w` (25 columns):**
   - 12-week comprehensive score balancing Habits, Tasks, Time, Workouts, Journal, Finance, and Learning.
7. **`data_lab_signal_*` (7 domain signal views):**
   - `data_lab_signal_habits`, `data_lab_signal_journal`, `data_lab_signal_tasks`, `data_lab_signal_time`, `data_lab_signal_fitness`, `data_lab_signal_finance`, `data_lab_signal_learning`.
8. **Learning Views (2 views):**
   - `learning_roadmap_progress` (7 cols) and `learning_stage_progress` (6 cols).

### 5.3 Retired / Phantom Entities (DO NOT REINTRODUCE)
- **`finance_transactions`**: **PHANTOM**. The actual base table is `transactions`.
- **`workout_sets`**: **PHANTOM**. The actual base table is `exercise_logs`.
- **`weekly_plan_items.plan_id`**: **PHANTOM**. `weekly_plan_items` has no `plan_id` or `weekly_plan_id` column; it binds directly to `(user_id, week_start_date)`.
- **`budgets`**: **NON-EXISTENT**. Life OS has no dedicated budget management table. Budget utilization in `current_day_snapshot` is nullable.
- **`programming_skills`, `challenges`, `milestones`, `personal_skills`**: **RETIRED**. Migrated into `progress_hub_archive` under ADR-007 and replaced by Learning OS.

---

## 6. Telemetry & Canonical Event Taxonomy

The event taxonomy is defined in [`src/lib/eventTaxonomy.ts`](../../src/lib/eventTaxonomy.ts). Exactly **45 canonical dot-notation event constants** exist.

### 6.1 Canonical Event Constants Inventory (45 Total)

```text
MIND OS (8)
├── mind.habit.created
├── mind.habit.updated
├── mind.habit.completed
├── mind.habit.uncompleted
├── mind.habit.deleted
├── mind.habit.streak_broken
├── mind.habit.streak_healed
└── mind.journal.entry_created

PRODUCTIVITY HUB (10)
├── productivity.task.created
├── productivity.task.updated
├── productivity.task.completed
├── productivity.task.deleted
├── productivity.plan.created
├── productivity.plan.item_added
├── productivity.plan.item_status_changed
├── productivity.review.submitted
├── productivity.goal.created
└── productivity.goal.updated

FITNESS OS (7)
├── fitness.workout.started
├── fitness.workout.completed
├── fitness.workout.deleted
├── fitness.exercise.created
├── fitness.set.logged
├── fitness.set.deleted
└── fitness.pr.achieved

TIME OS (4)
├── time.session.started
├── time.session.paused
├── time.session.resumed
└── time.session.logged

FINANCE OS (5)
├── finance.transaction.created
├── finance.transaction.updated
├── finance.transaction.deleted
├── finance.budget.set
└── finance.budget.exceeded

LEARNING OS (6)
├── learning.roadmap.created
├── learning.stage.completed
├── learning.session.logged
├── learning.milestone.achieved
├── learning.project.submitted
└── learning.reflection.added

SYSTEM & OPERATIONAL (5)
├── system.evening_sync.completed
├── system.data_lab.viewed
├── system.engine.directive_executed
├── system.engine.state_recalculated
└── system.client.error_logged
```

### 6.2 Telemetry Invariants & Historical Status
- **Active Emitters:** Exactly **zero legacy snake_case event constants remain in active emitter code**.
- **Read-Side Fallback:** Legacy strings (`'WORKOUT_COMPLETED'`, `'DEEP_WORK_COMPLETED'`, `'WANT_EXPENSE_ADDED'`) are retained strictly as backward-compatible read filters in [`useEveningSync.ts`](../../src/features/system/api/useEveningSync.ts) and [`analyzeMomentum.ts`](../../src/features/system/engine/analyzeMomentum.ts) to prevent dropping un-synced historical events.

---

## 7. Event Queue & Evening Sync Architecture

### 7.1 Client-Side Queue (`src/store/useEventBus.ts`)
1. **Peek-and-Splice Persistence Invariant:** Events are peeked (`backgroundQueue.slice(0, 10)`). They are spliced out of memory **only after** `supabase.from('system_event_queue').insert(...)` resolves with zero error.
2. **Exponential Backoff:** Retries back off exponentially: $1\text{s} \to 2\text{s} \to 4\text{s} \to 8\text{s} \dots \max 30\text{s}$.
3. **Dead-Letter Quarantine:** Any event that fails 5 consecutive insertion attempts is evicted from the queue to prevent queue starvation (`MAX_RETRIES = 5`).
4. **Auth Resilience:** If `supabase.auth.getUser()` fails or is refreshing, the queue is **never dumped**. It pauses and schedules a retry.
5. **Memory Bounds:** `backgroundQueue` is capped at `MAX_QUEUE_CAPACITY = 200`. `recentEvents` is capped at 50 items and automatically purges events older than 24 hours (`RECENT_EVENTS_TTL_MS = 86,400,000`).

### 7.2 Evening Sync Ritual (`src/features/system/api/useEveningSync.ts`)
1. **Batch Ingestion:** Fetches up to 50 events from `system_event_queue` ordered by `created_at ASC` (processes across all un-synced dates, not artificially restricted to current day).
2. **Arithmetic Aggregation:** Computes momentum delta:
   $$\Delta_{\text{momentum}} = (\text{DeepWork} \times 3) + (\text{Workout} \times 2) - (\text{HabitFails} \times 2) - \text{WantExpenses}$$
3. **Persistence:** Upserts the aggregated score into `system_metrics` (`user_id`, `sync_date`, `momentum_score`, `events_processed`).
4. **Drain & Invalidation:** Deletes processed items from `system_event_queue` by ID, clears in-memory events, invalidates `['system-status']`, `['system-event-queue-count']`, and `['data-lab', 'overview']`, and logs `system.evening_sync.completed`.

---

## 8. Brain Engine Intelligence Specification

The Brain Engine is implemented entirely in TypeScript under [`src/features/system/engine/`](../../src/features/system/engine/).

### 8.1 Inputs Consumed
Consumes all 14 columns of `current_day_snapshot` and all 7 columns of `current_day_snapshot_history_14d`.

### 8.2 Momentum Analysis (`analyzeMomentum.ts`)
- **Daily Score Composition (Weighted 0–100):**
  - Tasks (35%): $\text{clamp}(n_{\text{completed}} \times 25)$
  - Habits (35%): $\text{clamp}((n_{\text{completed}} / n_{\text{active}}) \times 100)$
  - Journal (15%): boolean (100 or 0)
  - Fitness (15%): boolean (100 or 0)
- **Exponential Moving Average ($\alpha = 0.6$):**
  $$EMA_t = (\text{DailyScore}_t \times 0.6) + (EMA_{t-1} \times 0.4)$$
- **Trend Evaluation:** Compares latest EMA to previous day EMA:
  $$\Delta > +2 \to \text{'rising'}, \quad \Delta < -2 \to \text{'falling'}, \quad \text{otherwise 'stable'}$$
- **Operational Presentation Boosts:**
  - Deep Work Boost: If `deepWorkMinutesToday > 120`, adds `+4` points.
  - Recovery Boost: If momentum $< 20$ and a positive event occurred today (`fitness.workout.completed` or `time.session.logged`), adds $3 \times \text{gain}$ where $\text{gain} = \max(1, \text{round}((100 - \text{momentum}) \times 0.03))$.
- **Cold Start Baseline:** If history is empty (brand new user), returns `momentum: 0`, `trend: 'stable'`, and `emaSeries: []`.

### 8.3 Heuristic Directives & Urgency Ranking (`generateDirectives.ts`)
Calculates urgency scores across all 7 domains:
- `task`: $\text{pendingTasks} \times 2$
- `habit`: $\text{unfinishedHabits} \times 2$
- `journal`: $0$ if logged today, else $5$
- `fitness`: $100$ if past Wednesday with 0 workouts (Coach Mode override); $3$ if $< 2$ workouts; else $0$
- `deep_work`: $6$ if $0$ mins today; $4$ if $< 60$ mins; else $0$
- `learning`: $5$ if active roadmaps exist but $0$ sessions logged in last 7 days; else $0$
- `finance`: $8$ if budget $> 90\%$; $5$ if budget $> 75\%$; $4$ if recent want expenses $> 3$; else $0$

**Tie-Breaking Precedence:** `task` $\to$ `habit` $\to$ `journal` $\to$ `deep-work` $\to$ `learning` $\to$ `fitness` $\to$ `finance`.  
**Default Fallback:** `"Start your first habit"` (`/mind-os/habits`).

### 8.4 Deterministic Confidence Scoring (`systemHealthEvaluator.ts`)
$$\text{Confidence} = (\text{Freshness} \times 0.35) + (\text{Completeness} \times 0.35) + (\text{Coverage} \times 0.30)$$
- **Freshness (35%):** 100 pts if snapshot is from today (IST); 50 pts if yesterday; 25 pts if 2–3 days; 10 pts if older; 0 if null.
- **Completeness (35%):** $(\min(\text{historyDays}, 14) / 14) \times 100$.
- **Coverage (30%):** $(\text{activeDomainsPresentToday} / 7) \times 100$.

### 8.5 Timezone Handling
All date operations strictly normalize to **Indian Standard Time (IST, UTC+5:30)** via `toIndiaDateKey()` (`Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })`). Midnight transition cleanly occurs at 18:30:00 UTC.

---

## 9. Data Lab Behavioral Analytics

Data Lab (`src/features/data-lab/`) surfaces longitudinal intelligence across 3 views:

1. **Overview:** 12-week system score from `data_lab_weekly_system_score_12w`, 90-day multi-domain contribution calendar and activity histogram from `data_lab_daily_activity_90d`.
2. **Behavior:** 30-day module consistency percentages from `data_lab_module_consistency_30d`.
3. **Telemetry:** 30-day domain coverage streams and silent event detector from `data_lab_event_coverage_30d`.

### Spaced Key Normalization Invariant
PostgreSQL view `data_lab_module_consistency_30d` outputs spaced strings (`'Mind / Habits'`, `'Mind / Journal'`). In `consistency.ts` and `systemHealth.ts`, bidirectional key normalization is enforced:
```ts
const normalizeKey = (str: string) => str.toLowerCase().replace(/\s*\/\s*/g, '/').replace(/\s+/g, '');
```
This guarantees that view rows match domain extractors regardless of whitespace variations, completely preventing false 0% consistency readings.

---

## 10. Learning OS Implementation Reality

Learning OS replaced the retired Progress Hub under ADR-007.

### Surfaced UI vs Schema-Only Reality
- **Fully Surfaced in UI & Verified:**
  - `learning_roadmaps`: Creation, status toggle (`active`, `completed`, `paused`, `abandoned`), date tracking.
  - `learning_stages`: Stage creation, ordering, skip toggle (`is_skipped`).
  - `learning_sessions`: Lesson creation, duration estimation, skip toggle (`is_skipped`).
  - `learning_session_logs`: Study session duration logging, focus timer integration, recent logs display.
  - Views: `learning_roadmap_progress` and `learning_stage_progress`.
- **Schema-Only / Read-Query Only (NO UI MUTATION FORMS YET):**
  - `learning_milestones`: Schema and read query (`useRoadmapMilestones`) exist, but no UI form to create/edit milestones exists.
  - `learning_projects`: Schema and read query (`useRoadmapProjects`) exist, but no UI form exists.
  - `learning_reflections`: Schema and read query (`useReflections`) exist, but no UI reflection modal exists.
  - *Note for Phase 2:* Do not assume milestones, projects, or reflections can be created by users without building their UI modals.

---

## 11. Mission Control Ground Truth

Every visual element in [`MissionControl.tsx`](../../src/features/mission-control/dashboard/MissionControl.tsx) has been verified as live or deterministic:

| UI Element | Source Type | Underlying Data Source | Fallback on Cold Start |
|---|---|---|---|
| **Momentum Score** | Live Derived | `analyzeMomentum()` over `current_day_snapshot_history_14d` | Defaults to `0` |
| **Momentum Trend** | Live Derived | Delta of last two EMA values | `'stable'` |
| **Hero Sparkline** | Live Derived | `emaSeries` array from `analyzeMomentum()` | Honest flat baseline `[0, 0, ...]` or single horizontal rule (Zero fake sine waves) |
| **Confidence Indicator** | Live Derived | `computeSystemConfidence()` (Freshness + Completeness + Coverage) | Deterministic number 0–100% based on observable data |
| **Primary Mission Directive** | Live Derived | `generateDirectives()` over `current_day_snapshot` | Fallback: `"Start your first habit"` |
| **Live System Status (7 cards)**| Live Derived | Evaluates snapshot domain activity today | Gray dot / `'Needs Input'` |
| **System Metrics (4 cards)** | Live Mapped | Direct columns of `current_day_snapshot` | `0` or `None` |
| **Recent Activity Feed** | Live Mapped | In-memory `recentEvents` from `useEventBus` | `"No recent activity detected."` |
| **End of Day Card** | Live Operational | Interacts directly with `useEveningSync()` mutation | Shows pending event count from `system_event_queue` |

---

## 12. Remaining Domain Realities & Architectural Debt

### 12.1 Mind OS (`/mind-os`)
- **Habits:** Binary or count-based targets. Streaks increment on completion; streak break logged if missed; streak heal ledger permits **maximum 5 heals per rolling calendar month**.
- **Journal:** Markdown reflection content with mood rating (1–5).
- **Status:** Mature and verified.

### 12.2 Productivity Hub (`/productivity-hub`)
- **Tasks:** Grouped by deadline type (`critical_deadline`, `soft_target`, `backlog`).
- **Planning:** Weekly focus container (`weekly_plans`), Goals (`goals`), sprint items (`weekly_plan_items`), and retrospective reviews (`weekly_reviews`).
- **Status:** Mature and verified.

### 12.3 Fitness OS (`/fitness-os`)
- **Workouts & Logs:** Live workout session timer, set-by-set resistance and cardio logging in `exercise_logs`, custom exercise catalog in `fitness_exercises`, personal records tracking.
- **Status:** Mature and verified.

### 12.4 Time OS (`/time-os`)
- **Focus Tracking:** Single active timer constraint enforced per user.
- **Document Picture-in-Picture (PiP):** Native HTML5 Document PiP window opens and syncs timer controls with main window.
- **Analytics:** `useCompletedTimeLogs` and `useTimeAnalytics` provide lifetime session analytics across time buckets (`Deep Work`, `Learning`, `Admin`, `Health`).
- **Status:** Mature and verified.

### 12.5 Finance OS (`/finance-os`)
- **Transactions:** Records amount, category, and behavioral tag (`is_want: boolean` for Need vs Want classification).
- **Budget Reality:** **There is NO real budget management schema.** `budget_utilization_percentage` in `current_day_snapshot` is currently `null` for real users. The Brain Engine cleanly suppresses budget warnings when null, alerting instead on `recent_want_expenses_count > 3`.
- **Status:** Functional for transaction logging and Need/Want breakdown, but lacking formal budget management.

---

## 13. System Integrity Campaign — Forensic Summary of Repairs

The Multi-Agent System Integrity Campaign systematically diagnosed and repaired six major architectural findings (**F-01 through F-06**):

| ID | Issue Category | Affected Files | Forensic Cause | Permanent Resolution Applied |
|---|---|---|---|---|
| **F-01** | Data Projection | `useSystemStatus.ts`, `domainSignals.ts`, `generateDirectives.ts` | Snapshot query omitted `budget_utilization_percentage` and `recent_want_expenses_count`, permanently silencing Brain Engine finance directives. | Added both fields to snapshot query projection and fallback mapper; handled null budget gracefully without false alarms; alerted on $>3$ discretionary want expenses. |
| **F-02** | Telemetry Desync | `useEveningSync.ts`, `analyzeMomentum.ts`, `types.ts` | Evening sync and momentum analysis filtered on legacy `'WORKOUT_COMPLETED'`, ignoring canonical `fitness.workout.completed` and `time.session.logged`. | Updated filters to recognize canonical dot-notation constants; added live queue count query invalidation. |
| **F-03** | Key Mismatch | `consistency.ts`, `systemHealth.ts` | Data Lab frontend keys `'Mind/Habits'` lacked spaces stored in PostgreSQL view (`'Mind / Habits'`), dropping consistency readings to 0%. | Standardized module extractors and implemented `normalizeKey()` bidirectional whitespace normalization. |
| **F-04** | Telemetry Reliability | `useEventBus.ts` | Queue spliced events before Supabase insertion resolved; transient network errors lost telemetry permanently. | Enforced **transactional peek-and-splice**: events remain in memory until remote insert succeeds; added exponential backoff (1s–30s) and quarantine after 5 failed retries. |
| **F-05** | Memory Safety | `useEventBus.ts` | In-memory queues lacked size bounds and TTL expiration. | Capped background queue at `MAX_QUEUE_CAPACITY = 200`, recent events at 50, and enforced 24-hour TTL pruning. |
| **F-06** | Test Depth | `run-smoke-validation.mjs` | Smoke tests bypassed snapshot view projections, queue persistence, and evening sync arithmetic. | Expanded smoke suite to 29 comprehensive integration checks, created dedicated unit contract tests (`verify-integrity-contracts.mjs`), and created adversarial stress suite (`verify-adversarial-attacks.mjs`). |

---

## 14. Verification Baseline Proof

The repository at HEAD (`ad488a2`) passes all automated verification gates:

```bash
# 1. Static Lint Analysis (0 errors, 0 warnings)
npm run lint

# 2. Production TypeCheck & Compilation (0 errors)
npx tsc -b

# 3. Production Vite Bundle (2008 modules transformed, clean dist/)
npm run build

# 4. Release Verification Gate (combined lint + tsc + build: Exit 0)
npm run verify:release

# 5. Offline Integrity Contract Suite (6/6 PASS: Exit 0)
npx tsx scripts/smoke/verify-integrity-contracts.mjs

# 6. Offline Adversarial Attack Stress Suite (6/6 PASS: Exit 0)
npx tsx --env-file=.env scripts/smoke/verify-adversarial-attacks.mjs

# 7. Remote Supabase Backend Smoke Validation (29/29 PASS: Exit 0)
node scripts/smoke/run-smoke-validation.mjs

# 8. Headless Playwright Browser E2E Suite (60/60 PASS: Exit 0)
node scripts/smoke/run-browser-verification.mjs
```

---

## 15. Current Known Limitations

### A. Real Technical Limitations
1. **IST Timezone Hardcoding:** Date bucketing and midnight cutoffs are explicitly tied to `Asia/Kolkata` (IST, UTC+5:30). Cross-timezone dynamic user localization is not yet supported.
2. **Single Active Timer Constraint:** Only one focus timer can run per user at any given moment.
3. **Client-Side EMA Calculation:** The 7-day EMA momentum is calculated in the browser client by `analyzeMomentum.ts` from view rows rather than in a PostgreSQL stored procedure.

### B. Missing Product Functionality
1. **No Real Budget Management:** Finance OS lacks budget definition tables (`budgets`). `budget_utilization_percentage` is currently null for real users.
2. **Learning OS Schema-Only Features:** `learning_milestones`, `learning_projects`, and `learning_reflections` exist in the database and have API read hooks, but lack UI creation and edit forms.
3. **No Theme Switcher:** The application is locked to true-black OLED dark mode (`#000000`).

### C. Architectural & Bundle Debt
1. **Vite Bundle Chunk Size:** Production bundle produces an `index-*.js` chunk larger than 500 kB (minified). Route-level dynamic `import()` code splitting should be expanded in Phase 2.
2. **Views Untyped in `database.types.ts`:** Generated Supabase types only include base tables under `Tables:`. Views (`current_day_snapshot`, etc.) are queried via untyped PostgREST projections and mapped using local TypeScript types.
3. **Legacy String Fallbacks:** `useEveningSync.ts` and `analyzeMomentum.ts` retain string fallbacks (`WORKOUT_COMPLETED`, etc.) to process pre-taxonomy events.

### D. Infrastructure & Deployment Limitations
1. **Hosted Cloud Dependency:** Requires network connectivity to hosted Supabase PostgreSQL. No local Docker Compose or mock fallback environment is maintained.
2. **CI/CD Workflow:** No GitHub Actions workflow (`.github/workflows/`) is currently configured in the repository.

---

## 16. Protected Architectural Truths ("DO NOT BREAK THESE")

Any future AI assistant or engineer working on Life OS **MUST PRESERVE** the following ten invariants:

1. **Cognitive Protection Boundary:** Mind OS (reflection) and Productivity Hub (execution pressure) must **NEVER** share the same screen space or be combined into a single view.
2. **Canonical Telemetry Taxonomy:** All mutations **MUST** emit events using constants from `src/lib/eventTaxonomy.ts`. Never write raw snake_case or un-namespaced event strings.
3. **Transactional Peek-and-Splice Queue Persistence:** In `useEventBus.ts`, never remove events from memory before remote database insertion succeeds.
4. **Database-First Rollups (`security_invoker = true`):** All multi-day aggregations and historical rollups must live in SQL views, not client-side fetch-and-loop cascades.
5. **Single Active Timer Constraint:** A user may not have more than one running focus session simultaneously.
6. **No Fabricated Finance Budget Schema:** Do not invent phantom budget tables or columns. Treat `budget_utilization_percentage` as nullable until a formal migration adds a budget management system.
7. **Honest Cold-Start Baseline:** Never generate synthetic sine waves or fake historical momentum for brand new users. An empty history must display an honest flat 0 baseline.
8. **Spaced Key Normalization in Data Lab:** Always run `normalizeKey()` when comparing database view module names with frontend domain extractors.
9. **Remote Database Schema as Source of Truth:** Never assume a column exists without verifying against `supabase/migrations/` and `src/types/database.types.ts`.
10. **Passing Verification Gates Before Merging:** No PR or commit may be merged unless `npm run verify:release`, `verify-integrity-contracts.mjs`, and `verify-adversarial-attacks.mjs` exit with code 0.

---

## 17. Safe Future Modification Zones for Phase 2

For the upcoming **Phase 2 (Winter Arc UI Redesign)**:

### Zone A: Green Light — Safe to Redesign
- Visual styling, Tailwind classes, color palettes, and typography.
- Layout restructuring within pages (`src/features/*/pages/`).
- Sidebar rail animations, header navigation, and mobile bottom drawer.
- Component decomposition and performance optimizations (code-splitting chunks).
- Enhancing empty states, loading skeletons, and interactive micro-interactions.
- Building missing UI creation modals for `learning_milestones`, `learning_projects`, and `learning_reflections`.

### Zone B: Yellow Light — Modify Only with Architectural Review
- Modifying SQL views (`supabase/migrations/`).
- Changing weights or formulas in `analyzeMomentum.ts`, `generateDirectives.ts`, or `systemHealthEvaluator.ts`.
- Adding new canonical events to `src/lib/eventTaxonomy.ts`.
- Altering React Query cache keys.

### Zone C: Red Light — Do NOT Modify Casually
- `src/store/useEventBus.ts` transactional persistence loop and retry logic.
- RLS policies and foreign key constraints on PostgreSQL base tables.
- Base table schemas and existing column definitions.
- The cognitive separation between Mind OS and Productivity Hub.

---

## 18. Current Project Phase

- **Finished & Frozen:** Phase 0 (Legacy Sanitization) & Phase 1 (Multi-Agent System Integrity Campaign). The data layer, database schema, event telemetry, Brain Engine algorithms, and documentation are hardened, verified, and pushed to `origin/main`.
- **Active / Immediate Next Phase:** **Phase 2: Winter Arc UI Redesign & Product Experience Evolution**.
- **First Actions for Phase 2:** Establish new Winter Arc design system components, enhance dashboard layouts, and implement code-splitting to optimize the production bundle without altering database contracts.

---

## 19. Historical ChatGPT Context (OUTDATED — DO NOT USE)

> [!IMPORTANT]
> **ChatGPT Quick Reference Mental Model:**
> - **What is Life OS?** A deterministic, multi-domain personal intelligence operating system (React 19 + Supabase PostgreSQL) designed to track habits, tasks, focus time, workouts, spending, and learning over years.
> - **Where does intelligence live?** In `src/features/system/engine/`. It uses a 7-day Exponential Moving Average ($\alpha=0.6$) for momentum and heuristic ranking for directives. There are NO external AI APIs at runtime.
> - **What is the database state?** 27 base tables (26 active + 1 historical archive `progress_hub_archive`) and 15 SQL aggregation views. RLS is enabled on all tables.
> - **What is the telemetry rule?** Always use `EVENT_TYPES` from `src/lib/eventTaxonomy.ts` (45 canonical dot-notation constants). Dual pipeline: `logEventSafe` goes to `events` (permanent), `useEventBus` goes to `system_event_queue` (transient, drained by Evening Sync).
> - **What was recently fixed?** Brain Engine finance projection was restored; canonical fitness/time events were wired into momentum and Evening Sync; Data Lab key spacing was normalized; EventBus queue persistence was made transactional with backoff and memory bounds; smoke validation was expanded to 29 steps; and all documentation was synchronized.
> - **What are the top caveats?** Finance has NO real budget table (`budget_utilization_percentage` is nullable); Learning OS has 3 tables without UI creation forms (`milestones`, `projects`, `reflections`); Timezone is hardcoded to IST; Production bundle has one chunk >500 kB.
> - **What is next?** Phase 2 Winter Arc UI Redesign. You may redesign UI layouts and styling freely, but **DO NOT** break database schemas, RLS policies, or telemetry contracts.

---

# END OF LIFE OS — PHASE 1 HISTORICAL BASELINE (Frozen at commit ad488a2, Sept 5 2026)
