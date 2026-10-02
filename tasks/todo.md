# Tasks: Arc Engine Implementation

### Phase 1: Foundation & Telemetry Engine

### Task 1: Supabase Migration for `life_seasons` Lifecycle
**Description:** Evolve the `life_seasons` database table to support the full Arc lifecycle state machine (`draft`, `active`, `completed`, `archived`), audit trails for amendments, manual milestone progress, early completion, and retrospectives. Enforce single-active season per user.
**Acceptance criteria:**
- [x] Add columns: `status text NOT NULL DEFAULT 'draft'`, `original_config jsonb`, `amendments jsonb DEFAULT '[]'::jsonb`, `milestone_progress jsonb DEFAULT '{}'::jsonb`, `retrospective jsonb`, `completed_at timestamptz`, `archived_at timestamptz`.
- [x] Create partial unique index `idx_life_seasons_single_active` on `(user_id) WHERE status = 'active'`.
- [x] Add check constraint `chk_life_seasons_status` checking status is one of `'draft'`, `'active'`, `'completed'`, `'archived'`.
- [x] Backfill migration migrates existing `vows` data into `original_config` and marks the current Winter Arc row as `status = 'active'`.
**Verification:**
- [x] Migration applies cleanly: Run through Supabase CLI or SQL runner
- [x] Constraint checks prevent two rows from having `status = 'active'` for same user
**Dependencies:** None
**Files likely touched:**
- `supabase/migrations/202610010000_arc_engine_lifecycle_schema.sql`
**Estimated scope:** S (1 file)

---

### Task 2: Canonical Arc Types, Constants, and Zod Schema Contract
**Description:** Create authoritative TypeScript type definitions, constants for curated palettes and icons, and a comprehensive Zod validation schema representing `ArcConfig`, telemetry bindings, focus domains, phases, and amendments.
**Acceptance criteria:**
- [x] Create `src/features/arc/constants.ts` defining:
  - Fixed 8-icon enum: `['snowflake', 'sprout', 'sun', 'leaf', 'mountain', 'flame', 'wave', 'star'] as const`
  - Curated 12-color hex palette: `['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#6366f1', '#0ea5e9', '#84cc16', '#f97316', '#14b8a6', '#71717a', '#94a3b8'] as const`
  - System default pace thresholds: `PACE_THRESHOLDS = { ON_TRACK: 0.85, AT_RISK: 0.60 }`
- [x] Define `ArcConfig`, `ArcFocusDomain`, `ArcPhase`, `ArcMilestone`, `ArcAmendment`, `MilestoneProgressMap`, `ArcRetrospective`, `ArcRuntimeState`, `ArcMilestoneState` in `src/features/arc/types.ts`.
- [x] Update `src/lib/schemas/seasonConfigSchema.ts` with Zod validation for `ArcConfig`:
  - Validates `focusDomains` with `id`, `name`, and optional telemetry `binding` (`source` and `metric`)
  - Validates `icon` strictly against the fixed 8-icon enum
  - Validates `accentColor` strictly against the curated 12-color palette
  - Validates milestone bindings against the 14 registered telemetry bindings
  - Validates phase startDay/endDay tiling full duration without gaps or overlaps
- [x] Export helper `parseAndValidateArcConfig(jsonString)` returning `{ success: true, data }` or `{ success: false, errors }`.
**Verification:**
- [x] Build succeeds: `npx tsc --noEmit`
- [x] Schema validates canonical Winter Arc config JSON successfully, and rejects unauthorized icons or arbitrary hex colors
**Dependencies:** Task 1
**Files likely touched:**
- `src/features/arc/constants.ts`
- `src/features/arc/types.ts`
- `src/lib/schemas/seasonConfigSchema.ts`
**Estimated scope:** S (3 files)

---

