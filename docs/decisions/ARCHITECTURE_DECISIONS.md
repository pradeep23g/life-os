# LIFE OS — ARCHITECTURE DECISIONS (ADR)

**Status:** Authoritative Architectural Decision Log  
**Last Synchronized:** September 2026 (Winter Arc Overhaul: ADR-001 through ADR-025)

---

## ADR-001: Domain-Driven Feature Architecture
- **Context:** Life OS tracks 8 distinct domains. Conflating features creates cognitive pollution.
- **Decision:** All features live in `src/features/<domain>/` with isolated API hooks, components, and types.
- **Consequences:** Clean scaling, explicit domain boundaries, immediate discoverability.

---

## ADR-002: SQL-First Aggregation, TypeScript-Only Intelligence
- **Context:** Cross-domain aggregations over multi-year datasets must remain fast and deterministic.
- **Decision:** Multi-day joins and aggregations live in PostgreSQL SQL views (`security_invoker = true`). TypeScript performs ranking, scoring, and directive generation on view outputs.
- **Consequences:** Client-side compute stays lightweight; data contracts are enforced at the database level.

---

## ADR-003: TanStack React Query for Server State
- **Context:** Multiple independent data streams require explicit caching and invalidation.
- **Decision:** TanStack React Query v5 is the exclusive server state manager.
- **Consequences:** Explicit cache keys (`['mind-os', 'habits']`, `['system-status']`), declarative refetching, zero stale useEffect waterfalls.

---

## ADR-004: Dual Event Pipeline Architecture
- **Context:** Permanent analytics vs. immediate operational responsiveness.
- **Decision:**
  - `public.events` (via `logEventSafe`) provides permanent, immutable analytics.
  - `public.system_event_queue` (via `useEventBus`) provides transient operational signals consumed by Evening Sync.
- **Consequences:** Analytics data remains clean; operational UI updates remain instant.

---

## ADR-005: Single Canonical Event Taxonomy
- **Context:** Telemetry drift and conflicting snake_case vs dot-notation strings caused false degradation.
- **Decision:** Single source of truth in `src/lib/eventTaxonomy.ts`. All emitters and views standardize on canonical dot-case constants (`domain.entity.action`).
- **Consequences:** 100% telemetry consistency, reliable Data Lab coverage scoring.

---

## ADR-006: IST-Scoped Analytics Normalization
- **Context:** Day-level behavioral boundaries must align with user timezone (IST, UTC+5:30).
- **Decision:** All analytics events store `event_date_ist` as `YYYY-MM-DD`. SQL views use `at time zone 'Asia/Kolkata'`.
- **Consequences:** Accurate midnight cutoffs, correct Monday week starts.

---

## ADR-007: Retirement of Progress Hub in Favor of Learning OS
- **Context:** Skill tracking was unstructured and lacked curriculum progression.
- **Decision:** Retired `programming_skills`, `milestones`, `challenges`, `personal_skills` into `progress_hub_archive`. Created `Learning OS` with roadmaps, stages, sessions, and study logs.
- **Consequences:** Structured hierarchical curriculum management with direct focus timer integration.

---

## ADR-008: Document Picture-in-Picture (PiP) for Global Timer
- **Context:** Users need continuous visibility of focus timers while working across applications.
- **Decision:** Integrated native HTML5 Document Picture-in-Picture API with fallback to sticky in-app banner.
- **Consequences:** Native always-on-top focus companion without third-party desktop wrappers.

---

## ADR-009: In-Memory EventBus Queue Bounds, TTL Pruning, and Peek-and-Splice Persistence Safety
- **Context:** Unbounded event accumulation in long-running browser sessions risks client memory leaks. Additionally, optimistic dequeueing before remote insertion risked event loss if the network dropped.
- **Decision:** Bound in-memory queue to 200 items (`MAX_QUEUE_CAPACITY`) and recent events to 50 (`MAX_RECENT_EVENTS`). Prune events older than 24 hours on ingest. Enforce peek-and-splice persistence where events remain in queue until Supabase confirms insertion, backed by exponential backoff (1s–30s) and quarantine after 5 failed attempts.
- **Consequences:** Client memory footprint is strictly bounded; zero event loss during transient offline periods; poisoned events are quarantined without blocking background telemetry.

---

## ADR-010: Mission Control Ground Truth Metrics, Mathematical Confidence Scoring, and Honest Baseline Visualization
- **Context:** Previous mock values (such as hardcoded 94% confidence, simulated sparkline curves, and omitted finance snapshot columns) obscured system degradation and misled the user.
- **Decision:** Mission Control UI components must exclusively consume live Supabase views (`current_day_snapshot`, `current_day_snapshot_history_14d`). Brain Engine confidence is deterministically calculated via `Freshness (35%) + Completeness (35%) + Coverage (30%)`. Hero sparkline renders true historical `emaSeries` or an honest flat baseline `[0, 0, ...]` for cold-start users instead of synthetic sine waves.
- **Consequences:** Absolute metrics integrity; zero deceptive or fabricated numbers; system degradation is faithfully presented with actionable directives.

---

