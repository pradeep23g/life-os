import type { HistogramBar } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type EventFrequencyHistogramProps = {
  bars: HistogramBar[]
}

function EventFrequencyHistogram({ bars }: EventFrequencyHistogramProps) {
  if (bars.length === 0) {
    return (
      <DataLabSection title="Event Frequency" subtitle="Most common event types">
        <p className="text-sm text-slate-500 py-4">No event data available.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Event Frequency" subtitle="Most fired event types. Useful for validating telemetry quality.">
      <div className="space-y-[6px]">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <div className="w-[160px] shrink-0 text-right">
              <span className="text-[10px] font-mono text-slate-400 truncate block" title={bar.label}>
                {bar.label.length > 24 ? `…${bar.label.slice(-24)}` : bar.label}
              </span>
            </div>
            <div className="flex-1 h-4 bg-[#111111] overflow-hidden">
              <div
                className="h-full bg-slate-600 transition-all duration-300"
                style={{ width: `${bar.percent}%` }}
              />
            </div>
            <div className="w-[40px] shrink-0 text-right">
              <span className="text-[10px] font-mono text-slate-500">{bar.value}</span>
            </div>
          </div>
        ))}
      </div>
    </DataLabSection>
  )
}

export default EventFrequencyHistogram
