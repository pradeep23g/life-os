import type { TelemetryHealthMetrics } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type TelemetryHealthCardProps = {
  metrics: TelemetryHealthMetrics
}

function getHealthColor(score: number): string {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-rose-400'
}

function getStatusDot(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-rose-500'
}

function TelemetryHealthCard({ metrics }: TelemetryHealthCardProps) {
  return (
    <DataLabSection title="Telemetry Health" subtitle="Event coverage and system instrumentation diagnostics">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="border border-border bg-black p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">Coverage</p>
          <p className={`mt-1 text-2xl font-mono font-bold ${getHealthColor(metrics.coveragePercent)}`}>
            {metrics.coveragePercent}%
          </p>
          <p className="text-[9px] text-slate-600 font-mono mt-1">
            {metrics.totalActive}/{metrics.totalExpected} events
          </p>
        </div>

        <div className="border border-border bg-black p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">Health Score</p>
          <div className="mt-1 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStatusDot(metrics.healthScore)}`} />
            <span className={`text-2xl font-mono font-bold ${getHealthColor(metrics.healthScore)}`}>
              {metrics.healthScore}
            </span>
          </div>
        </div>

        <div className="border border-border bg-black p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">Silent Events</p>
          <p className={`mt-1 text-2xl font-mono font-bold ${
            metrics.silentEvents.length > 10 ? 'text-rose-400' : 'text-slate-300'
          }`}>
            {metrics.silentEvents.length}
          </p>
        </div>

        <div className="border border-border bg-black p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">Inactive</p>
          <p className={`mt-1 text-2xl font-mono font-bold ${
            metrics.inactiveModules.length > 0 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {metrics.inactiveModules.length}
          </p>
          <p className="text-[9px] text-slate-600 font-mono mt-1">modules</p>
        </div>
      </div>

      {/* Inactive modules list */}
      {metrics.inactiveModules.length > 0 ? (
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">Inactive Modules</p>
          <div className="flex flex-wrap gap-2">
            {metrics.inactiveModules.map((mod) => (
              <span key={mod} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333333] text-[10px] font-mono text-amber-400">
                {mod}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Silent events sample */}
      {metrics.silentEvents.length > 0 ? (
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">
            Silent Events (first 10)
          </p>
          <div className="space-y-1">
            {metrics.silentEvents.slice(0, 10).map((event) => (
              <p key={event} className="text-[10px] font-mono text-slate-600">
                {event}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </DataLabSection>
  )
}

export default TelemetryHealthCard
