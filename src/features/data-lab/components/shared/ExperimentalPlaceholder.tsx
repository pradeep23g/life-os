type ExperimentalPlaceholderProps = {
  title: string
  totalDays: number
  daysUntilStable: number
}

function ExperimentalPlaceholder({
  title,
  totalDays,
  daysUntilStable,
}: ExperimentalPlaceholderProps) {
  return (
    <article className="rounded-none border border-[#222222] bg-[#0a0a0a] p-4">
      <div className="border-b border-[#222222] pb-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-100">
          {title}
        </h2>
        <p className="mt-1 text-xs text-amber-500/80">Experimental</p>
      </div>

      <div className="py-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <p className="text-sm font-medium text-slate-300">
            Insufficient Telemetry
          </p>
        </div>

        <p className="text-xs text-slate-500 max-w-md mx-auto">
          This feature requires at least 90 days of behavioral data for statistically meaningful results.
          You currently have {totalDays} day{totalDays !== 1 ? 's' : ''} of data.
        </p>

        {daysUntilStable > 0 ? (
          <div className="mt-4">
            <div className="mx-auto w-48 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500/60 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalDays / 90) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-600 font-mono">
              {daysUntilStable} day{daysUntilStable !== 1 ? 's' : ''} remaining
            </p>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default ExperimentalPlaceholder
