---
title: "Life OS — Architecture Decision Records (ADRs)"
status: "canonical"
last_synchronized_commit: "77d1a5b"
domain: "decisions"
---

# LIFE OS — ARCHITECTURE DECISIONS (ADR)

**Status:** Authoritative Architectural Decision Log  
**Last Synchronized:** September 2026 (Winter Arc Overhaul: Monotonic Sequence ADR-001 through ADR-028)

---

## ADR-001: Domain-Driven Feature Architecture
- **Context:** Life OS tracks 7 behavioral scoring domains powering the Brain Engine, with 14 client routes serving all features. Conflating features creates cognitive pollution.
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
  - `public.system_event_queue` (via `useEventBus`) provides transient operational signals consumed by Evening Sync. The in-memory Zustand store functions as an asynchronous telemetry outbox and staging buffer with offline queueing, exponential retry, and dead-letter quarantine before remote persistence. Instant operational UI responsiveness is provided natively by TanStack Query cache mutations (`onMutate` optimistic updates with snapshot rollback), rather than relying on the Zustand store as an operational UI state bus.
- **Consequences:** Analytics data remains clean and durable in PostgreSQL; operational UI updates are instant and resilient via TanStack Query optimistic updates; transient telemetry is safely buffered and decoupled from view rendering.

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

## ADR-012: Season Engine Data Model (`life_seasons` & Vows Architecture)
- **Status:** Accepted (Reconciled with PostgreSQL migration `202609120000_winter_arc_remediation.sql`)
- **Context:** Winter Arc requires a first-class Season concept to model dedicated multi-week/multi-month developmental cycles, seasonal directives, and vows.
- **Decision:** Implemented dedicated `public.life_seasons` table in PostgreSQL migration `202609120000_winter_arc_remediation.sql`.
- **Database Schema:**
  - Table: `public.life_seasons`
  - Columns:
    - `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
    - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `name text NOT NULL`
    - `start_date date NOT NULL`
    - `end_date date NOT NULL`
    - `vows jsonb DEFAULT '[]'::jsonb NOT NULL`
    - `created_at timestamptz DEFAULT now() NOT NULL`
    - `updated_at timestamptz DEFAULT now() NOT NULL`
  - Security: Row Level Security (RLS) enabled with policy `"Users can manage their own life seasons"` (`auth.uid() = user_id`).
- **Rejected Alternatives:**
  - `goals` table: `goals.domain` has a CHECK constraint restricted to 5 domains with no 'season' domain; seasons are macro-temporal contexts rather than discrete goals.
  - Code-only / localStorage: Precludes querying historical seasons across devices and multi-year trajectory analysis.
- **Consequences:** Season statistics are derived dynamically from existing telemetry activity within the season's `[start_date, end_date]` date window (`event_date_ist`). Event rows do not store a foreign `season_id`, preserving loose coupling. Structured seasonal vows, principles, and phases are encapsulated cleanly in `vows jsonb`.

---

## ADR-013: Avatar Rendering Architecture
- **Status:** Accepted
- **Context:** The user avatar requires visual representation across both web and mobile client interfaces reflecting current seasonal status, streaks, and progression.
- **Decision:** Composable SVG avatar architecture.
- **Consequences:**
  - Avatar state is stored as a single-row profile record or JSONB within user profile/settings (`user_settings`), not as a fragmented relational table.
  - Cosmetics and visual artifacts are stored as JSONB on the avatar state, avoiding separate cosmetics tables.
  - Design assets live as modular SVG files in the project assets directory.
  - Home (a new entry surface that replaced Mission Control as the index route `/`; Mission Control persists at `/system`) displays partial/contextual avatar telemetry. Profile (`/profile`) displays the full hero avatar with detailed attributes, unlocked achievements, and season history. Mobile displays a compact, adaptive avatar.

---

## ADR-014: Mobile Technology Stack
- **Status:** Accepted
- **Context:** An Android application is required for low-friction tactical logging, always-available focus companions, and home screen widgets.
- **Decision:** Native Android Kotlin + Jetpack Compose.
- **Consequences:**
  - Web client and Android app share the backend, Supabase Auth, and PostgreSQL data contracts, while maintaining platform-native UI code.
  - Supabase Kotlin SDK (`io.github.jan-tennert.supabase`) provides authentication and data access.
  - Employs Jetpack Compose, Kotlin Coroutines, WorkManager, AlarmManager, Jetpack Glance for home screen widgets, and native notification APIs.

---

## ADR-015: XP/Progression Storage Strategy
- **Status:** Accepted
- **Context:** Gamified XP and progression mechanics need reliable persistence without schema bloat or synchronization race conditions.
- **Decision:** XP is derived deterministically from canonical Life OS events (`public.events`). No separate XP-specific relational tables are maintained initially.
- **Consequences:**
  - XP rules and leveling curves are deterministic and versioned in application code.
  - Level is calculated from total accumulated XP. Each event type maps to a fixed XP value using `event_type` and payload fields.
  - Optimized projection views (e.g. `data_lab_signal_xp`) can be introduced if profiling indicates query performance overhead.

---

## ADR-016: Achievement Storage Strategy (`user_achievements` & Badge Catalog)
- **Status:** Accepted (Reconciled with PostgreSQL migration `202609120000_winter_arc_remediation.sql`)
- **Context:** Achievement unlocks require persistent recording, fast per-user querying, and idempotent unlock operations.
- **Decision:** Dedicated `public.user_achievements` table combined with client-side TypeScript badge catalog definitions, migrated in `202609120000_winter_arc_remediation.sql`.
- **Database Schema:**
  - Table: `public.user_achievements`
  - Columns:
    - `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
    - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `badge_id text NOT NULL`
    - `unlocked_at timestamptz DEFAULT now() NOT NULL`
    - `metadata jsonb DEFAULT '{}'::jsonb NOT NULL`
    - `created_at timestamptz DEFAULT now() NOT NULL`
  - Constraints & Indexes: Unique index `idx_user_achievements_unique ON public.user_achievements (user_id, badge_id)`.
  - Security: Row Level Security (RLS) enabled with policy `"Users can manage their own achievements"` (`auth.uid() = user_id`).
