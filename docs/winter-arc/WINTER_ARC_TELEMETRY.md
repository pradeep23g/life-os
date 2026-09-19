---
title: "Winter Arc — Telemetry & Event Ingestion"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc Telemetry Audit

This document audits Winter Arc features against the existing event taxonomy and identifies genuinely necessary new canonical events.

## Existing Event Taxonomy

Currently, there are 45 canonical events defined in `eventTaxonomy.ts`, structured by domain.

*   **MIND OS (8):** `mind.habit.created`, `mind.habit.completed`, `mind.habit.count_adjusted`, `mind.habit.uncompleted`, `mind.habit.deleted`, `mind.habit_break.healed`, `mind.journal_entry.created`, `mind.journal_entry.deleted`
*   **PRODUCTIVITY HUB (9):** `productivity.task.created`, `productivity.task.status_changed`, `productivity.weekly_plan.created`, `productivity.weekly_plan.updated`, `productivity.goal.created`, `productivity.goal.status_changed`, `productivity.weekly_plan_item.created`, `productivity.weekly_plan_item.updated`, `productivity.weekly_review.upserted`
*   **LEARNING OS (9):** `learning.roadmap.created`, `learning.roadmap.status_changed`, `learning.stage.skipped`, `learning.session.logged`, `learning.session.skipped`, `learning.milestone.created`, `learning.milestone.achieved`, `learning.project.status_changed`, `learning.reflection.created`
*   **FITNESS OS (11):** `fitness.workout.created`, `fitness.workout.started`, `fitness.workout.completed`, `fitness.workout.updated`, `fitness.workout.deleted`, `fitness.exercise.created`, `fitness.exercise.updated`, `fitness.exercise.deleted`, `fitness.exercise_log.created`, `fitness.exercise_log.updated`, `fitness.exercise_log.deleted`
*   **TIME OS (5):** `time.session.started`, `time.session.logged`, `time.session.deleted`, `time.time_log.started`, `time.time_log.deleted`
*   **FINANCE OS (2):** `finance.transaction.created`, `finance.transaction.deleted`
*   **SYSTEM (1):** `system.evening_sync.completed`

## Telemetry Rules

1.  **Constants Only:** All events MUST use constants from `eventTaxonomy.ts` (`EVENT_TYPES`).
2.  **Format:** `<domain>.<entity>.<action>` in lowercase.
3.  **Dual Pipeline:** `logEventSafe()` -> `events` table (permanent), `useEventBus` -> `system_event_queue` (transient).
4.  **Partitioning:** IST date partitioning on `event_date_ist`.
5.  **No Magic Strings:** No raw string literals allowed for event names.
6.  **Legacy:** Legacy fallbacks exist in `useEveningSync.ts` for backward compatibility only.
7.  **Do not create telemetry merely because a feature exists. Use domain tables for domain data.**

## Winter Arc Features Event Audit

### 1. Season Domain (New)

| Event Name | `season.arc.started` | `season.arc.completed` | `season.milestone.achieved` |
| :--- | :--- | :--- | :--- |
| **Domain** | season | season | season |
| **Entity** | arc | arc | milestone |
| **Trigger** | User initiates a new Winter Arc. | Winter Arc concludes (time-based or manual). | User completes a milestone within the Arc. |
| **Payload** | `{ arc_id, start_date_ist, end_date_ist, focus_areas }` | `{ arc_id, outcome, completion_rate }` | `{ arc_id, milestone_id, description }` |
| **Permanence** | Both | Both | Both |
| **EventBus/Evening Sync** | No action required | Archival/recap generation | Reward distribution |
| **Consumers** | Brain Engine, Data Lab | Brain Engine, Data Lab | Data Lab (Progress metrics) |
| **Classification** | **[DOMAIN TABLE source of truth]** (`seasons` is source of truth). | **[DOMAIN TABLE source of truth]** (`seasons` is source of truth). | **[DOMAIN TABLE source of truth]** |

