import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'

import { calculateArcProgress, generateArcCheckpoints, getIndiaDateKey } from '../config'
import type { ArcSeasonConfig, ArcMilestone } from '../types'
import { useDataLabDailyActivity } from '../../data-lab/api/useDataLab'
import { useMissionControlSnapshot } from '../../mission-control/api/useMissionControlSnapshot'

const DEFAULT_SEASON: ArcSeasonConfig = {
  id: 'winter-arc-2026',
  title: 'WINTER ARC 2026',
  chapter: 'CHAPTER I',
  year: 2026,
  startDate: '2026-07-30',
  endDate: '2026-10-27',
  totalDays: 90,
  vow: {
    headline: 'Silence and Execution',
    body: 'No announcements. No half-measures. Cold focus in the dark.',
    attribution: 'Seasonal Directive'
  },
  principles: [
    'Eliminate non-essential commitments',
    'Kinetic discipline daily',
    'Cognitive rigor in deep work'
  ],
  phases: [
    { week: 1, name: 'Foundation', focus: 'Habit baseline & routine stabilization' },
    { week: 2, name: 'Foundation', focus: 'Environmental elimination & sleep rhythm lock' },
    { week: 3, name: 'Deep Arc', focus: 'Core project immersion & velocity increase' },
    { week: 4, name: 'Deep Arc', focus: 'Kinetic progressive overload phase' },
    { week: 5, name: 'Deep Arc', focus: 'Deep work blocks sustained (4h+/day)' },
    { week: 6, name: 'Deep Arc', focus: 'Mid-arc endurance & cognitive stamina' },
    { week: 7, name: 'Deep Arc', focus: 'High-density output & milestone shipping' },
    { week: 8, name: 'Deep Arc', focus: 'Physical conditioning peak' },
    { week: 9, name: 'Deep Arc', focus: 'Secondary friction purge' },
    { week: 10, name: 'Deep Arc', focus: 'Maximal throughput compounding' },
    { week: 11, name: 'Harvest & Transition', focus: 'Milestone consolidation & code stabilization' },
    { week: 12, name: 'Harvest & Transition', focus: 'Long-horizon documentation & performance capture' },
    { week: 13, name: 'Harvest & Transition', focus: 'Final telemetry retrospective & seasonal handoff' }
  ]
}

export function useArcTelemetry() {
  const { brain } = useMissionControlSnapshot()
  const { data: dailyActivity = [], isLoading: isActivityLoading } = useDataLabDailyActivity()

  const { data: config = DEFAULT_SEASON, isLoading: isSeasonLoading } = useQuery({
    queryKey: ['active-season'],
    queryFn: async () => {
      const today = getIndiaDateKey()
      const { data, error } = await supabase
        .from('life_seasons')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        throw new Error('Failed to fetch active season')
      }

      if (!data) {
        return DEFAULT_SEASON
      }

      const totalDays = Math.round((new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 86400000) + 1

      return {
        id: data.id,
        title: data.name,
        chapter: 'CURRENT',
        year: new Date(data.start_date).getFullYear(),
        startDate: data.start_date,
        endDate: data.end_date,
        totalDays,
        vow: (data.vows as Record<string, unknown>)?.vow as ArcSeasonConfig['vow'] ?? { headline: 'Season Active', body: 'Executing protocols.', attribution: '' },
        principles: (data.vows as Record<string, unknown>)?.principles as ArcSeasonConfig['principles'] ?? [],
        phases: (data.vows as Record<string, unknown>)?.phases as ArcSeasonConfig['phases'] ?? []
      } as ArcSeasonConfig
    }
  })

  const progress = useMemo(() => calculateArcProgress(config), [config])
  const checkpoints = useMemo(() => generateArcCheckpoints(config), [config])

  const seasonActivity = useMemo(() => {
    if (config.id === 'default-season') return []
    return dailyActivity.filter(
      (r) => r.activity_date >= config.startDate && r.activity_date <= config.endDate,
    )
  }, [dailyActivity, config.startDate, config.endDate, config.id])

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

  const milestones: ArcMilestone[] = useMemo(() => {
    return [
      {
        id: 'milestone-deep-work',
        title: 'Deep Work Volume',
        domain: 'deep-work',
        currentValue: totals.deepWorkHours,
        targetValue: 50,
        unit: 'HOURS',
        isAchieved: totals.deepWorkHours >= 50,
        description: 'Cumulative uninterrupted deep work hours in the Arc',
      },
      {
        id: 'milestone-tasks',
        title: 'Execution Output',
        domain: 'tasks',
        currentValue: totals.tasksCompleted,
        targetValue: 100,
        unit: 'TASKS',
        isAchieved: totals.tasksCompleted >= 100,
        description: 'Completed tasks recorded on the productivity ledger',
      },
      {
        id: 'milestone-fitness',
        title: 'Kinetic Consistency',
        domain: 'fitness',
        currentValue: totals.workoutsLogged,
        targetValue: 25,
        unit: 'SESSIONS',
        isAchieved: totals.workoutsLogged >= 25,
        description: 'Validated training sessions logged in Fitness OS',
      },
      {
        id: 'milestone-habits',
        title: 'Habit Disciplines',
        domain: 'habits',
        currentValue: totals.habitsCompleted,
        targetValue: 150,
        unit: 'REPETITIONS',
        isAchieved: totals.habitsCompleted >= 150,
        description: 'Daily habit checks fulfilled across Mind OS',
      },
    ]
  }, [totals])

  const currentCheckpoint = useMemo(() => {
    return checkpoints.find((c) => c.isCurrent) ?? checkpoints[0]
  }, [checkpoints])

  return {
    config,
    progress,
    checkpoints,
    currentCheckpoint,
    milestones,
    totals,
    lifeState: brain.lifeState,
    momentumScore: Math.round(brain.momentumScore),
    isLoading: isActivityLoading || isSeasonLoading,
  }
}
