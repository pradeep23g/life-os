# LIFE OS — RELEASE GATE CHECKLIST

**Status:** Authoritative Release Verification Gate  
**Last Synchronized:** September 2026 (Phase 1 Baseline)

---

## 1. Automated Release Quality Gates

Before merging or cutting a release, all three commands MUST pass cleanly from repository root:

```bash
# 1. Static Lint Analysis
npm run lint

# 2. Production TypeCheck & Build
npm run build

# 3. Canonical Verification Gate
npm run verify:release
```

**Pass Criteria:**
- Zero ESLint errors.
- Zero TypeScript (`tsc -b`) compilation errors.
- Clean Vite production bundle generation in `dist/`.

---

## 2. Integrity Contract & Adversarial Verification (Offline)

Run both invariant test suites from root without requiring network access or external services:

```bash
# 2.1 Brain Engine & Data Lab Contract Invariants (6 checks)
npx tsx scripts/smoke/verify-integrity-contracts.mjs

# 2.2 Adversarial Attack & Boundary Stress Suite (6 checks)
npx tsx --env-file=.env scripts/smoke/verify-adversarial-attacks.mjs
```

**Verification Guarantees:**
- [x] Brain Engine gracefully handles null budget without false alarms.
- [x] Brain Engine triggers critical directive on >90% budget utilization.
- [x] Brain Engine triggers want-spending directive with null budget.
- [x] `analyzeMomentum` recognizes canonical `fitness.workout.completed` and `time.session.logged` events.
- [x] Data Lab consistency and health cleanly match spaced Postgres view keys (`'Mind / Habits'`).
- [x] EventBus TTL pruning evicts stale events (>24 hours).
- [x] Brand new user cold start handles empty history safely (0 baseline, stable trend, no `NaN`).
- [x] Malformed `NaN`/`Infinity` finance values cleanly sanitized.
- [x] Extreme boundary values (0% and 150% budget) correctly evaluated.
- [x] Data Lab empty datasets produce safe zeroed metrics without crashing.
- [x] EventBus queue flood contained (`MAX_QUEUE_CAPACITY` 200, `MAX_RECENT_EVENTS` 50).
- [x] IST timezone date key transitions cleanly at 18:30:00 UTC (midnight IST).

---

## 3. Remote Backend Smoke Validation (29 Live Checks)

When Supabase credentials are configured in `.env`, run the automated integration smoke test against the live backend:

```bash
node scripts/smoke/run-smoke-validation.mjs
```

**Scope & 29 Validated Steps:**
1. Temp user authentication bootstrap (`auth.users`).
2. Mind OS: Create habit (`habits`).
3. Mind OS: Log habit completion (`habit_logs`).
4. Mind OS: Uncomplete habit (log deletion).
5. Mind OS: Record streak break (`habit_streak_breaks`).
6. Mind OS: Apply streak heal token (`habit_streak_heals`).
7. Mind OS: Create journal entry (`journal_entries`).
8. Productivity Hub: Create task (`tasks`).
9. Productivity Hub: Complete task (`tasks`).
10. Productivity Hub: Create weekly plan (`weekly_plans`).
11. Productivity Hub: Create goal (`goals`).
12. Productivity Hub: Create weekly plan item (`weekly_plan_items`).
13. Productivity Hub: Link plan item to task.
14. Productivity Hub: Upsert weekly review (`weekly_reviews`).
15. Learning OS: Create roadmap (`learning_roadmaps`).
16. Learning OS: Create stage (`learning_stages`).
17. Learning OS: Create session (`learning_sessions`).
18. Learning OS: Log study session (`learning_session_logs`).
19. Fitness OS: Create workout (`workouts`).
20. Fitness OS: Log exercise set (`exercise_logs`).
21. Time OS: Log completed focus session (`time_logs`).
22. Finance OS: Log expense transaction (`transactions`).
23. System Event Queue: Insert transient operational signal (`system_event_queue`).
24. Evening Sync: Aggregate queue items into daily metrics (`system_metrics`).
25. Telemetry: Verify canonical event types in audit stream (`events`).
26. Postgres Views: Query `current_day_snapshot` (14 columns).
27. Postgres Views: Query `current_day_snapshot_history_14d` (7 columns).
28. Postgres Views: Query `data_lab_daily_activity_90d` (20 columns).
29. Teardown: Complete test data deletion and session purge.

---

## 4. Headless Browser E2E Verification (60 Checks)

Run the Playwright browser automation suite with live Vite dev server and Supabase backend:

```bash
node scripts/smoke/run-browser-verification.mjs
```

**Scope & 60 Validated Checks:**
- [x] Server initialization: Spin up Vite local server on ephemeral port and wait for readiness.
- [x] Auth flow: Log in via Playwright form submission and wait for `/mission-control` redirection.
- [x] Mission Control: Verify Brain Engine hero, real momentum score, metric cards, and Evening Sync trigger.
- [x] Mind OS: Render habits list, toggle habit done, verify React Query optimistic update.
- [x] Productivity Hub: Verify tasks list, view planning modal, toggle task completion.
- [x] Learning OS: Verify roadmap display, stage cards, and session list.
- [x] Fitness OS: Verify workout log table, exercise sets, and personal records.
- [x] Time OS: Verify timer container, controls, and session log history.
- [x] Finance OS: Verify monthly spend summary, transaction table, and Need/Want tags.
- [x] Data Lab: Verify Overview, Behavior, Telemetry tabs, 7 domain consistency cards, and 12-week score.
- [x] Evening Sync button: Click in DOM, observe queue drainage, and assert metrics update.
- [x] Teardown: Purge all created browser test entities from database and terminate Vite server.

---

## 5. Manual Core Journey Verification

### 5.1 Mission Control (`/mission-control`)
- [ ] Brain Engine hero renders live momentum score, trend, and directive CTA.
- [ ] Metric cards show real aggregates (Mood, Pending Tasks, Fitness volume, Habit streak).
- [ ] Evening Sync card successfully processes pending signals.

### 5.2 Mind OS (`/mind-os`)
- [ ] Habits: Creation, counter adjustment, done toggle, streak break and heal flow.
- [ ] Journal: Multi-entry creation with 1–5 mood rating and reflection notes.

### 5.3 Productivity Hub (`/productivity-hub`)
- [ ] Tasks: Grouped list renders by deadline type; complete toggle updates state.
- [ ] Planning: Weekly focus, goals, plan items, and weekly review modals work seamlessly.

### 5.4 Learning OS (`/learning-os`)
- [ ] Roadmaps: Create roadmap, add stages, add sessions.
- [ ] Study Logging: Log study session duration; verify progress calculation.

### 5.5 Fitness OS (`/fitness-os`)
- [ ] Workouts: Live workout timer, add exercise sets/reps, complete workout.
- [ ] Library & PRs: Custom exercise management and PR records display.

### 5.6 Time OS (`/time-os`)
- [ ] Single active timer constraint enforced.
- [ ] Document Picture-in-Picture (PiP) window opens and operates controls.
- [ ] Completed sessions appear in time distribution analytics.

### 5.7 Finance OS (`/finance-os`)
- [ ] Transaction creation with Need vs Want toggle.
- [ ] Monthly total spent and category distribution reflect newly logged expenses.

### 5.8 Data Lab (`/data-lab`)
- [ ] Overview: Weekly score, contribution calendar, activity histogram.
- [ ] Behavior: 30-day module consistency and habit streak rivers.
- [ ] Telemetry: Event coverage stream and silent event detector.
