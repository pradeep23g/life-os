---
title: "Agent Quickstart & Machine Orientation"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "governance"
---

# LIFE OS — AGENT QUICKSTART & MACHINE ORIENTATION

**Target Audience:** Autonomous Coding Agents, LLM Subagents, Core Maintainers  
**Repository HEAD:** `pradeep23g/life-os` (Commit `77d1a5b`+, Winter Arc 2.0)  
**Primary Invariant:** Truth parity between PostgreSQL migrations, TypeScript types, and documentation.

---

## 1. System Topology at a Glance

```text
React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS v3
├── React Router v7 (14 client routes, route-level lazy loading)
├── Astrolabe Orb Navigation (3-ring kinetic orb shell, ADR-023)
├── TanStack React Query v5 (Exclusive server state manager)
├── Zustand v5 (Operational event queue / transient event bus)
└── Supabase JS v2 Client (@supabase/supabase-js)
      ↓
Hosted PostgreSQL 15+ (Supabase Cloud Instance)
├── 33 Base Tables (32 active operational tables + 1 historical archive)
├── Row Level Security (RLS) enabled on all 33 tables (auth.uid() = user_id)
├── 15 Active SQL Views (WITH security_invoker = true) + 4 Planned Views
└── IST Partitioning (Asia/Kolkata, UTC+5:30)
```

---

## 2. The 14 Active Client Routes

| Route | Feature Component | Directory | Purpose |
|---|---|---|---|
| `/` | `HomePage` | `src/features/home/` | The Porch: Asymmetric Swiss Stage, solar presence, dynamic CTA |
| `/arc` | `ArcPage` | `src/features/arc/` | Winter Arc Grand Hall: 90-day countdown, chapter vows |
| `/system` | `MissionControl` | `src/features/mission-control/` | Executive command center: Brain Engine momentum hero (`/mission-control` redirects) |
| `/profile` | `ProfilePage` | `src/features/profile/` | Personal chronicle, heroic avatar, achievement crests |
| `/admin` | `AdminConsolePage` | `src/features/admin/` | System control plane: DB health, table telemetry, JSON schemas |
| `/reports` | `FieldReportPage` | `src/features/reports/` | Broadsheet Sunday field dossier: auto-synthesized weekly briefs |
| `/mind-os` | `MindOsLayout` | `src/features/mind-os/` | Reflection: habits, streaks, 5/mo heal tokens, daily journal |
| `/productivity-hub` | `ProductivityHubLayout`| `src/features/productivity-hub/` | Execution: task ledger, weekly planning, goals, backlog Kanban |
| `/learning-os` | `LearningOSLayout` | `src/features/learning-os/` | Skill roadmaps, stages, sessions, study logs, projects |
| `/fitness-os` | `FitnessOsLayout` | `src/features/fitness-os/` | Kinetic Ledger: live workouts, numpad entry, movement patterns |
| `/time-os` | `TimeOSPage` | `src/features/time-os/` | Chronos Tri-Modal Engine: focus timer, Document PiP, analytics |
| `/finance-os` | `FinanceDashboard` | `src/features/finance-os/` | Spending ledger with strict Need vs Want behavioral classification |
| `/data-lab` | `DataLabPage` | `src/features/data-lab/` | Read-only analytics workbench querying 90-day SQL views |
| `/auth` | `AuthPage` | `src/features/auth/` | Supabase email/password authentication & session tokens |

### Counting Convention
- **7 Brain Engine Scoring Domains:** mind, productivity, learning, fitness, time, finance, system
- **14 Client Routes:** Listed in the Route Map above
- **15 Feature Directories:** 14 routes + `src/features/system/` (Brain Engine, no dedicated route)

---

## 3. Database Matrix (33 Tables, 15 Active Views)

### 3.1 Base Tables by Domain (33 Total)
- **Mind OS (5):** `habits`, `habit_logs`, `habit_streak_breaks`, `habit_streak_heals`, `journal_entries`
- **Productivity Hub (5):** `tasks`, `goals`, `weekly_plans`, `weekly_plan_items`, `weekly_reviews`
- **Learning OS (7):** `learning_roadmaps`, `learning_stages`, `learning_sessions`, `learning_session_logs`, `learning_milestones`, `learning_projects`, `learning_reflections`
- **Fitness OS (3):** `fitness_exercises` (with `movement_pattern`), `workouts`, `exercise_logs` (with `duration_seconds`)
- **Time OS (1):** `time_logs` (partial unique index `idx_time_logs_single_active` WHERE end_time IS NULL)
- **Finance OS (1):** `transactions` (sole canonical finance ledger)
- **Telemetry & Infrastructure (4):** `events` (durable audit), `system_event_queue` (transient buffer), `system_metrics` (closing ledger), `data_lab_signal_config`
- **Winter Arc & Extensions (6):** `life_seasons`, `user_achievements`, `pulse_logs`, `knowledge_resources`, `experiments`, `user_settings`
- **Historical Archive (1):** `progress_hub_archive` (intentional dormant archive; DO NOT DROP)

