import { Link } from 'react-router-dom'

interface AmbientHorizonBarProps {
  dateDisplay: string
  solarPhase: string
  focusTimeDisplay: string
  momentumScore: number
  pendingTasksCount: number
  pendingHabitsCount: number
  totalPending: number
}

export function AmbientHorizonBar({
  dateDisplay,
  solarPhase,
  focusTimeDisplay,
  momentumScore,
  pendingTasksCount,
  pendingHabitsCount,
  totalPending,
}: AmbientHorizonBarProps) {
  return (
    <footer
      className="w-full border-t border-border-subtle pt-6 mt-12 md:mt-20 select-none"
      aria-label="Ambient telemetry horizon"
    >
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-6 text-xs font-mono tabular-nums text-text-tertiary">
        {/* Left cluster: Temporal & Solar Datum */}
        <div className="flex items-center gap-4">
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
