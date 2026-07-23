import { useState } from 'react'
import { Check } from 'lucide-react'

import type { CalendarCell } from '../../types/types'
import { formatDateShort } from '../../utils/format'
import DataLabSection from '../shared/DataLabSection'

type ContributionCalendarProps = {
  cells: CalendarCell[]
}

const INTENSITY_COLORS = [
  'bg-[#161616]',
  'bg-emerald-900/50',
  'bg-emerald-800/60',
  'bg-emerald-600/70',
  'bg-emerald-500',
]

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

function ContributionCalendar({ cells }: ContributionCalendarProps) {
  const [hoveredCell, setHoveredCell] = useState<CalendarCell | null>(null)

  if (cells.length === 0) {
    return (
      <DataLabSection title="Life Activity Calendar" subtitle="Global contribution overview">
        <p className="text-sm text-slate-500 py-4">No activity data available.</p>
      </DataLabSection>
    )
  }

  // Group cells into weeks (columns) — first day is Monday
  const weeks: CalendarCell[][] = []
  let currentWeek: CalendarCell[] = []

  const firstDate = new Date(`${cells[0].date}T00:00:00Z`)
  const firstDayOfWeek = firstDate.getUTCDay()
  const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // Pad the first week
  for (let i = 0; i < mondayOffset; i++) {
    currentWeek.push({
      date: '',
      intensity: -1,
      activeSystemCount: 0,
      systems: { habits: false, journal: false, tasks: false, deepWork: false, workout: false, finance: false },
    })
  }

  for (const cell of cells) {
    currentWeek.push(cell)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  return (
    <DataLabSection title="Life Activity Calendar" subtitle="Each cell = 1 day. Intensity = active systems (0–6).">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {/* Day labels column */}
        <div className="flex flex-col gap-[3px] pr-1">
          {DAY_LABELS.map((label, idx) => (
            <div key={idx} className="h-[13px] text-[9px] leading-[13px] text-slate-600 font-mono w-6 text-right">
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-[3px]">
            {week.map((cell, dayIdx) => (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={`h-[13px] w-[13px] ${
                  cell.intensity < 0
                    ? 'bg-transparent'
                    : INTENSITY_COLORS[cell.intensity] ?? INTENSITY_COLORS[0]
                } transition-colors cursor-default`}
                onMouseEnter={() => cell.date ? setHoveredCell(cell) : undefined}
                onMouseLeave={() => setHoveredCell(null)}
                title={cell.date ? `${formatDateShort(cell.date)}: ${cell.activeSystemCount}/6 systems` : ''}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
        <span>Less</span>
        {INTENSITY_COLORS.map((color, idx) => (
          <div key={idx} className={`h-[10px] w-[10px] ${color}`} />
        ))}
        <span>More</span>
      </div>

      {/* Hover detail */}
      {hoveredCell ? (
        <div className="mt-3 border-t border-border pt-3 text-xs font-mono text-slate-400">
          <span className="text-slate-200">{formatDateShort(hoveredCell.date)}</span>
          <span className="ml-2">{hoveredCell.activeSystemCount}/6 systems</span>
          <div className="mt-1 flex gap-3 text-[10px]">
            {hoveredCell.systems.habits ? <span className="text-emerald-400">Habits <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Habits</span>}
            {hoveredCell.systems.journal ? <span className="text-emerald-400">Journal <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Journal</span>}
            {hoveredCell.systems.tasks ? <span className="text-emerald-400">Tasks <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Tasks</span>}
            {hoveredCell.systems.deepWork ? <span className="text-emerald-400">Deep Work <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Deep Work</span>}
            {hoveredCell.systems.workout ? <span className="text-emerald-400">Workout <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Workout</span>}
            {hoveredCell.systems.finance ? <span className="text-emerald-400">Finance <Check className="inline h-3 w-3" /></span> : <span className="text-slate-600">Finance</span>}
          </div>
        </div>
      ) : null}
    </DataLabSection>
  )
}

export default ContributionCalendar
