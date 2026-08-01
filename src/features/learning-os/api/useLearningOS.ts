import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Json } from '../../../types/database.types'
import { logEventSafe } from '../../../lib/events'
import { supabase } from '../../../lib/supabase'
import type {
  LearningRoadmap,
  LearningStage,
  LearningSession,
  LearningSessionLog,
  LearningMilestone,
  LearningProject,
  LearningReflection,
  StageProgress,
  RoadmapProgress,
  RoadmapStatus,
} from '../types/types'
import {
  LEARNING_ROADMAP_CREATED,
  LEARNING_ROADMAP_STATUS_CHANGED,
  LEARNING_STAGE_SKIPPED,
  LEARNING_SESSION_LOGGED,
  LEARNING_SESSION_SKIPPED,
} from '../../../lib/eventTaxonomy'

export const learningRoadmapsQueryKey = ['learning-os', 'roadmaps'] as const
export const learningRoadmapDetailQueryKey = (id: string) => ['learning-os', 'roadmap', id] as const
export const learningSessionLogsQueryKey = ['learning-os', 'session-logs'] as const
export const learningMilestonesQueryKey = ['learning-os', 'milestones'] as const
export const learningProjectsQueryKey = ['learning-os', 'projects'] as const
export const learningReflectionsQueryKey = ['learning-os', 'reflections'] as const

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return 'Unknown error'
}

function isMissingRelationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('does not exist') && (message.includes('relation') || message.includes('table'))
}

async function requireUserId() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(`Auth check failed: ${getErrorMessage(error)}`)
  if (!user) throw new Error('User is not authenticated.')
  return user.id
}

// ---------------------------------------------------------
// QUERIES
// ---------------------------------------------------------

export function useRoadmaps() {
  return useQuery({
    queryKey: learningRoadmapsQueryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        if (isMissingRelationError(error)) return [] as LearningRoadmap[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as LearningRoadmap[]
    },
  })
}

