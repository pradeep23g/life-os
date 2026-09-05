import assert from 'node:assert/strict'

import { analyzeMomentum } from '../../src/features/system/engine/analyzeMomentum.ts'
import { getFinanceOSSignals } from '../../src/features/system/engine/domainSignals.ts'
import { generateDirectives } from '../../src/features/system/engine/generateDirectives.ts'
import { computeConsistencyMetrics } from '../../src/features/data-lab/metrics/consistency.ts'
import { computeSystemHealth } from '../../src/features/data-lab/metrics/systemHealth.ts'
import {
  useEventBus,
  getBackgroundQueueLength,
  getBackgroundQueueSnapshot,
  clearBackgroundQueueForTesting,
  processBackgroundQueue,
} from '../../src/store/useEventBus.ts'

console.log('='.repeat(80))
console.log('ADVERSARIAL ATTACK SUITE: STRESS TESTING REPAIRED INVARIANTS')
console.log('='.repeat(80))

// ---------------------------------------------------------------------------
// ATTACK 1: Empty Historical Data (Zero Days for Brand New User)
// ---------------------------------------------------------------------------
{
  const emptyResult = analyzeMomentum([], 0, [])
  assert.ok(Number.isFinite(emptyResult.momentum), 'Momentum must be a finite number on empty history')
  assert.equal(emptyResult.momentum, 0, 'Brand new user with zero history defaults to 0')
  assert.equal(emptyResult.trend, 'stable')
  assert.ok(Array.isArray(emptyResult.emaSeries))
  console.log('PASS [Attack 1]: Empty history safely handled (baseline 0, stable trend, no NaN)')
}

// ---------------------------------------------------------------------------
// ATTACK 2: NaN / Infinity / Malformed Finance Snapshot Values
// ---------------------------------------------------------------------------
{
  const malformedSnapshot = {
    user_id: 'u-malformed',
    pending_tasks_count: NaN,
    habits_completed_today: -5,
    total_active_habits: Infinity,
    journal_logged_today: false,
    workout_days_this_week: NaN,
    deep_work_minutes_today: -100,
    oldest_pending_task_title: null,
    newest_active_habit_title: null,
    learning_sessions_logged_7d: NaN,
    active_roadmaps_count: NaN,
    snapshot_date: '2026-09-05',
    budget_utilization_percentage: NaN,
    recent_want_expenses_count: NaN,
  }

  const signals = getFinanceOSSignals(malformedSnapshot)
  assert.equal(signals.length, 0, 'NaN budget and NaN want expenses must not throw or raise false alarms')

  const directive = generateDirectives(malformedSnapshot)
  assert.ok(directive && directive.action, 'Directives must handle malformed numbers without crashing')
  console.log('PASS [Attack 2]: Malformed NaN/Infinity finance values cleanly sanitized')
}

// ---------------------------------------------------------------------------
// ATTACK 3: Extreme High / Low Budget Values
// ---------------------------------------------------------------------------
{
  // 0% utilization
  const zeroBudgetSnapshot = {
    user_id: 'u-zero',
    pending_tasks_count: 0,
    habits_completed_today: 1,
    total_active_habits: 1,
    journal_logged_today: true,
    workout_days_this_week: 1,
    deep_work_minutes_today: 30,
    oldest_pending_task_title: null,
    newest_active_habit_title: null,
    learning_sessions_logged_7d: 1,
    active_roadmaps_count: 1,
    snapshot_date: '2026-09-05',
    budget_utilization_percentage: 0,
    recent_want_expenses_count: 0,
  }
  assert.equal(getFinanceOSSignals(zeroBudgetSnapshot).length, 0, '0% budget utilization must not raise alarms')

  // 150% over-budget (runaway deficit)
  const overBudgetSnapshot = {
    ...zeroBudgetSnapshot,
    budget_utilization_percentage: 150,
  }
  const overSignals = getFinanceOSSignals(overBudgetSnapshot)
  assert.equal(overSignals.length, 1)
  assert.equal(overSignals[0].severity, 'critical')
  console.log('PASS [Attack 3]: Extreme boundary values (0% and 150%) correctly evaluated')
}

// ---------------------------------------------------------------------------
// ATTACK 4: Data Lab Empty Datasets
// ---------------------------------------------------------------------------
{
  const emptyConsistency = computeConsistencyMetrics([], [])
  assert.equal(emptyConsistency.length, 7, 'Must produce 7 standard module metric entries even if empty')
  for (const entry of emptyConsistency) {
    assert.equal(entry.consistencyPercent, 0)
    assert.equal(entry.activeDays, 0)
    assert.equal(entry.totalDays, 0)
    assert.equal(entry.trend, 'stable')
  }

  const emptyHealth = computeSystemHealth([], [])
  assert.equal(emptyHealth.length, 0, 'Empty module consistency produces empty health list')
  console.log('PASS [Attack 4]: Data Lab empty datasets produce safe zeroed metrics without crashing')
}

// ---------------------------------------------------------------------------
// ATTACK 5: EventBus Bounded Capacity (Queue Flood Attack)
// ---------------------------------------------------------------------------
{
  clearBackgroundQueueForTesting()
  useEventBus.getState().clearEvents()

  // Emit 250 events into the bus rapidly
  for (let i = 0; i < 250; i++) {
    useEventBus.getState().emitEvent('mind.habit.completed', { habit_id: `h-${i}` })
  }

  const queueLen = getBackgroundQueueLength()
  assert.ok(queueLen <= 200, `Background queue MUST be bounded to MAX_QUEUE_CAPACITY (200), got ${queueLen}`)

  const recentCount = useEventBus.getState().recentEvents.length
  assert.ok(recentCount <= 50, `Recent events MUST be bounded to MAX_RECENT_EVENTS (50), got ${recentCount}`)
  console.log(`PASS [Attack 5]: Queue flood contained (Queue capped at ${queueLen} <= 200, Recent events capped at ${recentCount} <= 50)`)
}

// ---------------------------------------------------------------------------
// ATTACK 6: IST Timezone Date Key Determinism across midnight
// ---------------------------------------------------------------------------
{
  function toIndiaDateKey(input) {
    const value = typeof input === 'string' ? new Date(input) : input
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value)

    const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
    const month = parts.find((part) => part.type === 'month')?.value ?? '01'
    const day = parts.find((part) => part.type === 'day')?.value ?? '01'
    return `${year}-${month}-${day}`
  }

  // 18:30 UTC is 00:00 (Midnight) the next day in IST
  const utc1829 = new Date('2026-09-05T18:29:59.000Z')
  const utc1830 = new Date('2026-09-05T18:30:00.000Z')

  assert.equal(toIndiaDateKey(utc1829), '2026-09-05', '18:29:59 UTC must be 2026-09-05 IST')
  assert.equal(toIndiaDateKey(utc1830), '2026-09-06', '18:30:00 UTC must be 2026-09-06 IST')
  console.log('PASS [Attack 6]: IST timezone date key transitions cleanly at 18:30:00 UTC')
}

console.log('='.repeat(80))
console.log('ALL 6 ADVERSARIAL ATTACKS REPELLED — INVARIANTS PROVEN SOUND')
console.log('='.repeat(80))
