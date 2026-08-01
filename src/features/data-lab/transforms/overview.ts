import type { DataLabDailyActivity } from '../api/useDataLab'
import type { WeeklyScoreMetrics, CalendarCell, TimelineDayRow } from '../types/types'
import { clampIntensity } from '../utils/stats'

export function toWeeklyScoreSparkline(
  metrics: WeeklyScoreMetrics,
): { weekLabel: string; score: number; max: number }[] {
  const max = metrics.sparklinePoints.reduce(
    (m, p) => Math.max(m, p.score),
    0,
  )

  return metrics.sparklinePoints.map((point) => ({
    weekLabel: point.weekLabel,
    score: point.score,
    max,
  }))
}

export function toBehaviorTimelineRows(
  dailyRows: DataLabDailyActivity[],
): TimelineDayRow[] {
  const sorted = [...dailyRows].sort(
    (a, b) => b.activity_date.localeCompare(a.activity_date),
  )

  return sorted.map((row) => ({
    date: row.activity_date,
    workout: row.workouts_logged > 0,
    journal: row.journal_entries > 0,
    habits: row.habits_completed > 0,
    tasks: row.tasks_completed > 0 || row.tasks_created > 0,
    deepWork: row.deep_work_minutes > 0,
  }))
}

export function toContributionCalendarCells(
  dailyRows: DataLabDailyActivity[],
): CalendarCell[] {
  const sorted = [...dailyRows].sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date),
  )

  return sorted.map((row) => ({
    date: row.activity_date,
    intensity: clampIntensity(row.active_system_count, 7, 4),
    activeSystemCount: row.active_system_count,
    systems: {
      habits: row.habits_completed > 0,
      journal: row.journal_entries > 0,
      tasks: row.tasks_completed > 0 || row.tasks_created > 0,
      deepWork: row.deep_work_minutes > 0,
      workout: row.workouts_logged > 0,
      finance: row.finance_entries > 0,
      learning: row.learning_sessions_logged > 0,
    },
  }))
}
