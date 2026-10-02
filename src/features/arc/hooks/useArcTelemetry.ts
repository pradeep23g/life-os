import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import type { Json } from '../../../types/database.types'

import { calculateArcProgress, generateArcCheckpoints, getIndiaDateKey } from '../config'
import type {
  ArcSeasonConfig,
  ArcConfig,
  ArcFocusDomain,
  ArcMilestoneConfig,
  ArcMilestoneState,
  ArcPaceStatus,
  ArcLifecycleStatus,
  ArcAmendment,
  MilestoneProgressMap,
  ArcRetrospective,
} from '../types'
import { computeAmendmentDiffs } from '../utils/amendmentAuditor'
import { resolveBinding } from '../utils/telemetryRegistry'
import { calculateOverallHealth, calculateTemporalHorizon, evaluateMilestonePace } from '../utils/paceEvaluator'
import { useDataLabDailyActivity } from '../../data-lab/api/useDataLab'
import { useMissionControlSnapshot } from '../../mission-control/api/useMissionControlSnapshot'
import { useModuleColors } from '../../../lib/useModuleColors'

export function useActiveArcSeason() {
  return useQuery<ArcSeasonConfig | null>({
    queryKey: ['active-season'],
    queryFn: async (): Promise<ArcSeasonConfig | null> => {
      // 1. Query active season
      const { data: activeData, error: activeError } = await supabase
        .from('life_seasons')
        .select('*')
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeError) {
        console.error('Failed to fetch active season:', activeError)
        return null
      }

      let data = activeData

      const today = getIndiaDateKey()

      // If active season has naturally reached its planned end date, transition to 'completed'
      if (data && data.status === 'active' && data.end_date && today > data.end_date) {
        const completedAt = `${data.end_date}T23:59:59.999Z`
        await supabase
          .from('life_seasons')
          .update({
            status: 'completed',
            completed_at: completedAt,
            planned_end_date: data.end_date,
          })
          .eq('id', data.id)

        data.status = 'completed'
        data.completed_at = completedAt
        data.planned_end_date = data.end_date
      }

      // 2. If no active season, query for the most recent unarchived 'completed' season (awaiting retrospective)
      if (!data) {
        const { data: completedData, error: completedError } = await supabase
          .from('life_seasons')
          .select('*')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle()

        if (!completedError && completedData) {
          data = completedData
        }
      }

      if (!data) {
        return null
      }

      const rawConfig = (data.original_config && typeof data.original_config === 'object'
        ? data.original_config
        : {}) as Partial<ArcSeasonConfig>
      const vowsObj = (data.vows && typeof data.vows === 'object' && !Array.isArray(data.vows)
        ? data.vows
        : {}) as Record<string, unknown>

      const startDate = data.start_date || rawConfig.startDate || ''
      const endDate = data.end_date || rawConfig.endDate || ''
      const startMs = startDate ? new Date(startDate).getTime() : NaN
      const endMs = endDate ? new Date(endDate).getTime() : NaN
      const calculatedDays = (!Number.isNaN(startMs) && !Number.isNaN(endMs))
        ? Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
        : 90
      const totalDays = rawConfig.totalDays ?? calculatedDays

      // Prioritize vowsObj (which stores latest amended commitments) over rawConfig (frozen baseline)
      const vow = (vowsObj.vow || rawConfig.vow || {
        headline: 'Season Active',
        body: 'Executing protocols.',
        attribution: 'Seasonal Directive',
      }) as ArcSeasonConfig['vow']

      const principles = (vowsObj.principles || rawConfig.principles || []) as string[]
      const phases = (vowsObj.phases || rawConfig.phases || []) as ArcSeasonConfig['phases']
      const focusDomains = (vowsObj.focusDomains ?? rawConfig.focusDomains ?? [
        { id: 'fd-cognition', name: 'Cognitive Rigor', binding: { source: 'deep_work', metric: 'total_hours' } },
        { id: 'fd-kinetic', name: 'Kinetic Discipline', binding: { source: 'fitness', metric: 'session_count' } },
        { id: 'fd-execution', name: 'Operational Throughput', binding: { source: 'tasks', metric: 'completed_count' } },
      ]) as ArcFocusDomain[]

      const rawMilestones = vowsObj.milestones ?? rawConfig.milestones
      const milestones: ArcMilestoneConfig[] = Array.isArray(rawMilestones)
        ? rawMilestones
        : [
            {
              id: 'milestone-deep-work',
              title: 'Deep Work Volume',
              kind: 'telemetry',
              targetValue: 50,
              unit: 'HOURS',
              description: 'Cumulative uninterrupted deep work hours in the Arc',
              binding: { source: 'deep_work', metric: 'total_hours' },
            },
            {
              id: 'milestone-tasks',
              title: 'Execution Output',
              kind: 'telemetry',
              targetValue: 100,
              unit: 'TASKS',
              description: 'Completed tasks recorded on the productivity ledger',
              binding: { source: 'tasks', metric: 'completed_count' },
            },
            {
              id: 'milestone-fitness',
              title: 'Kinetic Consistency',
              kind: 'telemetry',
              targetValue: 25,
              unit: 'SESSIONS',
              description: 'Validated training sessions logged in Fitness OS',
              binding: { source: 'fitness', metric: 'session_count' },
            },
            {
              id: 'milestone-habits',
              title: 'Habit Disciplines',
              kind: 'telemetry',
              targetValue: 150,
              unit: 'REPETITIONS',
              description: 'Daily habit checks fulfilled across Mind OS',
              binding: { source: 'habits', metric: 'completed_count' },
            },
          ]

      return {
        id: data.id,
        title: rawConfig.title || data.name || 'Arc',
        chapter: rawConfig.chapter || 'CURRENT',
        year: new Date(startDate).getFullYear() || new Date().getFullYear(),
        startDate,
        endDate,
        totalDays,
        tagline: vowsObj.tagline as string | undefined || rawConfig.tagline,
        accentColor: (vowsObj.accentColor as string | undefined) || rawConfig.accentColor || '#22d3ee',
        icon: (vowsObj.icon as string | undefined) || rawConfig.icon || 'snowflake',
        vow,
        principles,
        phases,
        focusDomains,
        milestones,
        status: data.status as ArcLifecycleStatus,
        completedAt: data.completed_at,
        plannedEndDate: data.planned_end_date || data.end_date || rawConfig.endDate,
        milestoneProgress: (data.milestone_progress || {}) as MilestoneProgressMap,
        amendments: (Array.isArray(data.amendments) ? ((data.amendments as unknown) as ArcAmendment[]) : []),
        originalConfig: (data.original_config && typeof data.original_config === 'object'
          ? ((data.original_config as unknown) as ArcConfig)
          : null),
      }
    },
  })
}

