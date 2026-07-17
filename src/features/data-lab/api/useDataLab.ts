import { useQuery } from '@tanstack/react-query'

import { supabase } from '../../../lib/supabase'

export const dataLabDailyActivityQueryKey = ['data-lab', 'daily-activity-90d'] as const
export const dataLabWeeklyScoreQueryKey = ['data-lab', 'weekly-score-12w'] as const
export const dataLabModuleConsistencyQueryKey = ['data-lab', 'module-consistency-30d'] as const
export const dataLabEventCoverageQueryKey = ['data-lab', 'event-coverage-30d'] as const
export const dataLabRecentEventsQueryKey = ['data-lab', 'recent-events'] as const

export type DataLabDailyActivity = {
  user_id: string
  activity_date: string
  active_habits: number
  habits_completed: number
  journal_entries: number
  avg_mood: number
  tasks_created: number
  tasks_completed: number
  total_focus_minutes: number
  deep_work_minutes: number
  workouts_logged: number
  workout_minutes: number
  finance_entries: number
  total_spent: number
  need_spent: number
  want_spent: number
  active_system_count: number
}

export type DataLabWeeklyScore = {
  user_id: string
  week_start_date: string
  days_observed: number
  habit_days: number
  journal_days: number
  task_days: number
  deep_work_days: number
  workout_days: number
  avg_active_system_count: number
  habits_completed: number
  journal_entries: number
  tasks_created: number
  tasks_completed: number
  total_focus_minutes: number
  deep_work_minutes: number
  workouts_logged: number
  workout_minutes: number
  finance_entries: number
  total_spent: number
  need_spent: number
  want_spent: number
  weekly_system_score: number
}

export type DataLabModuleConsistency = {
  user_id: string
  module_name: string
  days_observed: number
  active_days: number
  consistency_percent: number
  last_active_date: string | null
}

export type DataLabEventCoverage = {
  user_id: string
  domain: string
  event_type: string
  event_count: number
  active_days: number
  first_seen_date: string
  last_seen_date: string
}

export type DataLabRecentEvent = {
  id: string
  user_id: string
  domain: string
  entity_type: string
  entity_id: string | null
  event_type: string
  event_date_ist: string
  payload: Record<string, unknown>
  created_at: string
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

function isMissingRelationError(error: unknown, relationName: string): boolean {
  const code = getErrorCode(error).toLowerCase()
  const message = getErrorMessage(error).toLowerCase()
  const relation = relationName.toLowerCase()

  if (code === '42p01' || code === 'pgrst205') {
    return message.includes(relation)
  }

  return message.includes(relation) && message.includes('does not exist')
}

function buildError(context: string, error: unknown): Error {
  return new Error(`${context}: ${getErrorMessage(error)}`)
}

async function fetchDataLabDailyActivity(): Promise<DataLabDailyActivity[]> {
  const { data, error } = await supabase
    .from('data_lab_daily_activity_90d')
    .select(
      'user_id, activity_date, active_habits, habits_completed, journal_entries, avg_mood, tasks_created, tasks_completed, total_focus_minutes, deep_work_minutes, workouts_logged, workout_minutes, finance_entries, total_spent, need_spent, want_spent, active_system_count',
    )
    .order('activity_date', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'data_lab_daily_activity_90d')) {
      return []
    }

    throw buildError('Failed to fetch Data Lab daily activity', error)
  }

  return ((data ?? []) as Array<Omit<DataLabDailyActivity, 'avg_mood' | 'total_spent' | 'need_spent' | 'want_spent'> & {
    avg_mood: number | string
    total_spent: number | string
    need_spent: number | string
    want_spent: number | string
  }>).map((row) => ({
    ...row,
    avg_mood: Number(row.avg_mood),
    total_spent: Number(row.total_spent),
    need_spent: Number(row.need_spent),
    want_spent: Number(row.want_spent),
  }))
}

async function fetchDataLabWeeklyScore(): Promise<DataLabWeeklyScore[]> {
  const { data, error } = await supabase
    .from('data_lab_weekly_system_score_12w')
    .select(
      'user_id, week_start_date, days_observed, habit_days, journal_days, task_days, deep_work_days, workout_days, avg_active_system_count, habits_completed, journal_entries, tasks_created, tasks_completed, total_focus_minutes, deep_work_minutes, workouts_logged, workout_minutes, finance_entries, total_spent, need_spent, want_spent, weekly_system_score',
    )
    .order('week_start_date', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'data_lab_weekly_system_score_12w')) {
      return []
    }

    throw buildError('Failed to fetch Data Lab weekly score', error)
  }

  return ((data ?? []) as Array<Omit<DataLabWeeklyScore, 'avg_active_system_count' | 'total_spent' | 'need_spent' | 'want_spent'> & {
    avg_active_system_count: number | string
    total_spent: number | string
    need_spent: number | string
    want_spent: number | string
  }>).map((row) => ({
    ...row,
    avg_active_system_count: Number(row.avg_active_system_count),
    total_spent: Number(row.total_spent),
    need_spent: Number(row.need_spent),
    want_spent: Number(row.want_spent),
  }))
}

async function fetchDataLabModuleConsistency(): Promise<DataLabModuleConsistency[]> {
  const { data, error } = await supabase
    .from('data_lab_module_consistency_30d')
    .select('user_id, module_name, days_observed, active_days, consistency_percent, last_active_date')
    .order('consistency_percent', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'data_lab_module_consistency_30d')) {
      return []
    }

    throw buildError('Failed to fetch Data Lab module consistency', error)
  }

  return (data ?? []) as DataLabModuleConsistency[]
}

async function fetchDataLabEventCoverage(): Promise<DataLabEventCoverage[]> {
  const { data, error } = await supabase
    .from('data_lab_event_coverage_30d')
    .select('user_id, domain, event_type, event_count, active_days, first_seen_date, last_seen_date')
    .order('domain', { ascending: true })
    .order('event_count', { ascending: false })

  if (error) {
    if (isMissingRelationError(error, 'data_lab_event_coverage_30d')) {
      return []
    }

    throw buildError('Failed to fetch Data Lab event coverage', error)
  }

  return (data ?? []) as DataLabEventCoverage[]
}

async function fetchDataLabRecentEvents(): Promise<DataLabRecentEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, user_id, domain, entity_type, entity_id, event_type, event_date_ist, payload, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) {
    if (isMissingRelationError(error, 'events')) {
      return []
    }

    throw buildError('Failed to fetch Data Lab recent events', error)
  }

  return (data ?? []) as DataLabRecentEvent[]
}

export function useDataLabDailyActivity() {
  return useQuery({
    queryKey: dataLabDailyActivityQueryKey,
    queryFn: fetchDataLabDailyActivity,
  })
}

export function useDataLabWeeklyScore() {
  return useQuery({
    queryKey: dataLabWeeklyScoreQueryKey,
    queryFn: fetchDataLabWeeklyScore,
  })
}

export function useDataLabModuleConsistency() {
  return useQuery({
    queryKey: dataLabModuleConsistencyQueryKey,
    queryFn: fetchDataLabModuleConsistency,
  })
}

export function useDataLabEventCoverage() {
  return useQuery({
    queryKey: dataLabEventCoverageQueryKey,
    queryFn: fetchDataLabEventCoverage,
  })
}

export function useDataLabRecentEvents() {
  return useQuery({
    queryKey: dataLabRecentEventsQueryKey,
    queryFn: fetchDataLabRecentEvents,
  })
}
