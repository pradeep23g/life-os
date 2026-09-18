# Implementation Plan: Spherical Navigation Orb, Screen Harmonization & Admin Console

## Overview
Transform the Life OS navigation experience from a traditional fixed sidebar into a floating, celestial Astrolabe Navigation Orb with radial/spherical orbital expansion, re-align all application canvases to eliminate layout skew, harmonize legacy disconnected screens (Finance OS, Time OS, and Fitness OS subpages) into the editorial Winter Arc aesthetic, and introduce a dedicated System Admin & Telemetry Console (`/admin`).

## Architecture Decisions

### 1. The Celestial Navigation Orb (`AstrolabeOrbNav`)
- **Positioning**: Fixed in the bottom-left corner (`bottom-6 left-6 z-50`), floating gracefully above all screen contents with a subtle ambient breathing glow and z-index elevation.
- **Trigger Mechanic**: Dual-mode interaction:
  - **Resting state**: Micro astrolabe glyph displaying the user's living Avatar state (idle / active / recovering) with momentum indicator.
  - **Hover / Focus**: Ambient glow expands, revealing navigational constellation preview.
  - **Click / Tap / Hotkey (`Cmd+K` or `Space` or `M`)**: Locks the orbital map open with full keyboard navigation, outside-click dismissal, and escape key listener.
- **Orbital Topology (Concentric Orbits + Domain Sectors)**:
  - **Center Hub**: Living Avatar glyph, Profile link, and Session Sign Out.
  - **Sectored Concentric Rings**: Items are grouped into domain sectors (Mind, Body, Wealth, Time) and arrayed across concentric orbits.
  - **Inner Orbit (R = 100px - Daily Momentum & Execution)**:
    - Home (`/`), Productivity Hub (`/productivity-hub`), Time OS (`/time-os`), Mind OS (`/mind-os`)
  - **Outer Orbit (R = 180px - Strategic, Physical & Telemetry)**:
    - Winter Arc (`/arc`), Fitness OS (`/fitness-os`), Learning OS (`/learning-os`), Finance OS (`/finance-os`), Data Lab (`/data-lab`), Field Reports (`/reports`), Mission Control (`/system`), Admin Console (`/admin`)
  - **Mobile Adaptation**: Adapts into an ergonomic thumb-friendly radial fan in the bottom corner on mobile viewports.
- **Motion Choreography**:
  - GPU-accelerated CSS transforms (`translate3d`, `rotate`, `scale`) with spring physics bezier curves.
  - Staggered radial reveal with backdrop blur (`backdrop-blur-md bg-background/85`).
  - Tooltip callouts on icon hover displaying module name, domain sigil, and active state.

### 2. Canvas Realignment & Sidebar Stripping
- Remove fixed `aside` (`w-20` / `w-72`) from `src/App.tsx`.
- Remove `md:pl-72` / `md:pl-20` margin skew from main content container.
- Establish responsive, perfectly balanced editorial page widths:
  - Standard modules: `max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12`.
  - Asymmetric stages (Home, Arc, Field Dossier): centered editorial stage with unencumbered visual breathing room.
- Retain lightweight mobile topbar if needed or unify mobile into the floating Orb across all viewports.

### 3. Screen Harmonization (Winter Arc Editorial Standard)
- **Finance OS**:
  - Redesign `FinanceDashboard.tsx`: Monospace ledger tables, high-contrast wallet balance hero, categorized income/expense streams, eliminating boxy card traps.
  - Redesign `TransactionForm.tsx`: Sleek, frictionless drawer/modal matching `HabitCreateModal` styling.
- **Time OS**:
  - Redesign `TimeOSPage.tsx`: Monumental active timer typography, precision focus bucket selectors, streamlined manual entry without raw form inputs.
- **Fitness OS Subpages**:
  - `WorkoutsPage.tsx` & `ActiveWorkoutPanel.tsx`: Kinetic workout execution ledger with set-by-set high-contrast logging.
  - `FitnessLibraryPage.tsx` & `CreateExerciseForm.tsx`: Architectural movements catalog, replacing nested `<details>` with clean drawer/filter interface.
  - `PersonalRecordsPage.tsx`: Monument-style PR trophies with gold/emerald hairline accents.

