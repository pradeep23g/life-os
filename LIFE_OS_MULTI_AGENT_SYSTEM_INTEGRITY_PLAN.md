# LIFE OS — MULTI-AGENT SYSTEM INTEGRITY EXECUTION PLAN

**Document ID:** `LIFE_OS_MULTI_AGENT_SYSTEM_INTEGRITY_PLAN.md`
**Created:** 2026-08-22
**Author Role:** Chief Software Architect & Technical Program Manager
**Status:** Active Execution Plan
**Prerequisite Reading:** `LIFE_OS_CURRENT_STATE_AUDIT.md`

---

## 1. Executive Summary

### Current Project Maturity

Life OS is a **Partially Integrated Advanced Functional Application** — significantly beyond prototype, with 8 fully navigable domain modules (Mission Control, Mind OS, Productivity Hub, Learning OS, Fitness OS, Time OS, Finance OS, Data Lab), route-level code splitting, enforced Supabase RLS, and complex domain workflows running in production. The build is clean: **zero TypeScript errors, zero ESLint errors.**

### Primary Architectural Challenge

The system suffers from **five classes of architectural fractures** that prevent it from functioning as a coherent personal intelligence system:

1. **Telemetry Dual-Truth (WORSE THAN AUDITED):** Two completely separate event pipelines exist. Critically, **26 of 45 event emitters use legacy snake_case string literals** instead of the canonical `eventTaxonomy.ts` constants. SQL views hardcode legacy names. The `telemetryHealth.ts` module compares emitted events against taxonomy values and falsely reports degradation because the names don't match.

2. **Simulated Intelligence:** Mission Control's sparkline is mathematically synthesized (momentum ± offsets), confidence is hardcoded at `87`. The Brain Engine lacks Finance OS awareness entirely.

3. **Data Completeness Gaps:** Learning OS analytics truncate at 20 records. Data Lab behavioral analytics exclude Learning OS from **8 subsystems** (correlation, streaks, drift, consistency, insights, systemHealth, overview transforms, ContributionCalendar). Finance is also excluded from insights and behavior timeline.

4. **Broken Verification Layer:** Smoke validation targets 4 dropped Progress Hub tables and an invalid `'progress-hub'` domain constraint.

5. **Evening Sync Data Stranding:** Queue queries are bounded to the current day, permanently stranding previous days' events. Pending counter is volatile Zustand. No cache invalidation on sync.

### Why Multi-Agent Execution Is Appropriate

These issues span 7+ distinct subsystems with different file ownership boundaries. The dependency graph has clear sequential requirements (telemetry must stabilize before Mission Control can consume real data) but also significant parallel opportunity. A single-agent serial approach would take 5-8× longer.

### Major Risks

1. **Event migration corruption** — Changing event naming could break historical analytics
2. **SQL view cascade** — 15 SQL views depend on specific event name strings
3. **Generated types drift** — `database.types.ts` diverges significantly from actual schema (phantom tables, 9+ column discrepancies)
4. **Parallel merge conflicts** — Several shared infrastructure files could be modified by multiple agents

### Definition of Success

Every user action uses ONE canonical taxonomy. Every analytics metric is traceable. Mission Control displays actual history. Brain Engine consumes all domains including Finance. Verification reflects reality. No phantom database references remain.

---

## 2. Ground Truth Confirmation

### Audit Findings Verified Against Repository

| # | Audit Finding | Status | Key Evidence |
|---|---|---|---|
| 1 | Telemetry dual-truth | **CONFIRMED & FAR MORE SEVERE** | 26/45 emitters use legacy snake_case literals. `useTasks.ts:126` emits `'task_created'` not `PRODUCTIVITY_TASK_CREATED`. `useHabits.ts:582` emits `'habit_created'` not `MIND_HABIT_CREATED`. Only Learning OS, some delete handlers, and habit count adjustments use taxonomy constants. |
| 2 | SQL views hardcode legacy names | **CONFIRMED** | `current_day_snapshot_history_14d` and `data_lab_daily_activity_90d` hardcode `'task_created'` and `'task_status_updated'`. These are the ONLY domain where activity is queried from `events` table (all others use domain tables directly). |
| 3 | Learning OS `.limit(20)` | **CONFIRMED** | `useLearningOS.ts:129`. `AnalyticsPage.tsx` uses this for lifetime totals — permanently truncated after 20 sessions. |
| 4 | Mission Control simulated sparklines | **CONFIRMED** | `useMissionControlSnapshot.ts:134-140` — sparkline is `[momentum-5, momentum-2, momentum, momentum±2, momentum±5]`. Confidence hardcoded `87` at line 151. |
| 5 | Brain Engine lacks Finance | **CONFIRMED** | `domainSignals.ts` has no `getFinanceOSSignals()`. `systemEngine.ts:12-19` only calls Mind, Execution, Fitness, Time, Learning. `current_day_snapshot` view has NO finance columns. |
| 6 | Data Lab excludes Learning | **CONFIRMED & EXPANDED** | Learning excluded from `correlation.ts`, `streaks.ts`, `drift.ts`, `consistency.ts`, `insights.ts`, `systemHealth.ts`, `overview.ts` transforms, `ContributionCalendar.tsx`. Finance also excluded from `insights.ts` and `toBehaviorTimelineRows`. Hardcoded `/6 systems` instead of `/7`. |
| 7 | Smoke validation targets retired tables | **CONFIRMED** | `run-smoke-validation.mjs` references `programming_skills`, `milestones`, `challenges`, `personal_skills` (dropped), domain `'progress-hub'` (invalid). |
| 8 | Phantom database types | **CONFIRMED & EXPANDED** | `workout_sets` NEVER created in any migration. `finance_transactions` dropped. Additionally: 9+ column-level discrepancies (`tasks.description`, `goals.deleted_at`, `weekly_plans.outcomes/reflection`, `system_metrics` phantom columns, etc.). |
| 9 | Advanced Learning OS schema | **RECLASSIFIED** | `learning_milestones`, `learning_projects`, `learning_reflections` are actively created in migrations AND have query hooks (`useLearningOS.ts:146-210`) with event taxonomy entries. Category D: backend capability awaiting full UI integration. |
| 10 | Evening Sync data stranding | **CONFIRMED** | `useEveningSync.ts:97-105` — strict date bounds. No `onSuccess` cache invalidation. Also: `SYSTEM_EVENING_SYNC_COMPLETED` event is defined in taxonomy but never emitted. |
| 11 | Volatile `pendingEventsCount` | **CONFIRMED** | `EndOfDayCard.tsx:78` reads `useEventBus((s) => s.recentEvents.length)` — volatile Zustand. |
| 12 | Momentum trend bias | **CONFIRMED** | `analyzeMomentum.ts:104-107` — compares boosted today vs raw yesterday (asymmetric). |
| 13 | `timeUtils.ts` timezone reparse | **REVISED** | File is only 6 lines. `isPastWednesdayInIndia()` reparses locale string. Blast radius limited to fitness urgency detection. |
| 14 | Documentation drift | **CONFIRMED — EXTENSIVE** | 9 doc files contain Progress Hub references. `EVENT_TAXONOMY.md` lists 12 deleted Progress Hub events, missing all 9 Learning OS events. |

