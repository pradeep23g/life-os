import type { StreakLane } from '../../types/types'
import DataLabSection from '../shared/DataLabSection'

type HabitStreakRiversProps = {
  lanes: StreakLane[]
}

function HabitStreakRivers({ lanes }: HabitStreakRiversProps) {
  if (lanes.length === 0) {
    return (
      <DataLabSection title="Habit Streak Rivers" subtitle="Streak continuity by module">
        <p className="text-sm text-slate-500 py-4">No streak data available.</p>
      </DataLabSection>
    )
  }

  const maxDays = Math.max(...lanes.map((l) => l.totalDays), 1)

  return (
    <DataLabSection title="Habit Streak Rivers" subtitle="Broken streaks are immediately visible. Green = active, red gap = break.">
      <div className="space-y-3">
        {lanes.map((lane) => (
          <div key={lane.moduleName} className="flex items-center gap-3">
            <div className="w-[72px] shrink-0 text-right">
              <span className="text-[10px] font-mono text-slate-400">{lane.moduleName}</span>
            </div>

            <div className="flex-1 flex items-center h-5 bg-[#0d0d0d] overflow-hidden">
              {lane.segments.map((segment, idx) => {
                const widthPercent = (segment.length / maxDays) * 100
                return (
                  <div
                    key={idx}
                    className={`h-full ${
                      segment.active
                        ? 'bg-emerald-600/70'
                        : 'bg-rose-900/40'
                    }`}
                    style={{ width: `${Math.max(widthPercent, 0.5)}%` }}
                    title={`${segment.active ? 'Active' : 'Break'}: ${segment.length} day${segment.length !== 1 ? 's' : ''}`}
                  />
                )
              })}
            </div>

            <div className="w-[56px] shrink-0 text-right">
              <span className="text-[10px] font-mono text-slate-500">
                {lane.currentStreak > 0 ? (
                  <span className="text-emerald-400">{lane.currentStreak}d</span>
                ) : (
                  <span className="text-slate-600">0d</span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 border-t border-[#222222] pt-3 flex gap-4 text-[10px] font-mono text-slate-500">
        <span>
          Longest:{' '}
          <span className="text-slate-300">
            {Math.max(...lanes.map((l) => l.longestStreak))}d
          </span>
        </span>
        <span>
          Active Now:{' '}
          <span className="text-slate-300">
            {lanes.filter((l) => l.currentStreak > 0).length}/{lanes.length}
          </span>
        </span>
      </div>
    </DataLabSection>
  )
}

export default HabitStreakRivers
