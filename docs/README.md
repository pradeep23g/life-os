# Life OS Documentation Index

This directory contains the canonical documentation for the Life OS platform, organized by domain:

## 📁 [architecture/](./architecture/)
Core system, database, and telemetry specifications.
- [SYSTEM_ARCHITECTURE.md](./architecture/SYSTEM_ARCHITECTURE.md) — Technical topology, cognitive boundaries, routing, and pipelines.
- [DATABASE_SCHEMA.md](./architecture/DATABASE_SCHEMA.md) — Authoritative schema for all 27 tables (26 active + 1 archive) and 15 SQL aggregation views.
- [EVENT_TAXONOMY.md](./architecture/EVENT_TAXONOMY.md) — Canonical dot-notation event taxonomy across all 7 domains (45 canonical event types).
- [MODULE_GUIDE.md](./architecture/MODULE_GUIDE.md) — Comprehensive guide for all 8 feature modules + System & Auth.
- [LIFE_RULES.md](./architecture/LIFE_RULES.md) — Core behavioral principles guiding feature design.
- [UI_SYSTEM.md](./architecture/UI_SYSTEM.md) — True-black design system, layouts, and component guidelines.

## 📁 [decisions/](./decisions/)
Architectural Decision Records (ADRs) and engineering rules.
- [ARCHITECTURE_DECISIONS.md](./decisions/ARCHITECTURE_DECISIONS.md) — ADR log (ADR-001 through ADR-011).
- [AI_ENGINEERING_CONSTITUTION.md](./decisions/AI_ENGINEERING_CONSTITUTION.md) — Non-negotiable engineering invariants.

## 📁 [operations/](./operations/)
Day-to-day development, quality gates, and agent orientation.
- [DEV_WORKFLOW.md](./operations/DEV_WORKFLOW.md) — Local setup, environment config, and testing.
- [RELEASE_GATE_CHECKLIST.md](./operations/RELEASE_GATE_CHECKLIST.md) — Automated and manual release verification checklist.
- [PROJECT_ROADMAP.md](./operations/PROJECT_ROADMAP.md) — Implemented phases and upcoming milestones.
- [AGENTS.md](./operations/AGENTS.md) — AI agent identity, philosophy, and operational invariants.

## 📁 [historical/](./historical/)
Historical changelog and future migration drafts.
- [CHANGELOG.md](./historical/CHANGELOG.md) — Milestone evolution log.
- [FUTURE_MIGRATIONS.md](./historical/FUTURE_MIGRATIONS.md) — Queued schema changes.
