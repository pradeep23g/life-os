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

### 2.1 Invariant Priority Ordering

When operational priorities, mandates, or guidelines conflict during development, resolve them strictly in descending order:

$$\textbf{User request} > \textbf{Data integrity} > \textbf{Fix-on-Discovery} > \textbf{No Speculative Rewrites} > \textbf{Doc protocol}$$

1. **User Request:** Direct objectives, explicit instructions, and specific task scopes provided by the user or orchestrator take absolute precedence over unsolicited tasks.
2. **Data Integrity:** Preservation of user state, telemetry correctness, queue durability, transaction boundaries, and live database consistency strictly overrides developer convenience and velocity.
3. **Fix-on-Discovery:** Factual drift, broken paths, or schema invalidities discovered during execution must be resolved immediately to restore ground-truth parity (bounded by the Scope Guard below).
4. **No Speculative Rewrites:** Maintain minimal change discipline. Never perform unsolicited refactoring, stylistic rewriting, or aesthetic cleanups without explicit mandate.
5. **Doc Protocol:** Logging sessions, maintaining ledger history, and updating handoff state are mandatory deliverables, but yield to runtime data integrity and task completion when tradeoffs arise.

> [!IMPORTANT]
> **Mandatory Fix-on-Discovery Rule & Scope Guard:** When a discrepancy between physical code/schema reality and documentation is discovered, you MUST NOT silently bypass or ignore the documentation. You MUST correct the documentation immediately to restore truth parity.
>
> **Scope Guard (Strict Limits on Fix-on-Discovery):**  
> Fix-on-Discovery applies **exclusively** to:
> - **Factual errors:** Discrepancies in table names, column nullability, route paths, event taxonomy keys, or system counts.
> - **Broken links:** Dead relative file paths, broken heading anchors, or invalid URLs.
> - **Syntax & schema errors:** Malformed YAML frontmatter, broken TypeScript interface contracts, or invalid SQL definitions.
>
> Fix-on-Discovery **DOES NOT** authorize:
> - **Formatting opinions:** Reformatting whitespace, markdown tables, indentation, or quotation styles.
> - **Massive stylistic rewrites:** Rewriting prose, restructuring chapters, or altering documentation tone when the underlying facts are accurate.
> - **Unrequested refactoring:** Modifying working production code, renaming variables/components, or reorganizing directories outside your assigned task scope.

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
| Casting Supabase queries with `as any` | Bypasses TypeScript safety, hides table name errors. *(Exemption: `AdminConsolePage.tsx` dynamic table inspection; see Tech Debt Exemption below).* | Use typed Supabase client (e.g. `supabase.from('events')`). |

> **Known Tech Debt Exemption — `AdminConsolePage.tsx` Dynamic Table Casting:**  
> In `src/features/admin/pages/AdminConsolePage.tsx`, table health telemetry and JSON schema export/import dynamically iterate over an array of table names (`['events', 'time_logs', 'life_seasons', 'user_achievements', 'learning_roadmaps']`). Dynamic iteration cannot use static table string literals without casting (`table as keyof Database['public']['Tables']` or legacy `(supabase.from as any)(table)`). This dynamic inspection in `AdminConsolePage.tsx` is an isolated, approved tech debt exemption. Under no circumstances may `as any` casting be used in domain hooks (`useMind`, `useFitness`, `useTime`, `useFinance`, etc.) or anywhere else in application source code.

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
- [ ] Register orbital navigation node in `src/layout/AstrolabeOrbNav.tsx` (assign to 2-ring coordinate topology, angle trigonometry, optional fanout child registration, and canonical domain assignment)
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
6. Append an atomic session entry to `docs/agent-ledger/SESSION_LOG.md` using the atomic session ID format (`YYYY-MM-DD-<4-char-agent-hash>`)
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

### 8.1 Quick Fix Protocol

The full documentation and testing protocol is mandatory for all substantive features and multi-file changes. For minor maintenance, single-token fixes, or doc corrections, agents may utilize the **Quick Fix Protocol** to accelerate velocity while safeguarding stability.

#### Applicability Criteria
The Quick Fix Protocol applies **strictly** to changes satisfying ALL of the following:
- **Diff Size:** $\le$ 50 lines total diff across the session.
- **Blast Radius:** $\le$ 2 files modified.
- **Zero Invariant Impact:** No alterations to database schemas, RLS policies, event bus queue semantics, or routing trees.
- **Zero Architectural Additions:** No new components, modules, or third-party dependencies.

#### Fast Path Verification
- **Code Fixes:** Run targeted compiler and linter validation (`npx tsc -b` and `npx eslint <path-to-file>`). The multi-stage browser smoke suite and adversarial runner may be bypassed if no telemetry, query structures, or state mutations were altered.
- **Documentation Fixes:** Run the automated documentation drift verification gate (`powershell -ExecutionPolicy Bypass -File scripts/verify-doc-drift.ps1` or `node scripts/verify-doc-drift.mjs`).

#### Minimal Logging
- **`docs/agent-ledger/SESSION_LOG.md`:** A concise 4-line entry is sufficient:
  ```markdown
  ### Session YYYY-MM-DD-<hash> — Quick Fix: <Summary>
  - **Agent:** <name> | **Scope:** <file(s)> (<=50 lines)
  - **Change:** <Description of single isolated fix>
  - **Verification:** <Command executed> (Passed)
  ```
- **`docs/agent-ledger/HANDOFF.md`:** Required only if subsequent agents must adapt to an altered contract; otherwise omit.
- **`docs/agent-ledger/FINDINGS.md` & `MISTAKES.md`:** Omit unless the quick fix specifically resolves or logs a distinct systemic error.

