import { useMemo } from 'react'

import { useDataLabEventCoverage } from '../api/useDataLab'

function formatDate(value: string | null) {
  if (!value) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00Z`))
}

function EventCoverageTable() {
  const { data = [], isLoading, isError, error } = useDataLabEventCoverage()

  const rows = useMemo(
    () =>
      [...data].sort((left, right) => {
        const domainComparison = left.domain.localeCompare(right.domain)
        if (domainComparison !== 0) {
          return domainComparison
        }

        return right.event_count - left.event_count
      }),
    [data],
  )

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Event Coverage</h2>
        <p className="mt-1 text-xs text-slate-400">Telemetry Health Diagnostics (30d)</p>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-400">Loading facts...</p> : null}
      {isError ? (
        <p className="mt-4 text-sm text-rose-400">
          {error instanceof Error ? error.message : 'Failed to load telemetry diagnostics.'}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="font-mono uppercase tracking-wide text-slate-500">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium">Event Type</th>
                <th className="px-3 py-2 font-medium">Total Events</th>
                <th className="px-3 py-2 font-medium">Active Days</th>
                <th className="px-3 py-2 font-medium">Last Seen</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-slate-400">
                    No event coverage rows available.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={`${row.domain}:${row.event_type}`} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-3 text-slate-300">{row.domain}</td>
                    <td className="px-3 py-3 text-slate-100">{row.event_type}</td>
                    <td className="px-3 py-3 text-slate-100">{row.event_count}</td>
                    <td className="px-3 py-3 text-slate-300">{row.active_days}</td>
                    <td className="px-3 py-3 text-slate-300">{formatDate(row.last_seen_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </article>
  )
}

export default EventCoverageTable
