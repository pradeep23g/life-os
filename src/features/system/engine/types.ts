export type MomentumTrend = 'rising' | 'falling' | 'stable'

export type CurrentDaySnapshot = {
  user_id: string
  pending_tasks_count: number
  habits_completed_today: number
  total_active_habits: number
  journal_logged_today: boolean
  workout_days_this_week: number
  oldest_pending_task_title: string | null
  newest_active_habit_title: string | null
  snapshot_date: string
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
}

export type UrgencyScores = {
  task: number
  habit: number
  journal: number
  fitness: number
}

export type DirectiveDomain = 'task' | 'habit' | 'journal' | 'fitness' | 'none'

export type DirectiveResult = {
  action: DirectiveDomain
  label: string
  reason: string
  route: string
  topDomain: DirectiveDomain
  urgency: UrgencyScores
}

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'

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
