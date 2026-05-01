import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'
import { logEventSafe } from '../../../lib/events'
import { emitSystemFeedback } from '../../system/feedback'
import { systemStatusQueryKey } from '../../system/api/useSystemStatus'
import { useEventBus } from '../../../store/useEventBus'

export const TIME_BUCKETS = ['Academics', 'Deep Work', 'Admin', 'Fitness', 'Learning'] as const

export type TimeBucket = (typeof TIME_BUCKETS)[number]

export type TimeLog = {
  id: string
  user_id: string
  task_id: string | null
  bucket: TimeBucket
  description: string | null
  start_time: string
  end_time: string | null
  duration_minutes: number | null
  created_at: string
  updated_at: string
}

export type CompletedTimeLog = TimeLog & {
  task_title: string | null
}

type StartTimerInput = {
  taskId?: string | null
  bucket: TimeBucket
  description?: string
}

type ManualLogInput = {
  taskId?: string | null
  bucket: TimeBucket
  description?: string
  startTime: string
  endTime: string
}

type TimeLoggedEventPayload = {
  userId: string
  logId: string
  taskId: string | null
  bucket: TimeBucket
  durationMinutes: number
}

const timeLogsBaseQueryKey = ['time-os', 'time-logs'] as const
export const timeLogsActiveQueryKey = [...timeLogsBaseQueryKey, 'active'] as const
export const timeLogsCompletedQueryKey = [...timeLogsBaseQueryKey, 'completed'] as const
const timeAnalyticsQueryKey = ['time-os', 'analytics'] as const
const productivityTasksQueryKey = ['productivity-hub', 'tasks'] as const

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

function getDurationMinutes(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime()
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return 0
  }

  return Math.max(0, Math.round(diffMs / 60000))
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

async function fetchActiveTimer(): Promise<TimeLog | null> {
  const { data, error } = await supabase
    .from('time_logs')
    .select('id, user_id, task_id, bucket, description, start_time, end_time, duration_minutes, created_at, updated_at')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingRelationError(error, 'time_logs')) {
      return null
    }

    throw buildError('Failed to fetch active timer', error)
  }

  return (data as TimeLog | null) ?? null
}

async function fetchCompletedTimeLogs(): Promise<CompletedTimeLog[]> {
  const { data, error } = await supabase
    .from('time_logs')
    .select('id, user_id, task_id, bucket, description, start_time, end_time, duration_minutes, created_at, updated_at, tasks(title)')
    .not('end_time', 'is', null)
    .order('end_time', { ascending: false })
    .limit(30)

  if (error) {
    if (isMissingRelationError(error, 'time_logs')) {
      return []
    }

    throw buildError('Failed to fetch completed time logs', error)
  }

  return (data ?? []).map((row) => {
    const taskRelation = row.tasks as { title?: string } | Array<{ title?: string }> | null
    const taskTitle = Array.isArray(taskRelation) ? taskRelation[0]?.title ?? null : taskRelation?.title ?? null

    return {
      id: row.id,
      user_id: row.user_id,
      task_id: row.task_id,
      bucket: row.bucket as TimeBucket,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      duration_minutes: row.duration_minutes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      task_title: taskTitle,
    }
  })
}

async function setTaskStatusFromTimer(userId: string, taskId: string, status: 'Doing' | 'Done') {
  const { error } = await supabase
    .from('tasks')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    throw buildError(`Failed to set linked task to ${status}`, error)
  }
}

async function startTimer({ taskId, bucket, description }: StartTimerInput): Promise<void> {
  const userId = await requireUserId()

  const existingActive = await fetchActiveTimer()
  if (existingActive) {
    throw new Error('An active timer is already running. Stop it before starting a new session.')
  }

  const { error } = await supabase.from('time_logs').insert({
    user_id: userId,
    task_id: taskId ?? null,
    bucket,
    description: description?.trim() || null,
    start_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) {
    throw buildError('Failed to start timer', error)
  }

  if (taskId) {
    await setTaskStatusFromTimer(userId, taskId, 'Doing')
  }
}

async function stopTimer(): Promise<TimeLoggedEventPayload | null> {
  const userId = await requireUserId()
  const activeTimer = await fetchActiveTimer()

  if (!activeTimer) {
    return null
  }

  const endTime = new Date()
  const startTime = new Date(activeTimer.start_time)
  const durationMinutes = getDurationMinutes(startTime, endTime)

  const { error } = await supabase
    .from('time_logs')
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: endTime.toISOString(),
    })
    .eq('id', activeTimer.id)
    .eq('user_id', userId)
    .is('end_time', null)

  if (error) {
    throw buildError('Failed to stop timer', error)
  }

  if (activeTimer.task_id) {
    await setTaskStatusFromTimer(userId, activeTimer.task_id, 'Done')
  }

  return {
    userId,
    logId: activeTimer.id,
    taskId: activeTimer.task_id ?? null,
    bucket: activeTimer.bucket,
    durationMinutes,
  }
}

