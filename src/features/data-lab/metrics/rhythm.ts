import type { RhythmMetrics, RhythmBucket } from '../types/types'

type RawEvent = {
  created_at: string
}

function getHourIST(isoTimestamp: string): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(isoTimestamp))

  return parseInt(hourStr, 10)
}

export function computeRhythmMetrics(events: RawEvent[]): RhythmMetrics {
  const hourCounts = new Array(24).fill(0) as number[]

  for (const event of events) {
    const hour = getHourIST(event.created_at)
    if (hour >= 0 && hour < 24) {
      hourCounts[hour]++
    }
  }

  const buckets: RhythmBucket[] = hourCounts.map((count, hour) => ({ hour, count }))

  let peakHour = 0
  let peakCount = 0
  for (let i = 0; i < 24; i++) {
    if (hourCounts[i] > peakCount) {
      peakCount = hourCounts[i]
      peakHour = i
    }
  }

  return {
    buckets,
    peakHour,
    totalEvents: events.length,
  }
}
