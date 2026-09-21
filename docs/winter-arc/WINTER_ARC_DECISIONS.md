---
title: "Winter Arc — Architectural Decisions (Historical Archive)"
status: "historical"
last_synchronized_commit: "77d1a5b"
domain: "historical"
---

# Winter Arc Architectural Decisions (Historical Archive)

> **Deprecation Notice**: This document has been superseded and consolidated into the canonical architectural registry at [`docs/decisions/ARCHITECTURE_DECISIONS.md`](../decisions/ARCHITECTURE_DECISIONS.md).
> All decisions (ADR-012 through ADR-022, and renumbered ADR-026 through ADR-028) now live authoritatively in `ARCHITECTURE_DECISIONS.md`. This file is retained solely for historical provenance.

This document outlines architectural decisions formulated during the Winter Arc planning phase that have now been promoted, reconciled with PostgreSQL migrations, and unified into the canonical decision log [ARCHITECTURE_DECISIONS.md](../decisions/ARCHITECTURE_DECISIONS.md) (ADR-001 through ADR-028).

## PURPOSE:
Historical archive of architectural decisions. For all active implementation, schema specifications, and authoritative architectural guidance, consult [`docs/decisions/ARCHITECTURE_DECISIONS.md`](../decisions/ARCHITECTURE_DECISIONS.md).

## ARCHIVED DECISION RECORDS

