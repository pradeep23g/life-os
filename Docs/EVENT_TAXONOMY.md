# LIFE OS — EVENT TAXONOMY

This document defines the durable event contract for Life OS.

The `public.events` table is the analytics backbone. Every user action that changes system state must either emit a durable event through `logEventSafe` or be explicitly documented as a non-analytical system operation here.

---

## 1. Two Event Channels

Life OS maintains two distinct event channels:

### Durable Analytics Events — `public.events`

Written via `logEventSafe()` in `src/lib/events.ts`.

These are permanent behavioral records. They power Data Lab views, consistency analytics, and long-term behavioral intelligence.

Schema:
```
user_id        uuid       — references auth.users
domain         text       — e.g., 'mind-os', 'productivity-hub'
entity_type    text       — e.g., 'habit', 'task', 'workout'
entity_id      uuid?      — foreign key to the mutated row
event_type     text       — dot-case constant from eventTaxonomy.ts
event_date_ist text       — YYYY-MM-DD in India Standard Time
payload        jsonb      — relational context for analytics joins
created_at     timestamptz
```

`event_date_ist` stores the IST date regardless of server timezone. All event analytics are IST-scoped.

### Transient Operational Signals — `public.system_event_queue`

Written via `useEventBus.emitEvent()` in `src/store/useEventBus.ts`.

These are ephemeral signals for:
- Immediate Brain Engine reactivity (via Zustand in-memory ring buffer)
- Evening Sync momentum delta calculation
- Decision feedback toasts

Rows are deleted after Evening Sync processing. They are **not** a source of truth for analytics.

---

## 2. Naming Convention

All durable events use strict dot-case format:

```
domain.entity.action
```

Rules:
- Lowercase only.
- Dots separate `domain`, `entity`, and `action`.
- Underscores inside multi-word entities: `journal_entry`, `time_log`, `weekly_plan_item`.
- No uppercase event names.
- Never write inline event strings. All constants live in `src/lib/eventTaxonomy.ts`.

Valid examples:
```
mind.habit.completed
productivity.task.status_changed
time.time_log.started
finance.transaction.deleted
```

---

## 3. Payload Convention

Every event payload must include enough relational context to join the event back to the state change.

Required conventions:
- Include the primary relational ID: `task_id`, `habit_id`, `journal_entry_id`, `time_log_id`, `transaction_id`, `workout_id`, etc.
- For status changes, include `previous_status` and `next_status`.
- For count/value changes, include `previous_value` and `next_value`.
- Include `source` when one domain mutates another domain's state.
- Include timestamps (`started_at`, `deleted_at`, `updated_at`) when contextually useful.
- Prefer `snake_case` for all payload keys.

Example:
```ts
await logEventSafe({
  domain: 'productivity-hub',
  entityType: 'task',
  entityId: taskId,
  eventType: EVENT_TYPES.PRODUCTIVITY_TASK_STATUS_CHANGED,
  payload: {
    task_id: taskId,
    previous_status: 'Doing',
    next_status: 'Done',
    source: 'time-os',
  },
})
```

---

## 4. Canonical Event Constants

Source of truth: `src/lib/eventTaxonomy.ts`

### Mind OS

| Constant | Event String |
|---|---|
| `MIND_HABIT_CREATED` | `mind.habit.created` |
| `MIND_HABIT_COMPLETED` | `mind.habit.completed` |
| `MIND_HABIT_COUNT_ADJUSTED` | `mind.habit.count_adjusted` |
| `MIND_HABIT_UNCOMPLETED` | `mind.habit.uncompleted` |
| `MIND_HABIT_DELETED` | `mind.habit.deleted` |
| `MIND_HABIT_BREAK_HEALED` | `mind.habit_break.healed` |
| `MIND_JOURNAL_ENTRY_CREATED` | `mind.journal_entry.created` |
| `MIND_JOURNAL_ENTRY_DELETED` | `mind.journal_entry.deleted` |

### Productivity Hub

| Constant | Event String |
|---|---|
| `PRODUCTIVITY_TASK_CREATED` | `productivity.task.created` |
| `PRODUCTIVITY_TASK_STATUS_CHANGED` | `productivity.task.status_changed` |
| `PRODUCTIVITY_WEEKLY_PLAN_CREATED` | `productivity.weekly_plan.created` |
| `PRODUCTIVITY_WEEKLY_PLAN_UPDATED` | `productivity.weekly_plan.updated` |
| `PRODUCTIVITY_GOAL_CREATED` | `productivity.goal.created` |
| `PRODUCTIVITY_GOAL_STATUS_CHANGED` | `productivity.goal.status_changed` |
| `PRODUCTIVITY_WEEKLY_PLAN_ITEM_CREATED` | `productivity.weekly_plan_item.created` |
| `PRODUCTIVITY_WEEKLY_PLAN_ITEM_UPDATED` | `productivity.weekly_plan_item.updated` |
| `PRODUCTIVITY_WEEKLY_REVIEW_UPSERTED` | `productivity.weekly_review.upserted` |

### Progress Hub

