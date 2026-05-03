import { useMutation } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'
import { useEventBus } from '../../../store/useEventBus'
import { useSystemStatus } from './useSystemStatus'

type EveningSyncPayload = {
  user_id: string
  sync_date: string
  momentum_score: number
  events_processed: number
  created_at: string
}

type QueuedSystemEvent = {
  id: string
  event_type: string
  payload: Record<string, unknown> | null
  created_at: string
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

function isMissingMetricsTableError(error: unknown): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes('system_metrics')
  }

  return message.includes('system_metrics') && message.includes('does not exist')
}

export function useEveningSync() {
  const { data: systemStatus } = useSystemStatus()
  const clearEvents = useEventBus((state) => state.clearEvents)

  const executeEveningSync = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      throw new Error(`Auth check failed: ${getErrorMessage(authError)}`)
    }

    if (!user) {
      throw new Error('User is not authenticated.')
    }

    const localDate = new Date().toLocaleDateString('en-CA')
    const dayStart = `${localDate}T00:00:00+05:30`
    const tomorrow = new Date(`${localDate}T00:00:00+05:30`)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const nextDate = tomorrow.toISOString().slice(0, 10)
    const dayEnd = `${nextDate}T00:00:00+05:30`

    const { data: queuedEvents, error: queueFetchError } = await supabase
      .from('system_event_queue')
      .select('id, event_type, payload, created_at')
      .eq('user_id', user.id)
      .gte('created_at', dayStart)
      .lt('created_at', dayEnd)

    if (queueFetchError) {
      throw new Error(`Evening sync fetch failed: ${getErrorMessage(queueFetchError)}`)
    }

    const aggregateQueue = (queuedEvents ?? []) as QueuedSystemEvent[]
    const deepWorkEvents = aggregateQueue.filter((event) => event.event_type === 'DEEP_WORK_COMPLETED').length
    const workoutEvents = aggregateQueue.filter((event) => event.event_type === 'WORKOUT_COMPLETED').length
    const habitFailEvents = aggregateQueue.filter((event) => event.event_type === 'HABIT_FAILED').length
    const wantExpenseEvents = aggregateQueue.filter((event) => event.event_type === 'WANT_EXPENSE_ADDED').length

    const momentumDelta = (deepWorkEvents * 3) + (workoutEvents * 2) - (habitFailEvents * 2) - wantExpenseEvents
    const momentumScore = Math.max(0, Math.min(100, Math.round(systemStatus.momentum.momentum + momentumDelta)))

    const payload: EveningSyncPayload = {
      user_id: user.id,
      sync_date: localDate,
      momentum_score: momentumScore,
      events_processed: aggregateQueue.length,
      created_at: new Date().toISOString(),
    }

    const { error } = await supabase
      .from('system_metrics')
      .upsert(payload, { onConflict: 'user_id,sync_date' })

    if (error) {
      if (isMissingMetricsTableError(error)) {
        return {
          skipped: true,
          reason: 'system_metrics table not found',
          payload,
        }
      }

      throw new Error(`Evening sync failed: ${getErrorMessage(error)}`)
    }

    const { error: queueDeleteError } = await supabase
      .from('system_event_queue')
      .delete()
      .eq('user_id', user.id)

    if (queueDeleteError) {
      throw new Error(`Evening sync flush failed: ${getErrorMessage(queueDeleteError)}`)
    }

    clearEvents()

    return {
      skipped: false,
      payload,
    }
  }

  return useMutation({
    mutationFn: executeEveningSync,
  })
}
