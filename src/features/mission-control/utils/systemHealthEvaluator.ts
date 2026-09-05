import type { ThreatCard, SystemStatus, SystemStatusLevel } from '../types/snapshot'
import type { SystemStatus as BrainSystemStatus } from '../../system/engine/types'
import { toIndiaDateKey } from '../../../lib/events'

export interface DomainPresenceInput {
  mindHabits: boolean
  mindJournal: boolean
  productivityTasks: boolean
  fitness: boolean
  timeTracking: boolean
  learning: boolean
  finance: boolean
}

export interface ConfidenceCalculationInputs {
  snapshotDate: string | null
  historyDaysCount: number
  domainPresence: DomainPresenceInput
}

/**
 * Computes deterministic system intelligence confidence (0 - 100) based on observable data quality.
 *
 * The score communicates how much the user should trust the current Mission Control intelligence:
 *
 * 1. Data Freshness (35% weight):
 *    - 100 pts: Snapshot date matches today's date in Asia/Kolkata timezone.
 *    - 50 pts: Snapshot date is from yesterday (1 day stale).
 *    - 25 pts: Snapshot date is 2-3 days old.
 *    - 10 pts: Snapshot date is > 3 days old.
 *    - 0 pts: No snapshot exists.
 *
 * 2. Data Completeness (35% weight):
 *    - Depth of the 14-day rolling historical snapshot series (current_day_snapshot_history_14d).
 *    - Score = (min(validHistoryDays, 14) / 14) * 100 pts.
 *    - 0 days = 0 pts; 7 days = 50 pts; 14 days = 100 pts.
 *
 * 3. Signal Coverage (30% weight):
 *    - Observable data presence across all 7 active Life OS domains:
 *      1) Mind OS (Habits): Active or completed habits recorded
 *      2) Mind OS (Journal): Journal entries logged
 *      3) Productivity Hub: Tasks created or managed
 *      4) Fitness OS: Workouts or sessions tracked this week
 *      5) Time OS: Deep work or time logs recorded
 *      6) Learning OS: Active or completed roadmaps
 *      7) Finance OS: Budget set or transactions recorded
 *    - Score = (activeDomainCount / 7) * 100 pts.
 *
 * Final Confidence = Math.min(100, Math.max(0, Math.round(freshness * 0.35 + completeness * 0.35 + coverage * 0.30)))
 */
export function computeSystemConfidence(inputs: ConfidenceCalculationInputs): number {
  const { snapshotDate, historyDaysCount, domainPresence } = inputs

  // 1. Data Freshness
  let freshness = 0
  if (snapshotDate) {
    const todayIst = toIndiaDateKey(new Date())
    if (snapshotDate === todayIst) {
      freshness = 100
    } else {
      const todayTime = new Date(`${todayIst}T00:00:00Z`).getTime()
      const snapshotTime = new Date(`${snapshotDate}T00:00:00Z`).getTime()
      const diffDays = Math.round((todayTime - snapshotTime) / (1000 * 60 * 60 * 24))

      if (diffDays <= 0) {
        freshness = 100
      } else if (diffDays === 1) {
        freshness = 50
      } else if (diffDays <= 3) {
        freshness = 25
      } else {
        freshness = 10
      }
    }
  }

  // 2. Data Completeness (14-day history window)
  const safeHistoryDays = Math.max(0, Math.min(14, historyDaysCount))
  const completeness = Math.round((safeHistoryDays / 14) * 100)

  // 3. Signal Coverage (7 active domains)
  const activeDomains = [
    domainPresence.mindHabits,
    domainPresence.mindJournal,
    domainPresence.productivityTasks,
    domainPresence.fitness,
    domainPresence.timeTracking,
    domainPresence.learning,
    domainPresence.finance,
  ].filter(Boolean).length

  const coverage = Math.round((activeDomains / 7) * 100)

  const weightedScore = freshness * 0.35 + completeness * 0.35 + coverage * 0.30
  return Math.min(100, Math.max(0, Math.round(weightedScore)))
}

export interface EvaluatorInputs {
  pendingTasksCount: number
  activeHabitsCount: number
  completedHabitsCount: number
  deepWorkMinutes: number
  workoutCompleted: boolean
  financeAvailable: number
  financeSpent: number
  activeRoadmapsCount: number
  completedRoadmapsCount: number
  consistencyPercent: number
  brainStatus?: BrainSystemStatus | null
}

