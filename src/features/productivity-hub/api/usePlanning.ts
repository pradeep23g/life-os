import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'

export const productivityPlanningQueryKey = ['productivity-hub', 'planning'] as const
export const productivityGoalsQueryKey = ['productivity-hub', 'planning', 'goals'] as const
export const productivityWeeklyReviewQueryKey = (weekStartDate: string) =>
  ['productivity-hub', 'planning', 'review', weekStartDate] as const
export const productivityWeeklyPlanItemsQueryKey = (weekStartDate: string) =>
  ['productivity-hub', 'planning', 'items', weekStartDate] as const

export type WeeklyPlan = {
  id: string
  user_id: string
  focus_text: string
  week_start_date: string
  created_at: string
}

export type GoalDomain = 'mind-os' | 'productivity-hub' | 'progress-hub' | 'fitness-os' | 'finance-os'
export type GoalStatus = 'active' | 'paused' | 'completed'
export type PlanItemPriority = 'Low' | 'Medium' | 'High'
export type PlanItemStatus = 'Planned' | 'Doing' | 'Done' | 'Dropped'

export type Goal = {
  id: string
  user_id: string
  title: string
  domain: GoalDomain
  status: GoalStatus
  target_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type WeeklyPlanItem = {
  id: string
  user_id: string
  week_start_date: string
  title: string
  priority: PlanItemPriority
  order_index: number
  status: PlanItemStatus
  goal_id: string | null
  linked_task_id: string | null
  linked_habit_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type WeeklyReview = {
  id: string
  user_id: string
  week_start_date: string
  wins: string | null
  blockers: string | null
  next_adjustments: string | null
  created_at: string
  updated_at: string
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

type CreateGoalInput = {
  title: string
  domain: GoalDomain
  targetDate?: string
  notes?: string
}

type UpdateGoalStatusInput = {
  id: string
  status: GoalStatus
}

type CreateWeeklyPlanItemInput = {
  weekStartDate: string
  title: string
  priority: PlanItemPriority
  status?: PlanItemStatus
  orderIndex?: number
  goalId?: string
  linkedTaskId?: string
  linkedHabitId?: string
  notes?: string
}

type UpdateWeeklyPlanItemInput = {
  id: string
  title?: string
  priority?: PlanItemPriority
  status?: PlanItemStatus
  orderIndex?: number
  goalId?: string
  linkedTaskId?: string
  linkedHabitId?: string
  notes?: string
}

type UpsertWeeklyReviewInput = {
  weekStartDate: string
  wins: string
  blockers: string
  nextAdjustments: string
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

function extractErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code
    if (typeof code === 'string') {
      return code
    }
  }

  return 'unknown'
}

function isMissingRelationError(error: unknown, relationName: string): boolean {
  const code = extractErrorCode(error).toLowerCase()
  const message = extractErrorMessage(error).toLowerCase()
  const relation = relationName.toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes(relation)
  }

  return message.includes(relation) && message.includes('does not exist')
}

export function getWeekStartDateISO(date = new Date()) {
  const value = new Date(date)
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day

  value.setDate(value.getDate() + diff)
  value.setHours(0, 0, 0, 0)

  return value.toISOString().slice(0, 10)
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

  const { data, error } = await supabase
    .from('weekly_plans')
    .insert({
      user_id: userId,
      focus_text: focusText,
      week_start_date: weekStartDate,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[usePlanning] Failed to create weekly plan', error)
    throw new Error(`Failed to save plan: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'weekly_plan',
    entityId: data.id,
    eventType: 'weekly_plan_created',
    payload: {
      weekStartDate,
    },
  })
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

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'weekly_plan',
    entityId: id,
    eventType: 'weekly_plan_updated',
    payload: {
      weekStartDate,
    },
  })
}

async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('id, user_id, title, domain, status, target_date, notes, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'goals')) {
      return []
    }

    throw new Error(`Failed to fetch goals: ${extractErrorMessage(error)}`)
  }

  return data ?? []
}

async function createGoal({ title, domain, targetDate, notes }: CreateGoalInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: userId,
      title: title.trim(),
      domain,
      status: 'active',
      target_date: targetDate?.trim() || null,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create goal: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'goal',
    entityId: data.id,
    eventType: 'goal_created',
    payload: {
      domain,
    },
  })
}

async function updateGoalStatus({ id, status }: UpdateGoalStatusInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('goals')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update goal: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'goal',
    entityId: id,
    eventType: 'goal_status_updated',
    payload: {
      status,
    },
  })
}

async function fetchWeeklyPlanItems(weekStartDate: string): Promise<WeeklyPlanItem[]> {
  const { data, error } = await supabase
    .from('weekly_plan_items')
    .select(
      'id, user_id, week_start_date, title, priority, order_index, status, goal_id, linked_task_id, linked_habit_id, notes, created_at, updated_at',
    )
    .eq('week_start_date', weekStartDate)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    if (isMissingRelationError(error, 'weekly_plan_items')) {
      return []
    }

    throw new Error(`Failed to fetch plan items: ${extractErrorMessage(error)}`)
  }

  return data ?? []
}

async function createWeeklyPlanItem(input: CreateWeeklyPlanItemInput): Promise<void> {
  const userId = await requireUserId()
  let resolvedOrder = input.orderIndex

  if (resolvedOrder === undefined) {
    const { data: lastItem } = await supabase
      .from('weekly_plan_items')
      .select('order_index')
      .eq('user_id', userId)
      .eq('week_start_date', input.weekStartDate)
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle()

    resolvedOrder = typeof lastItem?.order_index === 'number' ? lastItem.order_index + 1 : 0
  }

  const { data, error } = await supabase
    .from('weekly_plan_items')
    .insert({
      user_id: userId,
      week_start_date: input.weekStartDate,
      title: input.title.trim(),
      priority: input.priority,
      status: input.status ?? 'Planned',
      order_index: resolvedOrder,
      goal_id: input.goalId || null,
      linked_task_id: input.linkedTaskId || null,
      linked_habit_id: input.linkedHabitId || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create plan item: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'weekly_plan_item',
    entityId: data.id,
    eventType: 'weekly_plan_item_created',
    payload: {
      weekStartDate: input.weekStartDate,
      linkedToGoal: Boolean(input.goalId),
      linkedToTask: Boolean(input.linkedTaskId),
      linkedToHabit: Boolean(input.linkedHabitId),
    },
  })
}

async function updateWeeklyPlanItem(input: UpdateWeeklyPlanItemInput): Promise<void> {
  const userId = await requireUserId()
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (input.title !== undefined) updates.title = input.title.trim()
  if (input.priority !== undefined) updates.priority = input.priority
  if (input.status !== undefined) updates.status = input.status
  if (input.orderIndex !== undefined) updates.order_index = input.orderIndex
  if (input.goalId !== undefined) updates.goal_id = input.goalId || null
  if (input.linkedTaskId !== undefined) updates.linked_task_id = input.linkedTaskId || null
  if (input.linkedHabitId !== undefined) updates.linked_habit_id = input.linkedHabitId || null
  if (input.notes !== undefined) updates.notes = input.notes.trim() || null

  const { error } = await supabase
    .from('weekly_plan_items')
    .update(updates)
    .eq('id', input.id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to update plan item: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'weekly_plan_item',
    entityId: input.id,
    eventType: 'weekly_plan_item_updated',
    payload: {
      status: input.status,
      goalId: input.goalId,
    },
  })
}

async function fetchWeeklyReview(weekStartDate: string): Promise<WeeklyReview | null> {
  const { data, error } = await supabase
    .from('weekly_reviews')
    .select('id, user_id, week_start_date, wins, blockers, next_adjustments, created_at, updated_at')
    .eq('week_start_date', weekStartDate)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error, 'weekly_reviews')) {
      return null
    }

    throw new Error(`Failed to fetch weekly review: ${extractErrorMessage(error)}`)
  }

  return data ?? null
}

async function upsertWeeklyReview({ weekStartDate, wins, blockers, nextAdjustments }: UpsertWeeklyReviewInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('weekly_reviews')
    .upsert(
      {
        user_id: userId,
        week_start_date: weekStartDate,
        wins: wins.trim() || null,
        blockers: blockers.trim() || null,
        next_adjustments: nextAdjustments.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week_start_date' },
    )
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to save weekly review: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'weekly_review',
    entityId: data.id,
    eventType: 'weekly_review_upserted',
    payload: {
      weekStartDate,
    },
  })
}

export function usePlanning() {
  return useQuery({
    queryKey: productivityPlanningQueryKey,
    queryFn: fetchWeeklyPlans,
  })
}

export function useGoals() {
  return useQuery({
    queryKey: productivityGoalsQueryKey,
    queryFn: fetchGoals,
  })
}

export function useWeeklyPlanItems(weekStartDate: string) {
  return useQuery({
    queryKey: productivityWeeklyPlanItemsQueryKey(weekStartDate),
    queryFn: () => fetchWeeklyPlanItems(weekStartDate),
    enabled: weekStartDate.trim().length > 0,
  })
}

export function useWeeklyReview(weekStartDate: string) {
  return useQuery({
    queryKey: productivityWeeklyReviewQueryKey(weekStartDate),
    queryFn: () => fetchWeeklyReview(weekStartDate),
    enabled: weekStartDate.trim().length > 0,
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

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityGoalsQueryKey })
    },
  })
}

export function useUpdateGoalStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateGoalStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityGoalsQueryKey })
    },
  })
}

export function useCreateWeeklyPlanItem(weekStartDate: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWeeklyPlanItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityWeeklyPlanItemsQueryKey(weekStartDate) })
    },
  })
}

export function useUpdateWeeklyPlanItem(weekStartDate: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWeeklyPlanItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityWeeklyPlanItemsQueryKey(weekStartDate) })
    },
  })
}

export function useUpsertWeeklyReview(weekStartDate: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: upsertWeeklyReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityWeeklyReviewQueryKey(weekStartDate) })
    },
  })
}
