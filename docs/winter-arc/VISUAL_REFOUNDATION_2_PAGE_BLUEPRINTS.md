---
title: "Winter Arc — Page Blueprints & Layout Specs"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Life OS — Winter Arc: Visual Refoundation 2.0
# Document 3: Canonical Page-by-Page Blueprints

**Author:** Agent 1 — Visual Art Director / Visual Archaeologist / Product Designer  
**Date:** September 2026  
**Status:** CANONICAL BLUEPRINT SPECIFICATION  
**Target:** Implementation Handoff for Agent 2 (Domain Implementation Specialists)  

---

## Blueprint Index

1. [ROOM 1: HOME [The Porch / The Foyer]](#room-1-home-the-porch--the-foyer)
2. [ROOM 2: ARC [The Grand Hall]](#room-2-arc-the-grand-hall)
3. [ROOM 3: MIND OS [The Study / The Sanctuary]](#room-3-mind-os-the-study--the-sanctuary)
4. [ROOM 4: WORK OS [The Workshop / The Terminal]](#room-4-work-os-the-workshop--the-terminal)
5. [ROOM 5: BODY OS [The Gymnasium / The Forge]](#room-5-body-os-the-gymnasium--the-forge)
6. [ROOM 6: LEARNING OS [The Library / The Map Room]](#room-6-learning-os-the-library--the-map-room)
7. [ROOM 7A: PROFILE [The Personal Identity Dossier]](#room-7a-profile-the-personal-identity-dossier)
8. [ROOM 7B: PROGRESSION [The Historical Chronicle & Archives]](#room-7b-progression-the-historical-chronicle--archives)
9. [ROOM 8: DATA LAB [The Clinical Observatory]](#room-8-data-lab-the-clinical-observatory)
10. [ROOM 9: REPORTS [The Sunday Paper / Field Dossier]](#room-9-reports-the-sunday-paper--field-dossier)
11. [ROOM 10: SYSTEM [The Machine Room]](#room-10-system-the-machine-room)
12. [ROOM 11: TIME OS [Temporal Allocation & Flow]](#room-11-time-os-temporal-allocation--flow)
13. [ROOM 12: FINANCE OS [Resource Circulation Ledger]](#room-12-finance-os-resource-circulation-ledger)
14. [GLOBAL OVERLAYS: Command Horizon & Action Sheets](#global-overlays-command-horizon--action-sheets)

---

## ROOM 1: HOME [The Porch / The Foyer]

* **Route:** `/`
* **Architectural Metaphor:** The Porch / The Foyer — The threshold of the day. A calm, uncluttered space for immediate orientation and conscious momentum.
* **Human Question:** "What is my immediate reality and single true action right now?"
* **Emotional Character:** Grounded, calm, unhurried, present. Never alarms or manufactures panic.
* **Visual Mode:** **EDITORIAL** (Stage Primitive).
* **Compositional Principle: Asymmetric Swiss Anchoring:**
  - **Eliminate Centered "Portfolio Quote" Symmetry:** Replace the centered `min-h-[85vh]` empty warehouse with confident, left-aligned architectural typography anchored by a structured right-hand operational margin.
  - Zero cards. Zero container borders.
* **Typography:**
  - *Time Context:* `JetBrains Mono`, text-xs, font-medium, uppercase, text-text-secondary. (NO `tracking-[0.2em]` AI eyebrows).
  - *Daily Directive / Intention:* `Newsreader`, opsz 72, font-light (weight 300), text-4xl sm:text-5xl md:text-6xl, tracking-tight, leading-[1.15], text-balance.
  - *Telemetry Numerals:* `JetBrains Mono`, text-sm, tabular-nums.
* **Primary Composition (Stage):**
  - Left-anchored vertical stack (`max-w-4xl py-16 md:py-24 px-6 md:px-12`).
  - Top: Living Geometric Emblem Avatar positioned cleanly alongside local solar time context (`Dawn // Morning Intention`, `Day // Active Execution`, `Dusk // Evening Reflection`, `Midnight // System Closure`).
  - Middle: Dominant daily directive typeset in monumental Newsreader serif.
  - Bottom: Single high-contrast primary focal action button (`Enter Deep Work`, `Declare Daily Focus`, `Initiate Shutdown`) obeying the **Tactile Interaction Compact**:
    - **MUST execute immediately** (opens Deep Work focus timer or launches intention sheet). NO inert buttons without `onClick`. NO appended animated arrows `→`.
* **Secondary Composition (Ambient Horizon):**
  - Continuous horizontal hairline datum rule spanning the view (`border-b border-border-subtle`).
  - Below it, ambient operational signals without requiring obscure avatar clicks:
    1. Active Momentum Vector (real from `useMissionControlSnapshot`)
    2. Current Life State (real from `useMissionControlSnapshot`)
    3. Uncompleted Tasks Count (real dynamic derivation from `useTasks` + habits, never hardcoded `"3"`)
* **Responsive Behavior:**
  - *Desktop (>1024px):* Asymmetric layout; 65ch editorial measure; right margin displays quiet schedule trace.
  - *Mobile (<640px):* Left-aligned stack; action button full width of thumb zone (`h-12`).
* **Data Sources & Truth:**
  - Time & Light: `useEnvironmentSystem`
  - Life State & Momentum: `useMissionControlSnapshot` -> `brain.lifeState`, `brain.momentumScore`
  - Pending Count: `useTasks` -> `tasks.filter(t => !t.is_completed).length`
  - **Fallback:** If zero pending: `"Clear Horizon // Trajectory Stable"`.
* **Anti-Patterns:**
  - NO hardcoded `"Pending Actions: 3"`.
  - NO dead buttons.
  - NO `tracking-[0.2em]` uppercase eyebrows.
  - NO centered empty warehouse layouts.

---

## ROOM 2: ARC [The Grand Hall]

* **Route:** `/arc` (Dedicated Seasonal Route)
* **Architectural Metaphor:** The Grand Hall — Monumental, historical, seasonal space commemorating the 90-day campaign.
* **Human Question:** "Where do I stand inside this 90-day chapter of my life?"
* **Emotional Character:** Stately, deliberate, seasonal, sacred.
* **Visual Mode:** **EDITORIAL** (Stage + Rail Primitives).
* **Typography:**
  - *Season Title:* `Newsreader`, text-6xl md:text-8xl, font-extralight, tracking-tight.
  - *Countdown & Dates:* `JetBrains Mono`, text-xs, tabular-nums.
* **Primary Composition (The Chapter Page):**
  - Asymmetric monumental title: `CHAPTER I: WINTER ARC 2026`.
  - The Core Seasonal Vow / Objective typeset in pristine, indented Newsreader serif prose.
  - Season Progress Ratio rendered in high-contrast tabular typography:
    ```
    DAY 42 OF 90  •  48 DAYS REMAINING  •  PROGRESS: 46.7%
    ```
* **Secondary Composition (Seasonal Epoch Rail):**
  - A horizontal timeline rail traversing the 90-day arc.
  - Weekly checkpoint nodes marking completed reviews and major milestones.
  - Unlocked season badges and earned cosmetics (e.g. Winter Arc Mantle).
* **Data Sources & Truth:**
  - `seasons` table (`name`, `theme`, `objective`, `start_date`, `end_date`).
  - Derived day count from current calendar date vs season bounds.
* **Empty State:** If between seasons: *"The previous arc is closed. Prepare intentions for the next chapter."*

---

## ROOM 3: MIND OS [The Study / The Sanctuary]

* **Route:** `/mind-os`
* **Architectural Metaphor:** The Study / The Sanctuary — An intimate, quiet room for psychological self-honesty and habit rhythm.
* **Human Question:** "What is my internal weather, and am I honoring my commitments?"
* **Emotional Character:** Quiet, non-judgmental, spacious, restorative.
* **Visual Mode:** **EDITORIAL** (Chronicle + Ledger Primitives).
* **Primary Composition (The Unified Editorial Ledger):**
  - Max-w-3xl left-aligned reading layout.
  - **Zone 1: Latest Reflection (Chronicle):**
    - Elegant left-bordered quote block with date timestamp. Displays user's latest journal reflection in Newsreader italic without card wrappers.
    - Inline quick-write prompt: `> Record thought...` (opens inline reflection entry).
  - **Zone 2: Behavioral Rhythms (Ledger):**
    - Deprecate the 1000-line 2022 card form in `HabitsPage`.
    - Every habit is a clean, hairline-separated typographic row (`border-b border-border-subtle`).
    - Habit title on left; 7-day dot rhythm in middle (small filled circles for completed days, hollow for open); minimalist toggle on right.
    - Consistency score rendered as aligned tabular percentage (`68% 30-Day Pulse`).
* **Elimination of SaaS Residue:**
  - BAN the analog SVG clock widget.
  - BAN the emoji mood selector (😭, 😔, 😐, 😎, 🔥). Replace with a subtle 5-point clinical tone scale: `[Depleted • Low • Stable • Energized • Peak]`.
  - BAN green/red card borders (`border-emerald-900`, `border-rose-900`).
* **Data Sources & Truth:**
  - `useJournalEntries`
  - `useHabitWorkspace`
  - `useEventsAnalytics`

---

## ROOM 4: WORK OS [The Workshop / The Terminal]

* **Route:** `/productivity-hub`
* **Architectural Metaphor:** The Workshop / The Terminal — High-velocity task execution, sprint planning, and deep work focus.
* **Human Question:** "What single piece of work requires my focus right now?"
* **Emotional Character:** Surgical, fast, distraction-free, terminal-grade.
* **Visual Mode:** **INSTRUMENT** (Terminal + Ledger Primitives).
* **Typography:**
  - Exclusively `JetBrains Mono` and `Geist Sans`. Tabular numbers throughout.
* **Primary Composition (Execution Terminal):**
  - Banish fake ASCII cosplay (`[ EXECUTION TERMINAL ]`, `// ACTIVE_CONTEXT`, `// SYSTEM_STATE: ONLINE`).
  - Real, interactive execution queue:
    ```
    EXECUTION QUEUE • 4 PENDING • CURRENT FOCUS: DEEP WORK
    ```
  - **Active Task Stream (Ledger):**
    - High-density rows separated by 1px hairline rules (`border-b border-border-subtle`).
    - Col 1: Index (`01`, `02`, `03`).
    - Col 2: Interactive completion checkbox (executes `useToggleTaskCompletion` immediately).
    - Col 3: Task title with inline sprint priority indicator.
    - Col 4: Deadline indicator (neutral unless overdue).
    - Col 5: Direct Action Trigger (`[LAUNCH FOCUS TIMER]`).
  - Keyboard-first interaction: `J`/`K` to navigate rows, `Space` to toggle complete, `F` to start timer.
* **Quick Task Entry:**
  - Borderless inline command input at the head of the queue: `> New task and press Enter...` (instantly creates task).
* **Data Sources & Truth:**
  - `useTasks`
  - `usePlanning`
  - `useActiveTimer`

---

## ROOM 5: BODY OS [The Gymnasium / The Forge]

* **Route:** `/fitness-os`
* **Architectural Metaphor:** The Gymnasium / The Forge — Kinetic output, physical consistency, strength progressions, and recovery.
* **Human Question:** "How is my physical machine performing and recovering?"
* **Emotional Character:** Visceral, grounded, disciplined, heavy.
* **Visual Mode:** **KINETIC REGISTER** (Field + Ledger Primitives).
* **Primary Composition:**
  - **Zone 1: Weekly Kinetic Volume (Field):**
    - High-impact tabular figures: `180 MIN` • `4 SESSIONS` • `12,400 KG LOAD`.
    - Aligned along an asymmetric bottom datum rule.
  - **Zone 2: Live Training Session Launcher:**
    - If a workout is active: High-contrast active set logger (set, rep, load in kg).
    - If idle: Immediate tactile trigger: `START TRAINING SESSION` (opens live session logger).
  - **Zone 3: Recent Movement Ledger:**
    - High-density workout list showing: Date, Title, Duration, and top lift performed (`Deadlift: 3x5 @ 140kg`).
  - **Zone 4: Personal Records Shelf:**
    - Tabular PR matrix for compound movements (Squat, Deadlift, Bench, Pull-ups) with date achieved.
* **Data Sources & Truth:**
  - `useFitnessDashboard`
  - `useWorkouts`
  - `useAllExerciseLogs`

---

## ROOM 6: LEARNING OS [The Library / The Map Room]

* **Route:** `/learning-os`
* **Architectural Metaphor:** The Library / The Map Room — Mapping intellectual growth, curated knowledge, and deep study.
* **Human Question:** "What knowledge territory am I currently traversing?"
* **Emotional Character:** Curious, scholarly, expansive, deliberate.
* **Visual Mode:** **SPATIAL ATLAS** (Atlas + Chronicle Primitives).
* **Primary Composition:**
  - **Eliminate Duplicated Left-Border Timeline:** Profile, Mind, and Learning must not share the exact same `border-l` with dot bullets.
  - **The Active Study Shelf:** Architectural bookshelf layout displaying active roadmaps with completion ratio (`72% Traversed`).
  - **The Spatial Map:** Branching pathways with milestone stations and key synthesis takeaways.
  - **Recent Field Notes (Chronicle):** Chronological stream of study takeaways and book quotes, typeset like marginalia in a scholarly text.
* **Elimination of SaaS Residue:**
  - BAN the purple KPI cards in `/analytics`.
  - BAN the dashed empty state box in `/explore`.
* **Data Sources & Truth:**
  - `useRoadmaps`
  - `useRoadmapProgress`
  - `useRecentSessionLogs`

---

## ROOM 7A: PROFILE [The Personal Identity Dossier]

* **Route:** `/profile`
* **Architectural Metaphor:** The Dossier / The Archives — The personal identity mirror. A biographical dossier, not a settings page or raw database log.
* **Human Question:** "Who am I becoming across the seasons of my life?"
* **Emotional Character:** Archival, dignified, permanent, honest.
* **Visual Mode:** **EDITORIAL** (Chronicle Primitive).
* **Primary Composition:**
  - Max-w-3xl left-anchored reading column.
  - Top Hero: Prominent Living Geometric Emblem Avatar breathing with real-time momentum.
  - Biographical Chapter Header:
    ```
    PERSONAL DOSSIER • WINTER ARC 2026
    Chapter: The Focused Acceleration
    ```
  - **Core Attribute Horizon (Field):**
    - *Discipline:* 30-day streak consistency %
    - *Execution:* Completed task volume
    - *Physical:* Total training volume (hrs)
    - *Intellect:* Roadmap sessions completed
    - (Zero progress bars. Displayed as pure tabular values with micro-labels).
  - **Earned Identity Markers:** Seasonal badges and capability crests (ADR-016).
* **Data Sources & Truth:**
  - `useMissionControlSnapshot`
  - `useEventsAnalytics`
  - `user_achievements`
* **Anti-Patterns:**
  - NO raw `{JSON.stringify(event.payload)}` dumps.
  - NO hardcoded `"Level 12"`.

---

## ROOM 7B: PROGRESSION [The Historical Chronicle & Archives]

* **Route:** `/profile/history` (or dedicated Progression view)
* **Architectural Metaphor:** The Historical Chronicle — Immutable historical record of threshold events and achievements.
* **Human Question:** "What is the historical evidence of my transformation?"
* **Emotional Character:** Archival, permanent, immutable.
* **Visual Mode:** **EDITORIAL** (Ledger Primitive).
* **Primary Composition:**
  - Continuous vertical ledger of life events.
  - Formatted human-readable event descriptions (e.g. `Completed 10th Deep Work session in Winter Arc` instead of `TASK_TOGGLED`).
  - Domain filter tabs (`[All • Mind • Body • Work • Intellect]`).

---

## ROOM 8: DATA LAB [The Clinical Observatory]

* **Route:** `/data-lab`
* **Architectural Metaphor:** The Observatory — Clinical observation of multi-variable relationships across sleep, deep work, habits, and mood.
* **Human Question:** "What hidden rhythms and behavioral correlations govern my life?"
* **Emotional Character:** Clinical, scientific, calm, detached.
* **Visual Mode:** **INSTRUMENT** (Field + Horizon Primitives).
* **Primary Composition (Multi-Track Observatory Timeline):**
  - **Expand Beyond the 7-Day Dot Stub:** Full-bleed zoomable canvas supporting 14, 30, and 90-day spans.
  - 4 Synchronized Signal Tracks:
    * *Track 1 (Focus):* Deep work hours with proportional dot radii.
    * *Track 2 (Habits):* Daily completion score tally.
    * *Track 3 (Internal):* Mood index curve.
    * *Track 4 (Kinetic):* Training load volume.
  - Vertical crosshair cursor connecting all 4 tracks simultaneously on hover.
  - **Synthesis Insight:** Rigorous Pearson correlation notice (only shown when $N \ge 4$ pairs exist).
* **Data Sources & Truth:**
  - `useTimeAnalytics`
  - `useHabitWorkspace`
  - `useJournal`

---

## ROOM 9: REPORTS [The Sunday Paper / Field Dossier]

* **Route:** `/reports`
* **Architectural Metaphor:** The Sunday Paper / Field Dossier — Weekly synthesis. An archival broadsheet field paper.
* **Human Question:** "What actually happened this week, and what does it mean for my trajectory?"
* **Emotional Character:** Thoughtful, complete, literary, conclusive.
* **Visual Mode:** **EDITORIAL** (Chronicle Primitive).
* **Primary Composition:**
  - Broadsheet 3-column layout.
  - Column 1 & 2: Written synthesis of Wins, Blockers, and Tactical Adjustments.
  - Column 3: The Weekly Ledger (Tasks completed, habits met, training volume, focus hours).
  - **Automatic Synthesis:** If the user has not written manual notes, the page **automatically compiles tracked telemetry** into a structured field dossier rather than displaying an empty blank "Data unavailable" screen.
  - Linked directly in the main navigation.
* **Data Sources & Truth:**
  - `useWeeklyReview`
  - `useTasks`
  - `useHabitWorkspace`
  - `useFitnessDashboard`

---

## ROOM 10: SYSTEM [The Machine Room]

* **Route:** `/system`
* **Architectural Metaphor:** The Machine Room — Diagnostic telemetry engine and Brain Engine health.
* **Human Question:** "Is the underlying Life OS machinery healthy and operating correctly?"
* **Emotional Character:** Raw, mechanical, truthful, quiet.
* **Visual Mode:** **INSTRUMENT** (Terminal Primitive).
* **Primary Composition:**
  - Swiss diagnostic console: monochrome typography, razor-thin datum lines.
  - Banish Datadog-style Bento cards, glowing green box-shadows, and military threat badges.
  - Clean subsystem telemetry vitals and raw event bus stream.

---

## ROOM 11: TIME OS [Temporal Allocation & Flow]

* **Route:** `/time-os`
* **Architectural Metaphor:** Flow State Laboratory — Attention allocation and temporal awareness.
* **Visual Mode:** **INSTRUMENT** (Terminal Primitive).
* **Primary Composition:**
  - Giant tabular mono timer (`00:48:22`) asymmetrically anchored.
  - Direct tactile controls: `[PAUSE]` • `[STOP SESSION]` • `[POP OUT PiP]`.
  - Chronological Ledger of logged sessions below.

---

## ROOM 12: FINANCE OS [Resource Circulation Ledger]

* **Route:** `/finance-os`
* **Architectural Metaphor:** Resource Circulation — Tracking capital flow without commercial SaaS accounting clutter.
* **Visual Mode:** **INSTRUMENT** (Field + Ledger Primitives).
* **Primary Composition:**
  - Banish the 4-card KPI grid.
  - Single horizontal resource horizon: `AVAILABLE: ₹45,000` • `SPENT: ₹18,200` • `REMAINDER: ₹26,800`.
  - High-density chronological circulation ledger.

---

## GLOBAL OVERLAYS: Command Horizon & Action Sheets

* **Universal Command Palette (`Cmd+K`):**
  - Floating dark glass modal (`backdrop-blur-2xl bg-surface/95 border border-border-subtle`).
  - Fast keyboard shortcuts: `/t [task]`, `/f [amount]`, `/j [reflection]`, `/w [start workout]`.
* **Universal Action Sheets (Mobile):**
  - All modals convert to swipeable bottom sheets on screens < 640px.
  - 280ms physical spring curve. Drag down to dismiss.
