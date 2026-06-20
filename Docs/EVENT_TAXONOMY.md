# LIFE OS - EVENT TAXONOMY

This document defines the durable event contract for Life OS.

The `public.events` table is the analytics backbone. Every user action that changes system state must either emit a durable event through `logEventSafe` or be explicitly documented as a non-analytical system operation.

---

# 1. Naming Convention

All new durable events must use strict dot-case:

```text
domain.entity.action
```

Examples:

```text
mind.habit.deleted
productivity.task.status_changed
time.time_log.started
finance.transaction.deleted
```

Rules:

- Use lowercase only.
- Use dots to separate `domain`, `entity`, and `action`.
- Use underscores inside multi-word entities, such as `journal_entry` and `time_log`.
- Do not introduce uppercase event names.
- Do not create one-off strings inside feature hooks. Add constants to `src/lib/eventTaxonomy.ts`.

---

# 2. Payload Rule

Every event payload must include enough relational context for analytics to join the event back to the state change.

Required payload conventions:

- Include the primary relational ID, such as `task_id`, `habit_id`, `journal_entry_id`, `time_log_id`, `transaction_id`, or `workout_id`.
- Include `previous_status` and `next_status` for status changes when both are available.
- Include `previous_value` and `next_value` for count/value changes when both are available.
- Include `source` when one module mutates another module's state.
- Include timestamps such as `started_at`, `deleted_at`, or `updated_at` when useful.
- Use JSON keys that are stable and SQL-friendly. Prefer snake_case for new payload fields.

Example:

```ts
await logEventSafe({
  userId,
  domain: 'productivity-hub',
  entityType: 'task',
  entityId: taskId,
  eventType: PRODUCTIVITY_TASK_STATUS_CHANGED,
  payload: {
    task_id: taskId,
    previous_status: 'Doing',
    next_status: 'Done',
    source: 'time-os',
  },
})
```

---

# 3. Durable Vs Transient Events

Life OS has two event paths:

- Durable analytics events: `public.events`, written through `logEventSafe`.
- Transient operational signals: `public.system_event_queue`, written through `useEventBus`.

Only `public.events` is the source of truth for analytics.

Transient events may support local Brain Engine reactivity or Evening Sync processing, but they must not be treated as complete historical analytics records.

---

# 4. Core Event Constants

The canonical constants live in `src/lib/eventTaxonomy.ts`.

## Mind OS

```text
mind.habit.created
mind.habit.completed
mind.habit.count_adjusted
mind.habit.uncompleted
mind.habit.deleted
mind.habit_break.healed
mind.journal_entry.created
mind.journal_entry.deleted
```

## Productivity Hub

```text
productivity.task.created
productivity.task.status_changed
productivity.weekly_plan.created
productivity.weekly_plan.updated
productivity.goal.created
productivity.goal.status_changed
productivity.weekly_plan_item.created
productivity.weekly_plan_item.updated
productivity.weekly_review.upserted
```

## Progress Hub

```text
progress.programming_skill.created
progress.programming_skill.level_changed
progress.programming_skill.project_count_incremented
progress.milestone.created
progress.milestone.completed
progress.milestone.reopened
progress.challenge.created
progress.challenge.status_changed
progress.personal_skill.created
progress.personal_skill.level_changed
progress.personal_skill.project_count_incremented
progress.personal_skill.progress_incremented
```

## Fitness OS

```text
fitness.workout.created
fitness.workout.started
fitness.workout.completed
fitness.workout.updated
fitness.workout.deleted
fitness.exercise.created
fitness.exercise.updated
fitness.exercise.deleted
fitness.exercise_log.created
fitness.exercise_log.updated
fitness.exercise_log.deleted
```

## Time OS

```text
time.session.started
time.session.logged
time.session.deleted
time.time_log.started
time.time_log.deleted
```

## Finance OS

```text
finance.transaction.created
finance.transaction.deleted
```

## System

```text
system.evening_sync.completed
```

---

# 5. Compatibility Notes

Some legacy durable events still exist because current SQL views and Brain Engine history depend on them.

Examples:

```text
task_created
task_status_updated
TIME_LOGGED
FINANCE_TRANSACTION_LOGGED
```

When refactoring old event names, preserve analytics compatibility until all dependent SQL views and hooks are migrated.

For bridging events, include the new taxonomy value in payload as `taxonomy_type` when the durable `event_type` must remain legacy for compatibility.

---

# 6. Non-Analytical Actions

These operations are intentionally not treated as user-facing analytics events unless the architecture changes.

## System Operations

- Inserting transient rows into `public.system_event_queue`.
- Deleting processed rows from `public.system_event_queue` after Evening Sync.
- Refetching React Query caches.
- Emitting UI toast feedback.

## Maintenance Operations

- Auto-syncing missing habit streak breaks from existing habit history.
- Rebuilding derived SQL views.
- Running database migrations.
- Backfilling indexes or constraints.

## Read-Only Operations

- Fetching dashboard summaries.
- Fetching Brain Engine snapshots.
- Fetching analytics views.
- Fetching module lists or detail pages.

If any non-analytical operation starts representing user intent, it must be promoted into the durable event taxonomy.

---

# 7. New Mutation Checklist

Before adding or changing any mutation:

1. Identify the domain, entity, and action.
2. Add or reuse a constant in `src/lib/eventTaxonomy.ts`.
3. Emit the event with `logEventSafe` after the database write succeeds.
4. Include relational IDs in the payload.
5. Include before/after values for status or count changes when available.
6. Invalidate the correct domain React Query keys.
7. If no event is emitted, document why the action is non-analytical in this file.
