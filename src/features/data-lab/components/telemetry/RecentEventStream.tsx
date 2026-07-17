import type { EventStreamEntry } from '../../types/types'
import { formatTime24h, formatDateShort, formatDomainLabel } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type RecentEventStreamProps = {
  events: EventStreamEntry[]
}

const DOMAIN_BADGE_COLORS: Record<string, string> = {
  'mind-os': 'border-blue-800 text-blue-400',
  'productivity-hub': 'border-amber-800 text-amber-400',
  'progress-hub': 'border-purple-800 text-purple-400',
  'mission-control': 'border-slate-700 text-slate-400',
  'fitness-os': 'border-emerald-800 text-emerald-400',
  'time-os': 'border-cyan-800 text-cyan-400',
  'finance-os': 'border-rose-800 text-rose-400',
}

function RecentEventStream({ events }: RecentEventStreamProps) {
  if (events.length === 0) {
    return (
      <DataLabSection title="Recent System Events" subtitle="Live event stream">
        <p className="text-sm text-slate-500 py-4">No recent events.</p>
      </DataLabSection>
    )
  }

  // Group by date
  const grouped = new Map<string, EventStreamEntry[]>()
  for (const event of events) {
    const dateKey = event.timestamp.slice(0, 10)
    const existing = grouped.get(dateKey) ?? []
    existing.push(event)
    grouped.set(dateKey, existing)
  }

  return (
    <DataLabSection title="Recent System Events" subtitle="Chronological event stream from all modules">
      <div className="space-y-4 max-h-[480px] overflow-y-auto">
        {Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
          <div key={dateKey}>
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-mono mb-2 sticky top-0 bg-[#0a0a0a] py-1">
              {formatDateShort(dateKey)}
            </p>

            <div className="space-y-0 divide-y divide-[#1a1a1a]">
              {dayEvents.map((event) => {
                const badgeColors = DOMAIN_BADGE_COLORS[event.domain] ?? 'border-slate-700 text-slate-400'

                return (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 py-2 hover:bg-[#111111] transition-colors px-1"
                  >
                    <span className="text-[10px] font-mono text-slate-600 w-10 shrink-0">
                      {formatTime24h(event.timestamp)}
                    </span>

                    <span className={`text-[9px] uppercase tracking-wider border px-1.5 py-0.5 shrink-0 bg-black font-mono ${badgeColors}`}>
                      {formatDomainLabel(event.domain)}
                    </span>

                    <span className="text-xs text-slate-300 font-mono truncate">
                      {event.eventType}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </DataLabSection>
  )
}

export default RecentEventStream