export function useArcTelemetry() {
  const queryClient = useQueryClient()
  const { brain } = useMissionControlSnapshot()
  const { setArcAccentColor } = useModuleColors()
  const { data: dailyActivity = [], isLoading: isActivityLoading } = useDataLabDailyActivity()

  const { data: config = null, isLoading: isSeasonLoading } = useActiveArcSeason()

  // Synchronize dynamic active arc accent color to module styling
  useEffect(() => {
    if (config?.accentColor) {
      setArcAccentColor(config.accentColor)
    }
  }, [config?.accentColor, setArcAccentColor])

  // Scope telemetry queries from start_date through completed_at ?? today
  const seasonActivity = useMemo(() => {
    if (!config) return []
    const today = getIndiaDateKey()
    const telemetryEndDate = config.completedAt
      ? config.completedAt.slice(0, 10)
      : (config.status === 'completed' || config.status === 'archived' ? config.endDate : today)
    return dailyActivity.filter(
      (r) =>
        r.activity_date >= config.startDate &&
        r.activity_date <= telemetryEndDate &&
        r.activity_date <= config.endDate,
    )
  }, [dailyActivity, config])

  const totals = useMemo(() => {
    const deepWorkMinutes = seasonActivity.reduce((sum, r) => sum + (r.deep_work_minutes || 0), 0)
    const tasksCompleted = seasonActivity.reduce((sum, r) => sum + (r.tasks_completed || 0), 0)
    const workoutsLogged = seasonActivity.reduce((sum, r) => sum + (r.workouts_logged || 0), 0)
    const habitsCompleted = seasonActivity.reduce((sum, r) => sum + (r.habits_completed || 0), 0)
    const totalFocusMinutes = seasonActivity.reduce((sum, r) => sum + (r.total_focus_minutes || 0), 0)

    return {
      deepWorkHours: Math.floor(deepWorkMinutes / 60),
      totalFocusHours: Math.floor(totalFocusMinutes / 60),
      tasksCompleted,
      workoutsLogged,
      habitsCompleted,
      activeDays: seasonActivity.length,
    }
  }, [seasonActivity])

  const progress = useMemo(() => {
    if (!config) {
      return {
        currentDay: 0,
        totalDays: 0,
        remainingDays: 0,
        percentElapsed: 0,
        status: 'upcoming' as const,
        asOfDateIST: getIndiaDateKey(),
      }
    }
    return calculateArcProgress(config)
  }, [config])

  const checkpoints = useMemo(() => {
    if (!config) return []
    return generateArcCheckpoints(config)
  }, [config])

  const milestones: ArcMilestoneState[] = useMemo(() => {
    if (!config) return []

    const temporal = calculateTemporalHorizon(
      config.startDate,
      config.endDate,
      getIndiaDateKey(),
      config.completedAt,
    )

    return (config.milestones ?? []).map((m) => {
      const actualValue = m.kind === 'telemetry' ? resolveBinding(m.binding, seasonActivity) : 0
      return evaluateMilestonePace(m, actualValue, temporal, config.milestoneProgress)
    })
  }, [config, seasonActivity])

  const overallHealth: ArcPaceStatus = useMemo(() => {
    if (!config || milestones.length === 0) return 'on_track'
    return calculateOverallHealth(milestones)
  }, [config, milestones])

  const currentCheckpoint = useMemo(() => {
    return checkpoints.find((c) => c.isCurrent) ?? checkpoints[0] ?? null
  }, [checkpoints])

  const toggleManualMilestone = useCallback(
    async (milestoneId: string, completedOrNotes?: boolean | string, maybeNotes?: string) => {
      if (!config) return
      if (config.status !== 'active') {
        console.warn('Cannot mutate milestones on a completed or archived arc; commitments are frozen.')
        return
      }

      let isCompleted: boolean | undefined
      let notes: string | undefined

      if (typeof completedOrNotes === 'boolean') {
        isCompleted = completedOrNotes
        notes = maybeNotes
      } else if (typeof completedOrNotes === 'string') {
        isCompleted = true
        notes = completedOrNotes
      } else {
        isCompleted = undefined
        notes = maybeNotes
      }

      const currentProgress: MilestoneProgressMap = { ...(config.milestoneProgress || {}) }
      const currentlyDone = Boolean(currentProgress[milestoneId]?.completedAt)
      const shouldBeDone = isCompleted !== undefined ? isCompleted : !currentlyDone

      if (shouldBeDone) {
        currentProgress[milestoneId] = {
          completedAt: new Date().toISOString(),
          notes: notes ?? currentProgress[milestoneId]?.notes ?? '',
        }
      } else {
        delete currentProgress[milestoneId]
      }

      // Optimistic cache update for instant UI response
      queryClient.setQueryData<ArcSeasonConfig | null>(['active-season'], (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          milestoneProgress: currentProgress,
        }
      })

      const { error } = await supabase
        .from('life_seasons')
        .update({ milestone_progress: currentProgress })
        .eq('id', config.id)

      if (error) {
        console.error('Failed to update manual milestone progress:', error)
        await queryClient.invalidateQueries({ queryKey: ['active-season'] })
        throw error
      }

      await queryClient.invalidateQueries({ queryKey: ['active-season'] })
    },
    [config, queryClient],
  )

  const concludeArcEarly = useCallback(async () => {
    if (!config) return
    if (config.status !== 'active') {
      console.warn('Cannot conclude an arc that is not active.')
      return
    }
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('life_seasons')
      .update({
        status: 'completed',
        completed_at: now,
        planned_end_date: config.endDate,
      })
      .eq('id', config.id)

    if (error) {
      console.error('Failed to conclude arc early:', error)
      throw error
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['active-season'] }),
      queryClient.invalidateQueries({ queryKey: ['life-seasons'] }),
      queryClient.invalidateQueries({ queryKey: ['life-seasons-archive'] }),
    ])
  }, [config, queryClient])

  const amendCommitments = useCallback(
    async (
      newCommitments: {
        vow?: ArcSeasonConfig['vow']
        principles?: string[]
        milestones?: ArcMilestoneConfig[]
      },
      reason: string,
    ) => {
      if (!config) throw new Error('No active arc to amend.')
      if (config.status !== 'active') {
        throw new Error('Cannot amend a concluded or archived arc; commitments are frozen.')
      }
      const trimmedReason = reason?.trim()
      if (!trimmedReason) {
        throw new Error('Mandatory non-empty justification reason is required for amendments.')
      }

      const previousSnapshot = {
        vow: config.vow,
        principles: config.principles,
        milestones: config.milestones,
      }

      const diffs = computeAmendmentDiffs(previousSnapshot, newCommitments, trimmedReason)
      if (diffs.length === 0) {
        return // No changes to commit
      }

      const updatedAmendments = [...(config.amendments || []), ...diffs]
      const updatedVows = {
        ...(config.originalConfig || {}),
        vow: newCommitments.vow ?? config.vow,
        principles: newCommitments.principles ?? config.principles,
        milestones: newCommitments.milestones ?? config.milestones,
        phases: config.phases,
        focusDomains: config.focusDomains,
        accentColor: config.accentColor,
        icon: config.icon,
        tagline: config.tagline,
      }

      const { error } = await supabase
        .from('life_seasons')
        .update({
          vows: (updatedVows as unknown) as Json,
          amendments: (updatedAmendments as unknown) as Json,
        })
        .eq('id', config.id)

      if (error) {
        console.error('Failed to commit commitments amendment:', error)
        throw error
      }

      await queryClient.invalidateQueries({ queryKey: ['active-season'] })
    },
    [config, queryClient],
  )

  const archiveArcWithRetrospective = useCallback(
    async (retrospectiveAnswers: {
      whatWentWell: string
      whatDidnt: string
      whatChanged: string
      whatLearned: string
      whatCarriesForward: string
    }) => {
      if (!config) throw new Error('No campaign to archive.')
      if (config.status !== 'completed' && config.status !== 'active') {
        throw new Error('Cannot archive a campaign that is already archived.')
      }
      const now = new Date().toISOString()
      const retrospectivePayload: ArcRetrospective = {
        whatWentWell: retrospectiveAnswers.whatWentWell.trim(),
        whatDidnt: retrospectiveAnswers.whatDidnt.trim(),
        whatChanged: retrospectiveAnswers.whatChanged.trim(),
        whatLearned: retrospectiveAnswers.whatLearned.trim(),
        whatCarriesForward: retrospectiveAnswers.whatCarriesForward.trim(),
        submittedAt: now,
      }

      const { error } = await supabase
        .from('life_seasons')
        .update({
          status: 'archived',
          archived_at: now,
          retrospective: (retrospectivePayload as unknown) as Json,
        })
        .eq('id', config.id)

      if (error) {
        console.error('Failed to archive arc with retrospective:', error)
        throw error
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['active-season'] }),
        queryClient.invalidateQueries({ queryKey: ['life-seasons'] }),
        queryClient.invalidateQueries({ queryKey: ['life-seasons-archive'] }),
      ])
    },
    [config, queryClient],
  )

  return {
    config,
    progress,
    checkpoints,
    currentCheckpoint,
    milestones,
    focusDomains: config?.focusDomains ?? [],
    totals,
    overallHealth,
    seasonActivity,
    toggleManualMilestone,
    concludeArcEarly,
    amendCommitments,
    archiveArcWithRetrospective,
    lifeState: brain.lifeState,
    momentumScore: Math.round(brain.momentumScore),
    isLoading: isActivityLoading || isSeasonLoading,
  }
}
