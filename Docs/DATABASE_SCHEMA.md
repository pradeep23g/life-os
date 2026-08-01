# LIFE OS — DATABASE SCHEMA

This document describes the current database schema for Life OS. It reflects the state after all migrations in `supabase/migrations/` have been applied.

Source of truth: the migration files. This document provides a human-readable summary.

---

## Overview

All tables live in the `public` schema. Row Level Security (RLS) is enabled on all domain tables. The standard RLS policy is `auth.uid() = user_id`.

SQL views use `security_invoker = true` to inherit the calling user's RLS context.

---

## 1. Mind OS Tables

### `public.habits`

Tracks individual habits.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Habit name |
| `target_value` | `integer` | Daily completion target |
| `created_at` | `timestamptz` | Creation timestamp |
| `deleted_at` | `timestamptz` | Soft delete |

### `public.habit_logs`

Records daily habit completions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `habit_id` | `uuid` | References `habits.id` |
| `log_date` | `date` | IST-scoped date |
| `value` | `integer` | Completion value for the day |
| `created_at` | `timestamptz` | |

### `public.habit_break_heals`

Records habit break recovery context.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `habit_id` | `uuid` | References `habits.id` |
| `break_date` | `date` | Date of the break |
| `mistake_reason` | `text` | Why the habit was broken |
| `recovery_commitment` | `text` | Commitment for recovery |
| `healed_at` | `timestamptz` | When the heal was recorded |

### `public.journal_entries`

Multi-entry daily journal with mood and structured reflection.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `mood` | `integer` | 1–5 mood score |
| `created_at` | `timestamptz` | Entry timestamp (IST-scoped via view) |
| `deleted_at` | `timestamptz` | Soft delete |
| `went_well` | `text` | Legacy field (queued for removal) |
| `went_wrong` | `text` | Legacy field (queued for removal) |
| `lesson_learned` | `text` | Legacy field (queued for removal) |

---

## 2. Productivity Hub Tables

### `public.tasks`

Deadline-based task management.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Task title |
| `is_completed` | `boolean` | `NOT NULL DEFAULT false` |
| `deadline_type` | `text` | `same_day`, `no_deadline`, `specific_date` |
| `deadline_date` | `date` | Required when `deadline_type = 'specific_date'` |
| `created_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

**Constraints:**
- `tasks_deadline_type_check`: `deadline_type IN ('same_day', 'no_deadline', 'specific_date')`
- `tasks_specific_date_requires_deadline_date_check`: `deadline_date IS NOT NULL` when `deadline_type = 'specific_date'`

### `public.goals`

Planning goals tied to weekly plans.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Goal description |
| `status` | `text` | Goal status |
| `created_at` | `timestamptz` | |

### `public.weekly_plans`

Weekly focus container.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `week_start` | `date` | Monday of the week |
| `weekly_focus` | `text` | Primary focus for the week |
| `created_at` | `timestamptz` | |

### `public.weekly_plan_items`

Individual plan items within a weekly plan.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `plan_id` | `uuid` | References `weekly_plans.id` |
| `title` | `text` | Item description |
| `status` | `text` | Completion status |
| `created_at` | `timestamptz` | |

### `public.weekly_reviews`

Weekly review entries.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `week_start` | `date` | Monday of the reviewed week |
| `review_text` | `text` | Weekly reflection content |
| `created_at` | `timestamptz` | |

---

## 3. Progress Hub Tables

### `public.programming_skills`

Programming skill tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Skill name |
| `level` | `integer` | Current level |
| `project_count` | `integer` | Projects completed |
| `created_at` | `timestamptz` | |

### `public.personal_skills`

Personal (non-programming) skill tracking.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Skill name |
| `level` | `integer` | Current level |
| `project_count` | `integer` | Projects completed |
| `progress` | `integer` | Progress points |
| `created_at` | `timestamptz` | |

### `public.milestones`

Life and learning milestones.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Milestone description |
| `completed` | `boolean` | Completion state |
| `completed_at` | `timestamptz` | When completed |
| `created_at` | `timestamptz` | |

### `public.challenges`

Personal challenges with lifecycle status.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `title` | `text` | Challenge name |
| `status` | `text` | `Active`, `Completed`, `Dropped` |
| `created_at` | `timestamptz` | |

---

## 4. Fitness OS Tables

### `public.workouts`

Workout sessions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `workout_date` | `date` | Date of session (IST) |
| `duration_minutes` | `integer` | Session duration |
| `end_time` | `timestamptz` | Null until session ends |
| `notes` | `text` | Optional notes |
| `created_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

