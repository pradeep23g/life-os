import { useQuery } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'
import { getSystemStatus } from '../engine/systemEngine'
import type { CurrentDaySnapshot, SystemHistoryDay } from '../engine/types'

export const systemStatusQueryKey = ['system-status'] as const

function getErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') {
      return code
    }
  }

  return 'unknown'
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

function isMissingSnapshotViewError(error: unknown): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes('current_day_snapshot')
  }

  return message.includes('current_day_snapshot') && message.includes('does not exist')
}

function isMissingDeepWorkColumnError(error: unknown): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()

  if (code === '42703' || code === 'pgrst204') {
    return message.includes('deep_work_minutes_today')
  }

  return message.includes('deep_work_minutes_today') && message.includes('column')
}

async function fetchSnapshotWithDeepWorkFallback() {
  const latestSelect = await supabase
    .from('current_day_snapshot')
    .select(
      'user_id, pending_tasks_count, habits_completed_today, total_active_habits, journal_logged_today, workout_days_this_week, deep_work_minutes_today, oldest_pending_task_title, newest_active_habit_title, snapshot_date',
    )
    .maybeSingle()

  if (!latestSelect.error) {
    return latestSelect
  }

  if (!isMissingDeepWorkColumnError(latestSelect.error)) {
    return latestSelect
  }

  const fallbackSelect = await supabase
    .from('current_day_snapshot')
    .select(
      'user_id, pending_tasks_count, habits_completed_today, total_active_habits, journal_logged_today, workout_days_this_week, oldest_pending_task_title, newest_active_habit_title, snapshot_date',
    )
    .maybeSingle()

  if (fallbackSelect.error || !fallbackSelect.data) {
    return fallbackSelect
  }

  return {
    data: {
      ...fallbackSelect.data,
      deep_work_minutes_today: 0,
    },
    error: null,
  }
}

async function fetchSystemStatus() {
  const [snapshotResult, historyResult] = await Promise.all([
    fetchSnapshotWithDeepWorkFallback(),
    supabase
      .from('current_day_snapshot_history_14d')
      .select(
        'user_id, snapshot_date, tasks_completed_count, habits_completed_count, total_active_habits, journal_logged, workout_logged',
      )
      .order('snapshot_date', { ascending: true }),
  ])

  const snapshotError = snapshotResult.error
  const historyError = historyResult.error

  if (snapshotError || historyError) {
    const snapshotMissing = snapshotError ? isMissingSnapshotViewError(snapshotError) : false
    const historyMissing = historyError ? isMissingSnapshotViewError(historyError) : false

    if (snapshotMissing || historyMissing) {
      return getSystemStatus(null, [])
    }

    throw new Error(
      `Failed to fetch system status: ${getErrorMessage(snapshotError ?? historyError)}`,
    )
  }

  const snapshot = (snapshotResult.data ?? null) as CurrentDaySnapshot | null
  const history = ((historyResult.data ?? []) as SystemHistoryDay[]).sort((left, right) => (
    left.snapshot_date < right.snapshot_date ? -1 : left.snapshot_date > right.snapshot_date ? 1 : 0
  ))

  return getSystemStatus(snapshot, history)
}

export function useSystemStatus() {
  return useQuery({
    queryKey: systemStatusQueryKey,
    queryFn: fetchSystemStatus,
  })
}
