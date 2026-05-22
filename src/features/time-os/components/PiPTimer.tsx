import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type PiPTimerProps = {
  pipWindow: Window
  bucket: string
  elapsedLabel: string
  isPaused: boolean
  isStopping: boolean
  onTogglePause: () => void
  onStop: () => void
}

function syncStylesToPiPWindow(pipWindow: Window) {
  const mainHead = document.head
  const pipHead = pipWindow.document.head

  pipHead.innerHTML = ''

  mainHead.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    pipHead.appendChild(node.cloneNode(true))
  })
}

export default function PiPTimer({
  pipWindow,
  bucket,
  elapsedLabel,
  isPaused,
  isStopping,
  onTogglePause,
  onStop,
}: PiPTimerProps) {
  useEffect(() => {
    syncStylesToPiPWindow(pipWindow)
  }, [pipWindow])

  return createPortal(
    <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] p-3 text-slate-100">
      <article className="w-full rounded-xl border border-[#222222] bg-black p-3">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">Active Focus Session</p>
        <p className="mt-1 text-xs text-slate-300">{bucket}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-100">{elapsedLabel}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-xs text-slate-100 hover:bg-[#222222]"
          >
            {isPaused ? 'Play' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={isStopping}
            className="rounded border border-rose-900 bg-black px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/30 disabled:opacity-60"
          >
            {isStopping ? 'Stopping...' : 'Stop'}
          </button>
        </div>
      </article>
    </div>,
    pipWindow.document.body,
  )
}
