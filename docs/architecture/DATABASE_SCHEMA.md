# LIFE OS — DATABASE SCHEMA

**Status:** Authoritative Database Reference  
**Last Synchronized:** September 2026 (Post-Integrity Campaign Baseline)  
**Source of Truth:** Remote Supabase Cloud Instance & `src/types/database.types.ts`

---

## 1. Overview & Security Architecture

The Life OS database runs on hosted PostgreSQL 15+ via Supabase.

- **Total Base Tables:** **27 tables** (26 active operational tables + 1 historical archive table).
- **Total Views:** **15 SQL aggregation views** (all created `WITH (security_invoker = true)`).
- **Row Level Security (RLS):** Enabled and enforced on all 27 application tables. Every query executes under `auth.uid() = user_id`.
- **Security Invoker Views:** All 15 SQL views run with `security_invoker = true`, ensuring view queries automatically execute under the authenticated user's RLS permissions.
- **Timezone Standardization:** All behavioral day partitions, rolling windows, and aggregations are normalized to Indian Standard Time (`Asia/Kolkata`, IST, UTC+5:30).

---

## 2. Active Domain Tables (27 Tables)

### 2.1 Mind OS (5 Tables)

#### `public.habits`
Tracks habit definitions, types, and daily targets.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `title` | `text` | No | — | Habit title |
| `habit_type` | `text` | No | `'binary'` | Habit type (`'binary'` or `'count'`) |
| `target_value` | `integer` | No | `1` | Daily completion target value |
| `unit` | `text` | Yes | `null` | Optional unit for count habits (e.g. `pages`, `glasses`) |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.habit_logs`
Records daily completion values for habits.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `habit_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.habits(id)` |
| `log_date` | `date` | No | — | IST date (`YYYY-MM-DD`) |
| `value` | `integer` | No | `1` | Completed value |
| `logged_at` | `timestamptz` | No | `now()` | Timestamp when user logged completion |
| `struggle_note` | `text` | Yes | `null` | Optional note on difficulty |
| `created_at` | `timestamptz` | No | `now()` | Row creation timestamp |

*Constraint:* Unique on `(habit_id, log_date)`.

#### `public.habit_streak_breaks`
Tracks broken habit streaks for recovery and pattern analysis.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `habit_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.habits(id)` |
| `break_date` | `date` | No | — | IST date streak was broken |
| `reason` | `text` | Yes | `null` | Why the break occurred |
| `recovery_commitment`| `text` | Yes | `null` | User recovery commitment |
| `healed_at` | `timestamptz` | Yes | `null` | Timestamp when heal token applied |
| `created_at` | `timestamptz` | No | `now()` | Record creation timestamp |

#### `public.habit_streak_heals`
Audit log of applied streak heal tokens (limit 5 per calendar month).
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `habit_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.habits(id)` |
| `break_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.habit_streak_breaks(id)` |
| `reason` | `text` | Yes | `null` | Rationale for applying heal token |
| `created_at` | `timestamptz` | No | `now()` | Heal timestamp |

#### `public.journal_entries`
Structured daily reflection entries with mood scoring (multi-entry supported).
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `mood` | `integer` | No | — | 1–5 mood rating (`check (mood between 1 and 5)`) |
| `what_went_good` | `text` | Yes | `null` | Positive reflection notes |
| `what_you_learned` | `text` | Yes | `null` | Key insight or lesson learned |
| `brief_about_day` | `text` | Yes | `null` | High-level summary of the day |
| `created_at` | `timestamptz` | No | `now()` | Entry creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Last update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

---

### 2.2 Productivity Hub (5 Tables)

#### `public.tasks`
Actionable task ledger with deadline constraints.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `title` | `text` | No | — | Task title |
| `is_completed` | `boolean` | No | `false` | Completion status |
| `deadline_type` | `text` | No | — | `'same_day'`, `'no_deadline'`, or `'specific_date'` |
| `deadline_date` | `date` | Yes | `null` | Required when `deadline_type = 'specific_date'` |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.goals`
High-level strategic objectives tied to weekly planning.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `title` | `text` | No | — | Goal title |
| `domain` | `text` | No | — | Domain (`'mind-os'`, `'productivity-hub'`, `'learning-os'`, `'fitness-os'`, `'finance-os'`) |
| `status` | `text` | No | `'active'` | `'active'`, `'paused'`, or `'completed'` |
| `target_date` | `date` | Yes | `null` | Completion target date |
| `notes` | `text` | Yes | `null` | Strategic context |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |

