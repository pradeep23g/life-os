import { useMemo, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/AuthContext'
import { useMissionControlSnapshot } from '../../mission-control/api/useMissionControlSnapshot'
import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useTasks } from '../../productivity-hub/api/useTasks'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useFitnessWeeklySummary } from '../../fitness-os/api/useFitness'
import { useRoadmaps, useRecentSessionLogs } from '../../learning-os/api/useLearningOS'
import { useDataLabRecentEvents, type DataLabRecentEvent } from '../../data-lab/api/useDataLab'
import { useEventBus, type EventBusEvent } from '../../../store/useEventBus'
import { translateEventToChronicle } from '../utils/eventNarrative'
import type { ProfileDossierData, CoreAttribute, CapabilityCrest, ChronicleEvent } from '../types'

function extractEntityId(payload: Record<string, unknown> | null | undefined): string | null {
  if (!payload) return null
  const keys = [
    'habitId',
    'habit_id',
    'taskId',
    'task_id',
    'workoutId',
    'workout_id',
    'sessionId',
    'session_id',
    'roadmapId',
    'roadmap_id',
    'entityId',
    'entity_id',
    'id',
  ]
  for (const key of keys) {
    const val = payload[key]
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }
  return null
}

function isSameChronicleEvent(
  busChronicle: ChronicleEvent,
  busEvent: EventBusEvent,
  dbChronicle: ChronicleEvent,
  dbEvent: DataLabRecentEvent,
): boolean {
  // 1. Direct ID match
  if (busEvent.id === dbEvent.id) return true

  // 2. Domain must match
  if (busChronicle.domain !== dbChronicle.domain) return false

  const busTime = new Date(busChronicle.timestamp).getTime()
  const dbTime = new Date(dbChronicle.timestamp).getTime()
  if (Number.isNaN(busTime) || Number.isNaN(dbTime)) return false
  const timeDiffMs = Math.abs(busTime - dbTime)

  // Maximum time drift tolerance between client bus emit and server db record (3 minutes)
  if (timeDiffMs > 180_000) return false

  const busEntityId = extractEntityId(busEvent.payload)
  const dbEntityId = dbEvent.entity_id || extractEntityId(dbEvent.payload)

  // Discrepant entity IDs mean they represent different entities (e.g. Habit A vs Habit B)
  if (busEntityId && dbEntityId && busEntityId !== dbEntityId) {
    return false
  }

  // 3. Event action & headline match
  // Distinct lifecycle actions (e.g. habit created vs habit completed, task opened vs task closed)
  // produce different headlines and must NEVER be conflated as the same event.
  if (busChronicle.headline === dbChronicle.headline) {
    // If both specify matching entity IDs, high confidence match
    if (busEntityId && dbEntityId && busEntityId === dbEntityId) {
      return true
    }
    // If entity ID is missing on either side (e.g. generic action), require tighter time window (60s)
    if (timeDiffMs <= 60_000) {
      return true
    }
  }

  return false
}

