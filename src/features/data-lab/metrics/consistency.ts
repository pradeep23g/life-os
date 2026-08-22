import type { DataLabDailyActivity, DataLabModuleConsistency } from '../api/useDataLab'
import type { ConsistencyMetricEntry, TrendDirection } from '../types/types'

type ModuleExtractor = {
  name: string
  isActive: (row: DataLabDailyActivity) => boolean
}

const MODULE_EXTRACTORS: ModuleExtractor[] = [
  { name: 'Mind/Habits', isActive: (r) => r.habits_completed > 0 },
  { name: 'Mind/Journal', isActive: (r) => r.journal_entries > 0 },
  { name: 'Tasks', isActive: (r) => r.tasks_created > 0 || r.tasks_completed > 0 },
  { name: 'Time OS', isActive: (r) => r.total_focus_minutes > 0 },
  { name: 'Fitness OS', isActive: (r) => r.workouts_logged > 0 },
  { name: 'Finance OS', isActive: (r) => r.finance_entries > 0 },
  { name: 'Learning OS', isActive: (r) => r.learning_sessions_logged > 0 },
]

function computeTrend(dailyRows: DataLabDailyActivity[], extractor: ModuleExtractor): TrendDirection {
  if (dailyRows.length < 6) return 'stable'

  const sorted = [...dailyRows].sort((a, b) => a.activity_date.localeCompare(b.activity_date))
  const midpoint = Math.floor(sorted.length / 2)
  const firstHalf = sorted.slice(0, midpoint)
  const secondHalf = sorted.slice(midpoint)

  const firstRate = firstHalf.filter(extractor.isActive).length / firstHalf.length
  const secondRate = secondHalf.filter(extractor.isActive).length / secondHalf.length

  const delta = secondRate - firstRate
  if (delta > 0.05) return 'up'
  if (delta < -0.05) return 'down'
  return 'stable'
}

export function computeConsistencyMetrics(
  dailyRows: DataLabDailyActivity[],
  moduleConsistencyRows: DataLabModuleConsistency[],
): ConsistencyMetricEntry[] {
  return MODULE_EXTRACTORS.map((extractor) => {
    const viewRow = moduleConsistencyRows.find((r) => r.module_name === extractor.name)

    const activeDays = dailyRows.filter(extractor.isActive).length
    const totalDays = dailyRows.length
    const consistencyPercent = totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0
    const trend = computeTrend(dailyRows, extractor)

    return {
      moduleName: extractor.name,
      consistencyPercent: viewRow?.consistency_percent ?? consistencyPercent,
      activeDays: viewRow?.active_days ?? activeDays,
      totalDays: viewRow?.days_observed ?? totalDays,
      lastActiveDate: viewRow?.last_active_date ?? null,
      trend,
    }
  })
}
