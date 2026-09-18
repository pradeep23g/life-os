import type { ArcCheckpoint } from '../types'

interface CheckpointLedgerProps {
  checkpoints: ArcCheckpoint[]
}

export function CheckpointLedger({ checkpoints }: CheckpointLedgerProps) {
  return (
    <section className="space-y-6 my-10 sm:my-14" aria-label="Seasonal Checkpoint Ledger">
      <div className="border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Checkpoint Ledger • Tactical Progression
        </h2>
      </div>

      <div className="divide-y divide-border-subtle">
        {checkpoints.map((cp) => {
          const isCompleted = cp.status === 'completed'
          const isCurrent = cp.isCurrent

          return (
            <article
              key={cp.weekNumber}
              className={`py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-y-2 gap-x-6 transition-colors ${
                isCurrent ? 'bg-elevated/20 -mx-2 px-2 rounded-lg' : ''
              }`}
            >
              {/* Left Column: Label + Phase Name */}
              <div className="space-y-1 sm:max-w-md">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
                    {cp.label}
                  </span>
                  <span className="font-sans text-sm font-medium text-text-primary">
                    {cp.phaseName}
                  </span>
                  {isCurrent && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-accent-primary/10 text-accent-primary font-medium">
                      ACTIVE WEEK
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-text-secondary leading-relaxed">
                  {cp.focus}
                </p>
              </div>

              {/* Right Column: Date bounds + Status */}
              <div className="flex items-center justify-between sm:justify-end gap-4 font-mono text-xs tabular-nums shrink-0">
                <span className="text-text-tertiary">
                  {cp.startDate} — {cp.endDate}
                </span>
                <span
                  className={`uppercase tracking-wider text-[11px] font-medium ${
                    isCurrent
                      ? 'text-accent-primary'
                      : isCompleted
                        ? 'text-text-secondary'
                        : 'text-text-tertiary'
                  }`}
                >
                  {cp.status}
                </span>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
