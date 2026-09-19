---
title: "Life OS — Development Workflow"
status: canonical
last_synchronized_commit: "77d1a5b"
domain: operations
---

# LIFE OS — DEVELOPMENT WORKFLOW

**Status:** Authoritative Development Guide  
**Last Synchronized:** September 2026 (Phase 1 Baseline / Commit `77d1a5b`)

---

## 1. Quick Start & Prerequisites

### Prerequisites
- Node.js 20+ / npm 10+
- Supabase project (hosted PostgreSQL)

### Local Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate Supabase connection variables:
   ```ini
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start local development server:
   ```bash
   npm run dev
   ```

---

## 2. Core Scripts & Quality Gates

### 2.1 Build & Static Analysis

| Command | Purpose | Prerequisites |
|---|---|---|
| `npm run dev` | Starts Vite local development server on `localhost:5173` | Node.js 20+ |
| `npm run verify:docs` | Verifies documentation drift against code truth (`scripts/verify-doc-drift.mjs`) | Node.js 20+ |
| `npm run lint` | Runs ESLint across the codebase (`eslint .`) | None |
| `npm run build` | Runs TypeScript compiler (`tsc -b`) and Vite production bundle | None |
| `npm run verify:release` | Official composite release gate: runs `verify:docs`, `lint`, `tsc -b`, and `vite build` | None |

### 2.2 Verification Test Suites

Life OS maintains a 4-tier automated verification hierarchy:

| Test Suite | Command | Environment | Coverage & Scope |
|---|---|---|---|
| **Integrity Contracts** | `npx tsx scripts/smoke/verify-integrity-contracts.mjs` | Offline / In-memory | 6 contract checks: Brain Engine null/critical budget handling, discretionary want spending, canonical fitness/time momentum boost, Data Lab spacing normalization (`'Mind / Habits'`), and EventBus 24h TTL eviction. |
| **Adversarial Attacks** | `npx tsx --env-file=.env scripts/smoke/verify-adversarial-attacks.mjs` | Offline / In-memory | 6 attack vectors: zero-history user cold start, NaN/Infinity snapshot values, extreme budget ratios (0% & 150%), empty Data Lab datasets, EventBus queue flood (250 items bounded to 200), and IST timezone midnight transitions (18:30 UTC). |
| **Backend Smoke Validation** | `node scripts/smoke/run-smoke-validation.mjs` | Hosted Supabase | 29 live integration checks: auth bootstrap, all 7 module CRUD operations, canonical event logging (`events`), queue processing (`system_event_queue`), Evening Sync aggregation (`system_metrics`), and all 15 SQL views. |
| **Headless Browser E2E** | `node scripts/smoke/run-browser-verification.mjs` | Headless Chromium (Playwright) + Hosted Supabase | 60 end-to-end user checks: Vite server spin-up, user login, navigation across all 8 modules, interactive DOM forms, Evening Sync button execution, real-time query invalidations, and automated teardown. |

---

## 3. Database Safety & Migration Workflow

- All schema additions must be written as sequential migrations in `supabase/migrations/` using timestamp format: `YYYYMMDDNNNN_description.sql`.
- Never mutate existing columns or drop tables without an explicit archive migration.
- Always include `security_invoker = true` on newly created views.
- Ensure all mutation hooks emit canonical `EVENT_TYPES` from `src/lib/eventTaxonomy.ts`.

---

## 4. Cache Invalidation Standard

All mutations must explicitly invalidate affected React Query cache keys:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['mind-os', 'habits'] })
  queryClient.invalidateQueries({ queryKey: ['system-status'] })
}
```
Standard query key namespaces:
- `['mission-control', ...]`
- `['mind-os', 'habits']`, `['mind-os', 'journals']`
- `['productivity-hub', 'tasks']`, `['productivity-hub', 'planning']`
- `['learning-os', 'roadmaps']`, `['learning-os', 'sessions']`
- `['fitness-os', 'workouts']`, `['fitness-os', 'exercises']`
- `['time-os', 'logs']`, `['time-os', 'analytics']`
- `['finance-os', 'transactions']`
- `['data-lab', ...]`
- `['system-status']`

---

## 5. Documentation Synchronization & Drift Prevention Standard

All code and architecture changes must maintain 100% truth parity with documentation.

### 5.1 YAML Frontmatter Requirement
Every Markdown document in `docs/` must start with structured YAML frontmatter:
```yaml
---
title: "<Document Title>"
status: canonical | draft | archived | planned
last_synchronized_commit: "<git-hash>"
domain: architecture | operations | decisions | features | winter-arc
---
```

### 5.2 Verification Gate
Before opening a pull request or merging code, execute the documentation drift verification check:
```bash
npm run verify:docs
```
This automated gate enforces:
1. **Database Schema Parity:** Every base table in `supabase/migrations/` is documented in `DATABASE_SCHEMA.md`.
2. **Route Coverage:** Every active route in `src/App.tsx` is documented in `SYSTEM_ARCHITECTURE.md`.
3. **ADR Monotonicity:** ADR identifiers form a gapless, non-colliding monotonic registry.
4. **Link Integrity:** All internal relative markdown links resolve to existing files on disk.
5. **Task Parity:** `tasks/todo.md` has no unchecked items for merged codebase functionality.
