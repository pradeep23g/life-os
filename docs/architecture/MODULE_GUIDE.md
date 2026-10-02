---
title: "Module Guide"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "architecture"
---

# LIFE OS — MODULE GUIDE

**Status:** Authoritative Module Reference  
**Last Synchronized:** September 2026 (Winter Arc 2.0 Baseline — Commit `77d1a5b`)  
**Target Repository:** `pradeep23g/life-os`

---

## 1. Mission Control

**Route:** `/system` (legacy `/mission-control` redirects here)  
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
**Type:** Physical Discipline Workspace & Kinetic Ledger  
**Location:** `src/features/fitness-os/`

### Responsibility
Strength training and cardiovascular fitness ledger. Features step-by-step active set logging, progressive overload tracking, movement pattern classification, and automatic focus-time synchronization with Time OS.

### Key Components & Hooks
- `useFitness.ts`:
  - `workouts`: Training sessions with single active workout invariant (`fetchActiveWorkout()` where `end_time IS NULL`).
  - `fitness_exercises`: Custom movement catalog with target muscle groups and derived movement pattern classification (Squat, Hinge, Push, Pull, Core, Carry).
  - `exercise_logs`: Performance entries per exercise (sets, reps, weight_kg, duration_minutes, RPE 6–10).
  - `endWorkoutSession`: Completes workout and automatically writes a corresponding session entry into `public.time_logs` under the `'Fitness'` bucket, keeping Time OS and momentum scoring in sync.
- `WorkoutsPage.tsx`: Command prompt workout initializer (`> INITIALIZE WORKOUT`) with example placeholders, weekly consistency scoring, and expandable session log rows.
- `ActiveWorkoutPanel.tsx`: Kinetic focus mode displaying Current Set vs Next Set preview, massive Geist Mono mass/rep numerals, collapsible tactical touch numpad (`1-9, 0, ., CLR`), and optional RPE scale.
- `FitnessLibraryPage.tsx`: Movement directory supporting dual-mode categorization (`[ PRIMARY MUSCLE ]` vs `[ MOVEMENT PATTERN ]`).
- `AnatomyWireframe.tsx`: Cybernetic SVG wireframe visually highlighting targeted muscle groups (Chest, Lats, Deltoids, Arms, Quads, Hamstrings, Core).
- `PersonalRecordsPage.tsx`: Monument trophies with concentric cybernetic sigils, hybrid hold duration support, and screen flash celebration prompt (`"RECORD OVERWRITTEN // PROTOCOL ASCENDANCY ESTABLISHED"`).

---

## 6. Time OS

**Route:** `/time-os`  
**Type:** Time Intelligence & Chronos Engine  
**Location:** `src/features/time-os/`

### Responsibility
Deep work tracking, temporal density analysis, and habit cultivation. Integrates native browser Document Picture-in-Picture, a 24-hour daily Gantt timeline, and streak-driven bioluminescent root visualizers.

### Key Components & Hooks
- `useTimeLogs.ts`: Timer start/stop/delete; enforces single active timer constraint via partial unique index.
- `useTimeAnalytics.ts`: Aggregates 24-hour bucket distribution and 7-day historical trends.
- `TimeOSPage.tsx`: Tri-modal view coordinator (`[MONOLITH]`, `[HISTORY]`, `[ANALYTICS]`), active session duration timer with ambient glow, and 24-hour daily Gantt timeline strip.
- `TimeInsights.tsx`: Chronos Analytics terminal grid featuring Hero Bucket Distribution cards, Geist Mono percentages, ASCII progress bars (`██████··`), and 7-day trend ledger with peak indicators.
- `TimeHistory.tsx`: Chronos cultivation workspace featuring an 84-day (12-week) GitHub-style density grid with circadian ambient color shifts (Amber/Cyan/Rose/Purple), 8H+ pulse rings, and streak-driven bioluminescent root trees (deterministic coordinate harmonics preserving React 19 purity).
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
- `domainSignals.ts`: Evaluates behavioral rules across all 7 canonical domains (Mind, Productivity, Learning, Fitness, Time, Finance, System).
- `analyzeMomentum.ts`: Computes Exponential Moving Average (EMA, $\alpha = 0.6$) momentum, symmetric trend deltas, intra-day deep work bonuses (+4 points for > 120 min), and low-momentum acceleration.
- `generateDirectives.ts`: Calculates domain urgency scores and selects the top actionable directive.
- `useEveningSync.ts`: Processes all pending events in `public.system_event_queue` across all dates in batches of 50, updates `public.system_metrics`, flushes the queue, and invalidates query caches.

