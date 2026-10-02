import type { ArcTemporalProgress } from '../types'

interface ArcCountdownLedgerProps {
  progress: ArcTemporalProgress
  accentColor?: string
}

export function ArcCountdownLedger({ progress, accentColor = '#22d3ee' }: ArcCountdownLedgerProps) {
  const { currentDay, totalDays, remainingDays, percentElapsed, status } = progress

  return (
    <section
      className="border-y border-border-subtle py-4 sm:py-5 my-8 select-none"
      aria-label="Season countdown and progress"
    >
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
        {/* Tabular Numerals Hero Ratio */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs sm:text-sm tabular-nums text-text-primary">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary">DAY</span>
            <span className="font-semibold text-base sm:text-lg text-text-primary">
              {String(currentDay).padStart(2, '0')}
            </span>
            <span className="text-text-tertiary">OF</span>
            <span className="text-text-secondary">{totalDays}</span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          <div className="flex items-center gap-2 text-text-secondary">
            <span className="font-semibold text-text-primary">
              {remainingDays}
            </span>
            <span>DAYS REMAINING</span>
          </div>

          <span className="text-border hidden sm:inline">•</span>

          <div className="flex items-center gap-2 text-text-secondary">
            <span className="font-semibold" style={{ color: accentColor }}>
              {percentElapsed.toFixed(1)}%
            </span>
            <span>ELAPSED</span>
          </div>
        </div>

        {/* State Tag */}
        <div className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          {status === 'upcoming' && 'TEMPORAL STATE: PRE-SEASON'}
          {status === 'active' && (
            <span className="inline-flex items-center gap-1.5" style={{ color: accentColor }}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: accentColor }}
              />
              TEMPORAL STATE: ACTIVE CHAPTER
            </span>
          )}
          {status === 'completed' && 'TEMPORAL STATE: ARCHIVE CLOSED'}
        </div>
      </div>
    </section>
  )
}
