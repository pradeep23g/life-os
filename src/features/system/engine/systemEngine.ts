import { analyzeMomentum } from './analyzeMomentum'
import {
  getExecutionOSSignals,
  getFitnessOSSignals,
  getMindOSSignals,
  getTimeOSSignals,
  getLearningOSSignals,
  getFinanceOSSignals,
} from './domainSignals'
import { generateDirectives } from './generateDirectives'
import type { CurrentDaySnapshot, DomainSignal, SystemHistoryDay, SystemIssue, SystemSignalEvent, SystemStatus } from './types'

function collectDomainSignals(snapshot: CurrentDaySnapshot): DomainSignal[] {
  return [
    ...getMindOSSignals(snapshot),
    ...getExecutionOSSignals(snapshot),
    ...getFitnessOSSignals(snapshot),
    ...getTimeOSSignals(snapshot),
    ...getLearningOSSignals(snapshot),
    ...getFinanceOSSignals(snapshot),
  ]
}

function detectIssues(snapshot: CurrentDaySnapshot | null | undefined): SystemIssue[] {
  if (!snapshot) {
    return [{ text: 'System snapshot unavailable', severity: 'low' }]
  }

  const signals = collectDomainSignals(snapshot)

  return signals.map((signal) => ({
    text: signal.issueText,
    severity: signal.severity,
  }))
}

function buildMomentumExplanation(snapshot: CurrentDaySnapshot | null | undefined): string[] {
  if (!snapshot) {
    return ['System snapshot unavailable']
  }

  const signals = collectDomainSignals(snapshot)
  const reasons = signals.map((signal) => signal.momentumText)

  return reasons.length ? reasons : ['Execution baseline looks stable']
}

export function getSystemStatus(
  snapshot: CurrentDaySnapshot | null | undefined,
  history: SystemHistoryDay[],
  recentEvents: SystemSignalEvent[] = [],
): SystemStatus {
  const momentum = analyzeMomentum(history, snapshot?.deep_work_minutes_today ?? 0, recentEvents)
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
