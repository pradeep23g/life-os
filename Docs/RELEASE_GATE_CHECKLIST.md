# LIFE OS — RELEASE GATE CHECKLIST

Every release must pass this gate before deployment.

---

## 1. Required Build Commands

Run from `life-os/` root:

```bash
npm run lint             # ESLint — zero errors, zero warnings
npm run build            # tsc -b && vite build — must succeed cleanly
npm run verify:release   # Combined lint + build
```

All three must pass. Do not deploy if any command fails.

---

## 2. Core Journey Verification

### Mission Control (`/`)

- [ ] Dashboard loads without errors or blank states
- [ ] Brain Engine hero panel renders:
  - Momentum score and trend direction visible
  - Active directive label and reason visible
  - CTA route navigates correctly
  - Issues list renders (or "All clear" state)
  - Daily briefing tone message visible
- [ ] Metric cards render: Average Mood, Pending Tasks, Fitness This Week, Habit Streak
- [ ] System status panels render
- [ ] Recent events surface shows last 5 bus events (or empty state)
- [ ] Evening Sync button triggers without error

---

### Mind OS (`/mind-os`)

**Dashboard:**
- [ ] Dashboard renders without errors
- [ ] Habit consistency and journal summary visible

**Habits (`/mind-os/habits`):**
- [ ] Create habit succeeds
- [ ] Mark habit done updates progress
- [ ] Mark habit undone reverts progress
- [ ] Target count increment (`+`) works
- [ ] Target count set via keyboard input works
- [ ] Mistake reason + recovery commitment saves correctly
- [ ] Streak heal flow completes
- [ ] Calendar modal opens and displays done/break/healed states correctly

**Journal (`/mind-os/journal`):**
- [ ] Modal entry creation succeeds
- [ ] Retroactive date-based entry creation works (multi-entry same day)
- [ ] Journal list shows most recent entries
- [ ] Calendar modal opens with per-day mood aggregation and multi-entry badge
- [ ] Date modal shows read-only timeline cards with preserved text formatting

---

### Productivity Hub (`/productivity-hub`)

**Dashboard:**
- [ ] Dashboard renders without errors

**Tasks (`/productivity-hub/tasks`):**
- [ ] Create task succeeds
- [ ] Task moves from To Do → Doing correctly
- [ ] Task moves from Doing → Done correctly
- [ ] `Start Focus` opens timer flow correctly (links task to Time OS)

**Planning (`/productivity-hub/planning`):**
- [ ] Weekly focus text saves and updates correctly
- [ ] Goal create succeeds
- [ ] Goal status update succeeds
- [ ] Plan item create succeeds
- [ ] Plan item status update succeeds
- [ ] Weekly review saves and updates correctly
- [ ] Alignment metrics render correctly

---

### Progress Hub (`/progress-hub`)

- [ ] Dashboard renders without errors
- [ ] Programming skills: create, level up, increment project count
- [ ] Personal skills: create, level up, increment project count, increment progress
- [ ] Milestones: create, toggle completion
- [ ] Challenges: create, transition status (Active → Completed, Active → Dropped)

---

### Fitness OS (`/fitness-os`)

- [ ] Dashboard renders weekly cards, calendar popup/day drawer, 90-day heatmap
- [ ] Workouts: create, update, soft-delete
- [ ] Exercise logs: add sets/reps/weight to a workout
- [ ] Library: create, update, soft-delete custom exercises
- [ ] Personal Records page renders without errors

---

### Time OS (`/time-os`)

- [ ] Active timer persists across route changes
- [ ] Active timer persists across page refresh
- [ ] Start timer succeeds (bucket selection works)
- [ ] Stop timer logs the session correctly
- [ ] Manual log entry saves correctly
- [ ] Task-linked timer: start → task moves to Doing
- [ ] Task-linked timer: stop → task moves to Done
- [ ] Time insights render:
  - Today total minutes
  - Bucket distribution bar and legend
  - 7-day trend mini bars
- [ ] GlobalTimerBar visible from all routes
- [ ] GlobalTimerBar CTA navigates to `/time-os`
- [ ] PiP timer opens correctly (if browser supports Document PiP)

---

### Finance OS (`/finance-os`)

- [ ] Dashboard renders all metric cards:
  - Total spent
  - Money left
  - Days remaining in month
  - Daily safe limit
  - Projected monthly spend status
  - Waste card and top waste category
- [ ] Weekly burn card renders:
  - Weekly total vs baseline
  - 7 daily mini-bars
  - Spike coloring for high-spend days
  - Projection status text
- [ ] Quick-log modal:
  - Opens from FAB
  - Amount, category, need/want, note all save correctly
  - Custom category flow (`Other`) works
- [ ] Decision feedback loop:
  - Want spike over safe limit shows warning toast
  - Over-budget projection shows alert toast
  - Normal entry shows success toast

---

### Data Lab (`/data-lab`)

- [ ] All three tabs render without errors: Overview, Behavior, Telemetry
- [ ] Period selector changes metric display correctly
- [ ] Overview: WeeklyScoreSummary, ModuleConsistencyCard, BehaviorDriftCard visible
- [ ] Behavior: ContributionCalendar, BehaviorTimeline, HabitStreakRivers render
- [ ] Behavior: CorrelationMatrix shows maturity guard if insufficient data
- [ ] Telemetry: TelemetryHealthCard, SystemHealthPanel, RecentEventStream render
- [ ] Empty states render correctly (not blank or broken) when data is insufficient

---

## 3. Data Integrity / Schema Guard

- [ ] App remains functional if optional views are not yet migrated (graceful fallbacks active)
- [ ] New migrations have been applied and verified in Supabase before deployment
- [ ] Snapshot views exist and return expected rows:
  - `current_day_snapshot`
  - `current_day_snapshot_history_14d`
- [ ] Data Lab views exist and return rows:
  - `data_lab_daily_activity_90d`
  - `data_lab_weekly_system_score_12w`
  - `data_lab_module_consistency_30d`
  - `data_lab_event_coverage_30d`

---

## 4. Event Pipeline Checks

- [ ] Core user actions create rows in `public.events`
- [ ] Event logging failures do not block primary user actions
- [ ] Data Lab and analytics cards render fallback values if `events` is unavailable
- [ ] `system_event_queue` receives bus events from mutations
- [ ] Evening Sync processes queue correctly and clears it

---

## 5. Brain Engine Reactivity Checks

After successful mutations in the following domains, confirm Brain Engine refreshes:
- [ ] Task create/status change → `['system-status']` invalidated → Brain state updates
- [ ] Habit complete/uncomplete → `['system-status']` invalidated → Brain state updates
- [ ] Journal entry create → `['system-status']` invalidated → Brain state updates
- [ ] Workout create/complete → `['system-status']` invalidated → Brain state updates
- [ ] Time log stop (deep work) → `['system-status']` invalidated → Brain state updates

---

## 6. Responsive Design Checks

- [ ] Desktop: sidebar rail visible in compact mode, expands correctly
- [ ] Mobile: hamburger menu opens and closes sidebar drawer
- [ ] All module sub-nav tabs scroll horizontally on mobile
- [ ] Cards stack correctly on mobile (1-column)
- [ ] Multi-column grids activate on desktop (≥ 768px)

---

## 7. Global Overlay Checks

- [ ] `AppErrorBoundary` catches page-level errors without crashing the shell
- [ ] `SystemFeedbackToast` shows correct success/error/warning messages
- [ ] `CommandPalette` opens on `Ctrl+K` / `Cmd+K`
- [ ] `GlobalTimerBar` shows correct active/idle state
