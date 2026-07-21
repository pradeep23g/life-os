import { useMissionControlSnapshot } from '../api/useMissionControlSnapshot'
import BrainEngineHero from '../../system/components/BrainEngineHero'
import EndOfDayCard from '../components/EndOfDayCard'

function MissionControl() {
  const { isLoading, isError, brain, systems, metrics, recentEvents } = useMissionControlSnapshot()

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-green-500/80" />
        <p className="text-xs font-mono tracking-widest uppercase text-slate-500">Initializing System Snapshot...</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold text-red-400">Failed to load system snapshot.</p>
      </section>
    )
  }

  return (
    <section className="space-y-10 bg-black pb-24">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs tracking-widest text-slate-500 uppercase">Life OS</p>
          <h1 className="text-2xl font-semibold text-slate-100">Mission Control</h1>
        </div>
        <div className="mt-1 font-mono text-xs tracking-widest text-slate-500 uppercase">
          {new Date().toISOString().split('T')[0]} // Snapshot 00:00
        </div>
      </header>

      <BrainEngineHero brain={brain} />

      <div>
        <h3 className="text-xs font-medium text-slate-500 mb-3">Live System Status</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {systems.map((sys) => (
            <div key={sys.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400">{sys.name}</p>
                <span className={`h-1 w-1 rounded-full ${
                  sys.status === 'Healthy'
                    ? 'bg-green-500'
                    : sys.status === 'Needs Input'
                      ? 'bg-blue-500'
                      : sys.status === 'Warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`} />
              </div>
              <p className="mt-1 truncate text-xs text-slate-500">{sys.activity}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-xs font-medium text-slate-500 mb-3">System Metrics</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {metrics.map((stat) => (
              <div key={stat.id} className="flex min-h-[100px] flex-col justify-between rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  {stat.id === 'pending-tasks' && <span className="text-xs text-slate-500">−</span>}
                </div>
                <div>
                  <p className="mb-0.5 text-2xl font-light text-slate-100">{stat.value}</p>
                  {stat.supportingText && (
                    <p className="text-xs text-slate-500">{stat.supportingText}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-slate-500 mb-3">Recent Activity</h3>
          <div className="flex min-h-[100px] items-center justify-center rounded-xl border border-border bg-surface p-6">
            {recentEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No recent activity detected.</p>
            ) : (
              <div className="w-full space-y-3">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-xs last:border-0 last:pb-0">
                    <span className="font-mono text-slate-400">{evt.description}</span>
                    <span className="font-mono text-xs text-slate-600">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-8">
        <div className="mb-6 text-center">
          <h2 className="text-sm font-semibold text-slate-100">End of Day Protocol</h2>
          <p className="mt-1 text-xs text-slate-500">Conclude today and prepare the system for tomorrow.</p>
        </div>
        <EndOfDayCard />
      </div>
    </section>
  )
}

export default MissionControl
