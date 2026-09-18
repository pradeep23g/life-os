import type { LifeState } from '../mission-control/types/snapshot'

export type DossierDomain = 'all' | 'mind' | 'work' | 'body' | 'intellect' | 'system'

export interface CoreAttribute {
  id: 'discipline' | 'execution' | 'physical' | 'intellect'
  label: string
  dimension: string
  value: string | number
  unit?: string
  supportingText: string
  provenance: string
}

export interface CapabilityCrest {
  id: string
  title: string
  domain: DossierDomain
  description: string
  isEarned: boolean
  earnedProvenance: string
  criteria: string
}

export interface ChronicleEvent {
  id: string
  timestamp: string
  domain: DossierDomain
  rawType: string
  headline: string
  detail?: string
  metadataSummary?: string
}

export interface ProfileDossierData {
  lifeState: LifeState
  momentumScore: number
  momentumTrend: 'rising' | 'falling' | 'stable'
  confidence: number
  sparkline: number[]
  activeDaysThisWeek: number
  consistencyPercent: number
  attributes: CoreAttribute[]
  crests: CapabilityCrest[]
  chronicle: ChronicleEvent[]
  totalChronicleCount: number
  isLoading: boolean
}
