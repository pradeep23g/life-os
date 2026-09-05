# LIFE OS — EVENT TAXONOMY

**Status:** Authoritative Event & Telemetry Reference  
**Last Synchronized:** September 2026 (Post-Integrity Campaign Baseline)  
**Source of Truth:** `src/lib/eventTaxonomy.ts` & `src/store/useEventBus.ts`

---

## 1. Two Event Channels

Life OS maintains two separate, complementary event mechanisms:

### 1. Durable Analytics Events — `public.events`
Written via `logEventSafe()` in [src/lib/events.ts](file:///C:/Users/gpk74/life-os/src/lib/events.ts).

- **Nature:** Permanent, append-only, immutable audit log of behavioral actions.
- **Consumers:** PostgreSQL aggregation views (`data_lab_daily_activity_90d`, `data_lab_event_coverage_30d`, `data_lab_weekly_system_score_12w`), Data Lab behavioral intelligence, and long-term longitudinal studies.
- **Naming Standard:** Strict canonical lowercase dot-notation (`<domain>.<entity>.<action>`).
- **Date Partition:** Stored with `event_date_ist` (`YYYY-MM-DD` in `Asia/Kolkata` timezone).

### 2. Transient Operational Signals — `public.system_event_queue`
Written via `useEventBus.getState().emitEvent()` in [src/store/useEventBus.ts](file:///C:/Users/gpk74/life-os/src/store/useEventBus.ts).

- **Nature:** Ephemeral operational queue and in-memory ring buffer.
- **Consumers:** Immediate Brain Engine reactivity, UI feedback toasts, and Evening Sync daily delta aggregation.
- **Lifecycle:** Processed, aggregated into `public.system_metrics`, and flushed from `system_event_queue` during the daily Evening Sync ritual.
- **Persistence Guarantees:** Batches are peeked and retained in memory until Supabase confirms insertion; retries use exponential backoff (1s–30s) and a 5-retry dead-letter quarantine.

---

## 2. Naming Standard

All durable analytics events adhere strictly to:

```text
<domain>.<entity>.<action>
```

Rules:
1. **Lowercase Only:** No camelCase or UPPERCASE event strings in `public.events`.
2. **Namespace Hierarchy:** `domain` corresponds to one of the 7 active domains (`mind`, `productivity`, `learning`, `fitness`, `time`, `finance`, `system`).
3. **Canonical Constants:** Every event MUST be imported from `src/lib/eventTaxonomy.ts`. Inline string literals are strictly prohibited.
4. **Exact Count:** Exactly 45 canonical event constants exist in `EVENT_TYPES`.

---

## 3. Canonical Event Catalog (45 Events)

### 3.1 Mind OS (8 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `MIND_HABIT_CREATED` | `mind.habit.created` | `habit` | New habit created |
| `MIND_HABIT_COMPLETED` | `mind.habit.completed` | `habit_log` | Habit marked completed for day |
| `MIND_HABIT_COUNT_ADJUSTED` | `mind.habit.count_adjusted` | `habit_log` | Count habit value incremented/decremented |
| `MIND_HABIT_UNCOMPLETED` | `mind.habit.uncompleted` | `habit_log` | Habit completion removed |
| `MIND_HABIT_DELETED` | `mind.habit.deleted` | `habit` | Habit soft-deleted |
| `MIND_HABIT_BREAK_HEALED` | `mind.habit_break.healed` | `habit_break` | Heal token applied to break |
| `MIND_JOURNAL_ENTRY_CREATED` | `mind.journal_entry.created` | `journal_entry` | Daily journal entry saved |
| `MIND_JOURNAL_ENTRY_DELETED` | `mind.journal_entry.deleted` | `journal_entry` | Journal entry soft-deleted |

### 3.2 Productivity Hub (9 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `PRODUCTIVITY_TASK_CREATED` | `productivity.task.created` | `task` | New task created |
| `PRODUCTIVITY_TASK_STATUS_CHANGED`| `productivity.task.status_changed` | `task` | Task completed or reopened |
| `PRODUCTIVITY_WEEKLY_PLAN_CREATED`| `productivity.weekly_plan.created` | `weekly_plan` | New weekly plan initialized |
| `PRODUCTIVITY_WEEKLY_PLAN_UPDATED`| `productivity.weekly_plan.updated` | `weekly_plan` | Weekly focus text updated |
| `PRODUCTIVITY_GOAL_CREATED` | `productivity.goal.created` | `goal` | New strategic goal created |
| `PRODUCTIVITY_GOAL_STATUS_CHANGED`| `productivity.goal.status_changed` | `goal` | Goal status transitioned |
| `PRODUCTIVITY_WEEKLY_PLAN_ITEM_CREATED` | `productivity.weekly_plan_item.created` | `weekly_plan_item` | Plan item added to week |
| `PRODUCTIVITY_WEEKLY_PLAN_ITEM_UPDATED` | `productivity.weekly_plan_item.updated` | `weekly_plan_item` | Plan item status/priority changed |
| `PRODUCTIVITY_WEEKLY_REVIEW_UPSERTED` | `productivity.weekly_review.upserted` | `weekly_review` | End-of-week review saved |

### 3.3 Learning OS (9 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `LEARNING_ROADMAP_CREATED` | `learning.roadmap.created` | `roadmap` | New learning roadmap created |
| `LEARNING_ROADMAP_STATUS_CHANGED` | `learning.roadmap.status_changed` | `roadmap` | Roadmap state transitioned |
| `LEARNING_STAGE_SKIPPED` | `learning.stage.skipped` | `stage` | Roadmap curriculum stage skipped |
| `LEARNING_SESSION_LOGGED` | `learning.session.logged` | `learning_session_log` | Study session logged with duration |
| `LEARNING_SESSION_SKIPPED` | `learning.session.skipped` | `session` | Study session marked skipped |
| `LEARNING_MILESTONE_CREATED` | `learning.milestone.created` | `milestone` | Learning milestone created |
| `LEARNING_MILESTONE_ACHIEVED` | `learning.milestone.achieved` | `milestone` | Learning milestone marked achieved |
| `LEARNING_PROJECT_STATUS_CHANGED` | `learning.project.status_changed` | `project` | Proof-of-work project status updated |
| `LEARNING_REFLECTION_CREATED` | `learning.reflection.created` | `reflection` | Teach-back reflection logged |

### 3.4 Fitness OS (11 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `FITNESS_WORKOUT_CREATED` | `fitness.workout.created` | `workout` | Workout session record initialized |
| `FITNESS_WORKOUT_STARTED` | `fitness.workout.started` | `workout` | Live workout session timer started |
| `FITNESS_WORKOUT_COMPLETED` | `fitness.workout.completed` | `workout` | Workout ended and saved |
| `FITNESS_WORKOUT_UPDATED` | `fitness.workout.updated` | `workout` | Workout details modified |
| `FITNESS_WORKOUT_DELETED` | `fitness.workout.deleted` | `workout` | Workout soft-deleted |
| `FITNESS_EXERCISE_CREATED` | `fitness.exercise.created` | `exercise` | Custom exercise added to library |
| `FITNESS_EXERCISE_UPDATED` | `fitness.exercise.updated` | `exercise` | Exercise metadata updated |
| `FITNESS_EXERCISE_DELETED` | `fitness.exercise.deleted` | `exercise` | Exercise soft-deleted |
| `FITNESS_EXERCISE_LOG_CREATED` | `fitness.exercise_log.created` | `exercise_log` | Exercise set/reps/weight logged |
| `FITNESS_EXERCISE_LOG_UPDATED` | `fitness.exercise_log.updated` | `exercise_log` | Set/rep performance modified |
| `FITNESS_EXERCISE_LOG_DELETED` | `fitness.exercise_log.deleted` | `exercise_log` | Exercise log removed |

### 3.5 Time OS (5 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `TIME_SESSION_STARTED` | `time.session.started` | `time_log` | Active focus timer started |
| `TIME_SESSION_LOGGED` | `time.session.logged` | `time_log` | Focus session stopped & saved |
| `TIME_SESSION_DELETED` | `time.session.deleted` | `time_log` | Focus session deleted |
| `TIME_TIME_LOG_STARTED` | `time.time_log.started` | `time_log` | Focus timer initialized |
| `TIME_TIME_LOG_DELETED` | `time.time_log.deleted` | `time_log` | Focus timer entry deleted |

### 3.6 Finance OS (2 Events)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `FINANCE_TRANSACTION_CREATED` | `finance.transaction.created` | `transaction` | Financial transaction logged |
| `FINANCE_TRANSACTION_DELETED` | `finance.transaction.deleted` | `transaction` | Financial transaction deleted |

### 3.7 System (1 Event)
| Constant | Event Type String | Entity Type | Trigger |
|---|---|---|---|
| `SYSTEM_EVENING_SYNC_COMPLETED` | `system.evening_sync.completed` | `system_sync` | Daily Evening Sync ritual finalized |

---

## 4. Transient Event Bus Types & Operational Signals

Operational signals are emitted via `useEventBus.getState().emitEvent(type, payload)` into `system_event_queue` for intra-day reactivity.

Both canonical taxonomy types and legacy signal names are recognized by the Brain Engine and Evening Sync:

| Signal Type | Preferred Canonical Equivalent | Operational Purpose |
|---|---|---|
| `DEEP_WORK_COMPLETED` | `time.session.logged` | Triggers intra-day momentum bonus |
| `WORKOUT_COMPLETED` | `fitness.workout.completed` | Triggers physical discipline momentum gain |
| `HABIT_FAILED` | `mind.habit.uncompleted` | Triggers habit recovery commitment flow |
| `WANT_EXPENSE_ADDED` | `finance.transaction.created` (category: 'Want') | Triggers discretionary spending awareness alert |

---

## 5. End-to-End Telemetry Lifecycle & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER ACTION IN BROWSER UI                       │
│                                                                        │
│  User clicks button / submits form in React Component                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    MUTATION HOOK EXECUTION                             │
│                                                                        │
│  1. Executes Supabase mutation on domain table                         │
│  2. Calls logEventSafe({                                               │
│       domain, entityType, entityId, eventType, payload                 │
│     }) using canonical EVENT_TYPES constant                            │
│  3. (Optional) Calls emitEvent() for intra-day operational signals     │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼ (Durable Channel)             ▼ (Transient Channel)
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       public.events TABLE            │  │  public.system_event_queue   │
│                                      │  │                              │
│  - Permanent audit record            │  │  - Ephemeral buffer          │
│  - event_date_ist (Asia/Kolkata)     │  │  - In-memory bounded queue   │
│  - Immutable payload                 │  │  - Retried on network drop   │
└───────────────────┬──────────────────┘  └──────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       POSTGRESQL SQL VIEWS           │  │      EVENING SYNC RITUAL     │
│                                      │  │                              │
│  - current_day_snapshot              │  │  - Flushes across all dates  │
│  - current_day_snapshot_history_14d  │  │  - Computes momentum delta   │
│  - data_lab_daily_activity_90d       │  │  - Writes to system_metrics  │
│  - data_lab_module_consistency_30d   │  │  - Emits evening_sync event  │
│  - data_lab_weekly_system_score_12w  │  │  - Flushes queue records     │
└───────────────────┬──────────────────┘  └──────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CONSUMING SURFACES                              │
│                                                                        │
│  - Brain Engine: Computes real EMA momentum, directives, confidence    │
│  - Mission Control: Renders real 14-day EMA sparklines and directives  │
│  - Data Lab: Renders 90-day activity, consistency, and coverage charts │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Event Mutation Checklist

When implementing or modifying any mutation:
1. **Canonical Import:** Import the exact event constant from `src/lib/eventTaxonomy.ts`.
2. **Relational ID:** Provide the primary key UUID (`entityId`) of the modified entity.
3. **Structured Payload:** Provide relevant context in `payload` (e.g. `duration_minutes`, `category`, `is_need`).
4. **Cache Invalidation:** Invalidate the domain's TanStack Query key in `onSuccess`.
5. **System Invalidation:** Invalidate `['system-status']` if the action affects momentum or directive evaluation.

---

## 7. Legacy Compatibility & Historical Deprecation

- **Retired Progress Hub Events:** All 12 legacy `progress_hub.*` event types (`skill_created`, `challenge_completed`, etc.) are permanently retired and dropped.
- **Legacy String Literals:** Hardcoded snake_case strings (`'task_created'`, `'habit_logged_done'`, `'finance_transaction_logged'`) are deprecated. All active emitters have been converted to canonical dot-notation.

