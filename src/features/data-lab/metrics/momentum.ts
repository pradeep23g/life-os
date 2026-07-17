import type { DataLabWeeklyScore } from '../api/useDataLab'
import type { MomentumMetrics } from '../types/types'

function getLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}

export function computeMomentumMetrics(
  weeklyRows: DataLabWeeklyScore[],
): MomentumMetrics {
  if (weeklyRows.length === 0) {
    return { low: 0, medium: 0, high: 0, totalWeeks: 0, currentLevel: 'low' }
  }

  let low = 0
  let medium = 0
  let high = 0

  for (const week of weeklyRows) {
    const level = getLevel(week.weekly_system_score)
    if (level === 'low') low++
    else if (level === 'medium') medium++
    else high++
  }

  const sorted = [...weeklyRows].sort(
    (a, b) => b.week_start_date.localeCompare(a.week_start_date),
  )
  const currentLevel = getLevel(sorted[0].weekly_system_score)

  return { low, medium, high, totalWeeks: weeklyRows.length, currentLevel }
}
