import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addDaysToDateKey, getCurrentIndiaWeekStart, logEventSafe, toIndiaDateKey } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'
import { emitSystemFeedback } from '../../system/feedback'
import { systemStatusQueryKey } from '../../system/api/useSystemStatus'

export const fitnessExercisesQueryKey = ['fitness-os', 'exercises'] as const
export const fitnessWorkoutsQueryKey = ['fitness-os', 'workouts'] as const
export const fitnessActiveWorkoutQueryKey = ['fitness-os', 'active-workout'] as const
export const fitnessWorkoutDetailBaseQueryKey = ['fitness-os', 'workout-detail'] as const
export const fitnessDashboardQueryKey = ['fitness-os', 'dashboard'] as const
export const fitnessWeeklySummaryQueryKey = ['fitness-os', 'weekly-summary'] as const

export const fitnessWorkoutDetailQueryKey = (workoutId: string) => [...fitnessWorkoutDetailBaseQueryKey, workoutId] as const

export type FitnessExercise = {
  id: string
  user_id: string
  name: string
  category: string | null
  equipment: string[] | null
  target_muscles: string[] | null
  default_unit: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type Workout = {
  id: string
  user_id: string
  workout_date: string
  title: string
  session_type: string | null
  duration_minutes: number
  notes: string | null
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ExerciseLog = {
  id: string
  user_id: string
  workout_id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps_total: number | null
  weight_kg: number | null
  duration_minutes: number | null
  distance_km: number | null
  rpe: number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  exercise_name: string
  exercise_default_unit: string | null
}

export type WorkoutDetail = Workout & {
  logs: ExerciseLog[]
}

export type FitnessDayInsight = {
  date: string
  minutes: number
  workoutCount: number
}

export type FitnessWeeklySummary = {
  workoutsThisWeek: number
  activeWorkoutDaysThisWeek: number
  totalSessionMinutesThisWeek: number
  consistencyScore: number
}

export type FitnessDashboardSummary = FitnessWeeklySummary & {
  recentWorkouts: Workout[]
  heatmapDays: FitnessDayInsight[]
  workoutsByDate: Record<string, Workout[]>
}

type CreateWorkoutInput = {
  workoutDate: string
  title: string
  sessionType?: string
  durationMinutes: number
  notes?: string
}

type UpdateWorkoutInput = {
  id: string
  workoutDate: string
  title: string
  sessionType?: string
  durationMinutes: number
  notes?: string
}

type DeleteWorkoutInput = {
  id: string
}

type CreateExerciseInput = {
  name: string
  category?: string
  equipment?: string[]
  targetMuscles?: string[]
  defaultUnit?: string
  notes?: string
}

type UpdateExerciseInput = {
  id: string
  name: string
  category?: string
  equipment?: string[]
  targetMuscles?: string[]
  defaultUnit?: string
  notes?: string
}

type DeleteExerciseInput = {
  id: string
}

type ExerciseLogInput = {
  workoutId: string
  exerciseId: string
  orderIndex?: number
  sets?: number | null
  repsTotal?: number | null
  weightKg?: number | null
  durationMinutes?: number | null
  distanceKm?: number | null
  rpe?: number | null
  notes?: string
}

type UpdateExerciseLogInput = {
  id: string
  workoutId: string
  exerciseId: string
  orderIndex: number
  sets?: number | null
  repsTotal?: number | null
  weightKg?: number | null
  durationMinutes?: number | null
  distanceKm?: number | null
  rpe?: number | null
  notes?: string
}

type DeleteExerciseLogInput = {
  id: string
  workoutId: string
}

type StartWorkoutSessionInput = {
  title?: string
  sessionType?: string
  notes?: string
}

type EndWorkoutSessionInput = {
  workoutId: string
  startTime: string
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

function isMissingRelationError(error: unknown, relationName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const relation = relationName.toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes(relation)
  }

  return message.includes(relation) && message.includes('does not exist')
}

function normalizeInteger(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null
  }

  const normalized = Math.max(0, Math.floor(value))
  return Number.isFinite(normalized) ? normalized : null
}

function normalizeNumber(value: number | null | undefined): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (!Number.isFinite(value)) {
    return null
  }

  return Math.max(0, value)
}

