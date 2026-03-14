import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  type HabitType,
  useCreateHabit,
  useHabitWorkspace,
  useHealHabitBreak,
  useMarkHabitDone,
  useUpdateHabitBreakReason,
} from '../api/useHabits'
import { buildMonthGrid, formatIndiaDate, formatIndiaDateTime, getMonthLabel, shiftMonth, toIndiaDateKey } from '../utils/date'

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

function HabitsPage() {
  const { data, isLoading, isError } = useHabitWorkspace()
  const { mutate: createHabit, isPending: isCreatingHabit, error: createHabitError } = useCreateHabit()
  const { mutate: markHabitDone, isPending: isMarkingDone, error: markDoneError } = useMarkHabitDone()
  const {
    mutate: updateBreakReason,
    isPending: isUpdatingBreakReason,
    error: updateBreakReasonError,
  } = useUpdateHabitBreakReason()
  const { mutate: healBreak, isPending: isHealingBreak, error: healBreakError } = useHealHabitBreak()

  const [title, setTitle] = useState('')
  const [habitType, setHabitType] = useState<HabitType>('binary')
  const [targetValue, setTargetValue] = useState('1')
  const [unit, setUnit] = useState('')
  const [struggleDrafts, setStruggleDrafts] = useState<Record<string, string>>({})
  const [mistakeReasonDrafts, setMistakeReasonDrafts] = useState<Record<string, string>>({})
  const [healReasonDrafts, setHealReasonDrafts] = useState<Record<string, string>>({})
  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())

  const selectedHabit = useMemo(
    () => data?.habits.find((habit) => habit.id === calendarHabitId) ?? null,
    [data?.habits, calendarHabitId],
  )

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const completionDates = useMemo(() => {
    if (!data || !calendarHabitId) {
      return new Set<string>()
    }

    return new Set(data.logs.filter((log) => log.habit_id === calendarHabitId).map((log) => log.log_date))
  }, [data, calendarHabitId])

  const healedBreakIds = useMemo(() => {
    if (!data) {
      return new Set<string>()
    }

    return new Set(data.heals.map((heal) => heal.break_id))
  }, [data])

  const breakDates = useMemo(() => {
    if (!data || !calendarHabitId) {
      return new Set<string>()
    }

    return new Set(
      data.breaks
        .filter(
          (streakBreak) =>
            streakBreak.habit_id === calendarHabitId && !streakBreak.healed_at && !healedBreakIds.has(streakBreak.id),
        )
        .map((streakBreak) => streakBreak.break_date),
    )
  }, [calendarHabitId, data, healedBreakIds])

  const healDates = useMemo(() => {
    if (!data || !calendarHabitId) {
      return new Set<string>()
    }

    return new Set(data.heals.filter((heal) => heal.habit_id === calendarHabitId).map((heal) => toIndiaDateKey(heal.created_at)))
  }, [calendarHabitId, data])

  const handleCreateHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedTarget = Number.parseInt(targetValue, 10)

    createHabit(
      {
        title,
        habitType,
        targetValue: Number.isNaN(parsedTarget) ? 1 : parsedTarget,
        unit,
      },
      {
        onSuccess: () => {
          setTitle('')
          setHabitType('binary')
          setTargetValue('1')
          setUnit('')
        },
      },
    )
  }

  if (isLoading) {
    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">Loading habits...</section>
  }

  if (isError || !data) {
    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">Failed to load habits.</section>
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Create Habit</h2>

        <form onSubmit={handleCreateHabit} className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <label className="text-sm text-slate-300 lg:col-span-2">
            Habit title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Read 20 pages"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="text-sm text-slate-300">
            Habit type
            <select
              value={habitType}
              onChange={(event) => setHabitType(event.target.value as HabitType)}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
            >
              <option value="binary">Binary (done / not done)</option>
              <option value="target">Target-based</option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isCreatingHabit || title.trim().length === 0}
              className="w-full rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-100 hover:bg-slate-800 disabled:opacity-60"
            >
              {isCreatingHabit ? 'Creating...' : 'Create Habit'}
            </button>
          </div>

          {habitType === 'target' ? (
            <>
              <label className="text-sm text-slate-300">
                Target value
                <input
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="text-sm text-slate-300">
                Unit (optional)
                <input
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="pages"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                />
              </label>
            </>
          ) : null}
        </form>

        {createHabitError ? (
          <p className="mt-3 text-sm text-red-400">Failed to create habit: {getReadableErrorMessage(createHabitError)}</p>
        ) : null}
      </article>

      {data.habits.length === 0 ? (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">No habits yet. Create one above.</section>
      ) : (
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {data.habits.map((habit) => (
            <article key={habit.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-100">{habit.title}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {habit.habit_type === 'target'
                      ? `Target: ${habit.target_value} ${habit.unit ?? 'units'}`
                      : 'Type: Binary done/not done'}
                  </p>
                </div>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                  {habit.completedToday ? 'Done Today' : 'Pending Today'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
                <div className="rounded-md border border-slate-700 bg-slate-800 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Current</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{habit.currentStreak}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-800 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Longest</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{habit.longestStreak}</p>
                </div>
                <div className="rounded-md border border-slate-700 bg-slate-800 p-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Days Done</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{habit.totalCompletions}</p>
                </div>
              </div>

              <label className="mt-3 block text-sm text-slate-300">
                Struggle note (optional)
                <textarea
                  value={struggleDrafts[habit.id] ?? ''}
                  onChange={(event) =>
                    setStruggleDrafts((previous) => ({
                      ...previous,
                      [habit.id]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="What made this hard today?"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                />
              </label>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    markHabitDone(
                      {
                        habitId: habit.id,
                        habitType: habit.habit_type,
                        targetValue: habit.target_value,
                        struggleNote: struggleDrafts[habit.id] ?? '',
                      },
                      {
                        onSuccess: () => {
                          setStruggleDrafts((previous) => ({
                            ...previous,
                            [habit.id]: '',
                          }))
                        },
                      },
                    )
                  }
                  disabled={isMarkingDone}
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                >
                  {isMarkingDone ? 'Saving...' : 'Mark Done'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalendarHabitId(habit.id)
                    setCalendarMonth(new Date())
                  }}
                  className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Calendar
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {markDoneError ? (
        <p className="text-sm text-red-400">Failed to mark habit done: {getReadableErrorMessage(markDoneError)}</p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Mistakes (Streak Losses)</h2>
          <p className="mt-1 text-xs text-slate-400">Add a reason for each break and optionally heal selected breaks.</p>

          {data.mistakes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No streak losses recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.mistakes.map((mistake) => (
                <li key={mistake.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{mistake.habitTitle}</p>
                      <p className="text-xs text-slate-400">Broken on {formatIndiaDate(mistake.break_date)}</p>
                    </div>
                    <span
                      className={`rounded-md border px-2 py-1 text-[11px] ${
                        mistake.isHealed
                          ? 'border-sky-600 bg-sky-500/10 text-sky-300'
                          : 'border-red-700 bg-red-500/10 text-red-300'
                      }`}
                    >
                      {mistake.isHealed ? 'Healed' : 'Open Break'}
                    </span>
                  </div>

                  <label className="mt-3 block text-xs text-slate-300">
                    Break reason
                    <textarea
                      value={mistakeReasonDrafts[mistake.id] ?? mistake.reason ?? ''}
                      onChange={(event) =>
                        setMistakeReasonDrafts((previous) => ({
                          ...previous,
                          [mistake.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                  </label>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateBreakReason({
                          breakId: mistake.id,
                          reason: mistakeReasonDrafts[mistake.id] ?? mistake.reason ?? '',
                        })
                      }
                      disabled={isUpdatingBreakReason}
                      className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                    >
                      Save Reason
                    </button>
                  </div>

                  <label className="mt-3 block text-xs text-slate-300">
                    Heal reason
                    <input
                      value={healReasonDrafts[mistake.id] ?? ''}
                      onChange={(event) =>
                        setHealReasonDrafts((previous) => ({
                          ...previous,
                          [mistake.id]: event.target.value,
                        }))
                      }
                      placeholder="Why use a streak heal here?"
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      healBreak(
                        {
                          breakId: mistake.id,
                          habitId: mistake.habit_id,
                          reason: healReasonDrafts[mistake.id] ?? '',
                        },
                        {
                          onSuccess: () => {
                            setHealReasonDrafts((previous) => ({
                              ...previous,
                              [mistake.id]: '',
                            }))
                          },
                        },
                      )
                    }
                    disabled={mistake.isHealed || data.healTokensRemaining <= 0 || isHealingBreak}
                    className="mt-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                  >
                    {isHealingBreak ? 'Healing...' : 'Streak Heal'}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {updateBreakReasonError ? (
            <p className="mt-3 text-sm text-red-400">Failed to save reason: {getReadableErrorMessage(updateBreakReasonError)}</p>
          ) : null}

          {healBreakError ? (
            <p className="mt-3 text-sm text-red-400">Failed to heal streak: {getReadableErrorMessage(healBreakError)}</p>
          ) : null}
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Streak Heal Tokens</h2>
          <p className="mt-2 text-sm text-slate-300">
            Remaining this month: <span className="font-semibold text-slate-100">{data.healTokensRemaining} / 5</span>
          </p>
          <p className="text-xs text-slate-400">Used this month: {data.healsUsedThisMonth}</p>

          <h3 className="mt-4 text-sm font-semibold text-slate-200">Recent Heals</h3>
          {data.healHistory.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No streak heals used yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.healHistory.slice(0, 8).map((heal) => (
                <li key={heal.id} className="rounded-md border border-slate-700 bg-slate-800 p-2">
                  <p className="text-sm text-slate-100">{heal.habitTitle}</p>
                  <p className="text-xs text-slate-400">Healed on {formatIndiaDateTime(heal.created_at)}</p>
                  {heal.breakDate ? <p className="text-xs text-slate-400">Recovered break: {formatIndiaDate(heal.breakDate)}</p> : null}
                  <p className="mt-1 text-xs text-slate-300">Reason: {heal.reason || 'No reason added.'}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {calendarHabitId && selectedHabit ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
          <section className="w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{selectedHabit.title} Calendar</h3>
                <p className="text-xs text-slate-400">Yellow: completion • Red: streak break • Blue: streak heal</p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarHabitId(null)}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
              >
                Previous
              </button>
              <p className="text-sm font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
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
                const tone = healDates.has(day.dateKey)
                  ? 'heal'
                  : breakDates.has(day.dateKey)
                    ? 'break'
                    : completionDates.has(day.dateKey)
                      ? 'done'
                      : 'none'

                const toneClass =
                  tone === 'heal'
                    ? 'border-sky-500/60 bg-sky-500/20 text-sky-100'
                    : tone === 'break'
                      ? 'border-red-500/60 bg-red-500/20 text-red-100'
                      : tone === 'done'
                        ? 'border-amber-400/70 bg-amber-300/20 text-amber-100'
                        : 'border-slate-700 bg-slate-800 text-slate-300'

                return (
                  <div
                    key={day.dateKey}
                    className={`rounded-md border p-2 text-center ${toneClass} ${day.inCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    <p className="text-sm font-semibold">{day.day}</p>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default HabitsPage
