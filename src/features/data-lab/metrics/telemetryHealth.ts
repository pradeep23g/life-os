import type { DataLabEventCoverage, DataLabModuleConsistency } from '../api/useDataLab'
import type { TelemetryHealthMetrics } from '../types/types'
import { EVENT_TYPES } from '../../../lib/eventTaxonomy'

const ALL_EXPECTED_EVENTS = Object.values(EVENT_TYPES)

export function computeTelemetryHealth(
  eventCoverage: DataLabEventCoverage[],
  moduleConsistency: DataLabModuleConsistency[],
): TelemetryHealthMetrics {
  const totalExpected = ALL_EXPECTED_EVENTS.length
  const observedEventTypes = new Set(eventCoverage.map((e) => e.event_type))
  const totalActive = observedEventTypes.size

  const coveragePercent = totalExpected > 0
    ? Math.round((totalActive / totalExpected) * 100)
    : 0

  const silentEvents = ALL_EXPECTED_EVENTS.filter(
    (eventType) => !observedEventTypes.has(eventType),
  )

  const inactiveModules = moduleConsistency
    .filter((m) => m.consistency_percent === 0)
    .map((m) => m.module_name)

  const healthScore = Math.round(
    coveragePercent * 0.5 +
    (1 - inactiveModules.length / Math.max(moduleConsistency.length, 1)) * 100 * 0.3 +
    (1 - silentEvents.length / Math.max(totalExpected, 1)) * 100 * 0.2,
  )

  return {
    coveragePercent,
    totalExpected,
    totalActive,
    inactiveModules,
    silentEvents,
    healthScore,
  }
}
