// ── Period & Config ──────────────────────────────────────────────

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all'

export type DataLabTab = 'overview' | 'behavior' | 'telemetry'

export type DataMaturityLevel = 'insufficient' | 'experimental' | 'stable'

// ── Trend ────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'stable'

// ── Metric Models (output of Metrics Engine) ─────────────────────

export type WeeklyScoreMetrics = {
  currentScore: number
  previousScore: number
  trend: TrendDirection
  delta: number
  rank: number
  totalWeeks: number
  momentumLabel: string
  sparklinePoints: { weekLabel: string; score: number }[]
}

export type ConsistencyMetricEntry = {
  moduleName: string
  consistencyPercent: number
  activeDays: number
  totalDays: number
  lastActiveDate: string | null
  trend: TrendDirection
}

export type MomentumMetrics = {
  low: number
  medium: number
  high: number
  totalWeeks: number
  currentLevel: 'low' | 'medium' | 'high'
}

export type BehaviorDriftEntry = {
  moduleName: string
  currentAvg: number
  previousAvg: number
  delta: number
  direction: TrendDirection
}

export type BehaviorDriftMetrics = {
  entries: BehaviorDriftEntry[]
  periodLabel: string
}

export type StreakSegment = {
  start: number
  length: number
  active: boolean
}

export type StreakMetricEntry = {
  moduleName: string
  currentStreak: number
  longestStreak: number
  segments: StreakSegment[]
  totalDays: number
}

export type CorrelationPair = {
  metricA: string
  metricB: string
  coefficient: number
}

export type CorrelationMetrics = {
  matrix: CorrelationPair[]
  labels: string[]
  maturityLevel: DataMaturityLevel
  totalDataDays: number
}

export type RhythmBucket = {
  hour: number
  count: number
}

export type RhythmMetrics = {
  buckets: RhythmBucket[]
  peakHour: number
  totalEvents: number
}

export type TelemetryHealthMetrics = {
  coveragePercent: number
  totalExpected: number
  totalActive: number
  inactiveModules: string[]
  silentEvents: string[]
  healthScore: number
}

export type SystemHealthEntry = {
  moduleName: string
  status: 'healthy' | 'warning' | 'critical' | 'inactive'
  lastActivity: string | null
  consistencyPercent: number
  eventCount: number
}

export type BehaviorInsight = {
  type: string
  label: string
  value: string
  detail: string
}

// ── Chart-Ready Types (output of Transforms) ────────────────────

export type CalendarCell = {
  date: string
  intensity: number
  activeSystemCount: number
  systems: {
    habits: boolean
    journal: boolean
    tasks: boolean
    deepWork: boolean
    workout: boolean
    finance: boolean
  }
}

export type TimelineDayRow = {
  date: string
  workout: boolean
  journal: boolean
  habits: boolean
  tasks: boolean
  deepWork: boolean
}

export type MatrixCell = {
  row: number
  col: number
  labelA: string
  labelB: string
  value: number
}

export type StreakLane = {
  moduleName: string
  segments: StreakSegment[]
  currentStreak: number
  longestStreak: number
  totalDays: number
}

export type HistogramBar = {
  label: string
  value: number
  percent: number
}

export type WaterfallNode = {
  timestamp: string
  domain: string
  eventType: string
  entityType: string
}

export type DriftRow = {
  moduleName: string
  delta: number
  direction: TrendDirection
  displayDelta: string
}

export type EventStreamEntry = {
  id: string
  timestamp: string
  domain: string
  entityType: string
  eventType: string
}
