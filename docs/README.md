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
- [ARCHITECTURE_DECISIONS.md](./decisions/ARCHITECTURE_DECISIONS.md) — ADR log (ADR-001 through ADR-025).
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

## 📁 [winter-arc/](./winter-arc/)
Phase 2 Winter Arc implementation-ready documentation system.
- [README.md](./winter-arc/README.md) — **Start here.** Document index, reading order, and drift prevention rules.
- [WINTER_ARC_MASTER_PLAN.md](./winter-arc/WINTER_ARC_MASTER_PLAN.md) — Complete feature inventory (46 features, 9 waves, change impact matrix).
- [WINTER_ARC_ARCHITECTURE.md](./winter-arc/WINTER_ARC_ARCHITECTURE.md) — Target architecture, layer definitions, integration boundaries.
- [WINTER_ARC_DATA_MODEL.md](./winter-arc/WINTER_ARC_DATA_MODEL.md) — Data model gap analysis (new tables vs existing reuse).
- [WINTER_ARC_TELEMETRY.md](./winter-arc/WINTER_ARC_TELEMETRY.md) — Event taxonomy audit and proposed new canonical events.
- [WINTER_ARC_DESIGN_SYSTEM.md](./winter-arc/WINTER_ARC_DESIGN_SYSTEM.md) — Visual identity, themes, time-of-day modes.
- [WINTER_ARC_MOBILE.md](./winter-arc/WINTER_ARC_MOBILE.md) — Android app, notifications, widgets, quick actions.
- [WINTER_ARC_PROGRESSION.md](./winter-arc/WINTER_ARC_PROGRESSION.md) — XP, levels, achievements, avatar, season engine.
- [WINTER_ARC_KNOWLEDGE.md](./winter-arc/WINTER_ARC_KNOWLEDGE.md) — Knowledge Vault, books, media, Learning OS completion.
- [WINTER_ARC_REPORTING.md](./winter-arc/WINTER_ARC_REPORTING.md) — Reports, export, Recovery OS, experiments, patterns, timeline.
- [WINTER_ARC_API.md](./winter-arc/WINTER_ARC_API.md) — REST API, MCP server, AI Gateway, security.
- [WINTER_ARC_IMPLEMENTATION_SEQUENCE.md](./winter-arc/WINTER_ARC_IMPLEMENTATION_SEQUENCE.md) — Wave dependencies, critical path, parallel opportunities.
- [WINTER_ARC_DECISIONS.md](./winter-arc/WINTER_ARC_DECISIONS.md) — Proposed ADRs (ADR-012 through ADR-022).
- [WINTER_ARC_VERIFICATION.md](./winter-arc/WINTER_ARC_VERIFICATION.md) — Per-wave verification plan and regression rules.

## 📄 Supplementary
- [Life OS — Winter Arc 2026 Master Change Specification.md](./Life%20OS%20—%20Winter%20Arc%202026%20Master%20Change%20Specification.md) — Original Winter Arc brainstorm and product vision.
