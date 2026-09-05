import type { CurrentDaySnapshot, DomainSignal } from './types'
import { isPastWednesdayInIndia } from './timeUtils'

export function getMindOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []

  if (snapshot.total_active_habits <= 0) {
    signals.push({
      issueText: 'No habits active',
      momentumText: 'No habits active',
      severity: 'critical',
      domain: 'mind-os',
    })
  } else if (snapshot.habits_completed_today <= 0) {
    signals.push({
      issueText: 'Habit system inactive today',
      momentumText: 'No habit completed today',
      severity: 'low',
      domain: 'mind-os',
    })
  }

  if (!snapshot.journal_logged_today) {
    signals.push({
      issueText: 'Low awareness: journal not logged today',
      momentumText: 'Journal reflection missing today',
      severity: 'medium',
      domain: 'mind-os',
    })
  }

  return signals
}

export function getExecutionOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []
  const pendingCount = snapshot.pending_tasks_count

  if (pendingCount > 0) {
    signals.push({
      issueText: `${pendingCount} pending tasks`,
      momentumText: pendingCount > 1
        ? `${pendingCount} pending tasks remain`
        : 'Only 1 task in progress',
      severity: 'high',
      domain: 'execution-tasks',
    })
  }

  return signals
}

export function getFitnessOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []

  if (snapshot.workout_days_this_week < 2) {
    signals.push({
      issueText: 'Low physical activity this week',
      momentumText: 'Physical consistency is below target',
      severity: 'low',
      domain: 'fitness-os',
    })
  }

  if (snapshot.workout_days_this_week === 0 && isPastWednesdayInIndia()) {
    signals.push({
      issueText: 'Execution is slipping: no workouts logged yet this week',
      momentumText: 'No workouts logged and the week is already past Wednesday',
      severity: 'high',
      domain: 'fitness-os',
    })
  }

  return signals
}

export function getTimeOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []
  const deepWorkMinutes = snapshot.deep_work_minutes_today

  if (deepWorkMinutes < 60) {
    signals.push({
      issueText: `Low deep work today (${deepWorkMinutes} mins)`,
      momentumText: `Deep work is below target (${deepWorkMinutes} mins)`,
      severity: 'low',
      domain: 'time-os',
    })
  }

  return signals
}

export function getLearningOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []

  if (snapshot.active_roadmaps_count > 0 && snapshot.learning_sessions_logged_7d === 0) {
    signals.push({
      issueText: 'No learning activity in the last 7 days',
      momentumText: 'Learning momentum has stalled',
      severity: 'high',
      domain: 'learning-os',
    })
  }

  return signals
}

export function getFinanceOSSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  const signals: DomainSignal[] = []

  if (snapshot.budget_utilization_percentage !== null && Number.isFinite(snapshot.budget_utilization_percentage)) {
    if (snapshot.budget_utilization_percentage > 90) {
      signals.push({
        issueText: 'Critical budget pressure',
        momentumText: 'Budget utilization is over 90%',
        severity: 'critical',
        domain: 'finance-os',
      })
    } else if (snapshot.budget_utilization_percentage > 75) {
      signals.push({
        issueText: 'High budget utilization',
        momentumText: 'Budget utilization is over 75%',
        severity: 'high',
        domain: 'finance-os',
      })
    }
  }

  if (snapshot.recent_want_expenses_count > 3) {
    signals.push({
      issueText: 'High discretionary spending detected',
      momentumText: 'Recent spike in want-spending',
      severity: 'medium',
      domain: 'finance-os',
    })
  }

  return signals
}
