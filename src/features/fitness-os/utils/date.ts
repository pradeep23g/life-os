export const INDIA_TIMEZONE = 'Asia/Kolkata'

export type CalendarDayCell = {
  dateKey: string
  day: number
  inCurrentMonth: boolean
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`)
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function toIndiaDateKey(input: string | Date): string {
  const value = typeof input === 'string' ? new Date(input) : input
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: INDIA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

export function getTodayIndiaDateKey() {
  return toIndiaDateKey(new Date())
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
