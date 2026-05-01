# LIFE OS - SYSTEM ARCHITECTURE

This document describes how Life OS layers interact and where new features belong.

---

# 1. ARCHITECTURE OVERVIEW

Life OS is a modular full-stack system designed for:

- domain-isolated frontend workspaces
- scalable relational storage
- SQL-first aggregation
- cross-domain event analytics
- strict cognitive boundaries

System layers:

UI (Nested Routing)
-> React app (Vite)
-> React Query domain hooks
-> Supabase client
-> Supabase API
-> PostgreSQL
-> Events analytics pipeline

---

# 2. DOMAIN MODULES

`src/features/` contains isolated domains:

- `mission-control` (aggregator)
- `mind-os` (reflection)
- `productivity-hub` (execution)
- `progress-hub` (learning growth)
- `fitness-os` (physical effort)
- `time-os` (focused time tracking)
- `finance-os` (behavioral spending)
- `system` (Brain Engine decision layer)

Rule:

- Mission Control consumes summaries, not raw deep domain UIs
- Reflection and execution domains remain cognitively separated

---

# 3. DATA FLOW PATTERN

All reads/writes use React Query + Supabase hooks.

Component
-> Domain hook
-> Supabase query/mutation
-> DB write/read
-> Optional event write
-> Query invalidation
-> UI refresh

---

# 4. SQL-FIRST AGGREGATION LAYER

High-level system status uses SQL views instead of client-side table scans.

Key views:

- `public.current_day_snapshot`
  - per-user daily facts (tasks/habits/journal/workouts/deep-work minutes)
  - oldest pending task title + newest active habit title
- `public.current_day_snapshot_history_14d`
  - 14-day factual history for momentum calculation

Design rule:

- SQL returns facts only (counts/booleans/dates/titles)
- TypeScript performs scoring/intelligence logic

---

# 5. BRAIN ENGINE ARCHITECTURE

Brain Engine lives in `src/features/system`.

Core pieces:

- `engine/analyzeMomentum.ts`
  - computes momentum/trend from 14-day factual history
- `engine/generateDirectives.ts`
  - urgency-based single actionable directive
- `engine/systemEngine.ts`
  - combines momentum, directive, issues, explanation
- `api/useSystemStatus.ts`
  - fetches snapshot views, builds runtime system status
- `components/SystemStatusCard.tsx`
  - Mission Control top card with next move CTA
- `components/DailyBriefing.tsx`
  - tone message from momentum band

Cross-module reactivity:

- successful mutations invalidate `['system-status']`
- Brain state refreshes immediately after task/habit/journal/fitness/time actions

---

# 6. TIME OS ARCHITECTURE

Time OS lives in `src/features/time-os` and uses `public.time_logs`.

Key behavior:

- one active timer per user (`end_time is null` unique index)
- optional task linkage (`task_id`)
- strict bucket categories
- manual log support
- global timer surface visible across pages

UI + analytics:

- `GlobalTimerBar` for global active/idle focus entrypoint
- `TimeInsights` for today total, distribution, and 7-day trend

---

# 7. EVENTS PIPELINE

The `events` table is the cross-domain analytics backbone.

Current active domains emit events for core mutations:

- mind-os
- productivity-hub
- progress-hub
- fitness-os
- finance-os
- mission-control/system analytics consumers

Event writes are safe-wrapped so user actions are not blocked if analytics writes fail.

---

# 8. DATABASE AND SECURITY MODEL

Principles:

- user-owned rows (`auth.uid() = user_id`)
- RLS enabled on domain tables
- soft deletes for long-term integrity where required
- migration-driven schema evolution only

---

# 9. UI SYSTEM CONTRACT

Current primary shell direction is true-black utility styling in critical system surfaces:

- page background `#000000`
- card/surface `#0a0a0a`
- borders `#222222`

Navigation:

- desktop rail + expand/collapse
- mobile drawer + app-bar toggle
- nested module sub-navigation

---

# 10. RELEASE FLOW

Every release should pass:

- `npm run lint`
- `npm run build`
- `npm run verify:release`
- module smoke checks (Mission, Mind, Productivity/Planning, Progress, Fitness, Time, Brain)

---

# 11. NEXT ARCHITECTURAL PRIORITIES

1. Expand Finance OS beyond ledger (recurring, savings, and planning-aware summaries).
2. Expand events coverage and analytics depth across every mutation path.
3. Strengthen Brain directive quality with deeper cross-domain pressure signals.
4. Keep SQL facts and TS intelligence strictly separated.

---

# 12. FINANCE OS ARCHITECTURE

Finance OS lives in `src/features/finance-os`.

Current shape:

- `api/useFinance.ts`
  - month-scoped transaction reads
  - add transaction mutation
  - derived finance summary contract (budget pressure + waste analytics)
- `components/TransactionForm.tsx`
  - quick-log, mobile-first form
  - category support with custom override
  - need/want flag capture
  - decision feedback loop toasts (safe-limit and projection warnings)
- `pages/FinanceDashboard.tsx`
  - behavioral KPI cards
  - weekly burn micro-bars (Tailwind-only, no chart libs)
  - aggressive ledger badges for NEED/WANT

Data contract:

- primary table: `public.finance_transactions`
- user ownership enforced by RLS
- all derived values computed in TypeScript data layer (UI render-only)
