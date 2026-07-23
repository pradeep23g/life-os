import { useState } from 'react'

import type { MatrixCell } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type CorrelationMatrixProps = {
  grid: MatrixCell[][]
  labels: string[]
}

function getCellColor(value: number): string {
  if (value >= 0.7) return 'bg-emerald-500'
  if (value >= 0.4) return 'bg-emerald-700/60'
  if (value >= 0.1) return 'bg-emerald-900/40'
  if (value > -0.1) return 'bg-[#1a1a1a]'
  if (value > -0.4) return 'bg-rose-900/40'
  if (value > -0.7) return 'bg-rose-700/60'
  return 'bg-rose-500'
}

function CorrelationMatrix({ grid, labels }: CorrelationMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<MatrixCell | null>(null)

  if (grid.length === 0 || labels.length === 0) {
    return (
      <DataLabSection title="Correlation Matrix" subtitle="Behavioral correlations">
        <p className="text-sm text-slate-500 py-4">Insufficient data for correlations.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Correlation Matrix" subtitle="Pearson r between tracked systems. Hover for coefficients.">
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Column headers */}
          <div className="flex ml-[72px]">
            {labels.map((label) => (
              <div
                key={label}
                className="w-10 text-[9px] font-mono text-slate-500 text-center truncate"
                title={label}
              >
                {label.slice(0, 4)}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {grid.map((row, rowIdx) => (
            <div key={rowIdx} className="flex items-center">
              <div className="w-[72px] text-[10px] font-mono text-slate-400 truncate pr-2 text-right">
                {labels[rowIdx]}
              </div>
              {row.map((cell, colIdx) => (
                <div
                  key={colIdx}
                  className={`h-9 w-10 flex items-center justify-center cursor-default transition-colors ${getCellColor(cell.value)} ${
                    rowIdx === colIdx ? 'opacity-30' : ''
                  }`}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <span className="text-[9px] font-mono text-slate-300">
                    {rowIdx === colIdx ? '—' : cell.value.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
        <span>−1.0</span>
        <div className="h-2 w-3 bg-rose-500" />
        <div className="h-2 w-3 bg-rose-700/60" />
        <div className="h-2 w-3 bg-[#1a1a1a]" />
        <div className="h-2 w-3 bg-emerald-700/60" />
        <div className="h-2 w-3 bg-emerald-500" />
        <span>+1.0</span>
      </div>

      {/* Hover detail */}
      {hoveredCell && hoveredCell.row !== hoveredCell.col ? (
        <div className="mt-2 text-xs font-mono text-slate-400 border-t border-border pt-2">
          <span className="text-slate-200">{hoveredCell.labelA}</span>
          <span className="mx-2">×</span>
          <span className="text-slate-200">{hoveredCell.labelB}</span>
          <span className="mx-2">=</span>
          <span className={hoveredCell.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {hoveredCell.value >= 0 ? '+' : ''}{hoveredCell.value.toFixed(2)}
          </span>
        </div>
      ) : null}
    </DataLabSection>
  )
}

export default CorrelationMatrix
