import type { DataLabEventCoverage } from '../api/useDataLab'
import type { HistogramBar, WaterfallNode, EventStreamEntry } from '../types/types'

export function toEventFrequencyBars(
  eventCoverage: DataLabEventCoverage[],
): HistogramBar[] {
  const sorted = [...eventCoverage].sort((a, b) => b.event_count - a.event_count)
  const maxCount = sorted.length > 0 ? sorted[0].event_count : 1

  return sorted.slice(0, 20).map((entry) => ({
    label: entry.event_type,
    value: entry.event_count,
    percent: Math.round((entry.event_count / maxCount) * 100),
  }))
}

export function toEventWaterfallNodes(
  events: EventStreamEntry[],
): WaterfallNode[] {
  const sorted = [...events].sort(
    (a, b) => a.timestamp.localeCompare(b.timestamp),
  )

  return sorted.slice(-30).map((event) => ({
    timestamp: event.timestamp,
    domain: event.domain,
    eventType: event.eventType,
    entityType: event.entityType,
  }))
}
