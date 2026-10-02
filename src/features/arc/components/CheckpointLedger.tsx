import { useMemo } from 'react'
import type { ArcCheckpoint } from '../types'

interface CheckpointLedgerProps {
  checkpoints: ArcCheckpoint[]
  accentColor?: string
}

interface PhaseGroup {
  phaseName: string
  focus?: string
  checkpoints: ArcCheckpoint[]
}

export function CheckpointLedger({
  checkpoints,
  accentColor = '#22d3ee',
}: CheckpointLedgerProps) {
  const phaseGroups = useMemo(() => {
    const groups: PhaseGroup[] = []
    for (const cp of checkpoints) {
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.phaseName === cp.phaseName) {
        lastGroup.checkpoints.push(cp)
      } else {
        groups.push({
          phaseName: cp.phaseName,
          focus: cp.focus,
          checkpoints: [cp],
        })
      }
    }
    return groups
  }, [checkpoints])

  if (!checkpoints || checkpoints.length === 0) {
    return null
  }

  return (
    <section className="space-y-8 my-10 sm:my-14" aria-label="Seasonal Checkpoint Ledger">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Checkpoint Ledger • Tactical Progression by Phase
        </h2>
        <span className="font-mono text-xs text-text-tertiary">
          {phaseGroups.length} {phaseGroups.length === 1 ? 'PHASE' : 'PHASES'} • {checkpoints.length} WEEKS
        </span>
      </div>

      <div className="space-y-8">
        {phaseGroups.map((group) => {
          const firstCp = group.checkpoints[0]
          const lastCp = group.checkpoints[group.checkpoints.length - 1]
          const isPhaseActive = group.checkpoints.some((cp) => cp.isCurrent)

          return (
            <div key={group.phaseName} className="space-y-3">
              {/* Phase Group Header */}
              <div className="flex items-center justify-between py-1.5 px-3 rounded bg-surface/40 border border-border-subtle">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: isPhaseActive ? accentColor : 'var(--color-border, #3f3f46)' }}
                  />
                  <h3 className="font-serif font-medium text-sm text-text-primary tracking-tight">
                    {group.phaseName}
                  </h3>
                  {isPhaseActive && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold"
                      style={{
                        backgroundColor: `${accentColor}20`,
                        color: accentColor,
                      }}
                    >
                      ACTIVE PHASE
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] text-text-tertiary tabular-nums">
                  {firstCp.startDate} — {lastCp.endDate}
                </span>
              </div>

              {/* Checkpoint Rows within this Phase */}
              <div className="divide-y divide-border-subtle/60 pl-2">
                {group.checkpoints.map((cp) => {
                  const isCompleted = cp.status === 'completed'
                  const isCurrent = cp.isCurrent

                  return (
                    <article
                      key={cp.weekNumber}
                      className={`py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-y-2 gap-x-6 transition-colors ${
                        isCurrent ? 'bg-elevated/30 -mx-2 px-3 rounded-lg border-l-2' : ''
                      }`}
                      style={isCurrent ? { borderLeftColor: accentColor } : undefined}
                    >
                      {/* Left Column: Label + Focus */}
                      <div className="space-y-1 sm:max-w-md">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-semibold tabular-nums text-text-primary">
                            {cp.label}
                          </span>
                          {isCurrent && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase font-medium"
                              style={{
                                backgroundColor: `${accentColor}15`,
                                color: accentColor,
                              }}
                            >
                              CURRENT WEEK
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
                          className="uppercase tracking-wider text-[11px] font-medium"
                          style={
                            isCurrent
                              ? { color: accentColor }
                              : isCompleted
                              ? { color: 'var(--color-text-secondary, #a1a1aa)' }
                              : { color: 'var(--color-text-tertiary, #71717a)' }
                          }
                        >
                          {cp.status}
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
