---
title: Agent Mistake Codex
status: ACTIVE
purpose: Record of agent mistakes with root cause analysis to prevent recurrence
last_updated: 2026-09-19
---

# Mistake Codex

> This document turns failures into institutional knowledge.
> Every mistake entry includes: what happened, why, and the system change
> that prevents it from happening again.
>
> **Reading this file is MANDATORY for any agent before starting complex work.**

## Mistake Format

~~~markdown
### [M-NNN] [Title]
- **Agent:** [Who made the mistake]
- **Date:** [When]
- **Impact:** CATASTROPHIC / HIGH / MEDIUM / LOW
- **Root Cause Category:** STALE_DOCS / MISSING_DOCS / WRONG_ASSUMPTION / HALLUCINATION / SCOPE_CREEP

**What happened:**
[Factual description of the error]

**Root cause:**
[Why the agent made this mistake — was it bad docs? Missing context? Over-confidence?]

**Damage:**
[What was the actual impact — broken build? Lost work? Production regression?]

**System fix applied:**
[What documentation/process change was made to prevent recurrence]

**Detection rule:**
[How would a future agent detect if they're about to make the same mistake?]
~~~

---

## Mistake History

<!-- Agents: append new mistakes below this line -->

### [M-001] Schema hallucination from outdated ADR
- **Agent:** Pre-remediation agent (unknown)
- **Date:** 2026-09-16
- **Impact:** HIGH
- **Root Cause Category:** STALE_DOCS

**What happened:**
Agent wrote SQL queries referencing column `achievement_key` in `user_achievements` table.
The actual column is `badge_id`.

**Root cause:**
ADR-016 in `WINTER_ARC_DECISIONS.md` specified `achievement_key` as the column name.
The migration created `badge_id` instead. The ADR was never updated to match.

**Damage:**
Queries failed at runtime with `42703: column "achievement_key" does not exist`.

**System fix applied:**
1. ADR-016 corrected to show `badge_id`
2. DATABASE_SCHEMA.md updated with exact column names
3. Quick Schema Reference added to AGENT_QUICKSTART.md with anti-hallucination column names

**Detection rule:**
Before writing any query referencing Winter Arc tables, check the Quick Schema Reference
in AGENT_QUICKSTART.md. If the column name you're about to use differs from the reference,
STOP and verify against DATABASE_SCHEMA.md.

---

### [M-002] Table name hallucination in AdminConsolePage
- **Agent:** Winter Arc implementation agent
- **Date:** 2026-09-17
- **Impact:** MEDIUM
- **Root Cause Category:** HALLUCINATION

**What happened:**
Agent wrote `telemetry_events` and `focus_sessions` as table names in AdminConsolePage.tsx.
Neither table exists.

**Root cause:**
Agent inferred table names from naming conventions instead of checking DATABASE_SCHEMA.md.
Used `as any` cast on Supabase client, bypassing TypeScript type checking.

**Damage:**
Admin Console silently displayed blank statistics for 2 of 4 tables.

**System fix applied:**
1. Table names corrected to `events` and `time_logs`
2. Added to "Common Agent Mistakes" table in AGENTS.md
3. Added Key Invariant: "All Supabase queries must use typed client (no `as any`)"

**Detection rule:**
Never guess table names. Always verify against DATABASE_SCHEMA.md or `database.types.ts`.
Never use `(supabase.from as any)` — if TypeScript doesn't recognize the table name,
the table probably doesn't exist.

---

### [M-003] Raw timestamp subtraction across dates with non-zero hours
- **Agent:** Antigravity, Session 2026-10-02-001
- **Date:** 2026-10-02
- **Impact:** MEDIUM
- **Root Cause Category:** WRONG_ASSUMPTION

**What happened:**
Calendar horizon day differences were calculated using raw `(new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000`. When ISO strings contained non-zero UTC hours or local offsets, fractional milliseconds caused the duration to be calculated as 91 days instead of 90 days.

**Root cause:**
Assumed standard `Date.getTime()` difference division by 86,400,000 always yields exact integer calendar days regardless of time-of-day components.

**Damage:**
Unit tests for `calculateTemporalHorizon` flagged duration skew (+1 day) on standard ISO timestamps with non-zero hour components.

**System fix applied:**
1. Created `parseDateOnly()` utility in `src/features/arc/utils/paceEvaluator.ts` slicing the `YYYY-MM-DD` prefix and parsing at `00:00:00.000Z`.
2. Added comprehensive unit tests covering Day 0, active midpoint, naturally concluded, and early-completed arcs with varying ISO time strings.

**Detection rule:**
Whenever computing calendar day differences between two dates, never use raw timestamp subtraction unless dates are guaranteed to be normalized to midnight UTC (`YYYY-MM-DDT00:00:00.000Z`). Use `parseDateOnly` or date-only string slicing.