### 3.2 SQL Views (15 Active Views)
- **Brain Engine (2):** `current_day_snapshot`, `current_day_snapshot_history_14d`
- **Data Lab (4):** `data_lab_daily_activity_90d`, `data_lab_weekly_system_score_12w`, `data_lab_module_consistency_30d`, `data_lab_event_coverage_30d`
- **Domain Signals (7):** `data_lab_signal_mind_habits`, `data_lab_signal_mind_journal`, `data_lab_signal_execution_tasks`, `data_lab_signal_time_os`, `data_lab_signal_fitness_os`, `data_lab_signal_finance_os`, `data_lab_signal_learning_os`
- **Learning Progress (2):** `learning_roadmap_progress`, `learning_stage_progress`
- **Planned Views (4):** `active_life_seasons`, `recent_achievements`, `pulse_summary`, `knowledge_by_type` (scheduled for future migration waves)

### 3.3 Quick Schema Reference — Winter Arc Extension Tables

| Table | Key Columns | Notes |
|---|---|---|
| `life_seasons` | user_id, name, start_date, end_date, **vows** (jsonb) | No `status` column |
| `user_achievements` | user_id, **badge_id** (text), unlocked_at, metadata (jsonb) | NOT `achievement_key` |
| `pulse_logs` | user_id, **timestamp** (timestamptz), **value** (text), metadata (jsonb) | NOT `logged_at`, `category`, `intensity` |
| `knowledge_resources` | user_id, title, url, metadata (jsonb) | |
| `experiments` | user_id, title, status (default 'Active'), metadata (jsonb) | |
| `user_settings` | user_id (**UNIQUE**), finance_preferences (jsonb) | One row per user |

> All tables: RLS enabled, `auth.uid() = user_id`, FK → `auth.users(id) ON DELETE CASCADE`

For full column specs, see [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md).

---

## 4. The 5 Immutable Engineering Invariants

1. **Cognitive Boundary:** Reflection (`/mind-os`) and Execution (`/productivity-hub`) NEVER share screen space.
2. **Canonical Telemetry:** Every mutation MUST emit events via `logEventSafe()` using constants from `src/lib/eventTaxonomy.ts`.
3. **Database-First Rollups:** Longitudinal metrics and joins MUST execute in PostgreSQL SQL views, never via client-side loops.
4. **Single Active Timer:** Only one focus timer can run per user at any time (enforced via partial unique index in `time_logs`).
5. **No Speculative Rewrites:** Working code must not be refactored without an accepted ADR in `docs/decisions/ARCHITECTURE_DECISIONS.md`.

---

## 5. Documentation Reading Tiers & Priority

```text
Tier 0: Active Context & Lessons (Always read first)
  ├── docs/AGENT_QUICKSTART.md (This file — system orientation)
  ├── docs/agent-ledger/HANDOFF.md (Active context from previous agent)
  └── docs/agent-ledger/MISTAKES.md (Mistake Codex — read before complex work)

Tier 1: Physical Truth (Database & Types)
  ├── supabase/migrations/ (Database reality)
  └── src/types/database.types.ts (TypeScript data contract)

Tier 2: Core Architecture & Governance (Read before implementing)
  ├── docs/decisions/AI_ENGINEERING_CONSTITUTION.md (Rules & boundaries)
  ├── docs/decisions/ARCHITECTURE_DECISIONS.md (ADR-001 through ADR-028)
  └── docs/architecture/SYSTEM_ARCHITECTURE.md (Routing & Topology)

Tier 3: Domain Implementation Reference
  ├── docs/architecture/DATABASE_SCHEMA.md (Full 33-table schema & types)
  ├── docs/architecture/EVENT_TAXONOMY.md (Canonical event constants)
  ├── docs/architecture/MODULE_GUIDE.md (Domain components & hooks)
  └── docs/architecture/UI_SYSTEM.md (Typography, OKLCH tokens, themes)

Tier 4: Operations & Verification
  ├── docs/agent-ledger/SESSION_LOG.md (Chronological session ledger)
  ├── docs/agent-ledger/FINDINGS.md (Discoveries & bug registry)
  ├── docs/operations/RELEASE_GATE_CHECKLIST.md (Pre-merge verification)
  ├── docs/operations/DEV_WORKFLOW.md (Daily development workflow)
  └── docs/operations/AGENTS.md (Operational boundaries)
```

---

## 6. Pre-Merge Verification Commands

```bash
# 1. Documentation Drift Verification Gate
npm run verify:docs

# 2. Static Lint Analysis (0 errors, 0 warnings required)
npm run lint

# 3. Production TypeCheck & Bundle Compile
npm run build

# 4. Canonical Release Verification Gate
npm run verify:release
```
