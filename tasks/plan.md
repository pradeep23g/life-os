# Implementation Plan: Arc Engine & Ambient Telemetry Campaigns

## Overview
Transform Life OS's static, hardcoded "Winter Arc 2026" into the dynamic **Arc Engine** — a prescriptive temporal campaign system. The Arc Engine holds the user accountable against self-declared seasonal commitments through deterministic telemetry evaluation (strict linear pace against 14 registered telemetry bindings), features a zero-overhead AI authoring protocol modeled after Learning OS (`ImportCurriculumModal`), enforces strict lifecycle state transitions (`DRAFT → ACTIVE → COMPLETED → ARCHIVED`) with early-completion support and mandatory amendment auditing, renders hybrid focus domains, and radiates ambient execution health across the Astrolabe Navigation Orb, shell titles, and Home horizon bar.

## Architecture Decisions
- **Canonical Schema & Lifecycle State Machine**: Extend existing `life_seasons` table with `status`, `original_config`, `amendments`, `milestone_progress`, `retrospective`, `completed_at`, and `archived_at` columns. Enforce single active arc per user via PostgreSQL partial unique index `(user_id) WHERE status = 'active'`.
  - State machine: `DRAFT ──activate──▶ ACTIVE ──complete (early or scheduled)──▶ COMPLETED ──submit retrospective──▶ ARCHIVED`
  - Completing the arc freezes milestones and telemetry queries, capturing both `planned_end_date` (from config) and actual `completed_at`.
  - Archival is gated on submitting a 5-question structured retrospective.
- **Zero-Overhead AI Ingestion**: Replicate Learning OS's proven pattern (`ImportCurriculumModal`). The user copies a rich interrogation prompt template into ChatGPT/Claude, gets grilled on their goals, and pastes back generated JSON. Life OS performs client-side Zod validation with live visual preview cards before 1-click activation.
- **Constrained Aesthetics (Constants)**: Define `src/features/arc/constants.ts` with a curated palette of ~8–12 Life OS accent colors and a fixed enum of 8 canonical seasonal icons (`snowflake`, `sprout`, `sun`, `leaf`, `mountain`, `flame`, `wave`, `star`).
- **Deterministic Telemetry Registry & Strict Linear Pace**: Map 14 telemetry binding keys directly onto columns in the existing `data_lab_daily_activity_90d` view without new database tables or background daemons. Evaluate strict linear pace:
  $$\text{expectedProgress} = \left(\frac{\text{elapsedDays}}{\text{totalDays}}\right) \times \text{targetValue}$$
  $$\text{paceRatio} = \frac{\text{actualProgress}}{\text{expectedProgress}}$$
  Thresholds: $\ge \text{targetValue} \to \text{complete}$, $\ge 0.85 \to \text{on\_track}$, $\ge 0.60 \to \text{at\_risk}$, $< 0.60 \to \text{behind}$.
  Recovery rate: $\text{paceRequired} = \frac{\text{targetValue} - \text{actualProgress}}{\text{remainingDays}}$.
  Overall health is the worst status across all milestones.
- **Hybrid Focus Domains**: Arc configurations support `focusDomains[]` containing a human-readable theme (e.g. "Physical Endurance") with an optional binding to a telemetry source/metric. The Arc UI renders both qualitative domain badges and bound telemetry indicators.
- **Mandatory Amendment Auditing**: When modifying active arc commitments, a non-empty user justification string (`reason`) is strictly required. Changes are appended to `life_seasons.amendments` with `{ timestamp, field, previousValue, newValue, reason }`. Original configuration remains frozen in `original_config`.
- **System-Wide Ambient Penetration & Decoupling**: Fully decouple `shellTitle.ts`, `useModuleColors.ts`, `ModuleIcons.tsx` (`LifeOsBrandLockup`), and `AstrolabeOrbNav.tsx` from static "Winter Arc" strings. Project active arc title, icon, and dynamic execution health glow across the application shell and the `HomePage` `AmbientHorizonBar`.