#### `public.weekly_plans`
Weekly focus themes and timeframes.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `week_start_date`| `date` | No | — | Monday of target week |
| `focus_text` | `text` | Yes | `null` | Main theme/focus for the week |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |

*Constraint:* Unique on `(user_id, week_start_date)`.

#### `public.weekly_plan_items`
Structured backlog and commitment items for a given week.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `week_start_date`| `date` | No | — | Target week Monday |
| `title` | `text` | No | — | Item title |
| `priority` | `text` | No | `'Medium'` | `'Low'`, `'Medium'`, or `'High'` |
| `order_index` | `integer` | No | `0` | Display ordering index |
| `status` | `text` | No | `'Planned'` | `'Planned'`, `'Doing'`, `'Done'`, or `'Dropped'` |
| `goal_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.goals(id)` |
| `linked_task_id`| `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.tasks(id)` |
| `linked_habit_id`| `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.habits(id)` |
| `notes` | `text` | Yes | `null` | Item notes |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |

> [!NOTE]
> `weekly_plan_items` binds directly to `(user_id, week_start_date)`. There is no `plan_id` foreign key column.

#### `public.weekly_reviews`
End-of-week reflection and progress review.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `week_start_date`| `date` | No | — | Target week Monday |
| `wins` | `text` | Yes | `null` | Accomplishments |
| `blockers` | `text` | Yes | `null` | Obstacles encountered |
| `next_adjustments`| `text` | Yes | `null` | Planned adjustments |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |

*Constraint:* Unique on `(user_id, week_start_date)`.

---

### 2.3 Learning OS (7 Tables)

#### `public.learning_roadmaps`
Top-level skill acquisition roadmaps.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `title` | `text` | No | — | Topic / Skill title |
| `slug` | `text` | Yes | `null` | URL-safe identifier |
| `description` | `text` | Yes | `null` | Roadmap scope & objectives |
| `status` | `text` | No | `'active'` | `'active'`, `'paused'`, `'completed'`, `'abandoned'` |
| `start_date` | `date` | Yes | `null` | Start date |
| `target_end_date`| `date` | Yes | `null` | Target completion date |
| `actual_end_date`| `date` | Yes | `null` | Actual completion date |
| `color` | `text` | Yes | `null` | Accent color |
| `metadata` | `jsonb` | Yes | `'{}'::jsonb` | Extensible metadata |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_stages`
Sequential modules/stages within a roadmap.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `roadmap_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_roadmaps(id) on delete cascade` |
| `order_index` | `integer` | No | — | Sequence order |
| `title` | `text` | No | — | Stage title |
| `subtitle` | `text` | Yes | `null` | Stage subtitle |
| `note` | `text` | Yes | `null` | Curriculum notes |
| `color` | `text` | Yes | `null` | Accent color |
| `start_date` | `date` | Yes | `null` | Stage start date |
| `end_date` | `date` | Yes | `null` | Stage end date |
| `is_skipped` | `boolean` | No | `false` | Whether stage was skipped |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_sessions`
Atomic lessons or practice units within a stage.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `stage_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_stages(id) on delete cascade` |
| `order_index` | `integer` | No | — | Sequence order |
| `slot` | `text` | Yes | `null` | Curriculum slot |
| `title` | `text` | No | — | Session title |
| `description` | `text` | Yes | `null` | Session details |
| `estimated_minutes`| `integer` | Yes | `null` | Target duration |
| `tags` | `text[]` | Yes | `'{}'::text[]` | Topic tags |
| `target_date` | `date` | Yes | `null` | Planned study date |
| `is_skipped` | `boolean` | No | `false` | Whether session was skipped |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_session_logs`
Execution log of completed study sessions.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `session_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_sessions(id) on delete cascade` |
| `roadmap_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_roadmaps(id) on delete cascade` |
| `time_log_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.time_logs(id) on delete set null` |
| `logged_at` | `timestamptz` | No | `now()` | Study timestamp |
| `duration_minutes`| `integer` | No | `0` | Minutes studied |
| `notes` | `text` | Yes | `null` | Session notes |
| `metrics` | `jsonb` | Yes | `'{}'::jsonb` | Study metrics |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_milestones`
Milestones achieved within a learning curriculum.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `roadmap_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_roadmaps(id)` |
| `stage_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.learning_stages(id)` |
| `title` | `text` | No | — | Milestone title |
| `achieved` | `boolean` | No | `false` | Achievement status |
| `achieved_at` | `timestamptz` | Yes | `null` | Achievement timestamp |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_projects`
Proof-of-work project implementations tied to a learning roadmap.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `roadmap_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_roadmaps(id)` |
| `stage_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.learning_stages(id)` |
| `title` | `text` | No | — | Project title |
| `description` | `text` | Yes | `null` | Project description |
| `repo_url` | `text` | Yes | `null` | Code repository URL |
| `status` | `text` | No | `'in_progress'` | Project lifecycle status |
| `completed_at` | `timestamptz` | Yes | `null` | Completion timestamp |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.learning_reflections`
Teach-back and conceptual reflections tied to learning roadmaps.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `roadmap_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.learning_roadmaps(id)` |
| `stage_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.learning_stages(id)` |
| `session_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.learning_sessions(id)` |
| `reflection_type`| `text` | No | `'concept'` | Reflection format |
| `content` | `text` | No | — | Reflection content |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

