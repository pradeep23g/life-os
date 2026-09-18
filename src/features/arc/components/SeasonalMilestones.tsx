import type { ArcMilestone } from '../types'

interface SeasonalMilestonesProps {
  milestones: ArcMilestone[]
  activeDays: number
}

export function SeasonalMilestones({ milestones, activeDays }: SeasonalMilestonesProps) {
  return (
    <section className="space-y-6 my-10 sm:my-14" aria-label="Telemetry-derived Seasonal Milestones">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Seasonal Milestones • Telemetry Invariants
        </h2>
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {activeDays} RECORDED DAYS OBSERVED IN ARC
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {milestones.map((m) => {
          const percent = Math.min(100, Math.round((m.currentValue / m.targetValue) * 100))

          return (
            <article key={m.id} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-sans text-sm font-medium text-text-primary">
                  {m.title}
                </span>
                <span className="font-mono text-xs tabular-nums text-text-primary">
                  <span className="font-semibold">{m.currentValue}</span>
                  <span className="text-text-tertiary"> / {m.targetValue} {m.unit}</span>
                </span>
              </div>

              {/* Minimal hairline progress track: quiet datum line, not a gamified candy bar */}
              <div
                className="w-full h-1 bg-surface rounded-full overflow-hidden border border-border-subtle"
                role="progressbar"
                aria-valuenow={m.currentValue}
                aria-valuemin={0}
                aria-valuemax={m.targetValue}
                aria-label={`${m.title}: ${m.currentValue} of ${m.targetValue} ${m.unit}`}
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    m.isAchieved ? 'bg-accent-primary' : 'bg-text-secondary'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-sans text-text-tertiary">
                <span>{m.description}</span>
                <span className="font-mono tabular-nums text-text-secondary">
                  {percent}%
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
