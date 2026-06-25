import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'
import { systemStatusQueryKey } from '../../system/api/useSystemStatus'
import { emitSystemFeedback } from '../../system/feedback'

export const productivityTasksQueryKey = ['productivity-hub', 'tasks'] as const

export type TaskDeadlineType = 'same_day' | 'no_deadline' | 'specific_date'

export type Task = {
  id: string
  user_id: string
  title: string
  deadline_type: TaskDeadlineType
  deadline_date: string | null
  is_completed: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type CreateTaskInput = {
  title: string
  deadlineType: TaskDeadlineType
  deadlineDate: string | null
}

type ToggleTaskCompletionInput = {
  id: string
  isCompleted: boolean
}

type DeleteTaskInput = {
  id: string
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

function normalizeDeadlineDate(deadlineType: TaskDeadlineType, deadlineDate: string | null): string | null {
  if (deadlineType !== 'specific_date') {
    return null
  }

  const normalized = deadlineDate?.trim() ?? ''
  if (!normalized) {
    throw new Error('A specific deadline date is required.')
  }

  return normalized
}

async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, user_id, title, deadline_type, deadline_date, is_completed, created_at, updated_at, deleted_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[useTasks] Failed to fetch tasks', error)
    throw new Error(`Failed to fetch tasks: ${extractErrorMessage(error)}`)
  }

  return data ?? []
}

async function requireUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[useTasks] Failed to fetch auth user', error)
    throw new Error(`Auth check failed: ${extractErrorMessage(error)}`)
  }

  if (!user) {
    throw new Error('User is not authenticated.')
  }

  return user.id
}

async function createTask({ title, deadlineType, deadlineDate }: CreateTaskInput): Promise<void> {
  const userId = await requireUserId()
  const normalizedTitle = title.trim()
  const resolvedDeadlineDate = normalizeDeadlineDate(deadlineType, deadlineDate)

  if (!normalizedTitle) {
    throw new Error('Task title is required.')
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: normalizedTitle,
      deadline_type: deadlineType,
      deadline_date: resolvedDeadlineDate,
      is_completed: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[useTasks] Failed to create task', error)
    throw new Error(`Failed to create task: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'task',
    entityId: data.id,
    eventType: 'task_created',
    payload: {
      deadline_type: deadlineType,
      deadline_date: resolvedDeadlineDate,
      is_completed: false,
    },
  })
}

async function toggleTaskCompletion({ id, isCompleted }: ToggleTaskCompletionInput): Promise<void> {
  const userId = await requireUserId()
  const updatedAt = new Date().toISOString()

  const { error } = await supabase
    .from('tasks')
    .update({
      is_completed: isCompleted,
      updated_at: updatedAt,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    console.error('[useTasks] Failed to update task completion', error)
    throw new Error(`Failed to update task: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'task',
    entityId: id,
    eventType: 'task_status_updated',
    payload: {
      is_completed: isCompleted,
      status: isCompleted ? 'Done' : 'Open',
    },
    createdAt: updatedAt,
  })
}

async function deleteTask({ id }: DeleteTaskInput): Promise<void> {
  const userId = await requireUserId()
  const deletedAt = new Date().toISOString()

  const { error } = await supabase
    .from('tasks')
    .update({
      deleted_at: deletedAt,
      updated_at: deletedAt,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    console.error('[useTasks] Failed to delete task', error)
    throw new Error(`Failed to delete task: ${extractErrorMessage(error)}`)
  }
}

export function useTasks() {
  return useQuery({
    queryKey: productivityTasksQueryKey,
    queryFn: fetchTasks,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityTasksQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: '+1 Awareness',
        description: 'Task logged into the calendar ledger.',
      })
    },
  })
}

export function useToggleTaskCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleTaskCompletion,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productivityTasksQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: variables.isCompleted ? '+1 Completion' : 'Task Reopened',
        description: variables.isCompleted ? 'Task checked off.' : 'Task returned to the active ledger.',
      })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityTasksQueryKey })
      queryClient.invalidateQueries({ queryKey: systemStatusQueryKey })
      emitSystemFeedback({
        title: 'Task Removed',
        description: 'Task archived from the active ledger.',
      })
    },
  })
}