| Constant | Event String |
|---|---|
| `PROGRESS_PROGRAMMING_SKILL_CREATED` | `progress.programming_skill.created` |
| `PROGRESS_PROGRAMMING_SKILL_LEVEL_CHANGED` | `progress.programming_skill.level_changed` |
| `PROGRESS_PROGRAMMING_PROJECT_COUNT_INCREMENTED` | `progress.programming_skill.project_count_incremented` |
| `PROGRESS_MILESTONE_CREATED` | `progress.milestone.created` |
| `PROGRESS_MILESTONE_COMPLETED` | `progress.milestone.completed` |
| `PROGRESS_MILESTONE_REOPENED` | `progress.milestone.reopened` |
| `PROGRESS_CHALLENGE_CREATED` | `progress.challenge.created` |
| `PROGRESS_CHALLENGE_STATUS_CHANGED` | `progress.challenge.status_changed` |
| `PROGRESS_PERSONAL_SKILL_CREATED` | `progress.personal_skill.created` |
| `PROGRESS_PERSONAL_SKILL_LEVEL_CHANGED` | `progress.personal_skill.level_changed` |
| `PROGRESS_PERSONAL_SKILL_PROJECT_COUNT_INCREMENTED` | `progress.personal_skill.project_count_incremented` |
| `PROGRESS_PERSONAL_SKILL_PROGRESS_INCREMENTED` | `progress.personal_skill.progress_incremented` |

### Fitness OS

| Constant | Event String |
|---|---|
| `FITNESS_WORKOUT_CREATED` | `fitness.workout.created` |
| `FITNESS_WORKOUT_STARTED` | `fitness.workout.started` |
| `FITNESS_WORKOUT_COMPLETED` | `fitness.workout.completed` |
| `FITNESS_WORKOUT_UPDATED` | `fitness.workout.updated` |
| `FITNESS_WORKOUT_DELETED` | `fitness.workout.deleted` |
| `FITNESS_EXERCISE_CREATED` | `fitness.exercise.created` |
| `FITNESS_EXERCISE_UPDATED` | `fitness.exercise.updated` |
| `FITNESS_EXERCISE_DELETED` | `fitness.exercise.deleted` |
| `FITNESS_EXERCISE_LOG_CREATED` | `fitness.exercise_log.created` |
| `FITNESS_EXERCISE_LOG_UPDATED` | `fitness.exercise_log.updated` |
| `FITNESS_EXERCISE_LOG_DELETED` | `fitness.exercise_log.deleted` |

### Time OS

| Constant | Event String |
|---|---|
| `TIME_SESSION_STARTED` | `time.session.started` |
| `TIME_SESSION_LOGGED` | `time.session.logged` |
| `TIME_SESSION_DELETED` | `time.session.deleted` |
| `TIME_TIME_LOG_STARTED` | `time.time_log.started` |
| `TIME_TIME_LOG_DELETED` | `time.time_log.deleted` |

### Finance OS

| Constant | Event String |
|---|---|
| `FINANCE_TRANSACTION_CREATED` | `finance.transaction.created` |
| `FINANCE_TRANSACTION_DELETED` | `finance.transaction.deleted` |

### System

| Constant | Event String |
|---|---|
| `SYSTEM_EVENING_SYNC_COMPLETED` | `system.evening_sync.completed` |

---

## 5. Transient Event Bus Types

These types are used with `useEventBus.emitEvent()` only. They are not durable analytics events.

| Type | Trigger |
|---|---|
| `DEEP_WORK_COMPLETED` | Time OS: deep work session stopped |
| `WORKOUT_COMPLETED` | Fitness OS: workout completed |
| `HABIT_FAILED` | Mind OS: habit marked as failed/break |
| `WANT_EXPENSE_ADDED` | Finance OS: `is_need = false` transaction logged |

Evening Sync reads these from `system_event_queue` and uses them to compute a daily momentum delta.

---

## 6. Legacy Compatibility Notes

Some legacy event strings still exist in the SQL view layer because current Data Lab views depend on them:

```
task_created            (used in data_lab_daily_activity_90d)
task_status_updated     (used in data_lab_daily_activity_90d)
```

These views filter events by `event_type` using these legacy strings. When refactoring, do not remove these event strings from `public.events` rows until all dependent SQL views have been updated and verified.

When bridging legacy and new taxonomy, include the new taxonomy value in the payload as `taxonomy_type` when the durable `event_type` must remain legacy for compatibility.

---

## 7. Non-Analytical Operations

These operations are intentionally not emitted as analytics events:

### System Operations
- Inserting transient rows into `public.system_event_queue`
- Deleting processed rows from `public.system_event_queue` after Evening Sync
- Refetching React Query caches
- Emitting UI toast feedback

### Maintenance Operations
- Auto-syncing missing habit streak breaks
- Rebuilding SQL views via migrations
- Running database migrations
- Backfilling indexes or constraints

### Read-Only Operations
- Fetching dashboard summaries
- Fetching Brain Engine snapshots
- Fetching Data Lab analytics views
- Fetching module lists or detail pages

---

## 8. New Mutation Checklist

Before adding or changing any mutation:

1. Identify the domain, entity, and action.
2. Check if a constant already exists in `src/lib/eventTaxonomy.ts`. If not, add one.
3. Emit the event with `logEventSafe` after the database write succeeds.
4. Include relational IDs in the payload.
5. Include before/after values for status or count changes.
6. Invalidate the correct domain React Query keys.
7. Invalidate `['system-status']` if the mutation affects habit/task/journal/fitness/time state.
8. If no event is emitted, document why the action is non-analytical in this file.