---

## 10. Home (The Porch)

**Route:** `/`  
**Type:** Threshold & Orientation Sanctuary  
**Location:** `src/features/home/`

### Responsibility
The Porch serves as the initial, serene threshold when stepping into Life OS. Built upon an asymmetric Swiss Stage layout, it re-anchors the user's presence without immediate cognitive overwhelm. It integrates solar time awareness, living avatar presence, and a single, dominant daily call-to-action button that dynamically points to the highest-priority directive evaluated by the Brain Engine.

### Key Components & Hooks
- `HomePage.tsx`: Asymmetric stage layout featuring dynamic day/night atmospheric backdrop, circadian greeting, and responsive viewport scaling.
- `SolarPresence`: Living circadian visualizer synchronizing with local time of day (`dawn`, `day`, `dusk`, `midnight`).
- `DynamicActionPortal`: Single dominant action button (`"COMMENCE DEEP WORK"`, `"LOG WORKOUT"`, `"EVENING REFLECTION"`) dynamically routed to the top Brain Engine directive.
- `LivingEmblem`: Ambient avatar presence indicator displaying current momentum phase and protective aura.

---

## 11. Arc Engine (Seasonal Campaigns)

**Route:** `/arc`  
**Type:** Prescriptive Temporal Campaign Engine & Historical Archive  
**Location:** `src/features/arc/`

### Responsibility
The dedicated workspace for high-intensity, prescriptive seasonal developmental campaigns (ADR-012, ADR-029). Holds the user accountable against self-declared seasonal commitments, tracks hybrid focus domains, evaluates deterministic strict linear pacing across 14 registered telemetry bindings, enforces mandatory amendment justification trails, supports early completion, and manages a two-stage completion and retrospective archival lifecycle.

### Key Components & Hooks
- `ArcPage.tsx`: Top-level campaign coordinator. Dynamically routes between:
  - **Active Campaign View:** Renders ChapterHero, FocusDomainsSection, ArcCountdownLedger, EpochHorizonRail, CheckpointLedger, and SeasonalMilestones, with quick actions to amend commitments or conclude the arc early.
  - **Completed Campaign Banner:** When concluded, displays frozen campaign results with a prominent "Author Retrospective" action.
  - **Historical Archive View (`ArcArchiveView.tsx`):** When idle, lists past campaigns with aggregated lifetime health badges and an "Initiate Seasonal Arc" hero button.
- `useArcTelemetry.ts`: Authoritative runtime telemetry hook. Dynamically queries `public.life_seasons` for `status = 'active'`, bounds telemetry metrics between `start_date` and `completed_at ?? today`, resolves metrics using `telemetryRegistry.ts`, computes strict linear pace states via `paceEvaluator.ts`, and provides optimistic `toggleManualMilestone` mutations.
- `ChapterHero.tsx`: Visual banner displaying dynamic campaign title, `{config.totalDays}-DAY` badge, seasonal icon (`ArcIcon.tsx`), and theme accent styling.
- `FocusDomainsSection.tsx`: Renders qualitative thematic focus domain badges alongside bound live telemetry metrics.
- `ArcCountdownLedger.tsx`: Dynamically tracks elapsed days, days remaining, and percentage complete without hardcoded duration assumptions.
- `EpochHorizonRail.tsx`: Horizon visualization demarcating customizable multi-phase tracks (Day X–Y, phase focus, and active phase indicator ring).
- `CheckpointLedger.tsx`: Generates midpoint-mapped weekly checkpoints across variable campaign durations.
- `SeasonalMilestones.tsx`: Dynamic milestone ledger supporting both automated telemetry targets and interactive manual checkboxes, strict pace badges (`ON TRACK`, `AT RISK`, `BEHIND`, `COMPLETE`), and calculated daily recovery rates.
- `CreateArcModal.tsx`: Zero-overhead ingestion modal featuring 1-click interrogation prompt copying, JSON textarea input with real-time Zod schema validation, visual preview cards, and 1-click activation.
- `AmendArcModal.tsx`: Mid-campaign commitment amendment modal enforcing mandatory non-empty reason strings and appending diff logs to `life_seasons.amendments`.
- `ArcRetrospectiveModal.tsx`: 5-question structured retrospective modal gating the transition from `COMPLETED` to immutable `ARCHIVED` status.

