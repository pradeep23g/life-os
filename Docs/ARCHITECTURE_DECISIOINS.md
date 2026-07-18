# LIFE OS — ARCHITECTURE DECISIONS

This document records significant architectural decisions made during the evolution of Life OS.

Each entry explains WHY a decision was made, not just WHAT was decided. Decisions are listed approximately chronologically based on the migration and implementation history.

---

## ADR-001: Domain-Driven Feature Architecture

**Date:** Initial setup  
**Context:** Life OS tracks multiple life domains (habits, tasks, fitness, finance, time, learning). These domains have distinct cognitive purposes and must not bleed into each other.  
**Problem:** Flat folder structures conflate unrelated features, creating cognitive pollution (e.g., showing tasks inside a journaling interface).  
**Decision:** All features live in `src/features/<module>/` with domain-isolated API hooks, components, and types. Cross-domain imports are restricted to aggregator modules (Mission Control, Data Lab).  
**Consequences:** Scales cleanly as new modules are added. Cognitive boundaries are enforced by folder structure. New engineers can locate any feature immediately.  
**Affected Modules:** All features.

---

## ADR-002: SQL-First Aggregation, TypeScript-Only Intelligence

**Date:** Brain Engine v1 (migrations 09_system_snapshot.sql)  
**Context:** Mission Control needs high-level summaries across all domains without running multiple joins on the client.  
**Problem:** Client-side joins across large tables are expensive and fragile. Business logic mixed into SQL becomes unmaintainable.  
**Decision:** SQL views compute and return facts only (counts, booleans, titles, dates). TypeScript performs all scoring, ranking, urgency calculation, and momentum analysis.  
**Consequences:** SQL is simple and auditable. TypeScript intelligence is testable without a database. Clear boundary between data layer and intelligence layer.  
**Affected Modules:** System/Brain Engine, Mission Control, Data Lab.

---

## ADR-003: React Query for All Server State

**Date:** Early architecture  
**Context:** The app has many independent data domains that need caching, background refetching, and optimistic updates.  
**Problem:** Using `useEffect` + `useState` for server data leads to stale caches, waterfall fetches, and inconsistent loading states.  
**Decision:** `@tanstack/react-query` v5 is the exclusive mechanism for all server-backed state. Domain-prefixed cache keys prevent cross-contamination.  
**Consequences:** Cache invalidation is explicit and targeted. Brain Engine reactivity is triggered by query invalidation. No global state manager needed for server data.  
**Affected Modules:** All features.

---

## ADR-004: Zustand for the Event Bus Only

**Date:** Event Bus introduction  
**Context:** Brain Engine needs immediate reactivity when users complete deep work or workouts without waiting for database round-trips.  
**Problem:** React Query is asynchronous and tied to database reads. Immediate in-session signal propagation requires something faster.  
**Decision:** A single Zustand store (`useEventBus`) maintains an in-memory ring buffer of operational signals. These signals are also persisted to `public.system_event_queue` asynchronously.  
**Consequences:** Brain Engine responds instantly to user actions within a session. Zustand is limited to one store; all other state goes through React Query.  
**Affected Modules:** System/Brain Engine, all modules that emit bus signals.

---

## ADR-005: Dual Event Channel Architecture

**Date:** Brain Engine / Analytics maturation  
**Context:** Two different needs emerged: (1) permanent behavioral analytics, and (2) immediate session-scoped operational signals.  
**Problem:** A single event channel cannot serve both purposes well. Permanent analytics must not be polluted with transient signals, and transient signals must not require durable storage.  
**Decision:** Two separate channels:
- `public.events` (durable) via `logEventSafe` — permanent behavioral record
- `public.system_event_queue` (transient) via `useEventBus` — ephemeral session signals cleaned up by Evening Sync  
**Consequences:** Analytics data is clean and reliable. Session signals can be emitted without write latency concerns. Evening Sync bridges the two by aggregating transient signals into `system_metrics`.  
**Affected Modules:** System, all modules with mutations.

---

## ADR-006: IST-Scoped Date Keys for All Analytics

