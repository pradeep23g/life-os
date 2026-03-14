import { useHabitWorkspace } from '../api/useHabits'
import { getJournalStreak, useJournalEntries } from '../api/useJournal'
import { formatIndiaDate, formatIndiaDateTime } from '../utils/date'

function MindOsDashboard() {
  const { data: habitData, isLoading: habitsLoading } = useHabitWorkspace()
  const { data: journals = [], isLoading: journalsLoading } = useJournalEntries()

  const latestJournal = journals[0]
  const journalStreak = journalsLoading ? '--' : String(getJournalStreak(journals))

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Active Habits</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{habitsLoading ? '--' : habitData?.habits.length ?? 0}</p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Longest Habit Streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">
            {habitsLoading ? '--' : `${habitData?.longestHabitStreak?.streak ?? 0} days`}
          </p>
          <p className="mt-1 text-xs text-slate-400">{habitData?.longestHabitStreak?.title ?? 'No streaks yet'}</p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Journal Entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{journalsLoading ? '--' : journals.length}</p>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Journal Streak</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{journalStreak} days</p>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Recent Mistake</p>
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

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Recent Streak Heal</p>
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

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Latest Reflection</p>
          <p className="mt-2 text-sm text-slate-200">
            {latestJournal?.what_went_good || latestJournal?.what_you_learned || latestJournal?.brief_about_day || 'No reflections yet.'}
          </p>
        </article>
      </div>
    </section>
  )
}

export default MindOsDashboard
