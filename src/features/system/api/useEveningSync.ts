import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'
import { useEventBus } from '../../../store/useEventBus'
import { systemStatusQueryKey, useSystemStatus } from './useSystemStatus'
import { logEventSafe } from '../../../lib/events'
import { EVENT_TYPES } from '../../../lib/eventTaxonomy'

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

function getIndiaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
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
  const queryClient = useQueryClient()

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

    const localDate = getIndiaDateKey()
    let totalProcessed = 0
    let momentumScore = systemStatus?.momentum?.momentum ?? 0
    const BATCH_SIZE = 50
    let hasMore = true
    let loopCount = 0

    let finalPayload: EveningSyncPayload | null = null

    while (hasMore) {
      loopCount++

      const { data: queuedEvents, error: queueFetchError } = await supabase
        .from('system_event_queue')
        .select('id, event_type, payload, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(BATCH_SIZE)

      if (queueFetchError) {
        throw new Error(`Evening sync fetch failed: ${getErrorMessage(queueFetchError)}`)
      }

      const aggregateQueue = (queuedEvents ?? []) as QueuedSystemEvent[]
      
      const deepWorkEvents = aggregateQueue.filter(
        (event) => event.event_type === 'DEEP_WORK_COMPLETED' || event.event_type === EVENT_TYPES.TIME_SESSION_LOGGED,
      ).length
      const workoutEvents = aggregateQueue.filter(
        (event) => event.event_type === EVENT_TYPES.FITNESS_WORKOUT_COMPLETED || event.event_type === 'WORKOUT_COMPLETED',
      ).length
      const habitFailEvents = aggregateQueue.filter((event) => event.event_type === 'HABIT_FAILED').length
      const wantExpenseEvents = aggregateQueue.filter(
        (event) => event.event_type === 'WANT_EXPENSE_ADDED' || event.event_type === EVENT_TYPES.FINANCE_TRANSACTION_CREATED,
      ).length

      const momentumDelta = (deepWorkEvents * 3) + (workoutEvents * 2) - (habitFailEvents * 2) - wantExpenseEvents
      momentumScore = Math.max(0, Math.min(100, Math.round(momentumScore + momentumDelta)))
      totalProcessed += aggregateQueue.length

      const payload: EveningSyncPayload = {
        user_id: user.id,
        sync_date: localDate,
        momentum_score: momentumScore,
        events_processed: totalProcessed,
        created_at: new Date().toISOString(),
      }
      
      finalPayload = payload

      const { error: upsertError } = await supabase
        .from('system_metrics')
        .upsert(payload, { onConflict: 'user_id,sync_date' })

      if (upsertError) {
        if (isMissingMetricsTableError(upsertError)) {
          return {
            skipped: true,
            reason: 'system_metrics table not found',
            payload,
          }
        }
        throw new Error(`Evening sync failed: ${getErrorMessage(upsertError)}`)
      }

      const processedEventIds = aggregateQueue.map((event) => event.id)

      if (processedEventIds.length > 0) {
        const { error: queueDeleteError } = await supabase
          .from('system_event_queue')
          .delete()
          .eq('user_id', user.id)
          .in('id', processedEventIds)

        if (queueDeleteError) {
          throw new Error(`Evening sync flush failed: ${getErrorMessage(queueDeleteError)}`)
        }
      }

      if (aggregateQueue.length < BATCH_SIZE) {
        hasMore = false
      }
      
      if (loopCount > 100) {
         break
      }
    }

    clearEvents()

    if (finalPayload) {
      await logEventSafe({
        domain: 'mission-control',
        entityType: 'evening_sync',
        eventType: EVENT_TYPES.SYSTEM_EVENING_SYNC_COMPLETED,
        payload: { ...finalPayload },
        userId: user.id,
      })
    }

    return {
      skipped: false,
      payload: finalPayload,
    }
  }

  return useMutation({
    mutationFn: executeEveningSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      queryClient.invalidateQueries({ queryKey: ['system-event-queue-count'] })
    },
  })
}

export function usePendingEventsCount() {
  return useQuery({
    queryKey: ['system-event-queue-count'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { count, error } = await supabase
        .from('system_event_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Count fetch failed: ${error.message}`)
      }

      return count ?? 0
    },
  })
}
