import { useState } from 'react'
import type { ArcMilestoneState, ArcPaceStatus } from '../types'
import { Square, CheckSquare, AlertTriangle } from 'lucide-react'

interface SeasonalMilestonesProps {
  milestones: ArcMilestoneState[]
  activeDays: number
  accentColor?: string
  onToggleManualMilestone?: (milestoneId: string, completed?: boolean, notes?: string) => Promise<void> | void
}

function getPaceBadge(status: ArcPaceStatus) {
  switch (status) {
    case 'complete':
      return {
        label: 'COMPLETE',
        className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
      }
    case 'on_track':
      return {
        label: 'ON TRACK',
        className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
      }
    case 'at_risk':
      return {
        label: 'AT RISK',
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
      }
    case 'behind':
      return {
        label: 'BEHIND',
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
      }
    case 'pending':
    default:
      return {
        label: 'PENDING',
        className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25',
      }
  }
}

export function SeasonalMilestones({
  milestones,
  activeDays,
  accentColor = '#22d3ee',
  onToggleManualMilestone,
}: SeasonalMilestonesProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (milestoneId: string, currentAchieved: boolean) => {
    if (!onToggleManualMilestone || togglingId) return
    try {
      setTogglingId(milestoneId)
      await onToggleManualMilestone(milestoneId, !currentAchieved)
    } catch (err) {
      console.error('Failed to toggle manual milestone:', err)
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <section className="space-y-6 my-10 sm:my-14" aria-label="Dynamic Milestone Ledger">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border-subtle pb-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
          Seasonal Milestones • Telemetry Invariants & Manual Objectives
        </h2>
        <span className="font-mono text-xs tabular-nums text-text-secondary">
          {activeDays} RECORDED DAYS OBSERVED IN ARC
        </span>
      </div>

      {milestones.length === 0 ? (
        <div className="py-8 text-center text-text-tertiary font-mono text-xs border border-dashed border-border-subtle rounded-lg">
          NO MILESTONES CONFIGURED FOR THIS ARC
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {milestones.map((m) => {
            const isManual = m.kind === 'manual'
            const percent = m.completionPercent ?? Math.min(100, Math.round((m.currentValue / (m.targetValue || 1)) * 100))
            const badge = getPaceBadge(m.status)
            const isToggling = togglingId === m.id

            return (
              <article
                key={m.id}
                className={`space-y-3 p-4 rounded-lg bg-surface/40 border transition-all ${
                  m.isAchieved
                    ? 'border-border/80 bg-surface/70'
                    : 'border-border-subtle hover:border-border'
                }`}
              >
                {/* Header: Title, Kind tag, and Pace Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {isManual && (
                        <button
                          type="button"
                          onClick={() => handleToggle(m.id, m.isAchieved)}
                          disabled={isToggling || !onToggleManualMilestone}
                          aria-label={
                            onToggleManualMilestone
                              ? `Mark ${m.title} as ${m.isAchieved ? 'incomplete' : 'complete'}`
                              : `${m.title} (frozen)`
                          }
                          className={`text-text-secondary transition-colors focus:outline-none disabled:opacity-50 ${
                            onToggleManualMilestone ? 'hover:text-text-primary cursor-pointer' : 'cursor-not-allowed'
                          }`}
                        >
                          {m.isAchieved ? (
                            <CheckSquare className="h-4 w-4" style={{ color: accentColor }} />
                          ) : (
                            <Square className="h-4 w-4 text-text-tertiary hover:text-text-secondary" />
                          )}
                        </button>
                      )}
                      <span
                        className={`font-sans text-sm font-medium text-text-primary ${
                          m.isAchieved && isManual ? 'line-through text-text-secondary' : ''
                        }`}
                      >
                        {m.title}
                      </span>
                    </div>
                    {m.description && (
                      <p className="font-sans text-xs text-text-tertiary leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>

                  {/* Strict Pace Badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Progress / Status Display */}
                {isManual ? (
                  <div className="flex items-center justify-between text-xs font-mono pt-1 text-text-tertiary border-t border-border-subtle/50">
                    <span className="text-[10px] uppercase tracking-wider">
                      MANUAL VERIFICATION
                    </span>
                    <span className="tabular-nums font-medium text-text-secondary">
                      {m.isAchieved ? 'VERIFIED' : 'PENDING ACTION'}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Telemetry Progress Bar */}
                    <div
                      className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border-subtle"
                      role="progressbar"
                      aria-valuenow={m.currentValue}
                      aria-valuemin={0}
                      aria-valuemax={m.targetValue}
                      aria-label={`${m.title}: ${m.currentValue} of ${m.targetValue} ${m.unit ?? ''}`}
                    >
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: m.isAchieved ? accentColor : 'var(--color-text-secondary, #71717a)',
                        }}
                      />
                    </div>

                    {/* Progress Numerals & Percent */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="tabular-nums text-text-primary">
                        <span className="font-semibold">{m.currentValue}</span>
                        <span className="text-text-tertiary">
                          {' '}
                          / {m.targetValue} {m.unit}
                        </span>
                      </span>
                      <span className="tabular-nums text-text-secondary font-medium">
                        {percent}%
                      </span>
                    </div>

                    {/* Recovery Rate Callout when behind or at risk */}
                    {(m.status === 'behind' || m.status === 'at_risk') && m.paceRequired && m.paceRequired > 0 ? (
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono ${
                          m.status === 'behind'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}
                      >
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>
                          +{m.paceRequired} {m.unit?.toLowerCase() ?? 'units'}/day needed to recover
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