### `public.exercises`

Exercise library.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope (user-owned library) |
| `name` | `text` | Exercise name |
| `muscle_groups` | `text[]` | Target muscle groups |
| `created_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

### `public.exercise_logs`

Per-exercise set/rep/weight logs within a workout.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `workout_id` | `uuid` | References `workouts.id` |
| `exercise_id` | `uuid` | References `exercises.id` |
| `sets` | `integer` | Number of sets |
| `reps` | `integer` | Reps per set |
| `weight_kg` | `numeric` | Weight used |
| `created_at` | `timestamptz` | |
| `deleted_at` | `timestamptz` | Soft delete |

---

## 5. Time OS Tables

### `public.time_logs`

Focused work session logs.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `start_time` | `timestamptz` | Session start |
| `end_time` | `timestamptz` | Session end (null = active timer) |
| `duration_minutes` | `integer` | Computed on stop |
| `bucket` | `text` | `Academics`, `Deep Work`, `Admin`, `Fitness`, `Learning` |
| `task_id` | `uuid` | Optional FK to `tasks.id` |
| `notes` | `text` | Optional |
| `created_at` | `timestamptz` | |

**Constraint:** Unique index on `(user_id)` where `end_time IS NULL` — enforces one active timer per user.

---

## 6. Finance OS Tables

### `public.transactions`

Behavioral spending ledger. (Migrated from legacy `finance_transactions`.)

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `amount` | `numeric` | Transaction amount |
| `type` | `text` | `'expense'` (future: `'income'`) |
| `category` | `text` | Spending category |
| `is_need` | `boolean` | Need/want classification (nullable) |
| `note` | `text` | Optional description |
| `timestamp` | `timestamptz` | Transaction time |
| `created_at` | `timestamptz` | |

---

## 7. System Tables

### `public.events`

Durable analytics event log. The analytics backbone.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `domain` | `text` | `mind-os`, `productivity-hub`, etc. |
| `entity_type` | `text` | `habit`, `task`, `workout`, etc. |
| `entity_id` | `uuid` | FK to the mutated entity |
| `event_type` | `text` | Dot-case constant from eventTaxonomy.ts |
| `event_date_ist` | `text` | `YYYY-MM-DD` in IST |
| `payload` | `jsonb` | Relational context for analytics |
| `created_at` | `timestamptz` | |

### `public.system_event_queue`

Transient operational signals for Brain Engine reactivity and Evening Sync.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | RLS scope |
| `event_type` | `text` | `DEEP_WORK_COMPLETED`, `WORKOUT_COMPLETED`, `HABIT_FAILED`, `WANT_EXPENSE_ADDED` |
| `payload` | `jsonb` | Optional signal context |
| `created_at` | `timestamptz` | |

Rows are deleted by Evening Sync after processing.

### `public.system_metrics`

Daily Evening Sync snapshots.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Composite PK with `sync_date` |
| `sync_date` | `date` | IST date of the sync |
| `momentum_score` | `integer` | 0–100 momentum score |
| `events_processed` | `integer` | Queue entries processed |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(user_id, sync_date)` — one record per user per day, upserted by Evening Sync.

---

## 8. SQL Views (Aggregation Layer)

All views use `security_invoker = true` and `auth.uid()` for RLS. They return facts only; no scoring or intelligence.

### Brain Engine Views

| View | Window | Description |
|---|---|---|
| `current_day_snapshot` | Today | Per-user: pending tasks, habits completed, journal logged, workout days this week, deep work minutes today, oldest pending task title, newest active habit title |
| `current_day_snapshot_history_14d` | 14 days | Rolling history: tasks completed, habits completed, journal logged, workout logged per day |

### Data Lab Views

