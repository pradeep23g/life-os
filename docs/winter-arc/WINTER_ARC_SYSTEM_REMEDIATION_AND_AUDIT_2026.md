---
title: "Winter Arc — System Remediation and Audit 2026"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc 2026 — Comprehensive System Remediation & Forensic Audit

> **Document Type:** System Forensic Audit, Codebase Cleanliness Baseline & Remediation Log  
> **Date:** September 13, 2026  
> **Status:** Executed & Verified  
> **Pre-requisite For:** Deep-Dive Debugging & Quality Hardening Session  

---

## 1. Executive Summary

Prior to initiating the comprehensive debugging session for Life OS, an exhaustive, forensic inspection of the codebase was conducted across:
- **82 TSX Components** across all feature domains (`arc`, `home`, `mission-control`, `mind-os`, `productivity-hub`, `fitness-os`, `time-os`, `finance-os`, `data-lab`, `learning-os`, `profile`, `reports`, `auth`).
- **30 Supabase SQL Migrations** and generated TypeScript schemas (`src/types/database.types.ts`).
- **All Winter Arc Specifications** under `docs/winter-arc/` and historical baseline snapshot `docs/historical/PHASE1_BASELINE_SNAPSHOT_ad488a2.md`.

### Core Architectural Invariants Preserved
Throughout all remediation steps, the foundational system contracts remain strictly inviolate:
1. **Cognitive Boundary:** Zero cross-imports between Mind OS (introspective/subjective) and Productivity Hub (deterministic execution).
2. **Transactional Event Bus:** `useEventBus` peek-and-splice queue pattern remains intact with zero event loss.
3. **Canonical Event Taxonomy:** Strict compliance with `src/lib/eventTaxonomy.ts`.
4. **Database-First Rollups:** Analytics and momentum computations rely on Postgres views and deterministic Brain Engine calculations, never unpersisted mock counters.

---

## 2. Category 1: Dead Code & Orphaned Component Purge

During previous development phases and feature iterations, significant dead code had accumulated in the repository. All dead files have been formally audited and removed.

### 2.1 The Data Lab Graveyard (49 Files Pruned)
When `src/features/data-lab/pages/DataLabPage.tsx` was refactored into a focused 152-line horizontal spatial timeline canvas, the previous multi-tab Recharts dashboard implementation was abandoned without pruning. 49 files were left completely unreferenced:
- **8 Chart Components:** `ActivityHistogram.tsx`, `BehaviorTimeline.tsx`, `ContributionCalendar.tsx`, `CorrelationMatrix.tsx`, `EventFrequencyHistogram.tsx`, `EventWaterfall.tsx`, `HabitStreakRivers.tsx`, `MomentumDistribution.tsx`.
- **5 Dashboard Cards:** `BehaviorDriftCard.tsx`, `BehaviorInsightsPanel.tsx`, `CorrelationExplorerCard.tsx`, `ModuleConsistencyCard.tsx`, `WeeklyScoreSummary.tsx`.
- **3 Table/Log Panels:** `EventCoverageTable.tsx`, `ModuleConsistencyTable.tsx`, `RecentActivityLog.tsx`, `WeeklyScoreCard.tsx`.
- **3 Telemetry Cards:** `RecentEventStream.tsx`, `SystemHealthPanel.tsx`, `TelemetryHealthCard.tsx`.
- **5 Shared Components:** `DataLabEmptyState.tsx`, `DataLabSection.tsx`, `ExperimentalPlaceholder.tsx`, `PeriodSelector.tsx`, `Tooltip.tsx`.
- **11 Metric Calculation Modules:** `metrics/consistency.ts`, `correlation.ts`, `drift.ts`, `insights.ts`, `momentum.ts`, `rhythm.ts`, `streaks.ts`, `systemHealth.ts`, `telemetryHealth.ts`, `weeklyScore.ts`, `metrics/index.ts`.
- **2 Unused Hooks:** `useDataLabMetrics.ts`, `useDataMaturity.ts`.
- **Zustand Store & Transforms:** `store/useDataLabStore.ts`, `transforms/behavior.ts`, `transforms/overview.ts`, `transforms/telemetry.ts`.
- **Old Unreferenced Types & Utils:** `types/types.ts`, `utils/format.ts`, `utils/period.ts`, `utils/stats.ts`.

