export type MomentumTrend = 'rising' | 'falling' | 'stable'

export type PositiveSystemEventType =
  | 'DEEP_WORK_COMPLETED'
  | 'WORKOUT_COMPLETED'
  | 'fitness.workout.completed'
  | 'time.session.logged'

export type SystemSignalEvent = {
  type: PositiveSystemEventType | 'WANT_EXPENSE_ADDED' | 'HABIT_FAILED' | 'finance.transaction.created'
  createdAt: string
  payload?: Record<string, unknown>
}

export type CurrentDaySnapshot = {
  user_id: string
  pending_tasks_count: number
  habits_completed_today: number
  total_active_habits: number
  journal_logged_today: boolean
  workout_days_this_week: number
  deep_work_minutes_today: number
  oldest_pending_task_title: string | null
  newest_active_habit_title: string | null
  learning_sessions_logged_7d: number
  active_roadmaps_count: number
  snapshot_date: string
  budget_utilization_percentage: number | null
  recent_want_expenses_count: number
}

export type SystemHistoryDay = {
  user_id: string
  snapshot_date: string
  tasks_completed_count: number
  habits_completed_count: number
  total_active_habits: number
  journal_logged: boolean
  workout_logged: boolean
}

export type MomentumAnalysis = {
  momentum: number
  trend: MomentumTrend
  emaSeries: number[]
}

export type UrgencyScores = {
  task: number
  habit: number
  journal: number
  fitness: number
  deep_work: number
  learning: number
  finance: number
}

export type DirectiveDomain = 'task' | 'habit' | 'journal' | 'fitness' | 'deep-work' | 'learning' | 'finance' | 'none'

export type DirectiveResult = {
  action: DirectiveDomain
  label: string
  reason: string
  route: string
  topDomain: DirectiveDomain
  urgency: UrgencyScores
}

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'

export type DomainSignal = {
  issueText: string
  momentumText: string
  severity: IssueSeverity
  domain: string
}

export type SystemIssue = {
  text: string
  severity: IssueSeverity
}

export type SystemStatus = {
  momentum: MomentumAnalysis
  directive: {
    action: DirectiveDomain
    label: string
    reason: string
    route: string
  }
  issues: SystemIssue[]
  momentumExplanation: string[]
  snapshotDate: string | null
  topDirectiveDomain: DirectiveDomain
  urgency: UrgencyScores
}
