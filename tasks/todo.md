# Implementation Tasks: Spherical Navigation Orb & Full System Harmonization

## Phase 1: Orbital Navigation Engine
- [ ] Task 1.1: Design and implement `AstrolabeOrbNav.tsx` in `src/layout/`
  - Acceptance criteria:
    - Renders floating trigger orb in bottom-left with living avatar, state glow, and momentum indicator.
    - Combined Concentric Orbits + Domain Sectors topology: Groups by domain (Mind, Body, Wealth) across Inner & Outer orbits.
    - Mobile layout adapts into an ergonomic thumb-friendly radial fan in the bottom corner.
    - Physics-based spring animations with staggered reveal.
    - Outside click, Escape key, and route navigation close handlers.
  - Verification: Manual interaction verification and TypeScript compilation

- [ ] Task 1.2: Refactor `src/App.tsx` shell layout
  - Acceptance criteria:
    - Remove fixed `aside` sidebar and `md:pl-72`/`md:pl-20` padding offsets
    - Mount `AstrolabeOrbNav` as universal navigation controller
    - Content containers centered cleanly with responsive padding
  - Verification: Check layout on desktop and mobile viewports

- [ ] Task 1.3: Navigation & Interaction Accessibility
  - Acceptance criteria:
    - Screen reader ARIA attributes for orbital menu (`aria-expanded`, `role="menu"`, `aria-label`)
    - Keyboard navigation support (`Tab`, `Escape`)
  - Verification: Keyboard-only navigation test

## Checkpoint 1: Orbital Navigation
- [ ] All 12 modules accessible via the orbital menu
- [ ] Staggered animations execute fluidly at 60fps
- [ ] No layout regressions in main viewport

## Phase 2: Canvas Symmetry & Alignment Audit
- [ ] Task 2.1: Realign Top-Level Stage Pages
  - Acceptance criteria:
    - `HomePage`: Hero and asymmetric stage centered without sidebar offset
    - `ArcPage`: Monumental chapter hero centered with balanced margins
    - `MissionControl`: Brain engine hero and ledger grid centered
    - `DataLabPage`: 30-day timeline and telemetry matrices centered
  - Verification: Inspect horizontal symmetry across breakpoints

- [ ] Task 2.2: Realign Submodule Pages
  - Acceptance criteria:
    - `MindOsDashboard`, `HabitsPage`, `JournalPage`: Uniform container max-widths
    - `ProductivityHubDashboard`, `TasksPage`, `PlanningPage`: Execution queue aligned
  - Verification: Visual inspection of tab strips and content gutters

## Checkpoint 2: Layout & Alignment
- [ ] Application feels balanced, spacious, and symmetric across all routes

## Phase 3: Screen Harmonization (Finance, Time & Fitness)
- [ ] Task 3.1: Harmonize Finance OS
  - Acceptance criteria:
    - `FinanceDashboard.tsx`: Monospace ledger, high-contrast wallet balance, removed card traps
    - `TransactionForm.tsx`: Modernized modal matching Winter Arc aesthetic
  - Verification: Add transaction and verify responsive ledger display

- [ ] Task 3.2: Harmonize Time OS
  - Acceptance criteria:
    - `TimeOSPage.tsx`: Monumental active timer, precision focus bucket selector, modern form inputs
  - Verification: Test live focus session and manual log submission

- [ ] Task 3.3: Harmonize Fitness OS Subpages
  - Acceptance criteria:
    - `WorkoutsPage.tsx` & `ActiveWorkoutPanel.tsx`: Kinetic workout tracking ledger
    - `FitnessLibraryPage.tsx` & `CreateExerciseForm.tsx`: Clean exercise catalog
    - `PersonalRecordsPage.tsx`: Monument-style PR trophies
  - Verification: Test workout log flow and exercise creation

## Checkpoint 3: Visual Consistency
- [ ] Zero outdated gray cards or unstyled controls remain across Finance, Time, and Fitness

## Phase 4: Admin & Telemetry Console
- [ ] Task 4.1: Build `AdminConsolePage.tsx` (Life OS Control Plane)
  - Acceptance criteria:
    - Explicit management UI for Seasons and Achievements (Create / edit / activate / archive).
    - Canonical JSON Import/Export for `life_seasons`, `user_achievements`, and Learning OS configurations (mapped perfectly to Supabase tables).
    - Telemetry queue depth and flush trigger, plus database table row counts.
  - Verification: Export a Season as JSON, modify it, and import it back successfully.

- [ ] Task 4.2: Register `/admin` Route and Navigation
  - Acceptance criteria:
    - Route added in `App.tsx` under `ProtectedRoute`
    - Domain sigil (`AdminIcon`) added to `ModuleIcons.tsx` and orbital nav
  - Verification: Navigate to `/admin` and verify authenticated access

## Checkpoint 4: System Complete
- [ ] Full build succeeds without errors
- [ ] Complete user journey tested end-to-end