### ADR-012: Season Engine Data Model
**Status:** Promoted to Canonical [`ADR-012`](../decisions/ARCHITECTURE_DECISIONS.md#adr-012-season-engine-data-model-life_seasons-vows-architecture) (Reconciled with migration `202609120000_winter_arc_remediation.sql`)
**Context:** Winter Arc needs a Season concept.
**Decision:** Dedicated `public.life_seasons` table (originally proposed as `seasons`, formally migrated as `life_seasons` with `vows jsonb`).
**Rejected Alternatives:**
- Goals table (Rejected — ADR-012): `goals.domain` has CHECK constraint limiting to 5 values; no 'season' value. Season is semantically distinct from a goal (date ranges, themes, objectives).
- Code-only (Rejected — ADR-012): Would prevent querying season history or supporting multiple historical seasons.
**Consequences:** One new table. Season statistics are derived from existing activity within the season's date range. Do NOT attach season_id to every event — use `event_date_ist` + season date range for joins.
**Implementation Constraints:** Actual migrated schema (`202609120000_winter_arc_remediation.sql`): `(id, user_id, name, start_date, end_date, vows jsonb, created_at, updated_at)`. Standard RLS enabled.

### ADR-013: Avatar Rendering Architecture
**Status:** Promoted to Canonical [`ADR-013`](../decisions/ARCHITECTURE_DECISIONS.md#adr-013-avatar-rendering-architecture)
**Context:** Avatar needs visual representation.
**Decision:** Composable SVG avatar.
**Consequences:** Avatar state stored as a single-row table or jsonb. Cosmetics stored as jsonb on avatar state, NOT a separate table. Design assets live as SVG files in project assets directory.
**Implementation Constraints:** Home (evolved Mission Control) shows partial/contextual avatar. Profile (/profile, NEW route) shows full hero avatar with detailed attributes, achievements, and season history. Mobile gets compact/adaptive avatar.

### ADR-014: Mobile Technology Stack
**Status:** Promoted to Canonical [`ADR-014`](../decisions/ARCHITECTURE_DECISIONS.md#adr-014-mobile-technology-stack)
**Context:** Android app needed.
**Decision:** Native Android Kotlin + Jetpack Compose.
**Consequences:** Web and Android share backend/API/data contracts, not UI code. Supabase Kotlin SDK (`io.github.jan-tennert.supabase`) provides auth and data access. Separate Android project.
**Implementation Constraints:** Use Jetpack Compose, Kotlin Coroutines, WorkManager, AlarmManager, Jetpack Glance, native notification APIs, native lifecycle/background capabilities.

### ADR-015: XP/Progression Storage Strategy
**Status:** Promoted to Canonical [`ADR-015`](../decisions/ARCHITECTURE_DECISIONS.md#adr-015-xpprogression-storage-strategy)
**Context:** XP system needs storage.
**Decision:** XP is derived from canonical Life OS events. No XP-specific tables initially.
**Consequences:** XP rules are deterministic/versioned in code. Level is derived from total XP. Each event type maps to a fixed XP value using event_type and payload fields. 
**Implementation Constraints:** Only introduce an optimized persistence/projection layer (e.g., `data_lab_signal_xp` SQL view following existing signal view pattern) if real performance evidence requires it. 

### ADR-016: Achievement Storage Strategy
**Status:** Promoted to Canonical [`ADR-016`](../decisions/ARCHITECTURE_DECISIONS.md#adr-016-achievement-storage-strategy-user_achievements-badge-catalog) (Reconciled with migration `202609120000_winter_arc_remediation.sql`)
**Context:** Achievement unlocks need recording.
**Decision:** Dedicated `public.user_achievements` table + TypeScript definitions.
**Rejected Alternatives:**
- Events-only (Rejected — ADR-016): Events table is append-only with no UPDATE capability (ADR-004). Querying 'show all my unlocked achievements' requires scanning all events with achievement types.
- Hybrid (Rejected — ADR-016): Unnecessarily complex.
**Consequences:** Achievement definitions live in TypeScript constants. Achievement unlock records stored in `user_achievements`. Telemetry event `progression.achievement.unlocked` may additionally be emitted as audit trail. Profile contains the main achievement gallery. No top-level achievement module initially.
**Implementation Constraints:** Actual migrated schema (`202609120000_winter_arc_remediation.sql`): `(id, user_id, badge_id text, unlocked_at timestamptz, metadata jsonb, created_at)`. UNIQUE index `(user_id, badge_id)`. Standard RLS.

### ADR-017: API/MCP Boundary Design
**Status:** Promoted to Canonical [`ADR-017`](../decisions/ARCHITECTURE_DECISIONS.md#adr-017-apimcp-boundary-design)
**Context:** External API needed.
**Decision:** Supabase Edge Functions as the controlled external API boundary.
**Rejected Alternatives:**
- PostgREST (Rejected — ADR-017): Exposes all tables directly via anon/service keys — insufficient for scoped external access and custom authorization.
- Separate server (Rejected — ADR-017): Adds operational complexity without clear benefit for a single-developer project.
**Consequences:** REST API and MCP share the same authorization/scope model. Least privilege. Read-only by default. Explicit write permissions. Do not expose unrestricted PostgREST access as the public integration interface.
**Implementation Constraints:** MCP must not bypass API authorization. Both REST and MCP route through the same Edge Function authorization layer.

### ADR-018: AI Gateway Provider Architecture
**Status:** Promoted to Canonical [`ADR-018`](../decisions/ARCHITECTURE_DECISIONS.md#adr-018-ai-gateway-provider-architecture)
**Context:** AI features need provider routing.
**Decision:** Supabase Edge Function AI Gateway.
**Rejected Alternatives:**
- Client-side (Rejected — ADR-018): API keys exposed in browser (security risk).
- Dedicated server (Rejected — ADR-018): Most flexible but adds infrastructure beyond what a single-developer project needs.
**Consequences:** Architecture: Life OS → API/MCP → AI Gateway → Provider Router → Local / Free / Paid models. No AI API keys in clients. Sensitive data follows privacy routing rules. AI is not authoritative — never replaces Brain Engine.
**Implementation Constraints:** Privacy routing: journal content LOCAL ONLY, financial data LOCAL ONLY unless opted-in, personal identity NEVER external. AI failures gracefully degrade to raw data display.

### ADR-019: Notification Trigger Architecture
**Status:** Promoted to Canonical [`ADR-019`](../decisions/ARCHITECTURE_DECISIONS.md#adr-019-notification-trigger-architecture)
**Context:** Notifications need triggers.
**Decision:** Android-first device-local scheduling for routine notifications, with FCM only for server-originated events.
**Rejected Alternatives:**
- Database webhooks (Rejected — ADR-019): Overkill for scheduling routine reminders.
**Consequences:** Use native Android scheduling: AlarmManager.setExactAndAllowWhileIdle() for precise timing (morning priority, evening sync). WorkManager.PeriodicWorkRequest for deferrable tasks (hourly Life Pulse). FCM reserved for genuinely server-originated events (achievement unlocked via API, remote data changes).
**Implementation Constraints:** Do not build a large server-side notification system merely for local reminders. Use exact alarms only where genuinely justified (user-critical time-bound events).

### ADR-020: Report Generation Architecture
**Status:** Promoted to Canonical [`ADR-020`](../decisions/ARCHITECTURE_DECISIONS.md#adr-020-report-generation-architecture)
**Context:** Reports need generation and export.
**Decision:** Reports are deterministic and computed on demand, client-side initially.
**Rejected Alternatives:**
- Server-side (Rejected — ADR-020): Adds infrastructure cost without clear need for a single-user system.
- Hybrid (Rejected — ADR-020): Over-complex for initial delivery.
**Consequences:** Use existing canonical data/views and a deterministic report calculation layer. Client handles rendering/export. Export formats: PDF, Markdown, HTML, JSON, CSV.
**Implementation Constraints:** Server-side report generation may be introduced later only if real requirements justify it (e.g., scheduled report delivery via email/notification).

### ADR-021: Chart/Visualization Library
**Status:** Promoted to Canonical [`ADR-021`](../decisions/ARCHITECTURE_DECISIONS.md#adr-021-chartvisualization-library)
**Context:** Reports and Data Lab need charting.
**Decision:** Recharts for complex analytical charts, lazy-loaded only.
**Rejected Alternatives:**
- Chart.js (Rejected — ADR-021): Imperative API, poor React integration, heavier.
- Visx (Rejected — ADR-021): Low-level, more code to write, steeper learning curve.
- Custom SVG (Rejected — ADR-021): Appropriate for sparklines (already used), but impractical for bar/line/area charts.
**Consequences:** Recharts MUST be dynamically imported (React.lazy) only on routes that need charts (Data Lab, reports). Never in main bundle. Main bundle already at 500kB limit.
**Implementation Constraints:** Use lightweight CSS/SVG/progress/sparkline representations for simple metrics. Reserve Recharts for complex analytical visualizations only.

### ADR-022: Life Pulse Data Model
**Status:** Promoted to Canonical [`ADR-022`](../decisions/ARCHITECTURE_DECISIONS.md#adr-022-life-pulse-data-model-pulse_logs) (Reconciled with migration `202609120000_winter_arc_remediation.sql`)
**Context:** Periodic check-ins need storage.
**Decision:** Dedicated `public.pulse_logs` table.
**Rejected Alternatives:**
- Events table (Rejected — ADR-022): `events.domain` CHECK constraint would need modification. Hourly volume (12-16 events/day) would add significant noise. Events serve telemetry, Pulse serves domain data.
- system_event_queue (Rejected — ADR-022): Transient storage, inappropriate for persistent domain data.
**Consequences:** `pulse_logs` table is the source of truth. Canonical telemetry `pulse.checkin.logged` may additionally be emitted. Supports hourly and configurable check-in cadences.
**Implementation Constraints:** Actual migrated schema (`202609120000_winter_arc_remediation.sql`): `(id, user_id, timestamp timestamptz, value text, metadata jsonb, created_at)`. Standard RLS enabled.

### ADR-026: Seasons & Achievements Admin Control Layer (formerly proposed as ADR-023)
**Status:** Promoted to Canonical [`ADR-026`](../decisions/ARCHITECTURE_DECISIONS.md#adr-026-seasons-achievements-admin-control-layer) (Renumbered to resolve duplicate ID collision with canonical ADR-023 Kinetic Astrolabe Orb Navigation)
**Context:** The Seasons and Achievements systems require robust management without direct database modification or application source code changes.
**Decision:** Implement a lightweight, authenticated admin/control layer (`/admin`) for managing seasons and achievements with canonical JSON schema import/export capabilities.
**Consequences:** 
- The admin layer supports creating, editing, activating, archiving, and managing seasons and achievements natively through an authenticated UI.
- Application source code does not need to be touched to create or modify a season.
- A validated canonical JSON import/export format (`SeasonConfigurationPayload` and `AchievementCatalogPayload`) is provided so future agents or authorized automation can provision configuration through a controlled interface/API.
- `seed.sql` only provides initial development/demo data and is not the long-term source of truth.
**Canonical JSON Schema Contract:**
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

### ADR-027: Recovery OS — Sanctuary & Grief Protocol Architecture (formerly proposed as ADR-024)
**Status:** Promoted to Canonical [`ADR-027`](../decisions/ARCHITECTURE_DECISIONS.md#adr-027-recovery-os-sanctuary-grief-processing-spoons-engine) (Renumbered to resolve duplicate ID collision with canonical ADR-024 Chronos Time OS)
**Context:** During periods of deep bereavement, traumatic loss, emotional grief, or severe physical/mental exhaustion, standard productivity expectations ("Crush your goals", "Streak counters", "Momentum scores") become adversarial and actively harmful. The user needs a dedicated sanctuary mode to safely hold grief, process loss, and honor low emotional bandwidth without guilt or failure metrics.
**Decision:** Introduce **Recovery OS** as a first-class operational sanctuary state and dedicated route (`/recovery` or integrated `/mind-os/recovery`).
**Core Pillars:**
1. **Radical Downscaling (The Spoons Engine):** Daily task lists are replaced with an ultra-minimal "Energy & Spoons" allocation (Rest, Nourishment, Hydration, 1 gentle somatic movement).
2. **Grief & Unburdening Journal:** Dedicated reflection modes with compassionate prompts ("What feels heavy today?", "What memory wants space?", "Permission to do nothing") that never calculate "productivity scores" or demand action items.
3. **Streak Preservation / Hibernation:** All habit streaks, Arc countdowns, and performance targets enter "Protected Hibernation" — they do not break, decay, or trigger failure notifications.
4. **Living Emblem State (`recovering`):** The Avatar transitions to a quiet, breathing amber orbit with reduced visual velocity, reflecting the `.theme-recovery` color palette (sage/sepia low-contrast OKLCH tokens).
5. **Zero Threat / Zero Pressure Vocabulary:** Complete eradication of critical alarms, red badges, or urgency-driving banners.

### ADR-028: Learning OS — AI Curriculum & Study Plan JSON Ingestion Protocol (formerly proposed as ADR-025)
**Status:** Promoted to Canonical [`ADR-028`](../decisions/ARCHITECTURE_DECISIONS.md#adr-028-learning-os-ai-curriculum-study-plan-json-ingestion-protocol) (Renumbered to resolve duplicate ID collision with canonical ADR-025 Fitness OS Kinetic Ledger)
**Context:** Creating extensive multi-stage learning roadmaps manually is high-friction. Users frequently leverage external LLMs (Claude, ChatGPT, Gemini) or future AI agents to formulate structured learning trajectories for complex domains (e.g., Systems Programming, Machine Learning, Clinical Neuroscience).
**Decision:** Implement a validated AI Curriculum Importer modal inside Learning OS (`/learning-os`) supporting direct copy-pasting of AI-generated JSON or API payload ingestion.
**Consequences:**
- The importer accepts a standard canonical JSON curriculum structure and performs schema validation (via client validator / Zod / schema checks).
- Provides an interactive preview showing Roadmap title, stages, session count, estimated hours, and project milestones before database commit.
- Atomic batch persistence: Single-transaction persistence into Supabase tables `learning_roadmaps`, `learning_stages`, `learning_sessions`, `learning_milestones`, and `learning_projects`.
**Canonical Curriculum JSON Schema Contract:**
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

## DECISIONS NOT REQUIRING ADRs:
These are straightforward enough that existing patterns apply:

> [!NOTE]
> **Historical correction:** Several items below were later formalized as ADRs:
> Fitness OS → ADR-025, Avatar state → ADR-013, Recovery OS → ADR-027,
> Learning OS modal → ADR-028.

- Theme storage: localStorage (no ADR needed)
- Periodic thought content: TypeScript constants (no ADR needed)
- Time-of-day detection: Client-side IST calculation (existing pattern)
- Fitness OS cleanup: UI-only refactoring (no ADR needed)
- Learning OS modal creation: Follow existing CRUD patterns (no ADR needed)
- Avatar state: Single-row table or jsonb. No separate cosmetics table.
- Home vs Profile: Mission Control evolves to Home (/). Profile is new (/profile).
- Recovery OS toggle: Global state switch in Brain Engine / user profile.
- Curriculum AI prompt templates: Stored in `/docs` and in-app copyable helper.

Cross-link to:
- [../decisions/ARCHITECTURE_DECISIONS.md](../decisions/ARCHITECTURE_DECISIONS.md) (Canonical ADR-001 through ADR-028)
- [WINTER_ARC_MASTER_PLAN.md](./WINTER_ARC_MASTER_PLAN.md)
- [WINTER_ARC_ARCHITECTURE.md](./WINTER_ARC_ARCHITECTURE.md)
- [WINTER_ARC_DATA_MODEL.md](./WINTER_ARC_DATA_MODEL.md)