### Critical Finding NOT in Original Audit

**A) Finance OS event taxonomy inconsistency:** `useFinance.ts:394` logs events with `eventType: 'FINANCE_TRANSACTION_LOGGED'` — NOT in `eventTaxonomy.ts`. The canonical name is `'finance.transaction.created'`. Finance creation events are invisible to any taxonomy-aware system.

**B) `telemetryHealth.ts` downstream breakage:** This module (Data Lab telemetry tab) compares active events from `data_lab_event_coverage_30d` against `Object.values(EVENT_TYPES)`. Because most emissions use legacy snake_case names, almost all dot-notation taxonomy events appear "silent", causing telemetry health scores to report **false degradation**.

**C) Time OS event naming:** `useTimeLogs.ts:417,459` emits `eventType: 'TIME_LOGGED'` (SCREAMING_SNAKE) via `logEventSafe()` — neither legacy snake_case nor canonical dot-notation.

---

## 3. Target System Integrity Architecture

### Current Architecture (Verified)

```
┌─────────────────── CURRENT DUAL-PIPELINE ──────────────────────────┐
│                                                                     │
│  User Action                                                        │
│       │                                                             │
│       ├──→ Feature Mutation ──→ logEventSafe()                      │
│       │    26/45 use legacy snake_case literals                      │
│       │    (e.g. 'task_created', 'habit_logged_done')               │
│       │    Only 19/45 use canonical taxonomy constants               │
│       │              │                                              │
│       │              ↓                                              │
│       │        events table                                         │
│       │              │                                              │
│       │              ↓                                              │
│       │     SQL Views (hardcode 'task_created',                     │
│       │      'task_status_updated' — match legacy names)            │
│       │              │                                              │
│       │              ├──→ Data Lab ──→ Behavioral Analytics         │
│       │              │    (excludes Learning from 8 subsystems)     │
│       │              │    (excludes Finance from insights/timeline) │
│       │              │                                              │
│       │              └──→ telemetryHealth.ts                        │
│       │                   (false degradation — compares against     │
│       │                    taxonomy values but emissions use        │
│       │                    legacy names)                            │
│       │                                                             │
│       └──→ emitEvent() ──→ system_event_queue                       │
│              (4 SCREAMING_SNAKE types)                              │
│              (Date-bounded sync ──→ system_metrics)                 │
│              (No cache invalidation on success)                     │
│                                                                     │
│  Mission Control                                                    │
│       ├── sparkline: SYNTHESIZED (momentum ± offsets)               │
│       ├── confidence: HARDCODED 87                                  │
│       └── pendingEvents: VOLATILE Zustand (resets on reload)        │
│                                                                     │
│  Brain Engine                                                       │
│       ├── Mind, Execution, Fitness, Time, Learning signals ✓        │
│       └── Finance signals ✗ MISSING                                 │
│                                                                     │
│  Verification: ✗ TARGETS DROPPED TABLES                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Target Architecture

```
┌─────────────────── TARGET UNIFIED ARCHITECTURE ────────────────────┐
│                                                                     │
│  User Action                                                        │
│       └──→ Feature Mutation ──→ logEventSafe()                      │
│            ALL 45 emitters use eventTaxonomy.ts constants            │
│                      │                                              │
│                      ↓                                              │
│                events table                                         │
│                      │                                              │
│                      ↓                                              │
│             SQL Views (compatible with both legacy                  │
│              AND canonical names via OR/CASE mapping)               │
│                      │                                              │
│                      ├──→ current_day_snapshot (+ Finance columns)  │
│                      ├──→ current_day_snapshot_history_14d          │
│                      ├──→ data_lab_daily_activity_90d               │
│                      ├──→ data_lab_weekly_system_score_12w          │
│                      └──→ data_lab_module_consistency_30d           │
│                                                                     │
│  Data Lab Behavioral Analytics                                      │
│       └── ALL 7 domains in: correlation, streaks, drift,           │
│           consistency, insights, systemHealth, timeline, calendar   │
│                                                                     │
│  Brain Engine ──→ ALL 6 domain signals (+ Finance)                  │
│       └── Momentum trend: symmetric comparison (no boost bias)      │
│                                                                     │
│  Mission Control                                                    │
│       ├── sparkline: REAL from history_14d EMA series               │
│       ├── confidence: COMPUTED from data quality signals            │
│       └── pendingEvents: DB-authoritative query                     │
│                                                                     │
│  Evening Sync                                                       │
│       ├── Processes ALL pending events (no date bounds)             │
│       └── Cache invalidation on success                             │
│                                                                     │
│  Verification: Tests ALL active domains                              │
│  Types: Regenerated from live schema (no phantoms)                  │
│  Documentation: Matches reality                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Dependency Graph

```
                    ┌─────────────────────────┐
                    │  Canonical Event         │
                    │  Taxonomy + Emitter      │
                    │  Alignment (A1)          │
                    └───────────┬──────────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                     │
    ┌──────▼──────┐   ┌────────▼─────────┐   ┌──────▼──────┐
    │ SQL View     │   │ Data Lab         │   │ Brain Engine │
    │ Compatibility│   │ Learning/Finance │   │ Finance +    │
    │ (A6)         │   │ Expansion (A3)   │   │ Momentum Fix │
    │              │   │                  │   │ (A4)          │
    └──────┬───────┘   └─────────┬────────┘   └──────┬───────┘
           │                     │                    │
           └──────────┬──────────┘                    │
                      │                               │
           ┌──────────▼──────────┐         ┌──────────▼──────┐
           │ Mission Control     │         │ Legacy Cleanup   │
           │ Real Data (A5)      │         │ (A8)             │
           └─────────────────────┘         └─────────────────┘
                      │
           ┌──────────▼──────────┐
           │ Documentation       │
           │ Sync (A9)           │
           └─────────────────────┘
```

### Independent Streams (Parallel from Wave 1)

