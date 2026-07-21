import { useMemo } from 'react'

import type { BehaviorDriftMetrics } from '../../types/types'
import { toDriftRows } from '../../transforms/behavior'
import DataLabSection from '../shared/DataLabSection'

type BehaviorDriftCardProps = {
  metrics: BehaviorDriftMetrics
}

function BehaviorDriftCard({ metrics }: BehaviorDriftCardProps) {
  const rows = useMemo(() => toDriftRows(metrics), [metrics])

  if (rows.length === 0) {
    return (
      <DataLabSection title="Behavior Drift" subtitle="Change detection">
        <p className="text-sm text-slate-500 py-4">Insufficient data for drift analysis.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Behavior Drift" subtitle={`Current vs previous half of ${metrics.periodLabel}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {rows.map((row) => (
          <div
            key={row.moduleName}
            className="border border-border bg-black p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
              {row.moduleName}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm font-mono">
                {row.direction === 'up' ? (
                  <span className="text-emerald-400">â†‘</span>
                ) : row.direction === 'down' ? (
                  <span className="text-rose-400">â†“</span>
                ) : (
                  <span className="text-slate-500">−</span>
                )}
              </span>
              <span
                className={`text-lg font-mono font-bold ${
                  row.direction === 'up'
                    ? 'text-emerald-400'
                    : row.direction === 'down'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}
              >
                {row.displayDelta}
              </span>
            </div>
          </div>
        ))}
      </div>
    </DataLabSection>
  )
}

export default BehaviorDriftCard