export function evaluateSystemThreats(inputs: EvaluatorInputs): ThreatCard[] {
  const threats: ThreatCard[] = []

  // 1. Task Backlog Threat
  if (inputs.pendingTasksCount >= 10) {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'critical', value: `${inputs.pendingTasksCount} Pending` })
  } else if (inputs.pendingTasksCount >= 5) {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'warning', value: `${inputs.pendingTasksCount} Pending` })
  } else {
    threats.push({ id: 'task-backlog', label: 'Task Backlog', severity: 'healthy', value: inputs.pendingTasksCount === 0 ? 'Clear' : `${inputs.pendingTasksCount} Pending` })
  }

  // 2. Deep Work Threat
  if (inputs.deepWorkMinutes === 0) {
    threats.push({ id: 'deep-work', label: 'Deep Work', severity: 'warning', value: '0 Minutes' })
  } else if (inputs.deepWorkMinutes < 60) {
    threats.push({ id: 'deep-work', label: 'Deep Work', severity: 'warning', value: `${inputs.deepWorkMinutes} Minutes` })
  } else {
    threats.push({ id: 'deep-work', label: 'Deep Work', severity: 'healthy', value: `${inputs.deepWorkMinutes} Minutes` })
  }

  // 3. Fitness Threat
  const fitnessUrgency = inputs.brainStatus?.urgency?.fitness ?? 0
  if (inputs.workoutCompleted) {
    threats.push({ id: 'fitness', label: 'Fitness', severity: 'healthy', value: 'Completed' })
  } else if (fitnessUrgency >= 100) {
    threats.push({ id: 'fitness', label: 'Fitness', severity: 'critical', value: 'Overdue (Past Wed)' })
  } else {
    threats.push({ id: 'fitness', label: 'Fitness', severity: 'warning', value: 'Pending' })
  }

  // 4. Habits Threat
  const habitRatio = inputs.activeHabitsCount > 0 ? inputs.completedHabitsCount / inputs.activeHabitsCount : 0
  if (inputs.activeHabitsCount === 0) {
    threats.push({ id: 'habits', label: 'Habits', severity: 'warning', value: 'No active habits' })
  } else if (habitRatio < 0.5) {
    threats.push({ id: 'habits', label: 'Habits', severity: 'warning', value: `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount}` })
  } else {
    threats.push({ id: 'habits', label: 'Habits', severity: 'healthy', value: `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount}` })
  }

  // 5. Finance Threat (Evaluated when budget pressure exists)
  const financeUrgency = inputs.brainStatus?.urgency?.finance ?? 0
  const progressPercent = inputs.financeAvailable > 0 ? (inputs.financeSpent / inputs.financeAvailable) * 100 : 0
  if (progressPercent > 90 || financeUrgency >= 8) {
    threats.push({ id: 'finance', label: 'Budget Pressure', severity: 'critical', value: `${progressPercent.toFixed(0)}% Used` })
  } else if (progressPercent > 75 || financeUrgency >= 5) {
    threats.push({ id: 'finance', label: 'Budget Pressure', severity: 'warning', value: `${progressPercent.toFixed(0)}% Used` })
  }

  // 6. Learning Threat (Evaluated when learning has stalled)
  const learningUrgency = inputs.brainStatus?.urgency?.learning ?? 0
  if (learningUrgency > 0) {
    threats.push({ id: 'learning', label: 'Learning Velocity', severity: 'warning', value: 'Stalled (7d)' })
  }

  // Sort threats by severity: critical > warning > healthy
  const severityScore = { critical: 3, warning: 2, healthy: 1 }
  threats.sort((a, b) => severityScore[b.severity] - severityScore[a.severity])

  // Return the top 4 most critical threats for the 4-column hero grid
  return threats.slice(0, 4)
}