**Date:** Events analytics implementation  
**Context:** The system owner is located in India (IST, UTC+5:30). Supabase timestamps default to UTC. Behavioral data that spans midnight in UTC but falls on the same IST day must aggregate correctly.  
**Problem:** Using UTC timestamps for day-level analytics produces incorrect results for IST users (a 10:30 PM IST entry appears on the next UTC day).  
**Decision:** All analytics events store `event_date_ist` as a `YYYY-MM-DD` string computed in IST. SQL views use `at time zone 'Asia/Kolkata'` for date truncation. TypeScript uses `toIndiaDateKey()` to generate consistent IST date strings.  
**Consequences:** All analytics are timezone-correct for IST. Week start is Monday (computed via `getCurrentIndiaWeekStart`). Consistent across SQL and TypeScript layers.  
**Affected Modules:** Events pipeline, Data Lab, Brain Engine, Time OS analytics.

---

## ADR-007: Brain Engine — Urgency-Based Single Directive

**Date:** Brain Engine v1  
**Context:** Mission Control needs to tell the user what to do next, not overwhelm them with everything that needs doing.  
**Problem:** Showing all pending items creates decision paralysis. The user needs one clear next action.  
**Decision:** The Brain Engine computes urgency scores for five domains (task, habit, journal, deep-work, fitness) and surfaces the single highest-urgency action as the directive. A "coach mode" override exists for fitness (if past Wednesday with zero workouts, urgency becomes 100).  
**Consequences:** Mission Control is opinionated and action-oriented. Users get one clear CTA. The Brain Engine avoids being an overwhelming dashboard.  
**Affected Modules:** System/Brain Engine, Mission Control.

---

## ADR-008: Evening Sync as the Bridge Between Transient and Durable

**Date:** System metrics introduction (migration 16_system_metrics.sql)  
**Context:** The in-memory event bus and `system_event_queue` accumulate daily signals (deep work, workouts, habit failures, want expenses). These need to influence the momentum score durably.  
**Problem:** Zustand state is lost on page refresh. `system_event_queue` entries are transient. Neither provides a persistent daily momentum record.  
**Decision:** Evening Sync (`useEveningSync.ts`) is a user-triggered mutation that reads the day's `system_event_queue`, computes a momentum delta, writes a daily record to `system_metrics`, then clears the queue and Zustand store.  
**Consequences:** Daily momentum snapshots are persisted. Queue grows cleanly during the day and is purged nightly. The Brain Engine can reference historical momentum from `system_metrics`.  
**Affected Modules:** System, all modules that emit bus signals.

---

## ADR-009: Data Lab as an Isolated Read-Only Analytics Module

**Date:** Data Lab introduction (migration 202606200001, 202606200002)  
**Context:** Growing data volume enabled cross-domain behavioral analytics. A dedicated surface was needed.  
**Problem:** Embedding analytics inside domain modules creates clutter and blurs the module's primary purpose. Analytics needs its own navigation and state.  
**Decision:** Data Lab (`/data-lab`) is a fully isolated read-only module. It imports from the domain APIs' view hooks but never calls domain mutations. It has its own metrics engine (11 computation files), transforms layer, and Zustand store for UI state (active tab, period selector).  
**Consequences:** Behavioral analytics are cleanly separated from data entry. The metrics/transforms/utils layer within Data Lab is a pure computation pipeline. The module can be extended without touching any other feature.  
**Affected Modules:** Data Lab (isolated from all other features except read access to SQL views).

---

## ADR-010: Finance Table Migration — `finance_transactions` → `transactions`

**Date:** Migration 202606230001 (2026-06-23)  
**Context:** The initial Finance OS used a table named `finance_transactions`. This was not aligned with the naming convention for the domain and limited future expansion.  
**Problem:** The old table name was domain-prefixed, inconsistent with other tables like `tasks`, `habits`, `workouts`. It also didn't support transaction `type` field for future income tracking.  
**Decision:** Migrate all existing rows from `finance_transactions` to a new `transactions` table with a `type` column (defaulting to `'expense'`), then drop the legacy table.  
**Consequences:** Finance OS now uses `public.transactions`. The `type` column enables future income/savings distinctions. Legacy `finance_transactions` no longer exists.  
**Affected Modules:** Finance OS (`useFinance.ts`, `FinanceDashboard`).

---

## ADR-011: Task Schema Overhaul — `is_completed` + Deadline Types

