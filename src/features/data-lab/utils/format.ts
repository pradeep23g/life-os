const IST_TIMEZONE = 'Asia/Kolkata'

export function formatDateShort(value: string | null): string {
  if (!value) return '--'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatDateFull(value: string | null): string {
  if (!value) return '--'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(new Date(`${value}T00:00:00Z`))
}

export function formatWeekLabel(weekStartDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: IST_TIMEZONE,
  }).format(new Date(`${weekStartDate}T00:00:00Z`))
}

export function formatTime24h(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: IST_TIMEZONE,
  }).format(new Date(isoTimestamp))
}

export function formatDayOfWeek(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: IST_TIMEZONE,
  }).format(new Date(`${dateStr}T00:00:00Z`))
}

export function formatDayOfWeekShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: IST_TIMEZONE,
  }).format(new Date(`${dateStr}T00:00:00Z`))
}

export function formatDelta(value: number): string {
  const rounded = Math.round(value)
  if (rounded > 0) return `+${rounded}%`
  if (rounded < 0) return `${rounded}%`
  return '0%'
}

export function formatHourLabel(hour: number): string {
  const h = hour % 24
  if (h === 0) return '12a'
  if (h < 12) return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

const DOMAIN_LABELS: Record<string, string> = {
  'mind-os': 'Mind OS',
  'productivity-hub': 'Productivity',
  'mission-control': 'Mission Control',
  'fitness-os': 'Fitness OS',
  'time-os': 'Time OS',
  'finance-os': 'Finance',
  'learning-os': 'Learning',
}

export function formatDomainLabel(domain: string): string {
  return DOMAIN_LABELS[domain] ?? domain
}
