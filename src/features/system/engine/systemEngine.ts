import { analyzeMomentum } from './analyzeMomentum'
import { generateDirectives } from './generateDirectives'
import type { CurrentDaySnapshot, IssueSeverity, SystemHistoryDay, SystemIssue, SystemStatus } from './types'

function getIssueSeverity(issue: string): IssueSeverity {
  if (issue.includes('No habits')) {
    return 'critical'
  }

  if (issue.includes('pending')) {
    return 'high'
  }

  if (issue.includes('journal')) {
    return 'medium'
  }

  return 'low'
}

function detectIssues(snapshot: CurrentDaySnapshot | null | undefined): SystemIssue[] {
  if (!snapshot) {
    return [{ text: 'System snapshot unavailable', severity: 'low' }]
  }

  const issues: string[] = []

  if (snapshot.total_active_habits <= 0) {
    issues.push('No habits active')
  } else if (snapshot.habits_completed_today <= 0) {
    issues.push('Habit system inactive today')
  }

  if (snapshot.pending_tasks_count > 0) {
    issues.push(`${snapshot.pending_tasks_count} pending tasks`)
  }

  if (!snapshot.journal_logged_today) {
    issues.push('Low awareness: journal not logged today')
  }

  if (snapshot.workout_days_this_week < 2) {
    issues.push('Low physical activity this week')
  }

  return issues.map((issue) => ({
    text: issue,
    severity: getIssueSeverity(issue),
  }))
}

function buildMomentumExplanation(snapshot: CurrentDaySnapshot | null | undefined): string[] {
  if (!snapshot) {
    return ['System snapshot unavailable']
  }

  const reasons: string[] = []

  if (snapshot.total_active_habits <= 0) {
    reasons.push('No habits active')
  } else if (snapshot.habits_completed_today <= 0) {
    reasons.push('No habit completed today')
  }

  if (snapshot.pending_tasks_count > 1) {
    reasons.push(`${snapshot.pending_tasks_count} pending tasks remain`)
  } else if (snapshot.pending_tasks_count === 1) {
    reasons.push('Only 1 task in progress')
  }

  if (!snapshot.journal_logged_today) {
    reasons.push('Journal reflection missing today')
  }

  if (snapshot.workout_days_this_week < 2) {
    reasons.push('Physical consistency is below target')
  }

  return reasons.length ? reasons : ['Execution baseline looks stable']
}

export function getSystemStatus(
  snapshot: CurrentDaySnapshot | null | undefined,
  history: SystemHistoryDay[],
): SystemStatus {
  const momentum = analyzeMomentum(history)
  const directiveResult = generateDirectives(snapshot)
  const latestHistoryDate = history.length ? history[history.length - 1].snapshot_date : null

  return {
    momentum,
    directive: {
      action: directiveResult.action,
      label: directiveResult.label,
      reason: directiveResult.reason,
      route: directiveResult.route,
    },
    issues: detectIssues(snapshot),
    momentumExplanation: buildMomentumExplanation(snapshot),
    snapshotDate: snapshot?.snapshot_date ?? latestHistoryDate,
    topDirectiveDomain: directiveResult.topDomain,
    urgency: directiveResult.urgency,
  }
}
