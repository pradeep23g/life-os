import type { DataLabDailyActivity } from '../../data-lab/api/useDataLab'
import type { TelemetryBindingKey } from '../constants.ts'

/**
 * Resolves a telemetry milestone binding against filtered DataLabDailyActivity records.
 *
 * ARCHITECTURAL DESIGN:
 * Life OS maps all seasonal telemetry directly onto the existing PostgreSQL view
 * `data_lab_daily_activity_90d`. This avoids creating redundant campaign ledger tables
 * or background cron jobs, while maintaining zero runtime overhead.
 *
 * @param binding - Telemetry binding descriptor (`{ source, metric }`)
 * @param dailyActivity - Filtered daily activity records bounded by campaign dates
 * @returns Aggregated scalar value (SUM, derived hours, or active days count)
 */
export function resolveBinding(
  binding: { source: string; metric: string } | undefined,
  dailyActivity: DataLabDailyActivity[],
): number {
  if (!binding || !binding.source || !binding.metric) {
    return 0
  }

  const key = `${binding.source}.${binding.metric}` as TelemetryBindingKey

  // Direct column SUM bindings
  const sumColumns: Partial<Record<TelemetryBindingKey, keyof DataLabDailyActivity>> = {
    'deep_work.total_minutes': 'deep_work_minutes',
    'focus.total_minutes': 'total_focus_minutes',
    'focus.session_count': 'focus_sessions',
    'tasks.completed_count': 'tasks_completed',
    'tasks.created_count': 'tasks_created',
    'habits.completed_count': 'habits_completed',
    'fitness.session_count': 'workouts_logged',
    'fitness.total_minutes': 'workout_minutes',
    'journal.entry_count': 'journal_entries',
    'learning.session_count': 'learning_sessions_logged',
  }

  const column = sumColumns[key]
  if (column) {
    return dailyActivity.reduce((sum, r) => sum + (Number(r[column]) || 0), 0)
  }

  // Derived hours binding (minutes ÷ 60)
  if (key === 'deep_work.total_hours') {
    const totalMinutes = dailyActivity.reduce((s, r) => s + (Number(r.deep_work_minutes) || 0), 0)
    return Math.floor(totalMinutes / 60)
  }

  // Active days COUNT bindings (rows where metric > 0)
  const activeDayColumns: Partial<Record<TelemetryBindingKey, keyof DataLabDailyActivity>> = {
    'habits.active_days': 'habits_completed',
    'fitness.active_days': 'workouts_logged',
    'active_days.total': 'active_system_count',
  }

  const activeCol = activeDayColumns[key]
  if (activeCol) {
    return dailyActivity.filter((r) => (Number(r[activeCol]) || 0) > 0).length
  }

  return 0
}
