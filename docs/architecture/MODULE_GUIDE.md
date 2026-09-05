# LIFE OS — MODULE GUIDE

**Status:** Authoritative Module Reference  
**Last Synchronized:** September 2026 (Post-Integrity Campaign Baseline)  
**Target Repository:** `pradeep23g/life-os`

---

## 1. Mission Control

**Route:** `/mission-control` (and `/`)  
**Type:** Executive Command Center (Read-Only Aggregator)  
**Location:** `src/features/mission-control/`

### Responsibility
The central nervous system of Life OS. Aggregates live domain metrics, renders the Brain Engine momentum score with real historical EMA sparklines, surfaces context-aware daily directives, evaluates 7-domain subsystem health, and provides the Evening Sync closing card.

### Key Components & Hooks
- `useMissionControlSnapshot()`: Master aggregation hook consuming domain query hooks, `useSystemStatus()`, and `usePendingEventsCount()`.
- `MissionControl.tsx`: Dashboard layout with metrics grid, BrainEngineHero, 7-domain Live System Status cards, and recent events stream.
- `BrainEngineHero.tsx`: Momentum dial, real EMA sparkline (bars with tooltips; honest flat baseline at 0 when history is empty), deterministic confidence badge, and directive action button.
- `EndOfDayCard.tsx`: Evening Sync trigger card with real-time pending event depth from database.
- `systemHealthEvaluator.ts`: Deterministic pure evaluation functions:
  - `computeSystemConfidence()`: Weighted confidence score (35% Freshness, 35% Completeness, 30% Coverage).
  - `evaluateSystemStatuses()`: Evaluates all 7 active domains with domain-specific health criteria.
  - `evaluateSystemThreats()`: Sorts prioritized warnings from Brain Engine signals.

---

## 2. Mind OS

**Route:** `/mind-os`, `/mind-os/habits`, `/mind-os/journal`  
**Type:** Reflection Workspace  
**Location:** `src/features/mind-os/`

### Responsibility
Cognitive reflection surface. Focuses on habit formation, streak recovery, and daily contemplative journaling. Strictly decoupled from execution pressure.

### Key Components & Hooks
- `useHabits.ts`: Habit CRUD, daily completions (`habit_logs`), streak computation with retroactive break logging (`habit_streak_breaks`), and monthly heal tokens (max 5/month, `habit_streak_heals`).
- `useJournal.ts`: Multi-entry daily reflection ledger (`journal_entries`) with 1–5 mood scoring and structured prompts (`what_went_good`, `what_you_learned`, `brief_about_day`).
- `MindOsDashboard.tsx`: Habit overview, mood distribution, streak records.
- `HabitsPage.tsx`: Interactive habit checklist, count increments, calendar heatmaps, streak break/heal modals.
- `JournalPage.tsx`: Chronological reflection stream with prompt templates and mood selector.

---

## 3. Productivity Hub

**Route:** `/productivity-hub`, `/productivity-hub/tasks`, `/productivity-hub/planning`  
**Type:** Execution Workspace  
**Location:** `src/features/productivity-hub/`

### Responsibility
Execution engine for task management and weekly planning. Translates long-term goals into structured weekly commitments and daily actions.

### Key Components & Hooks
- `useTasks.ts`: Actionable task ledger (`tasks`) with deadline constraints (`same_day`, `specific_date`, `no_deadline`), soft deletion, and status toggles.
- `usePlanning.ts`: Weekly plan management (`weekly_plans`), strategic goals (`goals`), weekly commitment items (`weekly_plan_items`), and end-of-week reviews (`weekly_reviews`).
- `ProductivityHubDashboard.tsx`: Task progress, active weekly focus, goal progress.
- `TasksPage.tsx`: Grouped task lists partitioned by deadline type with quick-add forms.
- `PlanningPage.tsx`: Weekly focus theme input, goal hierarchy, backlog Kanban board (Planned $\rightarrow$ Doing $\rightarrow$ Done / Dropped), and weekly review modal.

---

## 4. Learning OS

**Route:** `/learning-os`, `/learning-os/explore`, `/learning-os/analytics`, `/learning-os/roadmap/:id`  
**Type:** Skill Acquisition & Curriculum Engine  
**Location:** `src/features/learning-os/`

### Responsibility
Structured skill acquisition. Replaces unstructured learning with hierarchical curriculums, atomic lessons, time-tracked practice sessions, milestones, proof-of-work projects, and conceptual reflections.

### Key Components & Hooks
- `useLearningOS.ts`: Master hook providing:
  - `useRoadmaps()`, `useStages()`, `useSessions()`: Curriculum CRUD.
  - `useRecentSessionLogs(roadmapId)`: Bounded feed (`.limit(20)`) for dashboard performance.
  - `useSessionAnalytics(roadmapId)`: Unbounded query for lifetime statistics (total hours, velocity, completion percentage).
  - `useRoadmapProgress()`: Reads `learning_roadmap_progress` SQL view for progress rollups.
  - `useMilestones()`, `useProjects()`, `useReflections()`: Extended learning capability queries.
- `RoadmapDashboard.tsx`: Grid of active roadmaps with completion bars and next session prompts.
- `RoadmapDetailView.tsx`: Hierarchical stage curriculum tree with collapsible session units.
- `AnalyticsPage.tsx`: Comprehensive lifetime analytics consuming `useSessionAnalytics()`.
- `ExplorePage.tsx`: Pre-built curriculum templates.