export function useProfileDossier(): ProfileDossierData {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const syncingBadgesRef = useRef<Set<string>>(new Set())

  const { brain, isLoading: mcLoading } = useMissionControlSnapshot()
  const { data: analytics, isLoading: analyticsLoading } = useEventsAnalytics()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks()
  const { data: habitData, isLoading: habitsLoading } = useHabitWorkspace()
  const { data: fitnessSummary, isLoading: fitnessLoading } = useFitnessWeeklySummary()
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps()
  const { data: sessionLogs = [], isLoading: logsLoading } = useRecentSessionLogs()
  const { data: persistentEvents = [], isLoading: eventsLoading } = useDataLabRecentEvents()
  const recentEventsBus = useEventBus((state) => state.recentEvents)

  // Query persistent achievements from public.user_achievements (ADR-016)
  const { data: dbAchievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
      if (error) {
        console.error('Failed to fetch user achievements', error)
        return []
      }
      return data ?? []
    },
    enabled: Boolean(user?.id)
  })

  const isLoading =
    mcLoading ||
    analyticsLoading ||
    tasksLoading ||
    habitsLoading ||
    fitnessLoading ||
    roadmapsLoading ||
    logsLoading ||
    eventsLoading ||
    achievementsLoading

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
  // Deduplicates across mismatched client vs server ID formats
  const chronicle: ChronicleEvent[] = useMemo(() => {
    const seenIds = new Set<string>()
    const merged: ChronicleEvent[] = []
    const persistentPairs: Array<{ chronicle: ChronicleEvent; raw: DataLabRecentEvent }> = []

    // 1. Persistent events from remote table (authoritative ground truth)
    for (const dbEvent of persistentEvents) {
      if (!seenIds.has(dbEvent.id)) {
        seenIds.add(dbEvent.id)
        const item = translateEventToChronicle({
          id: dbEvent.id,
          created_at: dbEvent.created_at,
          event_type: dbEvent.event_type,
          domain: dbEvent.domain,
          payload: dbEvent.payload,
        })
        merged.push(item)
        persistentPairs.push({ chronicle: item, raw: dbEvent })
      }
    }

    // 2. In-memory bus events: only include if not already represented in persistentEvents
    const matchedPersistentIds = new Set<string>()

    for (const busEvent of recentEventsBus) {
      if (seenIds.has(busEvent.id)) {
        continue
      }

      const busItem = translateEventToChronicle({
        id: busEvent.id,
        createdAt: busEvent.createdAt,
        type: busEvent.type,
        payload: busEvent.payload,
      })

      // Check if this bus event matches any persistent event already rendered
      const matchedDb = persistentPairs.find(
        (pair) =>
          !matchedPersistentIds.has(pair.raw.id) &&
          isSameChronicleEvent(busItem, busEvent, pair.chronicle, pair.raw),
      )

      if (matchedDb) {
        matchedPersistentIds.add(matchedDb.raw.id)
        continue // Skip duplicate: already present from persistent database records
      }

      seenIds.add(busEvent.id)
      merged.push(busItem)
    }

    // Sort descending by timestamp
    return merged.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }, [recentEventsBus, persistentEvents])

  // Lookup map for persistent achievements in database
  const dbAchievementMap = useMemo(() => {
    const map = new Map<string, typeof dbAchievements[0]>()
    for (const ach of dbAchievements) {
      map.set(ach.badge_id, ach)
    }
    return map
  }, [dbAchievements])

  // Earned Capability Markers (ADR-016: Unified with public.user_achievements)
  // Crests are earned either via active live telemetry or via permanent record in public.user_achievements
  const crests: CapabilityCrest[] = useMemo(() => {
    const definitions: Array<{
      id: string
      title: string
      domain: CapabilityCrest['domain']
      description: string
      criteria: string
      isLiveMet: boolean
      liveProvenance: string
    }> = [
      {
        id: 'cadence-keeper',
        title: 'Cadence of the Arc',
        domain: 'mind',
        description: 'Demonstrated high habit consistency across active behavioral cycles.',
        criteria: 'Consistency ≥ 70%',
        isLiveMet: consistencyPercent >= 70,
        liveProvenance: `${consistencyPercent}% 7-day consistency recorded`,
      },
      {
        id: 'centurion-execution',
        title: 'Centurion of Action',
        domain: 'work',
        description: 'Persistent execution through the task backlog.',
        criteria: '10+ completed tasks',
        isLiveMet: completedTasksCount >= 10,
        liveProvenance: `${completedTasksCount} completed tasks in ledger`,
      },
      {
        id: 'iron-foundation',
        title: 'Iron Foundation',
        domain: 'body',
        description: 'Consistent physical conditioning observed in weekly training cycles.',
        criteria: '3+ workouts in active week',
        isLiveMet: activeWorkoutDays >= 3,
        liveProvenance: `${activeWorkoutDays} training sessions this week`,
      },
      {
        id: 'scholar-arc',
        title: 'Scholar of the Arc',
        domain: 'intellect',
        description: 'Engaged active curriculum roadmaps with verified study sessions.',
        criteria: 'Active roadmap + study session recorded',
        isLiveMet: activeRoadmapsCount > 0 && studySessionsCount > 0,
        liveProvenance: `${activeRoadmapsCount} active roadmaps • ${studySessionsCount} sessions`,
      },
      {
        id: 'velocity-invariant',
        title: 'Velocity Invariant',
        domain: 'system',
        description: 'Achieved sustained forward velocity across multiple system domains.',
        criteria: 'Momentum score ≥ 70',
        isLiveMet: brain.momentumScore >= 70,
        liveProvenance: `Current momentum: ${Math.round(brain.momentumScore)}`,
      },
      {
        id: 'archival-witness',
        title: 'Archival Witness',
        domain: 'system',
        description: 'Accumulated an immutable behavioral record in the system telemetry ledger.',
        criteria: '10+ verified telemetry entries',
        isLiveMet: chronicle.length >= 10,
        liveProvenance: `${chronicle.length} events inscribed in chronicle`,
      },
    ]

    return definitions.map((def) => {
      const dbRecord = dbAchievementMap.get(def.id)
      const isPermanentlyAffirmed = Boolean(dbRecord)
      const isEarned = def.isLiveMet || isPermanentlyAffirmed

      let earnedProvenance = def.liveProvenance
      if (isPermanentlyAffirmed && !def.isLiveMet) {
        const unlockDate = new Date(dbRecord!.unlocked_at).toISOString().split('T')[0]
        earnedProvenance = `Affirmed on ${unlockDate} (Permanent Achievement)`
      }

      return {
        id: def.id,
        title: def.title,
        domain: def.domain,
        description: def.description,
        criteria: def.criteria,
        isEarned,
        earnedProvenance,
      }
    })
  }, [
    consistencyPercent,
    completedTasksCount,
    activeWorkoutDays,
    activeRoadmapsCount,
    studySessionsCount,
    brain.momentumScore,
    chronicle.length,
    dbAchievementMap,
  ])

  // Synchronize newly unlocked crests to public.user_achievements for permanent preservation
  useEffect(() => {
    if (!user?.id || achievementsLoading) return

    const newlyEarned = crests.filter(
      (c) => c.isEarned && !dbAchievementMap.has(c.id) && !syncingBadgesRef.current.has(c.id)
    )

    if (newlyEarned.length === 0) return

    // Mark as in-flight to prevent duplicate concurrent network calls
    newlyEarned.forEach((c) => syncingBadgesRef.current.add(c.id))

    const recordsToUpsert = newlyEarned.map((c) => ({
      user_id: user.id,
      badge_id: c.id,
      unlocked_at: new Date().toISOString(),
      metadata: {
        title: c.title,
        domain: c.domain,
        description: c.description,
        criteria: c.criteria,
        earned_provenance: c.earnedProvenance,
      },
    }))

    supabase
      .from('user_achievements')
      .upsert(recordsToUpsert, { onConflict: 'user_id,badge_id' })
      .then(({ error }) => {
        if (!error) {
          queryClient.invalidateQueries({ queryKey: ['user-achievements', user.id] })
        } else {
          console.error('Failed to auto-affirm user achievement:', error)
          // Allow future attempt if remote write fails
          newlyEarned.forEach((c) => syncingBadgesRef.current.delete(c.id))
        }
      })
  }, [user?.id, crests, dbAchievementMap, achievementsLoading, queryClient])

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
