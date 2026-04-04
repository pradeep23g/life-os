import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'
import { systemStatusQueryKey } from '../../system/api/useSystemStatus'
import { emitSystemFeedback } from '../../system/feedback'
import { getCurrentStreak, toIndiaDateKey } from '../utils/date'

export const mindOsJournalsQueryKey = ['mind-os', 'journals'] as const

export type JournalEntry = {
  id: string
  mood: number
  what_went_good: string | null
  what_you_learned: string | null
  brief_about_day: string | null
  created_at: string
}

type CreateJournalEntryInput = {
  mood: number
  whatWentGood: string
  whatYouLearned: string
  briefAboutDay: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
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
    if (typeof code === 'string' && code.trim().length > 0) {
      return code
    }
  }

  return 'unknown'
}

function buildError(context: string, error: unknown): Error {
  return new Error(`${context} (${getErrorCode(error)}): ${getErrorMessage(error)}`)
}

async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, mood, what_went_good, what_you_learned, brief_about_day, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useJournal] fetch journal_entries failed', error)
    throw buildError('Fetch failed', error)
  }

  return data ?? []
}

async function insertJournalEntry({
  mood,
  whatWentGood,
  whatYouLearned,
  briefAboutDay,
}: CreateJournalEntryInput): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error('[useJournal] supabase.auth.getUser failed', userError)
    throw buildError('Auth check failed', userError)
  }

  if (!user) {
    const authError = new Error('User is not authenticated. Please sign in before saving entries.')
    console.error('[useJournal] insert blocked because there is no authenticated user', authError)
    throw authError
  }

  const payload = {
    user_id: user.id,
    mood,
    what_went_good: whatWentGood,
    what_you_learned: whatYouLearned,
    brief_about_day: briefAboutDay,
  }

  const { error } = await supabase.from('journal_entries').insert(payload)

  if (error) {
    console.error('[useJournal] insert into journal_entries failed', {
      error,
      payload,
      userId: user.id,
    })
    throw buildError('Insert failed', error)
  }

  await logEventSafe({
    userId: user.id,
    domain: 'mind-os',
    entityType: 'journal_entry',
    eventType: 'journal_entry_created',
    payload: {
      mood,
    },
  })
}

export function getJournalStreak(entries: JournalEntry[]): number {
  const dateKeys = new Set(entries.map((entry) => toIndiaDateKey(entry.created_at)))
  return getCurrentStreak(dateKeys)
}

export function useJournalEntries() {
  return useQuery({
    queryKey: mindOsJournalsQueryKey,
    queryFn: fetchJournalEntries,
  })
}

export function useJournal() {
  return useJournalEntries()
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: insertJournalEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsJournalsQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: '+1 Awareness',
        description: 'Momentum +4% — system stabilizing',
      })
    },
    onError: (error) => {
      console.error('[useJournal] mutation failed', error)
    },
  })
}
