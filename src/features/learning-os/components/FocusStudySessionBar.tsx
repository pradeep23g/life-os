import { useState, useEffect } from 'react'
import { Play, Square, Clock, Sparkles } from 'lucide-react'
import { useActiveTimer, useStartTimer, useStopTimer } from '../../time-os'
import type { LearningRoadmap } from '../types/types'

interface FocusStudySessionBarProps {
  roadmaps: LearningRoadmap[]
  onOpenLogModal?: (roadmapId?: string) => void
}

export function FocusStudySessionBar({ roadmaps, onOpenLogModal }: FocusStudySessionBarProps) {
  const { data: activeTimer, isLoading: timerLoading } = useActiveTimer()
  const { mutate: startTimer, isPending: isStarting } = useStartTimer()
  const { mutate: stopTimer, isPending: isStopping } = useStopTimer()

  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>('')
  const [sessionTopic, setSessionTopic] = useState('')
  const [elapsedMinutes, setElapsedMinutes] = useState(0)

  const activeRoadmaps = roadmaps.filter((r) => r.status === 'active')
  const effectiveSelectedId = selectedRoadmapId || (activeRoadmaps.length > 0 ? activeRoadmaps[0].id : '')

  const isLearningTimer = activeTimer && activeTimer.bucket === 'Learning'

  // Calculate live elapsed minutes for active timer
  useEffect(() => {
    if (!activeTimer?.start_time) return

    const calculateElapsed = () => {
      const start = new Date(activeTimer.start_time).getTime()
      const now = Date.now()
      const mins = Math.max(0, Math.floor((now - start) / 60000))
      setElapsedMinutes(mins)
    }

    calculateElapsed()
    const interval = setInterval(calculateElapsed, 15000)
    return () => clearInterval(interval)
  }, [activeTimer?.start_time])

  const handleStartStudy = (e: React.FormEvent) => {
    e.preventDefault()
    if (isStarting) return

    const selectedRoadmap = roadmaps.find((r) => r.id === effectiveSelectedId)
    const desc = sessionTopic.trim()
      ? `${selectedRoadmap?.title ?? 'Study'}: ${sessionTopic.trim()}`
      : `${selectedRoadmap?.title ?? 'Intellectual Study'}`

    startTimer({
      bucket: 'Learning',
      description: desc,
    })
    setSessionTopic('')
  }

  const handleStopStudy = () => {
    if (isStopping) return
    stopTimer()
  }

  if (timerLoading) return null

  // CASE 1: Active Study Session in Progress
  if (isLearningTimer) {
    return (
      <aside
        aria-label="Active study focus session"
        className="relative overflow-hidden border border-accent-primary/40 bg-surface px-5 py-4 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-primary" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-accent-primary">
                  Active Study Traversal
                </span>
                <span className="text-xs font-mono text-text-tertiary">|</span>
                <span className="text-xs font-mono text-text-secondary tabular-nums">
                  {elapsedMinutes}m elapsed
                </span>
              </div>
              <p className="text-sm font-medium text-text-primary mt-0.5">
                {activeTimer.description || 'Deep Study Session'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleStopStudy}
              disabled={isStopping}
              className="inline-flex items-center gap-2 rounded border border-border-subtle bg-elevated px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider text-text-primary hover:bg-threat-warning/20 hover:text-threat-warning hover:border-threat-warning/40 transition-colors disabled:opacity-50"
            >
              <Square size={12} className="fill-current" />
              {isStopping ? 'Inscribing...' : 'Conclude Session'}
            </button>
          </div>
        </div>
      </aside>
    )
  }

  // CASE 2: No active learning timer - Quick launch bar
  return (
    <div className="border-b border-border-subtle pb-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-accent-primary" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              Study Focus Gate
            </h2>
          </div>
          <p className="text-xs text-text-tertiary mt-0.5">
            Initiate a dedicated learning timer linked with Time OS and telemetric session logs.
          </p>
        </div>

        {activeRoadmaps.length > 0 ? (
          <form onSubmit={handleStartStudy} className="flex flex-wrap items-center gap-2">
            <select
              value={effectiveSelectedId}
              onChange={(e) => setSelectedRoadmapId(e.target.value)}
              aria-label="Target roadmap"
              className="h-8 rounded border border-border-subtle bg-surface px-2.5 text-xs font-sans text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              {activeRoadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="Focus module or theorem..."
              aria-label="Focus module or topic"
              className="h-8 w-44 sm:w-56 rounded border border-border-subtle bg-background px-2.5 text-xs text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
            />

            <button
              type="submit"
              disabled={isStarting}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-accent-primary px-3 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Play size={11} className="fill-current" />
              {isStarting ? 'Commencing...' : 'Focus'}
            </button>

            {onOpenLogModal && (
              <button
                type="button"
                onClick={() => onOpenLogModal(effectiveSelectedId || undefined)}
                className="h-8 rounded border border-border-subtle bg-transparent px-3 text-xs font-mono uppercase tracking-wider text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
              >
                Inscribe Retrospective
              </button>
            )}
          </form>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-text-tertiary">
              No active trajectories charted.
            </span>
            {onOpenLogModal && (
              <button
                type="button"
                onClick={() => onOpenLogModal()}
                className="inline-flex items-center gap-1.5 rounded border border-border-subtle bg-surface px-3 py-1 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                <Sparkles size={12} className="text-accent-primary" />
                Inscribe Study Log
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
