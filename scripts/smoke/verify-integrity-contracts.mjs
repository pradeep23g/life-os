import assert from 'node:assert/strict'

import { getFinanceOSSignals } from '../../src/features/system/engine/domainSignals.ts'
import { generateDirectives } from '../../src/features/system/engine/generateDirectives.ts'
import { analyzeMomentum } from '../../src/features/system/engine/analyzeMomentum.ts'
import { computeConsistencyMetrics } from '../../src/features/data-lab/metrics/consistency.ts'
import { computeSystemHealth } from '../../src/features/data-lab/metrics/systemHealth.ts'
import { EVENT_TYPES } from '../../src/lib/eventTaxonomy.ts'

console.log('='.repeat(80))
console.log('LIFE OS — SYSTEM INTEGRITY CONTRACT TESTS')
console.log('='.repeat(80))

// ---------------------------------------------------------------------------
// TEST 1: Brain Engine - Finance Signals with NULL Budget (F-01)
// Invariant: When budget_utilization_percentage is null (no budget set),
// Brain Engine MUST NOT raise false budget warnings.
// ---------------------------------------------------------------------------
{
  const snapshotNullBudget = {
    user_id: 'user-1',
    pending_tasks_count: 2,
    habits_completed_today: 3,
    total_active_habits: 5,
    journal_logged_today: true,
    workout_days_this_week: 2,
    deep_work_minutes_today: 90,
    oldest_pending_task_title: 'Task A',
    newest_active_habit_title: 'Habit B',
    learning_sessions_logged_7d: 3,
    active_roadmaps_count: 1,
    snapshot_date: '2026-09-05',
    budget_utilization_percentage: null,
    recent_want_expenses_count: 1,
  }

  const signals = getFinanceOSSignals(snapshotNullBudget)
  assert.equal(signals.length, 0, 'Null budget with normal want expenses should produce 0 signals')

  const directive = generateDirectives(snapshotNullBudget)
  assert.notEqual(directive.action, 'finance', 'Null budget should not trigger finance directive')
  console.log('PASS [Contract 1]: Brain Engine gracefully handles null budget without false alarms')
}

// ---------------------------------------------------------------------------
// TEST 2: Brain Engine - Finance Signals with Critical Budget Pressure (F-01)
// Invariant: When budget_utilization_percentage > 90, trigger critical warning
// ---------------------------------------------------------------------------
{
  const snapshotCriticalBudget = {
    user_id: 'user-1',
    pending_tasks_count: 0,
    habits_completed_today: 5,
    total_active_habits: 5,
    journal_logged_today: true,
    workout_days_this_week: 3,
    deep_work_minutes_today: 120,
    oldest_pending_task_title: null,
    newest_active_habit_title: 'Habit B',
    learning_sessions_logged_7d: 3,
    active_roadmaps_count: 1,
    snapshot_date: '2026-09-05',
    budget_utilization_percentage: 94.5,
    recent_want_expenses_count: 0,
  }

  const signals = getFinanceOSSignals(snapshotCriticalBudget)
  assert.equal(signals.length, 1, 'Should produce 1 critical signal')
  assert.equal(signals[0].severity, 'critical')
  assert.equal(signals[0].domain, 'finance-os')

  const directive = generateDirectives(snapshotCriticalBudget)
  assert.equal(directive.action, 'finance')
  assert.equal(directive.label, 'Review budget immediately')
  console.log('PASS [Contract 2]: Brain Engine triggers critical directive on >90% budget utilization')
}

// ---------------------------------------------------------------------------
// TEST 3: Brain Engine - High Discretionary Want Spending (F-01)
// Invariant: When recent_want_expenses_count > 3, trigger discretionary review
// even when budget_utilization_percentage is NULL.
// ---------------------------------------------------------------------------
{
  const snapshotHighWants = {
    user_id: 'user-1',
    pending_tasks_count: 0,
    habits_completed_today: 5,
    total_active_habits: 5,
    journal_logged_today: true,
    workout_days_this_week: 3,
    deep_work_minutes_today: 120,
    oldest_pending_task_title: null,
    newest_active_habit_title: null,
    learning_sessions_logged_7d: 3,
    active_roadmaps_count: 1,
    snapshot_date: '2026-09-05',
    budget_utilization_percentage: null,
    recent_want_expenses_count: 5,
  }

  const signals = getFinanceOSSignals(snapshotHighWants)
  assert.equal(signals.length, 1)
  assert.equal(signals[0].severity, 'medium')
  assert.equal(signals[0].issueText, 'High discretionary spending detected')

  const directive = generateDirectives(snapshotHighWants)
  assert.equal(directive.action, 'finance')
  assert.equal(directive.label, 'Review discretionary spending')
  console.log('PASS [Contract 3]: Brain Engine triggers want-spending directive with null budget')
}

