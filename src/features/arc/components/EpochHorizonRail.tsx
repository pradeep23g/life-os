import { useState } from 'react'
import type { ArcCheckpoint, ArcTemporalProgress } from '../types'

interface EpochHorizonRailProps {
  checkpoints: ArcCheckpoint[]
  progress: ArcTemporalProgress
  onSelectCheckpoint?: (checkpoint: ArcCheckpoint) => void
}

export function EpochHorizonRail({
  checkpoints,
  progress,
  onSelectCheckpoint,
}: EpochHorizonRailProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)

  const activeCheckpoint = checkpoints.find((c) => c.isCurrent) ?? checkpoints[0]
  const displayedCheckpoint =
    checkpoints.find((c) => c.weekNumber === hoveredWeek) ?? activeCheckpoint

  return (
    <section className="my-10 sm:my-14 space-y-6" aria-label="Seasonal Epoch Horizon Rail">
      {/* Section Header with quiet datum */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Epoch Horizon Rail • 13-Week Temporal Traverse
        </h2>
        <div className="font-mono text-xs text-text-secondary tabular-nums">
          <span>{displayedCheckpoint.label}</span>
          <span className="mx-2 text-border">•</span>
          <span className="text-text-primary font-medium">{displayedCheckpoint.phaseName}</span>
          <span className="mx-2 text-border">•</span>
          <span className="text-text-tertiary">{displayedCheckpoint.startDate} — {displayedCheckpoint.endDate}</span>
        </div>
      </div>

      {/* DESKTOP RAIL (Hidden on mobile < 768px): Horizontal temporal map */}
      <div className="hidden md:block pt-4 pb-2" role="region" aria-label="Desktop timeline traverse">
        <div className="relative flex items-center justify-between w-full">
          {/* Continuous baseline hairline track */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-border-subtle z-0" />

          {/* Start node */}
          <div className="relative z-10 flex flex-col items-center">
            <span className="h-2 w-2 rounded-full bg-text-tertiary" />
            <span className="mt-3 font-mono text-[10px] text-text-tertiary uppercase tracking-widest">
              START
            </span>
          </div>

          {/* 13 Weekly Checkpoints */}
          {checkpoints.map((cp) => {
            const isCompleted = cp.status === 'completed'
            const isCurrent = cp.isCurrent
            const isHovered = hoveredWeek === cp.weekNumber

            return (
              <button
                key={cp.weekNumber}
                type="button"
                onMouseEnter={() => setHoveredWeek(cp.weekNumber)}
                onMouseLeave={() => setHoveredWeek(null)}
                onFocus={() => setHoveredWeek(cp.weekNumber)}
                onBlur={() => setHoveredWeek(null)}
                onClick={() => onSelectCheckpoint?.(cp)}
                aria-label={`${cp.label}: ${cp.phaseName} (${cp.status})`}
                aria-current={isCurrent ? 'step' : undefined}
                className="relative z-10 group flex flex-col items-center p-2 focus-visible:outline-none cursor-pointer"
              >
                {/* Visual checkpoint node */}
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isCurrent
                      ? 'ring-4 ring-accent-primary/20 bg-accent-primary scale-125'
                      : isCompleted
                        ? 'bg-text-primary'
                        : 'bg-surface border border-border group-hover:border-text-secondary'
                  } ${isHovered ? 'scale-125' : ''}`}
                >
                  {isCompleted && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-background" />
                  )}
                  {isCurrent && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-background animate-ping" />
                  )}
                </div>

                {/* Week Label below node */}
                <span
                  className={`mt-2 font-mono text-[10px] tabular-nums transition-colors ${
                    isCurrent
                      ? 'text-accent-primary font-semibold'
                      : isCompleted
                        ? 'text-text-secondary'
                        : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                >
                  W{String(cp.weekNumber).padStart(2, '0')}
                </span>
              </button>
            )
          })}

          {/* End node */}
          <div className="relative z-10 flex flex-col items-center">
            <span
              className={`h-2 w-2 rounded-full ${
                progress.status === 'completed' ? 'bg-accent-primary' : 'bg-text-tertiary'
              }`}
            />
            <span className="mt-3 font-mono text-[10px] text-text-tertiary uppercase tracking-widest">
              END
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE FIELD JOURNAL (Visible on mobile < 768px): Vertical stem timeline */}
      <div className="block md:hidden pt-2 pl-2" role="region" aria-label="Mobile vertical field journal">
        <div className="relative border-l border-border-subtle ml-3 pl-6 space-y-6">
          {/* Start marker */}
          <div className="relative flex items-center gap-3">
            <span className="absolute -left-[31px] h-2.5 w-2.5 rounded-full bg-text-tertiary ring-4 ring-background" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              ARC INITIATION • DAY 01
            </span>
          </div>

          {/* Vertical list of checkpoints */}
          {checkpoints.map((cp) => {
            const isCompleted = cp.status === 'completed'
            const isCurrent = cp.isCurrent

            return (
              <div
                key={cp.weekNumber}
                className={`relative flex flex-col gap-1 transition-all ${
                  isCurrent ? 'bg-elevated/40 -ml-2 pl-3 py-2 rounded-lg border-l-2 border-accent-primary' : ''
                }`}
              >
                {/* Node on the vertical stem line */}
                <span
                  className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${
                    isCurrent
                      ? 'bg-accent-primary ring-accent-primary/20'
                      : isCompleted
                        ? 'bg-text-primary'
                        : 'bg-surface border border-border'
                  }`}
                />

                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
                    {cp.label} • {cp.phaseName}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-text-tertiary">
                    {cp.status === 'current' ? (
                      <span className="text-accent-primary font-medium">CURRENT</span>
                    ) : isCompleted ? (
                      'COMPLETED'
                    ) : (
                      'UPCOMING'
                    )}
                  </span>
                </div>

                <p className="font-sans text-xs text-text-secondary">
                  {cp.focus}
                </p>

                <p className="font-mono text-[10px] text-text-tertiary tabular-nums">
                  {cp.startDate} — {cp.endDate}
                </p>
              </div>
            )
          })}

          {/* End marker */}
          <div className="relative flex items-center gap-3 pt-2">
            <span className="absolute -left-[31px] h-2.5 w-2.5 rounded-full bg-text-tertiary ring-4 ring-background" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
              ARC COMPLETION • DAY 90
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