---

## 12. Profile

**Route:** `/profile`  
**Type:** Personal Biographical Chronicle & Avatar Sanctuary  
**Location:** `src/features/profile/`

### Responsibility
The user's personal chronicle, biographical identity, and long-term achievement record. Displays the full heroic avatar, capability crests and badges (`public.user_achievements`), historical seasons ledger, system telemetry statistics, and cryptographic session termination.

### Key Components & Hooks
- `ProfilePage.tsx`: Personal chronicle view uniting avatar customization, badge credentials, and account settings.
- `AvatarHero.tsx`: Full-scale composable SVG avatar with active cosmetic equipment and seasonal aura (ADR-013).
- `AchievementGrid.tsx`: Grid of unlocked capability crests and tiered badges (`user_achievements.badge_id`) with unlock timestamps and criteria tooltips (ADR-016).
- `SeasonArchive.tsx`: Historical timeline of completed life seasons and seasonal vow retrospectives.
- `SessionSignOut`: Cryptographically invalidates local Supabase session tokens and redirects to `/auth`.

---

## 13. Admin Console

**Route:** `/admin`  
**Type:** System Operations & Control Plane  
**Location:** `src/features/admin/`

### Responsibility
The central maintenance and governance cockpit for Life OS. Provides database health monitoring against canonical tables (`public.events`, `public.time_logs`), JSON schema ingestion and export for roadmaps and seasons, table telemetry audits, and administrative overrides.

### Key Components & Hooks
- `AdminConsolePage.tsx`: Monolithic administrative control plane layout and logic containing integrated database health status checks, table telemetry counters (`events`, `time_logs`), JSON schema ingestion and export tools for roadmaps and seasons, and administrative overrides.

---

## 14. Field Reports

**Route:** `/reports`  
**Type:** Broadsheet Sunday Field Dossier  
**Location:** `src/features/reports/`

### Responsibility
A dense, editorial-style Sunday field dossier synthesizing cross-domain performance. Modeled on broadsheet print layout standards (Geist Mono and Newsreader serif typography), it compiles weekly planning goals (`weekly_plans`), commitment items (`weekly_plan_items`), retrospective reviews (`weekly_reviews`), time density, and financial discipline into an executive summary ready for print or digital reflection.

### Key Components & Hooks
- `FieldReportPage.tsx`: Monolithic broadsheet container and synthesis engine implementing responsive multi-column editorial report layouts, print-ready CSS pagination, cross-domain aggregation (weekly plans, reviews, time density, and financial need-to-want ratios), and executive narrative briefs.

---

## 15. Auth

**Route:** `/auth` (public, outside `ProtectedRoute`)  
**Type:** Authentication & Session Gateway  
**Location:** `src/features/auth/`

### Responsibility
Supabase email/password authentication, session token management, redirect to `/` on successful login.

### Key Components & Details
- **Component:** `AuthPage.tsx`
- **Key Dependencies:** `@supabase/supabase-js` v2, Supabase Auth
- **RLS Integration:** Provides `auth.uid()` that all RLS policies depend on