- **Rejected Alternatives:**
  - Events-only: `public.events` is append-only with no unique constraints; scanning historical event logs to compute unlocked badges is computationally prohibitive.
  - Complex relational badge tables: Overhead of relational tables for static badge metadata is unwarranted; badge metadata and criteria belong in TypeScript constants.
- **Consequences:** O(1) unlock verification via unique index `(user_id, badge_id)`. Audit telemetry event `progression.achievement.unlocked` can be emitted asynchronously without blocking UI unlocks. Main gallery is rendered on Profile (`/profile`).

---

## ADR-017: API/MCP Boundary Design
- **Status:** Accepted
- **Context:** External automation, Model Context Protocol (MCP) servers, and AI agents require controlled API access to Life OS data.
- **Decision:** Supabase Edge Functions serve as the controlled external API boundary.
- **Rejected Alternatives:**
  - Unrestricted PostgREST: Direct anon/service role exposure lacks domain-level rate limiting, scoped permissions, and semantic validation.
  - Dedicated standalone backend server: Adds unnecessary infrastructure cost and operational maintenance for a personal life operating system.
- **Consequences:** REST API and MCP endpoints share the same Edge Function authorization and security scope. Operations follow least privilege, default to read-only, and require explicit authorization headers for state mutations.

---

## ADR-018: AI Gateway Provider Architecture
- **Status:** Accepted
- **Context:** Generative AI capabilities (curriculum generation, reflection coaching, summarization) require multi-provider routing without leaking secret API keys to browser clients.
- **Decision:** Supabase Edge Function AI Gateway routing requests across local, free, and paid provider models.
- **Rejected Alternatives:**
  - Client-side direct LLM API calls: Insecure; exposes secret API keys in browser bundles.
  - Dedicated standalone AI server: Excessive operational overhead.
