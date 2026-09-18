import { useEffect, useState } from 'react'
import type { TimeLog } from '../../time-os/api/useTimeLogs'

interface HomePrimaryActionProps {
  label: string
  hasActiveTimer: boolean
  activeTimer: TimeLog | null | undefined
  isStarting: boolean
  onExecute: () => void
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':')
}

export function HomePrimaryAction({
  label,
  hasActiveTimer,
  activeTimer,
  isStarting,
  onExecute,
}: HomePrimaryActionProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!hasActiveTimer || !activeTimer) {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [hasActiveTimer, activeTimer])

  const elapsedLabel = activeTimer
    ? formatElapsed(now - new Date(activeTimer.start_time).getTime())
    : null

  return (
    <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        type="button"
        onClick={onExecute}
        disabled={isStarting}
        aria-label={hasActiveTimer ? `Resume focus session, currently running ${elapsedLabel}` : label}
        className="inline-flex h-12 w-full sm:w-auto items-center justify-center px-8 text-sm font-sans font-medium tracking-normal text-background bg-text-primary rounded-lg transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer"
      >
        <span>{label}</span>
      </button>

      {hasActiveTimer && elapsedLabel ? (
        <span
          className="font-mono text-xs tabular-nums text-accent-primary flex items-center gap-2 self-start sm:self-center"
          aria-live="polite"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
          ACTIVE • {elapsedLabel}
        </span>
      ) : null}
    </div>
  )
}
