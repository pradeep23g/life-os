import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useSystemStatus } from '../api/useSystemStatus'
import { useEveningSync } from '../api/useEveningSync'
import DailyBriefing from './DailyBriefing'
import type { SystemIssue } from '../engine/types'
import { useEventBus } from '../../../store/useEventBus'

function formatTrend(trend: 'rising' | 'falling' | 'stable'): string {
  if (trend === 'rising') {
    return 'Rising'
  }

  if (trend === 'falling') {
    return 'Falling'
  }

  return 'Stable'
}

function getIssueMarkerClass(severity: SystemIssue['severity']): string {
  if (severity === 'critical') {
    return 'bg-rose-500'
  }

  if (severity === 'high') {
    return 'bg-orange-400'
  }

  if (severity === 'medium') {
    return 'bg-yellow-400'
  }

  return 'bg-blue-500'
}

function SystemStatusCard() {
  const navigate = useNavigate()
  const { data, isLoading, isError, error } = useSystemStatus()
  const { mutate: executeEveningSync, isPending: isSyncing } = useEveningSync()
  const pendingEventsCount = useEventBus((state) => state.recentEvents.length)
  const clearEvents = useEventBus((state) => state.clearEvents)
  const [syncToast, setSyncToast] = useState<string | null>(null)

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
              <li key={issue.text} className="flex items-center gap-2">
                <span className={`inline-block h-3 w-3 rounded-full ${getIssueMarkerClass(issue.severity)}`} />
                <span>{issue.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-emerald-900 bg-black p-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <p className="text-sm font-semibold text-slate-100">Next Move</p>
        <p className="mt-1 text-base font-semibold text-white">
          {data.directive.label} - {data.directive.reason}
        </p>
        <button
          type="button"
          onClick={() => navigate(data.directive.route)}
          className="mt-3 inline-flex items-center rounded-md border border-emerald-900 bg-[#0a0a0a] px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/30"
        >
          {data.directive.label} -&gt;
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

      <section className="rounded-lg border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">End of Day Protocol</h3>
        <p className="mt-2 text-sm text-slate-300">{pendingEventsCount} Pending System Events to Sync</p>
        <button
          type="button"
          onClick={() =>
            executeEveningSync(undefined, {
              onSuccess: () => {
                clearEvents()
                setSyncToast('System synced. Memory flushed. Rest well.')
                setTimeout(() => setSyncToast(null), 3200)
              },
            })
          }
          disabled={isSyncing}
          className="mt-3 rounded-md border border-indigo-900 px-3 py-2 text-sm text-indigo-400 hover:bg-indigo-950/30 disabled:opacity-60"
        >
          {isSyncing ? 'Syncing...' : 'Execute Evening Sync'}
        </button>
        {syncToast ? (
          <p className="mt-3 rounded-md border border-emerald-900 bg-black px-3 py-2 text-xs text-emerald-300">{syncToast}</p>
        ) : null}
      </section>
    </section>
  )
}

export default SystemStatusCard