export function evaluateSystemStatuses(inputs: EvaluatorInputs): SystemStatus[] {
  const statuses: SystemStatus[] = []

  // 1. Mind OS
  const habitRatio = inputs.activeHabitsCount > 0 ? inputs.completedHabitsCount / inputs.activeHabitsCount : 0
  let mindStatus: SystemStatusLevel = 'Healthy'
  let mindActivity = `${inputs.completedHabitsCount} / ${inputs.activeHabitsCount} habits`

  if (inputs.activeHabitsCount === 0) {
    mindStatus = 'Needs Input'
    mindActivity = 'No active habits'
  } else if (inputs.completedHabitsCount === 0) {
    mindStatus = 'Needs Input'
    mindActivity = `0 / ${inputs.activeHabitsCount} completed`
  } else if (habitRatio < 0.5) {
    mindStatus = 'Warning'
  }

  statuses.push({
    id: 'mind-os',
    name: 'Mind OS',
    status: mindStatus,
    activity: mindActivity,
  })

  // 2. Productivity Hub
  let productivityStatus: SystemStatusLevel = 'Healthy'
  const productivityActivity = inputs.pendingTasksCount === 0
    ? 'Backlog clear'
    : `${inputs.pendingTasksCount} pending task${inputs.pendingTasksCount === 1 ? '' : 's'}`

  if (inputs.pendingTasksCount >= 10) {
    productivityStatus = 'Critical'
  } else if (inputs.pendingTasksCount >= 5) {
    productivityStatus = 'Warning'
  }

  statuses.push({
    id: 'productivity-hub',
    name: 'Productivity Hub',
    status: productivityStatus,
    activity: productivityActivity,
  })

  // 3. Time OS
  let timeStatus: SystemStatusLevel = 'Healthy'
  let timeActivity = `${inputs.deepWorkMinutes} mins deep work`

  if (inputs.deepWorkMinutes === 0) {
    timeStatus = 'Needs Input'
    timeActivity = '0 mins deep work'
  } else if (inputs.deepWorkMinutes < 60) {
    timeStatus = 'Warning'
  }

  statuses.push({
    id: 'time-os',
    name: 'Time OS',
    status: timeStatus,
    activity: timeActivity,
  })

  // 4. Fitness OS
  let fitnessStatus: SystemStatusLevel = 'Needs Input'
  let fitnessActivity = 'Pending workout'

  const fitnessUrgency = inputs.brainStatus?.urgency?.fitness ?? 0
  if (inputs.workoutCompleted) {
    fitnessStatus = 'Healthy'
    fitnessActivity = 'Workout completed'
  } else if (fitnessUrgency >= 100) {
    fitnessStatus = 'Critical'
    fitnessActivity = 'Overdue (Past Wed)'
  } else if (fitnessUrgency >= 3) {
    fitnessStatus = 'Warning'
    fitnessActivity = 'Behind weekly pace'
  }

  statuses.push({
    id: 'fitness-os',
    name: 'Fitness OS',
    status: fitnessStatus,
    activity: fitnessActivity,
  })

  // 5. Finance OS
  let financeStatus: SystemStatusLevel = 'Healthy'
  let financeActivity = 'No budget set'

  const financeUrgency = inputs.brainStatus?.urgency?.finance ?? 0
  if (inputs.financeAvailable > 0) {
    const progressPercent = (inputs.financeSpent / inputs.financeAvailable) * 100
    financeActivity = `${progressPercent.toFixed(0)}% budget used`

    if (progressPercent > 90 || financeUrgency >= 8) {
      financeStatus = 'Critical'
    } else if (progressPercent > 75 || financeUrgency >= 5) {
      financeStatus = 'Warning'
    }
  } else if (inputs.financeSpent > 0) {
    financeStatus = 'Warning'
    financeActivity = 'Spent without budget'
  } else {
    financeStatus = 'Needs Input'
  }

  statuses.push({
    id: 'finance-os',
    name: 'Finance OS',
    status: financeStatus,
    activity: financeActivity,
  })

  // 6. Learning OS
  let learningStatus: SystemStatusLevel = 'Healthy'
  let learningActivity = `${inputs.activeRoadmapsCount} active roadmaps`

  const learningUrgency = inputs.brainStatus?.urgency?.learning ?? 0
  if (inputs.activeRoadmapsCount === 0 && inputs.completedRoadmapsCount === 0) {
    learningStatus = 'Needs Input'
    learningActivity = 'No roadmaps yet'
  } else if (learningUrgency > 0) {
    learningStatus = 'Warning'
    learningActivity = 'Learning stalled (7d)'
  } else if (inputs.activeRoadmapsCount === 0 && inputs.completedRoadmapsCount > 0) {
    learningStatus = 'Healthy'
    learningActivity = `${inputs.completedRoadmapsCount} completed`
  }

  statuses.push({
    id: 'learning-os',
    name: 'Learning OS',
    status: learningStatus,
    activity: learningActivity,
  })

  // 7. Mission Control
  let mcStatus: SystemStatusLevel = 'Healthy'
  let mcActivity = `${inputs.consistencyPercent.toFixed(0)}% consistency`

  if (inputs.consistencyPercent === 0) {
    mcStatus = 'Needs Input'
    mcActivity = 'No events logged'
  } else if (inputs.consistencyPercent < 50) {
    mcStatus = 'Warning'
  }

  statuses.push({
    id: 'mission-control',
    name: 'Mission Control',
    status: mcStatus,
    activity: mcActivity,
  })

  return statuses
}