---

## 5. Fitness OS

**Route:** `/fitness-os`, `/fitness-os/workouts`, `/fitness-os/library`, `/fitness-os/pr`  
**Type:** Physical Discipline Workspace  
**Location:** `src/features/fitness-os/`

### Responsibility
Strength training and cardiovascular fitness ledger. Emphasizes active session tracking, progressive overload, and custom movement libraries.

### Key Components & Hooks
- `useFitness.ts`:
  - `workouts`: Training sessions with single active workout invariant (`fetchActiveWorkout()` where `end_time IS NULL`).
  - `fitness_exercises`: Custom movement catalog with target muscle groups and equipment tags.
  - `exercise_logs`: Performance entries per exercise (sets, reps, weight_kg, duration_minutes, distance_km, RPE 1–10).
  - `usePersonalRecords()`: Computes all-time top weight and rep milestones per movement.
- `FitnessOsDashboard.tsx`: Weekly workout volume, muscle group balance, recent training sessions.
- `WorkoutsPage.tsx`: Active workout logging panel with live timer and set/rep inputs.
- `FitnessLibraryPage.tsx`: Searchable movement directory with category filters.
- `PersonalRecordsPage.tsx`: Historical PR cards with dates and weight milestones.

---

## 6. Time OS

**Route:** `/time-os`  
**Type:** Time Intelligence & Focus Tracking  
**Location:** `src/features/time-os/`

### Responsibility
Deep work tracking and focus duration ledger. Integrates native browser Document Picture-in-Picture for persistent focus companion windows.

### Key Components & Hooks
- `useTimeLogs.ts`: Timer start/stop/delete; enforces single active timer constraint via partial unique index.
- `useTimeAnalytics.ts`: Today's bucket distribution (`Deep Work`, `Learning`, `Admin`, `Health`), 7-day deep work trend.
- `TimeOSPage.tsx`: Manual focus session logging, timer history list, bucket distribution charts. Modal automatically closes upon log submission or timer start.
- `GlobalTimerBar.tsx`: Sticky floating bar providing continuous timer visibility and stop controls.
- `PiPTimer.tsx`: Native browser Picture-in-Picture window for distraction-free tracking across desktop applications.

---

## 7. Finance OS

**Route:** `/finance-os`  
**Type:** Behavioral Financial Awareness  
**Location:** `src/features/finance-os/`

### Responsibility
Behavioral spending awareness. Focuses on evaluating discretionary financial discipline through strict Need vs Want categorization of expenses.

### Key Components & Hooks
- `useFinance.ts`: Transaction creation and deletion targeting canonical `public.transactions`. Computes monthly spending totals, Need vs Want ratios, and category distributions.
- `FinanceDashboard.tsx`: Monthly spending summary cards, Need vs Want progress bars, category breakdown.
- `TransactionForm.tsx`: Quick transaction drawer with Need vs Want toggle and category select.

> [!NOTE]
> `transactions` is the sole canonical table for Finance OS. The legacy `finance_transactions` table was permanently dropped in historical cleanup.

---

## 8. Data Lab

**Route:** `/data-lab`  
**Type:** Deep Behavioral Analytics Workbench  
**Location:** `src/features/data-lab/`

### Responsibility
Read-only analytical workbench querying PostgreSQL SQL views. Integrates all 7 behavioral domains to analyze long-term consistency, habit streaks, drift, and telemetry coverage.

### Key Tabs & Components
- **Overview Tab:** 12-week system score card, 90-day GitHub-style contribution calendar, multi-domain activity histogram.
- **Behavior Tab:** 30-day module consistency table, habit streak rivers, correlation matrix, behavioral drift indicators.
- **Telemetry Tab:** Real-time event stream from `public.events`, 30-day event coverage breakdown, and silent event degradation detector.
- **Normalized Key Matching:** Lookup extractors in `consistency.ts` and `systemHealth.ts` use normalized key matching (`normalizeKey()`) to seamlessly match database view rows (`'Mind / Habits'`, `'Mind / Journal'`) regardless of spacing variations.

---

## 9. System & Brain Engine

**Location:** `src/features/system/`  
**Type:** Global Intelligence & Operations

### Responsibility
The central intelligence engine that computes real-time momentum, evaluates multi-domain urgency scores, generates prioritized daily directives, and flushes the transient event queue.

### Key Modules & Components
- `systemEngine.ts`: Master engine coordinator mapping snapshot inputs to momentum, directives, and issues.
- `useSystemStatus.ts`: React Query hook querying `public.current_day_snapshot` (14-column projection including `budget_utilization_percentage` and `recent_want_expenses_count`) and `current_day_snapshot_history_14d`.
- `domainSignals.ts`: Evaluates behavioral rules across all 7 domains (Mind, Execution, Fitness, Time, Learning, Finance).
- `analyzeMomentum.ts`: Computes Exponential Moving Average (EMA, $\alpha = 0.6$) momentum, symmetric trend deltas, intra-day deep work bonuses (+4 points for > 120 min), and low-momentum acceleration.
- `generateDirectives.ts`: Calculates domain urgency scores and selects the top actionable directive.
- `useEveningSync.ts`: Processes all pending events in `public.system_event_queue` across all dates in batches of 50, updates `public.system_metrics`, flushes the queue, and invalidates query caches.

