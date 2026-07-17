import type { TimelineDayRow } from '../../types/types'
import { formatDateShort, formatDayOfWeekShort } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type BehaviorTimelineProps = {
  rows: TimelineDayRow[]
}

const COLUMNS = [
  { key: 'workout' as const, label: 'WKT' },
  { key: 'journal' as const, label: 'JRN' },
  { key: 'habits' as const, label: 'HAB' },
  { key: 'tasks' as const, label: 'TSK' },
  { key: 'deepWork' as const, label: 'DW' },
]

function BehaviorTimeline({ rows }: BehaviorTimelineProps) {
  if (rows.length === 0) {
    return (
      <DataLabSection title="Behavioral Timeline" subtitle="Chronological activity overview">
        <p className="text-sm text-slate-500 py-4">No timeline data available.</p>
      </DataLabSection>
    )
  }

  return (
    <DataLabSection title="Behavioral Timeline" subtitle="Gaps surface immediately. Each row = 1 day.">
      <div className="overflow-x-auto">
        {/* Column headers */}
        <div className="flex items-center gap-0 mb-1 pl-[88px]">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="w-10 text-center text-[9px] font-mono uppercase tracking-wider text-slate-600"
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* Day rows */}
        <div className="space-y-[2px]">
          {rows.slice(0, 30).map((row) => {
            const allActive = COLUMNS.every((col) => row[col.key])
            const noneActive = COLUMNS.every((col) => !row[col.key])

            return (
              <div
                key={row.date}
                className={`flex items-center gap-0 py-[3px] ${
                  noneActive ? 'opacity-40' : ''
                }`}
              >
                <div className="w-[48px] text-[10px] font-mono text-slate-500 shrink-0">
                  {formatDayOfWeekShort(row.date)}
                </div>
                <div className="w-[40px] text-[10px] font-mono text-slate-400 shrink-0">
                  {formatDateShort(row.date)}
                </div>

                {COLUMNS.map((col) => (
                  <div key={col.key} className="w-10 flex justify-center">
                    <div
                      className={`h-3 w-3 ${
                        row[col.key]
                          ? 'bg-emerald-500'
                          : 'bg-[#1a1a1a]'
                      }`}
                      title={`${col.label}: ${row[col.key] ? 'Active' : 'Inactive'}`}
                    />
                  </div>
                ))}

                {allActive ? (
                  <span className="ml-2 text-[9px] font-mono text-emerald-600">FULL</span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </DataLabSection>
  )
}

export default BehaviorTimeline
