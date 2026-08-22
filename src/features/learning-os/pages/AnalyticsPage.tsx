import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  BookOpen,
  TrendingUp,
  BarChart3,
  Calendar,
  Activity,
  Award,
} from 'lucide-react'
import { useRoadmaps, useRecentSessionLogs, useSessionAnalytics, useRoadmapProgress } from '../api/useLearningOS'

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

  // 7-Day Session Distribution
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
    <div className="space-y-6 pb-28 sm:pb-24">
      {/* Back Navigation */}
      <Link
        to="/learning-os"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Learning OS
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <BarChart3 className="h-6 w-6 text-purple-400" />
              Learning Telemetry & Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time progress breakdown, study duration telemetry, and stage completion metrics.
            </p>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Study Time
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-900/40 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{totalHours}h</span>
            <span className="text-xs text-slate-500">({totalMinutes} mins)</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Sessions Logged
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-900/40 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{analyticsLogs.length}</span>
            <span className="text-xs text-slate-500">recorded</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Session Length
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900/40 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{avgSessionDuration}m</span>
            <span className="text-xs text-slate-500">per session</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg Completion
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-900/40 text-amber-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100">{avgCompletionPct}%</span>
            <span className="text-xs text-slate-500">across {roadmaps.length} roadmaps</span>
          </div>
        </div>
      </div>

      {/* 7-Day Session Distribution Chart */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-400" />
              7-Day Study Time Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily study minutes recorded over the last 7 days.
            </p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 h-44 pt-4 px-2 border-b border-border/60 pb-2">
          {last7DaysData.map((day) => (
            <div key={day.dateStr} className="flex flex-1 flex-col items-center gap-2 h-full justify-end">
              <span className="text-[11px] font-semibold text-slate-400">
                {day.minutes > 0 ? `${day.minutes}m` : '-'}
              </span>
              <div className="w-full max-w-[42px] bg-[#141414] rounded-t-lg overflow-hidden flex items-end h-32 border border-border/40">
                <div
                  className="w-full bg-purple-600/80 hover:bg-purple-500 transition-all rounded-t-sm"
                  style={{ height: `${Math.max(day.heightPct, day.minutes > 0 ? 8 : 2)}%` }}
                  title={`${day.label}: ${day.minutes} minutes`}
                />
              </div>
              <span className="text-xs font-medium text-slate-400 mt-1">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Roadmap Breakdown & Recent Session Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Roadmap Progress Breakdown Table */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Roadmap Progress Breakdown
            </h2>
            <span className="text-xs text-slate-400">{activeRoadmapsCount} active</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400 py-4">Loading telemetry data...</p>
          ) : roadmaps.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-slate-500">
              No roadmaps available for telemetry breakdown.
            </div>
          ) : (
            <div className="space-y-3">
              {roadmaps.map((roadmap) => {
                const prog = progressMap.get(roadmap.id)
                const pct = roadmap.status === 'completed' ? 100 : prog?.pct_complete || 0
                const completedSessions = prog?.completed_sessions || 0
                const totalSessions = prog?.total_sessions || 0

                return (
                  <div
                    key={roadmap.id}
                    className="rounded-lg border border-border/60 bg-[#111111] p-4 transition-colors hover:border-border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        to={`/learning-os/roadmap/${roadmap.id}`}
                        className="text-sm font-semibold text-slate-200 hover:text-purple-400 transition-colors"
                      >
                        {roadmap.title}
                      </Link>
                      <span className="text-xs font-semibold text-purple-400">{pct}%</span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: roadmap.color || '#8b5cf6',
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Status: <span className="capitalize text-slate-400">{roadmap.status}</span>
                      </span>
                      <span>
                        {completedSessions} / {totalSessions} sessions completed
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Telemetry Log Stream */}
        <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Recent Telemetry Logs
            </h2>
            <span className="text-xs text-slate-400">{recentLogs.length} logs</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-400 py-4">Loading session telemetry...</p>
          ) : recentLogs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-slate-500">
              No session logs recorded yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border/60 bg-[#111111] p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                      <Clock size={12} />
                      {log.duration_minutes ? `${log.duration_minutes} mins` : 'Session'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.logged_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-slate-300 italic line-clamp-2">
                      "{log.notes}"
                    </p>
                  )}

                  {log.metrics && Object.keys(log.metrics).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(log.metrics).map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center rounded bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 text-[10px] text-purple-300 font-mono"
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
        </div>
      </div>
    </div>
  )
}
