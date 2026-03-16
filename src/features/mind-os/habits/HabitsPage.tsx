
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  type HabitType,
  type HabitWithStats,
  useAdjustHabitCount,
  useCreateHabit,
  useHabitWorkspace,
  useHealHabitBreak,
  useMarkHabitDone,
  useMarkHabitNotDone,
  useSetHabitCountForToday,
  useUndoHabitDone,
  useUpdateHabitBreakReason,
  useUpdateRecoveryCommitment,
} from '../api/useHabits'
import { addDays, buildMonthGrid, formatIndiaDate, formatIndiaDateTime, getMonthLabel, getTodayIndiaDateKey, shiftMonth } from '../utils/date'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const recoveryPromptChips = ['Stress spike', 'Sleep drop', 'Unexpected work', 'Travel disruption', 'Focus drift'] as const

type UndoToast = {
  habitId: string
  habitTitle: string
  expiresAt: number
}

type CalendarFilters = {
  done: boolean
  break: boolean
  healed: boolean
}

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

function isCompletionForHabit(habit: HabitWithStats, value: number) {
  if (habit.habit_type === 'target') {
    return value >= habit.target_value
  }

  return value >= 1
}

function PlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function ChevronIcon({ expanded, className = 'h-4 w-4' }: { expanded: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={`${className} transition-transform ${expanded ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function getHabitToneClasses(isCompleted: boolean) {
  if (isCompleted) {
    return {
      card: 'border-emerald-900/70 bg-emerald-950/25',
      statusBadge: 'border-emerald-800 bg-emerald-950/60 text-emerald-200',
      doneButton: 'border-rose-800 bg-rose-950/70 text-rose-100 hover:bg-rose-900/70',
    }
  }

  return {
    card: 'border-rose-900/70 bg-rose-950/25',
    statusBadge: 'border-rose-800 bg-rose-950/60 text-rose-200',
    doneButton: 'border-emerald-800 bg-emerald-950/70 text-emerald-100 hover:bg-emerald-900/70',
  }
}

function getMiniOverviewToneClass(status: 'none' | 'done' | 'break' | 'healed') {
  if (status === 'healed') {
    return 'border-sky-500/70 bg-sky-500/30 text-sky-100'
  }

  if (status === 'break') {
    return 'border-red-500/70 bg-red-500/30 text-red-100'
  }

  if (status === 'done') {
    return 'border-amber-400/70 bg-amber-400/30 text-amber-100'
  }

  return 'border-slate-700 bg-slate-900 text-slate-500'
}

function HabitsPage() {
  const { data, isLoading, isError } = useHabitWorkspace()
  const { mutate: createHabit, isPending: isCreatingHabit, error: createHabitError } = useCreateHabit()
  const { mutate: markHabitDone, isPending: isMarkingDone, error: markDoneError } = useMarkHabitDone()
  const { mutate: markHabitNotDone, isPending: isMarkingNotDone, error: markNotDoneError } = useMarkHabitNotDone()
  const { mutate: undoHabitDone, isPending: isUndoingDone, error: undoError } = useUndoHabitDone()
  const { mutate: adjustHabitCount, isPending: isAdjustingCount, error: adjustCountError } = useAdjustHabitCount()
  const { mutate: setHabitCountForToday, isPending: isSettingCount, error: setCountError } = useSetHabitCountForToday()
  const {
    mutate: updateBreakReason,
    isPending: isUpdatingBreakReason,
    error: updateBreakReasonError,
  } = useUpdateHabitBreakReason()
  const {
    mutate: updateRecoveryCommitment,
    isPending: isUpdatingRecoveryCommitment,
    error: updateRecoveryCommitmentError,
  } = useUpdateRecoveryCommitment()
  const { mutate: healBreak, isPending: isHealingBreak, error: healBreakError } = useHealHabitBreak()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [habitType, setHabitType] = useState<HabitType>('binary')
  const [targetValue, setTargetValue] = useState('1')
  const [unit, setUnit] = useState('')

  const [struggleDrafts, setStruggleDrafts] = useState<Record<string, string>>({})
  const [mistakeReasonDrafts, setMistakeReasonDrafts] = useState<Record<string, string>>({})
  const [healReasonDrafts, setHealReasonDrafts] = useState<Record<string, string>>({})
  const [recoveryDrafts, setRecoveryDrafts] = useState<Record<string, string>>({})
  const [expandedHabits, setExpandedHabits] = useState<Record<string, boolean>>({})

  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>({
    done: true,
    break: true,
    healed: true,
  })
  const [calendarCountInput, setCalendarCountInput] = useState('0')

  const [undoToast, setUndoToast] = useState<UndoToast | null>(null)
  const [undoNow, setUndoNow] = useState(() => Date.now())

  const selectedHabit = useMemo(() => {
    if (!data || !calendarHabitId) {
      return null
    }

    return data.habits.find((habit) => habit.id === calendarHabitId) ?? null
  }, [calendarHabitId, data])

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const completionDateMap = useMemo(() => {
    const map = new Map<string, Set<string>>()

    if (!data) {
      return map
    }

    const habitById = new Map(data.habits.map((habit) => [habit.id, habit]))

    for (const log of data.logs) {
      const habit = habitById.get(log.habit_id)

      if (!habit || !isCompletionForHabit(habit, log.value)) {
        continue
      }

      const dateSet = map.get(log.habit_id) ?? new Set<string>()
      dateSet.add(log.log_date)
      map.set(log.habit_id, dateSet)
    }

    return map
  }, [data])

  const breakDateMaps = useMemo(() => {
    const open = new Map<string, Set<string>>()
    const healed = new Map<string, Set<string>>()

    if (!data) {
      return { open, healed }
    }

    const healedBreakIds = new Set(data.heals.map((item) => item.break_id))

    for (const breakItem of data.breaks) {
      const isHealed = Boolean(breakItem.healed_at) || healedBreakIds.has(breakItem.id)
      const targetMap = isHealed ? healed : open
      const dateSet = targetMap.get(breakItem.habit_id) ?? new Set<string>()
      dateSet.add(breakItem.break_date)
      targetMap.set(breakItem.habit_id, dateSet)
    }

    return { open, healed }
  }, [data])

  const rollingSevenDateKeys = useMemo(() => {
    const today = getTodayIndiaDateKey()
    return Array.from({ length: 7 }, (_, index) => addDays(today, index - 6))
  }, [])

  const calendarCompletionDates = useMemo(() => {
    if (!selectedHabit) {
      return new Set<string>()
    }

    return completionDateMap.get(selectedHabit.id) ?? new Set<string>()
  }, [completionDateMap, selectedHabit])

  const calendarBreakDates = useMemo(() => {
    if (!selectedHabit) {
      return new Set<string>()
    }

    return breakDateMaps.open.get(selectedHabit.id) ?? new Set<string>()
  }, [breakDateMaps.open, selectedHabit])

  const calendarHealDates = useMemo(() => {
    if (!selectedHabit) {
      return new Set<string>()
    }

    return breakDateMaps.healed.get(selectedHabit.id) ?? new Set<string>()
  }, [breakDateMaps.healed, selectedHabit])

  useEffect(() => {
    if (!isCreateModalOpen && !calendarHabitId) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }

      if (calendarHabitId) {
        setCalendarHabitId(null)
        return
      }

      if (isCreateModalOpen) {
        setIsCreateModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [calendarHabitId, isCreateModalOpen])

  useEffect(() => {
    if (!undoToast) {
      return
    }

    const timer = window.setInterval(() => {
      const now = Date.now()
      setUndoNow(now)
      if (now >= undoToast.expiresAt) {
        setUndoToast(null)
      }
    }, 250)

    return () => {
      window.clearInterval(timer)
    }
  }, [undoToast])

  const openCalendarForHabit = (habitId: string) => {
    const habit = data?.habits.find((item) => item.id === habitId)

    setCalendarHabitId(habitId)
    setCalendarMonth(new Date())
    setCalendarFilters({
      done: true,
      break: true,
      healed: true,
    })
    setCalendarCountInput(habit?.habit_type === 'target' ? String(habit.todayValue) : '0')
  }

  const handleCreateHabit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedTargetValue = Number.parseInt(targetValue, 10)

    createHabit(
      {
        title,
        habitType,
        targetValue: Number.isNaN(parsedTargetValue) ? 1 : parsedTargetValue,
        unit,
      },
      {
        onSuccess: () => {
          setTitle('')
          setHabitType('binary')
          setTargetValue('1')
          setUnit('')
          setIsCreateModalOpen(false)
        },
      },
    )
  }

  const handleMarkDone = (habit: HabitWithStats) => {
    markHabitDone(
      {
        habitId: habit.id,
        habitType: habit.habit_type,
        targetValue: habit.target_value,
        currentValue: habit.todayValue,
        struggleNote: struggleDrafts[habit.id] ?? '',
      },
      {
        onSuccess: () => {
          setStruggleDrafts((previous) => ({
            ...previous,
            [habit.id]: '',
          }))
          setUndoToast({
            habitId: habit.id,
            habitTitle: habit.title,
            expiresAt: Date.now() + 60_000,
          })
        },
      },
    )
  }

  const handleMarkNotDone = (habitId: string) => {
    markHabitNotDone(
      { habitId },
      {
        onSuccess: () => {
          if (undoToast?.habitId === habitId) {
            setUndoToast(null)
          }
        },
      },
    )
  }

  const handleToggleDone = (habit: HabitWithStats) => {
    if (habit.completedToday) {
      handleMarkNotDone(habit.id)
      return
    }

    handleMarkDone(habit)
  }

  const handleUndo = () => {
    if (!undoToast) {
      return
    }

    undoHabitDone(
      { habitId: undoToast.habitId },
      {
        onSuccess: () => {
          setUndoToast(null)
        },
      },
    )
  }

  const handleAdjustCount = (habitId: string, delta: number) => {
    adjustHabitCount({
      habitId,
      delta,
      struggleNote: struggleDrafts[habitId] ?? '',
    })
  }

  const handleSetCalendarCount = () => {
    if (!selectedHabit || selectedHabit.habit_type !== 'target') {
      return
    }

    const parsedCount = Number.parseInt(calendarCountInput, 10)

    if (Number.isNaN(parsedCount)) {
      return
    }

    setHabitCountForToday({
      habitId: selectedHabit.id,
      value: parsedCount,
    })
  }

  const undoRemainingSeconds = undoToast ? Math.max(0, Math.ceil((undoToast.expiresAt - undoNow) / 1000)) : 0
  const actionError = markDoneError ?? markNotDoneError ?? adjustCountError ?? setCountError ?? undoError

  if (isLoading) {
    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">Loading habits...</section>
  }

  if (isError || !data) {
    return <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">Failed to load habits.</section>
  }

  return (
    <section className="space-y-4 pb-24">
      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-100">Habits Overview</h2>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            Active habits: {data.habits.length}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
            Heals left: {data.healTokensRemaining}/5
          </span>
          {data.lowHealTokenWarning ? (
            <span className="rounded-full border border-amber-500/70 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">Low token warning</span>
          ) : null}
        </div>
      </article>

      {actionError ? (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          Habit update failed: {getReadableErrorMessage(actionError)}
        </p>
      ) : null}

      {data.habits.length === 0 ? (
        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">No habits yet. Create your first habit with the + button.</section>
      ) : (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.habits.map((habit) => {
            const tone = getHabitToneClasses(habit.completedToday)
            const isMobileExpanded = Boolean(expandedHabits[habit.id])
            const completionDates = completionDateMap.get(habit.id)
            const breakDates = breakDateMaps.open.get(habit.id)
            const healDates = breakDateMaps.healed.get(habit.id)
            const struggleValue = struggleDrafts[habit.id] ?? ''
            const markButtonLabel = habit.completedToday ? 'Mark Undone' : 'Mark Done'

            return (
              <article key={habit.id} className={`rounded-xl border p-3 ${tone.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-2xl font-semibold text-slate-100">{habit.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-200">
                        {habit.habit_type === 'target' ? 'Progress' : 'Checkbox'}
                      </span>
                      {habit.habit_type === 'target' ? (
                        <span className="rounded-full border border-slate-600 bg-slate-900/80 px-2 py-0.5 text-[11px] font-semibold text-slate-100">
                          Goal: {habit.target_value} {habit.unit ?? 'units'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] ${tone.statusBadge}`}>
                      {habit.completedToday ? 'Completed' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHabits((previous) => ({
                          ...previous,
                          [habit.id]: !previous[habit.id],
                        }))
                      }
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-600 bg-slate-900 text-slate-200 md:hidden"
                      aria-label={isMobileExpanded ? 'Collapse habit card' : 'Expand habit card'}
                    >
                      <ChevronIcon expanded={isMobileExpanded} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 hidden space-y-2 md:block">
                  {habit.habit_type === 'target' ? (
                    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-2">
                      <p className="text-xs text-slate-400">Today's count</p>
                      <div className="mt-1 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, -1)}
                          disabled={isAdjustingCount || habit.todayValue <= 0}
                          className="h-10 w-10 rounded-md border border-slate-600 bg-slate-950 text-lg font-semibold text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                        >
                          -
                        </button>
                        <div className="h-10 min-w-[84px] rounded-md border border-slate-700 bg-slate-950 px-3 text-center text-3xl font-semibold leading-10 text-slate-100">
                          {habit.todayValue}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, 1)}
                          disabled={isAdjustingCount}
                          className="h-10 w-10 rounded-md border border-slate-600 bg-slate-950 text-lg font-semibold text-slate-100 hover:bg-slate-900 disabled:opacity-60"
                        >
                          +
                        </button>
                        <p className="text-sm text-slate-300">
                          Goal: {habit.target_value} {habit.unit ?? 'units'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <label className="block text-sm text-slate-300">
                    Struggle note (optional)
                    <textarea
                      value={struggleValue}
                      onChange={(event) =>
                        setStruggleDrafts((previous) => ({
                          ...previous,
                          [habit.id]: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="What made this hard today?"
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                  </label>

                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="h-14 rounded-md border border-slate-700 bg-slate-950/80 p-1 text-center">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Streak</p>
                      <p className="text-sm font-semibold text-slate-100">{habit.currentStreak} current</p>
                      <p className="text-[11px] text-slate-300">{habit.longestStreak} best</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleDone(habit)}
                      disabled={isMarkingDone || isMarkingNotDone}
                      className={`h-14 rounded-md border px-2 text-sm font-semibold transition disabled:opacity-60 ${tone.doneButton}`}
                    >
                      {markButtonLabel}
                    </button>

                    <button
                      type="button"
                      onClick={() => openCalendarForHabit(habit.id)}
                      className="h-14 rounded-md border border-slate-600 bg-slate-900 text-sm font-semibold text-slate-100 hover:bg-slate-800"
                    >
                      Calendar
                    </button>
                  </div>
                </div>

                <div className="mt-2 space-y-2 md:hidden">
                  {isMobileExpanded ? (
                    <>
                      <div className="grid grid-cols-[88px_1fr] gap-2">
                        <div className="rounded-md border border-slate-700 bg-slate-950/80 p-1 text-center">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">Streak</p>
                          <p className="text-xs font-semibold text-slate-100">{habit.currentStreak} current</p>
                          <p className="text-[11px] text-slate-300">{habit.longestStreak} best</p>
                        </div>

                        <label className="text-[11px] text-slate-300">
                          Note
                          <input
                            value={struggleValue}
                            onChange={(event) =>
                              setStruggleDrafts((previous) => ({
                                ...previous,
                                [habit.id]: event.target.value,
                              }))
                            }
                            placeholder="Optional"
                            className="mt-1 h-8 w-full rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100"
                          />
                        </label>
                      </div>

                      <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                        <p className="text-[11px] text-slate-400">Last 7 days</p>
                        <div className="mt-1 grid grid-cols-7 gap-1">
                          {rollingSevenDateKeys.map((dateKey) => {
                            const status: 'none' | 'done' | 'break' | 'healed' = healDates?.has(dateKey)
                              ? 'healed'
                              : breakDates?.has(dateKey)
                                ? 'break'
                                : completionDates?.has(dateKey)
                                  ? 'done'
                                  : 'none'

                            return (
                              <div key={`${habit.id}-mini-${dateKey}`} className={`rounded border px-1 py-1 text-center text-[10px] ${getMiniOverviewToneClass(status)}`}>
                                {dateKey.slice(8)}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openCalendarForHabit(habit.id)}
                        className="h-8 w-full rounded-md border border-slate-600 bg-slate-900 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                      >
                        Open Calendar
                      </button>
                    </>
                  ) : null}

                  <div className="flex items-center gap-2">
                    {habit.habit_type === 'target' ? (
                      <div className="flex h-8 items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, -1)}
                          disabled={isAdjustingCount || habit.todayValue <= 0}
                          className="h-6 w-6 rounded border border-slate-600 bg-slate-950 text-sm font-semibold text-slate-100 disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="min-w-[48px] text-center text-xs font-semibold text-slate-100">
                          {habit.todayValue}/{habit.target_value}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, 1)}
                          disabled={isAdjustingCount}
                          className="h-6 w-6 rounded border border-slate-600 bg-slate-950 text-sm font-semibold text-slate-100 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300">Binary completion habit.</p>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleDone(habit)}
                      disabled={isMarkingDone || isMarkingNotDone}
                      className={`h-8 flex-1 rounded-md border px-2 text-xs font-semibold disabled:opacity-60 ${tone.doneButton}`}
                    >
                      {markButtonLabel}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-100">Mistakes (Streak Losses)</h2>
            {data.lowHealTokenWarning ? (
              <span className="rounded-full border border-amber-500/70 bg-amber-500/20 px-2 py-0.5 text-xs text-amber-200">Be careful: low heal tokens</span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">Track break reasons, write a recovery commitment, and heal selected breaks.</p>

          {data.mistakes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">No streak losses recorded yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.mistakes.map((mistake) => {
                const reasonValue = mistakeReasonDrafts[mistake.id] ?? mistake.reason ?? ''
                const healValue = healReasonDrafts[mistake.id] ?? ''
                const recoveryValue = recoveryDrafts[mistake.id] ?? mistake.recovery_commitment ?? ''

                return (
                  <li key={mistake.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">{mistake.habitTitle}</p>
                        <p className="text-xs text-slate-400">Broken on {formatIndiaDate(mistake.break_date)}</p>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[11px] ${
                          mistake.isHealed
                            ? 'border-sky-600 bg-sky-500/10 text-sky-300'
                            : 'border-red-700 bg-red-500/10 text-red-300'
                        }`}
                      >
                        {mistake.isHealed ? 'Healed' : 'Open'}
                      </span>
                    </div>

                    <label className="mt-3 block text-xs text-slate-300">
                      Break reason
                      <textarea
                        value={reasonValue}
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

                    <button
                      type="button"
                      onClick={() =>
                        updateBreakReason({
                          breakId: mistake.id,
                          reason: reasonValue,
                        })
                      }
                      disabled={isUpdatingBreakReason}
                      className="mt-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                    >
                      Save reason
                    </button>

                    <div className="mt-3 rounded-md border border-slate-700 bg-slate-900/60 p-2">
                      <p className="text-xs font-semibold text-slate-200">Recovery assistant</p>
                      <p className="mt-1 text-[11px] text-slate-400">Pick a blocker prompt or write your own next-step commitment.</p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {recoveryPromptChips.map((prompt) => (
                          <button
                            key={`${mistake.id}-${prompt}`}
                            type="button"
                            onClick={() =>
                              setRecoveryDrafts((previous) => ({
                                ...previous,
                                [mistake.id]: prompt,
                              }))
                            }
                            className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>

                      <label className="mt-2 block text-xs text-slate-300">
                        Recovery commitment
                        <textarea
                          value={recoveryValue}
                          onChange={(event) =>
                            setRecoveryDrafts((previous) => ({
                              ...previous,
                              [mistake.id]: event.target.value,
                            }))
                          }
                          rows={2}
                          placeholder="Example: Sleep by 11:00 pm and start this habit right after tea."
                          className="mt-1 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          updateRecoveryCommitment({
                            breakId: mistake.id,
                            recoveryCommitment: recoveryValue,
                          })
                        }
                        disabled={isUpdatingRecoveryCommitment}
                        className="mt-2 rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                      >
                        Save commitment
                      </button>

                      {mistake.recovery_commitment ? (
                        <p className="mt-2 text-xs text-slate-300">Saved commitment: {mistake.recovery_commitment}</p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-400">No saved commitment yet.</p>
                      )}
                    </div>

                    <label className="mt-3 block text-xs text-slate-300">
                      Heal reason
                      <input
                        value={healValue}
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
                            reason: healValue,
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
                      {isHealingBreak ? 'Healing...' : 'Heal this break'}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {updateBreakReasonError ? (
            <p className="mt-3 text-sm text-red-400">Failed to save reason: {getReadableErrorMessage(updateBreakReasonError)}</p>
          ) : null}
          {updateRecoveryCommitmentError ? (
            <p className="mt-2 text-sm text-red-400">Failed to save commitment: {getReadableErrorMessage(updateRecoveryCommitmentError)}</p>
          ) : null}
          {healBreakError ? (
            <p className="mt-2 text-sm text-red-400">Failed to heal break: {getReadableErrorMessage(healBreakError)}</p>
          ) : null}
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-xl font-semibold text-slate-100">Streak Heal Tokens</h2>
          <p className="mt-2 text-sm text-slate-300">
            Remaining this month: <span className="font-semibold text-slate-100">{data.healTokensRemaining} / 5</span>
          </p>
          <p className="text-xs text-slate-400">Used this month: {data.healsUsedThisMonth}</p>
          {data.lowHealTokenWarning ? (
            <p className="mt-2 rounded-md border border-amber-500/70 bg-amber-500/20 px-2 py-1 text-xs text-amber-200">Token reserve is low. Avoid avoidable breaks this week.</p>
          ) : null}

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

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-600 bg-slate-800 text-slate-100 shadow-xl shadow-black/60 transition hover:bg-slate-700"
        aria-label="Create habit"
      >
        <PlusIcon />
      </button>

      {undoToast && undoRemainingSeconds > 0 ? (
        <article className="fixed bottom-24 right-5 z-30 w-[min(360px,92vw)] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl shadow-black/70">
          <p className="text-sm text-slate-100">{undoToast.habitTitle} marked done.</p>
          <p className="mt-1 text-xs text-slate-400">Undo available for {undoRemainingSeconds}s.</p>
          <button
            type="button"
            onClick={handleUndo}
            disabled={isUndoingDone}
            className="mt-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            {isUndoingDone ? 'Undoing...' : 'Undo'}
          </button>
        </article>
      ) : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0 bg-slate-950/85"
            aria-label="Close create habit modal"
          />

          <article className="relative z-10 h-[88vh] w-[96vw] max-w-4xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Create Habit</h2>
                <p className="text-sm text-slate-400">Set up binary or target habits in a focused creation flow.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="mt-4 space-y-4">
              <label className="block text-sm text-slate-300">
                Habit title
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Read 20 pages"
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Habit type
                <select
                  value={habitType}
                  onChange={(event) => setHabitType(event.target.value as HabitType)}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="binary">Binary (done / not done)</option>
                  <option value="target">Target habit (count based)</option>
                </select>
              </label>

              {habitType === 'target' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Goal count
                    <input
                      type="number"
                      min={1}
                      value={targetValue}
                      onChange={(event) => setTargetValue(event.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>

                  <label className="block text-sm text-slate-300">
                    Unit (optional)
                    <input
                      value={unit}
                      onChange={(event) => setUnit(event.target.value)}
                      placeholder="pages"
                      className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                </div>
              ) : null}

              {createHabitError ? (
                <p className="text-sm text-red-400">Failed to create habit: {getReadableErrorMessage(createHabitError)}</p>
              ) : null}

              <button
                type="submit"
                disabled={isCreatingHabit || title.trim().length === 0}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {isCreatingHabit ? 'Creating...' : 'Create Habit'}
              </button>
            </form>
          </article>
        </div>
      ) : null}

      {calendarHabitId && selectedHabit ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/85 p-3">
          <section className="h-[92vh] w-[96vw] max-w-6xl overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-100">{selectedHabit.title} Calendar</h3>
                <p className="text-xs text-slate-400">Yellow: done • Red: streak break • Blue: healed break</p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarHabitId(null)}
                className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {selectedHabit.habit_type === 'target' ? (
              <div className="mt-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                <p className="text-sm text-slate-200">Set today's count (keyboard input)</p>
                <p className="text-xs text-slate-400">This updates only today and does not modify historical entries.</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={calendarCountInput}
                    onChange={(event) => setCalendarCountInput(event.target.value)}
                    className="h-9 w-32 rounded-md border border-slate-600 bg-slate-800 px-2 text-sm text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleSetCalendarCount}
                    disabled={isSettingCount}
                    className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                  >
                    {isSettingCount ? 'Saving...' : 'Set'}
                  </button>
                  <p className="text-xs text-slate-400">
                    Current: {selectedHabit.todayValue} / Goal: {selectedHabit.target_value} {selectedHabit.unit ?? 'units'}
                  </p>
                </div>
                {setCountError ? <p className="mt-2 text-xs text-red-400">Failed to set count: {getReadableErrorMessage(setCountError)}</p> : null}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCalendarFilters((previous) => ({ ...previous, done: !previous.done }))}
                className={`rounded-full border px-3 py-1 text-xs ${
                  calendarFilters.done
                    ? 'border-amber-400/70 bg-amber-400/20 text-amber-100'
                    : 'border-slate-600 bg-slate-900 text-slate-300'
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
                    : 'border-slate-600 bg-slate-900 text-slate-300'
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
                    : 'border-slate-600 bg-slate-900 text-slate-300'
                }`}
              >
                Healed
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

                let toneClass = 'border-slate-700 bg-slate-800 text-slate-300'
                if (showHeal) {
                  toneClass = 'border-sky-500/60 bg-sky-500/20 text-sky-100'
                } else if (showBreak) {
                  toneClass = 'border-red-500/60 bg-red-500/20 text-red-100'
                } else if (showDone) {
                  toneClass = 'border-amber-400/70 bg-amber-300/20 text-amber-100'
                }

                const logValue = data.logValueByHabitDate[`${selectedHabit.id}:${day.dateKey}`] ?? 0

                return (
                  <div
                    key={day.dateKey}
                    className={`rounded-md border p-2 text-left ${toneClass} ${day.inCurrentMonth ? '' : 'opacity-40'}`}
                  >
                    <p className="text-sm font-semibold">{day.day}</p>
                    {selectedHabit.habit_type === 'target' && logValue > 0 ? <p className="mt-1 text-[11px]">Count: {logValue}</p> : null}
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