export function useRoadmapProgress() {
  return useQuery({
    queryKey: ['learning-os', 'roadmap-progress'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_roadmap_progress')
        .select('*')

      if (error) {
        if (isMissingRelationError(error)) return [] as RoadmapProgress[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as RoadmapProgress[]
    },
  })
}

export function useRoadmapDetail(roadmapId: string | undefined) {
  return useQuery({
    queryKey: learningRoadmapDetailQueryKey(roadmapId!),
    enabled: !!roadmapId,
    queryFn: async () => {
      const [roadmapRes, stagesRes, sessionsRes, progressRes] = await Promise.all([
        supabase.from('learning_roadmaps').select('*').eq('id', roadmapId!).is('deleted_at', null).single(),
        supabase.from('learning_stages').select('*').eq('roadmap_id', roadmapId!).is('deleted_at', null).order('order_index'),
        supabase.from('learning_sessions').select('*, stage:learning_stages!inner(roadmap_id)').eq('stage.roadmap_id', roadmapId!).is('deleted_at', null).order('order_index'),
        supabase.from('learning_stage_progress').select('*').eq('roadmap_id', roadmapId!),
      ])

      if (roadmapRes.error) {
        if (isMissingRelationError(roadmapRes.error)) return null
        throw new Error(getErrorMessage(roadmapRes.error))
      }

      return {
        roadmap: roadmapRes.data as LearningRoadmap,
        stages: (stagesRes.data ?? []) as LearningStage[],
        sessions: (sessionsRes.data ?? []) as LearningSession[],
        stageProgress: (progressRes.data ?? []) as StageProgress[],
      }
    },
  })
}

export function useRecentSessionLogs(roadmapId?: string) {
  return useQuery({
    queryKey: [...learningSessionLogsQueryKey, roadmapId],
    queryFn: async () => {
      let query = supabase
        .from('learning_session_logs')
        .select('*')
        .is('deleted_at', null)
        .order('logged_at', { ascending: false })
        .limit(20)
      
      if (roadmapId) {
        query = query.eq('roadmap_id', roadmapId)
      }

      const { data, error } = await query

      if (error) {
        if (isMissingRelationError(error)) return [] as LearningSessionLog[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as LearningSessionLog[]
    },
  })
}

export function useRoadmapMilestones(roadmapId: string | undefined) {
  return useQuery({
    queryKey: [...learningMilestonesQueryKey, roadmapId],
    enabled: !!roadmapId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_milestones')
        .select('*')
        .eq('roadmap_id', roadmapId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) {
        if (isMissingRelationError(error)) return [] as LearningMilestone[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as LearningMilestone[]
    },
  })
}

export function useRoadmapProjects(roadmapId: string | undefined) {
  return useQuery({
    queryKey: [...learningProjectsQueryKey, roadmapId],
    enabled: !!roadmapId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_projects')
        .select('*')
        .eq('roadmap_id', roadmapId!)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) {
        if (isMissingRelationError(error)) return [] as LearningProject[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as LearningProject[]
    },
  })
}

export function useReflections(roadmapId?: string, stageId?: string) {
  return useQuery({
    queryKey: [...learningReflectionsQueryKey, roadmapId, stageId],
    queryFn: async () => {
      let query = supabase
        .from('learning_reflections')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      
      if (roadmapId) query = query.eq('roadmap_id', roadmapId)
      if (stageId) query = query.eq('stage_id', stageId)

      const { data, error } = await query

      if (error) {
        if (isMissingRelationError(error)) return [] as LearningReflection[]
        throw new Error(getErrorMessage(error))
      }
      return (data ?? []) as LearningReflection[]
    },
  })
}

// ---------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------

export interface CreateRoadmapPayload {
  title: string
  description?: string
  color?: string
  startDate?: string
  targetEndDate?: string
}

export function useCreateRoadmap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, description, color, startDate, targetEndDate }: CreateRoadmapPayload) => {
      const userId = await requireUserId()
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .insert({
          user_id: userId,
          title,
          description: description || null,
          color: color || null,
          start_date: startDate || null,
          target_end_date: targetEndDate || null,
        })
        .select('id')
        .single()

      if (error) throw new Error(getErrorMessage(error))
      
      await logEventSafe({
        userId,
        domain: 'learning-os',
        entityType: 'roadmap',
        entityId: data.id,
        eventType: LEARNING_ROADMAP_CREATED,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapsQueryKey })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}

export interface CreateStagePayload {
  roadmapId: string
  title: string
  subtitle?: string
  note?: string
  color?: string
  orderIndex?: number
  startDate?: string
  endDate?: string
}

export interface CreateSessionPayload {
  roadmapId: string
  stageId: string
  title: string
  description?: string
  slot?: string
  estimatedMinutes?: number
  tags?: string[]
  orderIndex?: number
  targetDate?: string
}

export function useCreateStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      roadmapId,
      title,
      subtitle,
      note,
      color,
      orderIndex,
      startDate,
      endDate,
    }: CreateStagePayload) => {
      const userId = await requireUserId()
      const { data, error } = await supabase
        .from('learning_stages')
        .insert({
          user_id: userId,
          roadmap_id: roadmapId,
          title,
          subtitle: subtitle || null,
          note: note || null,
          color: color || null,
          order_index: orderIndex ?? 0,
          start_date: startDate || null,
          end_date: endDate || null,
        })
        .select('*')
        .single()

      if (error) throw new Error(getErrorMessage(error))
      return data as LearningStage
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(roadmapId) })
      queryClient.invalidateQueries({ queryKey: ['learning-os', 'roadmap-progress'] })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      stageId,
      title,
      description,
      slot,
      estimatedMinutes,
      tags,
      orderIndex,
      targetDate,
    }: CreateSessionPayload) => {
      const userId = await requireUserId()
      const { data, error } = await supabase
        .from('learning_sessions')
        .insert({
          user_id: userId,
          stage_id: stageId,
          title,
          description: description || null,
          slot: slot || null,
          estimated_minutes: estimatedMinutes ?? null,
          tags: tags ?? [],
          order_index: orderIndex ?? 0,
          target_date: targetDate || null,
        })
        .select('*')
        .single()

      if (error) throw new Error(getErrorMessage(error))
      return data as LearningSession
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(roadmapId) })
      queryClient.invalidateQueries({ queryKey: ['learning-os', 'roadmap-progress'] })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}

