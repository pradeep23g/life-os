import type { CurrentDaySnapshot, DirectiveDomain, DirectiveResult, UrgencyScores } from './types'

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
  const unfinishedHabits = Math.max(0, activeHabits - completedHabitsToday)

  return {
    task: pendingTasks * 2,
    habit: unfinishedHabits * 2,
    journal: snapshot.journal_logged_today ? 0 : 5,
    fitness: workoutDaysThisWeek < 2 ? 3 : 0,
  }
}

function getTopDomain(urgency: UrgencyScores): DirectiveDomain {
  const topEntry = Object.entries(urgency)
    .sort((left, right) => right[1] - left[1])[0]

  if (!topEntry) {
    return 'none'
  }

  return topEntry[0] as Exclude<DirectiveDomain, 'none'>
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
    return {
      action: 'fitness' as const,
      label: 'Start a 10 min workout',
      reason: 'Re-activate physical momentum this week',
      route: '/fitness-os/workouts',
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
      },
    }
  }

  const urgency = buildUrgencyScores(snapshot)
  const topDomain = getTopDomain(urgency)
  const maxUrgency = Math.max(urgency.task, urgency.habit, urgency.journal, urgency.fitness)

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
