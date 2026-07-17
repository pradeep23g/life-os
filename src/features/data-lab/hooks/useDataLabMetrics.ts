import { useMemo } from 'react'

import {
  useDataLabDailyActivity,
  useDataLabWeeklyScore,
  useDataLabModuleConsistency,
  useDataLabEventCoverage,
  useDataLabRecentEvents,
} from '../api/useDataLab'
import { useDataLabStore } from '../store/useDataLabStore'
import { filterByPeriod, getPeriodLabel } from '../utils/period'
import {
  computeWeeklyScoreMetrics,
  computeConsistencyMetrics,
  computeMomentumMetrics,
  computeBehaviorDrift,
  computeStreakMetrics,
  computeCorrelationMetrics,
  computeRhythmMetrics,
  computeTelemetryHealth,
  computeSystemHealth,
  computeBehaviorInsights,
} from '../metrics'
import type { EventStreamEntry } from '../types/types'

export function useOverviewMetrics() {
  const period = useDataLabStore((s) => s.period)
  const dailyQuery = useDataLabDailyActivity()
  const weeklyQuery = useDataLabWeeklyScore()
  const consistencyQuery = useDataLabModuleConsistency()
  const eventsQuery = useDataLabRecentEvents()

  const filteredDaily = useMemo(
    () => filterByPeriod(dailyQuery.data ?? [], 'activity_date', period),
    [dailyQuery.data, period],
  )

  const filteredWeekly = useMemo(
    () => filterByPeriod(weeklyQuery.data ?? [], 'week_start_date', period),
    [weeklyQuery.data, period],
  )

  const weeklyScoreMetrics = useMemo(
    () => computeWeeklyScoreMetrics(filteredWeekly),
    [filteredWeekly],
  )

  const consistencyMetrics = useMemo(
    () => computeConsistencyMetrics(filteredDaily, consistencyQuery.data ?? []),
    [filteredDaily, consistencyQuery.data],
  )

  const insights = useMemo(
    () =>
      computeBehaviorInsights(
        filteredDaily,
        filteredWeekly,
        (eventsQuery.data ?? []).map((e) => ({ created_at: e.created_at })),
      ),
    [filteredDaily, filteredWeekly, eventsQuery.data],
  )

  return {
    weeklyScoreMetrics,
    consistencyMetrics,
    insights,
    filteredDaily,
    isLoading: dailyQuery.isLoading || weeklyQuery.isLoading || consistencyQuery.isLoading,
    isError: dailyQuery.isError || weeklyQuery.isError || consistencyQuery.isError,
  }
}

export function useBehaviorMetrics() {
  const period = useDataLabStore((s) => s.period)
  const dailyQuery = useDataLabDailyActivity()
  const weeklyQuery = useDataLabWeeklyScore()
  const eventsQuery = useDataLabRecentEvents()

  const filteredDaily = useMemo(
    () => filterByPeriod(dailyQuery.data ?? [], 'activity_date', period),
    [dailyQuery.data, period],
  )

  const filteredWeekly = useMemo(
    () => filterByPeriod(weeklyQuery.data ?? [], 'week_start_date', period),
    [weeklyQuery.data, period],
  )

  const correlationMetrics = useMemo(
    () => computeCorrelationMetrics(filteredDaily),
    [filteredDaily],
  )

  const streakMetrics = useMemo(
    () => computeStreakMetrics(filteredDaily),
    [filteredDaily],
  )

  const momentumMetrics = useMemo(
    () => computeMomentumMetrics(filteredWeekly),
    [filteredWeekly],
  )

  const driftMetrics = useMemo(
    () => computeBehaviorDrift(filteredDaily, getPeriodLabel(period)),
    [filteredDaily, period],
  )

  const rhythmMetrics = useMemo(
    () =>
      computeRhythmMetrics(
        (eventsQuery.data ?? []).map((e) => ({ created_at: e.created_at })),
      ),
    [eventsQuery.data],
  )

  return {
    correlationMetrics,
    streakMetrics,
    momentumMetrics,
    driftMetrics,
    rhythmMetrics,
    filteredDaily,
    isLoading: dailyQuery.isLoading || weeklyQuery.isLoading || eventsQuery.isLoading,
    isError: dailyQuery.isError || weeklyQuery.isError || eventsQuery.isError,
  }
}

export function useTelemetryMetrics() {
  const period = useDataLabStore((s) => s.period)
  const coverageQuery = useDataLabEventCoverage()
  const consistencyQuery = useDataLabModuleConsistency()
  const eventsQuery = useDataLabRecentEvents()

  const filteredCoverage = useMemo(
    () => filterByPeriod(coverageQuery.data ?? [], 'last_seen_date', period),
    [coverageQuery.data, period],
  )

  const telemetryHealth = useMemo(
    () => computeTelemetryHealth(filteredCoverage, consistencyQuery.data ?? []),
    [filteredCoverage, consistencyQuery.data],
  )

  const systemHealth = useMemo(
    () => computeSystemHealth(consistencyQuery.data ?? [], filteredCoverage),
    [consistencyQuery.data, filteredCoverage],
  )

  const eventStream: EventStreamEntry[] = useMemo(
    () =>
      (eventsQuery.data ?? []).slice(0, 50).map((e) => ({
        id: e.id,
        timestamp: e.created_at,
        domain: e.domain,
        entityType: e.entity_type,
        eventType: e.event_type,
      })),
    [eventsQuery.data],
  )

  return {
    telemetryHealth,
    systemHealth,
    eventStream,
    filteredCoverage,
    allEvents: eventsQuery.data ?? [],
    isLoading: coverageQuery.isLoading || consistencyQuery.isLoading || eventsQuery.isLoading,
    isError: coverageQuery.isError || consistencyQuery.isError || eventsQuery.isError,
  }
}
