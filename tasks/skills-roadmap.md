# Life OS — Technical Skills & Architecture Roadmap

> **Domain:** Engineering Excellence & Long-Term System Evolution  
> **Target Repository:** `pradeep23g/life-os`  
> **Source:** Synthesized from Deep Skills Research & Architectural Audits

---

## Overview

Life OS is a multi-domain behavioral operating system designed to accumulate years of longitudinal life data with zero cognitive distortion. To scale the system across its 14 domains, hosted PostgreSQL 15+ backend, future Android native companion (Wave 2), and external agent MCP gateway (Wave 8), this roadmap records concrete technical skills, architecture patterns, and engineering tasks categorized by priority.

---

## Track 1: UI & Frontend Craft (React 19 + Vite SPA)
**Priority: CRITICAL** | **Focus:** Runtime fluidity, tactile feedback, and background execution resilience

- [x] **Vite Bundle Optimization & Vendor Chunk Splitting**
  - Configured Rollup `manualChunks` in `vite.config.ts` separating React, Supabase, TanStack Query, and UI utilities.
  - Eliminated >500 kB chunk warnings; build time accelerated from 30.1s to 3.9s.
- [x] **Modern Browserslist Baseline Synchronization**
  - Upgraded `caniuse-lite` database via `update-browserslist-db` to eliminate stale browser metadata warnings.
- [x] **Granular Domain Suspense Boundaries**
  - Isolated `<Suspense>` boundaries per domain layout (`MindOsLayout`, `ProductivityHubLayout`, `FitnessOsLayout`, `LearningOSLayout`) with tailored `<LoadingView variant="page">` fallbacks.
  - Sub-route transitions no longer tear down orbital navigation or the root application shell.
- [x] **Instant Zero-Latency Logging via Optimistic Updates**
  - Verified and leveraged TanStack React Query `onMutate` cache updates in `useHabits.ts` (`useMarkHabitDone`, `useAdjustHabitCount`) and `useTasks.ts` (`useToggleTaskCompletion`) with automatic rollback on error.
- [x] **Document Picture-in-Picture (PiP) Hardening**
  - Upgraded `PiPTimer.tsx` and `useDocumentPiP.ts` to run an independent wall-clock ticker anchored directly to `pipWindow` context to prevent background tab throttling.
  - Added dynamic stylesheet mirroring via `MutationObserver` on `document.head` and theme mirroring on `document.documentElement.className`.
- [x] **OKLCH Solar Theme Dynamic Hue Rotation & True-Black Calibration**
  - Exposed master `--brand-h` CSS variable in `src/index.css` for dynamic solar hue shift.
  - Calibrated true OLED black (`0% 0 0`) canvas with anti-smear elevated surfaces (`12%` / `16%`) in `.theme-midnight` to prevent OLED pixel smearing during kinetic scroll.
- [x] **Physics-Based Kinetic Navigation with Motion (`motion/react`)**
  - Codified under ADR-030 with spring dynamics (`stiffness: 280, damping: 22, mass: 0.8`).
  - Decoupled DOM layers in `AstrolabeOrbNav.tsx` (outer `<motion.div>` for radial spring translation, inner `<div>` for organic float drift, `<AnimatePresence>` for satellite child bloom).
  - Allocated Motion runtime to isolated `'vendor-motion'` manual chunk in `vite.config.ts`.

---

## Track 2: SQL & Supabase Performance
**Priority: CRITICAL** | **Focus:** Sub-millisecond database queries, RLS tenant isolation, and view aggregations

- [x] **RLS Policy InitPlan Subquery Optimization (`(SELECT auth.uid())`)**
  - Scope: Rewrote all 99 remaining RLS policies across 26 tables (`habits`, `habit_logs`, `habit_streak_breaks`, `habit_streak_heals`, `journal_entries`, `tasks`, `goals`, `weekly_plans`, `weekly_plan_items`, `weekly_reviews`, `learning_*`, `fitness_exercises`, `workouts`, `exercise_logs`, `time_logs`, `transactions`, `events`, `system_event_queue`, `system_metrics`, `progress_hub_archive`) in `supabase/migrations/202611250000_track2_rls_index_view_optimization.sql` to use `((SELECT auth.uid()) = user_id)`, achieving 100% InitPlan parity across all 33 base tables.
