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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close habit calendar modal"
      />

      <div className="relative z-10 h-[92vh] w-full max-w-5xl overflow-auto rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl text-text-primary space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h3 className="text-xl font-serif font-normal text-text-primary">{selectedHabit.title} &bull; Horizon</h3>
            <p className="text-xs font-mono text-text-tertiary">
              30-Day Completion &bull; {selectedHabit.habit_type === 'target' ? `Target: ${selectedHabit.target_value} ${selectedHabit.unit ?? ''}` : 'Binary Rhythm'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border-subtle px-2.5 py-1 text-xs font-sans text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            Close
          </button>
        </div>

        {selectedHabit.habit_type === 'target' ? (
          <div className="rounded-sm border border-border-subtle bg-elevated/20 p-3 text-xs font-sans space-y-2">
            <p className="font-medium text-text-primary">Set today&apos;s count (keyboard entry)</p>
            <p className="text-text-tertiary">Directly sets volume for today without altering history.</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="number"
                min={0}
                value={calendarCountInput}
                onChange={(event) => setCalendarCountInput(event.target.value)}
                className="h-8 w-24 rounded-sm border border-border-subtle bg-background px-2 text-xs font-mono tabular-nums text-text-primary focus:outline-none focus:border-border"
              />
              <button
                type="button"
                onClick={onSetCalendarCount}
                disabled={isSettingCount}
                className="h-8 rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 px-3 text-xs font-sans font-medium hover:bg-accent-primary/30 disabled:opacity-50 transition-colors"
              >
                {isSettingCount ? 'Saving...' : 'Set Count'}
              </button>
              <p className="text-text-secondary font-mono tabular-nums text-xs">
                Current: {selectedHabit.todayValue} / Goal: {selectedHabit.target_value} {selectedHabit.unit ?? 'units'}
              </p>
            </div>
            {setCountError ? (
              <p className="text-xs text-threat-critical">Failed to set count: {getReadableErrorMessage(setCountError)}</p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-text-tertiary uppercase tracking-wider mr-1">Filters:</span>
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, done: !previous.done }))}
            className={`rounded-sm border px-2.5 py-1 text-xs font-sans transition-colors ${
              calendarFilters.done
                ? 'border-accent-primary/70 bg-accent-primary/15 text-text-primary font-medium'
                : 'border-border-subtle text-text-secondary hover:border-border'
            }`}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, break: !previous.break }))}
            className={`rounded-sm border px-2.5 py-1 text-xs font-sans transition-colors ${
              calendarFilters.break
                ? 'border-threat-critical/70 bg-threat-critical/15 text-text-primary font-medium'
                : 'border-border-subtle text-text-secondary hover:border-border'
            }`}
          >
            Interrupted (Break)
          </button>
          <button
            type="button"
            onClick={() => setCalendarFilters((previous) => ({ ...previous, healed: !previous.healed }))}
            className={`rounded-sm border px-2.5 py-1 text-xs font-sans transition-colors ${
              calendarFilters.healed
                ? 'border-threat-healthy/70 bg-threat-healthy/15 text-text-primary font-medium'
                : 'border-border-subtle text-text-secondary hover:border-border'
            }`}
          >
            Reconciled (Healed)
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-3">
          <button
            type="button"
            onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
            className="rounded-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            &larr; Previous
          </button>
          <p className="text-sm font-serif font-medium text-text-primary">{getMonthLabel(calendarMonth)}</p>
          <button
            type="button"
            onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
            className="rounded-sm border border-border-subtle px-3 py-1 text-xs font-mono text-text-secondary hover:text-text-primary hover:border-border transition-colors"
          >
            Next &rarr;
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs text-text-tertiary">
          {weekdayHeaders.map((weekday) => (
            <div key={weekday} className="py-1">{weekday}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {monthCells.map((day) => {
            const showHeal = calendarFilters.healed && calendarHealDates.has(day.dateKey)
            const showBreak = calendarFilters.break && calendarBreakDates.has(day.dateKey)
            const showDone = calendarFilters.done && calendarCompletionDates.has(day.dateKey)

            let toneClass = 'border-border-subtle text-text-secondary'
            if (showHeal) {
              toneClass = 'border-threat-healthy/60 bg-threat-healthy/15 text-text-primary'
            } else if (showBreak) {
              toneClass = 'border-threat-critical/60 bg-threat-critical/15 text-text-primary'
            } else if (showDone) {
              toneClass = 'border-accent-primary/60 bg-accent-primary/15 text-text-primary'
            }

            const logValue = logValueByHabitDate[`${selectedHabit.id}:${day.dateKey}`] ?? 0

            return (
              <div
                key={day.dateKey}
                className={`rounded-sm border p-2 h-16 flex flex-col justify-between ${toneClass} ${day.inCurrentMonth ? '' : 'opacity-30'}`}
              >
                <span className="font-mono tabular-nums text-xs font-medium">{day.day}</span>
                {selectedHabit.habit_type === 'target' && logValue > 0 ? (
                  <span className="font-mono tabular-nums text-[10px] text-text-secondary">
                    {logValue} {selectedHabit.unit ?? ''}
                  </span>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