### 2. Progression Domain (New)

| Event Name | `progression.xp.earned` | `progression.level.achieved` | `progression.achievement.unlocked` |
| :--- | :--- | :--- | :--- |
| **Domain** | progression | progression | progression |
| **Entity** | xp | level | achievement |
| **Trigger** | Any action rewarding XP (e.g., habit completion). | Cumulative XP crosses a level threshold. | Criteria for a specific badge/achievement met. |
| **Payload** | `{ amount, source_domain, source_event, reason }` | `{ new_level, previous_level }` | `{ achievement_id, name, rarity }` |
| **Permanence** | `system_event_queue` (Transient) | Both | Both |
| **EventBus/Evening Sync** | Aggregated daily | Level-up UI notification | Achievement UI notification |
| **Consumers** | Brain Engine, Profile View | Profile View, Leaderboards | Profile View, Data Lab |
| **Classification** | **[DERIVED — no event required]** (Do not treat XP events as an authoritative ledger. XP is deterministically derived from canonical events - ADR-015). | **[DERIVED — no event required]** | **[DOMAIN TABLE source of truth]** (`user_achievements` is source of truth. Telemetry is optional audit). |

### 3. Knowledge Domain (New)

| Event Name | `knowledge.resource.created` | `knowledge.resource.updated` | `knowledge.resource.completed` | `knowledge.book.progress_logged` |
| :--- | :--- | :--- | :--- | :--- |
| **Domain** | knowledge | knowledge | knowledge | knowledge |
| **Entity** | resource | resource | resource | book |
| **Trigger** | New resource (book, article) added. | Resource details changed. | Resource marked as read/completed. | Reading session logged. |
| **Payload** | `{ resource_id, type, title }` | `{ resource_id, updates }` | `{ resource_id, rating, review_summary }` | `{ book_id, pages_read, duration_mins }` |
| **Permanence** | Both | Permanent | Both | Both |
| **EventBus/Evening Sync** | Sync to search index | Sync to search index | Trigger reflection prompt | Update daily reading goal |
| **Consumers** | Knowledge Base UI | Knowledge Base UI | Data Lab, Brain Engine | Data Lab, Brain Engine |
| **Classification** | **[REQUIRED canonical event]** | **[OPTIONAL telemetry]** | **[REQUIRED canonical event]** | **[REQUIRED canonical event]** |

### 4. Pulse Domain (New)

| Event Name | `pulse.checkin.logged` |
| :--- | :--- |
| **Domain** | pulse |
| **Entity** | checkin |
| **Trigger** | User submits a daily/weekly pulse check-in. |
| **Payload** | `{ energy_level, mood, focus_score, blockers }` |
| **Permanence** | Both |
| **EventBus/Evening Sync** | Evening Sync summary |
| **Consumers** | Data Lab (Correlation analysis), Brain Engine |
| **Classification** | **[DOMAIN TABLE source of truth]** (`pulse_logs` is source of truth. event-only Pulse is rejected - ADR-022). |

### 5. Recovery Domain (New)

| Event Name | `recovery.period.started` | `recovery.action.logged` |
| :--- | :--- | :--- |
| **Domain** | recovery | recovery |
| **Entity** | period | action |
| **Trigger** | User initiates a formal recovery/rest period. | User logs a specific recovery action (stretching, meditation). |
| **Payload** | `{ duration_mins, type }` | `{ action_type, duration_mins, perceived_recovery }` |
| **Permanence** | Both | Both |
| **EventBus/Evening Sync** | Pause notifications/timers | Adjust strain/recovery scores |
| **Consumers** | Brain Engine (Load balancing) | Data Lab, Fitness OS |
| **Classification** | **[REQUIRED canonical event]** | **[REQUIRED canonical event]** |

### 6. Experiment Domain (New)

