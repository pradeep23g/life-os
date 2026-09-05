# LIFE OS — AI ENGINEERING CONSTITUTION

**Status:** Authoritative Engineering Principles & Invariants  
**Last Synchronized:** September 2026 (Phase 1 Baseline)

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
4. **Single Timer Constraint:** Only one focus timer can be actively running per user at any time.
5. **No Speculative Rewrites:** Do not refactor working modules merely for aesthetic reasons.

---

## 4. Source of Truth Hierarchy
When code and documentation conflict, investigate forensic reality.
When documents conflict, consult in order:
1. `docs/architecture/SYSTEM_ARCHITECTURE.md`
2. `docs/architecture/DATABASE_SCHEMA.md`
3. `docs/architecture/EVENT_TAXONOMY.md`
4. `docs/architecture/MODULE_GUIDE.md`
5. `docs/operations/DEV_WORKFLOW.md`
6. `docs/decisions/ARCHITECTURE_DECISIONS.md`
7. `docs/operations/RELEASE_GATE_CHECKLIST.md`

---

## 5. Module Ownership Map

| Module | Route | Responsibility |
|---|---|---|
| **Mission Control** | `/mission-control` | Aggregated executive view. Read-only. |
| **Mind OS** | `/mind-os` | Reflection: habits, streaks, mood, journal. |
| **Productivity Hub** | `/productivity-hub` | Execution: tasks, deadlines, weekly plans, goals. |
| **Learning OS** | `/learning-os` | Skill acquisition: roadmaps, stages, sessions. |
| **Fitness OS** | `/fitness-os` | Physical tracking: workouts, exercises, PRs. |
| **Time OS** | `/time-os` | Focused time: active timer, time logs, PiP window. |
| **Finance OS** | `/finance-os` | Behavioral spending: Need vs Want classification. |
| **Data Lab** | `/data-lab` | Read-only behavioral intelligence & telemetry health. |
| **System** | Global | Brain Engine momentum scoring & Evening Sync ritual. |