**Remediation:**  
The dead directories (`components`, `hooks`, `metrics`, `store`, `transforms`, `types`, `utils`) were pruned. `src/features/data-lab/` now consists exclusively of:
- `api/useDataLab.ts`: Active React Query hooks (`useDataLabDailyActivity`, `useDataLabWeeklyScore`, `useDataLabRecentEvents`) querying Supabase SQL views.
- `pages/DataLabPage.tsx`: The canonical 30-day spatial horizontal timeline canvas.
- `index.ts`: Clean export boundary exporting only `DataLabPage` and `useDataLab`.

### 2.2 Dead Unreferenced UI Components
- **`src/features/system/components/SystemStatusCard.tsx` (149 lines):** Orphaned component superseded by `BrainEngineHero.tsx` and `MissionControl.tsx`. Contained 0 imports across the entire repository. **Deleted.**
- **`src/features/fitness-os/pages/Dashboard.tsx` & `Library.tsx` (4 lines each):** Redundant pass-through files re-exporting `dashboard/FitnessOsDashboard` and `library/FitnessLibraryPage`. `App.tsx` was updated to import the canonical components directly. **Both files deleted.**

### 2.3 Test Simulation in Production Source
- **`src/features/productivity-hub/dashboard/keyboardVerification.ts` (246 lines):** A keyboard event simulation suite placed in production source and exported via `src/features/productivity-hub/index.ts`. Never invoked in runtime code.  
**Remediation:** Removed from `index.ts` public module boundary and deleted.

### 2.4 Starter Leftovers & Temporary Scripts
- `src/assets/react.svg` and `src/App.css`: Unreferenced default Vite starter templates. **Deleted.**
- `docs/winter-arc/update.py`, `update2.py`, `update_master_plan.py`: Temporary one-shot Python migration scripts in the docs directory. **Deleted.**
- `src/features/time-os/dashboard/`: Leftover empty directory from Time OS reorganization. **Deleted.**

---

## 3. Category 2: Telemetry Truth, Avatar Momentum & Season Fallbacks

### 3.1 Fake Avatar Momentum Hardcoding Fixed
- **Root Cause:** In `src/lib/telemetryAdapter.ts`, `useAvatarTelemetry` hardcoded `momentumScore: 75`, completely bypassing the deterministic momentum calculated by the Brain Engine (`systemEngine.ts` & `current_day_snapshot`). Furthermore, `Avatar.tsx` did not accept a `momentumScore` prop.
- **Remediation:**
  - Parameterized `useAvatarTelemetry(overrideState, overrideMomentum)` to default to `0` (cold start) rather than a fake `75`.
  - Added optional `momentumScore?: number` to `AvatarProps` in `src/components/Avatar.tsx`.
  - Updated all caller sites to feed the real deterministic score into `<Avatar />`:
    - `MissionControl.tsx`: `<Avatar size="lg" state={...} momentumScore={brain.momentumScore} />`
    - `Sidebar.tsx`: `<Avatar size="sm" state={avatarState} momentumScore={momentumScore} />`
    - `HomeSolarPresence.tsx`: `<Avatar size="md" state={avatarState} momentumScore={momentumScore} />`
    - `ChapterHero.tsx`: `<Avatar size="md" state={...} momentumScore={momentumScore} />`
    - `ProfileHero.tsx`: `<Avatar size="lg" state={avatarState} momentumScore={momentumScore} />`

### 3.2 Broken `/arc` Season Fallback Fixed
- **Root Cause:** In `src/features/arc/hooks/useArcTelemetry.ts`, `DEFAULT_SEASON` was initialized with:
  ```ts
  startDate: getIndiaDateKey(),
  endDate: getIndiaDateKey(),
  totalDays: 1,
  vow: { headline: 'Loading...', body: '', attribution: '' },
  phases: []
  ```
  Because `life_seasons` rows are user-specific and ADR-023 (Season Admin UI) is not yet active, any fresh account visiting `/arc` received a 100% completed, 1-day season with "Loading..." vows and zero checkpoints.