export function useUpdateRoadmapStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RoadmapStatus }) => {
      const userId = await requireUserId()
      const actual_end_date = status === 'completed' || status === 'abandoned' ? new Date().toISOString().slice(0, 10) : null
      const { error } = await supabase
        .from('learning_roadmaps')
        .update({ status, actual_end_date })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(getErrorMessage(error))
      
      await logEventSafe({
        userId,
        domain: 'learning-os',
        entityType: 'roadmap',
        entityId: id,
        eventType: LEARNING_ROADMAP_STATUS_CHANGED,
        payload: { status },
      })
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapsQueryKey })
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(id) })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}

export function useLogSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ 
      roadmapId, sessionId, timeLogId, durationMinutes, metrics, notes 
    }: { 
      roadmapId: string; sessionId?: string; timeLogId?: string; durationMinutes?: number; metrics?: Record<string, unknown>; notes?: string 
    }) => {
      const userId = await requireUserId()
      const { data, error } = await supabase
        .from('learning_session_logs')
        .insert({
          user_id: userId,
          roadmap_id: roadmapId,
          session_id: sessionId || null,
          time_log_id: timeLogId || null,
          duration_minutes: durationMinutes,
          metrics: (metrics || {}) as unknown as Json,
          notes
        })
        .select('id')
        .single()

      if (error) throw new Error(getErrorMessage(error))
      
      await logEventSafe({
        userId,
        domain: 'learning-os',
        entityType: 'session_log',
        entityId: data.id,
        eventType: LEARNING_SESSION_LOGGED,
        payload: { roadmapId, sessionId, durationMinutes },
      })
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(roadmapId) })
      queryClient.invalidateQueries({ queryKey: learningSessionLogsQueryKey })
      queryClient.invalidateQueries({ queryKey: ['learning-os', 'roadmap-progress'] })
      queryClient.invalidateQueries({ queryKey: ['system-status'] })
    },
  })
}

export function useSkipStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ stageId }: { stageId: string, roadmapId: string }) => {
      const userId = await requireUserId()
      const { error } = await supabase
        .from('learning_stages')
        .update({ is_skipped: true })
        .eq('id', stageId)
        .eq('user_id', userId)

      if (error) throw new Error(getErrorMessage(error))
      
      await logEventSafe({
        userId,
        domain: 'learning-os',
        entityType: 'stage',
        entityId: stageId,
        eventType: LEARNING_STAGE_SKIPPED,
      })
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(roadmapId) })
      queryClient.invalidateQueries({ queryKey: ['learning-os', 'roadmap-progress'] })
    },
  })
}

export function useSkipSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string, roadmapId: string }) => {
      const userId = await requireUserId()
      const { error } = await supabase
        .from('learning_sessions')
        .update({ is_skipped: true })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (error) throw new Error(getErrorMessage(error))
      
      await logEventSafe({
        userId,
        domain: 'learning-os',
        entityType: 'session',
        entityId: sessionId,
        eventType: LEARNING_SESSION_SKIPPED,
      })
    },
    onSuccess: (_, { roadmapId }) => {
      queryClient.invalidateQueries({ queryKey: learningRoadmapDetailQueryKey(roadmapId) })
      queryClient.invalidateQueries({ queryKey: ['learning-os', 'roadmap-progress'] })
    },
  })
}
