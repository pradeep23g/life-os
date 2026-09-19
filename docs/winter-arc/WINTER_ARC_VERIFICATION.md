---
title: "Winter Arc — Verification Matrix"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc Verification Plan

This document outlines the verification plan for each implementation wave of the Winter Arc campaign. All existing verification gates must pass, and new features must add sufficient test coverage.

## Existing Verification Baseline [CURRENT]

The repository currently utilizes a 6-tier verification system that acts as an absolute baseline:

1.  **Static Analysis:** `npm run lint` (0 errors), `npx tsc -b` (0 errors), `npm run build` (clean)
2.  **Offline Contracts:** `node verify-integrity-contracts.mjs` (6/6 pass)
3.  **Offline Adversarial:** `node verify-adversarial-attacks.mjs` (6/6 pass)
4.  **Remote Smoke:** `node run-smoke-validation.mjs` (29/29 pass)
5.  **Browser E2E:** `node run-browser-verification.mjs` (60/60 pass)
6.  **Combined Gate:** `npm run verify:release` (exit 0)

> [!IMPORTANT]
> All these MUST continue passing throughout Winter Arc development.

## Per-Wave Verification Plan [FUTURE]

### Wave 0 - Documentation
*   [ ] All documents created and cross-linked.
*   [ ] ADRs recorded for key decisions.
*   [ ] Existing verification gates still pass.

### Wave 1 - Identity
*   [ ] Type checks pass with new components.
*   [ ] Build succeeds with design system changes.
*   [ ] Visual regression (screenshot comparison).
*   [ ] Theme switching works.
*   [ ] Avatar renders correctly.
*   [ ] Life State computes correctly from existing data.
*   [ ] Personal stats derive from real data.
*   [ ] Mission Control redesign shows all existing data.
*   [ ] Mobile responsive behavior verified.
*   [ ] Existing E2E tests still pass.

### Wave 2 - Daily Presence
*   [ ] Android app builds successfully.
*   [ ] Auth flow works on Android.
*   [ ] Quick actions execute correctly.
*   [ ] Notifications deliver at correct times.
*   [ ] Widget data refreshes correctly.
*   [ ] Life Pulse logs save to database.
*   [ ] Time-of-day mode switches at correct IST boundaries.
*   [ ] All existing web functionality unaffected.

### Wave 3 - Progression
*   [ ] XP calculations are deterministic and correct.
*   [ ] Level thresholds compute correctly.
*   [ ] Achievements unlock at correct conditions.
*   [ ] Avatar progression displays correctly.
*   [ ] Season tracking works.
*   [ ] No XP gaming exploits possible.
*   [ ] Existing domain functionality unaffected.

### Wave 4 - Knowledge
*   [ ] Knowledge resources CRUD works.
*   [ ] Book/media progress tracking works.
*   [ ] Learning OS milestones/projects/reflections UI works.
*   [ ] Events emit for new mutations.
*   [ ] Integration between Knowledge Vault and Learning OS works.

### Wave 5 - Fitness
*   [ ] Fitness UI rework shows all existing data.
*   [ ] No data loss during UI migration.
*   [ ] PR tracking works.
*   [ ] Avatar-fitness integration works.
*   [ ] Duplicate components eliminated.

### Wave 6 - Reporting
*   [ ] Report generation accuracy.
*   [ ] Weekly/monthly/seasonal generation.
*   [ ] Export correctness.
*   [ ] Raw-data reconciliation.

### Wave 7 - Reflection
*   [ ] Recovery OS detects low momentum correctly.
*   [ ] Experiments track baseline and result data.
*   [ ] Pattern Engine produces meaningful correlations.
*   [ ] Timeline aggregates from all sources.
*   [ ] No false correlations presented as causation.

### Wave 8 - API/MCP
*   [ ] API authentication works.
*   [ ] Scope enforcement prevents unauthorized access.
*   [ ] Rate limiting works.
*   [ ] Audit trail logs all mutations.
*   [ ] MCP tools return correct data.
*   [ ] Revocation immediately blocks access.

### Wave 9 - AI
*   [ ] AI provider integrations process requests correctly.
*   [ ] AI failures gracefully degrade.
*   [ ] AI never invents data.
*   [ ] AI outputs clearly labeled as inference/suggestion.
*   [ ] Privacy rules enforced via defined tool scopes.

### Wave 10 - Seasons & Achievements Admin Control Layer (ADR-023)
*   [ ] Authenticated access control on `/system/admin`.
*   [ ] Canonical JSON schema validation rejects malformed season/achievement payloads with line-numbered error reports.
*   [ ] Season CRUD mutations persist cleanly to `life_seasons` with RLS integrity.
*   [ ] One-click activation sets target season to active and marks previous seasons inactive.
*   [ ] Validated export dumps current active seasons and achievement catalog in canonical JSON.

### Wave 11 - Recovery OS & Grief Protocol (ADR-024)
*   [ ] Mode activation cleanly transitions UI theme to `.theme-recovery` (sage/sepia low-contrast OKLCH).
*   [ ] Spoons allocation replaces standard productivity task list with gentle energy allowance.
*   [ ] Habit streaks and Arc countdowns enter Protected Hibernation without breaking streaks or applying penalties.
*   [ ] Grief & Unburdening Journal records entries without computing momentum or score deductions.
*   [ ] Living Avatar emblem transitions to `recovering` state with slow breathing orbit.

### Wave 12 - Learning OS AI Curriculum Importer (ADR-025)
*   [ ] AI-generated curriculum JSON pastes into modal and validates against canonical schema.
*   [ ] Visual preview displays stages, sessions, estimated hours, and project milestones prior to commit.
*   [ ] Atomic batch transaction creates records across `learning_roadmaps`, `learning_stages`, `learning_sessions`, `learning_milestones`, and `learning_projects`.
*   [ ] Rollback occurs on any partial failure, guaranteeing zero orphaned rows.
*   [ ] Imported roadmap is immediately selectable and playable in `/learning-os`.

## Regression Rules

*   Every wave MUST pass all existing verification gates before merge.
*   New features MUST add their own verification tests.
*   Browser E2E suite MUST be extended for new UI features.
*   Smoke suite MUST be extended for new database structures.

## Documentation Verification

*   Feature status updated in `WINTER_ARC_MASTER_PLAN.md` after each wave.
*   ADRs created for architectural decisions made during implementation.
*   Current state context document updated quarterly.

---

## Related Documentation
*   [Release Gate Checklist](../operations/RELEASE_GATE_CHECKLIST.md)
*   [Dev Workflow](../operations/DEV_WORKFLOW.md)
*   [Winter Arc Master Plan](WINTER_ARC_MASTER_PLAN.md)
*   [Winter Arc Implementation Sequence](WINTER_ARC_IMPLEMENTATION_SEQUENCE.md)
