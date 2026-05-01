import { useMemo } from 'react'

import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useHabitWorkspace } from '../api/useHabits'
import { getJournalStreak, useJournalEntries } from '../api/useJournal'
import { formatIndiaDate, formatIndiaDateTime, toIndiaDateKey } from '../utils/date'

function average(values: number[]) {
  if (values.length === 0) {
    return null
  }

  return (values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)
}

function buildSparkline(values: number[], maxValue: number) {
  return values.map((value) => Math.max(15, Math.min(100, Math.round((value / Math.max(1, maxValue)) * 100))))
}

function MindOsDashboard() {
  const { data: habitData, isLoading: habitsLoading } = useHabitWorkspace()
  const { data: journals = [], isLoading: journalsLoading } = useJournalEntries()
  const { data: eventsAnalytics, isLoading: eventsLoading } = useEventsAnalytics()

  const latestJournal = journals[0]
  const journalStreak = journalsLoading ? '--' : String(getJournalStreak(journals))

  const completionDates = useMemo(() => {
    if (!habitData) {
      return new Set<string>()
    }

    const set = new Set<string>()
    const habitById = new Map(habitData.habits.map((habit) => [habit.id, habit]))

    for (const log of habitData.logs) {
      const habit = habitById.get(log.habit_id)

      if (!habit) {
        continue
      }

      const isCompletion = habit.habit_type === 'target' ? log.value >= habit.target_value : log.value >= 1

      if (isCompletion) {
        set.add(log.log_date)
      }
    }

    return set
  }, [habitData])

  const breakDates = useMemo(() => {
    if (!habitData) {
      return new Set<string>()
    }

    return new Set(habitData.breaks.map((breakItem) => breakItem.break_date))
  }, [habitData])

  const doneOnlyDates = useMemo(
    () => new Set([...completionDates].filter((dateKey) => !breakDates.has(dateKey))),
    [breakDates, completionDates],
  )
  const breakOnlyDates = useMemo(() => new Set([...breakDates].filter((dateKey) => !completionDates.has(dateKey))), [breakDates, completionDates])

  const doneOnlyMoods = journals.filter((entry) => doneOnlyDates.has(toIndiaDateKey(entry.created_at))).map((entry) => entry.mood)
  const breakOnlyMoods = journals.filter((entry) => breakOnlyDates.has(toIndiaDateKey(entry.created_at))).map((entry) => entry.mood)
  const doneOnlyMoodAverage = average(doneOnlyMoods)
  const breakOnlyMoodAverage = average(breakOnlyMoods)
  const doneOnlyJournalDays = new Set(journals.filter((entry) => doneOnlyDates.has(toIndiaDateKey(entry.created_at))).map((entry) => toIndiaDateKey(entry.created_at))).size
  const breakOnlyJournalDays = new Set(journals.filter((entry) => breakOnlyDates.has(toIndiaDateKey(entry.created_at))).map((entry) => toIndiaDateKey(entry.created_at))).size
  const recentMoodSpark = buildSparkline(journals.slice(0, 5).reverse().map((entry) => entry.mood), 5)
  const consistencySpark = buildSparkline(
    [habitData?.healTokensRemaining ?? 0, habitData?.healsUsedThisMonth ?? 0, habitData?.habits.length ?? 0, habitData?.mistakes.length ?? 0, habitData?.logs.length ?? 0],
    Math.max(1, habitData?.logs.length ?? 1),
  )

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-slate-900 p-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">Core Signals</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          <article className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400 sm:text-sm">Active Habits</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{habitsLoading ? '--' : habitData?.habits.length ?? 0}</p>
          </article>

          <article className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400 sm:text-sm">Longest Habit Streak</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">
              {habitsLoading ? '--' : `${habitData?.longestHabitStreak?.streak ?? 0} days`}
            </p>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{habitData?.longestHabitStreak?.title ?? 'No streaks yet'}</p>
          </article>

          <article className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400 sm:text-sm">Journal Entries</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{journalsLoading ? '--' : journals.length}</p>
          </article>

          <article className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="text-xs text-slate-400 sm:text-sm">Journal Streak</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{journalStreak} days</p>
            <div className="mt-2 flex items-end gap-1">
              {recentMoodSpark.map((height, index) => (
                <span key={`mood-spark-${index}`} className="w-1.5 rounded-sm bg-slate-500/70" style={{ height: `${height * 0.26}px` }} />
              ))}
            </div>
          </article>

          <article className="col-span-2 min-h-[110px] rounded-xl border border-slate-700 bg-slate-950/70 p-3 lg:col-span-1">
            <p className="text-xs text-slate-400 sm:text-sm">Consistency Pulse</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{eventsLoading ? '--' : `${eventsAnalytics?.consistencyPercent ?? 0}%`}</p>
            <p className="mt-1 text-xs text-slate-400">{eventsLoading ? 'Loading...' : `${eventsAnalytics?.activeDaysThisWeek ?? 0}/7 active days this week`}</p>
            <div className="mt-2 flex items-end gap-1">
              {consistencySpark.map((height, index) => (
                <span key={`consistency-spark-${index}`} className="w-1.5 rounded-sm bg-emerald-500/70" style={{ height: `${height * 0.26}px` }} />
              ))}
            </div>
          </article>
        </div>
      </article>

      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Recovery And Risk</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <article className="min-h-[140px] rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4">
            <p className="text-xs text-slate-400 sm:text-sm">Heal Token Status</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{habitData?.healTokensRemaining ?? '--'} / 5</p>
            {habitData?.lowHealTokenWarning ? (
              <p className="mt-2 rounded-md border border-amber-500/70 bg-amber-500/20 px-2 py-1 text-xs text-amber-200">
                Low token warning
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Healthy token reserve</p>
            )}
          </article>

          <article className="min-h-[140px] rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4">
            <p className="text-xs text-slate-400 sm:text-sm">Recent Mistake</p>
            {habitData?.recentMistake ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-100">{habitData.recentMistake.habitTitle}</p>
                <p className="mt-1 text-xs text-slate-400">{formatIndiaDate(habitData.recentMistake.break_date)}</p>
                <p className="mt-1 text-xs text-slate-300">{habitData.recentMistake.reason || 'No reason added.'}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No streak losses yet.</p>
            )}
          </article>

          <article className="col-span-2 min-h-[140px] rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4 lg:col-span-1">
            <p className="text-xs text-slate-400 sm:text-sm">Recent Streak Heal</p>
            {habitData?.recentHeal ? (
              <>
                <p className="mt-2 text-sm font-semibold text-slate-100">{habitData.recentHeal.habitTitle}</p>
                <p className="mt-1 text-xs text-slate-400">{formatIndiaDateTime(habitData.recentHeal.created_at)}</p>
                <p className="mt-1 text-xs text-slate-300">{habitData.recentHeal.reason || 'No reason added.'}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No heals yet.</p>
            )}
          </article>
        </div>
      </article>

      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Insight And Reflection</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4 lg:col-span-2">
            <p className="text-xs text-slate-400 sm:text-sm">Streak Insight</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-md border border-slate-700 bg-slate-900 p-2">
                <p className="text-slate-400">Best this week</p>
                <p className="mt-1 font-semibold text-slate-100">{habitData?.bestHabitThisWeek?.title ?? 'No data'}</p>
                <p className="text-slate-400">{habitData?.bestHabitThisWeek?.count ?? 0} days</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900 p-2">
                <p className="text-slate-400">Most healed</p>
                <p className="mt-1 font-semibold text-slate-100">{habitData?.mostHealedHabit?.title ?? 'No data'}</p>
                <p className="text-slate-400">{habitData?.mostHealedHabit?.count ?? 0} heals</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900 p-2">
                <p className="text-slate-400">Most broken</p>
                <p className="mt-1 font-semibold text-slate-100">{habitData?.mostBrokenHabit?.title ?? 'No data'}</p>
                <p className="text-slate-400">{habitData?.mostBrokenHabit?.count ?? 0} breaks</p>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4">
            <p className="text-xs text-slate-400 sm:text-sm">Latest Reflection</p>
            <p className="mt-2 text-sm text-slate-200">
              {latestJournal?.what_went_good || latestJournal?.what_you_learned || latestJournal?.brief_about_day || 'No reflections yet.'}
            </p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-slate-950/70 p-3 sm:p-4 lg:col-span-3">
            <p className="text-xs text-slate-400 sm:text-sm">Journal-Habit Correlation (All Time)</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-md border border-slate-700 bg-slate-900 p-2">
                <p className="text-xs text-slate-400">Done-only days mood</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{doneOnlyMoodAverage ? `${doneOnlyMoodAverage} / 5` : '--'}</p>
                <p className="text-xs text-slate-400">{doneOnlyJournalDays} journal days in this group</p>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900 p-2">
                <p className="text-xs text-slate-400">Break-only days mood</p>
                <p className="mt-1 text-lg font-semibold text-slate-100">{breakOnlyMoodAverage ? `${breakOnlyMoodAverage} / 5` : '--'}</p>
                <p className="text-xs text-slate-400">{breakOnlyJournalDays} journal days in this group</p>
              </div>
            </div>
            {!doneOnlyMoodAverage || !breakOnlyMoodAverage ? (
              <p className="mt-2 text-xs text-slate-400">Not enough journal data yet to fully compare both groups.</p>
            ) : null}
          </article>
        </div>
      </article>
    </section>
  )
}

export default MindOsDashboard
