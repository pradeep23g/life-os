import type { WeeklyScoreMetrics } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type WeeklyScoreSummaryProps = {
  metrics: WeeklyScoreMetrics
}

function TrendArrow({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'up') return <span className="text-emerald-400 text-sm">↑</span>
  if (direction === 'down') return <span className="text-rose-400 text-sm">↓</span>
  return <span className="text-slate-500 text-sm">−</span>
}

function Sparkline({ points }: { points: { score: number }[] }) {
  if (points.length < 2) return null

  const maxScore = Math.max(...points.map((p) => p.score), 1)
  const minScore = Math.min(...points.map((p) => p.score), 0)
  const range = maxScore - minScore || 1

  const width = 200
  const height = 32
  const padding = 2

  const pathPoints = points.map((point, idx) => {
    const x = padding + (idx / (points.length - 1)) * (width - padding * 2)
    const y = height - padding - ((point.score - minScore) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} className="block" aria-hidden="true">
      <polyline
        points={pathPoints.join(' ')}
        fill="none"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {(() => {
        const last = pathPoints[pathPoints.length - 1]
        const [cx, cy] = last.split(',').map(Number)
        return <circle cx={cx} cy={cy} r="2.5" fill="#10b981" />
      })()}
    </svg>
  )
}

function WeeklyScoreSummary({ metrics }: WeeklyScoreSummaryProps) {
  return (
    <DataLabSection title="Weekly System Score" subtitle="Behavioral engagement composite">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Current score */}
        <div className="flex-1 border border-border bg-black p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Current</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold text-slate-100">
              {metrics.currentScore}
            </span>
            <TrendArrow direction={metrics.trend} />
            <span className={`text-xs font-mono ${
              metrics.delta > 0 ? 'text-emerald-400' : metrics.delta < 0 ? 'text-rose-400' : 'text-slate-500'
            }`}>
              {metrics.delta > 0 ? '+' : ''}{metrics.delta}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-slate-600">{metrics.momentumLabel}</p>
        </div>

        {/* Trend + meta */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-mono mb-1">Trend</p>
            <Sparkline points={metrics.sparklinePoints} />
          </div>

          <div className="flex gap-4 text-[10px] font-mono text-slate-500">
            <div>
              <span className="block text-slate-600">Rank</span>
              <span className="text-slate-300">#{metrics.rank}/{metrics.totalWeeks}</span>
            </div>
            <div>
              <span className="block text-slate-600">Prev</span>
              <span className="text-slate-300">{metrics.previousScore}</span>
            </div>
          </div>
        </div>
      </div>
    </DataLabSection>
  )
}

export default WeeklyScoreSummary
