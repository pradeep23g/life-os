# LIFE OS — ARCHITECTURE DECISIONS (ADR)

**Status:** Authoritative Architectural Decision Log  
**Last Synchronized:** September 2026 (Phase 1 Baseline)

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