```
├── A2: Evening Sync fixes — isolated to system/api + store + EndOfDayCard
├── A7: Smoke validation rewrite — isolated to scripts/smoke/
└── Both independent of A1 telemetry work (no file overlap)
```

### Critical Path

```
A1 (Event Taxonomy) → A6 (SQL Compatibility) → A5 (Mission Control Real Data)
                    → A4 (Brain Engine Finance) → A5 (consumes momentum changes)
```

---

## 5. Parallelization Matrix

| Agent | Responsibility | Can Run In Parallel With | Must Wait For | Shared Files | Risk |
|---|---|---|---|---|---|
| **A1: Telemetry Integrity** | Fix 26 broken emitters, align taxonomy | A2, A7 | Nothing (Wave 1) | `eventTaxonomy.ts` (owns) | **HIGH** |
| **A2: Evening Sync & Queue** | Fix stranding, volatile counter, cache invalidation | A1, A7 | Nothing (Wave 1) | `useEventBus.ts` (owns) | MEDIUM |
| **A3: Data Lab Intelligence** | Add Learning+Finance to 8 subsystems | A4 | A1 complete | `correlation.ts`, `streaks.ts`, `drift.ts` + 5 more (owns) | LOW |
| **A4: Brain Engine Integration** | Finance signals, momentum fix, timezone fix | A3, A6 | A1 complete | `domainSignals.ts`, `analyzeMomentum.ts` (owns) | MEDIUM |
| **A5: Mission Control Reality** | Replace sparkline/confidence simulation | — | A4 complete | `useMissionControlSnapshot.ts` (owns) | MEDIUM |
| **A6: SQL & Database** | View compatibility, indexes, type regen | A3, A4 | A1 complete | migrations (owns), `database.types.ts` (owns) | **HIGH** |
| **A7: Verification & Smoke** | Rebuild smoke for active architecture | A1, A2 | Nothing (Wave 1) | `run-smoke-validation.mjs` (owns) | LOW |
| **A8: Legacy Cleanup** | Remove phantom refs, dead fallbacks | — | A6 complete | `useFinance.ts` (owns) | MEDIUM |
| **A9: Documentation Sync** | Rewrite all docs | — | ALL complete | `Docs/*.md` (owns) | LOW |

---

## 6. File Ownership Matrix

### A1: Telemetry Integrity

| Category | Files |
|---|---|
| **OWNS** | `src/lib/eventTaxonomy.ts`, `src/lib/events.ts`, `src/lib/useEventsAnalytics.ts` |
| **MODIFIES (event type strings only)** | `src/features/mind-os/api/useHabits.ts`, `src/features/mind-os/api/useJournal.ts`, `src/features/productivity-hub/api/useTasks.ts`, `src/features/productivity-hub/api/usePlanning.ts`, `src/features/fitness-os/api/useFitness.ts`, `src/features/time-os/api/useTimeLogs.ts`, `src/features/finance-os/api/useFinance.ts` |
| **READ ONLY** | `src/store/useEventBus.ts`, SQL migrations, `src/features/data-lab/metrics/telemetryHealth.ts` |
| **DO NOT TOUCH** | SQL migrations, UI components, Brain Engine, Data Lab metrics, Mission Control |

### A2: Evening Sync & Queue

| Category | Files |
|---|---|
| **OWNS** | `src/features/system/api/useEveningSync.ts`, `src/store/useEventBus.ts`, `src/features/mission-control/components/EndOfDayCard.tsx` |
| **READ ONLY** | `src/features/system/api/useSystemStatus.ts` |
| **DO NOT TOUCH** | `eventTaxonomy.ts`, Brain Engine, Data Lab, SQL migrations |

### A3: Data Lab Intelligence

| Category | Files |
|---|---|
| **OWNS** | `src/features/data-lab/metrics/correlation.ts`, `streaks.ts`, `drift.ts`, `consistency.ts`, `insights.ts`, `systemHealth.ts`, `src/features/data-lab/transforms/overview.ts`, `src/features/data-lab/components/charts/ContributionCalendar.tsx`, `src/features/data-lab/components/RecentActivityLog.tsx`, `src/features/learning-os/api/useLearningOS.ts` (limit fix), `src/features/learning-os/pages/AnalyticsPage.tsx` |
| **READ ONLY** | `src/features/data-lab/api/useDataLab.ts`, `src/features/data-lab/types/types.ts` |
| **DO NOT TOUCH** | Mission Control, Brain Engine, event taxonomy, SQL migrations |

### A4: Brain Engine Integration

| Category | Files |
|---|---|
| **OWNS** | `src/features/system/engine/domainSignals.ts`, `analyzeMomentum.ts`, `generateDirectives.ts`, `timeUtils.ts`, `types.ts`, `systemEngine.ts` |
| **READ ONLY** | `src/features/system/api/useSystemStatus.ts`, `src/features/finance-os/api/useFinance.ts` |
| **DO NOT TOUCH** | Mission Control components, event taxonomy, Data Lab, SQL migrations |

### A5: Mission Control Reality

| Category | Files |
|---|---|
| **OWNS** | `src/features/mission-control/api/useMissionControlSnapshot.ts`, `src/features/mission-control/components/BrainEngineHero.tsx`, `src/features/mission-control/types/snapshot.ts`, `src/features/mission-control/utils/systemHealthEvaluator.ts`, `src/features/mission-control/dashboard/MissionControl.tsx` |
| **READ ONLY** | `src/features/system/engine/types.ts`, `src/features/system/api/useSystemStatus.ts` |
| **DO NOT TOUCH** | Brain Engine logic, EndOfDayCard sync, Data Lab |

### A6: SQL & Database Integrity

| Category | Files |
|---|---|
| **OWNS** | New migration files in `supabase/migrations/`, `src/types/database.types.ts` (regeneration) |
| **READ ONLY** | All existing migrations, `src/lib/eventTaxonomy.ts`, all `api/` hooks |
| **DO NOT TOUCH** | Application source code (except `database.types.ts`), existing migration files |

### A7: Verification & Smoke

| Category | Files |
|---|---|
| **OWNS** | `scripts/smoke/run-smoke-validation.mjs` |
| **READ ONLY** | All domain API hooks, `src/App.tsx`, event taxonomy, migrations |
| **DO NOT TOUCH** | Application source code, database schema |

### A8: Legacy Cleanup