### Task 3: Telemetry Registry & Deterministic Strict Linear Pace Engine
**Description:** Implement the deterministic milestone evaluation algorithm and telemetry registry that aggregates `data_lab_daily_activity_90d` metrics and computes strict linear pace ratios, statuses, and recovery rates.
**Acceptance criteria:**
- [x] Create `src/features/arc/utils/telemetryRegistry.ts` mapping 14 binding keys to `data_lab_daily_activity_90d` columns (`deep_work.*`, `focus.*`, `tasks.*`, `habits.*`, `fitness.*`, `journal.*`, `learning.*`, `active_days.*`).
- [x] Create `src/features/arc/utils/paceEvaluator.ts` computing strict linear expected progress:
  - `expectedProgress = (elapsedDays / totalDays) * targetValue`
  - Guard: If arc has completed (either at planned end date or via early completion where `completed_at` is set), freeze evaluation and use actual elapsed days up to `completed_at` with `remainingDays = 0`.
  - Guard: If `elapsedDays <= 0`, return `'pending'` status without division by zero.
- [x] Implement status thresholds: `>= targetValue` → `'complete'`, `>= 0.85` → `'on_track'`, `>= 0.60` → `'at_risk'`, `< 0.60` → `'behind'`.
- [x] Compute required daily recovery rate: `(targetValue - actualProgress) / remainingDays` (or `0` when remainingDays is 0).
- [x] Compute `overallHealth` as worst status across all milestones (`complete > on_track > at_risk > behind`).
- [x] Write comprehensive unit tests in `src/features/arc/utils/paceEvaluator.test.ts`.
**Verification:**
- [x] Tests pass: `npm test -- paceEvaluator.test.ts`
- [x] Edge cases tested: Day 0 (upcoming), Day 1, early completion, behind pace recovery calculation, division by zero guards
**Dependencies:** Task 2
**Files likely touched:**
- `src/features/arc/utils/telemetryRegistry.ts`
- `src/features/arc/utils/paceEvaluator.ts`
- `src/features/arc/utils/paceEvaluator.test.ts`
**Estimated scope:** M (3 files)

---

### Checkpoint: Foundation & Deterministic Pacing Engine
- [x] Database migration file ready and schema verified
- [x] TypeScript types, constants, and Zod schemas compile without error
- [x] Strict linear pace evaluation unit tests pass 100%

---

## Phase 2: Runtime Hook & UI Decoupling

### Task 4: Runtime Hook Evolution (`useArcTelemetry`)
**Description:** Upgrade `useArcTelemetry.ts` to query active season from `life_seasons` by `status = 'active'`, evaluate all dynamic milestones using `telemetryRegistry` and `paceEvaluator`, handle early-completion telemetry date bounding, parse `focusDomains`, and provide manual milestone completion mutation.
**Acceptance criteria:**
- [x] Remove `DEFAULT_SEASON` fallback; return `null` for `config` when no active season exists.
- [x] Query telemetry scoped from `start_date` through `completed_at ?? today` (respecting early completion bounds).
- [x] Parse `focusDomains[]` and make them available in the hook return state.
- [x] Support both `telemetry` and `manual` milestones from `config.milestones[]`.
- [x] Expose `toggleManualMilestone(milestoneId, notes)` mutation that persists completion to `life_seasons.milestone_progress`.
- [x] Compute overall Arc execution health (`worst` status across all milestones).
**Verification:**
- [x] Hook returns clean data structure with active season from Supabase
- [x] Manual milestone toggle updates Supabase and reactively updates state
**Dependencies:** Task 3
**Files likely touched:**
- `src/features/arc/hooks/useArcTelemetry.ts`
**Estimated scope:** S (1 file)

---

