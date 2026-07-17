import type { DataLabWeeklyScore } from '../api/useDataLab'
import type { WeeklyScoreMetrics, TrendDirection } from '../types/types'
import { formatWeekLabel } from '../utils/format'

function getMomentumLabel(score: number): string {
  if (score >= 70) return 'High Momentum'
  if (score >= 40) return 'Building'
  return 'Low Momentum'
}

function getTrend(current: number, previous: number): TrendDirection {
  const delta = current - previous
  if (delta > 2) return 'up'
  if (delta < -2) return 'down'
  return 'stable'
}

export function computeWeeklyScoreMetrics(
  weeklyRows: DataLabWeeklyScore[],
): WeeklyScoreMetrics {
  if (weeklyRows.length === 0) {
    return {
      currentScore: 0,
      previousScore: 0,
      trend: 'stable',
      delta: 0,
      rank: 0,
      totalWeeks: 0,
      momentumLabel: 'No Data',
      sparklinePoints: [],
    }
  }

  const sorted = [...weeklyRows].sort(
    (a, b) => b.week_start_date.localeCompare(a.week_start_date),
  )

  const currentScore = sorted[0].weekly_system_score
  const previousScore = sorted.length > 1 ? sorted[1].weekly_system_score : 0
  const delta = currentScore - previousScore
  const trend = getTrend(currentScore, previousScore)

  const allScores = sorted.map((w) => w.weekly_system_score).sort((a, b) => b - a)
  const rank = allScores.indexOf(currentScore) + 1

  const sparklinePoints = [...sorted]
    .reverse()
    .slice(-12)
    .map((w) => ({
      weekLabel: formatWeekLabel(w.week_start_date),
      score: w.weekly_system_score,
    }))

  return {
    currentScore,
    previousScore,
    trend,
    delta,
    rank,
    totalWeeks: sorted.length,
    momentumLabel: getMomentumLabel(currentScore),
    sparklinePoints,
  }
}
