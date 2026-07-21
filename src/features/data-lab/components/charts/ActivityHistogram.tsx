import type { HistogramBar } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type ActivityHistogramProps = {
  bars: HistogramBar[]
  peakHour: number
}

function ActivityHistogram({ bars, peakHour }: ActivityHistogramProps) {
  if (bars.length === 0 || bars.every((b) => b.value === 0)) {
    return (
      <DataLabSection title="Daily Rhythm" subtitle="24-hour activity distribution">
        <p className="text-sm text-slate-500 py-4">No event timing data available.</p>
      </DataLabSection>
    )
  }

  const maxValue = Math.max(...bars.map((b) => b.value), 1)

  return (
    <DataLabSection title="Daily Rhythm" subtitle="When do things actually happen? Each bar = 1 hour bucket.">
      <div className="flex items-end gap-[2px] h-32">
        {bars.map((bar, idx) => {
          const heightPercent = (bar.value / maxValue) * 100
          const isPeak = idx === peakHour

          return (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center justify-end h-full group"
              title={`${bar.label}: ${bar.value} events`}
            >
              <div
                className={`w-full transition-all duration-300 ${
                  isPeak
                    ? 'bg-emerald-500'
                    : bar.value > 0
                      ? 'bg-slate-600 group-hover:bg-slate-500'
                      : 'bg-[#161616]'
                }`}
                style={{ height: `${Math.max(heightPercent, bar.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* Hour labels — show every 3 hours */}
      <div className="flex gap-[2px] mt-1">
        {bars.map((bar, idx) => (
          <div key={bar.label} className="flex-1 text-center">
            {idx % 3 === 0 ? (
              <span className="text-[8px] font-mono text-slate-600">{bar.label}</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3 text-[10px] font-mono text-slate-500">
        Peak:{' '}
        <span className="text-emerald-400">
          {bars[peakHour]?.label} ({bars[peakHour]?.value} events)
        </span>
      </div>
    </DataLabSection>
  )
}

export default ActivityHistogram