### Task 5: Decouple Arc UI Components, Shell Title, Brand Lockup, and Focus Domains
**Description:** Eliminate all hardcoded "Winter Arc 2026", "90-DAY", "13-Week", and `WinterArcIcon` assumptions from arc presentation components, application shell title, module color mappings, and the brand lockup. Explicitly render hybrid Focus Domains.
**Acceptance criteria:**
- [x] `ChapterHero.tsx`: Read dynamic `config.title`, dynamic duration (`{config.totalDays}-DAY`), dynamic icon lookup from `config.icon`, and custom accent color styling.
- [x] Focus Domains rendering: Render `config.focusDomains[]` as thematic identity pills with bound telemetry metrics on the Arc page.
- [x] `ArcCountdownLedger.tsx`: Display dynamic `progress.totalDays` and `progress.daysRemaining` without static "90-DAY" text.
- [x] `EpochHorizonRail.tsx`: Decouple phase labels; render from `config.phases` when present or derived checkpoints.
- [x] `CheckpointLedger.tsx`: Update checkpoint phase grouping to support variable duration arcs (7 to 365 days).
- [x] `src/layout/shellTitle.ts`: Decouple `/arc` route title to read active arc name or fallback to "Arc" (remove hardcoded "Winter Arc").
- [x] `src/lib/useModuleColors.ts`: Update default key to `'Arc'` and support dynamic active arc accent color.
- [x] `src/components/icons/ModuleIcons.tsx`: In `LifeOsBrandLockup`, render dynamic seasonal label or "Life OS Arc" instead of static "Winter Arc 2026".
**Verification:**
- [x] Arc page displays correct title, icon, focus domains, and day counts for arbitrary seasons
- [x] Shell title and brand lockup dynamically reflect active season name
- [x] No residual "Winter Arc" or "90-DAY" hardcoded strings in arc components
**Dependencies:** Task 4
**Files likely touched:**
- `src/features/arc/components/ChapterHero.tsx`
- `src/features/arc/components/ArcCountdownLedger.tsx`
- `src/features/arc/components/EpochHorizonRail.tsx`
- `src/features/arc/components/CheckpointLedger.tsx`
- `src/features/arc/components/FocusDomainsSection.tsx`
- `src/layout/shellTitle.ts`
- `src/lib/useModuleColors.ts`
- `src/components/icons/ModuleIcons.tsx`
**Estimated scope:** M (8 files)

---

### Task 6: Dynamic Milestone Ledger with Pace Badges & Manual Completion
**Description:** Upgrade `SeasonalMilestones.tsx` to display variable counts (0–N) of telemetry and manual milestones, strict pace badges, recovery rates, and interactive manual checkboxes.
**Acceptance criteria:**
- [x] Support variable milestone count (0-N) with adaptive responsive layout.
- [x] Display strict pace badge (`ON TRACK`, `AT RISK`, `BEHIND`, `COMPLETE`) with color-coded styling.
- [x] Display daily recovery rate callout when behind or at risk (e.g., `+1.8 hrs/day needed to recover`).
- [x] Add interactive toggle button for manual milestones allowing user to mark complete with optional note.
**Verification:**
- [x] Telemetry milestones show live values from `data_lab_daily_activity_90d`
- [x] Toggling a manual milestone updates UI immediately and updates DB
- [x] Pacing accurately reflects expected vs actual progress
**Dependencies:** Task 4, Task 5
**Files likely touched:**
- `src/features/arc/components/SeasonalMilestones.tsx`
**Estimated scope:** S (1 file)

---

### Checkpoint 2: Live Arc Telemetry & Decoupled Surface
- [x] Active arc renders fully from Supabase database with custom focus domains
- [x] Milestones show real progress, strict pace indicators, and recovery math
- [x] Manual milestones can be checked off interactively
- [x] Shell title, brand lockup, and module colors reflect active arc name

---

## Phase 3: Zero-Overhead Authoring & Ingestion Protocol

