import type { CurrentDaySnapshot, DirectiveDomain, DirectiveResult, UrgencyScores } from './types'
import { isPastWednesdayInIndia } from './timeUtils'

const FALLBACK_DIRECTIVE = {
  action: 'habit' as const,
  label: 'Start your first habit',
  reason: 'Build your baseline system momentum',
  route: '/mind-os/habits',
}

function sanitizeCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.floor(value))
}

function buildUrgencyScores(snapshot: CurrentDaySnapshot): UrgencyScores {
  const pendingTasks = sanitizeCount(snapshot.pending_tasks_count)
  const activeHabits = sanitizeCount(snapshot.total_active_habits)
  const completedHabitsToday = sanitizeCount(snapshot.habits_completed_today)
  const workoutDaysThisWeek = sanitizeCount(snapshot.workout_days_this_week)
  const deepWorkMinutesToday = sanitizeCount(snapshot.deep_work_minutes_today)
  const unfinishedHabits = Math.max(0, activeHabits - completedHabitsToday)

  const isCoachModeFitnessOverride = workoutDaysThisWeek === 0 && isPastWednesdayInIndia()

  return {
    task: pendingTasks * 2,
    habit: unfinishedHabits * 2,
    journal: snapshot.journal_logged_today ? 0 : 5,
    fitness: isCoachModeFitnessOverride ? 100 : workoutDaysThisWeek < 2 ? 3 : 0,
    deep_work: deepWorkMinutesToday === 0 ? 6 : deepWorkMinutesToday < 60 ? 4 : 0,
    learning: snapshot.active_roadmaps_count > 0 && snapshot.learning_sessions_logged_7d === 0 ? 5 : 0,
  }
}

function getTopDomain(urgency: UrgencyScores): DirectiveDomain {
  const orderedDomains: Array<Exclude<DirectiveDomain, 'none'>> = [
    'task',
    'habit',
    'journal',
    'deep-work',
    'learning',
    'fitness',
  ]
  const topEntry = orderedDomains
    .map((domain) => [domain, urgency[domain === 'deep-work' ? 'deep_work' : domain]] as const)
    .sort((left, right) => right[1] - left[1])[0]

  if (!topEntry) {
    return 'none'
  }

  return topEntry[0]
}

function buildDirective(snapshot: CurrentDaySnapshot, topDomain: DirectiveDomain) {
  if (topDomain === 'task') {
    const title = snapshot.oldest_pending_task_title?.trim()
    return {
      action: 'task' as const,
      label: title ? `Complete task: ${title}` : 'Complete your oldest pending task',
      reason: 'Reduce backlog pressure and unlock flow',
      route: '/productivity-hub/tasks',
    }
  }

  if (topDomain === 'habit') {
    const title = snapshot.newest_active_habit_title?.trim()
    return {
      action: 'habit' as const,
      label: title ? `Start habit: ${title}` : 'Mark one active habit done',
      reason: 'Restore consistency in your core routines',
      route: '/mind-os/habits',
    }
  }

  if (topDomain === 'journal') {
    return {
      action: 'journal' as const,
      label: 'Log a journal entry',
      reason: 'Reset your mental clarity',
      route: '/mind-os/journal',
    }
  }

  if (topDomain === 'fitness') {
    if (sanitizeCount(snapshot.workout_days_this_week) === 0 && isPastWednesdayInIndia()) {
      return {
        action: 'fitness' as const,
        label: 'Execution is slipping. Start a Calisthenics session right now.',
        reason: 'No workout logged this week and the week is already past Wednesday',
        route: '/fitness-os/workouts',
      }
    }

    return {
      action: 'fitness' as const,
      label: 'Start a 10 min workout',
      reason: 'Re-activate physical momentum this week',
      route: '/fitness-os/workouts',
    }
  }

  if (topDomain === 'deep-work') {
    const deepWorkMinutesToday = sanitizeCount(snapshot.deep_work_minutes_today)
    if (deepWorkMinutesToday <= 0) {
      return {
        action: 'deep-work' as const,
        label: 'Start a 30-minute focus session',
        reason: 'Zero deep work logged today',
        route: '/time-os',
      }
    }

    return {
      action: 'deep-work' as const,
      label: 'Run one more 30-minute focus session',
      reason: `Deep work is only ${deepWorkMinutesToday} mins today`,
      route: '/time-os',
    }
  }

  if (topDomain === 'learning') {
    return {
      action: 'learning' as const,
      label: 'Log a learning session',
      reason: 'No learning activity in the last 7 days',
      route: '/learning-os',
    }
  }

  return FALLBACK_DIRECTIVE
}

export function generateDirectives(snapshot: CurrentDaySnapshot | null | undefined): DirectiveResult {
  if (!snapshot) {
    return {
      action: FALLBACK_DIRECTIVE.action,
      label: FALLBACK_DIRECTIVE.label,
      reason: FALLBACK_DIRECTIVE.reason,
      route: FALLBACK_DIRECTIVE.route,
      topDomain: 'none',
      urgency: {
        task: 0,
        habit: 0,
        journal: 0,
        fitness: 0,
        deep_work: 0,
        learning: 0,
      },
    }
  }

  const urgency = buildUrgencyScores(snapshot)
  const topDomain = getTopDomain(urgency)
  const maxUrgency = Math.max(
    urgency.task,
    urgency.habit,
    urgency.journal,
    urgency.fitness,
    urgency.deep_work,
    urgency.learning,
  )

  if (maxUrgency <= 0) {
    return {
      action: FALLBACK_DIRECTIVE.action,
      label: FALLBACK_DIRECTIVE.label,
      reason: FALLBACK_DIRECTIVE.reason,
      route: FALLBACK_DIRECTIVE.route,
      topDomain: 'none',
      urgency,
    }
  }

  const directive = buildDirective(snapshot, topDomain)

  return {
    action: directive.action,
    label: directive.label,
    reason: directive.reason,
    route: directive.route,
    topDomain,
    urgency,
  }
}