### 4. Admin & Telemetry Console (`/admin`)
- New route `/admin` registered in `App.tsx` and protected by authentication.
- Capabilities:
  - **Life OS Control Plane**: Explicit management for Seasons and Achievements (Create / edit / activate / archive).
  - **Canonical JSON Import/Export**: Import/export capability for Seasons (`life_seasons`), Achievements (`user_achievements`), and Learning OS configuration/data (roadmaps, stages). Uses the exact Supabase schema (one single source of truth) to allow future AI agents to generate or modify configurations safely.
  - Live Telemetry Queue Monitor (drain queue, view pending events, force sync).
  - Database Table Diagnostics (row counts, last updated timestamps across all tables).
  - System Engine State Inspector (momentum score, EMA coefficients, active anomaly signals).

---

## Task List

### Phase 1: Orbital Navigation Engine
- [ ] Task 1.1: Design and implement `AstrolabeOrbNav` component with celestial spherical positioning, concentric orbit geometry, and spring physics.
- [ ] Task 1.2: Refactor `src/App.tsx` to strip the traditional fixed sidebar, remove `md:pl-72` / `md:pl-20` left margin skew, and mount `AstrolabeOrbNav`.
- [ ] Task 1.3: Verify keyboard accessibility (`Escape`, `Arrow` keys, outside-click handling) and mobile touch ergonomics.

### Checkpoint 1: Orbital Navigation
- [ ] Orb renders floating bottom-left, opens on click/tap, reveals all 12 modules radially with smooth staggered physics, and navigates seamlessly.

### Phase 2: Canvas Symmetry & Alignment Audit
- [ ] Task 2.1: Audit and realign `HomePage`, `ArcPage`, `MissionControl`, and `DataLabPage` to full centered editorial symmetry.
- [ ] Task 2.2: Audit and realign `MindOsDashboard`, `HabitsPage`, `JournalPage`, and `ProductivityHubDashboard` with balanced padding and unencumbered layouts.

### Checkpoint 2: Layout & Alignment
- [ ] No layout skew across all viewports; all headers and containers align to symmetric grids.

### Phase 3: Screen Harmonization (Finance, Time & Fitness)
- [ ] Task 3.1: Re-skin and harmonize `FinanceDashboard.tsx` and `TransactionForm.tsx` to the editorial ledger aesthetic.
- [ ] Task 3.2: Re-skin and modernize `TimeOSPage.tsx` with monumental timer display and celestial focus telemetry.
- [ ] Task 3.3: Harmonize Fitness OS subpages (`WorkoutsPage`, `FitnessLibraryPage`, `PersonalRecordsPage`, `ActiveWorkoutPanel`).

### Checkpoint 3: Visual Consistency
- [ ] Zero generic gray cards or unstyled select inputs remain; all 8 modules share consistent Newsreader serif, Geist mono, and hairline borders.

### Phase 4: Admin & System Diagnostic Console
- [ ] Task 4.1: Create `src/features/admin/pages/AdminConsolePage.tsx` with telemetry health, queue drain, table statistics, and session audit.
- [ ] Task 4.2: Add `/admin` route in `App.tsx`, integrate with `AdminIcon` in the celestial Orb navigation.

### Checkpoint 4: Complete System Validation
- [ ] Build compiles cleanly without TypeScript errors, all routes render smoothly, and full E2E flow works.

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Radial menu clipping on small mobile viewports | High | Calculate responsive orbit radii (`R=80px/140px` on mobile, `R=100px/180px` on desktop) or fan layout when near screen edges |
| Hover triggering accidentally while interacting with page content | Med | Require explicit click/tap or short hover delay (250ms) to prevent jittery activation |
| Removing sidebar breaks layouts relying on fixed sidebar width | Med | Audit all full-width containers and adjust max-widths to `max-w-6xl` centered |
