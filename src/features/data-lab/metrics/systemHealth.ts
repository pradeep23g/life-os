import type { DataLabModuleConsistency, DataLabEventCoverage } from '../api/useDataLab'
import type { SystemHealthEntry } from '../types/types'

const MODULE_DOMAIN_MAP: Record<string, string> = {
  'Mind/Habits': 'mind-os',
  'Mind/Journal': 'mind-os',
  'Tasks': 'productivity-hub',
  'Time OS': 'time-os',
  'Fitness OS': 'fitness-os',
  'Finance OS': 'finance-os',
}

function getStatus(consistency: number, hasRecentEvents: boolean): SystemHealthEntry['status'] {
  if (consistency === 0 && !hasRecentEvents) return 'inactive'
  if (consistency < 20) return 'critical'
  if (consistency < 50) return 'warning'
  return 'healthy'
}

export function computeSystemHealth(
  moduleConsistency: DataLabModuleConsistency[],
  eventCoverage: DataLabEventCoverage[],
): SystemHealthEntry[] {
  const eventCountByDomain = new Map<string, number>()
  for (const event of eventCoverage) {
    const current = eventCountByDomain.get(event.domain) ?? 0
    eventCountByDomain.set(event.domain, current + event.event_count)
  }

  return moduleConsistency.map((module) => {
    const domain = MODULE_DOMAIN_MAP[module.module_name]
    const eventCount = domain ? eventCountByDomain.get(domain) ?? 0 : 0
    const hasRecentEvents = eventCount > 0

    return {
      moduleName: module.module_name,
      status: getStatus(module.consistency_percent, hasRecentEvents),
      lastActivity: module.last_active_date,
      consistencyPercent: module.consistency_percent,
      eventCount,
    }
  })
}
