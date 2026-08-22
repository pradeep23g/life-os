import type { DataLabDailyActivity } from '../api/useDataLab'
import type { BehaviorDriftMetrics, BehaviorDriftEntry, TrendDirection } from '../types/types'
import { percentChange } from '../utils/stats'

type DriftExtractor = {
  name: string
  getValue: (row: DataLabDailyActivity) => number
}

const DRIFT_EXTRACTORS: DriftExtractor[] = [
  { name: 'Workouts', getValue: (r) => r.workouts_logged },
  { name: 'Journal', getValue: (r) => r.journal_entries },
  { name: 'Deep Work', getValue: (r) => r.deep_work_minutes },
  { name: 'Tasks', getValue: (r) => r.tasks_completed },
  { name: 'Habits', getValue: (r) => r.habits_completed },
  { name: 'Finance', getValue: (r) => r.finance_entries },
  { name: 'Learning OS', getValue: (r) => r.learning_sessions_logged },
]

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function getDirection(delta: number): TrendDirection {
  if (delta > 5) return 'up'
  if (delta < -5) return 'down'
  return 'stable'
}

export function computeBehaviorDrift(
  dailyRows: DataLabDailyActivity[],
  periodLabel: string,
): BehaviorDriftMetrics {
  if (dailyRows.length < 4) {
    return { entries: [], periodLabel }
  }

  const sorted = [...dailyRows].sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date),
  )

  const midpoint = Math.floor(sorted.length / 2)
  const previousHalf = sorted.slice(0, midpoint)
  const currentHalf = sorted.slice(midpoint)

  const entries: BehaviorDriftEntry[] = DRIFT_EXTRACTORS.map((extractor) => {
    const currentAvg = mean(currentHalf.map(extractor.getValue))
    const previousAvg = mean(previousHalf.map(extractor.getValue))
    const delta = percentChange(currentAvg, previousAvg)

    return {
      moduleName: extractor.name,
      currentAvg,
      previousAvg,
      delta,
      direction: getDirection(delta),
    }
  })

  return { entries, periodLabel }
}
