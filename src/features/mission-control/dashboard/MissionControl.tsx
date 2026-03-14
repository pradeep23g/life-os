import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useJournal } from '../../mind-os/api/useJournal'
import { useChallenges, useMilestones } from '../../progress-hub/api/useProgress'
import { useTasks } from '../../productivity-hub/api/useTasks'

function formatMetric(value: string | number, isLoading: boolean, hasError: boolean) {
  if (isLoading) {
    return 'Loading...'
  }

  if (hasError) {
    return 'Unavailable'
  }

  return value
}

function MissionControl() {
  const {
    data: habitData,
    isLoading: habitsLoading,
    isError: habitsError,
  } = useHabitWorkspace()
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
  } = useTasks()
  const {
    data: journals = [],
    isLoading: journalsLoading,
    isError: journalsError,
  } = useJournal()
  const {
    data: milestones = [],
    isLoading: milestonesLoading,
    isError: milestonesError,
  } = useMilestones()
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    isError: challengesError,
  } = useChallenges()

  const activeHabits = habitData?.habits.length ?? 0
  const longestHabitStreak = habitData?.longestHabitStreak
  const pendingTasks = tasks.filter((task) => task.status !== 'Done').length
  const averageMood = journals.length
    ? (journals.reduce((sum, entry) => sum + entry.mood, 0) / journals.length).toFixed(1)
    : '0.0'

  const pendingMilestones = milestones.filter((milestone) => !milestone.is_completed).length
  const activeChallenges = challenges.filter((challenge) => challenge.status === 'Active').length
  const completedChallenges = challenges.filter((challenge) => challenge.status === 'Completed').length
  const completionPercent = challenges.length ? Math.round((completedChallenges / challenges.length) * 100) : 0

  const progressLoading = milestonesLoading || challengesLoading
  const progressError = milestonesError || challengesError

  const stats = [
    {
      label: 'Active Habits',
      value: formatMetric(activeHabits, habitsLoading, habitsError),
    },
    {
      label: 'Longest Habit Streak',
      value: formatMetric(`${longestHabitStreak?.streak ?? 0} days`, habitsLoading, habitsError),
      detail:
        !habitsLoading && !habitsError
          ? longestHabitStreak?.title ?? 'No streaks yet'
          : '',
    },
    {
      label: 'Pending Tasks',
      value: formatMetric(pendingTasks, tasksLoading, tasksError),
    },
    {
      label: 'Journal Entries',
      value: formatMetric(journals.length, journalsLoading, journalsError),
    },
    {
      label: 'Average Mood',
      value: formatMetric(`${averageMood} / 5`, journalsLoading, journalsError),
    },
    {
      label: 'Progress Hub',
      value: formatMetric(`${activeChallenges} Active`, progressLoading, progressError),
      detail: !progressLoading && !progressError ? `${pendingMilestones} Pending • ${completionPercent}% Complete` : '',
    },
  ]

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-slate-700 bg-surface p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Mission Control</h1>
        <p className="mt-1 text-sm text-slate-300">Live summaries across Life OS modules.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-slate-700 bg-surface p-4">
            <p className="text-sm text-slate-300">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{stat.value}</p>
            {stat.detail ? <p className="mt-1 text-xs text-slate-400">{stat.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MissionControl
