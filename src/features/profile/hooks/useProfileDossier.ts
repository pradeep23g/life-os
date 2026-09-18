import { useMemo } from 'react'
import { useMissionControlSnapshot } from '../../mission-control/api/useMissionControlSnapshot'
import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useTasks } from '../../productivity-hub/api/useTasks'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useFitnessWeeklySummary } from '../../fitness-os/api/useFitness'
import { useRoadmaps, useRecentSessionLogs } from '../../learning-os/api/useLearningOS'
import { useDataLabRecentEvents } from '../../data-lab/api/useDataLab'
import { useEventBus } from '../../../store/useEventBus'
import { translateEventToChronicle } from '../utils/eventNarrative'
import type { ProfileDossierData, CoreAttribute, CapabilityCrest, ChronicleEvent } from '../types'

export function useProfileDossier(): ProfileDossierData {
  const { brain, isLoading: mcLoading } = useMissionControlSnapshot()
  const { data: analytics, isLoading: analyticsLoading } = useEventsAnalytics()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const { data: habitData, isLoading: habitsLoading } = useHabitWorkspace()
  const { data: fitnessSummary, isLoading: fitnessLoading } = useFitnessWeeklySummary()
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps()
  const { data: sessionLogs = [], isLoading: logsLoading } = useRecentSessionLogs()
  const { data: persistentEvents = [], isLoading: eventsLoading } = useDataLabRecentEvents()
  const recentEventsBus = useEventBus((state) => state.recentEvents)

  const isLoading =
    mcLoading ||
    analyticsLoading ||
    tasksLoading ||
    habitsLoading ||
    fitnessLoading ||
    roadmapsLoading ||
    logsLoading ||
    eventsLoading

  const consistencyPercent = analytics?.consistencyPercent ?? 0
  const activeDaysThisWeek = analytics?.activeDaysThisWeek ?? 0

  // Discipline metric
  const longestStreak = habitData?.longestHabitStreak?.streak ?? 0
  const longestStreakTitle = habitData?.longestHabitStreak?.title ?? 'None'
  const activeHabitsCount = habitData?.habits.length ?? 0

  // Execution metric
  const completedTasksCount = tasks.filter((t) => t.is_completed).length
  const pendingTasksCount = tasks.filter((t) => !t.is_completed).length

  // Physical metric
  const totalFitnessMinutes = fitnessSummary?.totalSessionMinutesThisWeek ?? 0
  const activeWorkoutDays = fitnessSummary?.activeWorkoutDaysThisWeek ?? 0

  // Intellect metric
  const activeRoadmapsCount = roadmaps.filter((r) => r.status === 'active').length
  const completedRoadmapsCount = roadmaps.filter((r) => r.status === 'completed').length
  const studySessionsCount = sessionLogs.length

  // Core Attribute Horizon (Only deterministic, verified telemetry)
  const attributes: CoreAttribute[] = useMemo(
    () => [
      {
        id: 'discipline',
        label: 'Discipline',
        dimension: 'Consistency & Habit Cadence',
        value: consistencyPercent,
        unit: '%',
        supportingText: `${activeDaysThisWeek} of 7 active days observed`,
        provenance: `Longest streak: ${longestStreak}d (${longestStreakTitle}) • ${activeHabitsCount} active rituals`,
      },
      {
        id: 'execution',
        label: 'Execution',
        dimension: 'Task Ledger Fulfillment',
        value: completedTasksCount,
        unit: 'tasks',
        supportingText: `${pendingTasksCount} pending in execution queue`,
        provenance: `Derived from ${tasks.length} total tasks in Productivity Hub`,
      },
      {
        id: 'physical',
        label: 'Physical',
        dimension: 'Training Volume',
        value: totalFitnessMinutes,
        unit: 'min',
        supportingText: `${activeWorkoutDays} workout sessions this week`,
        provenance: 'Fitness OS workout ledger & session metrics',
      },
      {
        id: 'intellect',
        label: 'Intellect',
        dimension: 'Curriculum Acquisition',
        value: studySessionsCount,
        unit: 'sessions',
        supportingText: `${activeRoadmapsCount} active roadmaps • ${completedRoadmapsCount} completed`,
        provenance: 'Learning OS verified study logs',
      },
    ],
    [
      consistencyPercent,
      activeDaysThisWeek,
      longestStreak,
      longestStreakTitle,
      activeHabitsCount,
      completedTasksCount,
      pendingTasksCount,
      tasks.length,
      totalFitnessMinutes,
      activeWorkoutDays,
      studySessionsCount,
      activeRoadmapsCount,
      completedRoadmapsCount,
    ],
  )

  // Merge events: persistent from Supabase events table + in-memory recent bus events
  const chronicle: ChronicleEvent[] = useMemo(() => {
    const seenIds = new Set<string>()
    const merged: ChronicleEvent[] = []

    // 1. In-memory bus events (newest first)
    for (const busEvent of recentEventsBus) {
      if (!seenIds.has(busEvent.id)) {
        seenIds.add(busEvent.id)
        merged.push(
          translateEventToChronicle({
            id: busEvent.id,
            createdAt: busEvent.createdAt,
            type: busEvent.type,
            payload: busEvent.payload,
          }),
        )
      }
    }

    // 2. Persistent events from remote table
    for (const dbEvent of persistentEvents) {
      if (!seenIds.has(dbEvent.id)) {
        seenIds.add(dbEvent.id)
        merged.push(
          translateEventToChronicle({
            id: dbEvent.id,
            created_at: dbEvent.created_at,
            event_type: dbEvent.event_type,
            domain: dbEvent.domain,
            payload: dbEvent.payload,
          }),
        )
      }
    }

    // Sort descending by timestamp
    return merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }, [recentEventsBus, persistentEvents])

  // Earned Capability Markers (ADR-016, pure deterministic telemetry derivations)
  const crests: CapabilityCrest[] = useMemo(
    () => [
      {
        id: 'cadence-keeper',
        title: 'Cadence of the Arc',
        domain: 'mind',
        description: 'Demonstrated high habit consistency across active behavioral cycles.',
        criteria: 'Consistency ≥ 70%',
        isEarned: consistencyPercent >= 70,
        earnedProvenance: `${consistencyPercent}% 7-day consistency recorded`,
      },
      {
        id: 'centurion-execution',
        title: 'Centurion of Action',
        domain: 'work',
        description: 'Persistent execution through the task backlog.',
        criteria: '10+ completed tasks',
        isEarned: completedTasksCount >= 10,
        earnedProvenance: `${completedTasksCount} completed tasks in ledger`,
      },
      {
        id: 'iron-foundation',
        title: 'Iron Foundation',
        domain: 'body',
        description: 'Consistent physical conditioning observed in weekly training cycles.',
        criteria: '3+ workouts in active week',
        isEarned: activeWorkoutDays >= 3,
        earnedProvenance: `${activeWorkoutDays} training sessions this week`,
      },
      {
        id: 'scholar-arc',
        title: 'Scholar of the Arc',
        domain: 'intellect',
        description: 'Engaged active curriculum roadmaps with verified study sessions.',
        criteria: 'Active roadmap + study session recorded',
        isEarned: activeRoadmapsCount > 0 && studySessionsCount > 0,
        earnedProvenance: `${activeRoadmapsCount} active roadmaps • ${studySessionsCount} sessions`,
      },
      {
        id: 'velocity-invariant',
        title: 'Velocity Invariant',
        domain: 'system',
        description: 'Achieved sustained forward velocity across multiple system domains.',
        criteria: 'Momentum score ≥ 70',
        isEarned: brain.momentumScore >= 70,
        earnedProvenance: `Current momentum: ${Math.round(brain.momentumScore)}`,
      },
      {
        id: 'archival-witness',
        title: 'Archival Witness',
        domain: 'system',
        description: 'Accumulated an immutable behavioral record in the system telemetry ledger.',
        criteria: '10+ verified telemetry entries',
        isEarned: chronicle.length >= 10,
        earnedProvenance: `${chronicle.length} events inscribed in chronicle`,
      },
    ],
    [
      consistencyPercent,
      completedTasksCount,
      activeWorkoutDays,
      activeRoadmapsCount,
      studySessionsCount,
      brain.momentumScore,
      chronicle.length,
    ],
  )

  return {
    lifeState: brain.lifeState,
    momentumScore: brain.momentumScore,
    momentumTrend: brain.momentumTrend,
    confidence: brain.confidence,
    sparkline: brain.sparkline,
    activeDaysThisWeek,
    consistencyPercent,
    attributes,
    crests,
    chronicle,
    totalChronicleCount: chronicle.length,
    isLoading,
  }
}
