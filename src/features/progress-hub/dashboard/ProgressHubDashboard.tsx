import { useMemo } from 'react'

import {
  useChallenges,
  useMilestones,
  usePersonalSkills,
  useProgrammingSkills,
} from '../api/useProgress'

const quotes = [
  'Small wins compound into long-term mastery.',
  'Consistency is the quiet engine behind progress.',
  'Aim for clarity of action, not intensity of mood.',
  'You are building systems, not chasing streaky motivation.',
  'Progress is measured in repetitions of the right behavior.',
]

function formatMetric(value: string | number, isLoading: boolean, hasError: boolean) {
  if (isLoading) {
    return '--'
  }

  if (hasError) {
    return 'N/A'
  }

  return value
}

function ProgressHubDashboard() {
  const {
    data: programmingSkills = [],
    isLoading: skillsLoading,
    isError: skillsError,
  } = useProgrammingSkills()
  const {
    data: personalSkills = [],
    isLoading: personalLoading,
    isError: personalError,
  } = usePersonalSkills()
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

  const pendingMilestones = milestones.filter((milestone) => !milestone.is_completed).length
  const activeChallenges = challenges.filter((challenge) => challenge.status === 'Active').length
  const completedChallenges = challenges.filter((challenge) => challenge.status === 'Completed').length
  const completionPercent = challenges.length ? Math.round((completedChallenges / challenges.length) * 100) : 0

  const quote = useMemo(() => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86_400_000)
    return quotes[dayOfYear % quotes.length]
  }, [])

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        <article className="min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Programming Skills</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(programmingSkills.length, skillsLoading, skillsError)}
          </p>
        </article>

        <article className="min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Personal Skills</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(personalSkills.length, personalLoading, personalError)}
          </p>
        </article>

        <article className="min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Pending Milestones</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(pendingMilestones, milestonesLoading, milestonesError)}
          </p>
        </article>

        <article className="min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Active Challenges</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(activeChallenges, challengesLoading, challengesError)}
          </p>
        </article>

        <article className="col-span-2 min-h-[120px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:p-4 md:col-span-1">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Completion</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(`${completionPercent}%`, challengesLoading, challengesError)}
          </p>
        </article>
      </div>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <p className="text-sm text-[#a1a1aa]">Motivational Cue</p>
        <p className="mt-2 text-base text-[#f1f5f9]">{quote}</p>
      </article>
    </section>
  )
}

export default ProgressHubDashboard
