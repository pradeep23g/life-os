# Life OS Winter Arc: Reporting, Export & Archive (Wave 6) & Advanced Engines (Wave 7)

This document outlines the architecture and requirements for the Reporting System, Recovery OS, Life Experiments, Pattern Engine, and Life Timeline. These features encompass Waves 6 and 7 of the Winter Arc master plan.

## Document Status
- [CURRENT] Represents the architectural design and planned implementation strategy.

---

## Reporting System (Wave 6)

### Report Types

#### Weekly Report
**Data Inputs:**
- `current_day_snapshot_history_14d` (last 7 days)
- `data_lab_weekly_system_score_12w` (current week)
- `data_lab_daily_activity_90d` (last 7 days)
- `events` table (last 7 days)
- `system_metrics` (last 7 days)
- All domain tables for week's activity

**Calculations:**
- Week system score (from existing view)
- Momentum trend (existing Brain Engine)
- Total focus time this week
- Learning sessions this week
- Fitness summary (workouts, minutes)
- Habits: completion rate, streak status
- Tasks: created vs completed
- Financial: total spend, need vs want breakdown
- Best day (highest daily score)
- Weakest day (lowest daily score)
- Biggest win (highest single-domain achievement)
- Biggest gap (most neglected domain)
- System warnings (domains with declining trends)
- Next-week priority suggestion

#### Monthly Report
- Month-over-month attribute shifts
- Activity trends (4-week comparison)
- Achievements unlocked this month
- Failed/abandoned goals
- Behavioral patterns (recurring weekly patterns)
- Financial monthly summary
- Fitness monthly progression
- Learning monthly progression
- Season progress (if active)

#### Seasonal Report
- Season objectives vs actual progress
- Attribute evolution over season
- Major milestones achieved
- Key statistics across all domains
- Season achievements
- Recommendations for next season

#### Yearly Report
- Annual progression overview
- Year-over-year comparison ([FUTURE] - needs 2+ years of data)
- Major life milestones
- Annual statistics
- Life OS Yearbook concept ([FUTURE])

#### Custom Date Range
- User-specified start/end dates
- Same metrics as weekly/monthly but for a custom period

### Report Generation Strategy
- Reports are **COMPUTED ON DEMAND** from existing data.
- Reports are calculated deterministically on the client from server data.
- Reports use existing SQL views + additional ad-hoc queries.
- NO archive persistence in V1 (ADR-020).

### Export Formats

| Format | Use Case | Implementation Strategy | Status |
|--------|----------|-------------------------|--------|
| PDF | Formal report sharing | Native export or client-side lib | [UI MISSING] |
| Markdown | Developer/text-friendly | String template generation | [UI MISSING] |
| HTML | Web-friendly sharing | Client render to static HTML | [UI MISSING] |
| JSON | Data export/backup | Direct data serialization | [UI MISSING] |
| CSV | Spreadsheet analysis | Per-domain data tables | [UI MISSING] |

### Report Archive
- Rejected — ADR-020. No archive persistence in V1. Reports are derived on-demand and calculated deterministically.

### Visualization
- Chart library is decided as Recharts (ADR-021) for visualizations.

---

## Recovery OS (Wave 7)

### Purpose
A targeted low-momentum intervention system. **NOT** a medical diagnosis or mental health treatment.

### Trigger Signals (from existing data)
- Momentum < 20 (Brain Engine)
- Multiple streak breaks in 7 days
- No journal entries in 5+ days
- No workouts in 10+ days
- Falling momentum trend for 5+ days
- Low mood scores (journal mood < 2 average)

### Recovery Flow
1. LOW MOMENTUM DETECTED
2. "What happened?" prompt
3. Show what helped before (historical data)
4. Choose small recovery action
5. Resume momentum tracking

### Data Approach
- PRIMARILY a lens on existing data (no new tables initially).
- Recovery patterns derived from historical momentum recovery events.
- Optional: `recovery_actions` log (lightweight table or events-based).
- **CRITICAL**: This is self-reflection/productivity recovery. Must NOT be represented as medical diagnosis.

---

## Life Experiments (Wave 7)

### Model
- `experiments` table: `id`, `user_id`, `title`, `hypothesis`, `duration_days`, `start_date`, `end_date`, `tracked_metrics` (text[]), `baseline_data` (jsonb), `result_data` (jsonb), `conclusion`, `status` (active/completed/abandoned)
- Single table, minimal complexity.
- Tracked metrics sourced from existing data (focus time, habits, workouts, etc.).
- Before/after comparison computed from existing views.

### Example Experiment
**"No social media before noon — 14 days"**
- Baseline: average deep work minutes in 14 days before experiment
- Tracked: deep work minutes during experiment
- Result: computed difference
- Conclusion: user-written
- Decision: Continue / Stop

---

## Personal Pattern Engine (Wave 7)

### Pattern Detection Sources
- `time_logs`: Focus time patterns by day/hour
- `habit_logs`: Completion patterns, abandonment points
- `workouts`: Training frequency patterns
- `events`: Activity distribution patterns
- `system_metrics`: Momentum trajectory patterns

### Example Patterns
- Peak focus windows (most productive hours)
- Recurring low-productivity periods
- Workout impact on next-day productivity
- Recurring habit abandonment (specific days)
- Content consumption vs completion rates
- Recovery speed after low periods

### CRITICAL DISTINCTION
- Present findings as **CORRELATION**, never **CAUSATION**.
- *Example*: "You tend to have higher focus scores on days after workouts" NOT "Workouts cause better focus".
- Data-backed observations, not clinical claims.

### Implementation
- SQL-based pattern queries on existing data.
- Client-side statistical analysis (means, medians, correlations).
- No machine learning required initially.
- Could feed into AI Gateway later for natural language explanations.

---

## Life Timeline (Wave 7)

### Sources (ALL from existing data)
- Seasons (if seasons table exists)
- Learning milestones achieved
- Achievement unlocks
- Learning roadmap completions
- Workout milestones (PR records)
- Journal entries (notable moods)
- System metrics (momentum peaks)
- Weekly/monthly reports generated
- Major events from events table

### Implementation
- Timeline VIEW over existing tables (no new table needed), or client-side query aggregation across multiple tables.
- Interactive: "Show me September 2026" surfaces complete context.
- Chronological scroll with filterable event types.

---

## Related Documentation
- [Winter Arc Master Plan](WINTER_ARC_MASTER_PLAN.md)
- [Winter Arc Data Model](WINTER_ARC_DATA_MODEL.md)
- [Winter Arc Telemetry](WINTER_ARC_TELEMETRY.md)
- [Database Schema](../architecture/DATABASE_SCHEMA.md)