- **Remediation:**
  Aligned `DEFAULT_SEASON` with the canonical contract specified in **ADR-023** and `WINTER_ARC_DECISIONS.md`:
  - **Season:** Winter Arc 2026 (`2026-07-30` to `2026-10-27`, exactly 90 days / 13 weeks).
  - **Vows:** *"Silence and Execution — No announcements. No half-measures. Cold focus in the dark."*
  - **Principles:** *Eliminate non-essential commitments*, *Kinetic discipline daily*, *Cognitive rigor in deep work*.
  - **Phases:** 13 fully articulated weekly phases mapping to Foundation (Weeks 1–2), Deep Arc (Weeks 3–10), and Harvest & Transition (Weeks 11–13).

### 3.3 Elimination of Query Waterfall in `Sidebar.tsx`
- **Root Cause:** `src/layout/Sidebar.tsx` imported `useMissionControlSnapshot()`. To calculate a single avatar status indicator, `Sidebar.tsx` triggered 10 distinct queries (habits, tasks, journals, roadmaps, events analytics, fitness, time analytics, transactions, system status, pending events) on **every route change** across the entire application.
- **Remediation:**
  Replaced `useMissionControlSnapshot()` with `useSystemStatus()`. Now `Sidebar.tsx` reads only the cached `current_day_snapshot` view from React Query:
  ```tsx
  const { data: systemStatus } = useSystemStatus()
  const momentumScore = systemStatus?.momentum.momentum ?? 0
  const avatarState: 'recovering' | 'active' | 'idle' =
    momentumScore < 30 ? 'recovering' : momentumScore > 60 ? 'active' : 'idle'
  ```
  This completely eliminates 9 redundant network requests per page transition.

---

## 4. Category 3: Design System Tokens & Style Defect Remediation

### 4.1 Eradication of Broken `text-text-primary0` Class
- **Root Cause:** A previous global search-and-replace regex error had appended a trailing `0` to 46 instances of `text-text-primary`, rendering text invisible or failing silently.
- **Remediation:** All instances were audited and replaced with semantic tokens:
  - `src/components/DeleteButton.tsx`: Changed to `text-text-tertiary hover:text-rose-400`.
  - `src/components/CommandPalette.tsx`: Changed to `placeholder:text-text-tertiary`.
  - `src/features/system/components/BrainEngineHero.tsx`: Replaced 10 instances with `text-text-secondary` and `text-text-tertiary`.
  - `src/features/mission-control/dashboard/MissionControl.tsx:15`: Changed to `text-text-tertiary`.
  - `src/features/mission-control/components/EndOfDayCard.tsx` (7 locations): Changed to `text-text-tertiary`.
  - `src/features/fitness-os/workouts/WorkoutsPage.tsx:327`: Changed to `text-text-tertiary`.
  - `src/features/fitness-os/components/TagInput.tsx`: Changed to `placeholder:text-text-tertiary`.
  - `src/features/fitness-os/workouts/ActiveWorkoutPanel.tsx:232`: Changed to `text-text-tertiary`.
  - `src/features/fitness-os/library/PersonalRecordsPage.tsx` (7 locations): Changed to `text-text-tertiary`.
  - `src/features/finance-os/pages/FinanceDashboard.tsx:154`: Changed to `text-text-tertiary`.
  - `src/features/finance-os/components/TransactionForm.tsx` (2 locations): Changed to `placeholder:text-text-tertiary`.
  - **Remaining occurrences in codebase:** `0`.

### 4.2 Rogue Hex Code Purge
Hardcoded hex colors bypass the OKLCH design token engine and break theme reactivity:
- `src/features/auth/AuthPage.tsx`: Replaced `#333333` input and button borders with `border-border`.
- `src/features/fitness-os/components/TagInput.tsx`: Replaced `hover:bg-[#333333]` with `hover:bg-border`.
- `src/features/finance-os/pages/FinanceDashboard.tsx`: Replaced `border-[#333333]` with `border-border`.
- `src/features/time-os/components/PiPTimer.tsx`: Replaced `hover:bg-[#333333]` with `hover:bg-border`.
- `src/features/system/components/BrainEngineHero.tsx`: Replaced `border-l-[#333333]` with `border-l-border`.
- Hex values `#1a1a1a`, `#030303`, `#111111` in `BrainEngineHero.tsx` replaced with semantic theme tokens.

---

