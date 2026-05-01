import { useEffect, useMemo, useRef } from 'react'

import { useEventsAnalytics } from '../../../lib/useEventsAnalytics'
import { useEventBus } from '../../../store/useEventBus'
import {
  useChallenges,
  useCreatePersonalSkill,
  useIncreasePersonalSkillProgress,
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

function buildSparkline(values: number[]) {
  const max = Math.max(1, ...values)
  return values.map((value) => Math.max(16, Math.round((Math.max(0, value) / max) * 100)))
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
  const recentEvents = useEventBus((state) => state.recentEvents)
  const { mutate: increasePersonalProgress } = useIncreasePersonalSkillProgress()
  const { mutate: createPersonalSkill } = useCreatePersonalSkill()
  const processedEventIdsRef = useRef<Set<string>>(new Set())
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

  const momentumSpark = buildSparkline([
    eventsAnalytics?.lastWeekEvents ?? 0,
    eventsAnalytics?.thisWeekEvents ?? 0,
    eventsAnalytics?.activeDaysThisWeek ?? 0,
    activeChallenges,
    completedChallenges,
  ])
  const physicalDisciplineSkill = useMemo(
    () => personalSkills.find((skill) => skill.skill_name.toLowerCase() === 'physical discipline'),
    [personalSkills],
  )
  const academicsSkill = useMemo(
    () =>
      personalSkills.find(
        (skill) =>
          skill.skill_name.toLowerCase().includes('academics')
          || skill.skill_name.toLowerCase().includes('programming'),
      ),
    [personalSkills],
  )

  useEffect(() => {
    if (recentEvents.length === 0) {
      return
    }

    for (const event of [...recentEvents].reverse()) {
      if (processedEventIdsRef.current.has(event.id)) {
        continue
      }

      processedEventIdsRef.current.add(event.id)

      if (event.type === 'DEEP_WORK_COMPLETED') {
        if (academicsSkill) {
          increasePersonalProgress({
            id: academicsSkill.id,
            currentProgress: academicsSkill.progress_percent,
          })
        } else {
          createPersonalSkill({
            skillName: 'Academics',
            domain: 'Academics',
            proficiencyLevel: 'Beginner',
          })
        }
      }

      if (event.type === 'WORKOUT_COMPLETED') {
        if (physicalDisciplineSkill) {
          increasePersonalProgress({
            id: physicalDisciplineSkill.id,
            currentProgress: physicalDisciplineSkill.progress_percent,
          })
        } else {
          createPersonalSkill({
            skillName: 'Physical Discipline',
            domain: 'Productivity',
            proficiencyLevel: 'Beginner',
          })
        }
      }
    }
  }, [recentEvents, academicsSkill, physicalDisciplineSkill, increasePersonalProgress, createPersonalSkill])

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <article className="min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Programming Skills</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(programmingSkills.length, skillsLoading, skillsError)}
          </p>
        </article>

        <article className="min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Personal Skills</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(personalSkills.length, personalLoading, personalError)}
          </p>
        </article>

        <article className="min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Pending Milestones</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(pendingMilestones, milestonesLoading, milestonesError)}
          </p>
        </article>

        <article className="min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Active Challenges</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(activeChallenges, challengesLoading, challengesError)}
          </p>
        </article>

        <article className="min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Completion</p>
          <p className="mt-2 text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
            {formatMetric(`${completionPercent}%`, challengesLoading, challengesError)}
          </p>
        </article>

        <article className="col-span-2 min-h-[110px] rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 sm:col-span-1">
          <p className="text-xs text-[#a1a1aa] sm:text-sm">Weekly Momentum</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xl font-semibold text-[#f1f5f9] sm:text-2xl">
              {formatMetric(
                `${eventsAnalytics?.weeklyMomentumDelta && eventsAnalytics.weeklyMomentumDelta > 0 ? '+' : ''}${eventsAnalytics?.weeklyMomentumDelta ?? 0}`,
                eventsLoading,
                eventsError,
              )}
            </p>
            <div className="flex items-end gap-1">
              {momentumSpark.map((height, index) => (
                <span key={`momentum-spark-${index}`} className="w-1.5 rounded-sm bg-emerald-500/70" style={{ height: `${height * 0.2}px` }} />
              ))}
            </div>
          </div>
          <p className="mt-1 text-xs text-[#a1a1aa]">
            {eventsLoading ? '--' : `${eventsAnalytics?.thisWeekEvents ?? 0} events this week`}
          </p>
        </article>
      </div>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
        <p className="text-sm text-[#a1a1aa]">Motivational Cue</p>
        <p className="mt-2 text-base text-[#f1f5f9]">{quote}</p>
      </article>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-3">
        <p className="text-sm font-semibold text-slate-100">Live Skill Progress</p>
        <div className="mt-3 space-y-2">
          {personalSkills.slice(0, 5).map((skill) => (
            <div key={skill.id}>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>{skill.skill_name}</span>
                <span>{skill.progress_percent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-900">
                <div className="h-full bg-emerald-700" style={{ width: `${skill.progress_percent}%` }} />
              </div>
            </div>
          ))}
          {personalSkills.length === 0 ? <p className="text-xs text-slate-400">No personal skills yet.</p> : null}
        </div>
      </article>
    </section>
  )
}

export default ProgressHubDashboard
