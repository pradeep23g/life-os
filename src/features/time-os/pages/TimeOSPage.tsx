import { useEffect, useMemo, useState } from 'react'
import { emitSystemFeedback } from '../../system/feedback'
import { TimeOsIcon } from '../../../components/icons'
import { useDocumentPiP } from '../../../hooks/useDocumentPiP'
import PiPTimer from '../components/PiPTimer'
import TimeInsights from '../components/TimeInsights'
import { TimeHistory } from '../components/TimeHistory'
import {
  TIME_BUCKETS,
  TIME_BUCKET_COLORS,
  useActiveTimer,
  useCompletedTimeLogs,
  useManualLog,
  useStartTimer,
  useStopTimer,
  type TimeBucket,
  type CompletedTimeLog,
  type TimeLog,
} from '../api/useTimeLogs'

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const mi = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Dynamic bucket color mapper
const BUCKET_COLORS = TIME_BUCKET_COLORS

const BUCKET_CLASSES: Record<string, string> = {
  'Academics': 'bg-purple-500',
  'Deep Work': 'bg-blue-500',
  'Admin': 'bg-amber-500',
  'Fitness': 'bg-red-500',
  'Learning': 'bg-emerald-500',
}

type TimelineInterval = {
  id: string
  bucket: TimeBucket
  startTime: number
  endTime: number
  isActive?: boolean
}

