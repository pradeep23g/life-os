import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useEnvironmentSystem } from '../../../lib/useEnvironmentSystem'
import { useMissionControlSnapshot } from '../../mission-control/api/useMissionControlSnapshot'
import { useActiveTimer, useStartTimer } from '../../time-os/api/useTimeLogs'
import { useTasks } from '../../productivity-hub/api/useTasks'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useTimeAnalytics } from '../../time-os/api/useTimeAnalytics'
import { useArcTelemetry } from '../../arc/hooks/useArcTelemetry'
import type { ArcPaceStatus } from '../../arc/types'

export interface ArcHomeSummary {
  hasActiveArc: boolean
  arcTitle: string
  currentDay: number
  totalDays: number
  overallHealth: ArcPaceStatus
  accentColor: string
}

export interface SolarContextInfo {
  phase: 'dawn' | 'day' | 'dusk' | 'midnight'
  solarLabel: string
  greeting: string
  defaultDirective: string
  supportingContext: string
}

const SOLAR_CONFIG: Record<'dawn' | 'day' | 'dusk' | 'midnight', SolarContextInfo> = {
  dawn: {
    phase: 'dawn',
    solarLabel: 'DAWN // FIRST LIGHT',
    greeting: 'Morning Intention',
    defaultDirective: 'Establish momentum before the noise gathers.',
    supportingContext: 'The early hours reward uninterrupted focus. Align your attention to the singular priority.',
  },
  day: {
    phase: 'day',
    solarLabel: 'DAY // ACTIVE EXECUTION',
    greeting: 'Current Focus',
    defaultDirective: 'Execute the primary mission. Maintain trajectory.',
    supportingContext: 'Protect deep attention against reactive drift. High-value work compounds in quiet continuity.',
  },
  dusk: {
    phase: 'dusk',
    solarLabel: 'DUSK // EVENING REVIEW',
    greeting: 'Evening Reflection',
    defaultDirective: 'Review the day’s ledger. Consolidate your progress.',
    supportingContext: 'Honest assessment closes the cognitive loop. Record what was done and what remains.',
  },
  midnight: {
    phase: 'midnight',
    solarLabel: 'MIDNIGHT // SYSTEM CLOSURE',
    greeting: 'Night Cycle',
    defaultDirective: 'The day is sealed. Rest is the foundation of discipline.',
    supportingContext: 'Silence all processes. Recovery today dictates the velocity and clarity of tomorrow.',
  },
}

function formatDateTabular(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

function formatFocusHoursMins(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

export function useHomeTelemetry() {
  const navigate = useNavigate()
  const { timeOfDay } = useEnvironmentSystem()
  const { brain, isLoading: isBrainLoading } = useMissionControlSnapshot()
  const { data: activeTimer, isLoading: isTimerLoading } = useActiveTimer()
  const { mutate: startTimer, isPending: isStartingTimer } = useStartTimer()
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks()
  const { data: habitData, isLoading: isHabitsLoading } = useHabitWorkspace()
  const { data: timeAnalytics } = useTimeAnalytics()
  const {
    config: activeArcConfig,
    progress: arcProgress,
    overallHealth: arcOverallHealth,
    isLoading: isArcLoading,
  } = useArcTelemetry()

  const solarContext = SOLAR_CONFIG[timeOfDay] ?? SOLAR_CONFIG.day

  // Active Arc Campaign Telemetry Summary
  const hasActiveArc = Boolean(
    activeArcConfig && (activeArcConfig.status === 'active' || activeArcConfig.status === 'completed')
  )

  const arcSummary: ArcHomeSummary = useMemo(() => {
    if (!activeArcConfig || !hasActiveArc) {
      return {
        hasActiveArc: false,
        arcTitle: '',
        currentDay: 0,
        totalDays: 0,
        overallHealth: 'on_track',
        accentColor: '#22d3ee',
      }
    }

    return {
      hasActiveArc: true,
      arcTitle: activeArcConfig.title,
      currentDay: arcProgress.currentDay,
      totalDays: arcProgress.totalDays,
      overallHealth: arcOverallHealth,
      accentColor: activeArcConfig.accentColor || '#22d3ee',
    }
  }, [activeArcConfig, hasActiveArc, arcProgress.currentDay, arcProgress.totalDays, arcOverallHealth])

  // Real pending counts
  const pendingTasks = useMemo(() => tasks.filter((t) => !t.is_completed), [tasks])
  const pendingHabits = useMemo(
    () => (habitData?.habits ?? []).filter((h) => !h.completedToday),
    [habitData?.habits],
  )
  const totalPending = pendingTasks.length + pendingHabits.length

  // Real directive from Brain Engine if present; otherwise restrained solar fallback
  const directive = brain.mission?.mission?.trim() || solarContext.defaultDirective
  const directiveSupporting = brain.mission?.reason?.trim() || solarContext.supportingContext

  // Today's total focus minutes from real time analytics
  const todayFocusMinutes = useMemo(() => {
    return timeAnalytics?.todayTotalMinutes ?? 0
  }, [timeAnalytics])

  const focusTimeDisplay = formatFocusHoursMins(todayFocusMinutes)
  const dateDisplay = useMemo(() => formatDateTabular(new Date()), [])

  // Primary Action execution obeying the Tactile Interaction Compact
  const hasActiveTimer = Boolean(activeTimer)
  const primaryActionLabel = hasActiveTimer
    ? `RESUME FOCUS (${activeTimer?.bucket.toUpperCase()})`
    : isStartingTimer
      ? 'ENTERING FOCUS...'
      : 'ENTER DEEP WORK'

  const executePrimaryAction = () => {
    if (hasActiveTimer) {
      navigate('/time-os')
      return
    }

    startTimer(
      { bucket: 'Deep Work' },
      {
        onSuccess: () => {
          navigate('/time-os')
        },
      },
    )
  }

  const isLoading = isBrainLoading || isTimerLoading || isTasksLoading || isHabitsLoading || isArcLoading

  return {
    solarContext,
    directive,
    directiveSupporting,
    momentumScore: Math.round(brain.momentumScore),
    momentumTrend: brain.momentumTrend,
    lifeState: brain.lifeState,
    hasActiveTimer,
    activeTimer,
    isStartingTimer,
    primaryActionLabel,
    executePrimaryAction,
    pendingTasksCount: pendingTasks.length,
    pendingHabitsCount: pendingHabits.length,
    totalPending,
    focusTimeDisplay,
    dateDisplay,
    // Active Arc Telemetry Horizon Fields
    hasActiveArc: arcSummary.hasActiveArc,
    arcTitle: arcSummary.arcTitle,
    arcCurrentDay: arcSummary.currentDay,
    arcTotalDays: arcSummary.totalDays,
    arcOverallHealth: arcSummary.overallHealth,
    arcAccentColor: arcSummary.accentColor,
    currentDay: arcSummary.currentDay,
    totalDays: arcSummary.totalDays,
    overallHealth: arcSummary.overallHealth,
    arcSummary,
    isLoading,
  }
}
