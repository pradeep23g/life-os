# LIFE OS — DOCUMENTATION INDEX

This file is the entry point for all Life OS documentation. Start here.

---

## Documentation Map

| Document | Purpose | When to Read |
|---|---|---|
| [AGENTS.md](AGENTS.md) | Project overview, modules, tech stack, folder structure, operating rules for AI agents | First read for any new contributor or AI agent |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) | Full technical architecture: routing, state, data flow, Brain Engine, events, database, UI contract | Before any architectural change or new feature |
| [DEV_WORKFLOW.md](DEV_WORKFLOW.md) | Development workflow: database rules, React Query patterns, frontend standards, git workflow | Before writing any code |
| [EVENT_TAXONOMY.md](EVENT_TAXONOMY.md) | All durable event constants, transient bus types, payload conventions | Before adding any mutation |
| [UI_SYSTEM.md](UI_SYSTEM.md) | Color system, typography, layout, navigation, component specs, responsive rules | Before building any UI |
| [MODULE_GUIDE.md](MODULE_GUIDE.md) | Deep per-module reference: internal structure, data contracts, event emission, rules | When working inside a specific feature module |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Complete table/column reference and migration history | Before any schema work |
| [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) | WHY major architectural decisions were made | When questioning an existing pattern or proposing changes |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Implemented phases and next priorities | Planning new features |
| [CHANGELOG.md](CHANGELOG.md) | Chronological project evolution | Understanding how the system evolved |
| [RELEASE_GATE_CHECKLIST.md](RELEASE_GATE_CHECKLIST.md) | Pre-deployment verification checklist | Before every release |
| [LIFE_RULES.md](LIFE_RULES.md) | Product philosophy and principles | When making product decisions |
| [AI ENGINEERING CONSTITUTION.md](AI%20ENGINEERING%20CONSTITUTION.md) | AI agent operating constitution | For AI agents on any task |
| [FUTURE_MIGRATIONS.md](FUTURE_MIGRATIONS.md) | Queued but not-yet-applied migrations | Before running any schema cleanup |

---

## Quick Reference

### Starting a new feature?
1. Read `SYSTEM_ARCHITECTURE.md` — identify the correct module
2. Read `MODULE_GUIDE.md` — understand the module's internal structure
3. Read `DEV_WORKFLOW.md` — follow the feature development flow
4. Read `EVENT_TAXONOMY.md` — add the correct durable event

### Debugging a data issue?
1. Read `DATABASE_SCHEMA.md` — verify table/column names
2. Check `FUTURE_MIGRATIONS.md` — is a migration pending?
3. Read `EVENT_TAXONOMY.md` — is the event being emitted correctly?

### Questioning an architectural decision?
→ Read `ARCHITECTURE_DECISIONS.md`

### Deploying a release?
→ Follow `RELEASE_GATE_CHECKLIST.md`

---

## Source of Truth Priority

When code and documentation disagree: **code wins**.

When documents disagree with each other:
1. `SYSTEM_ARCHITECTURE.md`
2. `DEV_WORKFLOW.md`
3. `EVENT_TAXONOMY.md`
4. `UI_SYSTEM.md`
5. `PROJECT_ROADMAP.md`
6. `LIFE_RULES.md`

---

## Documentation Health

Last full reconstruction: **2026-07-18**

This documentation was reconstructed from the codebase implementation, not from prior documentation. All content reflects the actual code state as of this date.
