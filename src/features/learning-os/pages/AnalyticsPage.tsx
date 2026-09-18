import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Activity, BookOpen } from 'lucide-react'
import {
  useRoadmaps,
  useRecentSessionLogs,
  useSessionAnalytics,
  useRoadmapProgress,
} from '../api/useLearningOS'

export function AnalyticsPage() {
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps()
  const { data: recentLogs = [], isLoading: logsLoading } = useRecentSessionLogs()
  const { data: analyticsLogs = [], isLoading: analyticsLoading } = useSessionAnalytics()
  const { data: progressList = [] } = useRoadmapProgress()

  const progressMap = useMemo(
    () => new Map(progressList.map((p) => [p.roadmap_id, p])),
    [progressList]
  )

  // Aggregate Metrics
  const totalMinutes = useMemo(
    () => analyticsLogs.reduce((acc, log) => acc + (log.duration_minutes || 0), 0),
    [analyticsLogs]
  )

  const totalHours = (totalMinutes / 60).toFixed(1)

  const avgSessionDuration = useMemo(
    () => (analyticsLogs.length > 0 ? Math.round(totalMinutes / analyticsLogs.length) : 0),
    [analyticsLogs, totalMinutes]
  )

  const activeRoadmapsCount = useMemo(
    () => roadmaps.filter((r) => r.status === 'active').length,
    [roadmaps]
  )

  const avgCompletionPct = useMemo(() => {
    if (roadmaps.length === 0) return 0
    const sum = roadmaps.reduce((acc, r) => {
      if (r.status === 'completed') return acc + 100
      const prog = progressMap.get(r.id)
      return acc + (prog?.pct_complete || 0)
    }, 0)
    return Math.round(sum / roadmaps.length)
  }, [roadmaps, progressMap])

  // 7-Day Session Distribution (Instrument Mode)
  const last7DaysData = useMemo(() => {
    const days: { label: string; dateStr: string; minutes: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
      days.push({ label: dayLabel, dateStr, minutes: 0 })
    }

    const dayMap = new Map(days.map((d) => [d.dateStr, d]))

    analyticsLogs.forEach((log) => {
      if (!log.logged_at) return
      const logDate = log.logged_at.slice(0, 10)
      const entry = dayMap.get(logDate)
      if (entry) {
        entry.minutes += log.duration_minutes || 0
      }
    })

    const maxMinutes = Math.max(...days.map((d) => d.minutes), 60)

    return days.map((d) => ({
      ...d,
      heightPct: Math.round((d.minutes / maxMinutes) * 100),
    }))
  }, [analyticsLogs])

  const isLoading = roadmapsLoading || logsLoading || analyticsLoading

  return (
    <div className="space-y-16 font-sans text-text-primary">
      {/* Back Navigation & Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-4">
        <Link
          to="/learning-os"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to Study Shelf
        </Link>
        <span className="text-xs font-mono uppercase tracking-widest text-text-tertiary">
          INSTRUMENT MODE • TELEMETRY
        </span>
      </div>

      {/* Header Monograph */}
      <div className="space-y-2">
        <h1 className="text-3xl font-light tracking-tight text-text-primary font-serif">
          Intellectual Cadence & Telemetry
        </h1>
        <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">
          Study volume breakdown, temporal allocation, and curriculum completion indices.
        </p>
      </div>

      {/* 1. THE FIELD PRIMITIVE: Tabular Metric Horizon (Zero Card Boxes) */}
      <section aria-label="Study Telemetry Matrix" className="border-y border-border-subtle py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Metric 1 */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
              Total Study Volume
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light font-mono tabular-nums text-text-primary">
                {totalHours}
                <span className="text-sm font-mono text-text-tertiary ml-0.5">h</span>
              </span>
              <span className="text-xs font-mono tabular-nums text-text-secondary">
                ({totalMinutes}m)
              </span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary block">
              Cumulative focus time
            </span>
          </div>

          {/* Metric 2 */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
              Sessions Inscribed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light font-mono tabular-nums text-accent-primary">
                {analyticsLogs.length}
              </span>
              <span className="text-xs font-mono text-text-secondary">logs</span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary block">
              Verified entries
            </span>
          </div>

          {/* Metric 3 */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
              Mean Session Span
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light font-mono tabular-nums text-text-primary">
                {avgSessionDuration}
                <span className="text-sm font-mono text-text-tertiary ml-0.5">m</span>
              </span>
              <span className="text-xs font-mono text-text-secondary">avg</span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary block">
              Per study engagement
            </span>
          </div>

          {/* Metric 4 */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
              Overall Traversal
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light font-mono tabular-nums text-accent-primary">
                {avgCompletionPct}
                <span className="text-sm font-mono text-text-tertiary ml-0.5">%</span>
              </span>
              <span className="text-xs font-mono text-text-secondary">ratio</span>
            </div>
            <span className="text-[11px] font-mono text-text-tertiary block">
              Across {roadmaps.length} folios
            </span>
          </div>
        </div>
      </section>

      {/* 2. INSTRUMENT HISTOGRAM: 7-Day Study Cadence */}
      <section aria-label="7-Day Study Cadence Histogram" className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              7-Day Study Cadence Histogram
            </h2>
            <p className="text-xs font-serif italic text-text-tertiary mt-0.5">
              Daily recorded minutes over the rolling 7-day window.
            </p>
          </div>
          <span className="text-xs font-mono text-text-tertiary">
            Axis: Minutes
          </span>
        </div>

        <div className="h-48 pt-4 pb-2 border-b border-border-subtle">
          <div className="flex items-end justify-between gap-4 h-full">
            {last7DaysData.map((day) => (
              <div key={day.dateStr} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                <span className="text-xs font-mono tabular-nums text-text-secondary">
                  {day.minutes > 0 ? `${day.minutes}m` : '—'}
                </span>
                <div className="w-full max-w-[48px] bg-surface h-32 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-accent-primary transition-all duration-500"
                    style={{
                      height: `${Math.max(day.heightPct, day.minutes > 0 ? 6 : 2)}%`,
                      opacity: day.minutes > 0 ? 1 : 0.2,
                    }}
                    title={`${day.label}: ${day.minutes} minutes`}
                  />
                </div>
                <span className="text-xs font-mono uppercase text-text-tertiary">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LEDGER PRIMITIVE: Folio Traversal & Session Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
        {/* Folio Traversal Breakdown (Ledger) */}
        <section aria-label="Folio Traversal Breakdown" className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <BookOpen size={14} className="text-accent-primary" />
              Folio Traversal Breakdown
            </h2>
            <span className="text-xs font-mono text-text-tertiary">
              {activeRoadmapsCount} Active
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs font-mono text-text-tertiary py-4">Reading telemetry index...</p>
          ) : roadmaps.length === 0 ? (
            <div className="border border-dashed border-border-subtle p-8 text-center text-xs font-mono text-text-tertiary">
              No roadmaps available for telemetry breakdown.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle border-t border-border-subtle">
              {roadmaps.map((roadmap) => {
                const prog = progressMap.get(roadmap.id)
                const pct = roadmap.status === 'completed' ? 100 : prog?.pct_complete || 0
                const completedSessions = prog?.completed_sessions || 0
                const totalSessions = prog?.total_sessions || 0

                return (
                  <div key={roadmap.id} className="py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/learning-os/roadmap/${roadmap.id}`}
                        className="text-sm font-medium text-text-primary hover:text-accent-primary transition-colors"
                      >
                        {roadmap.title}
                      </Link>
                      <span className="text-xs font-mono tabular-nums text-accent-primary">
                        {pct}%
                      </span>
                    </div>

                    {/* Hairline datum indicator */}
                    <div className="h-1 w-full bg-surface overflow-hidden">
                      <div
                        className="h-full bg-accent-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-text-tertiary">
                      <span className="capitalize">{roadmap.status}</span>
                      <span>
                        {completedSessions} / {totalSessions} modules mastered
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Historical Telemetry Log Stream (Ledger) */}
        <section aria-label="Session Telemetry Ledger" className="space-y-6">
          <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center gap-2">
              <Activity size={14} className="text-accent-primary" />
              Recent Telemetry Ledger
            </h2>
            <span className="text-xs font-mono text-text-tertiary">
              {recentLogs.length} Records
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs font-mono text-text-tertiary py-4">Loading session ledger...</p>
          ) : recentLogs.length === 0 ? (
            <div className="border border-dashed border-border-subtle p-8 text-center text-xs font-mono text-text-tertiary">
              No session logs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border-subtle border-t border-border-subtle max-h-[460px] overflow-y-auto pr-2">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono tabular-nums text-accent-primary flex items-center gap-1.5">
                      <Clock size={12} />
                      {log.duration_minutes ? `${log.duration_minutes} mins` : 'Study Session'}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-text-tertiary">
                      {new Date(log.logged_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {log.notes && (
                    <blockquote className="font-serif text-sm italic text-text-secondary line-clamp-2">
                      "{log.notes}"
                    </blockquote>
                  )}

                  {log.metrics && Object.keys(log.metrics).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(log.metrics).map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center rounded border border-border-subtle bg-surface px-2 py-0.5 text-[10px] text-text-tertiary font-mono tabular-nums"
                        >
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