**Date:** Migration 202606230001 (2026-06-23)  
**Context:** The original `tasks` table used only a `status` text column (To Do / Doing / Done) to determine completion. Queries filtering incomplete tasks required string comparison against `'Done'`.  
**Problem:** String status for completion state is fragile. SQL views and hooks were filtering on `status != 'Done'`, which is brittle and hard to query efficiently. Additionally, deadline metadata was absent.  
**Decision:** Add `is_completed boolean NOT NULL DEFAULT false` column to `tasks`. Add `deadline_type` (`same_day`, `no_deadline`, `specific_date`) and `deadline_date date`. Backfill `is_completed = true` where `status = 'Done'`. Add check constraints for consistency.  
**Consequences:** `current_day_snapshot` view now filters on `is_completed = false`. Task completion is a first-class boolean. Deadline metadata exists for future planning features.  
**Affected Modules:** Productivity Hub (tasks), System/Brain Engine (snapshot view).

---

## ADR-012: Database Cleanup Migration as Single Coordinated Transaction

**Date:** Migration 202606230001 (2026-06-23)  
**Context:** Multiple schema changes needed to happen atomically: Finance table migration, Task schema overhaul, SQL view recreation, index additions.  
**Problem:** Applying these changes in separate migrations risked leaving the database in intermediate inconsistent states between deployments.  
**Decision:** All interdependent schema changes were bundled into a single large migration (`202606230001_database_cleanup.sql`) wrapped in a transaction (`BEGIN ... COMMIT`).  
**Consequences:** The schema changes succeeded or failed atomically. This is the preferred pattern for coordinated migrations. Future migrations affecting multiple related tables should follow this approach.  
**Affected Modules:** Finance OS, Productivity Hub, System views, Data Lab views.

---

## ADR-013: Mission Control Snapshot Pattern

**Date:** Mission Control redesign  
**Context:** Mission Control aggregates data from all domain modules. Originally this was done by importing and calling every domain hook individually in the MissionControl component itself.  
**Problem:** Aggregating 8+ domain hooks in a single component creates a large, hard-to-test component. Logic for evaluating system health and threats belongs outside the UI.  
**Decision:** Introduce `useMissionControlSnapshot.ts` as an aggregator hook that:
1. Calls all domain hooks
2. Derives threat and system status via `evaluateSystemThreats` and `evaluateSystemStatuses` (in `utils/systemHealthEvaluator.ts`)
3. Returns a unified `MissionControlSnapshot` type
4. `MissionControl.tsx` consumes only this one hook  
**Consequences:** Mission Control's UI component is clean and simple. System health evaluation logic is isolated and auditable. Types are explicit (`MissionControlSnapshot`, `MetricCard`, `SystemEvent`, `BrainState`).  
**Affected Modules:** Mission Control.

---

## ADR-014: Graceful Fallback for Missing SQL Views

**Date:** Throughout Data Lab and Brain Engine development  
**Context:** New SQL views are added via migrations. If a developer or test environment hasn't applied the latest migration, queries against missing views return PostgreSQL error `42P01` or PostgREST `PGRST205`.  
**Problem:** Throwing uncaught errors when views are missing creates a broken UI experience in environments with incomplete migrations.  
**Decision:** All hooks that query analytics views implement `isMissingRelationError()` checks. If the error matches a missing view/table, the hook returns an empty array or null instead of throwing. This ensures the app degrades gracefully.  
**Consequences:** The application remains partially functional even without all migrations applied. This is a temporary compatibility pattern; it is not a substitute for keeping migrations current.  
**Affected Modules:** Data Lab (`useDataLab.ts`), System (`useSystemStatus.ts`), Brain Engine (`useEveningSync.ts`).

---

## ADR-015: Time OS — One Active Timer Invariant

**Date:** Time OS v1  
**Context:** Time OS allows users to track focused work sessions. The system must prevent accidental double-timing.  
**Problem:** Without enforcement, a user could start two timers simultaneously, creating ambiguous session data.  
**Decision:** A unique database index on `(user_id)` where `end_time IS NULL` ensures only one active timer per user exists at any time. The application enforces this by checking for an active timer before starting a new one.  
**Consequences:** Session data integrity is guaranteed at the database level. The UI reflects the correct active/idle state reliably. GlobalTimerBar always reflects the single source of truth.  
**Affected Modules:** Time OS.
