# Fitness OS (Kinetic Ledger) Specification

## 1. Core Paradigm & Aesthetics
* **Theme**: Brutalism meets Cybernetics (Winter Arc).
* **Colors**: Industrial/Blood Red as the primary accent, contrasting against dark void backgrounds.
* **Typography**: Massive `Geist Mono` for numerical data (weights, reps, times), retaining standard sans-serif for labels.
* **Empty State**: Terminal cursor `> INITIALIZE WORKOUT` instead of generic empty placeholders.

## 2. Navigation & Architecture
* **Top-Level Toggle**: A sleek tab switch at the top (like Time OS) navigating between:
  1. `[ Kinetic Ledger (Workouts) ]`
  2. `[ Architectural Catalog (Library) ]`
  3. `[ Monument Trophies (PRs) ]`

## 3. Database Schema Deltas (Important)
Based on your constraints, our existing Supabase tables (`fitness_exercises` and `exercise_logs`) are missing a few critical vectors to support your exact vision:

1. **Missing `movement_pattern`**: `fitness_exercises` currently has `primary_muscle` and `category`, but lacks `movement_pattern` (Push, Pull, Hinge, etc.). We need to add this column to support the dual-categorization you requested for the Library.
2. **Missing `duration_seconds` for Static Holds**: `exercise_logs` currently has `duration_minutes`. Since you train Calisthenics (Hybrid) and need to track static hold peak times (e.g., a 15-second front lever), we must add `duration_seconds` to accurately capture short burst holds.
3. **Missing Set-by-Set granularity**: `exercise_logs` currently stores aggregates (`sets`, `reps_total`). To support your "step-by-step focus mode showing current and next set", we need to either adapt `exercise_logs` to represent a *single set* per row (where `order_index` = set number), or add a `fitness_workout_sets` table. *Decision: We will treat one row in `exercise_logs` as a single set to keep the schema flat and highly queryable.*

## 4. Module Breakdowns

### A. Kinetic Ledger (Workouts)
* **The Input Engine (Hybrid)**: A Command Palette input at the top (`> Bench 3x10@225`) coupled with an expandable Rapid-Tap Numpad.
* **Active Workout Mode**: When initialized, the page collapses the timeline and prioritizes a Step-by-Step focus view (Current Set / Next Set). Rest timers are **disabled** per your request—UI remains purely for data entry.
* **Completed Workout View**: A brutalist terminal-style data table that incorporates timeline elements (start times for blocks of sets).
* **Time OS Sync**: Completing a workout will dispatch an automatic `Deep Work` or `Health` telemetry event to Time OS to feed the Chronos Root visualizer.

### B. Architectural Catalog (Library)
* **View Structure**: Groupable by both **Movement Pattern** and **Primary Muscle Group**.
* **Visual Aids**: Minimalist SVG vector/wireframe outlines highlighting the target muscle in Blood Red. 
* **Progression**: Purely historical view. No algorithmic predictions. The catalog displays the last 5 logs for that exercise to inform your decision.

### C. Monument Trophies (PRs)
* **Visuals**: Glowing cybernetic sigils/badges.
* **Tracking Depth**: 1RM, 3RM, 5RM, and **Peak Time Holds** (for calisthenics).
* **The Celebration Event**: Hitting a PR triggers a momentary screen flash (Blood Red) and drops a terminal prompt: `> RECORD OVERWRITTEN`.

## 5. Implementation Phases
1. **Phase 1**: Execute SQL migrations (add `movement_pattern`, `duration_seconds`).
2. **Phase 2**: Build the top-level Navigation & Empty States.
3. **Phase 3**: Implement the Hybrid Input Engine (Command + Numpad) and Active Focus Mode.
4. **Phase 4**: Build the Architectural Catalog (SVG wireframes + dual categorization).
5. **Phase 5**: Build the Monument Trophies and the `> RECORD OVERWRITTEN` event trigger.
