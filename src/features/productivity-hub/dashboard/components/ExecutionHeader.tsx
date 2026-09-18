import { useEffect, useState } from 'react'
import type { TimeLog } from '../../../time-os/api/useTimeLogs'

interface ExecutionHeaderProps {
  pendingCount: number
  completedTodayCount: number
  overdueCount: number
  activeTimer: TimeLog | null | undefined
  activeTaskTitle?: string | null
  onStopFocus: () => void
  isStoppingFocus?: boolean
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':')
}

export function ExecutionHeader({
  pendingCount,
  completedTodayCount,
  overdueCount,
  activeTimer,
  activeTaskTitle,
  onStopFocus,
  isStoppingFocus = false,
}: ExecutionHeaderProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!activeTimer) {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [activeTimer])

  const elapsedLabel = activeTimer
    ? formatElapsed(now - new Date(activeTimer.start_time).getTime())
    : null

  const focusTarget = activeTaskTitle || activeTimer?.description || activeTimer?.bucket || 'Deep Work'

  return (
    <header className="space-y-4 border-b border-border/40 pb-6 pt-2">
      {/* Top Ledger Metadata Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-tertiary">
            <span>Execution Queue</span>
            <span>•</span>
            <span className="tabular-nums font-semibold text-text-primary">{pendingCount} Pending</span>
            {completedTodayCount > 0 && (
              <>
                <span>•</span>
                <span className="tabular-nums text-threat-healthy">{completedTodayCount} Done Today</span>
              </>
            )}
            {overdueCount > 0 && (
              <>
                <span>•</span>
                <span className="tabular-nums font-semibold text-threat-critical">{overdueCount} Overdue</span>
              </>
            )}
          </div>
          <h1 className="font-sans text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
            Active Task Stream
          </h1>
        </div>

        {/* Keyboard Quick Reference for Desktop */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">J</kbd>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">K</kbd>
            <span className="ml-1">Navigate</span>
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">SPACE</kbd>
            <span className="ml-1">Toggle</span>
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">F</kbd>
            <span className="ml-1">Focus</span>
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">/</kbd>
            <span className="ml-1">Quick Add</span>
          </span>
        </div>
      </div>

      {/* Active Focus / Status Horizon Rule */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs font-mono">
        {activeTimer ? (
          <div className="flex items-center gap-3 rounded-lg border border-accent-primary/30 bg-accent-primary/10 px-3 py-2 text-accent-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-primary animate-pulse" />
            <span className="font-medium">
              CURRENT FOCUS: <span className="text-text-primary">{focusTarget}</span>
            </span>
            <span className="tabular-nums font-semibold tracking-wider">
              [{elapsedLabel}]
            </span>
            <button
              type="button"
              onClick={onStopFocus}
              disabled={isStoppingFocus}
              className="ml-2 rounded border border-accent-primary/40 bg-accent-primary/20 px-2 py-0.5 text-[11px] font-sans font-medium text-text-primary transition-colors hover:bg-accent-primary/30 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isStoppingFocus ? 'Saving...' : 'Complete Focus'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-text-tertiary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-text-tertiary/40" />
            <span>CURRENT FOCUS: <span className="text-text-secondary">IDLE</span></span>
            <span className="hidden sm:inline text-text-tertiary/60">• Press [F] on any task to initiate focus session</span>
          </div>
        )}

        <div className="text-text-tertiary">
          <span>MODE: <span className="text-text-secondary uppercase">Ledger Execution</span></span>
        </div>
      </div>
    </header>
  )
}