---

### 2.4 Fitness OS (3 Tables)

#### `public.fitness_exercises`
Custom and standard exercise movement catalog.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `name` | `text` | No | — | Exercise name |
| `category` | `text` | Yes | `null` | Movement category (`strength`, `cardio`, etc.) |
| `target_muscles` | `text[]` | Yes | `null` | Target muscle groups |
| `equipment` | `text[]` | Yes | `null` | Equipment required |
| `default_unit` | `text` | Yes | `'kg'` | Default weight/distance unit |
| `notes` | `text` | Yes | `null` | Form cues and setup notes |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.workouts`
Workout training sessions.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `title` | `text` | No | — | Workout title |
| `workout_date`| `date` | No | — | IST date |
| `start_time` | `timestamptz` | Yes | `null` | Session start timestamp |
| `end_time` | `timestamptz` | Yes | `null` | Session end timestamp (`null` = in-progress) |
| `duration_minutes`| `integer` | Yes | `null` | Total completed duration |
| `notes` | `text` | Yes | `null` | Post-workout reflection |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

#### `public.exercise_logs`
Exercise performance entries within a workout.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `workout_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `public.workouts(id) on delete cascade` |
| `exercise_id`| `uuid` | No | — | Foreign Key $\rightarrow$ `public.fitness_exercises(id)` |
| `order_index`| `integer` | No | `0` | Order of exercise in session |
| `sets` | `integer` | Yes | `null` | Completed sets |
| `reps_total` | `integer` | Yes | `null` | Total repetitions |
| `weight_kg` | `numeric(6,2)` | Yes | `null` | Working or top weight |
| `duration_minutes`| `integer` | Yes | `null` | Cardio duration |
| `distance_km`| `numeric(6,2)` | Yes | `null` | Cardio distance |
| `rpe` | `numeric(3,1)` | Yes | `null` | Rate of Perceived Exertion (`1.0` to `10.0`) |
| `notes` | `text` | Yes | `null` | Performance notes |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |
| `deleted_at` | `timestamptz` | Yes | `null` | Soft delete timestamp |

---

### 2.5 Time OS (1 Table)

#### `public.time_logs`
Focus and deep work time sessions.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `bucket` | `text` | No | — | Category (`'Deep Work'`, `'Learning'`, `'Admin'`, `'Health'`) |
| `description` | `text` | Yes | `null` | Focus session description |
| `task_id` | `uuid` | Yes | `null` | Foreign Key $\rightarrow$ `public.tasks(id) on delete set null` |
| `start_time` | `timestamptz` | No | `now()` | Session start time |
| `end_time` | `timestamptz` | Yes | `null` | Session end time (`null` = actively running) |
| `duration_minutes`| `integer` | Yes | `null` | Completed duration in minutes |
| `created_at` | `timestamptz` | No | `now()` | Creation timestamp |
| `updated_at` | `timestamptz` | No | `now()` | Update timestamp |

*Single Active Timer Constraint:* PostgreSQL partial unique index:
```sql
CREATE UNIQUE INDEX idx_time_logs_single_active ON public.time_logs(user_id) WHERE end_time IS NULL;
```

---

### 2.6 Finance OS (1 Table)

#### `public.transactions`
Behavioral financial transactions ledger.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `amount` | `numeric(12,2)` | No | — | Transaction amount (`check (amount > 0)`) |
| `category` | `text` | No | — | Spending category |
| `type` | `text` | No | — | Transaction type (`'income'` or `'expense'`) |
| `is_need` | `boolean` | Yes | `null` | `true` = Need, `false` = Want, `null` for income |
| `timestamp` | `timestamptz` | No | `now()` | Transaction timestamp |

