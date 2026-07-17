import type { DataLabDailyActivity, DataLabWeeklyScore } from '../api/useDataLab'
import type { BehaviorInsight } from '../types/types'
import { formatWeekLabel, formatHourLabel } from '../utils/format'
import { mean } from '../utils/stats'

type RawEvent = {
  created_at: string
}

function getWeekdayIndex(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay()
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getHourIST(isoTimestamp: string): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(isoTimestamp))
  return parseInt(hourStr, 10)
}

export function computeBehaviorInsights(
  dailyRows: DataLabDailyActivity[],
  weeklyRows: DataLabWeeklyScore[],
  events: RawEvent[],
): BehaviorInsight[] {
  const insights: BehaviorInsight[] = []

  if (dailyRows.length === 0) return insights

  // Most active weekday
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]
  const weekdayDays = [0, 0, 0, 0, 0, 0, 0]
  for (const row of dailyRows) {
    const idx = getWeekdayIndex(row.activity_date)
    weekdayCounts[idx] += row.active_system_count
    weekdayDays[idx]++
  }
  const weekdayAvgs = weekdayCounts.map((count, i) =>
    weekdayDays[i] > 0 ? count / weekdayDays[i] : 0,
  )
  const maxAvg = Math.max(...weekdayAvgs)
  const mostActiveDay = weekdayAvgs.indexOf(maxAvg)
  if (maxAvg > 0) {
    insights.push({
      type: 'most_active_weekday',
      label: 'Most Active Weekday',
      value: WEEKDAY_NAMES[mostActiveDay],
      detail: `Average ${maxAvg.toFixed(1)} systems active`,
    })
  }

  // Least active weekday
  const validAvgs = weekdayAvgs.map((v, i) => ({ v, i })).filter((x) => weekdayDays[x.i] > 0)
  if (validAvgs.length > 1) {
    const minEntry = validAvgs.reduce((min, x) => (x.v < min.v ? x : min), validAvgs[0])
    insights.push({
      type: 'least_active_weekday',
      label: 'Least Active Weekday',
      value: WEEKDAY_NAMES[minEntry.i],
      detail: `Average ${minEntry.v.toFixed(1)} systems active`,
    })
  }

  // Longest streak (by module)
  const modules = [
    { name: 'Habits', isActive: (r: DataLabDailyActivity) => r.habits_completed > 0 },
    { name: 'Journal', isActive: (r: DataLabDailyActivity) => r.journal_entries > 0 },
    { name: 'Deep Work', isActive: (r: DataLabDailyActivity) => r.deep_work_minutes > 0 },
    { name: 'Workouts', isActive: (r: DataLabDailyActivity) => r.workouts_logged > 0 },
    { name: 'Tasks', isActive: (r: DataLabDailyActivity) => r.tasks_completed > 0 },
  ]

  const sorted = [...dailyRows].sort((a, b) => a.activity_date.localeCompare(b.activity_date))
  let longestName = ''
  let longestLen = 0

  for (const mod of modules) {
    let current = 0
    let best = 0
    for (const row of sorted) {
      if (mod.isActive(row)) {
        current++
        best = Math.max(best, current)
      } else {
        current = 0
      }
    }
    if (best > longestLen) {
      longestLen = best
      longestName = mod.name
    }
  }

  if (longestLen > 1) {
    insights.push({
      type: 'longest_streak',
      label: 'Longest Streak',
      value: `${longestLen} days`,
      detail: longestName,
    })
  }

  // Current active streak (system-wide)
  let currentSystemStreak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].active_system_count > 0) {
      currentSystemStreak++
    } else {
      break
    }
  }
  if (currentSystemStreak > 1) {
    insights.push({
      type: 'current_streak',
      label: 'Current Active Streak',
      value: `${currentSystemStreak} days`,
      detail: 'Consecutive days with at least 1 system active',
    })
  }

  // Behavior drift — largest increase and decline
  if (sorted.length >= 6) {
    const mid = Math.floor(sorted.length / 2)
    const firstHalf = sorted.slice(0, mid)
    const secondHalf = sorted.slice(mid)

    const driftModules = [
      { name: 'Workouts', getValue: (r: DataLabDailyActivity) => r.workouts_logged },
      { name: 'Journal', getValue: (r: DataLabDailyActivity) => r.journal_entries },
      { name: 'Deep Work', getValue: (r: DataLabDailyActivity) => r.deep_work_minutes },
      { name: 'Tasks', getValue: (r: DataLabDailyActivity) => r.tasks_completed },
      { name: 'Habits', getValue: (r: DataLabDailyActivity) => r.habits_completed },
    ]

    let bestIncrease = { name: '', delta: 0 }
    let worstDecline = { name: '', delta: 0 }

    for (const mod of driftModules) {
      const prevAvg = mean(firstHalf.map(mod.getValue))
      const currAvg = mean(secondHalf.map(mod.getValue))
      const delta = prevAvg > 0 ? ((currAvg - prevAvg) / prevAvg) * 100 : currAvg > 0 ? 100 : 0

      if (delta > bestIncrease.delta) bestIncrease = { name: mod.name, delta }
      if (delta < worstDecline.delta) worstDecline = { name: mod.name, delta }
    }

    if (bestIncrease.delta > 5) {
      insights.push({
        type: 'largest_increase',
        label: 'Largest Increase',
        value: `+${Math.round(bestIncrease.delta)}%`,
        detail: bestIncrease.name,
      })
    }

    if (worstDecline.delta < -5) {
      insights.push({
        type: 'largest_decline',
        label: 'Largest Decline',
        value: `${Math.round(worstDecline.delta)}%`,
        detail: worstDecline.name,
      })
    }
  }

  // Peak activity hour
  if (events.length > 0) {
    const hourCounts = new Array(24).fill(0) as number[]
    for (const event of events) {
      const hour = getHourIST(event.created_at)
      if (hour >= 0 && hour < 24) hourCounts[hour]++
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    insights.push({
      type: 'peak_hour',
      label: 'Peak Activity Hour',
      value: formatHourLabel(peakHour),
      detail: `${hourCounts[peakHour]} events logged`,
    })
  }

  // Best week
  if (weeklyRows.length > 0) {
    const best = [...weeklyRows].sort(
      (a, b) => b.weekly_system_score - a.weekly_system_score,
    )[0]
    insights.push({
      type: 'best_week',
      label: 'Best Week',
      value: `${best.weekly_system_score} pts`,
      detail: `Week of ${formatWeekLabel(best.week_start_date)}`,
    })
  }

  // Most and least consistent module
  const moduleConsistencies = modules.map((mod) => {
    const activeDays = sorted.filter(mod.isActive).length
    return { name: mod.name, percent: sorted.length > 0 ? Math.round((activeDays / sorted.length) * 100) : 0 }
  })
  const sortedModules = [...moduleConsistencies].sort((a, b) => b.percent - a.percent)

  if (sortedModules.length > 0 && sortedModules[0].percent > 0) {
    insights.push({
      type: 'most_consistent',
      label: 'Most Consistent',
      value: sortedModules[0].name,
      detail: `${sortedModules[0].percent}% of days`,
    })
  }

  if (sortedModules.length > 1) {
    const least = sortedModules[sortedModules.length - 1]
    insights.push({
      type: 'least_consistent',
      label: 'Least Consistent',
      value: least.name,
      detail: `${least.percent}% of days`,
    })
  }

  return insights
}