function normalizeTagArray(values: string[] | null | undefined): string[] | null {
  if (!values || values.length === 0) {
    return null
  }

  const cleaned = [...new Set(values.map((value) => value.trim()).filter((value) => value.length > 0))]
  return cleaned.length > 0 ? cleaned : null
}

function sortWorkoutsByDateDesc(workouts: Workout[]) {
  return [...workouts].sort((left, right) => {
    if (left.workout_date === right.workout_date) {
      return left.created_at < right.created_at ? 1 : -1
    }

    return left.workout_date < right.workout_date ? 1 : -1
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

async function fetchFitnessExercises(): Promise<FitnessExercise[]> {
  const { data, error } = await supabase
    .from('fitness_exercises')
    .select('id, user_id, name, category, equipment, target_muscles, default_unit, notes, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    if (isMissingRelationError(error, 'fitness_exercises')) {
      return []
    }

    throw buildError('Failed to fetch fitness exercises', error)
  }

  return data ?? []
}

async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, user_id, workout_date, title, session_type, duration_minutes, notes, start_time, end_time, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .not('end_time', 'is', null)
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'workouts')) {
      return []
    }

    throw buildError('Failed to fetch workouts', error)
  }

  return data ?? []
}

async function fetchActiveWorkout(): Promise<Workout | null> {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, user_id, workout_date, title, session_type, duration_minutes, notes, start_time, end_time, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .is('end_time', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error, 'workouts')) {
      return null
    }

    throw buildError('Failed to fetch active workout', error)
  }

  return data ?? null
}

type ExerciseLogRow = {
  id: string
  user_id: string
  workout_id: string
  exercise_id: string
  order_index: number
  sets: number | null
  reps_total: number | null
  weight_kg: number | null
  duration_minutes: number | null
  distance_km: number | null
  rpe: number | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  fitness_exercises:
    | Array<{
        name: string
        default_unit: string | null
        deleted_at: string | null
      }>
    | null
}

async function fetchWorkoutDetail(workoutId: string): Promise<WorkoutDetail | null> {
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select('id, user_id, workout_date, title, session_type, duration_minutes, notes, start_time, end_time, created_at, updated_at, deleted_at')
    .eq('id', workoutId)
    .is('deleted_at', null)
    .maybeSingle()

  if (workoutError) {
    if (isMissingRelationError(workoutError, 'workouts')) {
      return null
    }

    throw buildError('Failed to fetch workout detail', workoutError)
  }

  if (!workout) {
    return null
  }

  const { data: logsData, error: logsError } = await supabase
    .from('exercise_logs')
    .select(
      'id, user_id, workout_id, exercise_id, order_index, sets, reps_total, weight_kg, duration_minutes, distance_km, rpe, notes, created_at, updated_at, deleted_at, fitness_exercises(name, default_unit, deleted_at)',
    )
    .eq('workout_id', workoutId)
    .is('deleted_at', null)
    .order('order_index', { ascending: true })

  if (logsError) {
    if (isMissingRelationError(logsError, 'exercise_logs') || isMissingRelationError(logsError, 'fitness_exercises')) {
      return {
        ...workout,
        logs: [],
      }
    }

    throw buildError('Failed to fetch exercise logs', logsError)
  }

  const logs = ((logsData ?? []) as ExerciseLogRow[]).map((row) => {
    const exercise = Array.isArray(row.fitness_exercises) ? row.fitness_exercises[0] : null

    return {
    id: row.id,
    user_id: row.user_id,
    workout_id: row.workout_id,
    exercise_id: row.exercise_id,
    order_index: row.order_index,
    sets: row.sets,
    reps_total: row.reps_total,
    weight_kg: row.weight_kg,
    duration_minutes: row.duration_minutes,
    distance_km: row.distance_km,
    rpe: row.rpe,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at,
    exercise_name: exercise?.name ?? 'Unknown Exercise',
    exercise_default_unit: exercise?.default_unit ?? null,
  }
  })

  return {
    ...workout,
    logs,
  }
}