### Task 7: LLM Interrogation Prompt Template & Canonical Exporter
**Description:** Construct the canonical prompt template that users copy into Claude or ChatGPT to undergo structured interrogation and generate valid `ArcConfig` JSON.
**Acceptance criteria:**
- [x] Create `src/features/arc/prompts/arcPromptTemplate.ts` defining `ARC_PROMPT_TEMPLATE`.
- [x] Include persona directive ("Principal Life Strategist & Seasonal Campaign Architect").
- [x] Include step-by-step interrogation rules (grill user on seasonal theme, non-negotiables, focus domains with telemetry, milestone targets, phases).
- [x] Include exact JSON Schema contract enforcing allowed telemetry binding keys, the 8-icon enum, and the 12-color curated palette.
**Verification:**
- [x] Prompt text is clean, formatted, and contains copyable instructions
**Dependencies:** Task 2
**Files likely touched:**
- `src/features/arc/prompts/arcPromptTemplate.ts`
**Estimated scope:** XS (1 file)

---

### Task 8: Zero-Overhead Ingestion Modal (`CreateArcModal`)
**Description:** Implement `CreateArcModal.tsx` modeled after `ImportCurriculumModal` with 1-click prompt template copy, JSON textarea, real-time Zod schema validation, visual preview cards, and activation.
**Acceptance criteria:**
- [x] Modal header with title and "Copy Interrogation Prompt" button.
- [x] JSON input textarea with error banners displaying specific Zod validation errors.
- [x] Visual preview card rendering: Arc title, tagline, accent color swatch, icon, vow, principles list, focus domains, milestones table, and phase timeline.
- [x] "Activate Arc" button: Inserts into `life_seasons` with `status = 'active'`, copies config to `original_config`, invalidates queries, and closes modal.
**Verification:**
- [x] Clicking copy copies prompt template to clipboard
- [x] Pasting valid JSON displays rich preview
- [x] Submitting creates active season in Supabase
**Dependencies:** Task 2, Task 7
**Files likely touched:**
- `src/features/arc/components/CreateArcModal.tsx`
**Estimated scope:** S (1 file)

---

### Task 9: Empty/Archive State, Early Completion Action, & Mandatory Amendment Auditing
**Description:** Update `ArcPage.tsx` to handle the idle state (no active arc) with an editorial empty state / archive list, add early completion action, and enforce mandatory justification strings for amendments.
**Acceptance criteria:**
- [x] When `config` is `null`: render historical arc archive list and prominent "Initiate New Arc" hero button triggering `CreateArcModal`.
- [x] When `config` is active: render top utility bar with "Amend Commitments" and "Conclude Arc" (Early Completion).
- [x] Early completion flow: Clicking "Conclude Arc" before planned end date prompts confirmation, transitions `status = 'completed'`, records both `planned_end_date` and `completed_at = now()`, and freezes telemetry evaluation.
- [x] Implement `AmendArcModal.tsx` to modify active commitments:
  - **Reason is strictly required**: Submit button disabled if `reason` string is empty or whitespace-only.
  - Appends `{ timestamp, field, previousValue, newValue, reason }` to `life_seasons.amendments`.
**Verification:**
- [x] Idle state displays archive view with working creation trigger
- [x] Concluding arc early freezes telemetry and records `completed_at`
- [x] Amendment modal requires non-empty reason and appends to audit trail
**Dependencies:** Task 8
**Files likely touched:**
- `src/features/arc/pages/ArcPage.tsx`
- `src/features/arc/components/AmendArcModal.tsx`
- `src/features/arc/components/ArcArchiveView.tsx`
**Estimated scope:** M (3 files)

---

### Checkpoint 3: End-to-End Creation & Editing Verified
- [x] Can create, preview, and activate a new season without touching Admin JSON
- [x] Early completion captures both planned end date and actual completion timestamp
- [x] Amendments to active arcs strictly require and persist audit justifications

---

## Phase 4: Ambient Penetration & Completion Retrospective

