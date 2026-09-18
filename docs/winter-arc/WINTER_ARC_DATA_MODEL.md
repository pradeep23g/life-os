# Winter Arc Data Model Gap Analysis

**Status:** [CURRENT]  
**Purpose:** Determine what existing data structures can support Winter Arc features and what genuinely needs new tables. Follows the principle of DO NOT OVER-ENGINEER.

**Cross-References:**
- [Database Schema](../architecture/DATABASE_SCHEMA.md)
- [Winter Arc Master Plan](WINTER_ARC_MASTER_PLAN.md)
- [Winter Arc Architecture](WINTER_ARC_ARCHITECTURE.md)

## Existing Database Context
The current system contains 27 tables and 15 views across various domains (Mind OS, Productivity, Learning OS, Fitness, Time, Finance, System, Data Lab). The goal is to leverage these existing structures (especially `events`, `tasks`, `goals`, `journal_entries`) wherever possible to avoid unnecessary database bloat.

---

## Gap Analysis by Concept

### 1. Seasons / Winter Arc
**Why Needed:** To group a specific timeframe under a strategic theme (e.g., "Winter Arc") with start/end dates and specific configurations.
- **Existing Data Available:** `goals` could potentially model this (domain = season), but it's semantically different from a single achievable goal.
- **New Data Required:** A way to define the active season and its metadata.
- **Derivable Data:** N/A
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
- **Minimal Model:**
  - Columns: `id`, `user_id`, `name`, `start_date`, `end_date`, `theme`, `status`, `config` (jsonb), `created_at`, `updated_at`
  - RLS: Standard user-isolation (`user_id = auth.uid()`)
  - Indexes: `user_id`, `status`

### 2. Avatar State
**Why Needed:** To represent the user's current level, XP, cosmetics, and appearance.
- **Existing Data Available:** None specifically for avatars.
- **New Data Required:** Current level, equipped cosmetics.
- **Derivable Data:** Total XP can be derived from the events ledger.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
  - Cosmetics stored as `equipped_items jsonb` on avatar state. Do NOT create a separate cosmetics table.
- **Minimal Model:**
  - Columns: `id` (maps to user_id), `current_level`, `equipped_items` (jsonb), `updated_at`
  - RLS: Standard user-isolation
  - Indexes: `id`

### 3. XP / Progression
**Why Needed:** To track XP gained from various activities to level up the Avatar.
- **Existing Data Available:** `events` table tracks system activities.
- **New Data Required:** None, if we leverage payloads.
- **Derivable Data:** Total XP = SUM(payload->>'xp') from `events` where type is XP-earning.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **EXTEND EXISTING** / **VIEW ONLY**
  - Extend the `events` table usage by standardizing `payload.xp`. Create a database view or compute on the fly. XP is deterministically derived from canonical events.  If performance requires optimization, create a `data_lab_signal_xp` SQL view following the existing signal view pattern.

### 4. Achievements / Badges
**Why Needed:** Gamification rewards for reaching specific milestones.
- **Existing Data Available:** None for unlocked achievements.
- **New Data Required:** Record of which user unlocked which achievement and when.
- **Derivable Data:** Progress towards achievements (computed from events/tasks).
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE** (for unlocks) + **CODE ONLY** (for definitions)
- **Minimal Model:**
  - Definitions: Hardcoded TypeScript constants (`achievements_catalog`).
  - Unlocks Table: `user_achievements` (`id`, `user_id`, `achievement_id` (string), `unlocked_at`)
  - RLS: Standard user-isolation
  - Indexes: `user_id`, `achievement_id`

### 5. Knowledge Resources (Books, Videos, etc.)
**Why Needed:** To track books, videos, and articles consumed during the arc.
- **Existing Data Available:** `learning_roadmaps` and `learning_projects` are too heavy/structured for simple consumption tracking.
- **New Data Required:** A unified library tracking table.
- **Derivable Data:** N/A
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
- **Minimal Model:**
  - Columns: `id`, `user_id`, `type` (book/video/article), `title`, `author`, `url`, `status`, `progress_percent`, `started_at`, `completed_at`, `notes` (text)
  - RLS: Standard user-isolation
  - Indexes: `user_id`, `type`, `status`

### 6. Life Pulse Logs
**Why Needed:** Lightweight, periodic mood or status check-ins.
- **Existing Data Available:** `journal_entries` handles heavy reflection; `events` can handle lightweight logs.
- **New Data Required:** None.
- **Derivable Data:** Pulse trends over time.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
  - Pulse is domain data (how I feel right now), not telemetry (what happened). Dedicated `pulse_logs` table enables efficient time-series querying for pattern analysis. Schema: `(id, user_id, logged_at timestamptz, category text, intensity smallint, note text, created_at)`. Canonical telemetry `pulse.checkin.logged` may additionally be emitted.

### 7. Notifications
**Why Needed:** To send reminders and alerts to the user.
- **Existing Data Available:** `events` could log sent notifications.
- **New Data Required:** Notification preferences.
- **Derivable Data:** N/A
- **UI-Only State:** `localStorage` for push subscription keys or UI preferences, if not syncing across devices.
- **External State:** Browser Push API.
- **Recommendation:** **UI STATE ONLY** / **EXTEND EXISTING**
  - Store config in UI/local state or a generalized `user_preferences` jsonb. Log sent notifications in `events`.