function buildWeeklySummary(workouts: Workout[]): FitnessWeeklySummary {
  const today = toIndiaDateKey(new Date())
  const weekStart = getCurrentIndiaWeekStart(new Date())
  const thisWeekWorkouts = workouts.filter((workout) => workout.workout_date >= weekStart && workout.workout_date <= today)
  const activeWorkoutDays = new Set(thisWeekWorkouts.map((workout) => workout.workout_date)).size
  const totalMinutes = thisWeekWorkouts.reduce((total, workout) => total + Math.max(0, workout.duration_minutes), 0)

  return {
    workoutsThisWeek: thisWeekWorkouts.length,
    activeWorkoutDaysThisWeek: activeWorkoutDays,
    totalSessionMinutesThisWeek: totalMinutes,
    consistencyScore: Math.round((activeWorkoutDays / 7) * 100),
  }
}

function buildHeatmapDays(workouts: Workout[]): FitnessDayInsight[] {
  const today = toIndiaDateKey(new Date())
  const start = addDaysToDateKey(today, -89)
  const insightMap = new Map<string, FitnessDayInsight>()

  let cursor = start
  while (cursor <= today) {
    insightMap.set(cursor, {
      date: cursor,
      minutes: 0,
      workoutCount: 0,
    })
    cursor = addDaysToDateKey(cursor, 1)
  }

  for (const workout of workouts) {
    if (workout.workout_date < start || workout.workout_date > today) {
      continue
    }

    const insight = insightMap.get(workout.workout_date)
    if (!insight) {
      continue
    }

    insight.minutes += Math.max(0, workout.duration_minutes)
    insight.workoutCount += 1
  }

  return [...insightMap.values()]
}

function groupWorkoutsByDate(workouts: Workout[]): Record<string, Workout[]> {
  const grouped: Record<string, Workout[]> = {}
  for (const workout of workouts) {
    grouped[workout.workout_date] ??= []
    grouped[workout.workout_date].push(workout)
  }

  for (const dateKey of Object.keys(grouped)) {
    grouped[dateKey] = grouped[dateKey].sort((left, right) => (left.created_at < right.created_at ? 1 : -1))
  }

  return grouped
}

async function fetchFitnessDashboard(): Promise<FitnessDashboardSummary> {
  const workouts = await fetchWorkouts()
  const sortedWorkouts = sortWorkoutsByDateDesc(workouts)
  const weeklySummary = buildWeeklySummary(sortedWorkouts)

  return {
    ...weeklySummary,
    recentWorkouts: sortedWorkouts.slice(0, 8),
    heatmapDays: buildHeatmapDays(sortedWorkouts),
    workoutsByDate: groupWorkoutsByDate(sortedWorkouts),
  }
}

async function fetchFitnessWeeklySummary(): Promise<FitnessWeeklySummary> {
  const workouts = await fetchWorkouts()
  return buildWeeklySummary(workouts)
}

async function createWorkout({ workoutDate, title, sessionType, durationMinutes, notes }: CreateWorkoutInput): Promise<void> {
  const userId = await requireUserId()
  const resolvedDuration = Math.max(0, Math.floor(durationMinutes))
  const startTime = new Date(`${workoutDate}T00:00:00.000Z`)
  const endTime = new Date(startTime.getTime() + resolvedDuration * 60_000)

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      workout_date: workoutDate,
      title: title.trim(),
      session_type: sessionType?.trim() || null,
      duration_minutes: resolvedDuration,
      notes: notes?.trim() || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to create workout', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'workout',
    entityId: data.id,
    eventType: 'workout_created',
    payload: {
      workoutDate,
      durationMinutes: resolvedDuration,
    },
  })
}

async function startWorkoutSession({ title, sessionType, notes }: StartWorkoutSessionInput): Promise<void> {
  const userId = await requireUserId()
  const startTime = new Date().toISOString()
  const workoutDate = toIndiaDateKey(startTime)

  const activeWorkout = await fetchActiveWorkout()
  if (activeWorkout) {
    throw new Error('An active workout session is already running.')
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      workout_date: workoutDate,
      title: title?.trim() || 'Live Workout Session',
      session_type: sessionType?.trim() || 'Calisthenics',
      duration_minutes: 0,
      notes: notes?.trim() || null,
      start_time: startTime,
      end_time: null,
      updated_at: startTime,
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to start workout session', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'workout',
    entityId: data.id,
    eventType: 'workout_started',
    payload: {
      workoutDate,
      sessionType: sessionType?.trim() || 'Calisthenics',
    },
  })
}

