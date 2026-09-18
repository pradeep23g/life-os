import type { ArcSeasonConfig, ArcTemporalProgress, ArcCheckpoint, CheckpointStatus } from './types'

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
 */
export function calculateArcProgress(
  config: ArcSeasonConfig,
  asOfDate: Date = new Date(),
): ArcTemporalProgress {
  const todayKey = getIndiaDateKey(asOfDate)
  const todayUtc = parseDateKeyUtc(todayKey)
  const startUtc = parseDateKeyUtc(config.startDate)
  const endUtc = parseDateKeyUtc(config.endDate)

  const msPerDay = 86400000
  const totalDays = Math.round((endUtc - startUtc) / msPerDay) + 1

  if (todayUtc < startUtc) {
    return {
      currentDay: 0,
      totalDays,
      remainingDays: totalDays,
      percentElapsed: 0,
      status: 'upcoming',
      asOfDateIST: todayKey,
    }
  }

  if (todayUtc > endUtc) {
    return {
      currentDay: totalDays,
      totalDays,
      remainingDays: 0,
      percentElapsed: 100,
      status: 'completed',
      asOfDateIST: todayKey,
    }
  }

  // Elapsed calendar days prior to today (0-indexed offset)
  const elapsedDays = Math.round((todayUtc - startUtc) / msPerDay)
  // Current active day is 1-indexed (Day 1 on startDate)
  const currentDay = elapsedDays + 1
  const remainingDays = Math.max(0, totalDays - currentDay)
  const percentElapsed = Number(((currentDay / totalDays) * 100).toFixed(1))

  return {
    currentDay,
    totalDays,
    remainingDays,
    percentElapsed,
    status: 'active',
    asOfDateIST: todayKey,
  }
}

/**
 * Generates deterministic weekly checkpoints for the arc.
 */
export function generateArcCheckpoints(
  config: ArcSeasonConfig,
  asOfDate: Date = new Date(),
): ArcCheckpoint[] {
  const todayKey = getIndiaDateKey(asOfDate)
  const startUtc = parseDateKeyUtc(config.startDate)
  const endUtc = parseDateKeyUtc(config.endDate)
  const msPerDay = 86400000

  const totalDays = Math.round((endUtc - startUtc) / msPerDay) + 1
  const totalWeeks = Math.ceil(totalDays / 7)

  const checkpoints: ArcCheckpoint[] = []

  for (let i = 0; i < totalWeeks; i++) {
    const weekNumber = i + 1
    const weekStartUtc = startUtc + i * 7 * msPerDay
    // The last week spans to endUtc, otherwise 7 days (6 msPerDay forward)
    const rawEndUtc = weekStartUtc + 6 * msPerDay
    const weekEndUtc = Math.min(rawEndUtc, endUtc)

    const startDateKey = formatUtcToDateKey(weekStartUtc)
    const endDateKey = formatUtcToDateKey(weekEndUtc)

    const phase = config.phases[i] ?? {
      week: weekNumber,
      name: `Week ${String(weekNumber).padStart(2, '0')}`,
      focus: 'Seasonal execution checkpoint',
    }

    let status: CheckpointStatus = 'upcoming'
    let isCurrent = false

    if (todayKey > endDateKey) {
      status = 'completed'
    } else if (todayKey >= startDateKey && todayKey <= endDateKey) {
      status = 'current'
      isCurrent = true
    } else {
      status = 'upcoming'
    }

    checkpoints.push({
      weekNumber,
      label: `WEEK ${String(weekNumber).padStart(2, '0')}`,
      phaseName: phase.name,
      focus: phase.focus,
      startDate: startDateKey,
      endDate: endDateKey,
      status,
      isCurrent,
    })
  }

  return checkpoints
}