| View | Window | Description |
|---|---|---|
| `data_lab_daily_activity_90d` | 90 days | Per-day: all domain activity counts (habits, journal, tasks, focus, workouts, finance) |
| `data_lab_weekly_system_score_12w` | 12 weeks | Per-week: all domain day counts, totals, and `weekly_system_score` (weighted from signal config) |
| `data_lab_module_consistency_30d` | 30 days | Per-module: active days and consistency percentage (reads from signal views + config) |
| `data_lab_event_coverage_30d` | 30 days | Per event type: count, active days, date range |

### Signal Views

Signal views are thin wrappers on `data_lab_daily_activity_90d`, each following a fixed contract:

| Column | Type | Meaning |
|---|---|---|
| `user_id` | `uuid` | |
| `activity_date` | `date` | Asia/Kolkata-bucketed |
| `was_active` | `boolean` | Did this signal have meaningful activity that day |
| `magnitude` | `integer`/`numeric` | A single "how much" number (domain-defined) |
| `metrics` | `jsonb` | Domain-specific detail |

| View | Signal Key | `was_active` source | `magnitude` |
|---|---|---|---|
| `data_lab_signal_mind_habits` | `mind-habits` | `habits_completed > 0` | `habits_completed` |
| `data_lab_signal_mind_journal` | `mind-journal` | `journal_entries > 0` | `journal_entries` |
| `data_lab_signal_execution_tasks` | `execution-tasks` | `tasks_completed > 0` | `tasks_completed` |
| `data_lab_signal_time_os` | `time-os` | `deep_work_minutes > 0` | `deep_work_minutes` |
| `data_lab_signal_fitness_os` | `fitness-os` | `workouts_logged > 0` | `workouts_logged` |
| `data_lab_signal_finance_os` | `finance-os` | `finance_entries > 0` | `finance_entries` |

### Signal Configuration

#### `public.data_lab_signal_config`

Domain/signal configuration for Data Lab scoring and consistency views.

| Column | Type | Notes |
|---|---|---|
| `signal_key` | `text` | Primary key (e.g. `mind-habits`) |
| `display_name` | `text` | UI label (e.g. "Mind / Habits") |
| `weight_percent` | `numeric` | Share of weekly system score |
| `weight_cap_days` | `int` | Day-cap for scoring (7 for most, 4 for workouts) |
| `is_active` | `boolean` | Soft-disable without migration |

---

## 9. Migration History Summary

| Migration | Description |
|---|---|
| `01_mind_os_schema.sql` | habits, habit_logs, journal_entries |
| `02_journal_entries_permissions_fix.sql` | RLS policy fix |
| `03_productivity_hub.sql` | tasks, goals |
| `04_progress_hub.sql` | milestones, challenges, programming_skills |
| `05_mind_os_habit_journal_v2.sql` | habit_break_heals, journal v2 fields |
| `06_mind_os_habit_recovery_commitment.sql` | Recovery commitment field |
| `07_events_and_planning_engine_v1.sql` | events, weekly_plans, weekly_plan_items, weekly_reviews |
| `08_fitness_os_v1.sql` | workouts, exercises, exercise_logs |
| `09_system_snapshot.sql` | current_day_snapshot views, system_metrics |
| `10_time_os.sql` | time_logs |
| `11_brain_time_integration.sql` | deep_work_minutes_today in snapshot |
| `12_events_time_os_domain.sql` | Time OS event domain |
| `12_finance_os.sql` | finance_transactions (legacy) |
| `13_fitness_library_arrays.sql` | exercises.muscle_groups as array |
| `13_fitness_os_live_sessions.sql` | Workout live session support |
| `14_journal_multi_entry.sql` | Multi-entry journal support |
| `15_finance_ledger.sql` | Finance ledger improvements |
| `16_system_metrics.sql` | system_metrics table |
| `17_system_event_queue.sql` | system_event_queue table |
| `202606200001_data_integrity_indexes.sql` | Performance indexes |
| `202606200002_data_lab_base_views.sql` | All Data Lab SQL views |
| `202606230001_database_cleanup.sql` | Finance migration, task schema overhaul, view recreation |
| `202607270001_signal_views.sql` | Signal config table, six signal views, Finance `is_need` restoration, daily activity view rebuild |
| `202607270002_signal_cutover.sql` | Rebuild module consistency and weekly score views to use signal views + config table |
