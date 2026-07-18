# LIFE OS — PROJECT ROADMAP

This document describes the implemented state of Life OS and the active development direction.

It is ordered by what has been built, then what comes next. It does not contain speculative visions or unconfirmed plans.

---

## DEVELOPMENT PHILOSOPHY

Life OS evolves gradually, module by module.

Every system must follow:
- Domain-isolated modular architecture
- Relational database design with SQL-first aggregation
- Durable telemetry on all state-changing mutations
- Low-friction logging (minimum interaction to record reality)
- Cognitive boundary protection (reflection ≠ execution)

Features are only added when the underlying architecture can support them safely.

---

## IMPLEMENTED SYSTEMS

### ✅ Phase 1 — Core Shell + Mind OS + Productivity Hub

**Global Shell:**
- True-black dark mode SPA with nested React Router routing
- Collapsible sidebar rail (compact/expanded, session-persisted)
- Mobile drawer with hamburger toggle
- AppShell with GlobalTimerBar, SystemFeedbackToast, CommandPalette overlays
- AppErrorBoundary for per-route error isolation
- Supabase auth with `ProtectedRoute` and `AuthContext`

**Mind OS (`/mind-os`):**
- Habit Tracker: value-based and binary habits, habit logs, streak tracking
- Habit recovery flow: mistake reason, recovery commitment, streak heal
- Journal: mood, multi-field entries (went well, went wrong, lesson learned, day brief)
- Journal multi-entry per day with retroactive date support
- Journal calendar modal with per-day mood aggregation and multi-entry badge
- Journal date modal with read-only timeline

**Productivity Hub (`/productivity-hub`):**
- Tasks Kanban (To Do / Doing / Done)
- Task creation with priority, deadline type, and deadline date
- `is_completed` boolean schema for reliable completion queries

---

### ✅ Phase 2 — Progress Hub

- Programming skills: level tracking, project count increments
- Personal skills: level, project count, progress increments
- Milestones: create and toggle completion
- Challenges: create and status transitions (Active → Completed / Dropped)
- Progress Hub dashboard aggregating all sub-features

---

### ✅ Phase 3 — Fitness OS

- Workouts with exercise logs (sets, reps, weight per exercise)
- Exercise library (custom exercise CRUD)
- 90-day effort heatmap
- Weekly summary cards (active days, total minutes)
- Calendar popup and day details drawer
- Personal Records page
- Soft deletes throughout

---

### ✅ Phase 4 — Finance OS

- Behavioral spending ledger (`public.transactions`)
- Need vs. want tracking (`is_need` boolean)
- Monthly metrics: total spent, money left, daily safe limit, projected spend, waste
- Weekly burn card with 7-day mini-bars and baseline overrun feedback
- Quick-log modal (mobile-first FAB)
- Decision feedback toasts: want spike warning, over-budget projection alert
- Migrated from legacy `finance_transactions` to `transactions` table

---

### ✅ Phase 5 — Events Analytics Pipeline

- `public.events` durable analytics table with IST-scoped date keys
- `logEventSafe` utility for non-blocking event writes
- `EVENT_TYPES` constants in `src/lib/eventTaxonomy.ts`
- Event emission across all domain mutations
- `useEventsAnalytics` hook: weekly event count, consistency percent, momentum delta
- Weekly consistency summary feeds Mission Control

---

### ✅ Phase 6 — Planning Engine (Inside Productivity Hub)

- Weekly focus text field with upsert behavior
- Goals CRUD with status tracking
- Weekly plan items with completion
- Weekly review capture
- Alignment health summary (goals/plan completion metrics)

---

### ✅ Phase 7 — Time OS

- Global active timer (one per user, enforced by DB unique index)
- Bucket categories: Academics, Deep Work, Admin, Fitness, Learning
- Optional task linkage (Start Focus → task to Doing; stop → task to Done)
- Manual log entry
- Time insights: today total, bucket distribution bar, 7-day trend
- GlobalTimerBar global overlay
- PiP timer via Document Picture-in-Picture API
- `deep_work_minutes_today` integrated into Brain Engine snapshot

---

### ✅ Phase 8 — Brain Engine v1

- `current_day_snapshot` SQL view: per-user daily facts
- `current_day_snapshot_history_14d` SQL view: 14-day rolling history
- `analyzeMomentum.ts`: momentum score (0–100) + trend (rising/falling/stable)
- `generateDirectives.ts`: urgency scoring across 5 domains (task/habit/journal/deep-work/fitness)
- `systemEngine.ts`: issue detection + orchestration
- `useSystemStatus.ts`: React Query hook composing snapshot + Brain Engine
- `BrainEngineHero.tsx`: Mission Control full Brain Engine panel
- `SystemStatusCard.tsx`: compact system status + directive CTA
- `DailyBriefing.tsx`: momentum-band tone message
- Cross-module reactivity: `['system-status']` invalidation

---

### ✅ Phase 9 — Event Bus + Evening Sync

- `useEventBus` Zustand store: in-memory ring buffer (max 50 events)
- `public.system_event_queue`: transient operational signals
- `public.system_metrics`: daily Evening Sync snapshots
- `useEveningSync.ts`: reads queue, computes momentum delta, writes metrics, clears queue + bus
- Transient event types: DEEP_WORK_COMPLETED, WORKOUT_COMPLETED, HABIT_FAILED, WANT_EXPENSE_ADDED

---

### ✅ Phase 10 — Data Lab v1

- Dedicated analytics module at `/data-lab`
- Three SQL views: daily 90d, weekly 12w, module consistency 30d
- Event coverage view: 30-day per-event-type coverage
- Metrics engine (11 pure computation files): consistency, correlation, drift, insights, momentum, rhythm, streaks, systemHealth, telemetryHealth, weeklyScore
- Transforms layer: chart-ready data for behavior, overview, telemetry
- Data maturity system: insufficient / experimental / stable
- Three-tab UI: Overview, Behavior, Telemetry
- Analytics period selector: 7d / 30d / 90d / all
- Chart components: ContributionCalendar, BehaviorTimeline, HabitStreakRivers, CorrelationMatrix, MomentumDistribution, ActivityHistogram, EventFrequencyHistogram, EventWaterfall
- Telemetry: TelemetryHealthCard, SystemHealthPanel, RecentEventStream

---

## IN PROGRESS / NEXT PRIORITIES

### Finance OS Expansion
- Recurring expense tracking
- Savings/investment buckets
- Weekly and monthly trend comparisons

### Brain Engine Quality
- Deeper cross-domain pressure signals (e.g., finance-aware directive weights)
- Historical momentum from `system_metrics` integrated into trend calculation
- Broader domain intelligence inputs

### Events Coverage Expansion
- Ensure all domain mutations have complete durable event coverage
- Audit legacy event strings and migrate to taxonomy-compliant versions

### Data Lab Depth
- Cross-domain behavioral insights engine (pattern: productivity on workout days)
- Temporal correlation between domains (mood vs. output, habits vs. task completion)
- User-facing insight narratives from metrics data

### Task System Expansion
- Deadline display and overdue indicators
- Filtering and sorting on Kanban
- Search across tasks

---

## LONG-TERM VISION

- AI insight layer reading behavioral history from `public.events`
- Pattern explanations: productivity on workout days, mood vs. execution, habit consistency vs. output
- Depends on complete event coverage and stable analytics contracts

---

## FINAL DEVELOPMENT RULE

All future systems must:
1. Integrate with the events analytics pipeline (`logEventSafe` on mutations)
2. Preserve strict cognitive boundaries (reflection ≠ execution)
3. Use SQL-first aggregation for derived data
4. Follow domain-isolated folder structure