#### Scope Constraint
- **Strict Hard Ceiling:** The 50-line limit is an inviolable ceiling. If a fix begins exceeding 50 lines or requires touching additional subsystems, the agent MUST immediately cease the fast path and execute the complete, standard protocol in Section 8. Chaining sequential "quick fixes" to circumvent full validation is prohibited.

---

### 8.2 Ledger Archival Protocol

As persistent agent ledgers grow, excessive file sizes impair LLM context efficiency and increase session token overhead. The following rotation thresholds and archival procedures are strictly enforced:

#### Rotation Thresholds

| Ledger File | Rotation Threshold | Archive Destination | Active File Retention |
|---|---|---|---|
| `docs/agent-ledger/SESSION_LOG.md` | **$\ge$ 2,000 lines** OR **$\ge$ 50 sessions** | `docs/agent-ledger/SESSION_LOG_ARCHIVE.md` (or monthly `SESSION_LOG_YYYYMM.md`) | Retain frontmatter, format specification, and the **5 most recent sessions**. |
| `docs/agent-ledger/MISTAKES.md` | **$\ge$ 1,000 lines** OR **$\ge$ 30 mistakes** | `docs/agent-ledger/MISTAKES_ARCHIVE.md` | Retain frontmatter, format specification, and the **10 most critical/common mistakes**. |
| `docs/agent-ledger/FINDINGS.md` | Closed / Resolved status | `docs/agent-ledger/FINDINGS_ARCHIVE.md` | Only **active open findings** (`[OPEN]`, `[IN PROGRESS]`) remain in the active file. All closed findings (`[RESOLVED]`, `[CLOSED]`, `[SUPERSEDED]`) MUST be archived immediately. |

#### Archival Procedure (SOP)
1. **Target Verification:** Check active ledger line counts via line-counting tools.
2. **Archive Migration:**
   - Move aged session blocks from `SESSION_LOG.md` to `SESSION_LOG_ARCHIVE.md`.
   - Move resolved mistakes from `MISTAKES.md` to `MISTAKES_ARCHIVE.md`.
   - Transfer resolved findings from `FINDINGS.md` to `FINDINGS_ARCHIVE.md`.
3. **Preserve Format Contracts:** Ensure both the active ledger and the archive ledger retain valid frontmatter, section banners, and formatting guides.
4. **Traceability Notice:** In the active ledger, maintain a pointer banner indicating the location of historical archives:
   ```markdown
   > Prior historical records have been archived to `docs/agent-ledger/<FILE>_ARCHIVE.md`.
   ```

---

### 8.3 Atomic Session ID Specification

To prevent merge collisions during parallel multi-agent execution, all sessions must be identified by an atomic session ID:

$$\textbf{Atomic Session ID Format:}\quad \texttt{YYYY-MM-DD-<4-char-agent-hash>}$$

- **`YYYY-MM-DD`:** Calendar date of the session execution in ISO 8601 format (e.g., `2026-09-22`).
- **`<4-char-agent-hash>`:** A 4-character lowercase alphanumeric or hexadecimal hash unique to the agent instance or session run (e.g., `m6g4`, `e7b2`, `4f1a`).
- **Example Valid IDs:** `2026-09-22-m6g4`, `2026-09-22-f8a1`, `2026-09-23-01cd`.

> **Deprecation of Monotonic Sequence Counters:**  
> Legacy sequential IDs (`YYYY-MM-DD-001`, `YYYY-MM-DD-002`) cause guaranteed merge collisions when independent workers or concurrent orchestrator branches operate simultaneously. Monotonic integer IDs are strictly prohibited for parallel agents.

---

### 8.4 Merge Conflict Resolution Standard Operating Procedure (SOP)

When concurrent agent branches produce merge conflicts in Git, resolve them strictly according to this SOP:

#### 1. Agent Ledgers (`docs/agent-ledger/`) — Purely Additive Reconciliation
- **Never discard entries:** Agent ledger files (`SESSION_LOG.md`, `MISTAKES.md`, `FINDINGS.md`) are immutable historical logs.
- **Resolve `SESSION_LOG.md`:** Retain session blocks from BOTH branches. Sort the combined entries chronologically by date; if dates match, sort alphanumerically by session ID hash.
- **Resolve `MISTAKES.md` & `FINDINGS.md`:** Keep all new mistakes and findings from both branches. If numerical IDs collide (e.g., both added `M-003`), renumber the newer entry monotonically (`M-003` and `M-004`) while preserving full content.
- **Resolve `HANDOFF.md`:** Synthesize the active status from both branches so the incoming agent has complete context of both accomplishments.

#### 2. Documentation Conflicts (`docs/architecture/`, `docs/decisions/`, `docs/operations/`) — Ground-Truth Parity
- Apply the **Source-of-Truth Priority Hierarchy** (Section 2):
  1. Real PostgreSQL migrations (`supabase/migrations/`) take precedence over documented table/column claims.
  2. Generated TypeScript types (`src/types/database.types.ts`) take precedence over handwritten interfaces.
  3. Canonical ADRs (`docs/decisions/ARCHITECTURE_DECISIONS.md`) take precedence over module guides.
- After resolving conflicts, immediately run:
  ```bash
  powershell -ExecutionPolicy Bypass -File scripts/verify-doc-drift.ps1
  ```
  All 5 parity gates must pass.

#### 3. Code Conflicts (`src/`) — Invariant Verification
- Preserve functional code changes while verifying that no architectural boundaries or invariants were violated:
  - Verify Cognitive Boundary (Mind OS $\leftrightarrow$ Productivity Hub isolation).
  - Verify Single Active Session / Timer constraints in Fitness OS and Time OS.
  - Verify deterministic calculations in Brain Engine.
- Re-run verification suite: `npx tsc -b` and `npm run lint`.

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