async function createManualLog({ taskId, bucket, description, startTime, endTime }: ManualLogInput): Promise<TimeLoggedEventPayload> {
  const userId = await requireUserId()
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new Error('Start and end times are required.')
  }

  if (end <= start) {
    throw new Error('End time must be after start time.')
  }

  const durationMinutes = getDurationMinutes(start, end)

  const { data, error } = await supabase
    .from('time_logs')
    .insert({
      user_id: userId,
      task_id: taskId ?? null,
      bucket,
      description: description?.trim() || null,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw buildError('Failed to create manual log', error)
  }

  return {
    userId,
    logId: data.id,
    taskId: taskId ?? null,
    bucket,
    durationMinutes,
  }
}

function invalidateTimeLogQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: timeLogsBaseQueryKey })
  queryClient.invalidateQueries({ queryKey: timeLogsActiveQueryKey })
  queryClient.invalidateQueries({ queryKey: timeLogsCompletedQueryKey })
  queryClient.invalidateQueries({ queryKey: productivityTasksQueryKey })
  queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
  queryClient.invalidateQueries({ queryKey: timeAnalyticsQueryKey })
}

export function useActiveTimer() {
  return useQuery({
    queryKey: timeLogsActiveQueryKey,
    queryFn: fetchActiveTimer,
    refetchInterval: 30_000,
  })
}

export function useCompletedTimeLogs() {
  return useQuery({
    queryKey: timeLogsCompletedQueryKey,
    queryFn: fetchCompletedTimeLogs,
  })
}

export function useStartTimer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: startTimer,
    onSuccess: () => {
      invalidateTimeLogQueries(queryClient)
      emitSystemFeedback({
        title: '+1 Focus',
        description: 'Linked task moved to Doing',
      })
    },
  })
}

export function useStopTimer() {
  const queryClient = useQueryClient()
  const emitEvent = useEventBus((state) => state.emitEvent)

  return useMutation({
    mutationFn: stopTimer,
    onSuccess: (eventPayload) => {
      if (eventPayload) {
        void logEventSafe({
          userId: eventPayload.userId,
          domain: 'time-os',
          entityType: 'time_log',
          entityId: eventPayload.logId,
          eventType: 'TIME_LOGGED',
          payload: {
            bucket: eventPayload.bucket,
            duration_minutes: eventPayload.durationMinutes,
            task_id: eventPayload.taskId,
            source: 'stop_timer',
          },
        })
      }

      invalidateTimeLogQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      if (
        eventPayload
        && eventPayload.durationMinutes > 0
        && (eventPayload.bucket === 'Deep Work' || eventPayload.bucket === 'Learning')
      ) {
        emitEvent('DEEP_WORK_COMPLETED', {
          minutes: eventPayload.durationMinutes,
          bucket: eventPayload.bucket,
        })
      }
      emitSystemFeedback({
        title: '+1 Completion',
        description: 'Session saved and linked task moved to Done',
      })
    },
  })
}

export function useManualLog() {
  const queryClient = useQueryClient()
  const emitEvent = useEventBus((state) => state.emitEvent)

  return useMutation({
    mutationFn: createManualLog,
    onSuccess: (eventPayload) => {
      void logEventSafe({
        userId: eventPayload.userId,
        domain: 'time-os',
        entityType: 'time_log',
        entityId: eventPayload.logId,
        eventType: 'TIME_LOGGED',
        payload: {
          bucket: eventPayload.bucket,
          duration_minutes: eventPayload.durationMinutes,
          task_id: eventPayload.taskId,
          source: 'manual_log',
        },
      })

      invalidateTimeLogQueries(queryClient)
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      if (
        eventPayload.durationMinutes > 0
        && (eventPayload.bucket === 'Deep Work' || eventPayload.bucket === 'Learning')
      ) {
        emitEvent('DEEP_WORK_COMPLETED', {
          minutes: eventPayload.durationMinutes,
          bucket: eventPayload.bucket,
        })
      }
      emitSystemFeedback({
        title: '+1 Time Logged',
        description: 'Manual session saved',
      })
    },
  })
}
