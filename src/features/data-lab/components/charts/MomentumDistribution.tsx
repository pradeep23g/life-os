import type { HistogramBar } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type MomentumDistributionProps = {
  bars: HistogramBar[]
  currentLevel: 'low' | 'medium' | 'high'
  totalWeeks: number
}

const LEVEL_COLORS: Record<string, string> = {
  Low: 'bg-rose-600/60',
  Medium: 'bg-amber-500/60',
  High: 'bg-emerald-500/60',
}

const LEVEL_TEXT: Record<string, string> = {
  Low: 'text-rose-400',
  Medium: 'text-amber-400',
  High: 'text-emerald-400',
}

function MomentumDistribution({ bars, currentLevel, totalWeeks }: MomentumDistributionProps) {
  if (totalWeeks === 0) {
    return (
      <DataLabSection title="Momentum Distribution" subtitle="Weekly momentum breakdown">
        <p className="text-sm text-slate-500 py-4">No weekly data available.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Momentum Distribution" subtitle="How often do you experience each momentum level?">
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono ${LEVEL_TEXT[bar.label] ?? 'text-slate-400'}`}>
                {bar.label}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {bar.value} week{bar.value !== 1 ? 's' : ''} ({bar.percent}%)
              </span>
            </div>
            <div className="h-3 bg-[#111111] overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${LEVEL_COLORS[bar.label] ?? 'bg-slate-600'}`}
                style={{ width: `${bar.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-[#222222] pt-3 text-[10px] font-mono text-slate-500">
        Current:{' '}
        <span className={LEVEL_TEXT[currentLevel === 'low' ? 'Low' : currentLevel === 'medium' ? 'Medium' : 'High'] ?? 'text-slate-300'}>
          {currentLevel === 'low' ? 'Low' : currentLevel === 'medium' ? 'Medium' : 'High'} Momentum
        </span>
      </div>
    </DataLabSection>
  )
}

export default MomentumDistribution
