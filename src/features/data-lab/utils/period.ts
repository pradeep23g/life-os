import type { AnalyticsPeriod } from '../types/types'

export function getPeriodDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case 'all':
      return null
  }
}

export function getPeriodLabel(period: AnalyticsPeriod): string {
  switch (period) {
    case '7d':
      return 'Last 7 Days'
    case '30d':
      return 'Last 30 Days'
    case '90d':
      return 'Last 90 Days'
    case 'all':
      return 'All Time'
  }
}

function getTodayIST(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function subtractDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

export function getPeriodStartDate(period: AnalyticsPeriod): string | null {
  const days = getPeriodDays(period)
  if (days === null) return null

  const today = getTodayIST()
  return subtractDays(today, days - 1)
}

export function filterByPeriod<T>(
  rows: T[],
  dateField: keyof T,
  period: AnalyticsPeriod,
): T[] {
  const startDate = getPeriodStartDate(period)
  if (startDate === null) return rows

  return rows.filter((row) => {
    const dateValue = row[dateField]
    if (typeof dateValue !== 'string') return false
    return dateValue >= startDate
  })
}

export function getComparisonPeriodRange(period: AnalyticsPeriod): {
  currentStart: string
  previousStart: string
  previousEnd: string
} | null {
  const days = getPeriodDays(period)
  if (days === null) return null

  const today = getTodayIST()
  const currentStart = subtractDays(today, days - 1)
  const previousEnd = subtractDays(currentStart, 1)
  const previousStart = subtractDays(previousEnd, days - 1)

  return { currentStart, previousStart, previousEnd }
}
