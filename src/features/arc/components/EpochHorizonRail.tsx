import { useMemo, useState } from 'react'
import type { ArcCheckpoint, ArcPhase, ArcSeasonConfig, ArcTemporalProgress } from '../types'

interface EpochHorizonRailProps {
  checkpoints: ArcCheckpoint[]
  progress: ArcTemporalProgress
  phases?: ArcPhase[] | ArcSeasonConfig['phases']
  accentColor?: string
  onSelectCheckpoint?: (checkpoint: ArcCheckpoint) => void
}

export function EpochHorizonRail({
  checkpoints,
  progress,
  phases,
  accentColor = '#22d3ee',
  onSelectCheckpoint,
}: EpochHorizonRailProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)

  const activeCheckpoint = checkpoints.find((c) => c.isCurrent) ?? checkpoints[0]
  const displayedCheckpoint =
    checkpoints.find((c) => c.weekNumber === hoveredWeek) ?? activeCheckpoint

  // Decoupled Phase Segments: from config.phases when present or derived from checkpoints
  const phaseSegments = useMemo(() => {
    if (phases && phases.length > 0) {
      return phases.map((p, idx) => {
        const weekNum = 'week' in p && typeof p.week === 'number' ? p.week : undefined
        const startDay = p.startDay ?? (weekNum ? (weekNum - 1) * 7 + 1 : idx * 7 + 1)
        const endDay = p.endDay ?? (weekNum ? weekNum * 7 : (idx + 1) * 7)
        return {
          id: p.id ?? `phase-${idx}`,
          name: p.name,
          focus: p.focus,
          startDay,
          endDay,
        }
      })
    }

    // Derive contiguous phase groups from checkpoints
    const groups: Array<{ id: string; name: string; focus?: string; startDay: number; endDay: number }> = []
    for (const cp of checkpoints) {
      const last = groups[groups.length - 1]
      const cpStartDay = (cp.weekNumber - 1) * 7 + 1
      const cpEndDay = Math.min(progress.totalDays, cp.weekNumber * 7)
      if (last && last.name === cp.phaseName) {
        last.endDay = cpEndDay
      } else {
        groups.push({
          id: `derived-phase-${groups.length}`,
          name: cp.phaseName,
          focus: cp.focus,
          startDay: cpStartDay,
          endDay: cpEndDay,
        })
      }
    }
    return groups
  }, [phases, checkpoints, progress.totalDays])

  if (!checkpoints || checkpoints.length === 0) {
    return null
  }

  return (
    <section className="my-10 sm:my-14 space-y-6" aria-label="Seasonal Epoch Horizon Rail">
      {/* Section Header with quiet datum */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Epoch Horizon Rail • {checkpoints.length}-Week Temporal Traverse ({progress.totalDays} Days)
        </h2>
        {displayedCheckpoint && (
          <div className="font-mono text-xs text-text-secondary tabular-nums">
            <span>{displayedCheckpoint.label}</span>
            <span className="mx-2 text-border">•</span>
            <span className="text-text-primary font-medium">{displayedCheckpoint.phaseName}</span>
            <span className="mx-2 text-border">•</span>
            <span className="text-text-tertiary">
              {displayedCheckpoint.startDate} — {displayedCheckpoint.endDate}
            </span>
          </div>
        )}
      </div>

      {/* DESKTOP RAIL (Hidden on mobile < 768px): Horizontal temporal map */}
      <div className="hidden md:block pt-4 pb-2" role="region" aria-label="Desktop timeline traverse">
        {/* Phase Demarcation Track */}
        {phaseSegments.length > 0 && (
          <div className="flex items-center gap-2 w-full mb-6">
            {phaseSegments.map((segment) => {
              const span = Math.max(1, segment.endDay - segment.startDay + 1)
              const isPhaseActive =
                progress.currentDay >= segment.startDay && progress.currentDay <= segment.endDay
              const isPhasePast = progress.currentDay > segment.endDay

              return (
                <div
                  key={segment.id}
                  style={{ flex: span }}
                  className={`p-2 rounded border transition-all text-left ${
                    isPhaseActive
                      ? 'bg-surface border-border shadow-sm ring-1'
                      : isPhasePast
                      ? 'bg-surface/20 border-border-subtle/50 opacity-70'
                      : 'bg-surface/40 border-border-subtle/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: isPhaseActive
                            ? accentColor
                            : isPhasePast
                            ? 'var(--color-text-tertiary, #71717a)'
                            : 'var(--color-border, #3f3f46)',
                        }}
                      />
                      <span
                        className="font-serif text-xs font-medium tracking-tight truncate text-text-primary"
                        style={isPhaseActive ? { color: accentColor } : undefined}
                      >
                        {segment.name}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-text-tertiary tabular-nums shrink-0">
                      DAY {segment.startDay}–{segment.endDay}
                    </span>
                  </div>
                  {segment.focus && (
                    <p className="font-sans text-[11px] text-text-tertiary line-clamp-1 mt-0.5">
                      {segment.focus}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

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

          {/* Weekly Checkpoints */}
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
                      ? 'ring-4 scale-125'
                      : isCompleted
                      ? 'bg-text-primary'
                      : 'bg-surface border border-border group-hover:border-text-secondary'
                  } ${isHovered ? 'scale-125' : ''}`}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: accentColor,
                          boxShadow: `0 0 0 4px ${accentColor}33`,
                        }
                      : undefined
                  }
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
                      ? 'font-semibold'
                      : isCompleted
                      ? 'text-text-secondary'
                      : 'text-text-tertiary group-hover:text-text-secondary'
                  }`}
                  style={isCurrent ? { color: accentColor } : undefined}
                >
                  W{String(cp.weekNumber).padStart(2, '0')}
                </span>
              </button>
            )
          })}

          {/* End node */}
          <div className="relative z-10 flex flex-col items-center">
            <span
              className="h-2 w-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  progress.status === 'completed' ? accentColor : 'var(--color-text-tertiary, #71717a)',
              }}
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
                  isCurrent
                    ? 'bg-elevated/40 -ml-2 pl-3 py-2 rounded-lg border-l-2'
                    : ''
                }`}
                style={isCurrent ? { borderLeftColor: accentColor } : undefined}
              >
                {/* Node on the vertical stem line */}
                <span
                  className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-background ${
                    isCompleted
                      ? 'bg-text-primary'
                      : isCurrent
                      ? ''
                      : 'bg-surface border border-border'
                  }`}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: accentColor,
                          boxShadow: `0 0 0 4px ${accentColor}33`,
                        }
                      : undefined
                  }
                />

                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
                    {cp.label} • {cp.phaseName}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-text-tertiary">
                    {cp.status === 'current' ? (
                      <span className="font-medium" style={{ color: accentColor }}>
                        CURRENT
                      </span>
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
              ARC COMPLETION • DAY {String(progress.totalDays).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
