import type { DataLabDailyActivity } from '../api/useDataLab'
import type { CorrelationMetrics, CorrelationPair, DataMaturityLevel } from '../types/types'
import { pearsonCorrelation } from '../utils/stats'

type MetricExtractor = {
  label: string
  getValue: (row: DataLabDailyActivity) => number
}

const METRIC_EXTRACTORS: MetricExtractor[] = [
  { label: 'Habits', getValue: (r) => r.habits_completed },
  { label: 'Journal', getValue: (r) => r.journal_entries },
  { label: 'Deep Work', getValue: (r) => r.deep_work_minutes },
  { label: 'Workouts', getValue: (r) => r.workouts_logged },
  { label: 'Tasks', getValue: (r) => r.tasks_completed },
  { label: 'Finance', getValue: (r) => r.finance_entries },
  { label: 'Learning', getValue: (r) => r.learning_sessions_logged },
]

function getMaturityLevel(totalDays: number): DataMaturityLevel {
  if (totalDays >= 90) return 'stable'
  if (totalDays >= 30) return 'experimental'
  return 'insufficient'
}

export function computeCorrelationMetrics(
  dailyRows: DataLabDailyActivity[],
): CorrelationMetrics {
  const totalDataDays = dailyRows.length
  const maturityLevel = getMaturityLevel(totalDataDays)
  const labels = METRIC_EXTRACTORS.map((e) => e.label)

  if (maturityLevel === 'insufficient') {
    return { matrix: [], labels, maturityLevel, totalDataDays }
  }

  const sorted = [...dailyRows].sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date),
  )

  const pairs: CorrelationPair[] = []

  for (let i = 0; i < METRIC_EXTRACTORS.length; i++) {
    for (let j = i + 1; j < METRIC_EXTRACTORS.length; j++) {
      const extractorA = METRIC_EXTRACTORS[i]
      const extractorB = METRIC_EXTRACTORS[j]

      const xs = sorted.map(extractorA.getValue)
      const ys = sorted.map(extractorB.getValue)
      const coefficient = pearsonCorrelation(xs, ys)

      pairs.push({
        metricA: extractorA.label,
        metricB: extractorB.label,
        coefficient: Math.round(coefficient * 100) / 100,
      })
    }
  }

  return { matrix: pairs, labels, maturityLevel, totalDataDays }
}

export function computeCorrelationExplorer(
  dailyRows: DataLabDailyActivity[],
  selectedMetric: string,
): { metric: string; coefficient: number }[] {
  const selected = METRIC_EXTRACTORS.find((e) => e.label === selectedMetric)
  if (!selected || dailyRows.length < 30) return []

  const sorted = [...dailyRows].sort(
    (a, b) => a.activity_date.localeCompare(b.activity_date),
  )

  const targetValues = sorted.map(selected.getValue)

  return METRIC_EXTRACTORS
    .filter((e) => e.label !== selectedMetric)
    .map((extractor) => {
      const values = sorted.map(extractor.getValue)
      const coefficient = pearsonCorrelation(targetValues, values)

      return {
        metric: extractor.label,
        coefficient: Math.round(coefficient * 100) / 100,
      }
    })
    .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
}
