import { Link } from 'react-router-dom'
import { getArcHealthColor } from '../../arc/constants'
import type { ArcPaceStatus } from '../../arc/types'

interface AmbientHorizonBarProps {
  dateDisplay: string
  solarPhase: string
  focusTimeDisplay: string
  momentumScore: number
  pendingTasksCount: number
  pendingHabitsCount: number
  totalPending: number
  hasActiveArc?: boolean
  arcTitle?: string
  arcCurrentDay?: number
  arcTotalDays?: number
  arcOverallHealth?: ArcPaceStatus
  arcAccentColor?: string
}

export function AmbientHorizonBar({
  dateDisplay,
  solarPhase,
  focusTimeDisplay,
  momentumScore,
  pendingTasksCount,
  pendingHabitsCount,
  totalPending,
  hasActiveArc = false,
  arcTitle = '',
  arcCurrentDay,
  arcTotalDays,
  arcOverallHealth,
  arcAccentColor = '#22d3ee',
  currentDay,
  totalDays,
  overallHealth,
}: AmbientHorizonBarProps & { currentDay?: number; totalDays?: number; overallHealth?: ArcPaceStatus }) {
  const effectiveCurrentDay = arcCurrentDay ?? currentDay ?? 0
  const effectiveTotalDays = arcTotalDays ?? totalDays ?? 0
  const effectiveOverallHealth = arcOverallHealth ?? overallHealth ?? 'on_track'
  const paceColor = getArcHealthColor(effectiveOverallHealth)

  return (
    <footer
      className="w-full border-t border-border-subtle pt-6 mt-12 md:mt-20 select-none"
      aria-label="Ambient telemetry horizon"
    >
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs font-mono tabular-nums text-text-tertiary">
        {/* Left cluster: Temporal, Solar, & Active Arc Seasonal Datum */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-text-secondary">{dateDisplay}</span>
          <span className="text-border">/</span>
          <span className="uppercase text-text-secondary">{solarPhase}</span>
          <span className="text-border">/</span>
          <Link
            to="/time-os"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded"
            title="View Time OS"
          >
            FOCUS {focusTimeDisplay}
          </Link>
          <span className="text-border">/</span>
          <Link
            to="/system"
            className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded"
            title="View System Momentum"
          >
            MOMENTUM {momentumScore}
          </Link>
          <span className="text-border">/</span>
          {hasActiveArc && arcTitle ? (
            <Link
              to="/arc"
              className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded inline-flex items-center gap-1.5 group"
              title={`Active Arc Campaign: ${arcTitle} · Pace Health: ${effectiveOverallHealth.replace('_', ' ').toUpperCase()}`}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: paceColor,
                  boxShadow: `0 0 6px ${paceColor}`,
                }}
              />
              <span
                className="font-semibold transition-colors"
                style={{ color: arcAccentColor || '#22d3ee' }}
              >
                [ARC] {arcTitle.toUpperCase()}
              </span>
              <span className="text-text-tertiary group-hover:text-text-secondary">
                · DAY {effectiveCurrentDay}/{effectiveTotalDays}
              </span>
              <span className="text-text-tertiary">·</span>
              <span
                className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border"
                style={{
                  color: paceColor,
                  borderColor: `${paceColor}40`,
                  backgroundColor: `${paceColor}15`,
                }}
              >
                {effectiveOverallHealth.replace('_', ' ')}
              </span>
            </Link>
          ) : (
            <Link
              to="/arc"
              className="hover:text-text-primary text-text-tertiary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded inline-flex items-center gap-1.5"
              title="No Active Arc — Click to initiate seasonal campaign"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-600" />
              <span>[ARC] STANDBY</span>
            </Link>
          )}
        </div>

        {/* Right cluster: Real Pending Trace */}
        <div className="flex items-center gap-3">
          {totalPending > 0 ? (
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-primary" />
              <Link
                to="/productivity-hub/tasks"
                className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded"
              >
                {pendingTasksCount} {pendingTasksCount === 1 ? 'TASK' : 'TASKS'}
              </Link>
              <span className="text-border">•</span>
              <Link
                to="/mind-os/habits"
                className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary rounded"
              >
                {pendingHabitsCount} {pendingHabitsCount === 1 ? 'HABIT' : 'HABITS'}
              </Link>
            </div>
          ) : (
            <span className="text-text-tertiary">
              CLEAR HORIZON // TRAJECTORY STABLE
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}
