---
title: "Agent & Maintainer Operational Handbook"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "operations"
---

# LIFE OS — AI AGENT & MAINTAINER OPERATIONAL HANDBOOK

**Status:** Authoritative Operational Engineering Guide  
**Last Synchronized:** September 2026 (Winter Arc 2.0 Baseline — Commit `77d1a5b`)  
**Audience:** AI Coding Agents, Software Architects, and Core Maintainers  
**Target Repository:** `pradeep23g/life-os`

---

## 1. Operational Role & Mission

Life OS is a **Personal Intelligence Operating System** built as a React 19 / TypeScript 5.9 / Vite Single Page Application backed by hosted PostgreSQL 15+ (Supabase).

Its objective is to accumulate multi-year longitudinal behavioral data, calculate deterministic real-time momentum scores, and surface automated, urgency-ranked directives via the Brain Engine.

As an AI agent or maintainer working on this codebase:
- **Prioritize Data Integrity Over Convenience:** A clean compile that corrupts telemetry or drops queue events is an architectural failure.
- **Do Not Guess or Invent:** Never reference tables, columns, API routes, or features that do not exist. If something cannot be proven from current evidence, classify it as UNVERIFIED.
- **Respect Historical Distinctions:** Historical archive tables (e.g. `progress_hub_archive`) are intentional records. Do NOT attempt to delete them simply because they contain "old" names.

---

## 2. Source-of-Truth Priority Hierarchy

When codebase artifacts, database tables, or documents disagree, resolve conflicts strictly in this order:

1. **Remote PostgreSQL Migrations & Live Schema:** `supabase/migrations/` and remote Supabase tables.
2. **Generated Database Types:** `src/types/database.types.ts` generated from live schema.
3. **Canonical Architectural Decisions:** `docs/decisions/ARCHITECTURE_DECISIONS.md` (ADR-001 through ADR-028).
4. **Canonical Architecture Documentation:** `docs/architecture/SYSTEM_ARCHITECTURE.md` and `docs/architecture/DATABASE_SCHEMA.md`.
5. **Current Application Source Code:** Active implementations in `src/`.
6. **Feature Specifications & Taxonomy:** `docs/architecture/MODULE_GUIDE.md` and `docs/architecture/EVENT_TAXONOMY.md`.
7. **Operational Guides & Checklists:** `docs/operations/DEV_WORKFLOW.md` and `docs/operations/RELEASE_GATE_CHECKLIST.md`.

> [!IMPORTANT]
> **Mandatory Fix-on-Discovery Rule:** When a discrepancy between physical code/schema reality and documentation is discovered, you MUST NOT silently bypass or ignore the documentation. You MUST correct the documentation immediately to restore truth parity.

---

## Common Agent Mistakes — DO NOT

> [!CAUTION]
> These mistakes have been made by previous agents. Each one caused production regressions
> or wasted significant effort. Learn from them.