### Task 10: Ambient Navigation Integration in Astrolabe Orb
**Description:** Connect `AstrolabeOrbNav.tsx` to active Arc telemetry so the navigation orb dynamically displays the active seasonal name, icon from the 8-icon set, and execution health glow.
**Acceptance criteria:**
- [x] Query active arc state inside or alongside `AstrolabeOrbNav`.
- [x] Dynamically replace "Winter Arc" navigation item with active arc title (e.g. "Spring Build"), dynamic icon from the 8-icon set, and accent color.
- [x] When an arc is active, display an ambient status indicator dot or border glow reflecting overall health (`on_track` = emerald/cyan, `at_risk` = amber, `behind` = rose).
- [x] Fallback to "Seasonal Arc" with neutral styling when no arc is active.
**Verification:**
- [x] Astrolabe Orb reflects active arc title, icon, and ambient health glow
- [x] Navigating to `/arc` works seamlessly
**Dependencies:** Task 4, Task 5
**Files likely touched:**
- `src/layout/AstrolabeOrbNav.tsx`
**Estimated scope:** S (1 file)

---

### Task 11: Ambient Horizon Bar Integration on HomePage
**Description:** Integrate the active Arc's status directly into `AmbientHorizonBar.tsx` on the Home screen to ensure daily ambient awareness.
**Acceptance criteria:**
- [x] Update `useHomeTelemetry.ts` to include active arc summary (`arcTitle`, `currentDay`, `totalDays`, `overallHealth`).
- [x] In `AmbientHorizonBar.tsx`, add an active seasonal datum: `[ARC] {TITLE} · DAY {X}/{Y} · {HEALTH}` linking to `/arc`.
- [x] Gracefully hide or show neutral placeholder when no arc is active.
**Verification:**
- [x] Home page footer displays active Arc information and status badge
- [x] Clicking datum routes to `/arc`
**Dependencies:** Task 4, Task 10
**Files likely touched:**
- `src/features/home/components/AmbientHorizonBar.tsx`
- `src/features/home/hooks/useHomeTelemetry.ts`
**Estimated scope:** S (2 files)

---

### Task 12: Arc Completion & Retrospective Modal (Two-Stage Lifecycle)
**Description:** Implement the two-stage completion state machine separating milestone freezing (`COMPLETED`) from structured retrospective archival (`ARCHIVED`).
**Acceptance criteria:**
- [x] **Stage 1 (`ACTIVE → COMPLETED`)**:
  - Triggered when scheduled duration reaches end date OR user intentionally completes early.
  - Updates `life_seasons` setting `status = 'completed'`, `completed_at = now()`.
  - Freezes milestone evaluations and telemetry query bounds.
  - Does NOT require immediate retrospective; Arc page displays completed campaign banner with an "Author Retrospective" callout.
- [x] **Stage 2 (`COMPLETED → ARCHIVED`)**:
  - `ArcRetrospectiveModal.tsx` provides 5 structured questions: What went well? What didn't? What changed? What did you learn? What carries forward?
  - All 5 questions must have responses before submission.
  - On submit: updates `life_seasons` setting `status = 'archived'`, `archived_at = now()`, `retrospective = {...}`.
  - Historical campaign is now completely immutable; user is returned to the Arc Archive view.
**Verification:**
- [x] Completing arc transitions to `completed` and freezes milestones without requiring retrospective
- [x] Submitting retrospective transitions to `archived` and preserves complete historical record
**Dependencies:** Task 9
**Files likely touched:**
- `src/features/arc/components/ArcRetrospectiveModal.tsx`
- `src/features/arc/pages/ArcPage.tsx`
**Estimated scope:** S (2 files)

---

### Checkpoint 4: Complete System Polish & Cross-OS Harmony
- [x] All 12 tasks implemented and verified
- [x] Application builds without any TypeScript or lint errors (`npx tsc --noEmit`)
- [x] Full arc lifecycle operates smoothly through all 4 states (`DRAFT → ACTIVE → COMPLETED → ARCHIVED`)
