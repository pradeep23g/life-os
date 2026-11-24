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
- [ ] **Physics-Based Kinetic Navigation with Motion (`motion/react`)**
  - Future exploration: Evaluate spring physics (`stiffness`, `damping`, `mass`) for Astrolabe Orb navigation shell following formal ADR evaluation.

---

## Track 2: SQL & Supabase Performance
**Priority: CRITICAL** | **Focus:** Sub-millisecond database queries, RLS tenant isolation, and view aggregations

- [ ] **RLS Policy InitPlan Subquery Optimization (`(SELECT auth.uid())`)**
  - Scope: Core tables (`habits`, `tasks`, `goals`, `time_logs`, `transactions`, `events`, etc.).
  - Problem: Calling `auth.uid() = user_id` directly causes PostgreSQL to re-evaluate the function per row on sequential scans.
  - Action: Author an additive migration rewriting all core RLS policies to use `USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)` (matching the pattern established in migration `202609220000_rls_policy_hardening.sql`).
- [ ] **RLS Foreign Key & Tenant Index Audit**
  - Verify all columns participating in RLS `USING` and `WITH CHECK` clauses have explicit B-tree indexes.
  - Ensure foreign keys used in `security_invoker = true` views (e.g. `workout_id`, `roadmap_id`) are indexed to eliminate nested-loop sequential scans.
- [ ] **Materialized Views for 90-Day Longitudinal Aggregations**
  - Evaluate query execution plans (`EXPLAIN ANALYZE`) on `data_lab_daily_activity_90d` and `current_day_snapshot_history_14d`.
  - If multi-table joins under `security_invoker` exceed acceptable latency at multi-year data scale, introduce scheduled materialized views refreshed via pg_cron or Evening Sync triggers.
- [ ] **Role Scoping (`TO authenticated`) on Legacy Policies**
  - Ensure every policy explicitly specifies `TO authenticated` to prevent policy evaluation during internal administrative operations.

---

## Track 3: Clean Engineering & Architecture
**Priority: CRITICAL** | **Focus:** Domain isolation, cognitive boundaries, and preventing codebase entropy

- [ ] **Feature-Sliced Design (FSD) Layering Enforcement**
  - Enforce strict downward dependency boundaries (`app → pages → widgets → features → entities → shared`) to guarantee domain isolation.
  - Add ESLint rule (`@feature-sliced/eslint-plugin` or custom import boundary rules) preventing horizontal cross-imports between `features/mind-os` and `features/productivity-hub` (enforcing Invariant 1: Cognitive Boundary).
- [ ] **Public API Barrel Contracts (`index.ts`)**
  - Standardize all 14 domain directories to export public hooks, components, and types exclusively via domain `index.ts` files, making internals private and refactorable.
- [ ] **Discriminated Unions for Complex UI States**
  - Eliminate boolean state combinations (`isLoading && !isError && isSyncing`) across query consumers.
  - Standardize domain state machines to explicit discriminated unions:
    ```typescript
    type AsyncState<T> =
      | { status: 'idle' }
      | { status: 'loading' }
      | { status: 'success'; data: T }
      | { status: 'error'; error: Error }
    ```
- [ ] **Rich Domain Logic as Pure Functions**
  - Keep domain calculations (`analyzeMomentum.ts`, `paceEvaluator.ts`, `amendmentAuditor.ts`) strictly framework-agnostic and free of side-effects.
- [ ] **Strict Compiler Hardening in `tsconfig.json`**
  - Incrementally enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to catch potential runtime undefined errors across the 33-table schema.

---

## Track 4: TypeScript 5.9 Advanced Patterns
**Priority: HIGH** | **Focus:** Zero-cost type-level verification and contract enforcement

- [ ] **Template Literal Types for Canonical Event Taxonomy**
  - Refactor `src/lib/eventTaxonomy.ts` to construct event strings using template literals:
    ```typescript
    type Domain = 'mind' | 'productivity' | 'learning' | 'fitness' | 'time' | 'finance' | 'system'
    type EventKey<D extends Domain, A extends string> = `${D}.${A}`
    ```
- [ ] **Branded ID Types for Entity Keys**
  - Introduce branded types (`type HabitId = string & { readonly __brand: unique symbol }`) to prevent passing a `taskId` into habit operations at compile time.
- [ ] **`satisfies` Operator for Route, Shell, and Color Configurations**
  - Use `satisfies` across `DEFAULT_MODULE_COLORS`, `ROUTES`, and icon registries to preserve narrow literal inference while validating against interface contracts.
- [ ] **Zod v4 Schema Optimization**
  - Leverage native `z.toJSONSchema()` for future tool definitions and `zod/mini` for tree-shaking parser imports.

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
