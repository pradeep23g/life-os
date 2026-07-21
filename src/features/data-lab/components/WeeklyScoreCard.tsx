import { useDataLabWeeklyScore } from '../api/useDataLab'

function formatWeekLabel(weekStartDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${weekStartDate}T00:00:00Z`))
}

function WeeklyScoreCard() {
  const { data = [], isLoading, isError, error } = useDataLabWeeklyScore()

  if (isLoading) {
    return (
      <article className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Weekly System Score</h2>
        <p className="mt-3 text-sm text-slate-400">Loading facts...</p>
      </article>
    )
  }

  if (isError) {
    return (
      <article className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Weekly System Score</h2>
        <p className="mt-3 text-sm text-rose-400">
          {error instanceof Error ? error.message : 'Failed to load weekly score.'}
        </p>
      </article>
    )
  }

  const latestWeek = data[0]
  const recentWeeks = data.slice(0, 3)

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">Weekly System Score</h2>
      <p className="mt-1 text-xs text-slate-400">Most recent completed read from the weekly analytics view.</p>

      <div className="mt-4 border border-border bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Current Week</p>
        <p className="mt-2 font-mono text-4xl font-semibold text-slate-100">
          {latestWeek ? latestWeek.weekly_system_score : '--'}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {latestWeek ? `Week of ${formatWeekLabel(latestWeek.week_start_date)}` : 'No weekly facts available.'}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last 3 Weeks</p>
        <ul className="mt-2 space-y-2">
          {recentWeeks.length === 0 ? (
            <li className="text-sm text-slate-400">No weekly history available.</li>
          ) : (
            recentWeeks.map((week) => (
              <li
                key={week.week_start_date}
                className="flex items-center justify-between border border-border bg-black px-3 py-2 text-sm"
              >
                <span className="text-slate-300">Week of {formatWeekLabel(week.week_start_date)}</span>
                <span className="font-mono font-medium text-slate-100">{week.weekly_system_score} pts</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </article>
  )
}

export default WeeklyScoreCard
