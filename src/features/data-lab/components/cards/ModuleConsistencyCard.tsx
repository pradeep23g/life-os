import type { ConsistencyMetricEntry } from '../../types/types'
import { formatDateShort } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type ModuleConsistencyCardProps = {
  metrics: ConsistencyMetricEntry[]
}

function ModuleConsistencyCard({ metrics }: ModuleConsistencyCardProps) {
  if (metrics.length === 0) {
    return (
      <DataLabSection title="Module Consistency" subtitle="Per-module engagement rates">
        <p className="text-sm text-slate-500 py-4">No consistency data available.</p>
      </DataLabSection>
    )
  }

  const sorted = [...metrics].sort((a, b) => a.consistencyPercent - b.consistencyPercent)
  const weakestThreshold = 30

  return (
    <DataLabSection title="Module Consistency" subtitle="Weakest surfaces first. Trend = first half vs second half of period.">
      <div className="space-y-3">
        {sorted.map((entry) => {
          const isWeak = entry.consistencyPercent < weakestThreshold

          return (
            <div key={entry.moduleName} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono ${isWeak ? 'text-rose-400' : 'text-slate-300'}`}>
                    {entry.moduleName}
                  </span>
                  {entry.trend === 'up' ? (
                    <span className="text-[9px] text-emerald-500">↑</span>
                  ) : entry.trend === 'down' ? (
                    <span className="text-[9px] text-rose-500">↓</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                  <span>{entry.activeDays}/{entry.totalDays}d</span>
                  <span className={isWeak ? 'text-rose-400' : 'text-slate-300'}>
                    {entry.consistencyPercent}%
                  </span>
                </div>
              </div>

              <div className="h-2 bg-[#111111] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isWeak ? 'bg-rose-600/50' : 'bg-slate-600'
                  }`}
                  style={{ width: `${entry.consistencyPercent}%` }}
                />
              </div>

              {entry.lastActiveDate ? (
                <p className="text-[9px] text-slate-600 font-mono">
                  Last: {formatDateShort(entry.lastActiveDate)}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </DataLabSection>
  )
}

export default ModuleConsistencyCard
