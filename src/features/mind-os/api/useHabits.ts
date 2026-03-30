import { useEffect, useRef } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
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
  recovery_commitment: string | null
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
  todayValue: number
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
  logValueByHabitDate: Record<string, number>
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
  lowHealTokenWarning: boolean
  bestHabitThisWeek: {
    habitId: string
    title: string
    count: number
  } | null
  mostHealedHabit: {
    habitId: string
    title: string
    count: number
  } | null
  mostBrokenHabit: {
    habitId: string
    title: string
    count: number
  } | null
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
  currentValue?: number
  struggleNote?: string
}

type MarkHabitNotDoneInput = {
  habitId: string
}

type AdjustHabitCountInput = {
  habitId: string
  delta: number
  struggleNote?: string
}

type SetHabitCountForTodayInput = {
  habitId: string
  value: number
}

type UpdateHabitBreakReasonInput = {
  breakId: string
  reason: string
}

type UpdateRecoveryCommitmentInput = {
  breakId: string
  recoveryCommitment: string
}

type HealHabitBreakInput = {
  breakId: string
  habitId: string
  reason: string
}

type HabitCounter = {
  habitId: string
  count: number
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

function isMissingColumnError(error: unknown, columnName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const column = columnName.toLowerCase()

  if (code === '42703' || code === 'pgrst204') {
    return message.includes(column)
  }

  return message.includes(column) && (message.includes('does not exist') || message.includes('could not find'))
}

function isCompletionLog(habit: Habit, log: HabitLog): boolean {
  if (habit.habit_type === 'target') {
    return log.value >= habit.target_value
  }

  return log.value >= 1
}

function getCounterWinner(counters: HabitCounter[], titleByHabitId: Map<string, string>) {
  if (counters.length === 0) {
    return null
  }

  const winner = counters.reduce((best, candidate) => {
    if (candidate.count > best.count) {
      return candidate
    }

    return best
  })

  if (winner.count <= 0) {
    return null
  }

  return {
    habitId: winner.habitId,
    title: titleByHabitId.get(winner.habitId) ?? 'Untitled Habit',
    count: winner.count,
  }
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

async function fetchTodayHabitLog(userId: string, habitId: string) {
  const { data, error } = await supabase
    .from('habit_logs')
    .select('id, value, struggle_note')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('log_date', getTodayIndiaDateKey())
    .maybeSingle()

  if (error) {
    throw buildError('Failed to fetch today habit log', error)
  }

  return data
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
      .select('id, habit_id, break_date, reason, recovery_commitment, created_at, healed_at')
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

  if (healsResult.error) {
    throw buildError('Failed to fetch habit streak heals', healsResult.error)
  }

  let breaks: HabitStreakBreak[] = []

  if (breaksResult.error) {
    if (!isMissingColumnError(breaksResult.error, 'recovery_commitment')) {
      throw buildError('Failed to fetch habit streak breaks', breaksResult.error)
    }

    const fallbackBreaksResult = await supabase
      .from('habit_streak_breaks')
      .select('id, habit_id, break_date, reason, created_at, healed_at')
      .eq('user_id', userId)
      .order('break_date', { ascending: false })

    if (fallbackBreaksResult.error) {
      throw buildError('Failed to fetch habit streak breaks (fallback)', fallbackBreaksResult.error)
    }

    breaks = (fallbackBreaksResult.data ?? []).map((row) => ({
      ...row,
      recovery_commitment: null,
    }))
  } else {
    breaks = breaksResult.data ?? []
  }

  const habits: Habit[] = (habitsResult.data ?? []).map((habit) => ({
    ...habit,
    habit_type: normalizeHabitType(habit.habit_type),
  }))
  const logs: HabitLog[] = logsResult.data ?? []
  const heals: HabitStreakHeal[] = healsResult.data ?? []

  const healedBreakIds = new Set(heals.map((item) => item.break_id))
  const habitTitleById = new Map(habits.map((habit) => [habit.id, habit.title]))
  const breakById = new Map(breaks.map((item) => [item.id, item]))
  const todayDateKey = getTodayIndiaDateKey()
  const rollingWeekStart = addDays(todayDateKey, -6)
  const logsByHabitId = new Map<string, HabitLog[]>()
  const logValueByHabitDate: HabitWorkspaceData['logValueByHabitDate'] = {}

  for (const log of logs) {
    const list = logsByHabitId.get(log.habit_id) ?? []
    list.push(log)
    logsByHabitId.set(log.habit_id, list)
    logValueByHabitDate[`${log.habit_id}:${log.log_date}`] = log.value
  }

  const weeklyCounters: HabitCounter[] = []

  const habitsWithStats: HabitWithStats[] = habits.map((habit) => {
    const habitLogs = logsByHabitId.get(habit.id) ?? []
    const completionDates = new Set(habitLogs.filter((log) => isCompletionLog(habit, log)).map((log) => log.log_date))

    const healedBreakDates = new Set(
      breaks.filter((item) => item.habit_id === habit.id && isBreakHealed(item, healedBreakIds)).map((item) => item.break_date),
    )

    const streakDates = new Set([...completionDates, ...healedBreakDates])
    const todayLog = habitLogs.find((log) => log.log_date === todayDateKey)
    const weekCount = [...streakDates].filter((dateKey) => dateKey >= rollingWeekStart && dateKey <= todayDateKey).length

    weeklyCounters.push({
      habitId: habit.id,
      count: weekCount,
    })

    return {
      ...habit,
      currentStreak: getCurrentStreak(streakDates),
      longestStreak: getLongestStreak(streakDates),
      completedToday: completionDates.has(todayDateKey),
      totalCompletions: completionDates.size,
      todayValue: todayLog?.value ?? 0,
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
  const healTokensRemaining = Math.max(0, 5 - healsUsedThisMonth)
  const breakCounters = new Map<string, number>()
  const healCounters = new Map<string, number>()

  for (const breakItem of breaks) {
    breakCounters.set(breakItem.habit_id, (breakCounters.get(breakItem.habit_id) ?? 0) + 1)
  }

  for (const healItem of heals) {
    healCounters.set(healItem.habit_id, (healCounters.get(healItem.habit_id) ?? 0) + 1)
  }

  const mostBrokenHabit = getCounterWinner(
    [...breakCounters.entries()].map(([habitId, count]) => ({ habitId, count })),
    habitTitleById,
  )
  const mostHealedHabit = getCounterWinner(
    [...healCounters.entries()].map(([habitId, count]) => ({ habitId, count })),
    habitTitleById,
  )
  const bestHabitThisWeek = getCounterWinner(weeklyCounters, habitTitleById)

  return {
    habits: habitsWithStats,
    logs,
    logValueByHabitDate,
    breaks,
    heals,
    mistakes,
    healHistory,
    longestHabitStreak,
    recentMistake: mistakes[0] ?? null,
    recentHeal: healHistory[0] ?? null,
    healsUsedThisMonth,
    healTokensRemaining,
    lowHealTokenWarning: healTokensRemaining <= 1,
    bestHabitThisWeek,
    mostHealedHabit,
    mostBrokenHabit,
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
  const habitById = new Map(data.habits.map((habit) => [habit.id, habit]))

  for (const log of data.logs) {
    const habit = habitById.get(log.habit_id)

    if (!habit || !isCompletionLog(habit, log)) {
      continue
    }

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

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      title: normalizedTitle,
      habit_type: resolvedType,
      target_value: resolvedTargetValue,
      unit: resolvedUnit,
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to create habit', error)
  }

  await logEventSafe({
    userId,
    domain: 'mind-os',
    entityType: 'habit',
    entityId: data.id,
    eventType: 'habit_created',
    payload: {
      habitType: resolvedType,
      targetValue: resolvedTargetValue,
    },
  })
}

async function markHabitDone({ habitId, habitType, targetValue, struggleNote }: MarkHabitDoneInput): Promise<void> {
  const userId = await requireUserId()
  const existingLog = await fetchTodayHabitLog(userId, habitId)
  const cleanedNote =
    struggleNote === undefined ? existingLog?.struggle_note ?? null : (struggleNote.trim().length > 0 ? struggleNote.trim() : null)
  const value = habitType === 'target' ? Math.max(1, Math.floor(targetValue), Math.floor(existingLog?.value ?? 0)) : 1

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

  await logEventSafe({
    userId,
    domain: 'mind-os',
    entityType: 'habit_log',
    entityId: habitId,
    eventType: 'habit_logged_done',
    payload: {
      habitType,
      value,
      logDate: getTodayIndiaDateKey(),
    },
  })
}

async function markHabitNotDone({ habitId }: MarkHabitNotDoneInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .eq('log_date', getTodayIndiaDateKey())

  if (error) {
    throw buildError('Failed to mark habit not done', error)
  }

  await logEventSafe({
    userId,
    domain: 'mind-os',
    entityType: 'habit_log',
    entityId: habitId,
    eventType: 'habit_marked_not_done',
    payload: {
      logDate: getTodayIndiaDateKey(),
    },
  })
}

async function adjustHabitCount({ habitId, delta, struggleNote }: AdjustHabitCountInput): Promise<void> {
  const normalizedDelta = Math.trunc(delta)

  if (normalizedDelta === 0) {
    return
  }

  const userId = await requireUserId()
  const todayDateKey = getTodayIndiaDateKey()
  const existingLog = await fetchTodayHabitLog(userId, habitId)
  const currentValue = Math.max(0, Math.floor(existingLog?.value ?? 0))
  const nextValue = Math.max(0, currentValue + normalizedDelta)

  if (nextValue === 0) {
    if (!existingLog?.id) {
      return
    }

    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existingLog.id)
      .eq('user_id', userId)

    if (error) {
      throw buildError('Failed to clear habit count', error)
    }

    return
  }

  const cleanedNote =
    struggleNote === undefined ? existingLog?.struggle_note ?? null : (struggleNote.trim().length > 0 ? struggleNote.trim() : null)

  const { error } = await supabase.from('habit_logs').upsert(
    {
      habit_id: habitId,
      user_id: userId,
      value: nextValue,
      log_date: todayDateKey,
      logged_at: new Date().toISOString(),
      struggle_note: cleanedNote,
    },
    {
      onConflict: 'habit_id,log_date',
    },
  )

  if (error) {
    throw buildError('Failed to update habit count', error)
  }
}

async function setHabitCountForToday({ habitId, value }: SetHabitCountForTodayInput): Promise<void> {
  const normalizedValue = Math.max(0, Math.floor(value))
  const userId = await requireUserId()
  const existingLog = await fetchTodayHabitLog(userId, habitId)

  if (normalizedValue === 0) {
    if (!existingLog?.id) {
      return
    }

    const { error } = await supabase
      .from('habit_logs')
      .delete()
      .eq('id', existingLog.id)
      .eq('user_id', userId)

    if (error) {
      throw buildError('Failed to clear habit count', error)
    }

    return
  }

  const { error } = await supabase.from('habit_logs').upsert(
    {
      habit_id: habitId,
      user_id: userId,
      value: normalizedValue,
      log_date: getTodayIndiaDateKey(),
      logged_at: new Date().toISOString(),
      struggle_note: existingLog?.struggle_note ?? null,
    },
    {
      onConflict: 'habit_id,log_date',
    },
  )

  if (error) {
    throw buildError('Failed to set habit count for today', error)
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

async function updateRecoveryCommitment({ breakId, recoveryCommitment }: UpdateRecoveryCommitmentInput): Promise<void> {
  const userId = await requireUserId()
  const cleanedCommitment = recoveryCommitment.trim() || null

  const { error } = await supabase
    .from('habit_streak_breaks')
    .update({ recovery_commitment: cleanedCommitment })
    .eq('id', breakId)
    .eq('user_id', userId)

  if (error) {
    throw buildError('Failed to update recovery commitment', error)
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

  await logEventSafe({
    userId,
    domain: 'mind-os',
    entityType: 'habit_break',
    entityId: breakId,
    eventType: 'habit_break_healed',
    payload: {
      habitId,
    },
  })
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

export function useMarkHabitNotDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markHabitNotDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useUndoHabitDone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markHabitNotDone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useAdjustHabitCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adjustHabitCount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mindOsHabitWorkspaceQueryKey })
    },
  })
}

export function useSetHabitCountForToday() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: setHabitCountForToday,
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

export function useUpdateRecoveryCommitment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateRecoveryCommitment,
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