- **Consequences:**
  - Centralized Edge Function enforces privacy routing rules: journal content remains LOCAL ONLY, financial data remains LOCAL ONLY (unless opt-in), and personal identifiers are never transmitted externally.
  - AI outputs are advisory and never override deterministic Brain Engine heuristics.
  - Provider outages degrade gracefully to raw view data.

---

## ADR-019: Notification Trigger Architecture
- **Status:** Accepted
- **Context:** Time-sensitive reminders (morning kick-off, hourly pulse, evening review) require reliable triggers across platforms.
- **Decision:** Android-first device-local scheduling for routine reminders, reserving Firebase Cloud Messaging (FCM) exclusively for server-originated events.
- **Rejected Alternatives:**
  - Database pg_cron / webhook notifications for routine reminders: Overkill and battery-inefficient for simple local scheduling.
- **Consequences:** Native Android `AlarmManager.setExactAndAllowWhileIdle()` handles time-critical alerts (morning focus, evening sync); `WorkManager.PeriodicWorkRequest` handles deferrable tasks (hourly pulse). FCM is used strictly for remote asynchronous events (e.g., cloud backup completed, remote API trigger).

---

## ADR-020: Report Generation Architecture
- **Status:** Accepted
- **Context:** Users need analytical reports and data exports across daily, weekly, and seasonal cadences.
- **Decision:** Deterministic client-side computation on demand using canonical views.
- **Rejected Alternatives:**
  - Server-side cron generation: Unnecessary compute overhead and storage cost when reports are viewed infrequently on demand.
  - Hybrid persistence: Complex cache synchronization without tangible user benefit.
- **Consequences:** Zero background compute cost; reports compute instantly on demand using existing TanStack Query cache and PostgreSQL views. Exports supported in PDF, Markdown, HTML, JSON, and CSV.

---

## ADR-021: Chart/Visualization Library
- **Status:** Accepted
- **Context:** Data Lab and Reports require interactive charts (area, bar, radar, scatter), but web bundle size must remain constrained under 500kB.
- **Decision:** Recharts for complex analytical visualizations, strictly lazy-loaded via `React.lazy`.
- **Rejected Alternatives:**
  - Chart.js: Imperative DOM manipulation, awkward React integration, larger core overhead.
  - Visx: Too low-level, high maintenance footprint for charting primitives.
  - Custom SVG everywhere: Impractical for multi-axis, interactive analytical charts.
- **Consequences:** Recharts is dynamically loaded only when navigating to `/data-lab` or `/reports`. Micro-visualizations, progress rings, sparklines, and GitHub-style heatmaps continue to use lightweight zero-dependency inline SVGs.

---

