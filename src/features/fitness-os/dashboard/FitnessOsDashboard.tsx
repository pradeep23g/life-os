import { useMemo, useState } from 'react'

import { type FitnessDayInsight, type Workout, useFitnessDashboard } from '../api/useFitness'
import { buildMonthGrid, formatIndiaDate, formatIndiaDateTime, getMonthLabel, shiftMonth } from '../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const heatmapWeekdayLabels = new Set(['Sun', 'Tue', 'Thu', 'Sat'])

function getHeatmapLevelClass(minutes: number, maxMinutes: number) {
  if (minutes <= 0 || maxMinutes <= 0) {
    return 'border-slate-700 bg-slate-900'
  }

  const ratio = minutes / maxMinutes
  if (ratio >= 0.75) {
    return 'border-emerald-400/70 bg-emerald-400/50'
  }

  if (ratio >= 0.5) {
    return 'border-emerald-500/60 bg-emerald-500/35'
  }

  if (ratio >= 0.25) {
    return 'border-emerald-700/60 bg-emerald-700/30'
  }

  return 'border-emerald-900/70 bg-emerald-950/40'
}

function getCalendarDayTone(minutes: number) {
  if (minutes >= 90) {
    return 'border-emerald-400/70 bg-emerald-500/25 text-emerald-100'
  }

  if (minutes >= 45) {
    return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-100'
  }

  if (minutes > 0) {
    return 'border-emerald-800/70 bg-emerald-900/40 text-emerald-200'
  }

  return 'border-slate-700 bg-slate-800 text-slate-300'
}

function getDailyInsight(workoutsByDate: Record<string, Workout[]>, dateKey: string): FitnessDayInsight {
  const workouts = workoutsByDate[dateKey] ?? []
  return {
    date: dateKey,
    workoutCount: workouts.length,
    minutes: workouts.reduce((total, workout) => total + Math.max(0, workout.duration_minutes), 0),
  }
}

