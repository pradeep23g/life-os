import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useFitnessWeeklySummary } from '../../fitness-os/api/useFitness'
import { useHabitWorkspace } from '../../mind-os/api/useHabits'
import { useJournal } from '../../mind-os/api/useJournal'
import { useChallenges, useMilestones } from '../../progress-hub/api/useProgress'
import { useTasks } from '../../productivity-hub/api/useTasks'
import SystemStatusCard from '../../system/components/SystemStatusCard'

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
  const {
    data: eventsAnalytics,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useEventsAnalytics()
  const {
    data: fitnessSummary,
    isLoading: fitnessLoading,
    isError: fitnessError,
  } = useFitnessWeeklySummary()

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
      detail: !habitsLoading && !habitsError ? longestHabitStreak?.title ?? 'No streaks yet' : '',
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
      detail: !progressLoading && !progressError ? `${pendingMilestones} Pending - ${completionPercent}% Complete` : '',
    },
    {
      label: 'Fitness This Week',
      value: formatMetric(`${fitnessSummary?.activeWorkoutDaysThisWeek ?? 0} days`, fitnessLoading, fitnessError),
      detail: !fitnessLoading && !fitnessError ? `${fitnessSummary?.totalSessionMinutesThisWeek ?? 0} min logged` : '',
    },
    {
      label: 'Activity Consistency',
      value: formatMetric(`${eventsAnalytics?.consistencyPercent ?? 0}%`, eventsLoading, eventsError),
      detail: !eventsLoading && !eventsError ? `${eventsAnalytics?.activeDaysThisWeek ?? 0}/7 active days this week` : '',
    },
  ]

  return (
    <section className="space-y-4 bg-[#000000]">
      <SystemStatusCard />

      <header className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h1 className="text-2xl font-semibold text-slate-100">Mission Control</h1>
        <p className="mt-1 text-sm text-slate-300">Live summaries across Life OS modules.</p>
      </header>

      <p className="text-sm font-semibold text-slate-300">System Metrics (Detailed View)</p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-8">
        {stats.map((stat) => (
          <article key={stat.label} className="min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4">
            <p className="text-xs text-slate-300 sm:text-sm">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{stat.value}</p>
            {stat.detail ? <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{stat.detail}</p> : null}
          </article>
        ))}
      </div>
    </section>
  )
}

export default MissionControl
