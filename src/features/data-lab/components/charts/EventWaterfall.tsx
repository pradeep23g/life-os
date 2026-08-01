import type { WaterfallNode } from '../../types/types'
import { formatTime24h, formatDomainLabel } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type EventWaterfallProps = {
  nodes: WaterfallNode[]
}

const DOMAIN_COLORS: Record<string, string> = {
  'mind-os': 'border-l-blue-500',
  'productivity-hub': 'border-l-amber-500',
  'learning-os': 'border-l-purple-500',
  'mission-control': 'border-l-slate-500',
  'fitness-os': 'border-l-emerald-500',
  'time-os': 'border-l-cyan-500',
  'finance-os': 'border-l-rose-500',
}

function EventWaterfall({ nodes }: EventWaterfallProps) {
  if (nodes.length === 0) {
    return (
      <DataLabSection title="Event Waterfall" subtitle="Event propagation flow">
        <p className="text-sm text-slate-500 py-4">No events to visualize.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Event Waterfall" subtitle="Event flow. Debug event propagation across systems.">
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[59px] top-0 bottom-0 w-[1px] bg-[#222222]" />

        <div className="space-y-0">
          {nodes.map((node, idx) => {
            const borderColor = DOMAIN_COLORS[node.domain] ?? 'border-l-slate-600'
            const isLastInGroup =
              idx === nodes.length - 1 ||
              nodes[idx + 1].domain !== node.domain

            return (
              <div
                key={`${node.timestamp}-${idx}`}
                className={`flex items-start gap-3 py-1.5 ${
                  isLastInGroup ? 'mb-2' : ''
                }`}
              >
                <div className="w-[48px] shrink-0 text-right">
                  <span className="text-[10px] font-mono text-slate-600">
                    {formatTime24h(node.timestamp)}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <div className="h-2 w-2 rounded-full bg-[#333333] border border-[#444444] z-10" />
                </div>

                <div className={`flex-1 border-l-2 ${borderColor} pl-3 py-0.5`}>
                  <p className="text-[10px] font-mono text-slate-300">{node.eventType}</p>
                  <p className="text-[9px] text-slate-600">
                    {formatDomainLabel(node.domain)} · {node.entityType}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DataLabSection>
  )
}

export default EventWaterfall
