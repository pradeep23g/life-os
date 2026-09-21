---
title: "AI Engineering Constitution"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "governance"
---

# LIFE OS — AI ENGINEERING CONSTITUTION

**Status:** Authoritative Engineering Principles & Invariants  
**Last Synchronized:** September 2026 (Winter Arc 2.0 Baseline — Commit `77d1a5b`)  
**Target Repository:** `pradeep23g/life-os`

---

## 1. Identity & Role
As an engineer or AI assistant working on Life OS:
- You are an engineering partner responsible for preserving the integrity of a long-term personal operating system.
- Every change must prioritize correctness, data integrity, architectural consistency, and type safety over speed.

---

## 2. Mission
Life OS is NOT a generic todo app. It is a long-term behavioral operating system engineered to accumulate years of reliable personal intelligence data.

---

## 3. Engineering Invariants
1. **Cognitive Boundary:** Reflection (Mind OS) and Execution (Productivity Hub) must NEVER share UI space.
2. **Canonical Telemetry:** Every mutation that changes database state MUST emit an event via `logEventSafe()` using constants from `src/lib/eventTaxonomy.ts`.
3. **Database-First Rollups:** Cross-domain aggregations and multi-day metrics MUST be calculated in SQL views (`security_invoker = true`), not client-side loops.
4. **Single Timer Constraint:** Only one focus timer can be actively running per user at any time (enforced via partial unique index in `public.time_logs`).
5. **No Speculative Rewrites:** Do not refactor working modules merely for aesthetic reasons. Architectural redesigns (such as planned visual overhauls, typography updates, and UI transitions) must be explicitly authorized by an accepted Architectural Decision Record (ADR) and formally tracked in the roadmap.

---

## 4. Source of Truth Hierarchy
When code and documentation conflict, investigate forensic reality. When documentation files conflict, consult in authoritative order:
1. **Database Migrations & TypeScript Contracts:** `supabase/migrations/` & `src/types/database.types.ts` (Absolute physical reality).
2. **Canonical Decision Log:** `docs/decisions/ARCHITECTURE_DECISIONS.md` (ADR-001 through ADR-028).
3. **System Architecture & Database Schema:** `docs/architecture/SYSTEM_ARCHITECTURE.md` & `docs/architecture/DATABASE_SCHEMA.md`.
4. **Telemetry & Module Guides:** `docs/architecture/EVENT_TAXONOMY.md` & `docs/architecture/MODULE_GUIDE.md`.
5. **Operations & Workflows:** `docs/operations/DEV_WORKFLOW.md`, `docs/operations/RELEASE_GATE_CHECKLIST.md`, and `docs/operations/AGENTS.md`.

> [!IMPORTANT]
> **Mandatory Fix-on-Discovery Rule:** When a discrepancy between physical code reality and documentation is discovered, you MUST NOT silently bypass or ignore it. You must document and correct the drift immediately.

---

## 5. Module Ownership Map (14 Client Routes + System Overlay)

| Module | Route | Directory | Responsibility |
|---|---|---|---|
| **Home** | `/` | `src/features/home/` | The Porch: Asymmetric Swiss Stage, solar presence, dynamic CTA portal. |
| **Winter Arc** | `/arc` | `src/features/arc/` | Winter Arc Grand Hall: 90-day countdown, seasonal directives, epoch rail, chapter vows (`life_seasons`). |
| **Mission Control** | `/system` (`/mission-control` redirects) | `src/features/mission-control/` | Executive command center: Brain Engine momentum, 14-day EMA sparklines, daily directives, 7-domain health. |
| **Profile** | `/profile` | `src/features/profile/` | Personal chronicle, heroic avatar presence, capability crests (`user_achievements`), and sign-out. |
| **Admin Console** | `/admin` | `src/features/admin/` | Control plane: database health, table telemetry monitor (`events`, `time_logs`), JSON schema import/export. |
| **Field Reports** | `/reports` | `src/features/reports/` | Sunday field dossier: automated synthesis of weekly planning, reviews, time density, and financial discipline. |
| **Mind OS** | `/mind-os` | `src/features/mind-os/` | Reflection: daily habits, streak calculation, retroactive break logging, heal tokens, journaling. |
| **Productivity Hub** | `/productivity-hub` | `src/features/productivity-hub/` | Execution: task ledger, deadlines, weekly planning, strategic goals, backlog Kanban. |
| **Learning OS** | `/learning-os` | `src/features/learning-os/` | Skill acquisition: roadmaps, stages, study sessions, session logs, milestones, reflections. |
| **Fitness OS** | `/fitness-os` | `src/features/fitness-os/` | Kinetic Ledger: live workouts, set-by-set isolation, numpad entry, dual-mode movement catalog, PRs. |
| **Time OS** | `/time-os` | `src/features/time-os/` | Chronos Tri-Modal Engine: focus timer (`[MONOLITH]`), Document PiP companion, root visualizer, analytics. |
| **Finance OS** | `/finance-os` | `src/features/finance-os/` | Spending ledger: Need vs Want categorization and discretionary discipline tracking. |
| **Data Lab** | `/data-lab` | `src/features/data-lab/` | Analytical workbench: 90-day activity rollups, module consistency, 12-week score, telemetry coverage. |
| **Auth** | `/auth` | `src/features/auth/` | Supabase authentication, session token persistence, and route security. |
| **System** | Global Overlay | `src/features/system/` | Central Brain Engine momentum scoring, domain signal rules, and Evening Sync ritual. |
