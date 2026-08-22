import type { DataLabDailyActivity } from '../api/useDataLab'
import type { StreakMetricEntry, StreakSegment } from '../types/types'
import { streakify } from '../utils/stats'

type StreakExtractor = {
  name: string
  isActive: (row: DataLabDailyActivity) => boolean
}

const STREAK_EXTRACTORS: StreakExtractor[] = [
  { name: 'Habits', isActive: (r) => r.habits_completed > 0 },
  { name: 'Journal', isActive: (r) => r.journal_entries > 0 },
  { name: 'Deep Work', isActive: (r) => r.deep_work_minutes > 0 },
  { name: 'Workouts', isActive: (r) => r.workouts_logged > 0 },
  { name: 'Tasks', isActive: (r) => r.tasks_completed > 0 || r.tasks_created > 0 },
  { name: 'Finance', isActive: (r) => r.finance_entries > 0 },
  { name: 'Learning OS', isActive: (r) => r.learning_sessions_logged > 0 },
]

export function computeStreakMetrics(
  dailyRows: DataLabDailyActivity[],
): StreakMetricEntry[] {
  if (dailyRows.length === 0) return []

  const sorted = [...dailyRows].sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date),
  )

  return STREAK_EXTRACTORS.map((extractor) => {
    const booleans = sorted.map(extractor.isActive)
    const rawSegments = streakify(booleans)

    const segments: StreakSegment[] = rawSegments.map((seg) => ({
      start: seg.start,
      length: seg.length,
      active: seg.active,
    }))

    const activeSegments = segments.filter((s) => s.active)
    const longestStreak = activeSegments.reduce(
      (max, s) => Math.max(max, s.length),
      0,
    )

    const lastSegment = segments[segments.length - 1]
    const currentStreak = lastSegment && lastSegment.active ? lastSegment.length : 0

    return {
      moduleName: extractor.name,
      currentStreak,
      longestStreak,
      segments,
      totalDays: sorted.length,
    }
  })
}