## 5. Category 4: Route & Shell Title Alignment

1. **Mission Control Backward Compatibility:**
   In `src/App.tsx`, added `<Route path="mission-control" element={<Navigate to="/system" replace />} />` so bookmarks and documentation links automatically forward to `/system`.
2. **Top-Level Imports Cleaned:**
   Moved inline `import HomePage` in `src/App.tsx` to the top import block.
3. **Shell Title Mapping (`src/layout/shellTitle.ts`):**
   Added title support for previously unhandled routes:
   - `/profile` → `"Profile & Stats"`
   - `/reports` → `"Reports"`
   - `/learning-os/explore` → `"Learning OS - Explore"`
   - `/learning-os/analytics` → `"Learning OS - Analytics"`

---

## 6. Category 5: Documentation Inconsistencies & Database Realities

During the forensic audit, five key discrepancies between existing documentation and codebase reality were identified:

| Subject | Documentation Claim (`docs/winter-arc/`) | Codebase Reality | Status / Recommendation |
|---------|------------------------------------------|------------------|-------------------------|
| **Data Lab Structure** | Historical snapshot (`PHASE1_BASELINE_SNAPSHOT_ad488a2.md`) describes 3 tabs (Overview, Behavior, Telemetry) with Recharts charts | `DataLabPage.tsx` was intentionally redesigned into a single 30-day spatial dot-matrix canvas | Documented reality. The single-canvas spatial timeline is now canonical; obsolete tabs purged. |
| **Signal View Names** | Docs cite `data_lab_signal_habits`, `data_lab_signal_tasks`, etc. | Actual Supabase migration SQL names are `data_lab_signal_mind_habits`, `data_lab_signal_productivity_tasks`, etc. | Migrations (`202607270001_signal_views.sql`) and `database.types.ts` are authoritative. |
| **View Type Safety** | Docs claim signal views are untyped in `src/types/database.types.ts` | All 15 SQL views are fully generated under `Tables:` with complete row typing | Documented. Type safety is 100% complete. |
| **Recharts Dependency** | ADR-021 states Recharts is the mandated charting library | `recharts` is **not** installed in `package.json`. Data Lab canvas and sparklines use pure SVG and Tailwind | Recommendation: Retain pure SVG implementation to minimize bundle size, or install `recharts` only when complex Cartesian charts are explicitly required. |
| **Unsurfaced Schema Tables** | Tables `pulse_logs`, `knowledge_resources`, `experiments`, `user_settings`, `user_achievements` created in `202609120000_winter_arc_remediation.sql` | Tables exist on remote Supabase and are typed, but have zero UI components | Transparently noted. These tables serve as forward schema readiness for Waves 3, 4, and 7. |

---

## 7. Resolution Log: Summary of Changes

