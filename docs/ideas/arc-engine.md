# Arc Engine: Prescriptive Seasonal Campaigns

## Problem Statement
How might we transform the hardcoded, static Winter Arc experience into a dynamic seasonal campaign engine that holds the user accountable against their self-declared commitments through ambient telemetry evaluation and zero-overhead AI authoring?

## Recommended Direction
Build an **Ambient Telemetry Campaign Engine** coupled with a **Zero-Overhead Ingestion Protocol** modeled after Learning OS (`ImportCurriculumModal`).

Instead of burdening the user with a fragile 15-field visual form that gets used only 2–4 times a year, the Arc Engine leverages an external LLM (Claude, ChatGPT) via a structured interrogation prompt. The user copies the canonical prompt template (`ARC_PROMPT_TEMPLATE`), is grilled by their LLM on their seasonal vows, focus domains, principles, and telemetry metrics, and pastes back the generated JSON. Life OS immediately validates the configuration with Zod, renders a monumental visual preview of the campaign, and activates it with a single click.

Once active, the Arc is an integrated execution cockpit across Life OS:
1. **Deterministic Accountability (Strict Linear Pacing)**: Telemetry milestones query existing `data_lab_daily_activity_90d` telemetry without new tables, deriving pace status (`On Track`, `At Risk`, `Behind`, `Complete`) based on strict linear progression ($(\text{elapsed}/\text{total}) \times \text{target}$) with fixed system thresholds (85% on track, 60% at risk) and required daily recovery rates.
2. **Hybrid Focus Domains**: Campaigns declare focus domains that combine a qualitative life theme with an optional telemetry binding, anchoring both mindset and telemetry in the UI.
3. **Ambient Penetration**: The active Arc's identity, vow, and execution health penetrate the entire OS — illuminating the `AstrolabeOrbNav` outer orbit, dynamic shell titles, and the `HomePage` ambient horizon.
4. **Accountability Integrity & Strict Lifecycle**: 
   - `DRAFT → ACTIVE → COMPLETED → ARCHIVED`: Completing the arc (on-schedule or intentionally early) transitions to `COMPLETED`, records both `planned_end_date` and actual `completed_at`, and freezes all milestone telemetry. 
   - Before archival, a structured 5-question retrospective must be authored, transitioning the campaign to `ARCHIVED` as an immutable historical record.
   - Any amendments to active commitments strictly require a mandatory justification string appended to an immutable audit trail.
5. **Constrained Seasonal Aesthetics**: Visual identity is strictly bounded to a curated palette of ~8–12 Life OS accent colors and a fixed set of 8 canonical seasonal icons (`snowflake`, `sprout`, `sun`, `leaf`, `mountain`, `flame`, `wave`, `star`), preventing theme drift.

## Key Assumptions to Validate
- [ ] Telemetry views (`data_lab_daily_activity_90d`) reliably provide all registered metrics (deep work, focus, tasks, habits, workouts, journal, learning, active days) across custom date boundaries.
- [ ] External LLMs reliably generate valid `ArcConfig` JSON when provided the copyable interrogation prompt template.
- [ ] Strict linear pacing provides actionable daily feedback without excessive noise when buffered by the 85%/60% thresholds.
- [ ] Ambient presence on Home and Astrolabe Orb keeps seasonal focus top-of-mind without visual clutter.

## MVP Scope (v1)
- **Database Evolution**: Extend `life_seasons` with `status` ('draft', 'active', 'completed', 'archived'), `original_config`, `amendments`, `milestone_progress`, `retrospective`, `completed_at`, `archived_at`, and a single-active unique index per user.
- **Decoupling**: Eradicate `DEFAULT_SEASON` and hardcoded "Winter Arc 2026", "90-DAY", "13-Week" strings from arc components, `shellTitle.ts`, `useModuleColors.ts`, and `ModuleIcons.tsx`; render dynamic campaign data or an archive/empty state.
- **Telemetry Registry & Strict Pace Engine**: Deterministic milestone evaluation supporting 14 registered telemetry bindings + manual milestones, computing strict linear pace targets, status badges, and daily recovery rates.
- **Focus Domains Surface**: Render qualitative focus domains and bound telemetry metrics prominently on the Arc page.
- **Zero-Overhead Creation Modal (`CreateArcModal`)**: Learning OS pattern — copyable LLM prompt template, JSON textarea, live Zod validation enforcing curated colors and the 8-icon enum, visual preview cards, and 1-click activation.
- **Lifecycle & Early Completion Controls**: Support completing an active arc early or on schedule (`ACTIVE → COMPLETED`, freezing milestones and recording `completed_at`), mandatory amendment reasons, and archival with retrospective (`COMPLETED → ARCHIVED`).
- **Ambient Penetration**: Dynamic active arc title/accent/health badge in `AstrolabeOrbNav` and `HomePage` ambient horizon bar.
- **Manual Milestone Tracking**: UI controls to toggle manual milestones complete, persisted in `milestone_progress` JSONB.

## Not Doing (and Why)
- **Phased Rhythm pacing mode**: Scope creep for v1. Strict linear pacing is deterministic, simple, and matches the agreed architecture.
- **Heavy visual form builder with dynamic form arrays**: Unnecessary development and maintenance overhead for a workflow run only 2–4 times a year. The LLM-prompt + JSON preview pattern is 10x faster and higher quality.
- **Notification engine / push alerts**: Arc surfaces ambient health visually. Push notifications introduce background workers and notification fatigue.
- **Arbitrary theme generators / custom CSS**: Theme customization is restricted to curated accent colors and a fixed 8-icon set to maintain Life OS design integrity.
- **AI auto-confirmation of manual milestones**: Manual milestones are strictly human-authoritative. The user owns confirmation.
- **Cross-arc overlapping**: Strictly enforced 1 active arc per user to preserve focus and eliminate scheduling ambiguity.

## Open Questions
- Should completed arcs be exportable as markdown field reports for external journaling or portfolio display?
- For multi-week phases, should weekly checkpoints auto-inherit phase descriptions if no checkpoint note is provided?