| Event Name | `experiment.started` | `experiment.concluded` |
| :--- | :--- | :--- |
| **Domain** | experiment | experiment |
| **Entity** | experiment (N of 1) | experiment |
| **Trigger** | User starts an A/B test (e.g., caffeine vs. no caffeine). | Experiment timeframe ends, user inputs result. |
| **Payload** | `{ experiment_id, hypothesis, variables }` | `{ experiment_id, outcome, conclusion }` |
| **Permanence** | Both | Both |
| **EventBus/Evening Sync** | Set up tracking prompts | Generate experiment report |
| **Consumers** | Brain Engine | Data Lab |
| **Classification** | **[REQUIRED canonical event]** | **[REQUIRED canonical event]** |

### 7. Report Domain (New)

Rejected — ADR-020. Reports are derived on-demand. There is no `reports` table initially or report archive in V1, thus no report generation telemetry is required. All report events are **[DERIVED — no event required]**.

### 8. API/Integration Domain (New)

| Event Name | `api.token.created` | `api.token.revoked` | `api.mutation.external` |
| :--- | :--- | :--- | :--- |
| **Domain** | api | api | api |
| **Entity** | token | token | mutation |
| **Trigger** | User generates an API token. | User revokes a token. | External system mutates state via API. |
| **Payload** | `{ token_id, scopes }` | `{ token_id }` | `{ source, endpoint, entity_affected }` |
| **Permanence** | Permanent | Permanent | Permanent |
| **EventBus/Evening Sync** | Security audit | Security audit | Triggers standard internal events based on mutation |
| **Consumers** | Security settings | Security settings | System audit |
| **Classification** | **[REQUIRED canonical event]** | **[REQUIRED canonical event]** | **[DERIVED — no event required]** |

### 9. System Extensions

| Event Name | `system.notification.sent` | `system.notification.interacted` |
| :--- | :--- | :--- |
| **Domain** | system | system |
| **Entity** | notification | notification |
| **Trigger** | Local Android schedule triggers notification, or FCM for server-originated (ADR-019). | User clicks/dismisses notification. |
| **Payload** | `{ notification_id, type, channel }` | `{ notification_id, action (clicked/dismissed) }` |
| **Permanence** | Transient (Log only) | Both |
| **EventBus/Evening Sync** | Rate limiting checks | Mark as read |
| **Consumers** | Brain Engine (Notification optimization) | Brain Engine |
| **Classification** | **[OPTIONAL telemetry]** | **[OPTIONAL telemetry]** |

## Structural Impacts

### Events Domain CHECK Constraint Update

The `events` table currently has a `domain` column with a `CHECK` constraint.

**Current:** `('mind-os', 'productivity-hub', 'learning-os', 'mission-control', 'fitness-os', 'finance-os', 'time-os')`

**New Values Required:**
*   `knowledge`
*   `recovery`
*   `experiment`
*   `api`

*(Note: `season`, `progression`, and `pulse` are explicitly EXCLUDED from the event domain CHECK constraint as they rely on domain tables or derivation, not an event ledger).*

**Action:** An SQL migration script is required to update the `CHECK` constraint to include these new domains.

### Data Lab and Brain Engine Impact

*   **`data_lab_signal_config`:** Needs new entries mapping the new `recovery` events to actionable signals.
*   **Signal Views:** Existing views (e.g., `v_daily_signals`) need to be updated to query `pulse_logs` directly rather than aggregating events.
*   **Brain Engine:** The Brain Engine needs new handlers for `seasons` table changes to configure focus modes, and `knowledge.resource.completed` to prompt reflections.
*   **Evening Sync:** Needs to aggregate data from domain tables (e.g., `pulse_logs`) and events into the daily sync log.

## Related Documentation

*   [Event Taxonomy](../architecture/EVENT_TAXONOMY.md)
*   [Database Schema](../architecture/DATABASE_SCHEMA.md)
*   [Winter Arc Data Model](WINTER_ARC_DATA_MODEL.md)
*   [Winter Arc Master Plan](WINTER_ARC_MASTER_PLAN.md)
