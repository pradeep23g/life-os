import { useMissionControlSnapshot } from '../api/useMissionControlSnapshot'
import BrainEngineHero from '../../system/components/BrainEngineHero'
import EndOfDayCard from '../components/EndOfDayCard'

function MissionControl() {
  const { isLoading, isError, brain, systems, metrics, recentEvents } = useMissionControlSnapshot()

  if (isLoading) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-emerald-500/80" />
        <p className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Initializing System Snapshot...</p>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <p className="text-sm font-semibold text-red-400">Failed to load system snapshot.</p>
      </section>
    )
  }

  return (
    <section className="space-y-10 bg-[#000000] pb-24">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Life OS</p>
          <h1 className="text-2xl font-semibold text-slate-100">Mission Control</h1>
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">
          {new Date().toISOString().split('T')[0]} // Snapshot 00:00
        </div>
      </header>

      <BrainEngineHero brain={brain} />

      <div>
        <h3 className="text-xs font-medium text-slate-500 mb-3">Live System Status</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {systems.map((sys) => (
            <div key={sys.id} className="rounded-lg border border-[#1a1a1a] bg-black p-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[11px] font-medium text-slate-400">{sys.name}</p>
                <span className={`w-1 h-1 rounded-full ${
                  sys.status === 'Healthy'
                    ? 'bg-emerald-500'
                    : sys.status === 'Needs Input'
                      ? 'bg-blue-500'
                      : sys.status === 'Warning'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                }`} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 truncate">{sys.activity}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-xs font-medium text-slate-500 mb-3">System Metrics</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {metrics.map((stat) => (
              <div key={stat.id} className="min-h-[100px] rounded-xl border border-[#1a1a1a] bg-black p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  {stat.id === 'pending-tasks' && <span className="text-slate-500 text-xs">−</span>}
                </div>
                <div>
                  <p className="text-2xl font-light text-slate-100 mb-0.5">{stat.value}</p>
                  {stat.supportingText && (
                    <p className="text-[10px] text-slate-500">{stat.supportingText}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-slate-500 mb-3">Recent Activity</h3>
          <div className="rounded-xl border border-[#1a1a1a] bg-black p-6 flex items-center justify-center min-h-[100px]">
            {recentEvents.length === 0 ? (
              <p className="text-xs text-slate-500">No recent activity detected.</p>
            ) : (
              <div className="w-full space-y-3">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="flex justify-between items-center gap-3 text-xs border-b border-[#111111] pb-2 last:border-0 last:pb-0">
                    <span className="text-slate-400 font-mono">{evt.description}</span>
                    <span className="text-slate-600 font-mono text-[10px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-[#111111]">
        <div className="text-center mb-6">
          <h2 className="text-sm font-semibold text-slate-100">End of Day Protocol</h2>
          <p className="text-xs text-slate-500 mt-1">Conclude today and prepare the system for tomorrow.</p>
        </div>
        <EndOfDayCard />
      </div>
    </section>
  )
}

export default MissionControl