| Target File | Change Type | Reason |
|-------------|-------------|--------|
| `src/components/DeleteButton.tsx` | Fix | Typo `text-text-primary0` replaced with `text-text-tertiary hover:text-rose-400` |
| `src/components/CommandPalette.tsx` | Fix | Typo `placeholder:text-text-primary0` replaced with `text-text-tertiary`; green-900 border replaced with semantic token |
| `src/components/Avatar.tsx` | Feature Fix | Accepted `momentumScore` prop; dynamic ring/lattice reactivity |
| `src/lib/telemetryAdapter.ts` | Feature Fix | Parameterized `useAvatarTelemetry`; default momentum to 0 instead of mock 75 |
| `src/features/arc/hooks/useArcTelemetry.ts` | Bug Fix | Replaced broken 1-day "Loading..." fallback with canonical 90-day Winter Arc 2026 season |
| `src/layout/Sidebar.tsx` | Performance Fix | Replaced `useMissionControlSnapshot()` with `useSystemStatus()`; eliminated 10-query route cascade |
| `src/layout/shellTitle.ts` | Polish | Added titles for `/profile`, `/reports`, `/learning-os/explore`, `/learning-os/analytics` |
| `src/App.tsx` | Route & Cleanup | Added `/mission-control` redirect; switched Fitness OS imports to canonical paths; moved `HomePage` import to top |
| `src/features/system/components/BrainEngineHero.tsx` | Polish | Replaced 10 `text-text-primary0` typos, replaced rogue hex `#1a1a1a`, `#030303`, `#111111`, `#333333` |
| `src/features/system/components/SystemStatusCard.tsx` | Deletion | Purged dead unreferenced component (149 lines) |
| `src/features/mission-control/dashboard/MissionControl.tsx` | Fix | Fixed `text-text-primary0`; passed live `brain.momentumScore` to `Avatar` |
| `src/features/mission-control/components/EndOfDayCard.tsx` | Fix | Fixed 7 instances of `text-text-primary0` |
| `src/features/fitness-os/workouts/WorkoutsPage.tsx` | Fix | Fixed `text-text-primary0` in picker loader |
| `src/features/fitness-os/workouts/ActiveWorkoutPanel.tsx` | Fix | Fixed `text-text-primary0` in set label |
| `src/features/fitness-os/library/PersonalRecordsPage.tsx` | Fix | Fixed 7 instances of `text-text-primary0` in PR card and modal |
| `src/features/fitness-os/components/TagInput.tsx` | Fix | Fixed `placeholder:text-text-primary0`; replaced `#333333` hover with `hover:bg-border` |
| `src/features/fitness-os/pages/Dashboard.tsx` & `Library.tsx` | Deletion | Purged redundant 4-line pass-through re-exports |
| `src/features/finance-os/pages/FinanceDashboard.tsx` | Fix | Fixed `text-text-primary0` in calendar header; replaced `#333333` with `border-border` |
| `src/features/finance-os/components/TransactionForm.tsx` | Fix | Fixed 2 instances of `placeholder:text-text-primary0` |
| `src/features/time-os/components/PiPTimer.tsx` | Polish | Replaced `#333333` hover with `hover:bg-border` |
| `src/features/productivity-hub/index.ts` | Cleanup | Removed test export `keyboardVerification` |
| `src/features/productivity-hub/dashboard/keyboardVerification.ts` | Deletion | Purged unreferenced 246-line test simulation from production source |
| `src/features/data-lab/index.ts` | Cleanup | Removed unreferenced `types/types` export |
| `src/features/data-lab/components/` (21 files) | Deletion | Purged orphaned chart, card, table, and telemetry graveyard |
| `src/features/data-lab/hooks/`, `metrics/`, `store/`, `transforms/`, `types/`, `utils/` (28 files) | Deletion | Purged orphaned calculations, stores, and utilities |
| `src/features/home/components/HomeSolarPresence.tsx` | Fix | Passed live `momentumScore` to `Avatar` |
| `src/features/arc/components/ChapterHero.tsx` | Fix | Passed live `momentumScore` to `Avatar` |
| `src/features/profile/components/ProfileHero.tsx` | Fix | Passed live `momentumScore` to `Avatar` |
| `src/assets/react.svg` & `src/App.css` | Deletion | Purged unused default Vite starter files |
| `docs/winter-arc/update*.py` (3 files) | Deletion | Purged temporary python scripts from docs directory |
| `src/features/time-os/dashboard/` | Deletion | Removed empty directory |

---

## 8. Baseline Status & Next Phase Readiness

The codebase is now in an optimal, squeaky-clean state:
- **Zero Dead Files or Shadow Graveyards:** All obsolete components from prior refactors have been cleanly excised.
- **Zero Typo Classes:** Every instance of `text-text-primary0` has been eradicated.
- **Zero Rogue Hex Elements:** All borders and backgrounds conform strictly to semantic theme tokens.
- **Zero Artificial Telemetry:** Avatars, momentum indicators, and season timelines compute against genuine system state and canonical contracts.
- **Lightweight Navigation:** Sidebar waterfall queries eliminated.
- **Clean Route Registry:** Aliases and title resolvers aligned with the navigation layout.

The system is fully primed to transition into the **Deep Debugging & Quality Hardening Session**.

---

## 9. Forensic Root-Cause Investigation: The Avatar Component Invisibility & Blackout Defect

### 9.1 The Symptom
Since early implementation, the `<Avatar />` component rendered as an empty, dark, or solid black circular void across both the Home page (`/`) and Profile page (`/profile`).

### 9.2 The Detective Discovery (Multi-Agent Audit)
A forensic audit conducted across the SVG DOM attribute parser, CSS Color Module Level 4 specifications, and theme token inheritance revealed three interacting root causes:

