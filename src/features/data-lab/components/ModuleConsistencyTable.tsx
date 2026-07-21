import { useMemo } from 'react'

import { useDataLabModuleConsistency } from '../api/useDataLab'

function formatDate(value: string | null) {
  if (!value) {
    return 'Never'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00Z`))
}

function ModuleConsistencyTable() {
  const { data = [], isLoading, isError, error } = useDataLabModuleConsistency()

  const sortedRows = useMemo(
    () => [...data].sort((left, right) => left.consistency_percent - right.consistency_percent),
    [data],
  )

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Module Consistency</h2>
      <p className="mt-1 text-xs text-slate-400">Lowest consistency surfaces first.</p>

      {isLoading ? <p className="mt-4 text-sm text-slate-400">Loading facts...</p> : null}
      {isError ? (
        <p className="mt-4 text-sm text-rose-400">
          {error instanceof Error ? error.message : 'Failed to load module consistency.'}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="font-mono uppercase tracking-wide text-slate-500">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Module</th>
                <th className="px-3 py-2 font-medium">Active Days</th>
                <th className="px-3 py-2 font-medium">Consistency %</th>
                <th className="px-3 py-2 font-medium">Last Active Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-slate-400">
                    No module consistency facts available.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => (
                  <tr key={row.module_name} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-3 text-slate-100">{row.module_name}</td>
                    <td className="px-3 py-3 font-mono text-slate-300">
                      {row.active_days} / {row.days_observed}
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-100">{row.consistency_percent}%</td>
                    <td className="px-3 py-3 text-slate-300">{formatDate(row.last_active_date)}</td>
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

export default ModuleConsistencyTable
