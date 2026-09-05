export type ThreatSeverity = 'critical' | 'warning' | 'healthy'
export type SystemStatusLevel = 'Healthy' | 'Needs Input' | 'Warning' | 'Critical'

export interface ThreatCard {
  id: string
  label: string
  severity: ThreatSeverity
  value: string | number
}

export interface SystemStatus {
  id: string
  name: string
  status: SystemStatusLevel
  activity: string
  consistency?: string
}

export interface MetricCard {
  id: string
  label: string
  value: string | number
  trendDirection?: 'up' | 'down' | 'neutral'
  trendValue?: string | number
  supportingText?: string
}

export interface MissionRecommendation {
  mission: string
  estimatedTime: string
  expectedMomentumGain: string
  reason: string
  recommendationSource: string
  actionRoute: string
}

export interface BrainState {
  momentumScore: number
  momentumTrend: 'rising' | 'falling' | 'stable'
  sparkline: number[]
  mission: MissionRecommendation | null
  threats: ThreatCard[]
  reasoning: string[]
  confidence: number
}

export interface SystemEvent {
  id: string
  timestamp: string
  description: string
  domain: string
}

export interface MissionControlSnapshot {
  isLoading: boolean
  isError: boolean
  snapshotDate: string | null
  brain: BrainState
  systems: SystemStatus[]
  metrics: MetricCard[]
  recentEvents: SystemEvent[]
  pendingEventsCount: number
}
