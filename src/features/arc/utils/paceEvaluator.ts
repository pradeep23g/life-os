import { PACE_THRESHOLDS } from '../constants.ts'
import type {
  ArcMilestoneConfig,
  ArcMilestoneState,
  ArcPaceStatus,
  MilestoneProgressMap,
} from '../types.ts'

export interface TemporalHorizon {
  currentDay: number
  totalDays: number
  remainingDays: number
  percentElapsed: number
  temporalStatus: 'upcoming' | 'active' | 'completed'
}

/**
 * Parses a date string strictly by its calendar YYYY-MM-DD components at UTC midnight.
 *
 * GOTCHA: ISO strings with non-zero hours (e.g., `2026-10-31T18:00:00Z` or local timezone offsets)
 * skew calendar day calculations by +1 day when doing raw timestamp subtraction.
 * Slicing the `YYYY-MM-DD` prefix guarantees pure calendar-day arithmetic.
 */
function parseDateOnly(dateStr?: string | null): number {
  if (!dateStr || dateStr.length < 10) return NaN
  const dateKey = dateStr.slice(0, 10)
  const ms = new Date(`${dateKey}T00:00:00.000Z`).getTime()
  return Number.isNaN(ms) ? NaN : ms
}

/**
 * Computes deterministic temporal horizon for an arc duration.
 * Accurately handles upcoming, active, completed, and early-completed arcs.
 *
 * @param startDateStr - ISO or YYYY-MM-DD start date
 * @param endDateStr - ISO or YYYY-MM-DD planned end date
 * @param asOfDateStr - Evaluation date (typically today or completed_at)
 * @param completedAtStr - Optional actual completion timestamp for early completion
 */
export function calculateTemporalHorizon(
  startDateStr: string,
  endDateStr: string,
  asOfDateStr: string,
  completedAtStr?: string | null,
): TemporalHorizon {
  const startMs = parseDateOnly(startDateStr)
  const endMs = parseDateOnly(endDateStr)
  const asOfMs = parseDateOnly(asOfDateStr)

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return {
      currentDay: 0,
      totalDays: 1,
      remainingDays: 1,
      percentElapsed: 0,
      temporalStatus: 'upcoming',
    }
  }

  const msPerDay = 86400000
  const totalDays = Math.max(1, Math.round((endMs - startMs) / msPerDay) + 1)

  // 1. If arc was explicitly marked completed (early or scheduled)
  if (completedAtStr) {
    const completedMs = parseDateOnly(completedAtStr)
    const effectiveMs = Number.isNaN(completedMs) ? endMs : completedMs
    const effectiveDays = Math.max(
      1,
      Math.min(totalDays, Math.round((effectiveMs - startMs) / msPerDay) + 1),
    )
    return {
      currentDay: effectiveDays,
      totalDays,
      remainingDays: 0,
      percentElapsed: 100,
      temporalStatus: 'completed',
    }
  }

  // Safe asOfMs fallback if asOfDateStr is missing or invalid
  const safeAsOfMs = Number.isNaN(asOfMs) ? Date.now() : asOfMs

  // 2. Upcoming arc
  if (safeAsOfMs < startMs) {
    return {
      currentDay: 0,
      totalDays,
      remainingDays: totalDays,
      percentElapsed: 0,
      temporalStatus: 'upcoming',
    }
  }

  // 3. Naturally concluded arc (past end date)
  if (safeAsOfMs > endMs) {
    return {
      currentDay: totalDays,
      totalDays,
      remainingDays: 0,
      percentElapsed: 100,
      temporalStatus: 'completed',
    }
  }

  // 4. Currently active arc
  const elapsedDays = Math.min(totalDays, Math.max(1, Math.round((safeAsOfMs - startMs) / msPerDay) + 1))
  const remainingDays = Math.max(0, totalDays - elapsedDays)
  const percentElapsed = Math.min(100, Math.round((elapsedDays / totalDays) * 100))

  return {
    currentDay: elapsedDays,
    totalDays,
    remainingDays,
    percentElapsed,
    temporalStatus: 'active',
  }
}

/**
 * Evaluates strict linear pace for a single milestone.
 */
