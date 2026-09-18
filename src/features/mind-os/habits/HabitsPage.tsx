import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { DeleteButton } from '../../../components/DeleteButton'
import { LoadingView } from '../../../components/LoadingView'
import {
  type HabitType,
  type HabitWithStats,
  useAdjustHabitCount,
  useCreateHabit,
  useDeleteHabit,
  useHabitWorkspace,
  useHealHabitBreak,
  useMarkHabitDone,
  useMarkHabitNotDone,
  useSetHabitCountForToday,
  useUndoHabitDone,
  useUpdateHabitBreakReason,
  useUpdateRecoveryCommitment,
} from '../api/useHabits'
import { HabitCreateModal } from './components/HabitCreateModal'
import { HabitCalendarModal } from './components/HabitCalendarModal'
import { RecentMistakesModal } from './components/RecentMistakesModal'
import {
  addDays,
  buildMonthGrid,
  formatIndiaDate,
  getTodayIndiaDateKey,
  getPast7DayKeys,
  calculateHabit30DayConsistency,
} from '../utils/date'

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

function HabitsPage() {
  const { data, isLoading, isError } = useHabitWorkspace()
  const { mutate: createHabit, isPending: isCreatingHabit, error: createHabitError } = useCreateHabit()
  const { mutate: markHabitDone, isPending: isMarkingDone, error: markDoneError } = useMarkHabitDone()
  const { mutate: markHabitNotDone, isPending: isMarkingNotDone, error: markNotDoneError } = useMarkHabitNotDone()
  const { mutate: adjustHabitCount, isPending: isAdjustingCount, error: adjustCountError } = useAdjustHabitCount()
  const { mutate: setHabitCountForToday, isPending: isSettingCount, error: setCountError } = useSetHabitCountForToday()
  const { mutate: updateBreakReason, isPending: isUpdatingBreakReason } = useUpdateHabitBreakReason()
  const { mutate: updateRecoveryCommitment, isPending: isUpdatingRecoveryCommitment } = useUpdateRecoveryCommitment()
  const { mutate: healBreak, isPending: isHealingBreak } = useHealHabitBreak()
  const { mutate: undoHabitDone, error: undoError } = useUndoHabitDone()
  const { mutate: deleteHabit, isPending: isDeletingHabit } = useDeleteHabit()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [habitType, setHabitType] = useState<HabitType>('binary')
  const [targetValue, setTargetValue] = useState('1')
  const [unit, setUnit] = useState('')

  const [calendarHabitId, setCalendarHabitId] = useState<string | null>(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [calendarCountInput, setCalendarCountInput] = useState('0')
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>({
    done: true,
    break: true,
    healed: true,
  })

  const [isRecentMistakesOpen, setIsRecentMistakesOpen] = useState(false)

  const [mistakeReasonDrafts, setMistakeReasonDrafts] = useState<Record<string, string>>({})
  const [recoveryDrafts, setRecoveryDrafts] = useState<Record<string, string>>({})
  const [healReasonDrafts, setHealReasonDrafts] = useState<Record<string, string>>({})

  const [undoToast, setUndoToast] = useState<UndoToast | null>(null)
  const [undoNow, setUndoNow] = useState(() => Date.now())

  const todayKey = getTodayIndiaDateKey()
  const past7Days = getPast7DayKeys(todayKey)

  const selectedHabit = useMemo(() => {
    if (!calendarHabitId || !data) {
      return null
    }
    return data.habits.find((habit) => habit.id === calendarHabitId) ?? null
  }, [calendarHabitId, data])

  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const completionDateMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    if (!data) return map

    for (const log of data.logs) {
      const habit = data.habits.find((h) => h.id === log.habit_id)
      if (!habit) continue

      const isCompleted = habit.habit_type === 'target' ? log.value >= habit.target_value : log.value >= 1
      if (isCompleted) {
        const dateSet = map.get(log.habit_id) ?? new Set<string>()
        dateSet.add(log.log_date)
        map.set(log.habit_id, dateSet)
      }
    }
    return map
  }, [data])

  const breakDateMaps = useMemo(() => {
    const open = new Map<string, Set<string>>()
    const healed = new Map<string, Set<string>>()
    if (!data) return { open, healed }

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

  const calendarCompletionDates = useMemo(() => {
    if (!selectedHabit) return new Set<string>()
    return completionDateMap.get(selectedHabit.id) ?? new Set<string>()
  }, [completionDateMap, selectedHabit])

  const calendarBreakDates = useMemo(() => {
    if (!selectedHabit) return new Set<string>()
    return breakDateMaps.open.get(selectedHabit.id) ?? new Set<string>()
  }, [breakDateMaps.open, selectedHabit])

  const calendarHealDates = useMemo(() => {
    if (!selectedHabit) return new Set<string>()
    return breakDateMaps.healed.get(selectedHabit.id) ?? new Set<string>()
  }, [breakDateMaps.healed, selectedHabit])

  const recentFiveDayMistakes = data
    ? data.mistakes.filter((mistake) => {
        const cutoff = addDays(todayKey, -4)
        return mistake.break_date >= cutoff && mistake.break_date <= todayKey
      })
    : []

  useEffect(() => {
    if (!undoToast) return
    const timer = window.setInterval(() => {
      const now = Date.now()
      setUndoNow(now)
      if (now >= undoToast.expiresAt) {
        setUndoToast(null)
      }
    }, 250)
    return () => window.clearInterval(timer)
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
        unit: unit.trim() || undefined,
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
      },
      {
        onSuccess: () => {
          setUndoToast({
            habitId: habit.id,
            habitTitle: habit.title,
            expiresAt: Date.now() + 30_000,
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
    } else {
      handleMarkDone(habit)
    }
  }

  const handleUndo = () => {
    if (!undoToast) return
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
    })
  }

  const handleSetCalendarCount = () => {
    if (!selectedHabit || selectedHabit.habit_type !== 'target') return
    const parsedCount = Number.parseInt(calendarCountInput, 10)
    if (Number.isNaN(parsedCount)) return

    setHabitCountForToday({
      habitId: selectedHabit.id,
      value: parsedCount,
    })
  }

  const undoRemainingSeconds = undoToast ? Math.max(0, Math.ceil((undoToast.expiresAt - undoNow) / 1000)) : 0
  const actionError = markDoneError ?? markNotDoneError ?? adjustCountError ?? setCountError ?? undoError

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <LoadingView
          variant="page"
          label="Calibrating Habit Sanctuary"
          sublabel="Synchronizing behavioral trajectories..."
        />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm font-sans text-threat-critical">Failed to load habit workspace.</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-10 text-text-primary">
      <header className="border-b border-border-subtle pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Mind OS &bull; Habit Sanctuary
            </span>
            <span className="text-text-tertiary font-mono text-xs">&bull;</span>
            <Link
              to="/mind-os"
              className="text-xs font-mono text-text-secondary hover:text-text-primary transition-colors underline-offset-4 hover:underline"
            >
              &larr; Back to The Study
            </Link>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-normal tracking-tight text-text-primary mt-1">
            Rhythm Ledger
          </h1>
          <p className="text-xs sm:text-sm font-sans text-text-secondary max-w-lg mt-0.5">
            Hairline-calibrated behavioral rhythms. Free of gamified badges and SaaS card clutter.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-text-tertiary uppercase tracking-wider">Active</div>
            <div className="text-sm font-mono tabular-nums text-text-primary font-medium">
              {data.habits.length}
            </div>
          </div>
          <div className="h-6 w-px bg-border-subtle" aria-hidden="true" />
          <div className="text-right">
            <div className="text-text-tertiary uppercase tracking-wider">Heal Tokens</div>
            <div className="text-sm font-mono tabular-nums text-text-primary font-medium">
              {data.healTokensRemaining}/5
            </div>
          </div>
          <div className="h-6 w-px bg-border-subtle" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium"
          >
            + New Rhythm
          </button>
        </div>
      </header>

      {actionError && (
        <div className="p-3 border border-threat-critical/50 rounded-sm bg-threat-critical/10 text-xs text-threat-critical font-sans">
          Habit update failed: {getReadableErrorMessage(actionError)}
        </div>
      )}

      <section className="space-y-4" aria-labelledby="habits-ledger-heading">
        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
          <h2 id="habits-ledger-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
            Rhythms ({data.habits.length})
          </h2>
          <div className="flex items-center gap-3">
            {recentFiveDayMistakes.length > 0 && (
              <button
                type="button"
                onClick={() => setIsRecentMistakesOpen(true)}
                className="text-xs font-sans text-threat-warning hover:underline underline-offset-4"
              >
                Missed Habits ({recentFiveDayMistakes.length})
              </button>
            )}
            <span className="font-mono text-xs text-text-tertiary tabular-nums">
              Tabular Alignment
            </span>
          </div>
        </div>

        {data.habits.length === 0 ? (
          <div className="py-12 text-center text-text-tertiary font-serif italic text-base border-b border-border-subtle">
            No active rhythms established. Create your first rhythm above.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle/50" role="list">
            {data.habits.map((habit) => {
              const consistency30Day = calculateHabit30DayConsistency(
                habit.id,
                habit.habit_type,
                habit.target_value,
                data.logValueByHabitDate,
              )

              return (
                <div
                  key={habit.id}
                  className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  role="listitem"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-serif text-lg text-text-primary truncate">
                        {habit.title}
                      </h3>
                      <span className="font-mono text-[11px] text-text-tertiary">
                        {habit.habit_type === 'target'
                          ? `[Target: ${habit.target_value} ${habit.unit ?? ''}]`
                          : '[Binary]'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-text-tertiary">
                      <span className="tabular-nums">
                        {habit.currentStreak}d current &bull; {habit.longestStreak}d best
                      </span>
                      <span>&bull;</span>
                      <span className="tabular-nums text-text-secondary font-medium">
                        {consistency30Day}% 30-Day Pulse
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" aria-label="7-day completion rhythm">
                    <span className="text-[11px] font-mono text-text-tertiary mr-1 hidden sm:inline">7d:</span>
                    <div className="flex items-center gap-1.5">
                      {past7Days.map((dayKey) => {
                        const logVal = data.logValueByHabitDate[`${habit.id}:${dayKey}`] ?? 0
                        const isDone = habit.habit_type === 'target' ? logVal >= habit.target_value : logVal >= 1
                        const isToday = dayKey === todayKey

                        return (
                          <div
                            key={dayKey}
                            title={`${dayKey}: ${isDone ? 'Completed' : 'Open'}`}
                            className="flex flex-col items-center"
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                isDone
                                  ? 'bg-accent-primary'
                                  : isToday
                                  ? 'border border-text-tertiary'
                                  : 'border border-border-subtle bg-surface/30'
                              }`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center">
                    {habit.habit_type === 'binary' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleDone(habit)}
                        disabled={isMarkingDone || isMarkingNotDone}
                        className={`min-w-[84px] px-3 py-1.5 text-xs font-mono tabular-nums rounded-sm border transition-colors ${
                          habit.completedToday
                            ? 'border-accent-primary/60 bg-accent-primary/10 text-accent-primary font-medium hover:bg-accent-primary/20'
                            : 'border-border-subtle text-text-secondary hover:border-border hover:text-text-primary'
                        }`}
                      >
                        {habit.completedToday ? 'Done \u2713' : 'Mark Done'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, -1)}
                          disabled={isAdjustingCount || habit.todayValue <= 0}
                          className="h-8 w-8 rounded-sm border border-border-subtle text-text-secondary hover:border-border hover:text-text-primary font-mono text-xs flex items-center justify-center disabled:opacity-40"
                          aria-label="Decrease count"
                        >
                          -
                        </button>
                        <span className="min-w-[48px] text-center font-mono tabular-nums text-xs text-text-primary">
                          {habit.todayValue}/{habit.target_value}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustCount(habit.id, 1)}
                          disabled={isAdjustingCount}
                          className="h-8 w-8 rounded-sm border border-border-subtle text-text-secondary hover:border-border hover:text-text-primary font-mono text-xs flex items-center justify-center"
                          aria-label="Increase count"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => openCalendarForHabit(habit.id)}
                      className="px-2.5 py-1.5 text-xs font-sans text-text-secondary hover:text-text-primary border border-border-subtle hover:border-border rounded-sm transition-colors"
                      title="Open 30-day horizon"
                    >
                      Calendar
                    </button>

                    <DeleteButton
                      disabled={isDeletingHabit}
                      onClick={() => {
                        const confirmed = window.confirm(`Delete habit "${habit.title}"?`)
                        if (!confirmed) return
                        deleteHabit({ habitId: habit.id })
                      }}
                      aria-label={`Delete ${habit.title}`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {data.mistakes.length > 0 && (
        <section className="space-y-4 border-t border-border-subtle pt-8" aria-labelledby="recovery-ledger-heading">
          <div className="flex items-center justify-between border-b border-border-subtle pb-2">
            <div>
              <h2 id="recovery-ledger-heading" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Reconciliation & Recovery
              </h2>
            </div>
            <span className="text-xs font-mono text-text-tertiary">
              Tokens: <span className="tabular-nums font-medium text-text-primary">{data.healTokensRemaining}/5</span>
            </span>
          </div>

          <p className="text-xs font-sans text-text-secondary">
            Streak breaks are natural friction points. Identify root reasons, define next-step commitments, and heal breaks with intentionality.
          </p>

          <div className="divide-y divide-border-subtle/50">
            {data.mistakes.slice(0, 4).map((mistake) => {
              const reasonDraft = mistakeReasonDrafts[mistake.id] ?? mistake.reason ?? ''
              const recoveryDraft = recoveryDrafts[mistake.id] ?? mistake.recovery_commitment ?? ''
              const healDraft = healReasonDrafts[mistake.id] ?? ''

              return (
                <div key={mistake.id} className="py-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base text-text-primary font-medium">
                        {mistake.habitTitle}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-text-tertiary">
                        Interrupted: {formatIndiaDate(mistake.break_date)}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                        mistake.isHealed
                          ? 'border-threat-healthy/50 bg-threat-healthy/15 text-threat-healthy'
                          : 'border-threat-warning/50 bg-threat-warning/15 text-threat-warning'
                      }`}
                    >
                      {mistake.isHealed ? 'Reconciled' : 'Open Break'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                    <div>
                      <label className="block text-text-secondary mb-1">
                        Break reason / Blocker
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={reasonDraft}
                          onChange={(e) =>
                            setMistakeReasonDrafts((prev) => ({ ...prev, [mistake.id]: e.target.value }))
                          }
                          placeholder="Why did rhythm break?"
                          className="w-full bg-background border border-border-subtle rounded-sm px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateBreakReason({
                              breakId: mistake.id,
                              reason: reasonDraft,
                            })
                          }
                          disabled={isUpdatingBreakReason}
                          className="px-2 py-1 text-xs font-sans border border-border-subtle rounded-sm hover:border-border text-text-secondary hover:text-text-primary whitespace-nowrap"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-text-secondary mb-1">
                        Recovery commitment
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={recoveryDraft}
                          onChange={(e) =>
                            setRecoveryDrafts((prev) => ({ ...prev, [mistake.id]: e.target.value }))
                          }
                          placeholder="Next actionable step..."
                          className="w-full bg-background border border-border-subtle rounded-sm px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateRecoveryCommitment({
                              breakId: mistake.id,
                              recoveryCommitment: recoveryDraft,
                            })
                          }
                          disabled={isUpdatingRecoveryCommitment}
                          className="px-2 py-1 text-xs font-sans border border-border-subtle rounded-sm hover:border-border text-text-secondary hover:text-text-primary whitespace-nowrap"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-mono text-text-tertiary mr-1">Quick Blockers:</span>
                    {recoveryPromptChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setMistakeReasonDrafts((prev) => ({ ...prev, [mistake.id]: chip }))
                        }
                        className="px-2 py-0.5 text-[11px] font-sans rounded-sm border border-border-subtle text-text-tertiary hover:text-text-secondary hover:border-border transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {!mistake.isHealed && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={healDraft}
                        onChange={(e) =>
                          setHealReasonDrafts((prev) => ({ ...prev, [mistake.id]: e.target.value }))
                        }
                        placeholder="Reason to apply heal token..."
                        className="max-w-xs bg-background border border-border-subtle rounded-sm px-2.5 py-1 text-xs text-text-primary focus:outline-none focus:border-border"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          healBreak({
                            breakId: mistake.id,
                            habitId: mistake.habit_id,
                            reason: healDraft,
                          })
                        }
                        disabled={isHealingBreak || data.healTokensRemaining <= 0}
                        className="px-3 py-1 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors disabled:opacity-40"
                      >
                        {isHealingBreak ? 'Healing...' : 'Apply Heal Token'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {undoToast && (
        <aside
          aria-live="polite"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-2.5 rounded-sm border border-border bg-background shadow-2xl text-xs font-sans text-text-primary"
        >
          <span>
            Completed <strong className="font-medium">{undoToast.habitTitle}</strong>
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="font-mono text-accent-primary hover:underline underline-offset-4 font-medium"
          >
            [ Undo ({undoRemainingSeconds}s) ]
          </button>
        </aside>
      )}

      <HabitCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={title}
        setTitle={setTitle}
        habitType={habitType}
        setHabitType={setHabitType}
        targetValue={targetValue}
        setTargetValue={setTargetValue}
        unit={unit}
        setUnit={setUnit}
        onSubmit={handleCreateHabit}
        isCreating={isCreatingHabit}
        createError={createHabitError}
      />

      <HabitCalendarModal
        isOpen={Boolean(calendarHabitId)}
        onClose={() => setCalendarHabitId(null)}
        selectedHabit={selectedHabit}
        calendarCountInput={calendarCountInput}
        setCalendarCountInput={setCalendarCountInput}
        onSetCalendarCount={handleSetCalendarCount}
        isSettingCount={isSettingCount}
        setCountError={setCountError}
        calendarFilters={calendarFilters}
        setCalendarFilters={setCalendarFilters}
        calendarMonth={calendarMonth}
        setCalendarMonth={setCalendarMonth}
        monthCells={monthCells}
        calendarHealDates={calendarHealDates}
        calendarBreakDates={calendarBreakDates}
        calendarCompletionDates={calendarCompletionDates}
        logValueByHabitDate={data.logValueByHabitDate}
      />

      <RecentMistakesModal
        isOpen={isRecentMistakesOpen}
        onClose={() => setIsRecentMistakesOpen(false)}
        mistakes={recentFiveDayMistakes}
      />
    </div>
  )
}

export default HabitsPage