| Category | Files |
|---|---|
| **OWNS** | `src/features/finance-os/api/useFinance.ts` (remove fallbacks), `src/features/productivity-hub/planning/PlanningPage.tsx` (remove `'progress-hub'`) |
| **READ ONLY** | `src/types/database.types.ts` (after A6 regeneration) |
| **DO NOT TOUCH** | SQL migrations, event taxonomy, Brain Engine |

### A9: Documentation Sync

| Category | Files |
|---|---|
| **OWNS** | All `Docs/*.md`, `README.md` |
| **READ ONLY** | Entire `src/` directory, all migrations |
| **DO NOT TOUCH** | Any application source code or configuration |

---

## 7. Agent Work Packages

### LOS-INTEGRITY-001 — Telemetry Truth

**Agent:** A1 — Telemetry Integrity
**Objective:** Align all 45 event emitters to use canonical `eventTaxonomy.ts` constants

**Why It Matters:**
26 of 45 emitters use legacy snake_case string literals instead of taxonomy constants. This causes: (a) SQL views that hardcode legacy names will work today but drift as taxonomy evolves, (b) `telemetryHealth.ts` falsely reports degradation because emitted names don't match taxonomy values, (c) `data_lab_event_coverage_30d` shows events by their legacy names which don't align with documentation.

**Dependencies:** None — foundation work

**Files Owned/Modified:** `eventTaxonomy.ts`, `events.ts`, `useEventsAnalytics.ts`, plus 7 domain API hooks (event type strings only)

**Implementation Requirements:**

1. **Replace all 26 legacy string literals** with taxonomy constants. Complete mapping (verified via subagent research):

   | File | Line | Current | Replace With |
   |---|---|---|---|
   | `useHabits.ts` | 582 | `'habit_created'` | `MIND_HABIT_CREATED` |
   | `useHabits.ts` | 620 | `'habit_logged_done'` | `MIND_HABIT_COMPLETED` |
   | `useHabits.ts` | 648 | `'habit_marked_not_done'` | `MIND_HABIT_UNCOMPLETED` |
   | `useHabits.ts` | 876 | `'habit_break_healed'` | `MIND_HABIT_BREAK_HEALED` |
   | `useJournal.ts` | 173 | `'journal_entry_created'` | `MIND_JOURNAL_ENTRY_CREATED` |
   | `useTasks.ts` | 126 | `'task_created'` | `PRODUCTIVITY_TASK_CREATED` |
   | `useTasks.ts` | 159 | `'task_status_updated'` | `PRODUCTIVITY_TASK_STATUS_CHANGED` |
   | `usePlanning.ts` | 219 | `'weekly_plan_created'` | `PRODUCTIVITY_WEEKLY_PLAN_CREATED` |
   | `usePlanning.ts` | 248 | `'weekly_plan_updated'` | `PRODUCTIVITY_WEEKLY_PLAN_UPDATED` |
   | `usePlanning.ts` | 302 | `'goal_created'` | `PRODUCTIVITY_GOAL_CREATED` |
   | `usePlanning.ts` | 330 | `'goal_status_updated'` | `PRODUCTIVITY_GOAL_STATUS_CHANGED` |
   | `usePlanning.ts` | 403 | `'weekly_plan_item_created'` | `PRODUCTIVITY_WEEKLY_PLAN_ITEM_CREATED` |
   | `usePlanning.ts` | 443 | `'weekly_plan_item_updated'` | `PRODUCTIVITY_WEEKLY_PLAN_ITEM_UPDATED` |
   | `usePlanning.ts` | 497 | `'weekly_review_upserted'` | `PRODUCTIVITY_WEEKLY_REVIEW_UPSERTED` |
   | `useFitness.ts` | 609 | `'workout_created'` | `FITNESS_WORKOUT_CREATED` |
   | `useFitness.ts` | 652 | `'workout_started'` | `FITNESS_WORKOUT_STARTED` |
   | `useFitness.ts` | 688 | `'workout_completed'` | `FITNESS_WORKOUT_COMPLETED` |
   | `useFitness.ts` | 722 | `'workout_updated'` | `FITNESS_WORKOUT_UPDATED` |
   | `useFitness.ts` | 793 | `'fitness_exercise_created'` | `FITNESS_EXERCISE_CREATED` |
   | `useFitness.ts` | 823 | `'fitness_exercise_updated'` | `FITNESS_EXERCISE_UPDATED` |
   | `useFitness.ts` | 850 | `'fitness_exercise_deleted'` | `FITNESS_EXERCISE_DELETED` |
   | `useFitness.ts` | 908 | `'exercise_log_created'` | `FITNESS_EXERCISE_LOG_CREATED` |
   | `useFitness.ts` | 946 | `'exercise_log_updated'` | `FITNESS_EXERCISE_LOG_UPDATED` |
   | `useFitness.ts` | 977 | `'exercise_log_deleted'` | `FITNESS_EXERCISE_LOG_DELETED` |
   | `useTimeLogs.ts` | 208 | `'task_status_updated'` | `PRODUCTIVITY_TASK_STATUS_CHANGED` |
   | `useTimeLogs.ts` | 417,459 | `'TIME_LOGGED'` | `TIME_SESSION_LOGGED` |
   | `useFinance.ts` | 394 | `'FINANCE_TRANSACTION_LOGGED'` | `FINANCE_TRANSACTION_CREATED` |

2. **Add missing taxonomy imports** to each file that currently uses string literals.

3. **Produce a canonical event catalog** documenting every event type, its legacy name (for SQL view compatibility), and which files emit it.

**Critical Interaction with SQL Views:**
The SQL views `current_day_snapshot_history_14d` and `data_lab_daily_activity_90d` hardcode `'task_created'` and `'task_status_updated'`. After this change, new events will use `'productivity.task.created'` and `'productivity.task.status_changed'`. **A6 MUST update SQL views to recognize both names** — otherwise task analytics will stop counting new events.

**Explicit Non-Goals:**
- Do NOT modify SQL views (A6 handles that)
- Do NOT change the `useEventBus` pipeline types (they are operational signals, not analytics events)
- Do NOT change any mutation logic beyond event type strings

**Acceptance Criteria:**
- Zero hardcoded event type strings outside `eventTaxonomy.ts`
- Every `logEventSafe()` call uses an imported constant
- `npx tsc --noEmit` passes
- Canonical event catalog document produced

**Handoff Contract:**
- Legacy → canonical name mapping table for A6 SQL compatibility
- List of affected files for integration checkpoint

---

### LOS-INTEGRITY-002 — Evening Sync Fix

**Agent:** A2
**Objective:** Fix data stranding, volatile counter, and missing cache invalidation

**Files Owned:** `useEveningSync.ts`, `useEventBus.ts`, `EndOfDayCard.tsx`

