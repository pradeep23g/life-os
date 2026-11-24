# Life OS — Claude / Codex Instructions

> This file provides Claude Code, OpenAI Codex, and similar agents with project context.
> It mirrors `AGENTS.md` with additional pointers. For full machine orientation, read
> [`docs/AGENT_QUICKSTART.md`](docs/AGENT_QUICKSTART.md) first.

## Identity

Life OS is a **Personal Intelligence Operating System** — NOT a generic todo app. It accumulates years of longitudinal behavioral data across 7 domains (mind, productivity, learning, fitness, time, finance, system) with real-time Brain Engine momentum scoring.

## Stack

React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v3 · TanStack React Query v5 · Zustand v5 · React Router v7 · Supabase JS v2 → PostgreSQL 15+ (33 tables, 15 SQL views, full RLS). Zod v4 for validation. Lucide React for icons.

## Before You Start

1. Read `docs/AGENT_QUICKSTART.md` — system topology, routes, database matrix
2. Read `docs/agent-ledger/HANDOFF.md` — current project context
3. Read `docs/agent-ledger/MISTAKES.md` — anti-patterns to avoid
4. Check `docs/operations/PROJECT_ROADMAP.md` for planned work

## Setup & Verification

```bash
npm install
npm run dev              # Vite dev on localhost:5173
npm run build            # tsc -b && vite build
npm run lint             # ESLint (must be 0 errors, 0 warnings)
npm run verify:docs      # Documentation drift gate
npm run verify:release   # Full composite gate
```

## 5 Immutable Invariants

1. **Cognitive Boundary:** `/mind-os` (reflection) and `/productivity-hub` (execution) NEVER share UI space.
2. **Canonical Telemetry:** Every DB mutation emits events via `logEventSafe()` with constants from `src/lib/eventTaxonomy.ts`.
3. **Database-First Rollups:** Cross-domain aggregations in SQL views only (`security_invoker = true`).
4. **Single Active Timer:** One focus timer per user (partial unique index on `time_logs`).
5. **No Speculative Rewrites:** No refactoring without an accepted ADR.

## Source-of-Truth (descending priority)

1. `supabase/migrations/` → 2. `src/types/database.types.ts` (NEVER hand-edit) → 3. `docs/decisions/ARCHITECTURE_DECISIONS.md` → 4. Architecture docs → 5. Source code → 6. Module/event guides → 7. Operations docs

## Critical Anti-Patterns

- Never query `telemetry_events`, `focus_sessions`, or `seasons` — these don't exist
- Never use column `achievement_key` — it's `badge_id`
- Never use `as any` (exception: `AdminConsolePage.tsx`)
- Never create a sidebar component — navigation is Astrolabe Orb only (ADR-023)
- Never use `Math.random()` in React render paths

## Documentation Protocol

After every session that modifies code:
1. Append session entry to `docs/agent-ledger/SESSION_LOG.md`
2. Update `docs/agent-ledger/HANDOFF.md`
3. Update affected architecture docs
4. Run `npm run verify:docs`

## Full Documentation

- **Agent Handbook:** [`docs/operations/AGENTS.md`](docs/operations/AGENTS.md) — operational boundaries & protocols
- **Architecture Decisions:** [`docs/decisions/ARCHITECTURE_DECISIONS.md`](docs/decisions/ARCHITECTURE_DECISIONS.md) — ADR-001 through ADR-029
- **Database Schema:** [`docs/architecture/DATABASE_SCHEMA.md`](docs/architecture/DATABASE_SCHEMA.md) — 33 tables, all columns
- **Event Taxonomy:** [`docs/architecture/EVENT_TAXONOMY.md`](docs/architecture/EVENT_TAXONOMY.md) — canonical event constants
- **Module Guide:** [`docs/architecture/MODULE_GUIDE.md`](docs/architecture/MODULE_GUIDE.md) — 14 domain modules
