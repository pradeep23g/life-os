import type { CalendarDayCell } from '../../utils/date'
import type { HabitWithStats } from '../../api/useHabits'
import { getMonthLabel, shiftMonth } from '../../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

type CalendarFilters = {
  done: boolean
  break: boolean
  healed: boolean
}

type HabitCalendarModalProps = {
  isOpen: boolean
  onClose: () => void
  selectedHabit: HabitWithStats | null
  calendarCountInput: string
  setCalendarCountInput: (val: string) => void
  onSetCalendarCount: () => void
  isSettingCount: boolean
  setCountError: unknown
  calendarFilters: CalendarFilters
  setCalendarFilters: React.Dispatch<React.SetStateAction<CalendarFilters>>
  calendarMonth: Date
  setCalendarMonth: React.Dispatch<React.SetStateAction<Date>>
  monthCells: CalendarDayCell[]
  calendarHealDates: Set<string>
  calendarBreakDates: Set<string>
  calendarCompletionDates: Set<string>
  logValueByHabitDate: Record<string, number>
}

export function HabitCalendarModal({
  isOpen,
  onClose,
  selectedHabit,
  calendarCountInput,
  setCalendarCountInput,
  onSetCalendarCount,
  isSettingCount,
  setCountError,
  calendarFilters,
  setCalendarFilters,
  calendarMonth,
  setCalendarMonth,
  monthCells,
  calendarHealDates,
  calendarBreakDates,
  calendarCompletionDates,
  logValueByHabitDate,
}: HabitCalendarModalProps) {
  if (!isOpen || !selectedHabit) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
      <section className="h-[92vh] w-[96vw] max-w-6xl overflow-auto rounded-xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">{selectedHabit.title} Calendar</h3>
            <p className="text-xs text-slate-400">Yellow: done • Red: streak break • Blue: healed break</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#333333] px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
          >
            Close
          </button>
        </div>

        {selectedHabit.habit_type === 'target' ? (
          <div className="mt-3 rounded-lg border border-border bg-surface/70 p-3">
            <p className="text-sm text-slate-200">Set today's count (keyboard input)</p>
            <p className="text-xs text-slate-400">This updates only today and does not modify historical entries.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                value={calendarCountInput}
                onChange={(event) => setCalendarCountInput(event.target.value)}
                className="h-9 w-32 rounded-md border border-[#333333] bg-[#111111] px-2 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={onSetCalendarCount}
                disabled={isSettingCount}
                className="h-9 rounded-md border border-[#333333] bg-[#111111] px-3 text-sm text-slate-100 hover:bg-[#222222] disabled:opacity-60"
              >
                {isSettingCount ? 'Saving...' : 'Set'}
              </button>
              <p className="text-xs text-slate-400">
                Current: {selectedHabit.todayValue} / Goal: {selectedHabit.target_value} {selectedHabit.unit ?? 'units'}
              </p>
            </div>
            {setCountError ? (
              <p className="mt-2 text-xs text-red-400">Failed to set count: {getReadableErrorMessage(setCountError)}</p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, done: !previous.done }))}
            className={`rounded-full border px-3 py-1 text-xs ${
              calendarFilters.done
                ? 'border-amber-400/70 bg-amber-400/20 text-amber-100'
                : 'border-[#333333] bg-surface text-slate-300'
            }`}
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, break: !previous.break }))}
            className={`rounded-full border px-3 py-1 text-xs ${
              calendarFilters.break
                ? 'border-red-500/70 bg-red-500/20 text-red-100'
                : 'border-[#333333] bg-surface text-slate-300'
            }`}
          >
            Break
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, healed: !previous.healed }))}
            className={`rounded-full border px-3 py-1 text-xs ${
              calendarFilters.healed
                ? 'border-sky-500/70 bg-sky-500/20 text-sky-100'
                : 'border-[#333333] bg-surface text-slate-300'
            }`}
          >
            Healed
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
            className="rounded-md border border-[#333333] px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
          >
            Previous
          </button>
          <p className="text-base font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
          <button
            type="button"
            onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
            className="rounded-md border border-[#333333] px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
          >
            Next
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
          {weekdayHeaders.map((weekday) => (
            <p key={weekday}>{weekday}</p>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {monthCells.map((day) => {
            const showHeal = calendarFilters.healed && calendarHealDates.has(day.dateKey)
            const showBreak = calendarFilters.break && calendarBreakDates.has(day.dateKey)
            const showDone = calendarFilters.done && calendarCompletionDates.has(day.dateKey)

            let toneClass = 'border-border bg-[#111111] text-slate-300'
            if (showHeal) {
              toneClass = 'border-sky-500/60 bg-sky-500/20 text-sky-100'
            } else if (showBreak) {
              toneClass = 'border-red-500/60 bg-red-500/20 text-red-100'
            } else if (showDone) {
              toneClass = 'border-amber-400/70 bg-amber-300/20 text-amber-100'
            }

            const logValue = logValueByHabitDate[`${selectedHabit.id}:${day.dateKey}`] ?? 0

            return (
              <div
                key={day.dateKey}
                className={`rounded-md border p-2 text-left ${toneClass} ${day.inCurrentMonth ? '' : 'opacity-40'}`}
              >
                <p className="text-sm font-semibold">{day.day}</p>
                {selectedHabit.habit_type === 'target' && logValue > 0 ? (
                  <p className="mt-1 text-[11px]">Count: {logValue}</p>
                ) : null}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
