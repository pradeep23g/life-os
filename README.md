# Life OS

**A Personal Intelligence Operating System**  
Built with React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, and Supabase (PostgreSQL 15+).

---

## 🌌 Overview

Life OS is a **multi-domain behavioral operating system** designed to accumulate years of longitudinal life data, detect behavioral patterns, and surface real-time intelligence:

- **Cognitive Protection:** Clean separation between reflection (Mind OS) and execution pressure (Productivity Hub).
- **Single Source of Truth:** Centralized canonical event taxonomy (`src/lib/eventTaxonomy.ts`) and database aggregation views.
- **Brain Engine:** Real-time momentum scoring (EMA $\alpha=0.6$) and urgency-ranked daily directives.
- **True-Black Command Center:** Fast, accessible dark theme with Document Picture-in-Picture focus timer companion.

---

## 🧩 Active Domain Modules

```text
src/features/
├── auth/               — Supabase email/password authentication
├── mission-control/    — Executive aggregator dashboard & Brain Engine hero
├── mind-os/            — Habit tracker with 5/month streak heals & daily reflection journal
├── productivity-hub/   — Deadline tasks, weekly planning, goal alignment, & weekly reviews
├── learning-os/        — Structured skill roadmaps, curriculum stages, sessions, & study logs
├── fitness-os/         — Strength/cardio workouts, custom exercise catalog, & personal records
├── time-os/            — Focus time logs, single-timer constraint, & Document PiP overlay
├── finance-os/         — Behavioral spending ledger with Need vs Want classification
├── data-lab/           — 90-day activity rollups, module consistency, & telemetry health
└── system/             — Brain Engine algorithms, Evening Sync, & feedback toasts
```

---

## 🏗 Architecture & Data Flow

```text
Browser Client (React 19 + TypeScript 5.9 + Vite 7 SPA)
  ├── React Router v7 (Nested routing with route-level code splitting)
  ├── TanStack React Query v5 (Exclusive server state management)
  ├── Zustand v5 (Operational event bus for immediate UI reactivity)
  └── Supabase Client (PostgreSQL 15+ with Row Level Security)
        ↓
PostgreSQL Aggregation Layer (security_invoker = true)
  ├── current_day_snapshot & current_day_snapshot_history_14d (Brain Engine)
  ├── data_lab_daily_activity_90d & data_lab_weekly_system_score_12w (Data Lab)
  └── Domain Signal Views (habits, journal, tasks, time, fitness, finance, learning)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+ and npm 10+
- A Supabase project with database migrations applied

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/pradeep23g/life-os.git
cd life-os

# Configure environment
cp .env.example .env
# Edit .env with your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🧪 Quality & Release Verification Gates

Life OS maintains strict verification gates across static analysis, contract invariants, adversarial attacks, live backend smoke, and headless browser automation:

```bash
# 1. Static Lint Analysis
npm run lint

# 2. Production TypeCheck & Build
npm run build

# 3. Canonical Release Gate (combined lint + tsc + build)
npm run verify:release

# 4. Offline Integrity Contract Invariants (6/6 checks)
npx tsx scripts/smoke/verify-integrity-contracts.mjs

# 5. Offline Adversarial Attack & Boundary Stress Suite (6/6 checks)
npx tsx --env-file=.env scripts/smoke/verify-adversarial-attacks.mjs

# 6. Remote Supabase Backend Smoke Validation (29/29 live checks)
node scripts/smoke/run-smoke-validation.mjs

# 7. Headless Playwright Browser E2E Suite (60/60 live checks)
node scripts/smoke/run-browser-verification.mjs
```

---

## 📚 Documentation

Comprehensive architectural and operational specifications are available in the [`docs/`](./docs/) directory:

- [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Database Schema](./docs/architecture/DATABASE_SCHEMA.md)
- [Event Taxonomy](./docs/architecture/EVENT_TAXONOMY.md)
- [Module Guide](./docs/architecture/MODULE_GUIDE.md)
- [Development Workflow](./docs/operations/DEV_WORKFLOW.md)
- [Architecture Decisions (ADRs)](./docs/decisions/ARCHITECTURE_DECISIONS.md)
- [Release Gate Checklist](./docs/operations/RELEASE_GATE_CHECKLIST.md)
