import { useState, useMemo } from 'react'

import type { DataLabDailyActivity } from '../../api/useDataLab'
import { computeCorrelationExplorer } from '../../metrics/correlation'
import DataLabSection from '../shared/DataLabSection'

type CorrelationExplorerCardProps = {
  dailyRows: DataLabDailyActivity[]
}

const METRICS = ['Habits', 'Journal', 'Deep Work', 'Workouts', 'Tasks', 'Finance']

function CorrelationExplorerCard({ dailyRows }: CorrelationExplorerCardProps) {
  const [selected, setSelected] = useState('Habits')

  const correlations = useMemo(
    () => computeCorrelationExplorer(dailyRows, selected),
    [dailyRows, selected],
  )

  return (
    <DataLabSection title="Correlation Explorer" subtitle="Select a metric. See what correlates.">
      {/* Metric selector */}
      <div className="flex flex-wrap gap-1 mb-4">
        {METRICS.map((metric) => (
          <button
            key={metric}
            type="button"
            onClick={() => setSelected(metric)}
            className={`px-2 py-1 text-[10px] font-mono transition-colors ${
              selected === metric
                ? 'bg-[#222222] text-slate-100'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#111111]'
            }`}
          >
            {metric}
          </button>
        ))}
      </div>

      {/* Results */}
      {correlations.length === 0 ? (
        <p className="text-xs text-slate-500">Insufficient data for correlation analysis.</p>
      ) : (
        <div className="space-y-2">
          {correlations.map((entry) => (
            <div
              key={entry.metric}
              className="flex items-center justify-between border border-[#222222] bg-black px-3 py-2"
            >
              <span className="text-xs font-mono text-slate-300">{entry.metric}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-[#1a1a1a] overflow-hidden">
                  <div
                    className={`h-full ${
                      entry.coefficient >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60'
                    }`}
                    style={{
                      width: `${Math.abs(entry.coefficient) * 100}%`,
                      marginLeft: entry.coefficient < 0 ? 'auto' : undefined,
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-mono w-12 text-right ${
                    entry.coefficient >= 0.3
                      ? 'text-emerald-400'
                      : entry.coefficient <= -0.3
                        ? 'text-rose-400'
                        : 'text-slate-500'
                  }`}
                >
                  {entry.coefficient >= 0 ? '+' : ''}{entry.coefficient.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DataLabSection>
  )
}

export default CorrelationExplorerCard