## ADR-022: Life Pulse Data Model (`pulse_logs`)
- **Status:** Accepted (Reconciled with PostgreSQL migration `202609120000_winter_arc_remediation.sql`)
- **Context:** Hourly and ad-hoc subjective state check-ins (energy, mood, focus, physical readiness) need dedicated persistent storage.
- **Decision:** Dedicated `public.pulse_logs` table in PostgreSQL, migrated in `202609120000_winter_arc_remediation.sql`.
- **Database Schema:**
  - Table: `public.pulse_logs`
  - Columns:
    - `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`
    - `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
    - `timestamp timestamptz DEFAULT now() NOT NULL`
    - `value text NOT NULL`
    - `metadata jsonb DEFAULT '{}'::jsonb NOT NULL`
    - `created_at timestamptz DEFAULT now() NOT NULL`
  - Security: Row Level Security (RLS) enabled with policy `"Users can manage their own pulse logs"` (`auth.uid() = user_id`).
- **Rejected Alternatives:**
  - `public.events` table: High check-in frequency (12–16 logs/day) would dilute permanent system behavioral telemetry; check-ins represent domain entities rather than telemetry events.
  - `public.system_event_queue`: Queue is ephemeral with TTL pruning; unsuitable for persistent historical trends.
- **Consequences:** Clean isolation of subjective state telemetry; enables continuous longitudinal trend analysis without degrading operational telemetry performance.

---

## ADR-023: Kinetic Astrolabe Orb Navigation Architecture
- **Context:** The legacy persistent sidebar consumed 64px–240px of horizontal layout space, causing content reflow and layout friction across subpage headers. An earlier 14-button 3-ring layout created visual congestion, unreadable oversaturated hover glow across the central core, and lacked circadian theme inheritance.
- **Decision:** Replaced traditional navigation sidebars with an edge-anchored 2-ring Kinetic Astrolabe Orb navigation (`src/layout/AstrolabeOrbNav.tsx`) featuring Two-Tier Bloom navigation:
  - **Orbital Radii & Geometry:** Consolidated into 2 spacious rings (desktop: 125px, 210px; mobile: 95px, 165px) distributing 9 primary operational nodes across a $0^\circ$ to $90^\circ$ quadrant.
  - **Two-Tier Bloom with Sibling Blur:** First bloom reveals 9 primary nodes while blurring the background page. Clicking a fanout parent (`Productivity & Time` or `Data & Reports`) smoothly blooms 2 satellite child nodes ($r + 54\text{px}$) while sibling orbs receive `filter: blur(3px) opacity(0.25)` to isolate focus. Winter Arc is preserved as its own standalone primary node.
  - **Dual-Role Central Core:** When closed, displays user avatar with momentum progress gauge. When open, serves as direct "HOME" launchpad (`/`). When hovering any module, projects clean high-contrast monospace text directly inside the circular orb with a softened ambient halo (`opacity-20 blur-xl`) and matching module border glow (zero unreadable oversaturation or rectangular badges).
  - **Circadian Theme Synchronization:** Orb surfaces and borders dynamically inherit `--bg-surface`, `--border-base`, and `--text-secondary` across Dawn, Day, Dusk, and Midnight.
  - **Organic Drifting Motion:** Staggered multi-phase floating animations (`animate-orb-float-1` to `4`) applied asynchronously to inner node containers for a living celestial feel.
  - **Administrative & Session Governance Consolidation:** Administrative controls and session termination previously floating off-ring at `-top-4 -right-12` are consolidated into `/profile` under Room 05 System Operations (`ProfileSystemOperations.tsx`), housing direct Admin Console navigation and secure Session Sign Out (`signOut`).
- **Consequences:** Clean, edge-to-edge brutalist canvas across all active modules; zero tooltip occlusion; uncluttered 9-node hierarchy with rapid fanout access; 100% legibility on hover; unified focal point for multi-module switching on desktop and touch devices.

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
- **Context:** Training logs previously suffered from cluttered forms, intrusive rest timers that broke gym tempo, lack of movement-pattern categorization, and complete disconnection from Time OS focus telemetry. Additionally, remote database tables initially lacked schema-level columns for movement patterns and calisthenics duration holds.
- **Decision:**
  - **Kinetic Step-by-Step Ledger (`ActiveWorkoutPanel.tsx`, `WorkoutsPage.tsx`):** Minimal terminal initialization prompt (`> INITIALIZE WORKOUT`), step-by-step active set isolation (Current Set vs Next Set preview), massive Geist Mono mass/rep numerals, a collapsible tactical touch numpad (`1-9, 0, ., CLR`), optional RPE scale, and removed rest timers.
  - **Dual Categorization & Cybernetic Wireframes (`FitnessLibraryPage.tsx`, `AnatomyWireframe.tsx`):** Dual-mode directory filtering by Primary Muscle and Movement Pattern (Squat, Hinge, Push, Pull, Core, Carry) paired with bespoke cybernetic anatomical wireframe SVGs.
  - **Database Migration Reconciliation:** While initial prototypes derived movement patterns solely at the API transform layer, both `movement_pattern text` in `public.fitness_exercises` and `duration_seconds integer check (duration_seconds >= 0)` in `public.exercise_logs` were formally migrated into PostgreSQL in migration `20260916232300_fitness_kinetic_fields.sql` to support native database indexing, calisthenics hold tracking, and architectural catalog dual-categorization.
  - **Monument Trophies (`PersonalRecordsPage.tsx`):** Concentric cybernetic sigils supporting mass and isometric hold durations, accompanied by a screen flash celebration banner (`"RECORD OVERWRITTEN // PROTOCOL ASCENDANCY ESTABLISHED"`).
  - **Automatic Cross-OS Temporal Sync (`useFitness.ts`):** Invoking `endWorkoutSession` automatically inserts a matching session record into `time_logs` under the `'Fitness'` bucket and invalidates Time OS query caches in real time.
- **Consequences:** Zero manual double-entry between workout tracking and focus tracking; low-friction tactical logging during live physical training; robust native PostgreSQL schema storage for movement patterns and hold durations.

---

## ADR-026: Seasons & Achievements Admin Control Layer
- **Status:** Accepted (Formerly Winter Arc ADR-023; renumbered to resolve duplicate ID collision with ADR-023 Astrolabe Orb Navigation)
- **Context:** The Seasons and Achievements systems require robust administrative management without direct database modification or application source code changes.
- **Decision:** Implement an authenticated admin/control layer (`/admin`) for managing seasons and achievements with canonical JSON schema import/export capabilities.
- **Consequences:**
  - The admin layer supports creating, editing, activating, archiving, and managing seasons and achievements natively through an authenticated UI.
  - Application source code does not need to be touched to create or modify a season.
  - A validated canonical JSON import/export format (`SeasonConfigurationPayload` and `AchievementCatalogPayload`) is provided so future agents or authorized automation can provision configuration through a controlled interface/API.
  - `seed.sql` only provides initial development/demo data and is not the long-term source of truth.
- **Canonical JSON Schema Contract:**
```json
{
  "$schema": "https://life-os.system/schemas/v1/season-config.json",
  "version": "1.0.0",
  "season": {
    "name": "Winter Arc 2026",
    "startDate": "2026-07-30",
    "endDate": "2026-10-27",
    "status": "active",
    "vows": {
      "vow": {
        "headline": "Silence and Execution",
        "body": "No announcements. No half-measures. Cold focus in the dark.",
        "attribution": "Seasonal Directive"
      },
      "principles": [
        "Eliminate non-essential commitments",
        "Kinetic discipline daily",
        "Cognitive rigor in deep work"
      ],
      "phases": [
        { "name": "Foundation", "startDay": 1, "endDay": 14 },
        { "name": "Deep Arc", "startDay": 15, "endDay": 75 },
        { "name": "Harvest & Transition", "startDay": 76, "endDay": 90 }
      ]
    }
  },
  "achievements": [
    {
      "badgeId": "arc_iron_initiate",
      "name": "Iron Initiate",
      "description": "Logged 10 consecutive active days during an active Arc",
      "tier": "bronze",
      "criteria": { "type": "consecutive_days", "count": 10 }
    }
  ]
}
```

---

## ADR-027: Recovery OS: Sanctuary, Grief Processing & Spoons Engine
- **Status:** Accepted (Architecture Approved — Implementation Pending; formerly Winter Arc ADR-024)
- **Context:** During periods of deep bereavement, traumatic loss, emotional grief, or severe physical/mental exhaustion, standard productivity expectations ("Crush your goals", "Streak counters", "Momentum scores") become adversarial and actively harmful. The user needs a dedicated sanctuary mode to safely hold grief, process loss, and honor low emotional bandwidth without guilt or failure metrics.
- **Decision:** Introduce **Recovery OS** as a first-class operational sanctuary state and dedicated route (`/recovery` or integrated `/mind-os/recovery`).
- **Core Pillars:**
  1. **Radical Downscaling (The Spoons Engine):** Daily task lists are replaced with an ultra-minimal "Energy & Spoons" allocation (Rest, Nourishment, Hydration, 1 gentle somatic movement).
  2. **Grief & Unburdening Journal:** Dedicated reflection modes with compassionate prompts ("What feels heavy today?", "What memory wants space?", "Permission to do nothing") that never calculate "productivity scores" or demand action items.
  3. **Streak Preservation / Hibernation:** All habit streaks, Arc countdowns, and performance targets enter "Protected Hibernation" — they do not break, decay, or trigger failure notifications.
  4. **Living Emblem State (`recovering`):** The Avatar transitions to a quiet, breathing amber orbit with reduced visual velocity, reflecting the `.theme-recovery` color palette (sage/sepia low-contrast OKLCH tokens).
  5. **Zero Threat / Zero Pressure Vocabulary:** Complete eradication of critical alarms, red badges, or urgency-driving banners.
- **Consequences:** Prevents psychological injury and cognitive burnout during personal crises; transforms Life OS from a rigid performance engine into an empathetic lifelong operating system.

---

## ADR-028: Learning OS AI Curriculum & Study Plan JSON Ingestion Protocol
- **Status:** Accepted (Formerly Winter Arc ADR-025; renumbered to resolve duplicate ID collision with ADR-025 Fitness OS Kinetic Ledger)
- **Context:** Creating extensive multi-stage learning roadmaps manually is high-friction. Users frequently leverage external LLMs (Claude, ChatGPT, Gemini) or future AI agents to formulate structured learning trajectories for complex domains (e.g., Systems Programming, Machine Learning, Clinical Neuroscience).
- **Decision:** Implement a validated AI Curriculum Importer modal inside Learning OS (`/learning-os`) supporting direct copy-pasting of AI-generated JSON or API payload ingestion.
- **Consequences:**
  - The importer accepts a standard canonical JSON curriculum structure and performs schema validation (via client validator / Zod / schema checks).
  - Provides an interactive preview showing Roadmap title, stages, session count, estimated hours, and project milestones before database commit.
  - Atomic batch persistence: Single-transaction persistence into Supabase tables `learning_roadmaps`, `learning_stages`, `learning_sessions`, `learning_milestones`, and `learning_projects`.
- **Canonical Curriculum JSON Schema Contract:**
```json
{
  "$schema": "https://life-os.system/schemas/v1/curriculum.json",
  "title": "Distributed Systems Engineering",
  "slug": "distributed-systems-engineering",
  "description": "Mastery of consensus, fault tolerance, replication, and distributed state machines.",
  "startDate": "2026-10-01",
  "targetEndDate": "2026-12-31",
  "color": "var(--accent-primary)",
  "stages": [
    {
      "orderIndex": 1,
      "title": "Stage 1: Core Foundations & Time",
      "subtitle": "Lamport Clocks, Vector Clocks, and Network Asynchrony",
      "sessions": [
        {
          "orderIndex": 1,
          "title": "Time, Clocks, and the Ordering of Events",
          "estimatedMinutes": 90,
          "tags": ["consensus", "time", "theory"]
        },
        {
          "orderIndex": 2,
          "title": "Vector Clocks in Practice",
          "estimatedMinutes": 60,
          "tags": ["implementation", "clocks"]
        }
      ]
    }
  ],
  "milestones": [
    { "title": "Implement Lamport Logical Clock simulator in Go" }
  ],
  "projects": [
    {
      "title": "Toy Raft Cluster",
      "description": "3-node Raft consensus engine with leader election and log replication."
    }
  ]
}
```

---

## ADR-029: Arc Engine: Prescriptive Seasonal Campaigns, Deterministic Strict Pacing & Two-Stage Lifecycle
- **Status:** Accepted
- **Context:** Life OS previously relied on a hardcoded "Winter Arc 2026" campaign (ADR-012, ADR-023, ADR-026) with static 90-day timeframes, hardcoded vows, and manual database insertions. Users need a repeatable, prescriptive temporal campaign engine that can run any seasonal arc (e.g., Spring Build, Autumn Velocity, Solitary Arc) with self-declared commitments, deterministic telemetry pacing, hybrid focus domains, zero-overhead AI ingestion, mandatory amendment auditing, and cross-OS ambient awareness.
- **Decision:** Generalize the seasonal framework into the **Arc Engine**, backed by a 4-state lifecycle machine (`DRAFT → ACTIVE → COMPLETED → ARCHIVED`), strict linear pacing against `data_lab_daily_activity_90d`, zero-overhead prompt-interrogation ingestion, and a two-stage completion protocol.
- **Core Pillars:**
  1. **Lifecycle State Machine & Single Active Invariant:** Evolve `public.life_seasons` with columns `status` (`'draft'`, `'active'`, `'completed'`, `'archived'`), `original_config` (immutable baseline), `amendments` (audit trail), `milestone_progress` (manual checks), `retrospective` (closing debrief), `completed_at`, `archived_at`, and `planned_end_date`. Enforce that only one arc can be active at a time via a PostgreSQL partial unique index: `CREATE UNIQUE INDEX idx_life_seasons_single_active ON public.life_seasons (user_id) WHERE status = 'active'`.
  2. **Two-Stage Completion Lifecycle:**
     - **Stage 1 (`ACTIVE → COMPLETED`):** Triggered when scheduled duration reaches end date OR user intentionally completes early (via "Conclude Arc"). Sets `status = 'completed'` and records `completed_at = now()`. Crucially, telemetry queries and milestone evaluations freeze at `completed_at`, bounding the evaluated timeline and setting remaining days to 0. Early completion does NOT require an immediate retrospective; the UI displays a completed campaign banner with an "Author Retrospective" callout.
     - **Stage 2 (`COMPLETED → ARCHIVED`):** Gated on answering 5 mandatory debrief questions (`wentWell`, `didntGoWell`, `whatChanged`, `whatLearned`, `whatCarriesForward`). Upon submission, transitions `status = 'archived'`, records `archived_at = now()`, and permanently renders the campaign immutable in the Arc Archive view.
  3. **Zero-Overhead AI Authoring & Ingestion Protocol:** Replicating the proven pattern of Learning OS (`ImportCurriculumModal`, ADR-028), users copy a battle-tested interrogation prompt into an external LLM (Claude, ChatGPT, Gemini) with the persona of "Principal Life Strategist & Seasonal Campaign Architect". The user is interrogated on theme, non-negotiables, telemetry-bound focus domains, milestones, and phases. The resulting JSON is pasted into `CreateArcModal`, validated client-side with Zod (`seasonConfigSchema.ts`), previewed via interactive cards, and activated in 1 click.
  4. **Deterministic Strict Linear Pace Engine:**
     - Computes expected progress based on elapsed calendar days:
       $$\text{expectedProgress} = \left(\frac{\text{elapsedDays}}{\text{totalDays}}\right) \times \text{targetValue}$$
       $$\text{paceRatio} = \frac{\text{actualProgress}}{\text{expectedProgress}}$$
     - Deterministic thresholds: $\ge \text{targetValue} \to \text{complete}$, $\ge 0.85 \to \text{on\_track}$, $\ge 0.60 \to \text{at\_risk}$, $< 0.60 \to \text{behind}$.
     - Computes required daily recovery rate: $\text{paceRequired} = \frac{\text{targetValue} - \text{actualProgress}}{\text{remainingDays}}$.
     - Overall health aggregates to the worst milestone status (`behind > at_risk > on_track > complete > pending`).
     - *"Phased Rhythm" pacing was explicitly rejected* as scope creep and cognitive distortion: linear pacing maintains unwavering accountability without artificially inflating progress in early "ramp-up" phases.
  5. **Direct Telemetry Registry (Zero Daemon Overhead):** Maps 14 registered telemetry binding keys directly onto existing PostgreSQL columns in `data_lab_daily_activity_90d` (e.g. `deep_work.hours`, `tasks.completed`, `habits.completion_rate`, `fitness.workouts`, `active_days.count`), eliminating redundant tables, cron daemons, or client-side calculation loops.
  6. **Mandatory Amendment Auditing:** Commitments made in an active arc are serious. If targets, vows, or principles must be altered mid-campaign, a non-empty user justification string (`reason`) is strictly enforced. Every edit is diffed by milestone ID and appended to `life_seasons.amendments` with `{ timestamp, field, previousValue, newValue, reason }`. Baseline intentions remain frozen in `original_config`.
  7. **Constrained Aesthetic Identity:** Enforces an approved 8-icon seasonal enum (`snowflake`, `sprout`, `sun`, `leaf`, `mountain`, `flame`, `wave`, `star`) and a curated 12-color hex palette, preventing visual dissonance across the OS.
  8. **Cross-OS Ambient Penetration:** The active arc's identity, icon, and dynamic execution health glow (`emerald`/`cyan` for on-track, `amber` for at-risk, `rose` for behind) radiate across the Astrolabe Navigation Orb, shell titles, brand lockup, and the Home screen `AmbientHorizonBar`. When no arc is active, navigation cleanly falls back to a neutral archive trigger.
- **Consequences:**
  - Upgrades Life OS from a single-season test into a permanent, multi-year developmental operating system.
  - Zero cognitive friction to spin up a new arc: no cumbersome 20-step form builder; authoring happens via conversational AI interrogation and copy-paste JSON.
  - Absolute historical integrity: past arcs are frozen with exact start/end/completed timestamps, audit trails, and retrospectives.
- **Canonical Arc Configuration JSON Schema Contract:**
```json
{
  "$schema": "https://life-os.system/schemas/v1/arc-config.json",
  "version": "1.0.0",
  "title": "Spring Build 2027",
  "tagline": "Uncompromising Engineering & Physical Fortitude",
  "startDate": "2027-03-01",
  "endDate": "2027-05-30",
  "totalDays": 90,
  "icon": "mountain",
  "accentColor": "#10b981",
  "vow": {
    "headline": "Code, Iron, and Unwavering Execution",
    "body": "Zero speculative abstractions. Ship daily. Train with ruthless consistency.",
    "attribution": "Spring Directive"
  },
  "principles": [
    "Deep work blocks before communication",
    "Progressive overload in strength and intellect",
    "Ruthless elimination of trivial commitments"
  ],
  "focusDomains": [
    {
      "id": "deep-engineering",
      "name": "Deep Engineering Velocity",
      "theme": "High-leverage architecture and systems focus",
      "binding": { "source": "time_os", "metric": "deep_work_hours" }
    },
    {
      "id": "kinetic-vitality",
      "name": "Kinetic Vitality",
      "theme": "Physical resilience and progressive volume",
      "binding": { "source": "fitness_os", "metric": "workouts_completed" }
    }
  ],
  "milestones": [
    {
      "id": "milestone-deep-work",
      "title": "150 Hours Deep Focus",
      "kind": "telemetry",
      "binding": "deep_work.hours",
      "targetValue": 150,
      "unit": "hrs"
    },
    {
      "id": "milestone-workouts",
      "title": "45 Resistance Workouts",
      "kind": "telemetry",
      "binding": "fitness.workouts",
      "targetValue": 45,
      "unit": "sessions"
    },
    {
      "id": "milestone-ship-engine",
      "title": "Deploy Distributed Storage Engine v1",
      "kind": "manual"
    }
  ],
  "phases": [
    { "name": "Foundational Velocity", "startDay": 1, "endDay": 21, "focus": "Cadence & Setup" },
    { "name": "Deep Architecture", "startDay": 22, "endDay": 65, "focus": "Core Execution" },
    { "name": "Shipment & Polish", "startDay": 66, "endDay": 90, "focus": "Hardening & Delivery" }
  ]
}
```