> [!NOTE]
> `transactions` is the exclusive canonical finance ledger table. The obsolete table `finance_transactions` was officially dropped in historical migration `202606230001_database_cleanup.sql`.

---

### 2.7 Telemetry & System Infrastructure (4 Tables)

#### `public.events`
Authoritative, immutable behavioral analytics ledger.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `domain` | `text` | No | — | Domain origin (`mind-os`, `productivity-hub`, `learning-os`, `mission-control`, `fitness-os`, `finance-os`, `time-os`) |
| `entity_type` | `text` | No | — | Type of entity |
| `entity_id` | `uuid` | Yes | `null` | Target entity UUID |
| `event_type` | `text` | No | — | Canonical dot-notation event type from `eventTaxonomy.ts` |
| `event_date_ist`| `date` | No | — | IST calendar date (`YYYY-MM-DD`) |
| `payload` | `jsonb` | No | `'{}'::jsonb` | Structured event payload |
| `created_at` | `timestamptz` | No | `now()` | Event emission timestamp |

#### `public.system_event_queue`
Ephemeral operational queue consumed by Evening Sync.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `event_type` | `text` | No | — | Operational event signal type |
| `payload` | `jsonb` | Yes | `null` | Event metadata |
| `created_at` | `timestamptz` | No | `now()` | Timestamp when queued |

#### `public.system_metrics`
Daily momentum snapshot and sync closing ledger.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `sync_date` | `string` (`date`) | No | — | IST date of sync |
| `momentum_score` | `integer` | No | — | Finalized momentum score (0–100) |
| `events_processed` | `integer` | No | — | Total queue events flushed in sync |
| `created_at` | `timestamptz` | No | `now()` | Closing timestamp |

*Constraint:* Unique on `(user_id, sync_date)`.

#### `public.data_lab_signal_config`
Configuration weights for Data Lab cross-domain signal score calculations.
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `signal_key` | `text` | No | — | Primary Key (`'mind_habits'`, `'execution_tasks'`, etc.) |
| `display_name` | `text` | No | — | UI label (`'Mind / Habits'`, `'Execution / Tasks'`, etc.) |
| `weight_percent` | `numeric` | No | `0` | Percentage weight in system score |
| `weight_cap_days` | `integer` | No | `7` | Rolling cap days |
| `is_active` | `boolean` | No | `true` | Active calculation flag |

---

### 2.8 Historical Archive Table (1 Table)

#### `public.progress_hub_archive`
Preserves historical snapshots from retired Progress Hub prior to Migration `202607280001` (ADR-007).
| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary Key |
| `user_id` | `uuid` | No | — | Foreign Key $\rightarrow$ `auth.users(id)` |
| `programming_skills` | `jsonb` | Yes | `null` | Preserved JSON snapshot |
| `milestones` | `jsonb` | Yes | `null` | Preserved JSON snapshot |
| `challenges` | `jsonb` | Yes | `null` | Preserved JSON snapshot |
| `personal_skills` | `jsonb` | Yes | `null` | Preserved JSON snapshot |
| `archived_at` | `timestamptz` | No | `now()` | Archive timestamp |

> [!NOTE]
> `progress_hub_archive` is an intentional, dormant historical archive. It is retained to preserve user data history but is NOT queried by active runtime application code.

---

## 3. SQL Aggregation Views (15 Views)

All views are created `WITH (security_invoker = true)` to inherit the querying user's RLS context:

### 3.1 Brain Engine Snapshot Views
1. **`public.current_day_snapshot`** (14 columns):
   Real-time multi-domain metrics for today: `user_id`, `snapshot_date`, `pending_tasks_count`, `oldest_pending_task_title`, `habits_completed_today`, `total_active_habits`, `newest_active_habit_title`, `journal_logged_today`, `workout_days_this_week`, `deep_work_minutes_today`, `learning_sessions_logged_7d`, `active_roadmaps_count`, `budget_utilization_percentage`, `recent_want_expenses_count`.
2. **`public.current_day_snapshot_history_14d`** (7 columns):
   14-day rolling chronological daily history for EMA momentum calculation: `user_id`, `snapshot_date`, `tasks_completed_count`, `habits_completed_count`, `total_active_habits`, `journal_logged`, `workout_logged`.

