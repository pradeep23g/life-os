import { useMemo } from 'react'

import { useTimeAnalytics } from '../api/useTimeAnalytics'

function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} hrs ${minutes} mins`
}

function TimeInsights() {
  const { data, isLoading, isError, error } = useTimeAnalytics()

  const maxTrendMinutes = useMemo(() => {
    if (!data) {
      return 1
    }

    const maxValue = Math.max(...data.sevenDayTrend.map((item) => item.minutes), 1)
    return maxValue
  }, [data])

  return (
    <section className="grid gap-4 rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 lg:grid-cols-3">
      <article className="rounded-lg border border-[#222222] bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Today's Total</p>
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading insights...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">{error instanceof Error ? error.message : 'Failed to load insights.'}</p> : null}
        {!isLoading && !isError ? <p className="mt-3 text-3xl font-semibold text-slate-100">{formatMinutes(data?.todayTotalMinutes ?? 0)}</p> : null}
      </article>

      <article className="rounded-lg border border-[#222222] bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Distribution</p>
        <div className="mt-3 h-4 overflow-hidden rounded-full border border-[#222222] bg-[#0a0a0a]">
          <div className="flex h-full w-full">
            {(data?.todayDistribution ?? []).map((segment) => (
              <div
                key={segment.bucket}
                className={segment.colorClass}
                style={{ width: `${segment.percentage}%` }}
                title={`${segment.bucket}: ${segment.minutes} mins`}
              />
            ))}
          </div>
        </div>
        <ul className="mt-3 space-y-1">
          {(data?.todayDistribution ?? []).map((item) => (
            <li key={item.bucket} className="flex items-center justify-between text-xs text-slate-300">
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${item.colorClass}`} />
                {item.bucket}
              </span>
              <span>{item.minutes} mins</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-lg border border-[#222222] bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">7-Day Trend</p>
        <div className="mt-3 flex h-24 items-end gap-2">
          {(data?.sevenDayTrend ?? []).map((day) => {
            const height = Math.max(6, Math.round((day.minutes / maxTrendMinutes) * 100))

            return (
              <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-slate-700"
                  style={{ height: `${height}%` }}
                  title={`${day.label}: ${day.minutes} mins`}
                />
                <span className="text-[10px] text-slate-400">{day.label}</span>
              </div>
            )
          })}
        </div>
      </article>
    </section>
  )
}

export default TimeInsights
