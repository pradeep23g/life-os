export const INDIA_TIMEZONE = 'Asia/Kolkata'

export type CalendarDayCell = {
  dateKey: string
  day: number
  inCurrentMonth: boolean
}

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value ?? ''
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`)
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function diffDays(leftDateKey: string, rightDateKey: string): number {
  const left = parseDateKey(leftDateKey).getTime()
  const right = parseDateKey(rightDateKey).getTime()
  return Math.round((left - right) / 86_400_000)
}

export function toIndiaDateKey(input: string | Date): string {
  const value = typeof input === 'string' ? new Date(input) : input
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: INDIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)

  const year = getPart(parts, 'year')
  const month = getPart(parts, 'month')
  const day = getPart(parts, 'day')

  return `${year}-${month}-${day}`
}

export function toIndiaTimeParts(input: string | Date) {
  const value = typeof input === 'string' ? new Date(input) : input
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: INDIA_TIMEZONE,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(value)

  return {
    hour: Number(getPart(parts, 'hour')),
    minute: Number(getPart(parts, 'minute')),
    second: Number(getPart(parts, 'second')),
  }
}

export function formatIndiaDate(input: string | Date): string {
  const value = typeof input === 'string' ? new Date(input) : input
  return value.toLocaleDateString('en-IN', {
    timeZone: INDIA_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatIndiaDateTime(input: string | Date): string {
  const value = typeof input === 'string' ? new Date(input) : input
  return value.toLocaleString('en-IN', {
    timeZone: INDIA_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTodayIndiaDateKey(): string {
  return toIndiaDateKey(new Date())
}

export function getYesterdayIndiaDateKey(): string {
  return addDays(getTodayIndiaDateKey(), -1)
}

export function getIndiaMonthKey(input: string | Date): string {
  return toIndiaDateKey(input).slice(0, 7)
}

export function buildMonthGrid(monthDate: Date): CalendarDayCell[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(Date.UTC(year, month, 1))
  const start = new Date(firstDay)
  start.setUTCDate(start.getUTCDate() - start.getUTCDay())

  const cells: CalendarDayCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const current = new Date(start)
    current.setUTCDate(start.getUTCDate() + index)
    cells.push({
      dateKey: toDateKey(current),
      day: current.getUTCDate(),
      inCurrentMonth: current.getUTCMonth() === firstDay.getUTCMonth(),
    })
  }

  return cells
}

export function shiftMonth(monthDate: Date, offset: number): Date {
  return new Date(monthDate.getFullYear(), monthDate.getMonth() + offset, 1)
}

export function getMonthLabel(monthDate: Date): string {
  return monthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export function getCurrentStreak(dateKeys: Set<string>): number {
  if (dateKeys.size === 0) {
    return 0
  }

  const today = getTodayIndiaDateKey()
  let cursor = dateKeys.has(today) ? today : getYesterdayIndiaDateKey()
  let streak = 0

  while (dateKeys.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  return streak
}

export function getLongestStreak(dateKeys: Set<string>): number {
  const sorted = [...dateKeys].sort()

  if (sorted.length === 0) {
    return 0
  }

  let best = 1
  let running = 1

  for (let index = 1; index < sorted.length; index += 1) {
    const isConsecutive = diffDays(sorted[index], sorted[index - 1]) === 1

    if (isConsecutive) {
      running += 1
      best = Math.max(best, running)
      continue
    }

    running = 1
  }

  return best
}
