import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'

export const productivityPlanningQueryKey = ['productivity-hub', 'planning'] as const

export type WeeklyPlan = {
  id: string
  user_id: string
  focus_text: string
  week_start_date: string
  created_at: string
}

type CreateWeeklyPlanInput = {
  focusText: string
  weekStartDate: string
}

type UpdateWeeklyPlanInput = {
  id: string
  focusText: string
  weekStartDate: string
}

function extractErrorMessage(error: unknown): string {
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

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[usePlanning] Failed to fetch auth user', error)
    throw new Error(`Auth check failed: ${extractErrorMessage(error)}`)
  }

  if (!user) {
    throw new Error('User is not authenticated.')
  }

  return user.id
}

async function fetchWeeklyPlans(): Promise<WeeklyPlan[]> {
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('id, user_id, focus_text, week_start_date, created_at')
    .order('week_start_date', { ascending: false })

  if (error) {
    console.error('[usePlanning] Failed to fetch weekly plans', error)
    throw new Error(`Failed to fetch plans: ${extractErrorMessage(error)}`)
  }

  return data ?? []
}

async function createWeeklyPlan({ focusText, weekStartDate }: CreateWeeklyPlanInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase.from('weekly_plans').insert({
    user_id: userId,
    focus_text: focusText,
    week_start_date: weekStartDate,
  })

  if (error) {
    console.error('[usePlanning] Failed to create weekly plan', error)
    throw new Error(`Failed to save plan: ${extractErrorMessage(error)}`)
  }
}

async function updateWeeklyPlan({ id, focusText, weekStartDate }: UpdateWeeklyPlanInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('weekly_plans')
    .update({
      focus_text: focusText,
      week_start_date: weekStartDate,
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    console.error('[usePlanning] Failed to update weekly plan', error)
    throw new Error(`Failed to update plan: ${extractErrorMessage(error)}`)
  }
}

export function usePlanning() {
  return useQuery({
    queryKey: productivityPlanningQueryKey,
    queryFn: fetchWeeklyPlans,
  })
}

export function useCreateWeeklyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWeeklyPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityPlanningQueryKey })
    },
  })
}

export function useUpdateWeeklyPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWeeklyPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityPlanningQueryKey })
    },
  })
}
