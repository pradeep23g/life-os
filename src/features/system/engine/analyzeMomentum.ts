import type { MomentumAnalysis, SystemHistoryDay } from './types'

const MOMENTUM_ALPHA = 0.6
const DEEP_WORK_BOOST_MINUTES = 120
const DEEP_WORK_BOOST_POINTS = 4

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

function normalizeTaskScore(tasksCompletedCount: number): number {
  return clampPercentage(Math.max(0, tasksCompletedCount) * 25)
}

function normalizeHabitScore(totalActiveHabits: number, habitsCompletedCount: number): number {
  const activeHabits = Math.max(0, totalActiveHabits)

  if (activeHabits === 0) {
    return 0
  }

  return clampPercentage((Math.max(0, habitsCompletedCount) / activeHabits) * 100)
}

function normalizeBooleanScore(value: boolean): number {
  return value ? 100 : 0
}

function sanitizeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

function getDailyActivityValue(historyDay: SystemHistoryDay): number {
  const taskScore = normalizeTaskScore(historyDay.tasks_completed_count)
  const habitScore = normalizeHabitScore(historyDay.total_active_habits, historyDay.habits_completed_count)
  const journalScore = normalizeBooleanScore(historyDay.journal_logged)
  const fitnessScore = normalizeBooleanScore(historyDay.workout_logged)

  const weightedValue =
    taskScore * 0.35 +
    habitScore * 0.35 +
    journalScore * 0.15 +
    fitnessScore * 0.15

  return clampPercentage(weightedValue)
}

export function analyzeMomentum(
  history: SystemHistoryDay[],
  deepWorkMinutesToday: number = 0,
): MomentumAnalysis {
  if (!history.length) {
    return {
      momentum: 0,
      trend: 'stable',
    }
  }

  const sortedHistory = [...history].sort((left, right) => {
    if (left.snapshot_date === right.snapshot_date) {
      return 0
    }

    return left.snapshot_date < right.snapshot_date ? -1 : 1
  })

  const dailyValues = sortedHistory.map((historyDay) => getDailyActivityValue(historyDay))
  const emaSeries: number[] = []

  let previousMomentum = dailyValues[0]

  for (let index = 0; index < dailyValues.length; index += 1) {
    const currentValue = dailyValues[index]
    const currentMomentum = index === 0
      ? currentValue
      : currentValue * MOMENTUM_ALPHA + previousMomentum * (1 - MOMENTUM_ALPHA)

    emaSeries.push(clampPercentage(currentMomentum))
    previousMomentum = currentMomentum
  }

  const latestMomentum = emaSeries[emaSeries.length - 1]
  const deepWorkBoost = sanitizeMinutes(deepWorkMinutesToday) > DEEP_WORK_BOOST_MINUTES
    ? DEEP_WORK_BOOST_POINTS
    : 0
  const adjustedLatestMomentum = clampPercentage(latestMomentum + deepWorkBoost)
  const previousDayMomentum = emaSeries.length > 1 ? emaSeries[emaSeries.length - 2] : latestMomentum
  const delta = adjustedLatestMomentum - previousDayMomentum

  const trend: MomentumAnalysis['trend'] = delta > 2 ? 'rising' : delta < -2 ? 'falling' : 'stable'

  return {
    momentum: Math.round(adjustedLatestMomentum),
    trend,
  }
}
