import { useEffect, useRef } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'
import {
  addDays,
  getCurrentStreak,
  getIndiaMonthKey,
  getLongestStreak,
  getTodayIndiaDateKey,
  getYesterdayIndiaDateKey,
} from '../utils/date'

export const mindOsHabitsQueryKey = ['mind-os', 'habits'] as const
export const mindOsHabitWorkspaceQueryKey = ['mind-os', 'habits', 'workspace'] as const

export type HabitType = 'binary' | 'target'

export type Habit = {
  id: string
  title: string
  target_value: number
  unit: string | null
  habit_type: HabitType
  created_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  value: number
  log_date: string
  struggle_note: string | null
  created_at: string
}

export type HabitStreakBreak = {
  id: string
  habit_id: string
  break_date: string
  reason: string | null
  created_at: string
  healed_at: string | null
}

export type HabitStreakHeal = {
  id: string
  habit_id: string
  break_id: string
  reason: string | null
  created_at: string
}

export type HabitWithStats = Habit & {
  currentStreak: number
  longestStreak: number
  completedToday: boolean
  totalCompletions: number
}

export type HabitMistake = HabitStreakBreak & {
  habitTitle: string
  isHealed: boolean
}

export type HabitHealHistory = HabitStreakHeal & {
  habitTitle: string
  breakDate: string | null
}

export type HabitWorkspaceData = {
  habits: HabitWithStats[]
  logs: HabitLog[]
  breaks: HabitStreakBreak[]
  heals: HabitStreakHeal[]
  mistakes: HabitMistake[]
  healHistory: HabitHealHistory[]
  longestHabitStreak: {
    habitId: string
    title: string
    streak: number
  } | null
  recentMistake: HabitMistake | null
  recentHeal: HabitHealHistory | null
  healsUsedThisMonth: number
  healTokensRemaining: number
}

type CreateHabitInput = {
  title: string
  habitType: HabitType
  targetValue?: number
  unit?: string
}

type MarkHabitDoneInput = {
  habitId: string
  habitType: HabitType
  targetValue: number
  struggleNote?: string
}

type UpdateHabitBreakReasonInput = {
  breakId: string
  reason: string
}

type HealHabitBreakInput = {
  breakId: string
  habitId: string
  reason: string
}

function normalizeHabitType(value: string | null | undefined): HabitType {
  return value === 'target' ? 'target' : 'binary'
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

function buildError(context: string, error: unknown): Error {
  return new Error(`${context} (${getErrorCode(error)}): ${getErrorMessage(error)}`)
}

function sortByDateDesc<T>(items: T[], keyGetter: (item: T) => string) {
  return [...items].sort((left, right) => {
    if (left === right) {
      return 0
    }

    return keyGetter(left) < keyGetter(right) ? 1 : -1
  })
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw buildError('Auth check failed', error)
  }

  if (!user) {
    throw new Error('User is not authenticated.')
  }

  return user.id
}

async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('id, title, target_value, unit, habit_type, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    throw buildError('Failed to fetch habits', error)
  }

  return (data ?? []).map((habit) => ({
    ...habit,
    habit_type: normalizeHabitType(habit.habit_type),
  }))
}

function isBreakHealed(breakItem: HabitStreakBreak, healedBreakIds: Set<string>) {
  return Boolean(breakItem.healed_at) || healedBreakIds.has(breakItem.id)
}