export function evaluateMilestonePace(
  milestone: ArcMilestoneConfig,
  actualValue: number,
  temporal: TemporalHorizon,
  manualProgress?: MilestoneProgressMap,
): ArcMilestoneState {
  const isManual = milestone.kind === 'manual'
  const isManuallyCompleted = Boolean(manualProgress?.[milestone.id]?.completedAt)

  if (isManual) {
    const targetValue = milestone.targetValue ?? 1
    const currentValue = isManuallyCompleted ? targetValue : 0
    return {
      id: milestone.id,
      title: milestone.title,
      kind: 'manual',
      description: milestone.description,
      targetValue,
      currentValue,
      unit: milestone.unit ?? 'CONFIRMATION',
      status: isManuallyCompleted ? 'complete' : 'pending',
      completionPercent: isManuallyCompleted ? 100 : 0,
      isAchieved: isManuallyCompleted,
      binding: milestone.binding,
    }
  }

  // Telemetry milestone
  const targetValue = milestone.targetValue ?? 1
  const currentValue = actualValue
  const completionPercent = Math.min(100, Math.round((currentValue / targetValue) * 100))
  const isAchieved = currentValue >= targetValue

  // If already reached target value
  if (isAchieved) {
    return {
      id: milestone.id,
      title: milestone.title,
      kind: 'telemetry',
      description: milestone.description,
      targetValue,
      currentValue,
      unit: milestone.unit,
      status: 'complete',
      completionPercent: 100,
      paceRequired: 0,
      isAchieved: true,
      binding: milestone.binding,
    }
  }

  // If upcoming
  if (temporal.temporalStatus === 'upcoming') {
    const paceRequired = temporal.totalDays > 0 ? Number(((targetValue - currentValue) / temporal.totalDays).toFixed(1)) : 0
    return {
      id: milestone.id,
      title: milestone.title,
      kind: 'telemetry',
      description: milestone.description,
      targetValue,
      currentValue,
      unit: milestone.unit,
      status: 'pending',
      completionPercent,
      paceRequired,
      isAchieved: false,
      binding: milestone.binding,
    }
  }

  // If already completed/ended without reaching target
  if (temporal.temporalStatus === 'completed') {
    return {
      id: milestone.id,
      title: milestone.title,
      kind: 'telemetry',
      description: milestone.description,
      targetValue,
      currentValue,
      unit: milestone.unit,
      status: 'behind',
      completionPercent,
      paceRequired: 0,
      isAchieved: false,
      binding: milestone.binding,
    }
  }

  // Active arc: evaluate strict linear expected progress
  const expectedProgress = (temporal.currentDay / temporal.totalDays) * targetValue
  const paceRatio = expectedProgress > 0 ? currentValue / expectedProgress : 1.0

  let status: ArcPaceStatus = 'behind'
  if (paceRatio >= PACE_THRESHOLDS.ON_TRACK) {
    status = 'on_track'
  } else if (paceRatio >= PACE_THRESHOLDS.AT_RISK) {
    status = 'at_risk'
  }

  const remainingNeeded = Math.max(0, targetValue - currentValue)
  const paceRequired =
    temporal.remainingDays > 0 ? Number((remainingNeeded / temporal.remainingDays).toFixed(1)) : 0

  return {
    id: milestone.id,
    title: milestone.title,
    kind: 'telemetry',
    description: milestone.description,
    targetValue,
    currentValue,
    unit: milestone.unit,
    status,
    completionPercent,
    paceRequired,
    isAchieved: false,
    binding: milestone.binding,
  }
}

/**
 * Calculates overall execution health based on the worst status across milestones.
 * Priority: behind > at_risk > on_track > complete > pending.
 */
export function calculateOverallHealth(milestoneStates: ArcMilestoneState[]): ArcPaceStatus {
  if (milestoneStates.length === 0) {
    return 'on_track'
  }

  const allComplete = milestoneStates.every((m) => m.status === 'complete')
  if (allComplete) {
    return 'complete'
  }

  if (milestoneStates.some((m) => m.status === 'behind')) {
    return 'behind'
  }

  if (milestoneStates.some((m) => m.status === 'at_risk')) {
    return 'at_risk'
  }

  if (milestoneStates.some((m) => m.status === 'on_track')) {
    return 'on_track'
  }

  return 'pending'
}