- [x] **RLS Foreign Key & Tenant Index Audit**
  - Audited all 33 tables and 22 `public.*` foreign keys via `pg_indexes` and `pg_constraint` on local PostgreSQL 17.
  - Confirmed all 22 `public.*` FK columns already had leading un-predicated B-tree indexes, and added missing un-predicated leading `user_id` indexes on `exercise_logs` (`idx_exercise_logs_user_id`), `experiments` (`idx_experiments_user_id`), `knowledge_resources` (`idx_knowledge_resources_user_id`), `pulse_logs` (`idx_pulse_logs_user_timestamp`), plus `idx_learning_session_logs_user_logged_at_active` for bounded study log range scans.
- [x] **Materialized Views for 90-Day Longitudinal Aggregations**
  - Evaluated `EXPLAIN (ANALYZE, BUFFERS)` on `data_lab_daily_activity_90d` and `current_day_snapshot_history_14d` under synthetic 3-year (~100k rows) and 10-year (~350k rows) multi-user datasets.
  - Eliminated 7x/8x redundant view scans in `data_lab_module_consistency_30d` / `data_lab_weekly_system_score_12w`, unified `events` scans, and added `(SELECT auth.uid())` + IST `timestamptz` / `date` window bounds to all CTEs. Execution dropped to ~1.2–4.4 ms (`current_day_snapshot_history_14d`) and ~3.5 ms at 10-year scale (`data_lab_daily_activity_90d`, 119 buffers vs 2,651 baseline buffers), keeping `security_invoker = true` live views fast without introducing stale materialized views or `pg_cron` dependencies.
- [x] **Role Scoping (`TO authenticated`) on Legacy Policies**
  - Replaced legacy `{public}` role scoping on `habits`, `habit_logs`, `habit_streak_breaks`, `habit_streak_heals`, and `journal_entries` (`UPDATE`/`DELETE`) with explicit `TO authenticated`. Verified `0` policies in `pg_policies` lack `TO authenticated` or `(SELECT auth.uid())`.

---

## Track 3: Clean Engineering & Architecture
**Priority: CRITICAL** | **Focus:** Domain isolation, cognitive boundaries, and preventing codebase entropy

- [x] **Feature-Sliced Design (FSD) Layering Enforcement**
  - Enforced downward dependency boundaries (`lib`, `store`, `types`, `hooks`, `components` cannot import `features` or `layout`) and barrel-only cross-feature imports in `eslint.config.js` via `no-restricted-imports`, preserving the `src/features/<domain>/` topology that maps 1:1 to Android `:feature:*` / `:core:*` modules.
  - Added explicit Cognitive Boundary ESLint rules preventing horizontal cross-imports between `features/mind-os` and `features/productivity-hub` (Invariant 1), and moved `CommandPalette.tsx` from `src/components/` to `src/layout/`.
- [x] **Public API Barrel Contracts (`index.ts`)**
  - Added `index.ts` barrels for `admin`, `home`, `profile`, and `reports` (all 15 feature directories now expose public `index.ts` contracts) and migrated cross-feature and `layout/` imports to domain barrels.
- [x] **Discriminated Unions for Complex UI States**
  - Standardized `AsyncState<T>` discriminated union and `toAsyncState()` query adapter in `src/types/asyncState.ts` (`idle | loading | success | error`).
- [x] **Rich Domain Logic as Pure Functions**
  - Audited `analyzeMomentum.ts`, `paceEvaluator.ts`, and `amendmentAuditor.ts` as strictly framework-agnostic pure functions (zero React/Supabase/side-effect imports) and hardened under strict TypeScript indexing rules.
- [x] **Strict Compiler Hardening in `tsconfig.json`**
  - Enabled `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` in `tsconfig.app.json` and resolved all 94 resulting compiler diagnostics cleanly.

---

## Track 4: TypeScript 5.9 Advanced Patterns
**Priority: HIGH** | **Focus:** Zero-cost type-level verification and contract enforcement

- [x] **Template Literal Types for Canonical Event Taxonomy**
  - Refactored `src/lib/eventTaxonomy.ts` with `EventDomain` and `EventKey<D extends EventDomain, A extends string> = \`\${D}.\${A}\`` validated via `as const satisfies Record<string, EventKey<EventDomain, string>>`.