async function fetchHabitWorkspaceData(): Promise<HabitWorkspaceData> {
  const userId = await requireUserId()

  const [habitsResult, logsResult, breaksResult, healsResult] = await Promise.all([
    supabase
      .from('habits')
      .select('id, title, target_value, unit, habit_type, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('habit_logs')
      .select('id, habit_id, value, log_date, struggle_note, created_at')
      .eq('user_id', userId)
      .order('log_date', { ascending: false }),
    supabase
      .from('habit_streak_breaks')
      .select('id, habit_id, break_date, reason, created_at, healed_at')
      .eq('user_id', userId)
      .order('break_date', { ascending: false }),
    supabase
      .from('habit_streak_heals')
      .select('id, habit_id, break_id, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (habitsResult.error) {
    throw buildError('Failed to fetch habits workspace', habitsResult.error)
  }

  if (logsResult.error) {
    throw buildError('Failed to fetch habit logs', logsResult.error)
  }

  if (breaksResult.error) {
    throw buildError('Failed to fetch habit streak breaks', breaksResult.error)
  }

  if (healsResult.error) {
    throw buildError('Failed to fetch habit streak heals', healsResult.error)
  }

  const habits: Habit[] = (habitsResult.data ?? []).map((habit) => ({
    ...habit,
    habit_type: normalizeHabitType(habit.habit_type),
  }))
  const logs: HabitLog[] = logsResult.data ?? []
  const breaks: HabitStreakBreak[] = breaksResult.data ?? []
  const heals: HabitStreakHeal[] = healsResult.data ?? []

  const healedBreakIds = new Set(heals.map((item) => item.break_id))
  const habitTitleById = new Map(habits.map((habit) => [habit.id, habit.title]))
  const breakById = new Map(breaks.map((item) => [item.id, item]))

  const habitsWithStats: HabitWithStats[] = habits.map((habit) => {
    const habitLogs = logs.filter((log) => log.habit_id === habit.id)
    const completionDates = new Set(habitLogs.map((log) => log.log_date))

    const healedBreakDates = new Set(
      breaks.filter((item) => item.habit_id === habit.id && isBreakHealed(item, healedBreakIds)).map((item) => item.break_date),
    )

    const streakDates = new Set([...completionDates, ...healedBreakDates])

    return {
      ...habit,
      currentStreak: getCurrentStreak(streakDates),
      longestStreak: getLongestStreak(streakDates),
      completedToday: completionDates.has(getTodayIndiaDateKey()),
      totalCompletions: completionDates.size,
    }
  })

  const longestHabitStreak = habitsWithStats.reduce<HabitWorkspaceData['longestHabitStreak']>((best, habit) => {
    if (habit.longestStreak <= 0) {
      return best
    }

    if (!best || habit.longestStreak > best.streak) {
      return {
        habitId: habit.id,
        title: habit.title,
        streak: habit.longestStreak,
      }
    }

    return best
  }, null)

  const mistakes = sortByDateDesc(
    breaks.map((item) => ({
      ...item,
      habitTitle: habitTitleById.get(item.habit_id) ?? 'Untitled Habit',
      isHealed: isBreakHealed(item, healedBreakIds),
    })),
    (item) => item.break_date,
  )

  const healHistory = sortByDateDesc(
    heals.map((item) => ({
      ...item,
      habitTitle: habitTitleById.get(item.habit_id) ?? 'Untitled Habit',
      breakDate: breakById.get(item.break_id)?.break_date ?? null,
    })),
    (item) => item.created_at,
  )

  const currentMonthKey = getIndiaMonthKey(new Date())
  const healsUsedThisMonth = healHistory.filter((item) => getIndiaMonthKey(item.created_at) === currentMonthKey).length

  return {
    habits: habitsWithStats,
    logs,
    breaks,
    heals,
    mistakes,
    healHistory,
    longestHabitStreak,
    recentMistake: mistakes[0] ?? null,
    recentHeal: healHistory[0] ?? null,
    healsUsedThisMonth,
    healTokensRemaining: Math.max(0, 5 - healsUsedThisMonth),
  }
}

function buildSyncKey(data: HabitWorkspaceData): string {
  return [
    data.habits.length,
    data.logs.length,
    data.breaks.length,
    data.logs[0]?.log_date ?? 'none',
    data.breaks[0]?.break_date ?? 'none',
  ].join(':')
}

async function syncMissingHabitBreaks(data: HabitWorkspaceData): Promise<number> {
  const userId = await requireUserId()
  const yesterday = getYesterdayIndiaDateKey()
  const existingBreakKeys = new Set(data.breaks.map((item) => `${item.habit_id}:${item.break_date}`))

  const completionDatesByHabit = new Map<string, string[]>()

  for (const log of data.logs) {
    const list = completionDatesByHabit.get(log.habit_id) ?? []
    list.push(log.log_date)
    completionDatesByHabit.set(log.habit_id, list)
  }

  const rows: Array<{
    habit_id: string
    user_id: string
    break_date: string
  }> = []

  for (const habit of data.habits) {
    const completionDates = [...new Set(completionDatesByHabit.get(habit.id) ?? [])].sort()

    if (completionDates.length === 0) {
      continue
    }

    const completionSet = new Set(completionDates)
    let cursor = completionDates[0]

    while (cursor <= yesterday) {
      const breakKey = `${habit.id}:${cursor}`

      if (!completionSet.has(cursor) && !existingBreakKeys.has(breakKey)) {
        rows.push({
          habit_id: habit.id,
          user_id: userId,
          break_date: cursor,
        })
      }

      cursor = addDays(cursor, 1)
    }
  }

  if (rows.length === 0) {
    return 0
  }

  const { error } = await supabase
    .from('habit_streak_breaks')
    .upsert(rows, { onConflict: 'habit_id,break_date', ignoreDuplicates: true })

  if (error) {
    throw buildError('Failed to auto-sync streak breaks', error)
  }

  return rows.length
}

async function createHabit({ title, habitType, targetValue, unit }: CreateHabitInput): Promise<void> {
  const userId = await requireUserId()
  const normalizedTitle = title.trim()

  if (normalizedTitle.length === 0) {
    throw new Error('Habit title is required.')
  }

  const resolvedType: HabitType = habitType === 'target' ? 'target' : 'binary'
  const resolvedTargetValue = resolvedType === 'target' ? Math.max(1, Math.floor(targetValue ?? 1)) : 1
  const resolvedUnit = resolvedType === 'target' ? unit?.trim() || null : null

  const { error } = await supabase.from('habits').insert({
    user_id: userId,
    title: normalizedTitle,
    habit_type: resolvedType,
    target_value: resolvedTargetValue,
    unit: resolvedUnit,
  })

  if (error) {
    throw buildError('Failed to create habit', error)
  }
}

async function markHabitDone({ habitId, habitType, targetValue, struggleNote }: MarkHabitDoneInput): Promise<void> {
  const userId = await requireUserId()
  const cleanedNote = struggleNote?.trim() || null
  const value = habitType === 'target' ? Math.max(1, Math.floor(targetValue)) : 1

  const { error } = await supabase.from('habit_logs').upsert(
    {
      habit_id: habitId,
      user_id: userId,
      value,
      log_date: getTodayIndiaDateKey(),
      logged_at: new Date().toISOString(),
      struggle_note: cleanedNote,
    },
    {
      onConflict: 'habit_id,log_date',
    },
  )

  if (error) {
    throw buildError('Failed to mark habit done', error)
  }
}

async function updateHabitBreakReason({ breakId, reason }: UpdateHabitBreakReasonInput): Promise<void> {
  const userId = await requireUserId()
  const cleanedReason = reason.trim() || null

  const { error } = await supabase
    .from('habit_streak_breaks')
    .update({ reason: cleanedReason })
    .eq('id', breakId)
    .eq('user_id', userId)

  if (error) {
    throw buildError('Failed to update streak break reason', error)
  }
}

async function healHabitBreak({ breakId, habitId, reason }: HealHabitBreakInput): Promise<void> {
  const userId = await requireUserId()
  const cleanedReason = reason.trim() || null

  const { error: healError } = await supabase.from('habit_streak_heals').insert({
    habit_id: habitId,
    user_id: userId,
    break_id: breakId,
    reason: cleanedReason,
  })

  if (healError) {
    throw buildError('Failed to heal streak break', healError)
  }

  const { error: breakUpdateError } = await supabase
    .from('habit_streak_breaks')
    .update({ healed_at: new Date().toISOString() })
    .eq('id', breakId)
    .eq('user_id', userId)

  if (breakUpdateError) {
    throw buildError('Failed to mark break as healed', breakUpdateError)
  }
}

export function useHabits() {
  return useQuery({
    queryKey: mindOsHabitsQueryKey,
    queryFn: fetchHabits,
  })
}

export function useHabitWorkspace() {
  const queryClient = useQueryClient()
  const syncKeyRef = useRef<string>('')

  const query = useQuery({
    queryKey: mindOsHabitWorkspaceQueryKey,
    queryFn: fetchHabitWorkspaceData,
  })

  useEffect(() => {
    if (!query.data) {
      return
    }

    const syncKey = buildSyncKey(query.data)

    if (syncKeyRef.current === syncKey) {
      return
    }

    syncKeyRef.current = syncKey
    let cancelled = false

    void syncMissingHabitBreaks(query.data)
      .then((inserted) => {
        if (!cancelled && inserted > 0) {
          queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
        }
      })
      .catch((error) => {
        console.error('[useHabits] failed to auto-sync streak breaks', error)
      })

    return () => {
      cancelled = true
    }
  }, [query.data, queryClient])

  return query
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitsQueryKey })
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useMarkHabitDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markHabitDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useUpdateHabitBreakReason() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateHabitBreakReason,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useHealHabitBreak() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: healHabitBreak,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}
