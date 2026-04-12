# LIFE OS - DEVELOPMENT ROADMAP

This document defines the structured development plan for Life OS.

It guides both human developers and AI agents on what to build next while preserving domain boundaries and long-term scalability.

---

# DEVELOPMENT PHILOSOPHY

Life OS should evolve gradually.

Each system must follow:

- domain-isolated modular architecture
- relational database design
- analytics compatibility
- low-friction logging
- cognitive boundaries (reflection vs execution)

Features should only be added when the underlying architecture can support them safely.

---

# PHASE 1 - CORE SYSTEMS AND SHELL (IMPLEMENTED)

## 1.1 Global Shell and Mission Control

Build top-level routing and sidebar.
Mission Control provides aggregated system summaries.

Core widgets:

- active habits (Mind OS)
- pending tasks (Productivity Hub)
- journal signals (Mind OS)
- mood/consistency summaries

## 1.2 Mind OS Domain (Reflection)

Build nested routing for `/mind-os`.

Habit system:

- value-based and binary habits
- habit logs
- streak analytics
- mistakes, heals, and recovery context

Journal system:

- mood
- what went good
- what you've learned
- brief about day

## 1.3 Productivity Hub Domain (Execution)

Build nested routing for `/productivity-hub`.

Tasks system:

- Kanban states (`To Do`, `Doing`, `Done`)
- task creation
- priority levels
- status updates

---

# PHASE 2 - PROGRESS HUB (IMPLEMENTED)

Track long-term and short-term learning progress.

Modules:

- Progress Hub dashboard
- programming progress
- personal skills
- milestones
- challenges

---

# PHASE 3 - FITNESS OS (IMPLEMENTED V1)

Fitness OS tracks physical discipline in `/fitness-os`.

Focus:

- effort tracking over body metrics

Modules:

- dashboard with weekly cards
- workouts and aggregate exercise logs
- exercise library
- calendar popup and day details drawer
- 90-day effort heatmap

---

# PHASE 4 - FINANCE OS (NEXT MAJOR DOMAIN)

Finance OS should remain simple and behavior-focused inside `/finance-os`.

Initial scope:

- expense and income tracking
- monthly overview
- category-level awareness summaries

---

# PHASE 5 - ANALYTICS SYSTEM (IN PROGRESS)

Life OS analyzes behavioral patterns via the events pipeline.

Current foundation exists:

- `events` table
- domain event emission
- weekly consistency summaries

Next expansion:

- stronger cross-domain comparative insights
- more SQL-first aggregated views
- stable analytics contracts for dashboards

---

# PHASE 6 - PLANNING ENGINE (INSIDE PRODUCTIVITY HUB, IMPLEMENTED V1)

Planning connects goals to daily action.

Implemented core:

- weekly focus
- goals CRUD
- weekly plan items
- weekly review
- alignment health summaries

Next expansion:

- richer planning loops and coaching quality summaries

---

# PHASE 7 - TIME OS (IMPLEMENTED V1)

Time OS in `/time-os` tracks focused execution with low friction.

Implemented core:

- global active timer persisted in DB (`end_time is null`)
- optional task linkage from Productivity Hub
- strict buckets (`Academics`, `Deep Work`, `Admin`, `Fitness`, `Learning`)
- manual log entry
- lightweight analytics (today total, distribution, 7-day trend)

---

# PHASE 8 - BRAIN ENGINE (IMPLEMENTED V1, EVOLVING)

Brain Engine turns Life OS into an active decision system.

Implemented core:

- SQL-first snapshot views (`current_day_snapshot`, `current_day_snapshot_history_14d`)
- TS intelligence layer (momentum, trend, directive)
- issue detection + severity
- interactive next move in Mission Control
- daily briefing tone logic
- cross-module reactivity via `['system-status']` invalidation

Next expansion:

- deeper directive quality
- broader domain intelligence inputs

---

# SOCIAL FEATURES (LIMITED)

Life OS is primarily personal. Social features must stay minimal.

Avoid public comparison mechanics (for example, public leaderboards).

---

# AI INSIGHT SYSTEM (LONG TERM)

Long-term intelligence should explain patterns like:

- productivity on workout days
- habit consistency vs output
- mood vs execution patterns

This depends on robust historical event coverage and stable aggregation contracts.

---

# FINAL DEVELOPMENT RULE

All future systems must integrate with the events analytics pipeline and preserve strict cognitive boundaries.
