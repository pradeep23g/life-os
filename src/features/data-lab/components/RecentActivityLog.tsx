import { useMemo } from 'react'

import { useDataLabDailyActivity } from '../api/useDataLab'

function formatDay(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00Z`))
}

function RecentActivityLog() {
  const { data = [], isLoading, isError, error } = useDataLabDailyActivity()

  const rows = useMemo(() => data.slice(0, 14), [data])

  return (
    <article className="rounded-none border border-[#222222] bg-[#0a0a0a] p-4">
      <div className="border-b border-[#222222] pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Recent Activity Log</h2>
        <p className="mt-1 text-xs text-slate-400">Last 14 days from the daily activity view.</p>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-slate-400">Loading facts...</p> : null}
      {isError ? (
        <p className="mt-4 text-sm text-rose-400">
          {error instanceof Error ? error.message : 'Failed to load daily activity.'}
        </p>
      ) : null}

      {!isLoading && !isError ? (
        <div className="mt-4 space-y-2 font-mono text-xs">
          {rows.length === 0 ? (
            <p className="text-slate-400">No daily activity rows available.</p>
          ) : (
            rows.map((row) => (
              <div
                key={row.activity_date}
                className="grid grid-cols-1 gap-2 border border-[#222222] bg-black px-3 py-2 text-slate-300 md:grid-cols-[72px_minmax(0,1fr)]"
              >
                <div className="text-slate-100">{formatDay(row.activity_date)}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    systems={row.active_system_count}/6
                  </span>
                  <span>
                    deep_work={row.deep_work_minutes}m
                  </span>
                  <span>
                    habits={row.habits_completed}
                  </span>
                  <span>
                    tasks={row.tasks_completed}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </article>
  )
}

export default RecentActivityLog
