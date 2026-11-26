# Life OS — Agent Instructions (Runtime Executive Brief)

> **For:** Codex, Claude Code, Antigravity, and autonomous coding agents.
> **Role:** Fast runtime entrypoint and token-efficient rule injection.
> **Full orientation:** [`docs/AGENT_QUICKSTART.md`](docs/AGENT_QUICKSTART.md)
> **Deep Operational Handbook:** [`docs/operations/AGENTS.md`](docs/operations/AGENTS.md) (consult for complex changes, new modules, migrations, ledger archival, and multi-file workflows)
> **Current context:** [`docs/agent-ledger/HANDOFF.md`](docs/agent-ledger/HANDOFF.md)
> **Mistake codex:** [`docs/agent-ledger/MISTAKES.md`](docs/agent-ledger/MISTAKES.md)

## Identity

Life OS is a **Personal Intelligence Operating System** — a multi-domain behavioral tracking system that accumulates years of longitudinal life data. It is NOT a generic todo app.

## Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v3 · TanStack React Query v5 · Zustand v5 · React Router v7 · Supabase JS v2 → PostgreSQL 15+ (hosted, 33 tables, 15 SQL views, full RLS).

## Setup

```bash
cp .env.example .env     # then populate VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # Vite dev server on localhost:5173
npm run build            # tsc -b && vite build
```

## 5 Immutable Engineering Invariants

1. **Cognitive Boundary:** Reflection (`/mind-os`) and Execution (`/productivity-hub`) NEVER share screen space.
2. **Canonical Telemetry:** Every mutation MUST emit events via `logEventSafe()` using constants from `src/lib/eventTaxonomy.ts`.
3. **Database-First Rollups:** Longitudinal metrics MUST execute in PostgreSQL SQL views, never client-side loops.
4. **Single Active Timer:** Only one focus timer per user (partial unique index in `time_logs`).
5. **No Speculative Rewrites:** Working code must not be refactored without an accepted ADR in `docs/decisions/ARCHITECTURE_DECISIONS.md`.

## Source-of-Truth Hierarchy (resolve conflicts in this order)

1. `supabase/migrations/` and remote Supabase tables
2. `src/types/database.types.ts` (generated — NEVER hand-edit)
3. `docs/decisions/ARCHITECTURE_DECISIONS.md` (ADR-001 through ADR-030)
4. `docs/architecture/SYSTEM_ARCHITECTURE.md` and `docs/architecture/DATABASE_SCHEMA.md`
5. Active implementations in `src/`
6. `docs/architecture/MODULE_GUIDE.md` and `docs/architecture/EVENT_TAXONOMY.md`
7. `docs/operations/DEV_WORKFLOW.md` and `docs/operations/RELEASE_GATE_CHECKLIST.md`

## Common Mistakes — DO NOT

| ❌ Mistake | ✅ Correct |
|---|---|
| Creating a `Sidebar.tsx` | Sidebar retired (ADR-023). Use `AstrolabeOrbNav.tsx` |
| Changing `/` to render MissionControl | `/` is `HomePage`. Mission Control is at `/system` |
| Querying `telemetry_events` | Table doesn't exist. Use `events` |
| Querying `focus_sessions` | Not a table. Use `time_logs` |
| Using column `achievement_key` | Column is `badge_id` |
| Using table `seasons` | Table is `life_seasons` |
| Using `Math.random()` in React render | Breaks React 19 reconciliation |
| Casting with `as any` | Use typed Supabase client. Exception: `AdminConsolePage.tsx` only |
| Picking tasks from `tasks/todo.md` | Tasks are archived. See `docs/operations/PROJECT_ROADMAP.md` |

## Pre-Merge Verification

```bash
npm run verify:docs      # Documentation drift gate
npm run lint             # ESLint (0 errors, 0 warnings)
npm run build            # TypeScript + Vite production bundle
npm run verify:release   # Composite: verify:docs + lint + tsc + build
```

## Key File Pointers

| File | Role |
|---|---|
| `docs/operations/AGENTS.md` | Comprehensive operational handbook (SOPs, protocols, subsystem ownership) |
| `src/lib/eventTaxonomy.ts` | Canonical event constants |
| `src/types/database.types.ts` | Generated DB types (NEVER edit) |
| `src/layout/AstrolabeOrbNav.tsx` | Navigation system |
| `src/features/system/` | Brain Engine algorithms |
| `supabase/migrations/` | Immutable migration history |
| `docs/agent-ledger/SESSION_LOG.md` | Session logging (append-only) |

> [!TIP]
> **Complex & Architectural Changes:** If your task involves creating new feature modules, writing database migrations, modifying event queue persistence, rotating ledger files, or resolving git merge conflicts, you **MUST** consult the comprehensive standard operating procedures in [`docs/operations/AGENTS.md`](docs/operations/AGENTS.md).