---

## Task List

### Phase 1: Foundation & Telemetry Engine
- [x] **Task 1: Supabase Migration for `life_seasons` Lifecycle**
- [x] **Task 2: Canonical Arc Types, Constants, and Zod Schema Contract**
- [x] **Task 3: Telemetry Registry & Deterministic Strict Linear Pace Engine**

#### Checkpoint 1: Foundation & Deterministic Pacing Engine
- [x] Database migration applied without errors; single-active constraint verified
- [x] TypeScript types, constants, and Zod schemas compile cleanly with icon/color enums and focus domain validation
- [x] Unit tests for strict linear pace evaluation and telemetry bindings pass 100%

---

### Phase 2: Runtime Hook & UI Decoupling
- [x] **Task 4: Runtime Hook Evolution (`useArcTelemetry`)**
- [x] **Task 5: Decouple Arc UI Components, Shell Title, and Brand Lockup**
- [x] **Task 6: Dynamic Milestone Ledger with Pace Badges & Manual Completion**

#### Checkpoint 2: Live Arc Telemetry & Decoupled Surface
- [x] Arc page loads active season from database (or null state if none active)
- [x] Focus domains, chapter hero, countdown, and checkpoints adapt to arbitrary season data
- [x] Shell title, module colors, and brand lockup dynamically reflect active season name
- [x] Milestones render real telemetry values, strict pace badges, and recovery rates
- [x] Manual milestones toggle and persist to Supabase

---

### Phase 3: Zero-Overhead Authoring & Ingestion Protocol
- [x] **Task 7: LLM Interrogation Prompt Template & Canonical Exporter**
- [x] **Task 8: Zero-Overhead Ingestion Modal (`CreateArcModal`)**
- [x] **Task 9: Empty/Archive State, Early Completion, & Mandatory Amendment Auditing**

#### Checkpoint 3: End-to-End Creation & Editing Verified
- [x] User can copy interrogation prompt, paste JSON, and see live validation preview
- [x] 1-click activation saves draft as active campaign and freezes original config
- [x] Early completion can be triggered before planned end date, recording both dates
- [x] Active arc amendments strictly require a non-empty reason and append to the audit trail

---

### Phase 4: Ambient Penetration & Completion Retrospective
- [x] **Task 10: Ambient Navigation Integration in Astrolabe Orb**
- [x] **Task 11: Ambient Horizon Bar Integration on HomePage**
- [x] **Task 12: Arc Completion & Retrospective Modal (Two-Stage Lifecycle)**

#### Checkpoint 4: Complete System Polish & Cross-OS Harmony
- [x] Astrolabe Orb shows active arc title, icon, and dynamic health glow
- [x] Home page horizon bar displays ambient arc ticker with pace badge
- [x] Completing arc transitions to `COMPLETED` and freezes milestone telemetry
- [x] Submitting structured retrospective transitions to `ARCHIVED`
- [x] Build succeeds with zero TypeScript or lint errors

---

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Historical Winter Arc data in `vows` column broken by migration | High | Migration SQL extracts existing `vows` into new `original_config` and `status = 'active'`, preserving backward compatibility. |
| External LLM generates invalid JSON | Medium | Provide copyable prompt with exact TypeScript contract, example JSON, and real-time Zod error feedback directly in the UI. |
| Zero active seasons causes blank screen | High | Remove `DEFAULT_SEASON` fallback and build a dedicated Empty / Archive state with a prominent "Initiate New Arc" callout. |
| Division by zero in pacing when arc is on Day 0 or completed early | Low | Guard temporal calculations (`elapsedDays <= 0` returns "upcoming" status, `remainingDays <= 0` or completed status freezes pace evaluation). |

## Open Questions
- Should completed arcs be exportable as markdown field reports for external journaling or portfolio display?
- For multi-week phases, should weekly checkpoints auto-inherit phase descriptions if no checkpoint note is provided?