function FitnessOsDashboard() {
  const { data, isLoading, isError } = useFitnessDashboard()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const maxHeatmapMinutes = useMemo(() => {
    if (!data) {
      return 0
    }

    return data.heatmapDays.reduce((best, day) => Math.max(best, day.minutes), 0)
  }, [data])

  const monthlyMaxMinutes = useMemo(() => {
    if (!data) {
      return 0
    }

    return monthCells.reduce((best, cell) => {
      const insight = getDailyInsight(data.workoutsByDate, cell.dateKey)
      return Math.max(best, insight.minutes)
    }, 0)
  }, [data, monthCells])

  const selectedDayWorkouts = selectedDateKey && data ? data.workoutsByDate[selectedDateKey] ?? [] : []
  const selectedDayInsight = selectedDateKey && data ? getDailyInsight(data.workoutsByDate, selectedDateKey) : null

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <article className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 p-3 sm:p-4">
          <p className="text-xs text-slate-300 sm:text-sm">Workouts This Week</p>
          <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : data?.workoutsThisWeek ?? 0}</p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 p-3 sm:p-4">
          <p className="text-xs text-slate-300 sm:text-sm">Active Workout Days</p>
          <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">
            {isLoading ? '--' : data?.activeWorkoutDaysThisWeek ?? 0} / 7
          </p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 p-3 sm:p-4">
          <p className="text-xs text-slate-300 sm:text-sm">Session Minutes</p>
          <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : data?.totalSessionMinutesThisWeek ?? 0}</p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 p-3 sm:p-4">
          <p className="text-xs text-slate-300 sm:text-sm">Consistency</p>
          <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : `${data?.consistencyScore ?? 0}%`}</p>
        </article>
      </div>

      {isError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-200">Failed to load Fitness dashboard.</article>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Workout Calendar</h2>
              <p className="mt-1 text-xs text-slate-400">Open month view for quick past insights and day-level workout summaries.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date())
                setSelectedDateKey(null)
                setIsCalendarOpen(true)
              }}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700"
            >
              Open Calendar
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
            {weekdayHeaders.map((weekday) => (
              <p key={weekday}>{weekday}</p>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildMonthGrid(new Date()).map((day) => {
              const dayInsight = data ? getDailyInsight(data.workoutsByDate, day.dateKey) : null
              return (
                <div
                  key={day.dateKey}
                  className={`rounded border p-1 text-center text-xs ${
                    dayInsight && dayInsight.minutes > 0
                      ? getCalendarDayTone(dayInsight.minutes)
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  } ${day.inCurrentMonth ? '' : 'opacity-40'}`}
                >
                  <p>{day.day}</p>
                  <p className="leading-none">{dayInsight && dayInsight.minutes > 0 ? `${dayInsight.minutes}m` : ''}</p>
                </div>
              )
            })}
          </div>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">90-Day Effort Heatmap</h2>
          <p className="mt-1 text-xs text-slate-400">Intensity is based on session minutes per day.</p>
          <div className="mt-4 overflow-x-auto">
            <div className="flex gap-2">
              <div className="grid grid-rows-7 gap-1 pt-1 text-[10px] text-slate-500">
                {Array.from({ length: 7 }, (_, index) => {
                  const label = heatmapWeekdayLabels.has(weekdayHeaders[index]) ? weekdayHeaders[index] : ''
                  return <span key={weekdayHeaders[index]}>{label}</span>
                })}
              </div>
              <div className="grid auto-cols-[12px] grid-flow-col grid-rows-7 gap-1">
                {(data?.heatmapDays ?? []).map((day) => (
                  <span
                    key={day.date}
                    className={`h-3 w-3 rounded-sm border ${getHeatmapLevelClass(day.minutes, maxHeatmapMinutes)}`}
                    title={`${formatIndiaDate(day.date)} - ${day.minutes} min - ${day.workoutCount} workouts`}
                  />
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Workouts</h2>
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading recent workouts...</p> : null}
        {!isLoading && (data?.recentWorkouts.length ?? 0) === 0 ? <p className="mt-3 text-sm text-slate-400">No workouts logged yet.</p> : null}
        <ul className="mt-3 space-y-2">
          {data?.recentWorkouts.slice(0, 6).map((workout) => (
            <li key={workout.id} className="rounded-md border border-slate-700 bg-slate-800 p-2">
              <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
              <p className="text-xs text-slate-400">
                {formatIndiaDate(workout.workout_date)} - {workout.duration_minutes} min
              </p>
            </li>
          ))}
        </ul>
      </article>

      {isCalendarOpen && data ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-3">
          <section className="h-[92vh] w-[96vw] max-w-6xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">Fitness Calendar View</h3>
                <p className="text-xs text-slate-400">Click any day to open its workout details drawer.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
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
              <p className="text-base font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
              >
                Next
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.45fr_1fr]">
              <div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-400">
                  {weekdayHeaders.map((weekday) => (
                    <p key={weekday}>{weekday}</p>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-2">
                  {monthCells.map((day) => {
                    const dayInsight = getDailyInsight(data.workoutsByDate, day.dateKey)
                    const dayClass = getCalendarDayTone(dayInsight.minutes)
                    const ratio = monthlyMaxMinutes > 0 ? dayInsight.minutes / monthlyMaxMinutes : 0

                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => setSelectedDateKey(day.dateKey)}
                        className={`rounded-md border p-2 text-left transition ${dayClass} ${
                          day.inCurrentMonth ? '' : 'opacity-40'
                        } ${selectedDateKey === day.dateKey ? 'ring-1 ring-slate-300/70' : ''}`}
                        style={{
                          boxShadow: dayInsight.minutes > 0 ? `inset 0 0 0 9999px rgba(16, 185, 129, ${0.08 + ratio * 0.22})` : undefined,
                        }}
                      >
                        <p className="text-sm font-semibold">{day.day}</p>
                        {dayInsight.minutes > 0 ? (
                          <p className="mt-1 text-[11px]">
                            {dayInsight.minutes}m • {dayInsight.workoutCount}
                          </p>
                        ) : (
                          <p className="mt-1 text-[11px] text-slate-500">No workout</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <aside className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <h4 className="text-sm font-semibold text-slate-100">Day Details</h4>
                {!selectedDateKey ? <p className="mt-2 text-sm text-slate-400">Select a day to view workout summaries.</p> : null}
                {selectedDateKey && selectedDayInsight ? (
                  <>
                    <p className="mt-2 text-xs text-slate-400">{formatIndiaDate(selectedDateKey)}</p>
                    <p className="text-sm text-slate-200">
                      {selectedDayInsight.workoutCount} workouts • {selectedDayInsight.minutes} minutes
                    </p>
                    {selectedDayWorkouts.length === 0 ? (
                      <p className="mt-3 text-sm text-slate-400">No workouts logged for this day.</p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {selectedDayWorkouts.map((workout) => (
                          <li key={workout.id} className="rounded-md border border-slate-700 bg-slate-900 p-2">
                            <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
                            <p className="text-xs text-slate-400">{workout.session_type || 'General session'}</p>
                            <p className="text-xs text-slate-400">
                              {workout.duration_minutes} min • {formatIndiaDateTime(workout.created_at)}
                            </p>
                            {workout.notes ? <p className="mt-1 text-xs text-slate-300">{workout.notes}</p> : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : null}
              </aside>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default FitnessOsDashboard