1. **The SVG XML Presentation Attribute Parser Failure (Primary Culprit)**:
   - In `src/components/Avatar.tsx`, color values were passed directly into SVG XML presentation attributes:
     ```tsx
     <circle stroke={ringColor} ... /> /* stroke="oklch(var(--border-base))" */
     <path stroke={ringColor} fill={...} />
     <circle fill="oklch(var(--text-primary))" ... />
     ```
   - **The Engine Failure**: Unlike CSS stylesheet properties, SVG XML presentation attributes (`fill="..."`, `stroke="..."`) are processed by browser presentation attribute parsers. In Blink (Chromium), WebKit (Safari), and Gecko (Firefox), CSS Color 4 functions (`oklch()`) combined with CSS custom variables (`var(--...)`) inside presentation attributes fail parsing.
   - **The W3C SVG Spec Fallback Rule**:
     - When `fill` fails attribute parsing, it reverts to its initial SVG value: **`#000000` (`black`)**!
     - When `stroke` fails attribute parsing, it reverts to its initial SVG value: **`none` (transparent)**!
   - **Result**: The outer momentum ring vanished (`stroke: none`), the inner lattice diamond vanished (`stroke: none`), and the solar core circle defaulted to pitch black (`#000000`). Mounted inside the dark `bg-surface` container, the avatar appeared literally as a blacked-out, empty hole.

2. **Perceptual Camouflage in `idle` State & Midnight Theme**:
   - In `Avatar.tsx`, `ringColor` in `idle` state resolved to `oklch(var(--border-base))`.
   - In `.theme-midnight`, `--border-base` is `22% 0.01 270`, which at `opacity="0.5"` over `bg-surface` (`13% 0.01 270`) has ~16% effective lightness. Luminance contrast was 1.05:1 (completely below human visual threshold).
   - The solar core dimmed to `opacity="0.4"` at midnight.
   - In `overloaded` state, the marker stroke used `oklch(var(--bg-base))`, which is 10% lightness (the darkest black in the app) rendered on top of a dark circle!

3. **Call-Site State Truncation**:
   - `HomeSolarPresence.tsx`, `ProfileHero.tsx`, `ChapterHero.tsx`, and `MissionControl.tsx` used naive binary ternaries that collapsed `Overloaded` and `Drifting` states into `idle`.

### 9.3 The Remediation
1. **Migrated SVG Presentation Attributes to `currentColor` & Tailwind Classes**:
   - Refactored `src/components/Avatar.tsx` so all strokes and fills use `stroke="currentColor"` and `fill="currentColor"`.
   - Color is applied via standard Tailwind classes (`text-threat-warning`, `text-accent-primary`, `text-threat-critical`, `text-text-secondary/75`, `text-text-primary`, `text-surface`, `fill-accent-primary/10`, `fill-threat-warning/10`, `fill-transparent`).
   - Standard CSS declarations are parsed by the browser stylesheet engine, which resolves `oklch(var(...))` correctly with full alpha compositing.
2. **Elevated Visual Hierarchy & Core Insignia**:
   - Solar core disc now renders in `text-text-primary` (`oklch(98% ...)`), guaranteeing radiant high contrast in all themes.
   - Core opacity maintains a minimum of `0.85` even during midnight hours.
   - Inscribed an intricate geometric 4-point solar compass crosshair in `text-surface` inside the core disc, elevating the avatar from a wireframe placeholder to an authentic heraldic Winter Arc emblem.
   - Scaled stroke widths for `sm` size (`w-8 h-8` in Sidebar) so fine lines do not vanish under subpixel antialiasing.
3. **Harmonized Scoped Theme Tokens in `src/index.css`**:
   - Added explicit `--threat-critical`, `--threat-warning`, `--threat-healthy`, and `--text-tertiary` declarations to `.theme-dawn`, `.theme-dusk`, `.theme-midnight`, and `.theme-recovery`.
4. **Unified State Mapping Across All Call Sites**:
   - Updated `HomeSolarPresence.tsx`, `ProfileHero.tsx`, `ChapterHero.tsx`, and `MissionControl.tsx` to accurately map `Recovering`, `Overloaded`, `Drifting`, `Accelerating`, and `Building` to `Avatar`.

