import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'

export const productivityTasksQueryKey = ['productivity-hub', 'tasks'] as const

export type TaskPriority = 'Low' | 'Medium' | 'High'
export type TaskStatus = 'To Do' | 'Doing' | 'Done'

export type Task = {
  id: string
  user_id: string
  title: string
  priority: TaskPriority
  status: TaskStatus
  created_at: string
  updated_at: string
  deleted_at: string | null
}

type CreateTaskInput = {
  title: string
  priority: TaskPriority
}

type UpdateTaskStatusInput = {
  id: string
  status: TaskStatus
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

async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, user_id, title, priority, status, created_at, updated_at, deleted_at')
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

async function createTask({ title, priority }: CreateTaskInput): Promise<void> {
  const userId = await requireUserId()

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      priority,
      status: 'To Do',
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
      priority,
    },
  })
}

async function updateTaskStatus({ id, status }: UpdateTaskStatusInput): Promise<void> {
  const userId = await requireUserId()

  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (error) {
    console.error('[useTasks] Failed to update task status', error)
    throw new Error(`Failed to update task: ${extractErrorMessage(error)}`)
  }

  await logEventSafe({
    userId,
    domain: 'productivity-hub',
    entityType: 'task',
    entityId: id,
    eventType: 'task_status_updated',
    payload: {
      status,
    },
  })
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
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTaskStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productivityTasksQueryKey })
    },
  })
}
