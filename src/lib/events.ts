import { supabase } from './supabase'

export type LifeOsDomain = 'mind-os' | 'productivity-hub' | 'progress-hub' | 'mission-control'

export type LifeOsEventInput = {
  userId?: string
  domain: LifeOsDomain
  entityType: string
  entityId?: string | null
  eventType: string
  payload?: Record<string, unknown>
  createdAt?: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string' && code.trim().length > 0) {
      return code
    }
  }

  return 'unknown'
}

function isMissingEventsTableError(error: unknown): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes('events')
  }

  return message.includes('events') && message.includes('does not exist')
}

export function toIndiaDateKey(input: string | Date): string {
  const value = typeof input === 'string' ? new Date(input) : input
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

export function getCurrentIndiaWeekStart(date = new Date()): string {
  const dateKey = toIndiaDateKey(date)
  const utcDate = new Date(`${dateKey}T00:00:00Z`)
  const day = utcDate.getUTCDay()
  const distanceFromMonday = day === 0 ? 6 : day - 1
  utcDate.setUTCDate(utcDate.getUTCDate() - distanceFromMonday)
  return utcDate.toISOString().slice(0, 10)
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

async function resolveUserId(explicitUserId?: string): Promise<string | null> {
  if (explicitUserId) {
    return explicitUserId
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function logEventSafe(event: LifeOsEventInput): Promise<void> {
  try {
    const userId = await resolveUserId(event.userId)

    if (!userId) {
      return
    }

    const createdAt = event.createdAt ?? new Date().toISOString()

    const { error } = await supabase.from('events').insert({
      user_id: userId,
      domain: event.domain,
      entity_type: event.entityType,
      entity_id: event.entityId ?? null,
      event_type: event.eventType,
      event_date_ist: toIndiaDateKey(createdAt),
      payload: event.payload ?? {},
      created_at: createdAt,
    })

    if (error) {
      if (isMissingEventsTableError(error)) {
        return
      }

      console.error('[events] failed to log event', {
        error,
        event,
      })
    }
  } catch (error) {
    console.error('[events] unexpected logEventSafe failure', error)
  }
}