- [x] **Branded ID Types for Entity Keys**
  - Introduced `src/types/branded.ts` (`Brand<T, B>`, `HabitId`, `HabitLogId`, `HabitBreakId`, `TaskId`, `TimeLogId`, `TransactionId`, `UserId`, etc. with boundary constructors) and wired across `useHabits.ts`, `useTasks.ts`, `useTimeLogs.ts`, `useFinance.ts`, and UI callers.
- [x] **`satisfies` Operator for Route, Shell, and Color Configurations**
  - Applied `satisfies` across `DEFAULT_MODULE_COLORS` (`src/lib/useModuleColors.ts`), `EVENT_TYPES` (`src/lib/eventTaxonomy.ts`), and `ORBIT_1` / `ORBIT_2` (`src/layout/AstrolabeOrbNav.tsx`).
- [x] **Zod v4 Schema Optimization**
  - Preserved Zod v4 chainable schemas and added native `z.toJSONSchema()` exports (`getArcConfigJsonSchema()` in `src/lib/schemas/seasonConfigSchema.ts`, `getCurriculumJsonSchema()` in `src/lib/schemas/curriculumSchema.ts`).

---

## Track 5: Wave 8 — MCP (Model Context Protocol) Server
**Priority: MEDIUM** | **Focus:** Secure, authenticated external agent integration with longitudinal life data

- [ ] **Official TypeScript SDK Setup (`@modelcontextprotocol/sdk`)**
  - Scaffold standalone MCP server leveraging existing Zod contracts (`seasonConfigSchema.ts`, task schemas) as Standard Schema tool definitions.
- [ ] **OAuth 2.1 Resource Server Pattern with PKCE**
  - Implement token-gated endpoint verification using RFC 8707 Resource Indicators and JWT validation against Supabase Auth.
- [ ] **Fine-Grained Capability-Based Tool Scopes**
  - Gate MCP tool capabilities by domain permissions (e.g. `life-os:fitness:read`, `life-os:mind:journal:append`).
- [ ] **Untrusted Data Sanitization for LLM Ingestion**
  - Sanitize all returned PostgreSQL payloads before feeding into LLM tool call context to protect against indirect prompt injection.

---

## Track 6: Wave 2 — Native Android Companion (Kotlin + Compose)
**Priority: MEDIUM** | **Focus:** Real-world tactile companion, home screen widgets, and offline resilience

- [ ] **Multi-Module Gradle Architecture**
  - Structure into `:core:model`, `:core:database` (Room), `:core:network` (Supabase Kotlin SDK), `:data`, `:feature:*`, and `:widget`.
- [ ] **Room Database as Single Source of Truth (SSOT) with Outbox Sync**
  - Mirror web's `useEventBus.ts` peek-and-splice queue pattern in Android via an outbox SQLite table and Room `Flow` observers.
- [ ] **Jetpack Glance Home Screen Widgets**
  - Build actionable Glance widgets ("What Matters Now", active Arc countdown, rapid Life Pulse logger) reading directly from local Room database.
- [ ] **WorkManager Periodic Synchronization**
  - Implement 15-minute periodic network-constrained background sync via `WorkManager` updating widgets and flushing telemetry to Supabase.

---

## Track 7: Shared Cross-Platform API & Data Governance
**Priority: FUTURE** | **Focus:** Schema parity and real-time coordination across web, mobile, and agents

- [ ] **Database Constraints as Authoritative Arbiter**
  - Maintain PostgreSQL `CHECK` constraints, foreign keys, and RLS policies as the definitive rules of engagement, treating client-side Zod and Kotlin validation as UX accelerators.
- [ ] **Supabase Realtime for Cross-Device Synchronization**
  - Wire `postgres_changes` websocket channels to TanStack Query cache invalidation on web and Room invalidation on mobile for instantaneous multi-device updates.
- [ ] **Event Taxonomy Enforced at Schema Layer**
  - Evaluate creating an explicit PostgreSQL ENUM or check constraint for canonical event types to ensure both web and mobile clients adhere to identical telemetry grammar.