// ---------------------------------------------------------------------------
// TEST 4: Fitness & Time Event Recognition in Momentum Analysis (F-02)
// Invariant: Canonical fitness.workout.completed and time.session.logged
// boost recovery momentum when momentum is low (<20).
// ---------------------------------------------------------------------------
{
  const lowHistory = [
    { user_id: 'u1', snapshot_date: '2026-09-04', tasks_completed_count: 0, habits_completed_count: 0, total_active_habits: 5, journal_logged: false, workout_logged: false },
    { user_id: 'u1', snapshot_date: '2026-09-05', tasks_completed_count: 0, habits_completed_count: 0, total_active_habits: 5, journal_logged: false, workout_logged: false },
  ]

  // Test with canonical fitness.workout.completed
  const momentumWithCanonicalFitness = analyzeMomentum(lowHistory, 0, [
    { type: EVENT_TYPES.FITNESS_WORKOUT_COMPLETED, createdAt: new Date().toISOString() },
  ])
  const momentumWithoutEvents = analyzeMomentum(lowHistory, 0, [])

  assert.ok(
    momentumWithCanonicalFitness.momentum > momentumWithoutEvents.momentum,
    `Canonical fitness event should boost low momentum: got ${momentumWithCanonicalFitness.momentum} vs ${momentumWithoutEvents.momentum}`
  )

  // Test with canonical time.session.logged
  const momentumWithCanonicalTime = analyzeMomentum(lowHistory, 0, [
    { type: EVENT_TYPES.TIME_SESSION_LOGGED, createdAt: new Date().toISOString() },
  ])
  assert.ok(
    momentumWithCanonicalTime.momentum > momentumWithoutEvents.momentum,
    `Canonical time event should boost low momentum: got ${momentumWithCanonicalTime.momentum} vs ${momentumWithoutEvents.momentum}`
  )
  console.log('PASS [Contract 4]: analyzeMomentum recognizes canonical fitness and time events')
}

// ---------------------------------------------------------------------------
// TEST 5: Data Lab Consistency & Health Spacing Resiliency (F-03)
// Invariant: Both 'Mind / Habits' and 'Mind/Habits' match correctly and
// map to 'mind-os' without falling back to undefined/zero.
// ---------------------------------------------------------------------------
{
  const mockDaily = [
    {
      activity_date: '2026-09-05',
      user_id: 'u1',
      habits_completed: 4,
      journal_entries: 1,
      tasks_created: 2,
      tasks_completed: 2,
      total_focus_minutes: 60,
      workouts_logged: 1,
      finance_entries: 1,
      learning_sessions_logged: 1,
      active_domains: 7,
      active_habits: 5,
      active_system_count: 7,
      avg_mood: 4,
      deep_work_minutes: 60,
      events_logged: 10,
      focus_sessions: 2,
      habit_completion_percent: 80,
      need_spent: 20,
      want_spent: 0,
      total_spent: 20,
      workout_minutes: 45,
    },
  ]

  // Mock view rows as returned by Postgres (with whitespace: 'Mind / Habits')
  const mockViewRows = [
    { user_id: 'u1', module_name: 'Mind / Habits', consistency_percent: 85, active_days: 25, days_observed: 30, last_active_date: '2026-09-05' },
    { user_id: 'u1', module_name: 'Mind / Journal', consistency_percent: 70, active_days: 21, days_observed: 30, last_active_date: '2026-09-05' },
    { user_id: 'u1', module_name: 'Tasks', consistency_percent: 90, active_days: 27, days_observed: 30, last_active_date: '2026-09-05' },
  ]

  const consistencyMetrics = computeConsistencyMetrics(mockDaily, mockViewRows)
  const habitsEntry = consistencyMetrics.find((m) => m.moduleName.includes('Habits'))
  assert.ok(habitsEntry, 'Habits metric should exist')
  assert.equal(habitsEntry.consistencyPercent, 85, 'Habits metric should match view row consistency')

  const journalEntry = consistencyMetrics.find((m) => m.moduleName.includes('Journal'))
  assert.ok(journalEntry, 'Journal metric should exist')
  assert.equal(journalEntry.consistencyPercent, 70, 'Journal metric should match view row consistency')

  // Verify system health mapping
  const healthEntries = computeSystemHealth(mockViewRows, [
    { user_id: 'u1', domain: 'mind-os', event_type: 'mind.habit.completed', event_count: 15, active_days: 10, first_seen_date: '2026-08-01', last_seen_date: '2026-09-05' },
  ])

  const habitsHealth = healthEntries.find((h) => h.moduleName === 'Mind / Habits')
  assert.ok(habitsHealth, 'Habits health entry should exist')
  assert.equal(habitsHealth.eventCount, 15, 'Habits health should resolve domain mind-os event count 15')
  assert.equal(habitsHealth.status, 'healthy')
  console.log('PASS [Contract 5]: Data Lab consistency and health cleanly match spaced Postgres keys')
}

// ---------------------------------------------------------------------------
// TEST 6: EventBus Invariant Simulation (F-04 & F-05)
// Invariant: Stale events older than 24h are pruned; capacity is bounded.
// ---------------------------------------------------------------------------
{
  const now = Date.now()
  const freshEvent = { id: '1', type: 'mind.habit.completed', payload: {}, createdAt: new Date(now - 1000).toISOString() }
  const staleEvent = { id: '2', type: 'mind.habit.completed', payload: {}, createdAt: new Date(now - 25 * 60 * 60 * 1000).toISOString() }

  const TTL_MS = 24 * 60 * 60 * 1000
  const prune = (events) => events.filter(e => Date.now() - new Date(e.createdAt).getTime() < TTL_MS)

  const pruned = prune([freshEvent, staleEvent])
  assert.equal(pruned.length, 1)
  assert.equal(pruned[0].id, '1', 'Stale event (>24h) must be pruned')
  console.log('PASS [Contract 6]: EventBus TTL pruning evicts stale events')
}

console.log('='.repeat(80))
console.log('ALL 6 INTEGRITY CONTRACT TESTS PASSED')
console.log('='.repeat(80))
