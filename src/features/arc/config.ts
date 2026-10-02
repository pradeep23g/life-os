import type { ArcSeasonConfig, ArcTemporalProgress, ArcCheckpoint, CheckpointStatus } from './types'
import { calculateTemporalHorizon } from './utils/paceEvaluator.ts'

/**
 * Parses YYYY-MM-DD string to UTC midnight timestamp in milliseconds.
 */
function parseDateKeyUtc(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/**
 * Formats a UTC timestamp to YYYY-MM-DD string.
 */
function formatUtcToDateKey(utcMs: number): string {
  const d = new Date(utcMs)
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Returns YYYY-MM-DD in Asia/Kolkata (IST), matching the application's event taxonomy baseline.
 */
export function getIndiaDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Calculates dynamic temporal progress for a season without off-by-one errors.
 * Respects early completion timestamps.
 */
export function calculateArcProgress(
  config: ArcSeasonConfig,
  asOfDate: Date = new Date(),
): ArcTemporalProgress {
  const todayKey = getIndiaDateKey(asOfDate)
  const temporal = calculateTemporalHorizon(
    config.startDate,
    config.endDate,
    todayKey,
    config.completedAt,
  )

  return {
    currentDay: temporal.currentDay,
    totalDays: temporal.totalDays,
    remainingDays: temporal.remainingDays,
    percentElapsed: temporal.percentElapsed,
    status: temporal.temporalStatus,
    asOfDateIST: todayKey,
  }
}

/**
 * Generates deterministic weekly checkpoints for the arc.
 * Seamlessly resolves phase names from config.phases (day-range or week-based).
 */
export function generateArcCheckpoints(
  config: ArcSeasonConfig,
  asOfDate: Date = new Date(),
): ArcCheckpoint[] {
  const todayKey = getIndiaDateKey(asOfDate)
  const startUtc = parseDateKeyUtc(config.startDate)
  const endUtc = parseDateKeyUtc(config.endDate)
  const msPerDay = 86400000

  const totalDays = Math.max(1, Math.round((endUtc - startUtc) / msPerDay) + 1)
  const totalWeeks = Math.ceil(totalDays / 7)

  const checkpoints: ArcCheckpoint[] = []

  for (let i = 0; i < totalWeeks; i++) {
    const weekNumber = i + 1
    const weekStartUtc = startUtc + i * 7 * msPerDay
    const rawEndUtc = weekStartUtc + 6 * msPerDay
    const weekEndUtc = Math.min(rawEndUtc, endUtc)

    const startDateKey = formatUtcToDateKey(weekStartUtc)
    const endDateKey = formatUtcToDateKey(weekEndUtc)

    const dayStart = i * 7 + 1
    const dayEnd = Math.min(totalDays, (i + 1) * 7)

    const midDay = Math.floor((dayStart + dayEnd) / 2)

    const phase = config.phases?.find((p) => {
      if (p.startDay !== undefined && p.endDay !== undefined) {
        return midDay >= p.startDay && midDay <= p.endDay
      }
      return p.week === weekNumber
    }) ?? config.phases?.find((p) => {
      if (p.startDay !== undefined && p.endDay !== undefined) {
        return dayStart <= p.endDay && dayEnd >= p.startDay
      }
      return false
    }) ?? config.phases?.[i]

    let status: CheckpointStatus = 'upcoming'
    let isCurrent = false

    const completedKey = config.completedAt ? config.completedAt.slice(0, 10) : null
    const effectiveToday = completedKey && completedKey < todayKey ? completedKey : todayKey

    if (effectiveToday > endDateKey || (config.completedAt && completedKey && completedKey >= endDateKey)) {
      status = 'completed'
    } else if (effectiveToday >= startDateKey && effectiveToday <= endDateKey) {
      status = config.completedAt ? 'completed' : 'current'
      isCurrent = !config.completedAt
    } else {
      status = 'upcoming'
    }

    checkpoints.push({
      weekNumber,
      label: `WEEK ${String(weekNumber).padStart(2, '0')}`,
      phaseName: phase?.name ?? `Week ${String(weekNumber).padStart(2, '0')}`,
      focus: phase?.focus ?? 'Seasonal execution checkpoint',
      startDate: startDateKey,
      endDate: endDateKey,
      status,
      isCurrent,
    })
  }

  return checkpoints
}
