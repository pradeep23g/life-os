import { useMemo } from 'react'

import { useTelemetryMetrics } from '../hooks/useDataLabMetrics'
import type { DataLabRecentEvent } from '../api/useDataLab'
import { toEventFrequencyBars, toEventWaterfallNodes } from '../transforms/telemetry'
import DataLabEmptyState from '../components/shared/DataLabEmptyState'
import TelemetryHealthCard from '../components/telemetry/TelemetryHealthCard'
import EventFrequencyHistogram from '../components/charts/EventFrequencyHistogram'
import EventWaterfall from '../components/charts/EventWaterfall'
import RecentEventStream from '../components/telemetry/RecentEventStream'
import SystemHealthPanel from '../components/telemetry/SystemHealthPanel'

function TelemetryTab() {
  const {
    telemetryHealth,
    systemHealth,
    eventStream,
    filteredCoverage,
    allEvents,
    isLoading,
    isError,
  } = useTelemetryMetrics()

  const frequencyBars = useMemo(
    () => toEventFrequencyBars(filteredCoverage),
    [filteredCoverage],
  )

  const waterfallNodes = useMemo(
    () =>
      toEventWaterfallNodes(
        allEvents.slice(0, 50).map((e: DataLabRecentEvent) => ({
          id: e.id,
          timestamp: e.created_at,
          domain: e.domain,
          entityType: e.entity_type,
          eventType: e.event_type,
        })),
      ),
    [allEvents],
  )

  if (isLoading) return <DataLabEmptyState isLoading />
  if (isError) return <DataLabEmptyState isError errorMessage="Failed to load telemetry data." />

  return (
    <div className="space-y-4">
      <TelemetryHealthCard metrics={telemetryHealth} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EventFrequencyHistogram bars={frequencyBars} />
        <EventWaterfall nodes={waterfallNodes} />
      </div>

      <RecentEventStream events={eventStream} />
      <SystemHealthPanel entries={systemHealth} />
    </div>
  )
}

export default TelemetryTab
