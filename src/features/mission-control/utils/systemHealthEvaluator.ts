import type { ThreatCard, SystemStatus, SystemStatusLevel } from '../types/snapshot'

// Example raw data inputs for the evaluator
export interface EvaluatorInputs {
  pendingTasksCount: number
  activeHabitsCount: number
  completedHabitsCount: number
  deepWorkMinutes: number
  workoutCompleted: boolean
  financeAvailable: number
  financeSpent: number
  activeChallengesCount: number
  completedChallengesCount: number
  consistencyPercent: number
}

export function evaluateSystemThreats(inputs: EvaluatorInputs): ThreatCard[] {
  const threats: ThreatCard[] = []

  // Task Backlog Threat
  if (inputs.pendingTasksCount >= 10) {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'critical', value: `${inputs.pendingTasksCount} Pending` })
  } else if (inputs.pendingTasksCount >= 5) {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'warning', value: `${inputs.pendingTasksCount} Pending` })
  } else {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'healthy', value: `${inputs.pendingTasksCount} Pending` })
  }

  // Deep Work Threat
  if (inputs.deepWorkMinutes === 0) {
    threats.push({ id: 'deep-work', label: 'Deep Work', severity: 'warning', value: '0 Minutes' })
  } else {
    threats.push({ id: 'deep-work', label: 'Deep Work', severity: 'healthy', value: `${inputs.deepWorkMinutes} Minutes` })
  }

  // Fitness Threat
  if (inputs.workoutCompleted) {
    threats.push({ id: 'fitness', label: 'Fitness', severity: 'healthy', value: 'Completed' })
  } else {
    threats.push({ id: 'fitness', label: 'Fitness', severity: 'warning', value: 'Pending' })
  }

  // Habits Threat
  const habitRatio = inputs.activeHabitsCount > 0 ? inputs.completedHabitsCount / inputs.activeHabitsCount : 1
  if (habitRatio < 0.5 && inputs.activeHabitsCount > 0) {
    threats.push({ id: 'habits', label: 'Habits', severity: 'warning', value: `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount}` })
  } else {
    threats.push({ id: 'habits', label: 'Habits', severity: 'healthy', value: `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount}` })
  }

  // Sort threats by severity: critical > warning > healthy
  const severityScore = { critical: 3, warning: 2, healthy: 1 }
  return threats.sort((a, b) => severityScore[b.severity] - severityScore[a.severity])
}

export function evaluateSystemStatuses(inputs: EvaluatorInputs): SystemStatus[] {
  const statuses: SystemStatus[] = []

  // Mind OS
  const habitRatio = inputs.activeHabitsCount > 0 ? inputs.completedHabitsCount / inputs.activeHabitsCount : 1
  let mindStatus: SystemStatusLevel = 'Healthy'
  if (habitRatio < 0.5) mindStatus = 'Needs Input'
  if (habitRatio === 0 && inputs.activeHabitsCount > 0) mindStatus = 'Warning'

  statuses.push({
    id: 'mind-os',
    name: 'Mind OS',
    status: mindStatus,
    activity: `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount} habits`,
  })

  // Time OS
  let timeStatus: SystemStatusLevel = 'Healthy'
  if (inputs.deepWorkMinutes === 0) timeStatus = 'Needs Input'

  statuses.push({
    id: 'time-os',
    name: 'Time OS',
    status: timeStatus,
    activity: `${inputs.deepWorkMinutes} mins deep work`,
  })

  // Fitness OS
  statuses.push({
    id: 'fitness-os',
    name: 'Fitness OS',
    status: inputs.workoutCompleted ? 'Healthy' : 'Needs Input',
    activity: inputs.workoutCompleted ? 'Workout completed' : 'Pending workout',
  })

  // Finance OS
  let financeStatus: SystemStatusLevel = 'Healthy'
  const progressPercent = inputs.financeAvailable > 0 ? (inputs.financeSpent / inputs.financeAvailable) * 100 : 0
  if (progressPercent > 90) financeStatus = 'Critical'
  else if (progressPercent > 75) financeStatus = 'Warning'

  statuses.push({
    id: 'finance-os',
    name: 'Finance OS',
    status: financeStatus,
    activity: `${progressPercent.toFixed(0)}% budget used`,
  })

  // Progress Hub
  statuses.push({
    id: 'progress-hub',
    name: 'Progress Hub',
    status: 'Healthy',
    activity: `${inputs.activeChallengesCount} active challenges`,
  })

  // Mission Control
  statuses.push({
    id: 'mission-control',
    name: 'Mission Control',
    status: inputs.consistencyPercent > 70 ? 'Healthy' : 'Warning',
    activity: `${inputs.consistencyPercent.toFixed(0)}% consistency`,
  })

  return statuses
}
