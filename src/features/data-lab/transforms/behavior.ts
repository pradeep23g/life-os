import type {
  CorrelationMetrics,
  StreakMetricEntry,
  MomentumMetrics,
  BehaviorDriftMetrics,
  RhythmMetrics,
  MatrixCell,
  StreakLane,
  HistogramBar,
  DriftRow,
} from '../types/types'
import { formatDelta, formatHourLabel } from '../utils/format'

export function toCorrelationMatrixCells(
  metrics: CorrelationMetrics,
): MatrixCell[][] {
  const { labels, matrix } = metrics
  const size = labels.length
  const grid: MatrixCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      row: 0,
      col: 0,
      labelA: '',
      labelB: '',
      value: 0,
    })),
  )

  // Fill diagonal
  for (let i = 0; i < size; i++) {
    grid[i][i] = { row: i, col: i, labelA: labels[i], labelB: labels[i], value: 1 }
  }

  // Fill from pairs
  for (const pair of matrix) {
    const rowIdx = labels.indexOf(pair.metricA)
    const colIdx = labels.indexOf(pair.metricB)
    if (rowIdx >= 0 && colIdx >= 0) {
      grid[rowIdx][colIdx] = {
        row: rowIdx,
        col: colIdx,
        labelA: pair.metricA,
        labelB: pair.metricB,
        value: pair.coefficient,
      }
      grid[colIdx][rowIdx] = {
        row: colIdx,
        col: rowIdx,
        labelA: pair.metricB,
        labelB: pair.metricA,
        value: pair.coefficient,
      }
    }
  }

  return grid
}

export function toStreakLanes(
  metrics: StreakMetricEntry[],
): StreakLane[] {
  return metrics.map((entry) => ({
    moduleName: entry.moduleName,
    segments: entry.segments,
    currentStreak: entry.currentStreak,
    longestStreak: entry.longestStreak,
    totalDays: entry.totalDays,
  }))
}

export function toMomentumBars(
  metrics: MomentumMetrics,
): HistogramBar[] {
  const total = metrics.totalWeeks || 1
  return [
    { label: 'Low', value: metrics.low, percent: Math.round((metrics.low / total) * 100) },
    { label: 'Medium', value: metrics.medium, percent: Math.round((metrics.medium / total) * 100) },
    { label: 'High', value: metrics.high, percent: Math.round((metrics.high / total) * 100) },
  ]
}

export function toDriftRows(
  metrics: BehaviorDriftMetrics,
): DriftRow[] {
  return metrics.entries.map((entry) => ({
    moduleName: entry.moduleName,
    delta: entry.delta,
    direction: entry.direction,
    displayDelta: formatDelta(entry.delta),
  }))
}

export function toRhythmBars(
  metrics: RhythmMetrics,
): HistogramBar[] {
  const maxCount = Math.max(...metrics.buckets.map((b) => b.count), 1)
  return metrics.buckets.map((bucket) => ({
    label: formatHourLabel(bucket.hour),
    value: bucket.count,
    percent: Math.round((bucket.count / maxCount) * 100),
  }))
}
