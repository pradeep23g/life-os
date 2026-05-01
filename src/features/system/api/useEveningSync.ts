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
  const recentEvents = useEventBus((state) => state.recentEvents)

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

    const payload: EveningSyncPayload = {
      user_id: user.id,
      sync_date: new Date().toLocaleDateString('en-CA'),
      momentum_score: Math.round(systemStatus.momentum.momentum),
      events_processed: recentEvents.length,
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

    return {
      skipped: false,
      payload,
    }
  }

  return useMutation({
    mutationFn: executeEveningSync,
  })
}
