import { useQuery } from '@tanstack/react-query'

import { supabase } from './supabase'
import { addDaysToDateKey, getCurrentIndiaWeekStart, toIndiaDateKey } from './events'

export const lifeOsEventsAnalyticsQueryKey = ['life-os', 'events-analytics'] as const

export type EventsAnalytics = {
  thisWeekEvents: number
  lastWeekEvents: number
  activeDaysThisWeek: number
  consistencyPercent: number
  weeklyMomentumDelta: number
}

type EventRow = {
  event_date_ist: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') {
      return message
    }
  }

  return 'Unknown error'
}

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') {
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

function emptyAnalytics(): EventsAnalytics {
  return {
    thisWeekEvents: 0,
    lastWeekEvents: 0,
    activeDaysThisWeek: 0,
    consistencyPercent: 0,
    weeklyMomentumDelta: 0,
  }
}

async function fetchEventsAnalytics(): Promise<EventsAnalytics> {
  const thisWeekStart = getCurrentIndiaWeekStart(new Date())
  const todayKey = toIndiaDateKey(new Date())
  const lastWeekStart = addDaysToDateKey(thisWeekStart, -7)

  const { data, error } = await supabase
    .from('events')
    .select('event_date_ist')
    .gte('event_date_ist', lastWeekStart)
    .lte('event_date_ist', todayKey)

  if (error) {
    if (isMissingEventsTableError(error)) {
      return emptyAnalytics()
    }

    throw new Error(`Failed to fetch events analytics: ${getErrorMessage(error)}`)
  }

  const rows = (data ?? []) as EventRow[]
  const thisWeekRows = rows.filter((row) => row.event_date_ist >= thisWeekStart)
  const lastWeekRows = rows.filter((row) => row.event_date_ist >= lastWeekStart && row.event_date_ist < thisWeekStart)
  const activeDaysThisWeek = new Set(thisWeekRows.map((row) => row.event_date_ist)).size

  return {
    thisWeekEvents: thisWeekRows.length,
    lastWeekEvents: lastWeekRows.length,
    activeDaysThisWeek,
    consistencyPercent: Math.round((activeDaysThisWeek / 7) * 100),
    weeklyMomentumDelta: thisWeekRows.length - lastWeekRows.length,
  }
}

export function useEventsAnalytics() {
  return useQuery({
    queryKey: lifeOsEventsAnalyticsQueryKey,
    queryFn: fetchEventsAnalytics,
  })
}
