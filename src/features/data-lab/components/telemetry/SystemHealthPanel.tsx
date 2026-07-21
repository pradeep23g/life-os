import type { SystemHealthEntry } from '../../types/types'
import { formatDateShort } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type SystemHealthPanelProps = {
  entries: SystemHealthEntry[]
}

const STATUS_CONFIG: Record<SystemHealthEntry['status'], { dot: string; label: string; text: string }> = {
  healthy: { dot: 'bg-emerald-500', label: 'Healthy', text: 'text-emerald-400' },
  warning: { dot: 'bg-amber-500', label: 'Warning', text: 'text-amber-400' },
  critical: { dot: 'bg-rose-500', label: 'Critical', text: 'text-rose-400' },
  inactive: { dot: 'bg-slate-700', label: 'Inactive', text: 'text-slate-500' },
}

function SystemHealthPanel({ entries }: SystemHealthPanelProps) {
  if (entries.length === 0) {
    return (
      <DataLabSection title="System Health Monitor" subtitle="Infrastructure status">
        <p className="text-sm text-slate-500 py-4">No module data available.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="System Health Monitor" subtitle="Each Life OS module as a monitored service">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => {
          const config = STATUS_CONFIG[entry.status]

          return (
            <div
              key={entry.moduleName}
              className="border border-border bg-black p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-200">{entry.moduleName}</span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                  <span className={`text-[9px] uppercase tracking-wider font-mono ${config.text}`}>
                    {config.label}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-[10px] font-mono text-slate-500">
                <div className="flex justify-between">
                  <span>Consistency</span>
                  <span className="text-slate-300">{entry.consistencyPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Events (30d)</span>
                  <span className="text-slate-300">{entry.eventCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Activity</span>
                  <span className="text-slate-300">
                    {entry.lastActivity ? formatDateShort(entry.lastActivity) : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </DataLabSection>
  )
}

export default SystemHealthPanel
