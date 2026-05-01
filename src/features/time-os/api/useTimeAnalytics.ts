import { useQuery } from '@tanstack/react-query'

import { toIndiaDateKey } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'
import { TIME_BUCKETS } from './useTimeLogs'
import type { TimeBucket } from './useTimeLogs'

type AnalyticsLogRow = {
  id: string
  bucket: TimeBucket
  end_time: string
  duration_minutes: number | null
}

export type TodayDistributionItem = {
  bucket: TimeBucket
  minutes: number
  percentage: number
  colorClass: string
}

export type SevenDayTrendItem = {
  dateKey: string
  label: string
  minutes: number
}

export type TimeAnalytics = {
  todayTotalMinutes: number
  todayDistribution: TodayDistributionItem[]
  sevenDayTrend: SevenDayTrendItem[]
}

export const timeAnalyticsQueryKey = ['time-os', 'analytics'] as const

const BUCKET_COLOR_CLASS: Record<TimeBucket, string> = {
  Academics: 'bg-purple-900',
  'Deep Work': 'bg-blue-900',
  Admin: 'bg-slate-700',
  Fitness: 'bg-emerald-900',
  Learning: 'bg-amber-900',
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

function isMissingRelationError(error: unknown, relationName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const relation = relationName.toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes(relation)
  }

  return message.includes(relation) && message.includes('does not exist')
}

function addDays(dateKey: string, days: number): string {
  const baseDate = new Date(`${dateKey}T00:00:00Z`)
  baseDate.setUTCDate(baseDate.getUTCDate() + days)
  return baseDate.toISOString().slice(0, 10)
}

function getWeekKeys(todayDateKey: string): string[] {
  const keys: string[] = []
  for (let dayOffset = 6; dayOffset >= 0; dayOffset -= 1) {
    keys.push(addDays(todayDateKey, -dayOffset))
  }
  return keys
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  }).format(date)
}

function normalizeMinutes(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.round(value))
}

async function fetchTimeAnalytics(): Promise<TimeAnalytics> {
  const todayDateKey = toIndiaDateKey(new Date())
  const weekKeys = getWeekKeys(todayDateKey)
  const earliestWeekDateKey = weekKeys[0]

  const { data, error } = await supabase
    .from('time_logs')
    .select('id, bucket, end_time, duration_minutes')
    .not('end_time', 'is', null)
    .order('end_time', { ascending: false })
    .limit(300)

  if (error) {
    if (isMissingRelationError(error, 'time_logs')) {
      return {
        todayTotalMinutes: 0,
        todayDistribution: TIME_BUCKETS.map((bucket) => ({
          bucket,
          minutes: 0,
          percentage: 0,
          colorClass: BUCKET_COLOR_CLASS[bucket],
        })),
        sevenDayTrend: weekKeys.map((dateKey) => ({
          dateKey,
          label: formatDayLabel(dateKey),
          minutes: 0,
        })),
      }
    }

    throw new Error(`Failed to fetch time analytics: ${getErrorMessage(error)}`)
  }

  const rows = (data ?? []) as AnalyticsLogRow[]
  const todayMinutesByBucket = new Map<TimeBucket, number>()
  const weekMinutesByDay = new Map<string, number>()

  for (const key of weekKeys) {
    weekMinutesByDay.set(key, 0)
  }

  for (const row of rows) {
    const dateKey = toIndiaDateKey(row.end_time)
    const minutes = normalizeMinutes(row.duration_minutes)

    if (dateKey === todayDateKey) {
      const previousMinutes = todayMinutesByBucket.get(row.bucket) ?? 0
      todayMinutesByBucket.set(row.bucket, previousMinutes + minutes)
    }

    if (dateKey >= earliestWeekDateKey && dateKey <= todayDateKey) {
      const previousMinutes = weekMinutesByDay.get(dateKey) ?? 0
      weekMinutesByDay.set(dateKey, previousMinutes + minutes)
    }
  }

  const todayTotalMinutes = [...todayMinutesByBucket.values()].reduce((sum, value) => sum + value, 0)

  const todayDistribution = TIME_BUCKETS.map((bucket) => {
    const minutes = todayMinutesByBucket.get(bucket) ?? 0
    const percentage = todayTotalMinutes > 0 ? (minutes / todayTotalMinutes) * 100 : 0

    return {
      bucket,
      minutes,
      percentage,
      colorClass: BUCKET_COLOR_CLASS[bucket],
    }
  })

  const sevenDayTrend = weekKeys.map((dateKey) => ({
    dateKey,
    label: formatDayLabel(dateKey),
    minutes: weekMinutesByDay.get(dateKey) ?? 0,
  }))

  return {
    todayTotalMinutes,
    todayDistribution,
    sevenDayTrend,
  }
}

export function useTimeAnalytics() {
  return useQuery({
    queryKey: timeAnalyticsQueryKey,
    queryFn: fetchTimeAnalytics,
    refetchInterval: 60_000,
  })
}