async function endWorkoutSession({ workoutId, startTime }: EndWorkoutSessionInput): Promise<void> {
  const userId = await requireUserId()
  const endTimeIso = new Date().toISOString()
  const startDate = new Date(startTime)
  const endDate = new Date(endTimeIso)
  const diffMinutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))

  const { error } = await supabase
    .from('workouts')
    .update({
      end_time: endTimeIso,
      duration_minutes: diffMinutes,
      updated_at: endTimeIso,
    })
    .eq('id', workoutId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .is('end_time', null)

  if (error) {
    throw buildError('Failed to end workout session', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'workout',
    entityId: workoutId,
    eventType: 'workout_completed',
    payload: {
      durationMinutes: diffMinutes,
    },
  })
}

async function updateWorkout({ id, workoutDate, title, sessionType, durationMinutes, notes }: UpdateWorkoutInput): Promise<void> {
  const userId = await requireUserId()
  const resolvedDuration = Math.max(0, Math.floor(durationMinutes))

  const { error } = await supabase
    .from('workouts')
    .update({
      workout_date: workoutDate,
      title: title.trim(),
      session_type: sessionType?.trim() || null,
      duration_minutes: resolvedDuration,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to update workout', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'workout',
    entityId: id,
    eventType: 'workout_updated',
    payload: {
      workoutDate,
      durationMinutes: resolvedDuration,
    },
  })
}

async function deleteWorkout({ id }: DeleteWorkoutInput): Promise<void> {
  const userId = await requireUserId()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('workouts')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to delete workout', error)
  }

  const { error: logsError } = await supabase
    .from('exercise_logs')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('workout_id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (logsError && !isMissingRelationError(logsError, 'exercise_logs')) {
    throw buildError('Failed to soft delete workout logs', logsError)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'workout',
    entityId: id,
    eventType: 'workout_deleted',
  })
}

async function createExercise(input: CreateExerciseInput): Promise<void> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('fitness_exercises')
    .insert({
      user_id: userId,
      name: input.name.trim(),
      category: input.category?.trim() || null,
      equipment: normalizeTagArray(input.equipment),
      target_muscles: normalizeTagArray(input.targetMuscles),
      default_unit: input.defaultUnit?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to create fitness exercise', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'fitness_exercise',
    entityId: data.id,
    eventType: 'fitness_exercise_created',
  })
}

async function updateExercise(input: UpdateExerciseInput): Promise<void> {
  const userId = await requireUserId()
  const { error } = await supabase
    .from('fitness_exercises')
    .update({
      name: input.name.trim(),
      category: input.category?.trim() || null,
      equipment: normalizeTagArray(input.equipment),
      target_muscles: normalizeTagArray(input.targetMuscles),
      default_unit: input.defaultUnit?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to update fitness exercise', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'fitness_exercise',
    entityId: input.id,
    eventType: 'fitness_exercise_updated',
  })
}

async function deleteExercise({ id }: DeleteExerciseInput): Promise<void> {
  const userId = await requireUserId()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('fitness_exercises')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to delete fitness exercise', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'fitness_exercise',
    entityId: id,
    eventType: 'fitness_exercise_deleted',
  })
}

async function resolveLogOrderIndex(userId: string, workoutId: string) {
  const { data: lastLog, error } = await supabase
    .from('exercise_logs')
    .select('order_index')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .is('deleted_at', null)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && !isMissingRelationError(error, 'exercise_logs')) {
    throw buildError('Failed to resolve exercise log order index', error)
  }

  if (typeof lastLog?.order_index !== 'number') {
    return 0
  }

  return lastLog.order_index + 1
}

async function addExerciseLog(input: ExerciseLogInput): Promise<void> {
  const userId = await requireUserId()
  const resolvedOrderIndex = input.orderIndex ?? (await resolveLogOrderIndex(userId, input.workoutId))

  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: userId,
      workout_id: input.workoutId,
      exercise_id: input.exerciseId,
      order_index: resolvedOrderIndex,
      sets: normalizeInteger(input.sets),
      reps_total: normalizeInteger(input.repsTotal),
      weight_kg: normalizeNumber(input.weightKg),
      duration_minutes: normalizeInteger(input.durationMinutes),
      distance_km: normalizeNumber(input.distanceKm),
      rpe: normalizeInteger(input.rpe),
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to add exercise log', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'exercise_log',
    entityId: data.id,
    eventType: 'exercise_log_created',
    payload: {
      workoutId: input.workoutId,
      exerciseId: input.exerciseId,
    },
  })
}