### 8. Reports
**Why Needed:** Weekly/Monthly/Arc summaries of data.
- **Existing Data Available:** `current_day_snapshot`, `data_lab_weekly_system_score_12w` views.
- **New Data Required:** Persisted snapshots of generated reports to avoid heavy re-computation for historical views.
- **Derivable Data:** The report content itself is derived from all OS tables.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **DERIVE ON DEMAND**
  - Reports are computed on demand from existing SQL views and domain tables.  Client-side rendering and export. 

### 9. Recovery Periods
**Why Needed:** To track intentional downtime and rest.
- **Existing Data Available:** `time_logs` (rest category), `journal_entries` (mood).
- **New Data Required:** None.
- **Derivable Data:** Identifying gaps in activity or analyzing rest-categorized time logs.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **VIEW ONLY** / **DERIVABLE**
  - Treat recovery as a computed lens over `time_logs`, `events`, and `journal_entries` rather than a distinct entity.

### 10. Experiments
**Why Needed:** To track hypotheses, duration, and outcomes of lifestyle changes.
- **Existing Data Available:** None.
- **New Data Required:** Metadata about the experiment and its results.
- **Derivable Data:** Metrics tracked during the period.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
- **Minimal Model:**
  - Columns: `id`, `user_id`, `title`, `hypothesis`, `start_date`, `end_date`, `status`, `conclusion` (text), `config` (jsonb for metrics tracked)
  - RLS: Standard user-isolation
  - Indexes: `user_id`, `status`

### 11. Timeline Events
**Why Needed:** A unified chronological feed of the user's journey.
- **Existing Data Available:** Everything (`workouts`, `journal_entries`, `learning_sessions`, `events`).
- **New Data Required:** None.
- **Derivable Data:** A UNION of various tables sorted by timestamp.
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **VIEW ONLY**
  - Create a database view that aggregates key milestones and activities into a unified timeline format.

### 12. API Integrations
**Why Needed:** For external services or CLI tools to interact with the system.
- **Existing Data Available:** Supabase Auth handles standard user sessions, but not scoped API keys.
- **New Data Required:** API tokens for programmatic access.
- **Derivable Data:** N/A
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **NEW TABLE**
- **Minimal Model:**
  - Columns: `id`, `user_id`, `name`, `token_hash`, `scopes` (text[]), `expires_at`, `last_used`, `created_at`
  - RLS: Standard user-isolation
  - Indexes: `user_id`, `token_hash`

### 13. Theme Preferences
**Why Needed:** Dark mode, Winter Arc themes, UI density.
- **Existing Data Available:** N/A
- **New Data Required:** Simple key-value preferences.
- **Derivable Data:** N/A
- **UI-Only State:** `localStorage` / React Context.
- **External State:** N/A
- **Recommendation:** **UI STATE ONLY** (Unless cross-device sync is critical, then store in a generalized `user_profiles.preferences` jsonb).

### 14. Periodic Thoughts
**Why Needed:** Displaying stoic quotes, reminders, or prompts.
- **Existing Data Available:** N/A
- **New Data Required:** None for the content itself.
- **Derivable Data:** N/A
- **UI-Only State:** N/A
- **External State:** N/A
- **Recommendation:** **CODE ONLY**
  - Define thoughts as TypeScript arrays/constants. Use local state to handle rotation/display logic to minimize DB calls.

---

## Summary Matrix

| Concept | Existing Data Available | Recommendation | Strategy |
| :--- | :--- | :--- | :--- |
| **Seasons / Winter Arc** | None | **NEW TABLE** | `seasons` table for metadata |
| **Avatar State** | None | **NEW TABLE** | Single row per user `avatar_state` |
| **XP / Progression** | `events` | **EXTEND EXISTING** | Derive from event_type + payload; SQL view if needed |
| **Achievements** | None | **NEW TABLE + CODE** | `user_achievements` + TS Definitions |
| **Knowledge Resources** | None | **NEW TABLE** | Unified `knowledge_resources` table |
| **Life Pulse Logs** | `events`, `journal_entries`| **NEW TABLE** | Dedicated `pulse_logs` table |
| **Notifications** | `events` | **UI STATE + EXISTING**| UI config + log to `events` |
| **Reports** | Views | **DERIVE ON DEMAND** | On-demand computation, no table initially |
| **Recovery Periods** | `time_logs`, `journal` | **VIEW ONLY** | Derived from existing activity gaps |
| **Experiments** | None | **NEW TABLE** | Lightweight `experiments` table |
| **Timeline Events** | All tables | **VIEW ONLY** | UNION view over major events |
| **API Integrations** | Supabase Auth | **NEW TABLE** | `api_tokens` table for scoped access |
| **Theme Preferences** | None | **UI STATE ONLY** | localStorage / Context |
| **Periodic Thoughts** | None | **CODE ONLY** | TS Constants |
