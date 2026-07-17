import { useMemo } from 'react'
import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useFitnessWeeklySummary } from '../../fitness-os/api/useFitness'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useJournal } from '../../mind-os/api/useJournal'
import { useChallenges, useMilestones } from '../../progress-hub/api/useProgress'
import { useTasks } from '../../productivity-hub/api/useTasks'
import { useSystemStatus } from '../../system/api/useSystemStatus'
import { useTimeAnalytics } from '../../time-os/api/useTimeAnalytics'
import { useTransactions } from '../../finance-os/api/useFinance'
import { useEventBus } from '../../../store/useEventBus'

import { evaluateSystemThreats, evaluateSystemStatuses } from '../utils/systemHealthEvaluator'
import type { MissionControlSnapshot, MetricCard, SystemEvent, BrainState } from '../types/snapshot'

export function useMissionControlSnapshot(): MissionControlSnapshot {
  const { data: habitData, isLoading: habitsLoading, isError: habitsError } = useHabitWorkspace()
  const { data: tasks = [], isLoading: tasksLoading, isError: tasksError } = useTasks()
  const { data: journals = [] } = useJournal()
  useMilestones() // Not used in evaluator currently
  const { data: challenges = [] } = useChallenges()
  const { data: eventsAnalytics } = useEventsAnalytics()
  const { data: fitnessSummary } = useFitnessWeeklySummary()
  const { data: timeAnalytics } = useTimeAnalytics()
  const { data: financeData } = useTransactions()
  const { data: systemData, isLoading: systemLoading, isError: systemError } = useSystemStatus()
  const recentEventsRaw = useEventBus((state) => state.recentEvents)

  const isLoading = habitsLoading || tasksLoading || systemLoading
  const isError = habitsError || tasksError || systemError

  const activeHabitsCount = habitData?.habits.length ?? 0
  const completedHabitsCount = habitData?.habits.filter((h) => h.completedToday).length ?? 0
  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length
  const activeChallengesCount = challenges.filter((c) => c.status === 'Active').length
  const completedChallengesCount = challenges.filter((c) => c.status === 'Completed').length
  const workoutCompleted = fitnessSummary?.activeWorkoutDaysThisWeek ? fitnessSummary.activeWorkoutDaysThisWeek > 0 : false // Simplify for evaluation
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
    activeChallengesCount,
    completedChallengesCount,
    consistencyPercent,
  }), [
    pendingTasksCount, activeHabitsCount, completedHabitsCount, deepWorkMinutes, 
    workoutCompleted, financeAvailable, financeSpent, activeChallengesCount, 
    completedChallengesCount, consistencyPercent
  ])

  const systems = useMemo(() => evaluateSystemStatuses({
    pendingTasksCount,
    activeHabitsCount,
    completedHabitsCount,
    deepWorkMinutes,
    workoutCompleted,
    financeAvailable,
    financeSpent,
    activeChallengesCount,
    completedChallengesCount,
    consistencyPercent,
  }), [
    pendingTasksCount, activeHabitsCount, completedHabitsCount, deepWorkMinutes, 
    workoutCompleted, financeAvailable, financeSpent, activeChallengesCount, 
    completedChallengesCount, consistencyPercent
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
        sparkline: [0, 0, 0, 0, 0],
        mission: null,
        threats,
        reasoning: [],
        confidence: 0
      }
    }

    return {
      momentumScore: systemData.momentum.momentum,
      momentumTrend: systemData.momentum.trend,
      sparkline: [
        Math.max(0, systemData.momentum.momentum - 5),
        Math.max(0, systemData.momentum.momentum - 2),
        systemData.momentum.momentum,
        systemData.momentum.momentum + (systemData.momentum.trend === 'rising' ? 2 : -2),
        systemData.momentum.momentum + (systemData.momentum.trend === 'rising' ? 5 : -5),
      ], // Mocking sparkline history from current momentum for visualization
      mission: {
        mission: systemData.directive.label,
        estimatedTime: '20 min', // Mock/Placeholder as original data lacks this
        expectedMomentumGain: '+5 Momentum',
        reason: systemData.directive.reason,
        recommendationSource: 'Brain Engine Core',
        actionRoute: systemData.directive.route
      },
      threats,
      reasoning: systemData.momentumExplanation,
      confidence: 87 // Mock
    }
  }, [systemData, threats])

  return {
    isLoading,
    isError,
    brain,
    systems,
    metrics,
    recentEvents
  }
}