### 3.2 Data Lab Analytical Views
3. **`public.data_lab_daily_activity_90d`** (20 columns):
   90-day multi-domain daily rollups: `user_id`, `activity_date`, `active_domains`, `active_system_count`, `active_habits`, `habits_completed`, `habit_completion_percent`, `journal_entries`, `avg_mood`, `tasks_created`, `tasks_completed`, `total_focus_minutes`, `deep_work_minutes`, `focus_sessions`, `workouts_logged`, `workout_minutes`, `finance_entries`, `total_spent`, `need_spent`, `want_spent`, `learning_sessions_logged`, `events_logged`.
4. **`public.data_lab_weekly_system_score_12w`** (25 columns):
   12-week comprehensive weighted system score across all 7 domains.
5. **`public.data_lab_module_consistency_30d`** (6 columns):
   30-day consistency percentages per module (`'Mind / Habits'`, `'Mind / Journal'`, `'Execution / Tasks'`, `'Time OS'`, `'Fitness OS'`, `'Finance OS'`, `'Learning OS'`).
6. **`public.data_lab_event_coverage_30d`** (7 columns):
   30-day telemetry event frequency, active days, and last seen timestamps.

### 3.3 Domain Signal Views (7 Views)
Standardized daily magnitude and active boolean streams for cross-domain intelligence:
7. **`public.data_lab_signal_mind_habits`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
8. **`public.data_lab_signal_mind_journal`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
9. **`public.data_lab_signal_execution_tasks`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
10. **`public.data_lab_signal_time_os`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
11. **`public.data_lab_signal_fitness_os`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
12. **`public.data_lab_signal_finance_os`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)
13. **`public.data_lab_signal_learning_os`** (`user_id`, `activity_date`, `magnitude`, `was_active`, `metrics`)

### 3.4 Learning OS Curriculum Views
14. **`public.learning_roadmap_progress`** (4 columns):
    Hierarchical completion percentages: `roadmap_id`, `total_sessions`, `completed_sessions`, `pct_complete`.
15. **`public.learning_stage_progress`** (5 columns):
    Stage-level completion percentages: `roadmap_id`, `stage_id`, `total_sessions`, `completed_sessions`, `pct_complete`.

---

## 4. Material Indexes & Constraints

| Table | Index / Constraint | Purpose |
|---|---|---|
| `time_logs` | `idx_time_logs_single_active` (partial unique: `(user_id) WHERE end_time IS NULL`) | Enforces the single active focus timer invariant. |
| `habit_logs` | `UNIQUE(habit_id, log_date)` | Prevents duplicate habit logs for the same calendar date. |
| `weekly_plans` | `UNIQUE(user_id, week_start_date)` | Ensures one weekly plan per user per week. |
| `weekly_reviews` | `UNIQUE(user_id, week_start_date)` | Ensures one weekly review per user per week. |
| `system_metrics` | `UNIQUE(user_id, sync_date)` | Prevents duplicate Evening Sync closing records per date. |
| `events` | `idx_events_user_ist_date` (`(user_id, event_date_ist)`) | Accelerates 90-day longitudinal queries and Data Lab views. |
| `transactions` | Foreign key index on `(user_id, timestamp)` | Fast monthly spending rollup queries. |

---

## 5. Historical & Archival Entity Distinctions

| Entity | Status | Historical Origin | Architectural Invariant |
|---|---|---|---|
| `progress_hub_archive` | **ACTIVE ARCHIVE** | Created in Migration `202607280001` under ADR-007. | Retained intentionally in remote PostgreSQL. Do NOT drop. Not queried by runtime code. |
| `finance_transactions` | **PERMANENTLY DROPPED** | Dropped in Migration `202606230001_database_cleanup.sql`. | Must NEVER be resurrected or referenced in fallback candidate arrays. Replaced by `transactions`. |
| `workout_sets` | **PHANTOM / NEVER EXISTED** | Phantom artifact from early drafts. | Does not exist in any migration or remote table. Replaced by `exercise_logs`. |
| `weekly_plan_items.plan_id` | **PHANTOM / NEVER EXISTED** | Phantom artifact from early drafts. | Does not exist in schema. Items bind directly to `(user_id, week_start_date)`. |
| `programming_skills`, `milestones`, `challenges`, `personal_skills` | **RETIRED TABLES** | Replaced by Learning OS in Migration `202607280002`. | Archived into `progress_hub_archive`. Do NOT reference in active queries or smoke scripts. |