| ❌ Mistake | Why It's Wrong | ✅ Correct Action |
|---|---|---|
| Creating a `Sidebar.tsx` or sidebar component | Sidebar was retired in ADR-023. Navigation is Astrolabe Orb only. | Modify `AstrolabeOrbNav.tsx` |
| Changing `/` to render `MissionControl` | `/` is `HomePage` ("The Porch"). Mission Control is at `/system`. | Check route table in AGENT_QUICKSTART.md |
| Querying table `telemetry_events` | Table doesn't exist. The events table is `public.events`. | Use `events` or check DATABASE_SCHEMA.md |
| Querying table `focus_sessions` | Not a table — it's a computed view column from `time_logs`. | Use `time_logs` |
| Using column `achievement_key` | Column doesn't exist. The correct column is `badge_id`. | Check DATABASE_SCHEMA.md |
| Using table name `seasons` | Table is `life_seasons` (with `life_` prefix). | Check DATABASE_SCHEMA.md |
| Picking up tasks from `tasks/todo.md` | All tasks are completed and archived (PR #1). | Check `docs/operations/PROJECT_ROADMAP.md` for real work |
| Reading `LIFE_OS_FINAL_CURRENT_STATE_CONTEXT.md` as current | It's a historical snapshot from Sept 5. | Read `docs/AGENT_QUICKSTART.md` instead |
| Using `Math.random()` in React rendering | Non-deterministic renders break React 19 reconciliation. | Use deterministic functions or `useMemo` with stable seeds |
| Casting Supabase queries with `as any` | Bypasses TypeScript safety, hides table name errors. | Use typed Supabase client |

---

## 3. Cognitive Boundary Invariant

**Reflection (Mind OS) and Execution (Productivity Hub) must NEVER share UI space.**

Presenting execution pressure (overdue tasks, impending deadlines, backlog counts) within a reflective context (daily journaling, habit streak review) triggers cognitive anxiety (the Zeigarnik Effect) and degrades reflection quality.

- **Mind OS** components MUST NEVER import task hooks, render task counts, or display execution urgency.
- **Productivity Hub** components MUST NEVER render mood distribution charts or journal entries.
- **Mission Control** is the sole unified executive surface where cross-domain summaries converge.

---

## 4. File Ownership & Subsystem Boundaries

| Subsystem | Directory | Ownership Rules |
|---|---|---|
| **Home** | `src/features/home/` | The Porch: Asymmetric Swiss Stage, solar presence, dynamic CTA portal. |
| **Winter Arc** | `src/features/arc/` | Winter Arc Grand Hall: 90-day countdown, chapter milestones, seasonal vows (`life_seasons`). |
| **Mission Control** | `src/features/mission-control/` | Consumes `useSystemStatus()`, `usePendingEventsCount()`, and domain queries. Renders real EMA sparklines (no synthetic offsets) and deterministic confidence. |
| **Profile** | `src/features/profile/` | Personal biographical chronicle, heroic avatar presence, capability crests (`user_achievements`). |
| **Admin Console** | `src/features/admin/` | Life OS control plane: database health, table telemetry monitor (`events`, `time_logs`), JSON schema import/export. |
| **Field Reports** | `src/features/reports/` | Sunday field dossier broadsheet: automated synthesis of weekly planning, reviews, time density, and financial discipline. |
| **Mind OS** | `src/features/mind-os/` | Owns habits, streak breaks, streak heals (5/mo limit), and journal entries. Emits `mind.*` canonical events. |
| **Productivity Hub** | `src/features/productivity-hub/` | Owns tasks, goals, weekly plans, plan items, and reviews. Emits `productivity.*` canonical events. |
| **Learning OS** | `src/features/learning-os/` | Owns roadmaps, stages, sessions, session logs, milestones, projects, reflections. Distinguishes `useRecentSessionLogs(20)` from `useSessionAnalytics()`. |
| **Fitness OS** | `src/features/fitness-os/` | Owns exercises, workouts, exercise logs, PRs. Enforces single active workout session invariant. |
| **Time OS** | `src/features/time-os/` | Owns time logs, active timer, Document PiP companion. Enforces single active timer database constraint. |
| **Finance OS** | `src/features/finance-os/` | Owns behavioral spending in `transactions`. Measures Need vs Want discretionary spending. |
| **Data Lab** | `src/features/data-lab/` | Read-only analytical workbench querying SQL views. Uses normalized key matching (`normalizeKey()`). |
| **System Engine** | `src/features/system/` | Owns Brain Engine scoring, directives, and Evening Sync queue flushing. |
| **Auth** | `src/features/auth/` | Authentication & Session Gateway: `AuthPage.tsx`, session management, login/sign-up flows, and Supabase auth redirects (`auth.uid()`). |
| **Shell & Navigation** | `src/layout/` | Owns `AstrolabeOrbNav.tsx`, `ModuleHeader.tsx`, and shell layout wrappers. (Sidebar retired in 2.0). |
| **Event Store** | `src/store/useEventBus.ts` | Owns operational queue, retry backoff, peek-and-splice persistence invariant, and bounded capacity. |
| **Database Types** | `src/types/database.types.ts` | **STRICTLY PROTECTED FILE.** Never hand-edit. Generated via Supabase CLI. |
| **Migrations** | `supabase/migrations/` | **IMMUTABLE HISTORY.** Only create new sequential additive migrations. |

---

## 5. Database & Migration Rules

1. **Row Level Security (RLS) Mandate:**
   - Every single application table in PostgreSQL MUST have RLS enabled.
   - Policies must enforce tenant isolation: `auth.uid() = user_id`.
2. **Security Invoker Views:**
   - All SQL aggregation views MUST specify `WITH (security_invoker = true)`.
   - Views without security invoker bypass RLS and will fail automated verification.
3. **Additive Migration Pattern:**
   - Migrations in `supabase/migrations/` must be sequential: `YYYYMMDDNNNN_description.sql`.
   - Never modify or delete past migrations that have already been applied to the remote database.
   - Never drop active columns without a phased deprecation period.
4. **Generated Type Parity (`database.types.ts`):**
   - Whenever a remote schema migration is applied, regenerate types immediately:
     ```bash
     npx supabase gen types typescript --linked > src/types/database.types.ts
     ```
   - Hand-editing `database.types.ts` is strictly prohibited. It must match remote PostgreSQL byte-for-byte.

---

## 6. Telemetry & Event Logging Rules

1. **Single Canonical Taxonomy:**
   - Every event emitted into `public.events` MUST use an imported constant from `src/lib/eventTaxonomy.ts`.
   - String literals (e.g. `'task_created'`, `'habit_done'`) are strictly banned.
2. **Complete Event Mutation Contract:**
   - Always supply `domain`, `entityType`, `entityId`, `eventType`, `userId`, and `payload` via `logEventSafe()`.
   - All events record `event_date_ist` in Indian Standard Time (`Asia/Kolkata`).
3. **Transient vs Durable Channels:**
   - Durable audit events $\rightarrow$ `logEventSafe()` $\rightarrow$ `public.events`.
   - Transient operational signals $\rightarrow$ `useEventBus.getState().emitEvent()` $\rightarrow$ `public.system_event_queue`.
4. **EventBus Invariants:**
   - **Peek-and-Splice:** Never remove events from memory before awaiting confirmation from Supabase insert.
   - **Backoff Retry:** Failed queue flushes must back off exponentially (1s, 2s, 4s, max 30s).
   - **Dead-Letter Quarantine:** Events failing 5 consecutive retries must be quarantined.
   - **Bounded Size:** In-memory queue capped at 200; recent events capped at 50 with 24-hour TTL.

---

## 7. New Module Creation Protocol

When creating a new feature module, complete every step in sequential order:

### 1. Scaffolding
- [ ] Create `src/features/<name>/` directory structure:
  - `pages/<Name>Page.tsx` (or `<Name>Layout.tsx` for multi-view modules)
  - `api/use<Name>.ts` for TanStack React Query hooks
  - `components/` directory for module-specific UI components
  - `__tests__/` directory for unit tests

### 2. Database & Schema (if adding persistent entities)
- [ ] Create sequential additive migration: `supabase/migrations/<YYYYMMDDNNNN>_<description>.sql`
- [ ] Enable RLS on every created table: `ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;`
- [ ] Add tenant isolation policy: `CREATE POLICY "Users can manage own <entity>" ON public.<table_name> FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
- [ ] Regenerate TypeScript contracts: `npx supabase gen types typescript --linked > src/types/database.types.ts`

### 3. Telemetry & Event Taxonomy
- [ ] Register canonical dot-notation event constants in `src/lib/eventTaxonomy.ts`
- [ ] Map mutations to `logEventSafe()` using canonical event constants and India Date Keys (`toIndiaDateKey`)

### 4. Theme & Shell Configuration
- [ ] Register module signature color in `src/lib/useModuleColors.ts` (`DEFAULT_MODULE_COLORS`) and document in `docs/architecture/UI_SYSTEM.md`
- [ ] Register route title resolution in `src/layout/shellTitle.ts` (`getShellTitle`)

### 5. Navigation & Route Registration
- [ ] Register orbital navigation node in `src/layout/AstrolabeOrbNav.tsx` (coordinate ring `radius`, angle trigonometry, and canonical domain assignment)
- [ ] Add route in `src/App.tsx` lazy-loaded with `React.lazy()` and wrapped in `<ProtectedRoute>`:
  ```tsx
  <Route
    path="/<module-path>/*"
    element={
      <ProtectedRoute>
        <<ModuleName>Page />
      </ProtectedRoute>
    }
  />
  ```

### 6. Automated Testing
- [ ] Write component tests verifying render states, loading states, and error handling
- [ ] Verify query hooks handle auth session state gracefully

### 7. Documentation (MANDATORY — not optional)
- [ ] Update `docs/architecture/DATABASE_SCHEMA.md` with new tables, columns, RLS policies, and indexes
- [ ] Update `docs/architecture/MODULE_GUIDE.md` with new module section, components, and responsibilities
- [ ] Update route tables in `docs/AGENT_QUICKSTART.md` and `docs/architecture/SYSTEM_ARCHITECTURE.md`
- [ ] Record session in Agent Session Ledger (`docs/agent-ledger/SESSION_LOG.md` and `HANDOFF.md`)

### 8. Verification & Quality Gates
- [ ] TypeScript check: `npx tsc -b` passes with 0 errors
- [ ] Linter check: `npx eslint src` passes with 0 warnings/errors
- [ ] Application build: `npm run build` succeeds
- [ ] Documentation drift gate: `powershell -ExecutionPolicy Bypass -File scripts/verify-doc-drift.ps1` passes (5/5)

---

## 8. Agent Session Documentation Protocol (MANDATORY)

Every agent session that modifies code or documentation MUST:

### Before Starting Work
1. Read `docs/AGENT_QUICKSTART.md` (Tier 0)
2. Read `docs/agent-ledger/HANDOFF.md` for current context
3. Read `docs/agent-ledger/MISTAKES.md` if working in a domain where mistakes were logged

### During Work
4. Log any bugs, drift, or insights discovered in `docs/agent-ledger/FINDINGS.md`
5. If you make an error that costs time or causes a regression, document it in
   `docs/agent-ledger/MISTAKES.md` with root cause analysis

### After Completing Work
6. Append a session entry to `docs/agent-ledger/SESSION_LOG.md`
7. Update `docs/agent-ledger/HANDOFF.md` with current context for the next agent
8. Update any documentation files affected by your code changes:
   - New tables → DATABASE_SCHEMA.md + AGENT_QUICKSTART.md quick ref
   - New routes → SYSTEM_ARCHITECTURE.md + AGENT_QUICKSTART.md + MODULE_GUIDE.md
   - New ADRs → ARCHITECTURE_DECISIONS.md
   - New modules → MODULE_GUIDE.md

### Documentation Is a First-Class Deliverable
> [!IMPORTANT]
> Documentation updates are NOT optional cleanup. They are a **required deliverable**
> of every session, equal in importance to the code itself. A session that modifies
> code without updating documentation is **incomplete**.
>
> If you discover a doc/code discrepancy but cannot fix it in this session,
> you MUST log it in FINDINGS.md as an OPEN finding.

---

## 9. Brain Engine & Intelligence Rules

1. **No Simulated Intelligence:**
   - Mission Control sparklines MUST display the actual `emaSeries` array from `analyzeMomentum.ts`.
   - If historical data is empty (new user), render an honest flat baseline at 0. Never synthesize points using offsets (`momentum ± 2`).
2. **Deterministic Confidence Score:**
   - Confidence is computed deterministically via `computeSystemConfidence()`:
     $$\text{Confidence} = \operatorname{round}(0.35 \times \text{Freshness} + 0.35 \times \text{Completeness} + 0.30 \times \text{Coverage})$$
   - Never hardcode static confidence values (such as `87`).
3. **Full 14-Column Snapshot Projection:**
   - `useSystemStatus.ts` MUST query all 14 columns from `current_day_snapshot`, specifically including `budget_utilization_percentage` and `recent_want_expenses_count`.
   - Handle nullable budgets gracefully using `Number.isFinite()`.

---

## 10. Evening Sync & Queue Flushing Invariants

1. **Cross-Day Queue Flushing:**
   - Evening Sync queries `public.system_event_queue` in bounded batches of 50 without date restrictions. It must flush events from previous days that were queued offline.
2. **Persistence Before Deletion:**
   - Daily totals are upserted to `public.system_metrics` **before** events are deleted from `public.system_event_queue`.
3. **Canonical Event Emission:**
   - Upon completion, Evening Sync emits `system.evening_sync.completed` via `logEventSafe()`.
4. **Cache Invalidation:**
   - Always invalidate `systemStatusQueryKey` and `['system-event-queue-count']` in `onSuccess`.

---

## 11. What Agents MUST NOT Modify Casually

1. **DO NOT hand-edit `src/types/database.types.ts`:** Regenerate only via Supabase CLI.
2. **DO NOT alter historical migrations:** Existing migrations in `supabase/migrations/` are immutable history.
3. **DO NOT drop `public.progress_hub_archive`:** This table is an intentional historical archive retained for data auditability.
4. **DO NOT recreate phantom entities:** Never reintroduce `finance_transactions`, `workout_sets`, or `weekly_plan_items.plan_id`.
5. **DO NOT cross the cognitive boundary:** Never import Productivity Hub task queries into Mind OS or vice versa.
6. **DO NOT synthesize intelligence:** Never mock sparklines or fake metrics to make a component "look full".

---

## 12. Automated Verification & Quality Gates

Before concluding any development task or declaring work complete, execute the required quality gates from repository root:

```bash
# 1. Static Lint Analysis (Must be 0 warnings, 0 errors)
npm run lint

# 2. Production TypeCheck & Vite Bundle (Must compile cleanly)
npm run build

# 3. Canonical Release Verification Gate
npm run verify:release

# 4. Automated Backend Smoke Suite (29 integration assertions against live Supabase)
node scripts/smoke/run-smoke-validation.mjs

# 5. Integrity Contract Tests (Validates F-01 through F-06 contracts)
npx tsx scripts/smoke/verify-integrity-contracts.mjs

# 6. Adversarial Attack Suite (Boundary conditions, queue flood, midnight rollover)
npx tsx --env-file=.env scripts/smoke/verify-adversarial-attacks.mjs

# 7. Real-User Browser Verification (60 DOM interactions in headless Google Chrome)
node scripts/smoke/run-browser-verification.mjs
```

---

## 13. Active vs Historical Entities Matrix

| Entity | Classification | Handling Rule |
|---|---|---|
| `transactions` | **ACTIVE CANONICAL** | Primary ledger for Finance OS. Used by `useFinance.ts`. |
| `finance_transactions` | **PERMANENTLY DROPPED** | Retired table. Replaced by `transactions`. Must not appear in queries or fallbacks. |
| `exercise_logs` | **ACTIVE CANONICAL** | Primary set/rep performance ledger for Fitness OS. |
| `workout_sets` | **PHANTOM / NEVER EXISTED** | Phantom artifact. Do not create or reference. |
| `weekly_plan_items` | **ACTIVE CANONICAL** | Keys directly to `(user_id, week_start_date)`. No `plan_id` foreign key. |
| `progress_hub_archive` | **ACTIVE ARCHIVE** | Intentional historical archive table. Retained in PostgreSQL. Not queried by runtime code. |
| `learning_roadmaps` | **ACTIVE CANONICAL** | Hierarchical skill curriculum engine. Fully active in production. |