async function updateExerciseLog(input: UpdateExerciseLogInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('exercise_logs')
    .update({
      exercise_id: input.exerciseId,
      order_index: Math.max(0, Math.floor(input.orderIndex)),
      sets: normalizeInteger(input.sets),
      reps_total: normalizeInteger(input.repsTotal),
      weight_kg: normalizeNumber(input.weightKg),
      duration_minutes: normalizeInteger(input.durationMinutes),
      distance_km: normalizeNumber(input.distanceKm),
      rpe: normalizeInteger(input.rpe),
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to update exercise log', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'exercise_log',
    entityId: input.id,
    eventType: 'exercise_log_updated',
    payload: {
      workoutId: input.workoutId,
      exerciseId: input.exerciseId,
    },
  })
}

async function deleteExerciseLog({ id, workoutId }: DeleteExerciseLogInput): Promise<void> {
  const userId = await requireUserId()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('exercise_logs')
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError('Failed to delete exercise log', error)
  }

  await logEventSafe({
    userId,
    domain: 'fitness-os',
    entityType: 'exercise_log',
    entityId: id,
    eventType: 'exercise_log_deleted',
    payload: {
      workoutId,
    },
  })
}

export function useFitnessExercises() {
  return useQuery({
    queryKey: fitnessExercisesQueryKey,
    queryFn: fetchFitnessExercises,
  })
}

export function useWorkouts() {
  return useQuery({
    queryKey: fitnessWorkoutsQueryKey,
    queryFn: fetchWorkouts,
  })
}

export function useActiveWorkout() {
  return useQuery({
    queryKey: fitnessActiveWorkoutQueryKey,
    queryFn: fetchActiveWorkout,
    refetchInterval: 15_000,
  })
}

export function useWorkoutDetail(workoutId: string | null) {
  return useQuery({
    queryKey: fitnessWorkoutDetailQueryKey(workoutId ?? 'none'),
    queryFn: () => fetchWorkoutDetail(workoutId ?? ''),
    enabled: Boolean(workoutId),
  })
}

export function useFitnessDashboard() {
  return useQuery({
    queryKey: fitnessDashboardQueryKey,
    queryFn: fetchFitnessDashboard,
  })
}

export function useFitnessWeeklySummary() {
  return useQuery({
    queryKey: fitnessWeeklySummaryQueryKey,
    queryFn: fetchFitnessWeeklySummary,
  })
}

function invalidateFitnessQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: fitnessWorkoutsQueryKey })
  queryClient.invalidateQueries({ queryKey: fitnessActiveWorkoutQueryKey })
  queryClient.invalidateQueries({ queryKey: fitnessDashboardQueryKey })
  queryClient.invalidateQueries({ queryKey: fitnessWeeklySummaryQueryKey })
  queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
  emitSystemFeedback({
    title: '+1 Awareness',
    description: 'Momentum +4% — system stabilizing',
  })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWorkout,
    onSuccess: () => {
      invalidateFitnessQueries(queryClient)
    },
  })
}

export function useStartWorkoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startWorkoutSession,
    onSuccess: () => {
      invalidateFitnessQueries(queryClient)
    },
  })
}

export function useEndWorkoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: endWorkoutSession,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.workoutId) })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
    },
  })
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWorkout,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.id) })
    },
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteWorkout,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.id) })
    },
  })
}

export function useCreateFitnessExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitnessExercisesQueryKey })
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailBaseQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: '+1 Awareness',
        description: 'Momentum +4% — system stabilizing',
      })
    },
  })
}

export function useUpdateFitnessExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitnessExercisesQueryKey })
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailBaseQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: '+1 Awareness',
        description: 'Momentum +4% — system stabilizing',
      })
    },
  })
}

export function useDeleteFitnessExercise() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExercise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fitnessExercisesQueryKey })
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailBaseQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: '+1 Awareness',
        description: 'Momentum +4% — system stabilizing',
      })
    },
  })
}

export function useAddExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addExerciseLog,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.workoutId) })
    },
  })
}

export function useUpdateExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateExerciseLog,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.workoutId) })
    },
  })
}

export function useDeleteExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteExerciseLog,
    onSuccess: (_, variables) => {
      invalidateFitnessQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: fitnessWorkoutDetailQueryKey(variables.workoutId) })
    },
  })
}
