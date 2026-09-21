import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

export type HabitAnchor = {
  id: string
  title: string
}

export const habitAnchorsQueryKey = ['productivity-hub', 'habit-anchors'] as const

async function fetchHabitAnchors(): Promise<HabitAnchor[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, title')
    .is('deleted_at', null)
    .order('title', { ascending: true })

  if (error) {
    console.error('[useHabitAnchors] Failed to fetch habit anchors', error)
    throw new Error(`Failed to fetch habit anchors: ${error.message}`)
  }

  return data ?? []
}

export function useHabitAnchors() {
  return useQuery({
    queryKey: habitAnchorsQueryKey,
    queryFn: fetchHabitAnchors,
    staleTime: 1000 * 60 * 5,
  })
}
