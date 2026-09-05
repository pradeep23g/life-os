import { useMemo } from 'react'
import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useFitnessWeeklySummary } from '../../fitness-os/api/useFitness'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useJournal } from '../../mind-os/api/useJournal'
import { useRoadmaps } from '../../learning-os/api/useLearningOS'
import { useTasks } from '../../productivity-hub/api/useTasks'
import { useSystemStatus } from '../../system/api/useSystemStatus'
import { useTimeAnalytics } from '../../time-os/api/useTimeAnalytics'
import { useTransactions } from '../../finance-os/api/useFinance'
import { useEventBus } from '../../../store/useEventBus'
import { usePendingEventsCount } from '../../system/api/useEveningSync'

import {
  evaluateSystemThreats,
  evaluateSystemStatuses,
  computeSystemConfidence,
} from '../utils/systemHealthEvaluator'
import type { MissionControlSnapshot, MetricCard, SystemEvent, BrainState } from '../types/snapshot'

export function useMissionControlSnapshot(): MissionControlSnapshot {
  const { data: habitData, isLoading: habitsLoading, isError: habitsError } = useHabitWorkspace()
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useTasks()
  const { data: journals = [] } = useJournal()
  const { data: roadmaps = [] } = useRoadmaps()
  const { data: eventsAnalytics } = useEventsAnalytics()
  const { data: fitnessSummary } = useFitnessWeeklySummary()
  const { data: timeAnalytics } = useTimeAnalytics()
  const { data: financeData } = useTransactions()
  const { data: systemData, isLoading: systemLoading, isError: systemError } = useSystemStatus()
  const { data: pendingEventsCount = 0 } = usePendingEventsCount()
  const recentEventsRaw = useEventBus((state) => state.recentEvents)

  const isLoading = habitsLoading || tasksLoading || systemLoading
  const isError = habitsError || tasksError || systemError

  const activeHabitsCount = habitData?.habits.length ?? 0
  const completedHabitsCount = habitData?.habits.filter((h) => h.completedToday).length ?? 0
  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length
  const activeRoadmapsCount = roadmaps.filter((r) => r.status === 'active').length
  const completedRoadmapsCount = roadmaps.filter((r) => r.status === 'completed').length
  const workoutCompleted = (fitnessSummary?.activeWorkoutDaysThisWeek ?? 0) > 0
  const deepWorkMinutes = timeAnalytics?.todayDistribution.find((d) => d.bucket === 'Deep Work')?.minutes ?? 0
  const consistencyPercent = eventsAnalytics?.consistencyPercent ?? 0
  const financeAvailable = financeData?.summary.totalAvailable ?? 0
  const financeSpent = financeData?.summary.totalSpent ?? 0

  const threats = useMemo(() => evaluateSystemThreats({
    pendingTasksCount,
    activeHabitsCount,
    completedHabitsCount,
    deepWorkMinutes,
    workoutCompleted,
    financeAvailable,
    financeSpent,
    activeRoadmapsCount,
    completedRoadmapsCount,
    consistencyPercent,
    brainStatus: systemData,
  }), [
    pendingTasksCount, activeHabitsCount, completedHabitsCount, deepWorkMinutes, 
    workoutCompleted, financeAvailable, financeSpent, activeRoadmapsCount, 
    completedRoadmapsCount, consistencyPercent, systemData
  ])

  const systems = useMemo(() => evaluateSystemStatuses({
    pendingTasksCount,
    activeHabitsCount,
    completedHabitsCount,
    deepWorkMinutes,
    workoutCompleted,
    financeAvailable,
    financeSpent,
    activeRoadmapsCount,
    completedRoadmapsCount,
    consistencyPercent,
    brainStatus: systemData,
  }), [
    pendingTasksCount, activeHabitsCount, completedHabitsCount, deepWorkMinutes, 
    workoutCompleted, financeAvailable, financeSpent, activeRoadmapsCount, 
    completedRoadmapsCount, consistencyPercent, systemData
  ])

  const metrics: MetricCard[] = useMemo(() => {
    const averageMood = journals.length
      ? (journals.reduce((sum, entry) => sum + entry.mood, 0) / journals.length).toFixed(1)
      : '0.0'

    return [
      {
        id: 'journal-mood',
        label: 'Average Mood',
        value: `${averageMood} / 5`,
        supportingText: `${journals.length} Entries`,
      },
      {
        id: 'pending-tasks',
        label: 'Pending Tasks',
        value: pendingTasksCount,
        trendDirection: pendingTasksCount > 5 ? 'down' : 'neutral',
      },
      {
        id: 'fitness-week',
        label: 'Fitness This Week',
        value: `${fitnessSummary?.activeWorkoutDaysThisWeek ?? 0} Days`,
        supportingText: `${fitnessSummary?.totalSessionMinutesThisWeek ?? 0} min`,
      },
      {
        id: 'longest-streak',
        label: 'Habit Streak',
        value: `${habitData?.longestHabitStreak?.streak ?? 0} Days`,
        supportingText: habitData?.longestHabitStreak?.title ?? 'No streaks',
      }
    ]
  }, [journals, pendingTasksCount, fitnessSummary, habitData])

  const recentEvents: SystemEvent[] = useMemo(() => {
    return recentEventsRaw.slice(0, 5).map(e => ({
      id: e.id,
      timestamp: e.createdAt,
      description: e.type.replace(/_/g, ' '),
      domain: 'Life OS'
    }))
  }, [recentEventsRaw])

  const brain: BrainState = useMemo(() => {
    if (!systemData) {
      return {
        momentumScore: 0,
        momentumTrend: 'stable',
        sparkline: [],
        mission: null,
        threats,
        reasoning: [],
        confidence: 0
      }
    }

    // Real historical momentum series from A4's analyzeMomentum()
    const sparkline = systemData.momentum.emaSeries ?? []

    // Deterministic confidence derived from data quality: freshness + completeness + coverage
    const computedConfidence = computeSystemConfidence({
      snapshotDate: systemData.snapshotDate,
      historyDaysCount: sparkline.length,
      domainPresence: {
        mindHabits: activeHabitsCount > 0 || completedHabitsCount > 0,
        mindJournal: journals.length > 0,
        productivityTasks: tasks.length > 0,
        fitness: (fitnessSummary?.activeWorkoutDaysThisWeek ?? 0) > 0 || (fitnessSummary?.totalSessionMinutesThisWeek ?? 0) > 0 || workoutCompleted,
        timeTracking: deepWorkMinutes > 0 || (timeAnalytics?.todayTotalMinutes ?? 0) > 0,
        learning: activeRoadmapsCount > 0 || completedRoadmapsCount > 0,
        finance: financeAvailable > 0 || financeSpent > 0 || (financeData?.transactions.length ?? 0) > 0,
      },
    })

    const directiveAction = systemData.directive.action
    const metadataByDomain: Record<string, { time: string; gain: string; source: string }> = {
      task: { time: '15–30 min', gain: '+5 Momentum', source: 'Brain Engine • Productivity' },
      habit: { time: '5 min', gain: '+4 Momentum', source: 'Brain Engine • Mind OS' },
      journal: { time: '5–10 min', gain: '+3 Momentum', source: 'Brain Engine • Mind OS' },
      fitness: { time: '30–45 min', gain: '+5 Momentum', source: 'Brain Engine • Fitness OS' },
      'deep-work': { time: '60 min', gain: '+6 Momentum', source: 'Brain Engine • Time OS' },
      learning: { time: '25 min', gain: '+4 Momentum', source: 'Brain Engine • Learning OS' },
      finance: { time: '10 min', gain: '+3 Momentum', source: 'Brain Engine • Finance OS' },
    }
    const meta = metadataByDomain[directiveAction] ?? {
      time: '15 min',
      gain: '+5 Momentum',
      source: 'Brain Engine Core',
    }

    const mission = systemData.directive.action !== 'none' && systemData.directive.label ? {
      mission: systemData.directive.label,
      estimatedTime: meta.time,
      expectedMomentumGain: meta.gain,
      reason: systemData.directive.reason,
      recommendationSource: meta.source,
      actionRoute: systemData.directive.route
    } : null

    return {
      momentumScore: systemData.momentum.momentum,
      momentumTrend: systemData.momentum.trend,
      sparkline,
      mission,
      threats,
      reasoning: systemData.momentumExplanation,
      confidence: computedConfidence
    }
  }, [
    systemData,
    threats,
    activeHabitsCount,
    completedHabitsCount,
    journals.length,
    tasks.length,
    fitnessSummary,
    workoutCompleted,
    deepWorkMinutes,
    timeAnalytics,
    activeRoadmapsCount,
    completedRoadmapsCount,
    financeAvailable,
    financeSpent,
    financeData,
  ])

  return {
    isLoading,
    isError,
    snapshotDate: systemData?.snapshotDate ?? null,
    brain,
    systems,
    metrics,
    recentEvents,
    pendingEventsCount,
  }
}
