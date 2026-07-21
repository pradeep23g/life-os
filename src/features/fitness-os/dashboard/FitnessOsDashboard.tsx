import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { type FitnessDayInsight, type Workout, useFitnessDashboard } from '../api/useFitness'
import { buildMonthGrid, formatIndiaDate, getMonthLabel, shiftMonth } from '../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const heatmapWeekdayLabels = new Set(['Mon', 'Wed', 'Fri']) // Common GitHub heatmap labels

function getHeatmapIntensityLabel(minutes: number, maxMinutes: number) {
  if (minutes <= 0 || maxMinutes <= 0) return 'No Activity'
  const ratio = minutes / maxMinutes
  if (ratio >= 0.75) return 'Very High Intensity'
  if (ratio >= 0.5) return 'High Intensity'
  if (ratio >= 0.25) return 'Medium Intensity'
  return 'Low Intensity'
}

function getHeatmapLevelClass(minutes: number, maxMinutes: number) {
  if (minutes <= 0 || maxMinutes <= 0) {
    return 'border-border bg-surface'
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

  return 'border-border bg-[#111111] text-slate-300'
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
  const navigate = useNavigate()
  const { data, isLoading, isError } = useFitnessDashboard()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())

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

  const heatmapWeeks = useMemo(() => {
    if (!data || data.heatmapDays.length === 0) return []
    
    const weeksMatrix: (FitnessDayInsight | null)[][] = []
    let currentWeek: (FitnessDayInsight | null)[] = []
    
    const firstDay = data.heatmapDays[0]
    const firstDayOfWeek = new Date(firstDay.date).getDay() // 0 = Sun, 6 = Sat
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null)
    }
    
    for (const day of data.heatmapDays) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeksMatrix.push(currentWeek)
        currentWeek = []
      }
    }
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      weeksMatrix.push(currentWeek)
    }
    
    return weeksMatrix
  }, [data])

  const legendThresholds = useMemo(() => {
    if (maxHeatmapMinutes === 0) return [0]
    return [
      0,
      Math.round(maxHeatmapMinutes * 0.25),
      Math.round(maxHeatmapMinutes * 0.5),
      Math.round(maxHeatmapMinutes * 0.75),
      maxHeatmapMinutes
    ]
  }, [maxHeatmapMinutes])

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm font-medium text-slate-400">Workouts This Week</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : data?.workoutsThisWeek ?? 0}</p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm font-medium text-slate-400">Active Workout Days</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {isLoading ? '--' : data?.activeWorkoutDaysThisWeek ?? 0} / 7
          </p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm font-medium text-slate-400">Session Minutes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : data?.totalSessionMinutesThisWeek ?? 0}</p>
        </article>
        <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
          <p className="text-sm font-medium text-slate-400">Consistency</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : `${data?.consistencyScore ?? 0}%`}</p>
        </article>
      </div>

      {isError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-200">Failed to load Fitness dashboard.</article>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <article className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-100">Workout Calendar</h2>
              <p className="mt-1 text-xs text-slate-400">Open month view for quick past insights and day-level workout summaries.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCalendarMonth(new Date())
                setIsCalendarOpen(true)
              }}
              className="rounded-md border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-100 hover:bg-[#222222]"
            >
              Open Calendar
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {weekdayHeaders.map((weekday) => (
              <p key={weekday}>{weekday}</p>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {buildMonthGrid(new Date()).map((day) => {
              const dayInsight = data ? getDailyInsight(data.workoutsByDate, day.dateKey) : null
              const dayWorkouts = data?.workoutsByDate[day.dateKey] || []
              const title = dayWorkouts.length > 0 ? dayWorkouts[0].title : ''
              return (
                <button
                  type="button"
                  key={day.dateKey}
                  onClick={() => navigate(`/fitness-os/workouts?date=${day.dateKey}`)}
                  className={`rounded border p-1 text-center text-xs hover:ring-1 hover:ring-slate-300 transition-all flex flex-col items-center justify-center overflow-hidden ${
                    dayInsight && dayInsight.minutes > 0
                      ? getCalendarDayTone(dayInsight.minutes)
                      : 'border-border bg-[#111111] text-slate-400'
                  } ${day.inCurrentMonth ? '' : 'opacity-40'}`}
                  title={title || 'No workout'}
                >
                  <p>{day.day}</p>
                  {dayInsight && dayInsight.minutes > 0 ? (
                    <>
                      <p className="leading-none mt-0.5">{dayInsight.minutes}m</p>
                      <p className="leading-none mt-1 truncate w-full px-0.5 text-xs opacity-75">{title}</p>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>
        </article>

        <article className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-base font-semibold text-slate-100">90-Day Effort Heatmap</h2>
          <p className="mt-1 text-xs text-slate-400">Intensity is based on session minutes per day.</p>
          <div className="mt-4 w-full overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              <div className="flex flex-col justify-between pt-[2px] pb-[2px] text-[10px] text-slate-500 mr-1 h-[142px]">
                {Array.from({ length: 7 }, (_, index) => (
                  <span key={index} className="h-[18px] leading-[18px]">
                    {heatmapWeekdayLabels.has(weekdayHeaders[index]) ? weekdayHeaders[index] : ''}
                  </span>
                ))}
              </div>
              <div className="flex gap-[3px]">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-[3px]">
                    {week.map((day, dIdx) => {
                      if (!day) {
                        return <span key={`pad-${wIdx}-${dIdx}`} className="h-[18px] w-[18px]" />
                      }
                      return (
                        <span
                          key={day.date}
                          className={`h-[18px] w-[18px] rounded-sm border ${getHeatmapLevelClass(day.minutes, maxHeatmapMinutes)} transition-colors hover:ring-1 hover:ring-slate-300 cursor-default`}
                          title={`${formatIndiaDate(day.date)}\n${day.minutes} minutes\n${day.workoutCount} workout${day.workoutCount !== 1 ? 's' : ''}\n${getHeatmapIntensityLabel(day.minutes, maxHeatmapMinutes)}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 pl-[30px]">
              <span>Less</span>
              {legendThresholds.map((threshold, i) => (
                <div key={i} className="flex flex-col items-center group relative">
                  <span className={`h-[14px] w-[14px] rounded-sm border ${getHeatmapLevelClass(threshold, maxHeatmapMinutes)}`} />
                  {threshold > 0 ? (
                    <span className="absolute top-full mt-1 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {threshold}m{i === legendThresholds.length - 1 ? '+' : ''}
                    </span>
                  ) : null}
                </div>
              ))}
              <span>More</span>
            </div>
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-base font-semibold text-slate-100">Recent Workouts</h2>
        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading recent workouts...</p> : null}
        {!isLoading && (data?.recentWorkouts.length ?? 0) === 0 ? <p className="mt-3 text-sm text-slate-400">No workouts logged yet.</p> : null}
        <ul className="mt-3 space-y-2">
          {data?.recentWorkouts.slice(0, 6).map((workout) => (
            <li key={workout.id} className="rounded-md border border-border bg-[#111111] p-2">
              <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
              <p className="text-xs text-slate-400">
                {formatIndiaDate(workout.workout_date)} - {workout.duration_minutes} min
              </p>
            </li>
          ))}
        </ul>
      </article>

      {isCalendarOpen && data ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 p-3">
          <section className="h-[92vh] w-[96vw] max-w-6xl overflow-auto rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Fitness Calendar View</h3>
                <p className="text-xs text-slate-400">Click any day to jump to its workouts.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="rounded-md border border-border px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded-md border border-border px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
              >
                Previous
              </button>
              <p className="text-base font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-md border border-border px-3 py-1 text-sm text-slate-100 hover:bg-[#111111]"
              >
                Next
              </button>
            </div>

            <div className="mt-4">
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
                    const title = data?.workoutsByDate[day.dateKey]?.[0]?.title

                    return (
                      <button
                        key={day.dateKey}
                        type="button"
                        onClick={() => {
                          setIsCalendarOpen(false)
                          navigate(`/fitness-os/workouts?date=${day.dateKey}`)
                        }}
                        className={`rounded-md border p-2 text-left transition hover:ring-1 hover:ring-slate-300 ${dayClass} ${
                          day.inCurrentMonth ? '' : 'opacity-40'
                        }`}
                        style={{
                          boxShadow: dayInsight.minutes > 0 ? `inset 0 0 0 9999px rgba(16, 185, 129, ${0.08 + ratio * 0.22})` : undefined,
                        }}
                      >
                        <p className="text-sm font-semibold">{day.day}</p>
                        {dayInsight.minutes > 0 ? (
                          <>
                            <p className="mt-1 text-xs">
                              {dayInsight.minutes}m • {dayInsight.workoutCount}
                            </p>
                            {title ? <p className="mt-1 truncate w-full text-xs opacity-75">{title}</p> : null}
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">No workout</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

export default FitnessOsDashboard

