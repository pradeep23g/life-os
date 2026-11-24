import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type PiPTimerProps = {
  pipWindow: Window
  bucket: string
  startTime?: string
  elapsedLabel?: string
  isPaused: boolean
  isStopping: boolean
  onTogglePause: () => void
  onStop: () => void
}

function formatElapsedSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  return [hours, minutes, seconds].map((v) => v.toString().padStart(2, '0')).join(':')
}

function syncStylesAndTheme(pipWindow: Window) {
  const mainDoc = document
  const pipDoc = pipWindow.document

  // 1. Mirror root classes (circadian themes: .theme-dawn, .theme-midnight, etc.)
  pipDoc.documentElement.className = mainDoc.documentElement.className

  // 2. Clone stylesheets and font declarations
  const mainHead = mainDoc.head
  const pipHead = pipDoc.head

  pipHead.innerHTML = ''
  mainHead.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    pipHead.appendChild(node.cloneNode(true))
  })
}

export default function PiPTimer({
  pipWindow,
  bucket,
  startTime,
  elapsedLabel: externalElapsedLabel,
  isPaused,
  isStopping,
  onTogglePause,
  onStop,
}: PiPTimerProps) {
  // Local wall-clock ticker anchored to pipWindow context (unthrottled by backgrounding)
  const [localNow, setLocalNow] = useState(() => Date.now())

  useEffect(() => {
    syncStylesAndTheme(pipWindow)

    // Observe stylesheet additions (e.g. lazy loaded route chunks, dynamically injected fonts)
    const styleObserver = new MutationObserver(() => {
      syncStylesAndTheme(pipWindow)
    })

    styleObserver.observe(document.head, { childList: true, subtree: true })

    // Observe theme class changes on <html>
    const themeObserver = new MutationObserver(() => {
      pipWindow.document.documentElement.className = document.documentElement.className
    })

    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => {
      styleObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [pipWindow])

  // Run interval on pipWindow so it continues ticking even when host tab is in background
  useEffect(() => {
    if (isPaused) return

    const intervalId = pipWindow.setInterval(() => {
      setLocalNow(Date.now())
    }, 1000)

    return () => {
      pipWindow.clearInterval(intervalId)
    }
  }, [pipWindow, isPaused])

  // Wall-clock calculation
  const computedElapsed = useMemo(() => {
    if (startTime) {
      const startMs = new Date(startTime).getTime()
      if (!Number.isNaN(startMs)) {
        const elapsedSec = (localNow - startMs) / 1000
        return formatElapsedSeconds(elapsedSec)
      }
    }
    return externalElapsedLabel || '00:00:00'
  }, [startTime, localNow, externalElapsedLabel])

  return createPortal(
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-text-primary select-none font-sans">
      <article className="w-full max-w-xs rounded-xl border border-border-subtle bg-surface/90 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-text-tertiary font-mono">
          <span>Focus Chronos</span>
          <span className="flex items-center gap-1.5 text-accent-primary">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {isPaused ? 'PAUSED' : 'RECORDING'}
          </span>
        </div>

        <p className="mt-1.5 text-xs font-medium text-text-secondary truncate">{bucket}</p>

        <p className="mt-2 text-4xl font-mono font-bold tracking-tight text-text-primary">
          {computedElapsed}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="flex-1 rounded-lg border border-border-base bg-elevated/80 px-3 py-2 text-xs font-medium text-text-primary transition-all hover:bg-border-base active:scale-95"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={isStopping}
            className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-900/40 active:scale-95 disabled:opacity-50"
          >
            {isStopping ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </article>
    </div>,
    pipWindow.document.body,
  )
}