**Implementation Requirements:**
1. Remove date-bounded query in `useEveningSync.ts:97-105` — process ALL pending events
2. Add `onSuccess` cache invalidation for `['system-status']`
3. Replace volatile `pendingEventsCount` in `EndOfDayCard.tsx:78` with DB-authoritative count query
4. Emit `SYSTEM_EVENING_SYNC_COMPLETED` event on successful sync (it's defined but never used)

**Acceptance Criteria:**
- Sync processes all pending events regardless of date
- Cache invalidated on success
- Pending count reflects DB state after reload

---

### LOS-INTEGRITY-003 — Data Lab Completeness

**Agent:** A3
**Objective:** Include Learning OS in all 8 missing Data Lab subsystems; include Finance in missing subsystems; fix Learning OS analytics truncation

**Files Owned:** `correlation.ts`, `streaks.ts`, `drift.ts`, `consistency.ts`, `insights.ts`, `systemHealth.ts`, `transforms/overview.ts`, `ContributionCalendar.tsx`, `RecentActivityLog.tsx`, `useLearningOS.ts`, `AnalyticsPage.tsx`

**Implementation Requirements:**

1. Add Learning extractor to: `correlation.ts` (`METRIC_EXTRACTORS`), `streaks.ts` (`STREAK_EXTRACTORS`), `drift.ts` (`DRIFT_EXTRACTORS`), `consistency.ts` (`MODULE_EXTRACTORS`)
2. Add Learning + Finance to: `insights.ts` (`modules` and `driftModules` arrays), `systemHealth.ts` (`MODULE_DOMAIN_MAP`)
3. Add Learning + Finance columns to: `transforms/overview.ts` (`toBehaviorTimelineRows`)
4. Update `ContributionCalendar.tsx` — `/7 systems` instead of `/6`, add Learning badge
5. Update `RecentActivityLog.tsx` — `/7` instead of `/6`
6. Fix `useLearningOS.ts:129` — remove `.limit(20)` from analytics path. Create separate `useSessionAnalytics()` hook for aggregation without limit. Keep `useRecentSessionLogs()` for display with reasonable limit (50).
7. Update `AnalyticsPage.tsx` to use new analytics hook for aggregate metrics.

**Acceptance Criteria:**
- All 7 domains represented in correlation, streaks, drift, consistency, insights, systemHealth
- Learning OS lifetime study hours reflect ALL sessions (no truncation)
- `active_system_count` displays `/7` not `/6`

---

### LOS-INTEGRITY-004 — Brain Engine Finance + Fixes

**Agent:** A4
**Objective:** Add Finance OS signals, fix momentum trend bias, fix timezone reparse

**Files Owned:** `domainSignals.ts`, `analyzeMomentum.ts`, `generateDirectives.ts`, `timeUtils.ts`, `types.ts`, `systemEngine.ts`

**Implementation Requirements:**

1. **Add `getFinanceOSSignals()`** — signals for budget overrun (>90% critical, >75% warning), want-spending detection
2. **Update `CurrentDaySnapshot` type** with Finance fields (coordinate with A6 to add to SQL view)
3. **Update `collectDomainSignals()`** to include Finance
4. **Add `'finance'` to `DirectiveDomain`** and `UrgencyScores`; add finance urgency scoring and directive generation
5. **Fix momentum trend bias** in `analyzeMomentum.ts:104-107`: compute `delta` from raw EMA values (pre-boost), apply boosts to display score only
6. **Fix `timeUtils.ts`**: replace `new Date(toLocaleString(...))` reparse with `Intl.DateTimeFormat` weekday extraction
7. **Expose `emaSeries: number[]`** from `analyzeMomentum()` for Mission Control sparkline consumption

**Acceptance Criteria:**
- Finance signals generated from snapshot data
- Momentum trend comparison is symmetric
- `isPastWednesdayInIndia()` uses Intl API directly
- `MomentumAnalysis` includes `emaSeries` for sparkline data

---

### LOS-INTEGRITY-005 — Mission Control Reality

**Agent:** A5
**Objective:** Replace all simulated/mocked data with real system history

**Files Owned:** `useMissionControlSnapshot.ts`, `BrainEngineHero.tsx`, `snapshot.ts`, `systemHealthEvaluator.ts`, `MissionControl.tsx`

**Dependencies:** A4 must expose `emaSeries` from momentum analysis

**Implementation Requirements:**
1. Replace sparkline synthesis (`useMissionControlSnapshot.ts:134-140`) with real EMA series from A4's `emaSeries`
2. Replace hardcoded confidence `87` with computed data quality score (freshness + completeness + signal coverage)
3. Remove all `// Mock` and `// Mocking` comments
4. Update `BrainState` type if shape changes

**Acceptance Criteria:**
- Sparkline displays real historical momentum from 14-day history
- Confidence computed from data quality, not hardcoded
- No mock comments remain

---

### LOS-INTEGRITY-006 — SQL & Database

**Agent:** A6
**Objective:** SQL view compatibility, Finance snapshot columns, missing indexes, type regeneration

**Files Owned:** New migrations in `supabase/migrations/`, `src/types/database.types.ts`

**Implementation Requirements:**

1. **SQL view compatibility migration:** Update `current_day_snapshot_history_14d` and `data_lab_daily_activity_90d` task CTEs to recognize both legacy names (`'task_created'`, `'task_status_updated'`) AND canonical names (`'productivity.task.created'`, `'productivity.task.status_changed'`) via `IN (...)` or `OR` clauses. **Never rename historical records.**

2. **Add Finance columns to `current_day_snapshot`:** Budget utilization, want spending total, finance entries count (from `transactions` table)

3. **Create 13 missing B-tree indexes** on foreign keys (list verified by database subagent)

4. **Regenerate `database.types.ts`** — eliminate `workout_sets`, `finance_transactions`, and 9+ column discrepancies

**Acceptance Criteria:**
- SQL views count both legacy and canonical event names for task analytics
- `current_day_snapshot` includes Finance columns
- 13 FK indexes created
- `database.types.ts` matches actual schema

---

### LOS-INTEGRITY-007 — Verification Rebuild

**Agent:** A7
**Objective:** Rebuild smoke tests for active architecture

**Files Owned:** `scripts/smoke/run-smoke-validation.mjs`

**Implementation Requirements:**
1. Remove all Progress Hub test flows (lines ~443-638)
2. Add: Learning OS (roadmap → stage → session → log), Fitness OS, Time OS, Finance OS test flows
3. Update domain constraints (remove `'progress-hub'`)
4. Verify events use canonical taxonomy names
5. Add SQL view verification queries
6. Add cleanup

---

### LOS-INTEGRITY-008 — Legacy Cleanup

**Agent:** A8
**Objective:** Remove dead fallback paths and phantom references from executable code

**Files Owned:** `useFinance.ts`, `PlanningPage.tsx`

**Implementation Requirements:**
1. Remove `'finance_transactions'` from `TRANSACTION_TABLE_CANDIDATES` and all associated fallback logic in `useFinance.ts`
2. Remove `'progress-hub': 'Progress Hub'` from `PlanningPage.tsx:38`
3. Verify no other executable phantom references

---

### LOS-INTEGRITY-009 — Documentation Sync

**Agent:** A9
**Objective:** Rewrite all documentation to match actual architecture

**Files Owned:** All `Docs/*.md`, `README.md`

**Dependencies:** ALL other agents complete

**Implementation Requirements:**
1. Replace all Progress Hub references with Learning OS
2. Update table inventories, route listings, event taxonomies, query keys
3. Rename `LIFE_OS_CURRENT_STATE_AUDIT.md` → `LIFE_OS_AUDIT_2026_08.md` with archive header
4. Sync `EVENT_TAXONOMY.md` with `eventTaxonomy.ts` (remove 12 deleted Progress Hub events, add 9 Learning OS events)

---

## 8. Recommended Agent Prompts

### A1: Telemetry Integrity Agent

```
You are the Telemetry Integrity Agent for Life OS.

MISSION: Align all 45 event emitters to use canonical eventTaxonomy.ts constants.

CRITICAL CONTEXT:
- 26 of 45 logEventSafe() calls use legacy snake_case string literals instead of taxonomy constants
- SQL views hardcode 'task_created' and 'task_status_updated' — A6 will handle SQL compatibility
- telemetryHealth.ts compares against taxonomy values — fixing emitters will fix false degradation
- useFinance.ts:394 uses 'FINANCE_TRANSACTION_LOGGED' which isn't in taxonomy
- useTimeLogs.ts:417,459 uses 'TIME_LOGGED' which isn't in taxonomy

YOUR FILES (modify):
- src/lib/eventTaxonomy.ts (own)
- src/lib/events.ts (own)
- src/lib/useEventsAnalytics.ts (own)
- 7 domain API hooks: useHabits.ts, useJournal.ts, useTasks.ts, usePlanning.ts, useFitness.ts, useTimeLogs.ts, useFinance.ts (event type strings ONLY)

EXACT CHANGES REQUIRED:
[See the 26-row mapping table in LOS-INTEGRITY-001]

For each file:
1. Import the required taxonomy constants from '../../../lib/eventTaxonomy' (or correct relative path)
2. Replace the string literal with the constant
3. Do NOT change any other logic

VERIFY: npx tsc --noEmit && npx eslint src/lib/ src/features/

PRODUCE: Canonical event catalog with legacy → canonical name mapping for the SQL agent.

DO NOT: Modify SQL views, UI components, Brain Engine, useEventBus.ts, or any mutation logic beyond event type strings.
```

### A2: Evening Sync Agent

```
You are the Evening Sync Agent for Life OS.

MISSION: Fix data stranding, volatile counter, and missing cache invalidation.

YOUR FILES:
- src/features/system/api/useEveningSync.ts
- src/store/useEventBus.ts
- src/features/mission-control/components/EndOfDayCard.tsx

CHANGES:
1. useEveningSync.ts:97-105 — Remove date bounds (.gte/.lt on created_at). Fetch ALL pending events for user.
2. useEveningSync.ts:173-175 — Add onSuccess: invalidate ['system-status'] query key (import useQueryClient).
3. EndOfDayCard.tsx:78 — Replace useEventBus((s) => s.recentEvents.length) with a useQuery that counts rows in system_event_queue for current user.
4. After sync completes, emit SYSTEM_EVENING_SYNC_COMPLETED via logEventSafe (it's defined in taxonomy but never used).

DO NOT: Change event taxonomy, Brain Engine, Data Lab, or SQL migrations.
VERIFY: npx tsc --noEmit
```

### A3: Data Lab Intelligence Agent

```
You are the Data Lab Intelligence Agent for Life OS.

MISSION: Include Learning OS + Finance in all missing Data Lab subsystems. Fix Learning OS analytics truncation.

YOUR FILES (13 files):
- src/features/data-lab/metrics/correlation.ts — Add { label: 'Learning', getValue: (r) => r.learning_sessions_logged }
- src/features/data-lab/metrics/streaks.ts — Add { name: 'Learning', isActive: (r) => r.learning_sessions_logged > 0 }
- src/features/data-lab/metrics/drift.ts — Add { name: 'Learning', getValue: (r) => r.learning_sessions_logged }
- src/features/data-lab/metrics/consistency.ts — Add Learning module extractor
- src/features/data-lab/metrics/insights.ts — Add 'Learning' and 'Finance' to modules AND driftModules arrays
- src/features/data-lab/metrics/systemHealth.ts — Add 'Learning OS': 'learning-os' to MODULE_DOMAIN_MAP
- src/features/data-lab/transforms/overview.ts — Add Learning + Finance to toBehaviorTimelineRows
- src/features/data-lab/components/charts/ContributionCalendar.tsx — Change /6 to /7, add learning badge
- src/features/data-lab/components/RecentActivityLog.tsx — Change /6 to /7
- src/features/learning-os/api/useLearningOS.ts — Remove .limit(20) from analytics path; create useSessionAnalytics()
- src/features/learning-os/pages/AnalyticsPage.tsx — Use new analytics hook for aggregates

DO NOT: Modify SQL views, Mission Control, Brain Engine, or event taxonomy.
VERIFY: npx tsc --noEmit
```

### A4: Brain Engine Agent

```
You are the Brain Engine Integration Agent for Life OS.

MISSION: Add Finance OS signals, fix momentum trend bias, fix timezone reparse, expose EMA series.

YOUR FILES:
- src/features/system/engine/domainSignals.ts — Add getFinanceOSSignals()
- src/features/system/engine/analyzeMomentum.ts — Fix trend bias (L104-107), expose emaSeries
- src/features/system/engine/generateDirectives.ts — Add finance urgency + directive
- src/features/system/engine/timeUtils.ts — Fix reparse
- src/features/system/engine/types.ts — Add finance to types, emaSeries to MomentumAnalysis
- src/features/system/engine/systemEngine.ts — Call getFinanceOSSignals()

KEY FIXES:
1. Momentum trend: delta = latestMomentum - previousDayMomentum (pre-boost), then apply boosts to display only
2. timeUtils: Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(new Date())
3. MomentumAnalysis: add optional emaSeries: number[] for Mission Control sparkline
4. Finance signals: Check CurrentDaySnapshot for finance data. Coordinate with A6 on column availability.

DO NOT: Modify Mission Control, Data Lab, event taxonomy, or SQL migrations.
VERIFY: npx tsc --noEmit
```

### A5: Mission Control Reality Agent

```
You are the Mission Control Reality Agent for Life OS.

MISSION: Replace synthesized sparkline and hardcoded confidence with real data.

YOUR FILES:
- src/features/mission-control/api/useMissionControlSnapshot.ts
- src/features/mission-control/types/snapshot.ts
- src/features/mission-control/components/BrainEngineHero.tsx

DEPENDS ON: A4 exposing emaSeries in MomentumAnalysis.

KEY CHANGES:
1. L134-140: Replace sparkline synthesis with systemData.momentum.emaSeries (last N values)
2. L151: Replace confidence: 87 with computed score:
   - Data freshness (today's snapshot exists? 100 : 50)
   - Completeness (history days with data / 14 * 100)
   - Coverage (non-zero domain signals / total domains * 100)
   - confidence = weighted average
3. Remove all // Mock and // Mocking comments

DO NOT: Modify Brain Engine, EndOfDayCard sync, Data Lab, or event taxonomy.
VERIFY: npx tsc --noEmit
```

### A6: SQL Agent

```
You are the SQL & Database Integrity Agent for Life OS.

MISSION: SQL view compatibility, Finance snapshot columns, indexes, type regeneration.

YOUR FILES:
- NEW migration files in supabase/migrations/ (NEVER modify existing)
- src/types/database.types.ts (regeneration)

KEY CHANGES:
1. Update task CTEs in current_day_snapshot_history_14d and data_lab_daily_activity_90d:
   WHERE event_type IN ('task_created', 'productivity.task.created')
   AND WHERE event_type IN ('task_status_updated', 'productivity.task.status_changed')
2. Add Finance CTE to current_day_snapshot view (total_spent, want_spent, finance_entries from transactions)
3. Create 13 missing FK indexes
4. Regenerate database.types.ts

DO NOT: Modify existing migrations. Do NOT rename historical event records.
```

### A7, A8, A9: (Prompts follow same pattern — see work packages above)

---

## 9. Execution Waves

### WAVE 0 — Baseline (15 min)

- Verify clean build: `npx tsc --noEmit && npx eslint .`
- Create git tag: `pre-integrity-campaign`
- Document canonical event taxonomy baseline

---

### WAVE 1 — Foundation (Parallel: A1, A2, A7)

| Agent | Scope | File Overlap |
|---|---|---|
| A1 | Fix 26 emitters + taxonomy alignment | `eventTaxonomy.ts`, 7 domain hooks |
| A2 | Evening Sync fixes | `useEveningSync.ts`, `useEventBus.ts`, `EndOfDayCard.tsx` |
| A7 | Smoke validation rewrite | `run-smoke-validation.mjs` |

**Zero file overlap between A1, A2, A7.** Safe parallel execution.

**Checkpoint W1:** Build passes. All emitters use taxonomy constants. Evening Sync processes all events. Smoke script targets active architecture.

---

### WAVE 2 — Domain Integration (Parallel: A3, A4, A6)

| Agent | Scope | File Overlap |
|---|---|---|
| A3 | Data Lab + Learning OS fix (13 files) | Data Lab metrics + Learning OS |
| A4 | Brain Engine Finance + fixes (6 files) | System engine files |
| A6 | SQL migrations + type regen | New migrations + database.types.ts |

**Zero file overlap between A3, A4, A6.** Coordination: A4↔A6 on Finance snapshot columns.

**Checkpoint W2:** Build passes. All 7 domains in Data Lab. Brain Engine has Finance. SQL views compatible. Types clean.

---

### WAVE 3 — Consumer Integration (Parallel: A5, A8)

| Agent | Scope | File Overlap |
|---|---|---|
| A5 | Mission Control reality (5 files) | Mission Control |
| A8 | Legacy cleanup (2 files) | Finance OS, Productivity Hub |

**Zero file overlap.** A5 depends on A4's momentum changes. A8 depends on A6's type regeneration.

**Checkpoint W3:** Sparkline real. Confidence computed. No phantom code references.

---

### WAVE 4 — Verification

Re-run smoke tests. Full build verification. Manual critical path verification.

---

### WAVE 5 — Documentation (A9)

Rewrite all docs after architecture stabilizes.

---

## 10. Integration Checkpoints

| Checkpoint | After | Question | Verification |
|---|---|---|---|
| **W1** | Wave 1 | Is telemetry truth established? | `grep -rn "eventType:" src/features/ \| grep -v eventTaxonomy \| grep -v node_modules` returns zero hardcoded strings |
| **W2** | Wave 2 | Do all 7 domains flow to analytics? | Data Lab correlation/streaks/drift extractors have 7 entries each. Brain Engine has Finance signals. |
| **W3** | Wave 3 | Does Mission Control show reality? | No `// Mock` comments in Mission Control files. `grep -rn "Mock\|Mocking\|HARDCODED\|hardcode" src/features/mission-control/` returns zero. |
| **W4** | Wave 4 | Does the system verify itself? | `node scripts/smoke/run-smoke-validation.mjs` passes. `npx tsc --noEmit && npx eslint .` passes. |
| **W5** | Wave 5 | Does documentation match code? | `grep -rni "progress.hub\|programming_skills\|personal_skills" Docs/ README.md` returns zero. |

---

## 11. Merge / Conflict Prevention Strategy

### Branch Architecture

```
main (tagged: pre-integrity-campaign)
 ├── integrity/w1-telemetry          (A1) ─┐
 ├── integrity/w1-evening-sync       (A2)  ├─ Merge Wave 1 → main
 ├── integrity/w1-smoke              (A7) ─┘
 │
 ├── integrity/w2-data-lab           (A3) ─┐
 ├── integrity/w2-brain-engine       (A4)  ├─ Merge Wave 2 → main
 ├── integrity/w2-sql-schema         (A6) ─┘
 │
 ├── integrity/w3-mission-control    (A5) ─┐
 ├── integrity/w3-legacy-cleanup     (A8) ─┤─ Merge Wave 3 → main
 │                                          │
 ├── integrity/w4-verification       (A7) ─┘─ Merge Wave 4 → main
 └── integrity/w5-documentation      (A9) ──── Merge Wave 5 → main
```

### Conflict Risk: Near Zero By Design

Every wave's agents own completely non-overlapping file sets. The only coordination point is **A4↔A6** (Finance snapshot columns) which is resolved via documentation handoff, not file-level merge.

### Merge Order Within Each Wave

Wave 1: A7 → A2 → A1 (A1 last because other agents may need rebasing against taxonomy changes)
Wave 2: A6 → A4 → A3 (A6 first because type regeneration may require import fixes)
Wave 3: A5 → A8 (no dependency)

---

## 12. Risk Register

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Changing 26 emitters breaks historical task analytics in SQL views | **HIGH** | **HIGH** | A6 adds `IN ('legacy_name', 'canonical_name')` to task CTEs. Never rename historical records. | A1 + A6 |
| `telemetryHealth.ts` behavior changes after emitter fix | MEDIUM | LOW | Expected improvement — false degradation will resolve. Document behavioral change. | A1 |
| Finance snapshot columns missing from SQL view | HIGH | MEDIUM | A4 and A6 coordinate column names before implementation. A4 uses graceful fallback if columns absent. | A4 + A6 |
| `database.types.ts` regeneration breaks TS compilation | MEDIUM | MEDIUM | Run `npx tsc --noEmit` immediately after. Fix type imports. | A6 |
| Momentum trend fix changes user-visible scores | MEDIUM | LOW | Restores correctness. Document the change. | A4 |
| Sparkline empty for new users | MEDIUM | LOW | Add fallback: flat line at 0 when history empty | A5 |
| Smoke tests require Supabase credentials | HIGH | MEDIUM | Ensure env has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` | A7 |
| `.limit(20)` removal causes performance issues | LOW | LOW | Monitor. Add SQL aggregation if sessions exceed 1000+. | A3 |
| `finance_transactions` fallback removal breaks if table exists | LOW | LOW | Table confirmed dropped. Fallback is dead code. | A8 |
| Evening Sync "process all" overwhelms with large queues | LOW | MEDIUM | Add batch limit (500) if needed | A2 |
| Parallel merge conflicts | **LOW** | HIGH | Zero file overlap within each wave by design | TPM |
| Learning OS milestones/projects/reflections lack Create UI | LOW | LOW | Explicitly out of scope — backend ready, UI is future work | — |

---

## 13. Definition of "System Integrity Complete"

### Telemetry (6 items)
- [ ] ONE canonical event taxonomy in `eventTaxonomy.ts`
- [ ] ALL 45 `logEventSafe()` calls use taxonomy constants
- [ ] Zero hardcoded event type strings outside taxonomy
- [ ] Finance OS creation uses `FINANCE_TRANSACTION_CREATED` constant
- [ ] Time OS logging uses `TIME_SESSION_LOGGED` constant
- [ ] `telemetryHealth.ts` accurately reflects coverage (no false degradation)

### Analytics & Data (5 items)
- [ ] No silent Learning OS truncation (`.limit(20)` removed from analytics path)
- [ ] Learning OS included in: correlation, streaks, drift, consistency, insights, systemHealth
- [ ] Finance included in: insights, behavior timeline
- [ ] SQL views handle both legacy and canonical event names
- [ ] Active system count displays `/7` not `/6`

### Intelligence (5 items)
- [ ] Brain Engine generates Finance OS domain signals
- [ ] Finance included in urgency scoring and directive generation
- [ ] Momentum trend comparison is symmetric (no boost bias)
- [ ] `isPastWednesdayInIndia()` does not reparse locale strings
- [ ] `MomentumAnalysis` exposes `emaSeries` for sparkline

### Mission Control (4 items)
- [ ] Sparkline from real `current_day_snapshot_history_14d` EMA data
- [ ] Confidence computed from data quality signals
- [ ] `pendingEventsCount` from DB, not volatile Zustand
- [ ] Zero `// Mock` comments in Mission Control code

### Evening Sync (3 items)
- [ ] Processes ALL pending events regardless of creation date
- [ ] Cache invalidation on success
- [ ] Emits `SYSTEM_EVENING_SYNC_COMPLETED` event

### Database (3 items)
- [ ] 13 missing FK indexes created
- [ ] `database.types.ts` regenerated from live schema
- [ ] No phantom tables (`workout_sets`, `finance_transactions`) in generated types

### Code Cleanliness (3 items)
- [ ] No executable references to `finance_transactions` table
- [ ] No executable references to `'progress-hub'` domain
- [ ] No executable references to `workout_sets`

### Verification (3 items)
- [ ] Smoke script runs against active architecture
- [ ] Tests cover all 7 domains
- [ ] Build + lint clean: `npx tsc --noEmit && npx eslint .`

### Documentation (2 items)
- [ ] All docs reflect actual architecture
- [ ] Zero Progress Hub phantom references

---

## 14. Winter Arc UI Boundary

**System Integrity Stream** (this plan) and **Winter Arc UI Stream** (separate) must remain independently parallelizable.

### Rules for Winter Arc UI Agents:
1. **MAY modify:** Component files, layout, CSS/Tailwind, visual rendering
2. **MUST NOT modify:** `api/` directories, `engine/` directories, `metrics/` directories, `store/` directories, `eventTaxonomy.ts`, `events.ts`, SQL migrations, `database.types.ts`
3. **Convergence point:** Mission Control — when integrity delivers real data and UI delivers Winter Arc design, they merge into **REAL + BEAUTIFUL**

---

## Self-Review Checklist

1. ✅ Multiple agents without same-file modifications? → YES (zero overlap within each wave)
2. ✅ Dependencies explicit? → YES (each work package)
3. ✅ Shared files controlled? → YES (ownership matrix)
4. ✅ Every task has acceptance criteria? → YES
5. ✅ Every task has verification? → YES
6. ✅ Root causes, not symptoms? → YES (canonical taxonomy, real data, symmetric math)
7. ✅ Telemetry single truth? → YES (A1 aligns all 45 emitters)
8. ✅ Data Lab complete? → YES (A3 adds Learning + Finance to 8 subsystems)
9. ✅ Mission Control reality? → YES (A5 replaces sparkline/confidence)
10. ✅ Brain Engine trusted signals? → YES (A4 adds Finance, fixes bias)
11. ✅ Verification current? → YES (A7 rebuilds smoke tests)
12. ✅ Documentation last? → YES (A9 in Wave 5)
13. ✅ Executable without chat context? → YES (full prompts, exact line numbers, complete mapping tables)