function DailyTimeline({ logs, activeTimer, now }: { logs: CompletedTimeLog[], activeTimer: TimeLog | null, now: number }) {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startMs = startOfDay.getTime()
  const endMs = startMs + 24 * 60 * 60 * 1000

  // Combine completed logs for today + the active timer (if started today)
  const todayLogs: TimelineInterval[] = logs.filter(log => {
    if (!log.end_time) return false
    const logStart = new Date(log.start_time).getTime()
    const logEnd = new Date(log.end_time).getTime()
    return logEnd > startMs && logStart < endMs
  }).map(log => ({
    id: log.id,
    bucket: log.bucket,
    startTime: new Date(log.start_time).getTime(),
    endTime: new Date(log.end_time!).getTime(),
    isActive: false,
  }))

  if (activeTimer) {
    const activeStart = new Date(activeTimer.start_time).getTime()
    if (activeStart < endMs) {
      todayLogs.push({
        id: 'active',
        bucket: activeTimer.bucket,
        startTime: activeStart,
        endTime: Math.min(now, endMs),
        isActive: true,
      })
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-16 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-text-tertiary font-mono mb-2">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <div className="relative h-6 w-full bg-surface/30 border border-border-subtle overflow-hidden">
        {todayLogs.map(log => {
          const s = Math.max(startMs, log.startTime)
          const e = Math.min(endMs, log.endTime)
          if (e <= s) return null

          const leftPercent = ((s - startMs) / (endMs - startMs)) * 100
          const widthPercent = ((e - s) / (endMs - startMs)) * 100
          const colorClass = BUCKET_CLASSES[log.bucket] || 'bg-text-secondary'

          return (
            <div
              key={log.id}
              className={`absolute top-0 bottom-0 ${colorClass} ${log.isActive ? 'animate-pulse opacity-80' : 'opacity-50 hover:opacity-100 transition-opacity'}`}
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
              title={`${log.bucket} (${Math.round((e - s) / 60000)}m)`}
            />
          )
        })}
        {/* Current time indicator */}
        {now > startMs && now < endMs && (
          <div 
            className="absolute top-0 bottom-0 w-px bg-threat-critical z-10 drop-shadow-[0_0_4px_rgba(220,38,38,1)]"
            style={{ left: `${((now - startMs) / (endMs - startMs)) * 100}%` }}
          />
        )}
      </div>
    </div>
  )
}

function TimeOSPage() {
  const { data: activeTimer } = useActiveTimer()
  const { data: completedLogs = [] } = useCompletedTimeLogs()
  const { mutate: startTimer, isPending: isStarting, error: startError } = useStartTimer()
  const { mutate: stopTimer, isPending: isStopping } = useStopTimer()
  const { mutate: createManualLog, isPending: isSavingManual, error: manualError } = useManualLog()

  const [bucket, setBucket] = useState<TimeBucket>('Deep Work')
  const [description, setDescription] = useState('')
  const [manualBucket, setManualBucket] = useState<TimeBucket>('Learning')
  const [manualDescription, setManualDescription] = useState('')
  const [manualStart, setManualStart] = useState(() => toDateTimeLocalValue(new Date(Date.now() - 30 * 60 * 1000)))
  const [manualEnd, setManualEnd] = useState(() => toDateTimeLocalValue(new Date()))
  const [now, setNow] = useState(() => Date.now())
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isPipPaused, setIsPipPaused] = useState(false)
  const [view, setView] = useState<'monolith' | 'history' | 'analytics'>('monolith')
  const { pipWindow, openPiP } = useDocumentPiP()

  useEffect(() => {
    if (!activeTimer) return
    const timerId = window.setInterval(() => {
      if (!isPipPaused) setNow(Date.now())
    }, 1000)
    return () => window.clearInterval(timerId)
  }, [activeTimer, isPipPaused])

  const elapsedLabel = useMemo(() => {
    if (!activeTimer) return '00:00:00'
    return formatElapsed(now - new Date(activeTimer.start_time).getTime())
  }, [activeTimer, now])

  const activeColor = activeTimer ? BUCKET_COLORS[activeTimer.bucket] || BUCKET_COLORS['Deep Work'] : 'transparent'

  return (
    <section className="min-h-[85vh] flex flex-col pb-24 font-sans selection:bg-primary/30 relative">
      {/* Dynamic Ambient Background Glow */}
      {activeTimer && (
        <div 
          className="absolute inset-0 blur-[150px] opacity-[0.15] -z-10 transition-colors duration-1000 pointer-events-none" 
          style={{ backgroundColor: activeColor }}
        />
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between pt-8 md:pt-12 px-6 gap-4 border-b border-border-subtle pb-6 mb-4">
        <div className="flex items-center gap-3 text-text-primary">
          <TimeOsIcon className="h-5 w-5" />
          <h1 className="text-sm uppercase tracking-[0.2em] font-medium">Temporal Engine</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-surface border border-border-subtle rounded-full p-1">
            <button
              onClick={() => setView('monolith')}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${view === 'monolith' ? 'bg-text-primary text-background shadow' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              Monolith
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${view === 'history' ? 'bg-text-primary text-background shadow' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              History
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest transition-all ${view === 'analytics' ? 'bg-text-primary text-background shadow' : 'text-text-tertiary hover:text-text-primary'}`}
            >
              Analytics
            </button>
          </div>
          
          <button
            onClick={() => setIsLogModalOpen(true)}
            className="text-[10px] uppercase tracking-widest text-text-tertiary hover:text-primary transition-colors"
          >
            [ Manual Log ]
          </button>
        </div>
      </header>

      {view === 'history' ? (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col items-center">
          <TimeHistory />
        </div>
      ) : view === 'analytics' ? (
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col items-center">
          <TimeInsights />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-[60vh] mt-8">
          
          {activeTimer ? (
            <div className="w-full flex flex-col items-center animate-fade-in relative z-10">
              <span 
                className="text-xs uppercase tracking-[0.3em] mb-4 animate-pulse"
                style={{ color: activeColor }}
              >
                Active Vector: {activeTimer.bucket}
              </span>
              <div className="text-[5rem] sm:text-[8rem] md:text-[12rem] tabular-nums font-mono font-light tracking-tighter leading-none text-text-primary drop-shadow-2xl">
                {elapsedLabel}
              </div>
              {activeTimer.description && (
                <p className="mt-8 text-sm text-text-secondary font-mono bg-surface/50 px-6 py-3 border border-border-subtle">
                  {activeTimer.description}
                </p>
              )}
              
              <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={() => { setIsPipPaused(false); stopTimer(); }}
                  disabled={isStopping}
                  className="px-8 py-3 bg-background border border-threat-critical/50 text-threat-critical text-[10px] font-mono uppercase tracking-[0.2em] hover:bg-threat-critical/10 transition-colors disabled:opacity-50"
                >
                  {isStopping ? 'HALTING...' : 'HALT SESSION'}
                </button>
                <button
                  onClick={async () => {
                    const opened = await openPiP(300, 200)
                    if (!opened) emitSystemFeedback({ title: 'PiP unavailable', description: 'Not supported.' })
                  }}
                  className="px-8 py-3 bg-background border border-border-subtle text-text-secondary text-[10px] font-mono uppercase tracking-[0.2em] hover:text-primary hover:border-primary/50 transition-all"
                >
                  DETACH PIP
                </button>
              </div>

              {/* Bottom Gantt Timeline */}
              <DailyTimeline logs={completedLogs} activeTimer={activeTimer} now={now} />
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col items-center animate-fade-in">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-tertiary mb-12">Initialize Focus Sector</h2>
              
              <div className="flex flex-wrap justify-center gap-3 mb-12 w-full">
                {TIME_BUCKETS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setBucket(option as TimeBucket)}
                    style={{
                      borderColor: bucket === option ? BUCKET_COLORS[option] : undefined,
                      color: bucket === option ? BUCKET_COLORS[option] : undefined,
                      backgroundColor: bucket === option ? `${BUCKET_COLORS[option].replace('1)', '0.1)')}` : undefined
                    }}
                    className={`px-6 py-3 text-[10px] font-mono uppercase tracking-[0.15em] transition-all border
                      ${bucket === option 
                        ? 'shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-105' 
                        : 'border-border-subtle bg-surface/30 text-text-secondary hover:border-text-secondary/50'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <div className="w-full max-w-md relative group mb-12">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="SESSION INTENT (OPTIONAL)"
                  className="w-full bg-transparent border-b border-border-subtle py-3 text-center text-text-primary placeholder:text-text-tertiary focus:outline-none transition-colors text-sm font-mono focus:border-text-primary"
                />
              </div>

              <button
                onClick={() => startTimer({ bucket, taskId: null, description })}
                disabled={isStarting}
                className="w-full max-w-md py-4 bg-text-primary text-background text-sm font-mono font-bold uppercase tracking-[0.2em] hover:bg-text-secondary transition-colors disabled:opacity-50 shadow-2xl"
              >
                {isStarting ? 'IGNITING...' : 'ENGAGE TIMER'}
              </button>
              {startError && <p className="mt-4 text-[10px] font-mono text-threat-critical uppercase">{startError.message}</p>}
              
              {/* Bottom Gantt Timeline (when no active timer) */}
              <DailyTimeline logs={completedLogs} activeTimer={null} now={now} />
            </div>
          )}
        </div>
      )}

      {/* Keep manual log modal but style it minimally */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/95 backdrop-blur-sm animate-fade-in">
          <article className="w-full max-w-lg border border-border-subtle bg-surface p-8 shadow-2xl relative">
            <button onClick={() => setIsLogModalOpen(false)} className="absolute top-6 right-6 text-text-tertiary hover:text-text-primary text-xs uppercase tracking-widest font-mono">CLOSE</button>
            <h3 className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-primary mb-8 border-b border-border-subtle pb-4">Manual Epoch Injection</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase text-text-tertiary mb-2 block tracking-widest font-mono">Start</label>
                  <input type="datetime-local" value={manualStart} onChange={(e) => setManualStart(e.target.value)} className="w-full bg-background border border-border-subtle p-2 text-xs font-mono text-text-primary focus:outline-none focus:border-text-primary" />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-text-tertiary mb-2 block tracking-widest font-mono">End</label>
                  <input type="datetime-local" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} className="w-full bg-background border border-border-subtle p-2 text-xs font-mono text-text-primary focus:outline-none focus:border-text-primary" />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase text-text-tertiary mb-2 block tracking-widest font-mono">Sector</label>
                <select value={manualBucket} onChange={(e) => setManualBucket(e.target.value as TimeBucket)} className="w-full bg-background border border-border-subtle p-2 text-xs font-mono text-text-primary focus:outline-none focus:border-text-primary">
                  {TIME_BUCKETS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-text-tertiary mb-2 block tracking-widest font-mono">Description (Optional)</label>
                <input
                  type="text"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="WHAT WAS ACCOMPLISHED?"
                  className="w-full bg-background border border-border-subtle p-2 text-xs font-mono text-text-primary focus:outline-none focus:border-text-primary placeholder:text-text-tertiary"
                />
              </div>

              {manualError && (
                <p className="text-[10px] font-mono text-threat-critical uppercase">{manualError.message}</p>
              )}

              <button
                onClick={() => createManualLog({ bucket: manualBucket, startTime: manualStart, endTime: manualEnd, description: manualDescription.trim() || undefined }, { 
                  onSuccess: () => {
                    setIsLogModalOpen(false)
                    setManualDescription('')
                  } 
                })}
                disabled={isSavingManual}
                className="w-full py-4 bg-text-primary text-background text-[10px] font-mono uppercase tracking-[0.2em] font-bold mt-4 hover:bg-text-secondary transition-colors"
              >
                {isSavingManual ? 'INJECTING...' : 'INJECT RECORD'}
              </button>
            </div>
          </article>
        </div>
      )}

      {activeTimer && pipWindow && (
        <PiPTimer
          pipWindow={pipWindow}
          bucket={activeTimer.bucket}
          elapsedLabel={elapsedLabel}
          isPaused={isPipPaused}
          isStopping={isStopping}
          onTogglePause={() => setIsPipPaused(!isPipPaused)}
          onStop={() => { setIsPipPaused(false); stopTimer(); }}
        />
      )}
    </section>
  )
}

export default TimeOSPage
