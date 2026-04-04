import { useSystemStatus } from '../api/useSystemStatus'
import DailyBriefing from './DailyBriefing'
import { useNavigate } from 'react-router-dom'
import type { SystemIssue } from '../engine/types'

function formatTrend(trend: 'rising' | 'falling' | 'stable'): string {
  if (trend === 'rising') {
    return 'Rising'
  }

  if (trend === 'falling') {
    return 'Falling'
  }

  return 'Stable'
}

function getIssueMarker(severity: SystemIssue['severity']): string {
  if (severity === 'critical') {
    return '🔴'
  }

  if (severity === 'high') {
    return '🟠'
  }

  if (severity === 'medium') {
    return '🟡'
  }

  return '🔵'
}

function SystemStatusCard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useSystemStatus()

  if (isLoading) {
    return (
      <section className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 text-slate-300">
        Loading system status...
      </section>
    )
  }

  if (isError || !data) {
    return (
      <section className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <p className="text-sm font-semibold text-red-400">Failed to load system status.</p>
        <p className="mt-1 text-xs text-slate-400">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Brain Engine</h2>
        <p className="mt-1 text-sm text-slate-400">Live system reasoning across tasks, habits, journal, and fitness.</p>
      </header>

      <div className="rounded-lg border border-[#222222] bg-black p-3">
        <p className="text-sm text-slate-300">
          Momentum:{' '}
          <span className="font-semibold text-slate-100">
            {data.momentum.momentum}% ({formatTrend(data.momentum.trend)})
          </span>
        </p>
        {data.snapshotDate ? <p className="mt-1 text-xs text-slate-500">Snapshot date: {data.snapshotDate}</p> : null}
      </div>

      <div className="rounded-lg border border-[#222222] bg-black p-3">
        <p className="text-sm font-semibold text-slate-100">Issues</p>
        {data.issues.length === 0 ? (
          <p className="mt-1 text-sm text-slate-300">No immediate blockers detected.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {data.issues.map((issue) => (
              <li key={issue.text}>
                {getIssueMarker(issue.severity)} {issue.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-[#222222] bg-black p-3">
        <p className="text-sm font-semibold text-slate-100">Next Move</p>
        <p className="mt-1 text-sm text-slate-200">
          {data.directive.label} - {data.directive.reason}
        </p>
        <button
          type="button"
          onClick={() => navigate(data.directive.route)}
          className="mt-3 inline-flex items-center rounded-md border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-900"
        >
          {data.directive.label} →
        </button>
      </div>

      <div className="rounded-lg border border-[#222222] bg-black p-3">
        <p className="text-sm font-semibold text-slate-100">Momentum is low because:</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {data.momentumExplanation.map((reason) => (
            <li key={reason}>- {reason}</li>
          ))}
        </ul>
      </div>

      <DailyBriefing momentum={data.momentum.momentum} />
    </section>
  )
}

export default SystemStatusCard
