---
title: Agent Findings Registry
status: ACTIVE
purpose: Centralized registry of all discoveries made by agents during sessions
last_updated: 2026-09-22
---

# Findings Registry

> When an agent discovers a bug, documentation drift, performance issue, security concern,
> or any noteworthy insight — log it here. This prevents rediscovery and creates
> institutional memory.

## Finding Format

~~~markdown
### [F-NNN] [Title]
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO
- **Found by:** [Agent, Session ID]
- **Date:** [ISO 8601]
- **Category:** BUG / DRIFT / SECURITY / PERFORMANCE / INSIGHT / TECH-DEBT
- **Status:** OPEN / FIXED (Session [ID]) / WONT-FIX (reason)

**Description:**
[What was found]

**Evidence:**
[File paths, line numbers, reproduction steps]

**Resolution:**
[How it was fixed, or recommended fix if still open]
~~~

---

## Findings Log

<!-- Agents: append new findings below this line, using the next sequential F-number -->

### [F-001] AdminConsolePage queried non-existent tables
- **Severity:** CRITICAL
- **Found by:** Documentation Forensic Audit, Session 2026-09-18-001
- **Date:** 2026-09-18
- **Category:** BUG
- **Status:** FIXED (Session 2026-09-18-002)

**Description:**
`AdminConsolePage.tsx` line 24 referenced `telemetry_events` (should be `events`) and
`focus_sessions` (should be `time_logs`). Both caused silent PostgreSQL `42P01` errors.

**Evidence:**
- `src/features/admin/pages/AdminConsolePage.tsx:24`
- Grep confirmed `telemetry_events` appeared only in this file

**Resolution:**
Table names corrected to `events` and `time_logs` in remediation Phase 1.

---

### [F-002] Dead code Sidebar.tsx persisted after navigation overhaul
- **Severity:** MEDIUM
- **Found by:** Documentation Forensic Audit, Session 2026-09-18-001
- **Date:** 2026-09-18
- **Category:** TECH-DEBT
- **Status:** FIXED (Session 2026-09-18-002)

**Description:**
`src/layout/Sidebar.tsx` (182 lines) remained in codebase after ADR-023 replaced sidebar
with Astrolabe Orb. Zero imports anywhere. Referenced in AGENTS.md file ownership section.

**Evidence:**
- `src/layout/Sidebar.tsx` (182 lines, unreferenced by any module imports)
- `docs/operations/AGENTS.md` Section 4 table

**Resolution:**
File deleted (`git rm`), all references removed from documentation.

---

### [F-003] Ghost Task Trap in tasks/todo.md
- **Severity:** CRITICAL
- **Found by:** Documentation Forensic Audit, Session 2026-09-18-001
- **Date:** 2026-09-18
- **Category:** DRIFT
- **Status:** FIXED (Session 2026-09-18-002)

**Description:**
17 tasks in `tasks/todo.md` were marked `[ ]` (unchecked) despite all being implemented
and merged in PR #1. An agent picking up work would re-implement production code.

**Evidence:**
- `tasks/todo.md` lines 1–45 (17 unchecked items `[ ]` despite PR #1 completion)

**Resolution:**
All items marked `[x]`, completion banner added, completion record appended.

---

### [F-004] Finance config.ts still uses hardcoded budget fallback
- **Severity:** LOW
- **Found by:** Remediation Worker M1, Session 2026-09-22-001
- **Date:** 2026-09-22
- **Category:** TECH-DEBT
- **Status:** OPEN

**Description:**
`src/features/finance-os/config.ts` still relies on a static fallback (`DEFAULT_MONTHLY_BUDGET = 2000`) and the `VITE_FINANCE_OS_MONTHLY_BUDGET` environment variable instead of querying dynamic user preferences from the database. A persistent preferences storage column (`user_settings.finance_preferences` JSONB) already exists in remote PostgreSQL from migration `20260916212500_winter_arc_extensions.sql`, but client-side budget resolution has not yet been migrated to read from it.

**Evidence:**
- `src/features/finance-os/config.ts` lines 1–9 (`DEFAULT_MONTHLY_BUDGET = 2000`)
- `supabase/migrations/20260916212500_winter_arc_extensions.sql` lines 86–90 (`finance_preferences jsonb default '{}'::jsonb`)
- `src/types/database.types.ts` (`user_settings.Row.finance_preferences`)

**Resolution:**
Update `src/features/finance-os/config.ts` TODO comment to cite finding F-004 and note the existing `user_settings.finance_preferences` schema. In a subsequent release wave, implement a hook to read and persist monthly budget targets in `user_settings`.

---

### [F-005] Zod 4 enum errorMap incompatibility
- **Severity:** HIGH
- **Found by:** Antigravity, Session 2026-10-02-001
- **Date:** 2026-10-02
- **Category:** BUG
- **Status:** FIXED (Session 2026-10-02-001)

**Description:**
In Zod 4.x, passing `{ errorMap: ... }` to `z.enum()` produces a runtime TypeScript/Zod error because `z.enum()` in v4 no longer supports `errorMap` in its options object.

**Evidence:**
- `src/lib/schemas/seasonConfigSchema.ts`: Attempted to supply custom errorMap for unauthorized seasonal icons.

**Resolution:**
Replaced `errorMap` parameter with direct `{ message: ... }` descriptor in `z.enum(ALLOWED_ICONS, { message: 'Invalid icon' })`.

---

### [F-006] Non-zero UTC hour skew in calendar-day horizon math
- **Severity:** HIGH
- **Found by:** Antigravity, Session 2026-10-02-001
- **Date:** 2026-10-02
- **Category:** BUG
- **Status:** FIXED (Session 2026-10-02-001)

**Description:**
Parsing ISO timestamps with non-zero hours (e.g., `2026-10-31T18:00:00Z` or local timezone offsets) causes `(endDate - startDate) / 86400000` to skew calendar day differences by +1 day due to fractional day truncation or rounding across midnight boundaries.

**Evidence:**
- `src/features/arc/utils/paceEvaluator.ts`: 90-day canonical campaign duration evaluated to 91 days when evaluated with non-midnight ISO strings.

**Resolution:**
Implemented `parseDateOnly(dateStr)` which strictly slices the `YYYY-MM-DD` prefix and parses it at `00:00:00.000Z`, ensuring pure calendar day arithmetic independent of time-of-day offsets.

---

### [F-007] Milestone diffing array index collision in amendment auditing
- **Severity:** MEDIUM
- **Found by:** Antigravity, Session 2026-10-02-001
- **Date:** 2026-10-02
- **Category:** DRIFT
- **Status:** FIXED (Session 2026-10-02-001)

**Description:**
When evaluating commitment amendments in `amendmentAuditor.ts`, matching milestones by array index caused cascading false diffs whenever milestones were reordered, prepended, or deleted.

**Evidence:**
- `src/features/arc/utils/amendmentAuditor.ts`: Adding a new milestone at index 0 resulted in modifying all subsequent milestones in the generated audit log.

**Resolution:**
Updated `computeAmendmentDiffs` to match milestones strictly on `milestone.id`. Milestones with matching IDs are audited for field changes; missing IDs are flagged as additions or removals.
