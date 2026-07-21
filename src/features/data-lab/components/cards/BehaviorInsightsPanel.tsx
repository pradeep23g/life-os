import type { BehaviorInsight } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type BehaviorInsightsPanelProps = {
  insights: BehaviorInsight[]
}

const INSIGHT_ICONS: Record<string, string> = {
  most_active_weekday: '◆',
  least_active_weekday: '◇',
  longest_streak: '█',
  current_streak: '▶',
  largest_increase: 'â†‘',
  largest_decline: 'â†“',
  peak_hour: '◉',
  best_week: '★',
  most_consistent: 'â—',
  least_consistent: '○',
}

function BehaviorInsightsPanel({ insights }: BehaviorInsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <DataLabSection title="Behavior Insights" subtitle="Factual observations">
        <p className="text-sm text-slate-500 py-4">Insufficient data for insights.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Behavior Insights" subtitle="Deterministic observations derived from your telemetry. No AI.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.map((insight, idx) => (
          <div
            key={`${insight.type}-${idx}`}
            className="flex items-start gap-3 border border-border bg-black px-3 py-2.5"
          >
            <span className="text-[10px] text-slate-600 mt-0.5 w-3 shrink-0 text-center font-mono">
              {INSIGHT_ICONS[insight.type] ?? 'Â·'}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                {insight.label}
              </p>
              <p className="text-sm font-mono text-slate-200 mt-0.5">{insight.value}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{insight.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </DataLabSection>
  )
}

export default BehaviorInsightsPanel