## ADR-011: 7-Domain Brain Engine & Data Lab Signal Integration with Whitespace Normalization
- **Context:** Finance OS and Learning OS were not fully factored into Brain Engine directives. In Data Lab, Postgres view module names formatted with spaces (`'Mind / Habits'`, `'Mind / Journal'`) failed strict string equality checks in TypeScript calculators, reporting false 0% consistency.
- **Decision:** Brain Engine directives and domain signals monitor all 7 operational domains (including budget pressure >90%, high discretionary want spending >3, and Learning roadmap velocity). Data Lab metrics calculators incorporate `normalizeKey()` to reconcile view labels with domain keys.
- **Consequences:** Complete 7-domain behavioral intelligence; robust SQL-to-TypeScript mapping impervious to whitespace variations.

---

## ADR-023: Kinetic Astrolabe Orb Navigation Architecture
- **Context:** The legacy persistent sidebar consumed 64px–240px of horizontal layout space, causing content reflow and layout friction across subpage headers. An initial prototype of the orb menu suffered from overlapping text labels across satellite icons, vague orbital distances, and lacked integrated session/profile termination.
- **Decision:** Replaced traditional navigation sidebars with an edge-anchored 3-ring Kinetic Astrolabe Orb navigation (`src/layout/AstrolabeOrbNav.tsx`).
  - Orbital radii were tightened by 20% (desktop: 96px, 147px, 198px; mobile: 75px, 119px, 163px) to ensure sharp visual grouping.
  - Peripheral hover tooltips were eliminated to avoid collision; instead, the open central avatar orb functions as the dynamic telemetry HUD, displaying the hovered module's uppercase title, signature neon branding, and ambient back-glow.
  - Integrated user profile navigation and Supabase session sign-out directly into the central Astrolabe controls via `AuthContext`.
- **Consequences:** Clean, edge-to-edge brutalist canvas across all 8 modules; zero tooltip occlusion; unified focal point for multi-module switching on desktop and touch devices.

---

## ADR-024: Chronos Time OS Architecture & Deterministic Bioluminescent Purity
- **Context:** Time OS relied on legacy components that diverged from the Winter Arc monospace aesthetic. Historical tracking lacked qualitative reinforcement of focus streaks, and early prototypes risked non-deterministic render impurities in React 19.
- **Decision:** Structured Time OS as a tri-modal engine (`[MONOLITH]`, `[HISTORY]`, `[ANALYTICS]`):
  - **Chronos Analytics (`TimeInsights.tsx`):** A borderless monospace terminal grid featuring Hero Bucket Distribution cards with massive Geist Mono percentages, dynamic module branding colors, ASCII density meters (`██████··`), and a 7-day trend ledger with peak intensity indicators.
  - **Chronos History (`TimeHistory.tsx`):** An 84-day (12-week) GitHub-style density grid with circadian ambient color shifts (Amber for morning, Electric Cyan for afternoon, Rose for evening, Cosmic Purple for night) and an 8H+ max-intensity white pulse.
  - **Streak-Driven Bioluminescent Roots:** A recursive SVG tree visualizer that deepens branch depth based on continuous daily focus streaks. To guarantee 100% React 19 render purity, organic sways are generated via coordinate harmonic sinusoids (`Math.sin(x * 0.05 + y * 0.03 + depth) * 0.1`) without `Math.random()`.
- **Consequences:** 100% deterministic SSR/CSR rendering; zero React purity warnings; immediate visual reinforcement of temporal focus volume without third-party chart dependencies.

---

## ADR-025: Fitness OS Kinetic Ledger, Dual Categorization & Cross-OS Focus Integration
- **Context:** Training logs previously suffered from cluttered forms, intrusive rest timers that broke gym tempo, lack of movement-pattern categorization, and complete disconnection from Time OS focus telemetry. Additionally, remote database tables lacked a `movement_pattern` column.
- **Decision:**
  - **Kinetic Step-by-Step Ledger (`ActiveWorkoutPanel.tsx`, `WorkoutsPage.tsx`):** Minimal terminal initialization prompt (`> INITIALIZE WORKOUT`), step-by-step active set isolation (Current Set vs Next Set preview), massive Geist Mono mass/rep numerals, a collapsible tactical touch numpad (`1-9, 0, ., CLR`), optional RPE scale, and removed rest timers.
  - **Dual Categorization & Cybernetic Wireframes (`FitnessLibraryPage.tsx`, `AnatomyWireframe.tsx`):** Dual-mode directory filtering by Primary Muscle and Movement Pattern (Squat, Hinge, Push, Pull, Core, Carry) paired with bespoke cybernetic anatomical wireframe SVGs. Movement patterns are derived at the API transform layer, preserving schema compatibility without requiring unmigrated columns.
  - **Monument Trophies (`PersonalRecordsPage.tsx`):** Concentric cybernetic sigils supporting mass and isometric hold durations, accompanied by a screen flash celebration banner (`"RECORD OVERWRITTEN // PROTOCOL ASCENDANCY ESTABLISHED"`).
  - **Automatic Cross-OS Temporal Sync (`useFitness.ts`):** Invoking `endWorkoutSession` automatically inserts a matching session record into `time_logs` under the `'Fitness'` bucket and invalidates Time OS query caches in real time.
- **Consequences:** Zero manual double-entry between workout tracking and focus tracking; low-friction tactical logging during live physical training; robust schema compatibility guaranteed.
