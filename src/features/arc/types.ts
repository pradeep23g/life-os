import type { ArcAccentColor, ArcIconName } from './constants'

/**
 * Canonical Arc Engine Configuration.
 * Authored by User or AI; stored in life_seasons.original_config and live config.
 */
export interface ArcConfig {
  title: string
  startDate: string // YYYY-MM-DD (inclusive)
  endDate: string // YYYY-MM-DD (inclusive)
  tagline?: string
  accentColor?: ArcAccentColor
  icon?: ArcIconName
  vow?: {
    headline: string
    body: string
    attribution?: string
  }
  principles?: string[]
  focusDomains?: ArcFocusDomain[]
  phases?: ArcPhase[]
  milestones?: ArcMilestoneConfig[]
}

export interface ArcFocusDomain {
  id: string
  name: string
  binding?: {
    source: string
    metric: string
  }
}

export interface ArcPhase {
  id: string
  name: string
  startDay: number // 1-indexed, inclusive
  endDay: number // inclusive
  focus?: string
}

export interface ArcMilestoneConfig {
  id: string
  title: string
  kind: 'telemetry' | 'manual'
  description?: string
  targetValue?: number
  unit?: string
  binding?: {
    source: string
    metric: string
  }
}

/** Immutable amendment audit record for active arcs */
export interface ArcAmendment {
  timestamp: string // ISO 8601
  field: string // dot-path e.g. "milestones.0.targetValue"
  previousValue: unknown
  newValue: unknown
  reason: string // Mandatory justification
}

/** User-confirmed manual milestone progress stored in life_seasons.milestone_progress */
export interface MilestoneProgressMap {
  [milestoneId: string]: {
    completedAt: string // ISO 8601
    notes?: string
  }
}

/** Structured reflection authored prior to archival */
export interface ArcRetrospective {
  whatWentWell?: string
  whatDidnt?: string
  whatChanged?: string
  whatLearned?: string
  whatCarriesForward?: string
  submittedAt: string // ISO 8601
}

/** Canonical 4-stage lifecycle state machine */
export type ArcLifecycleStatus = 'draft' | 'active' | 'completed' | 'archived'

/** Pace evaluation health status */
export type ArcPaceStatus = 'complete' | 'on_track' | 'at_risk' | 'behind' | 'pending'

/** Evaluated runtime milestone state */
export interface ArcMilestoneState {
  id: string
  title: string
  kind: 'telemetry' | 'manual'
  description?: string
  targetValue?: number
  currentValue: number
  unit?: string
  status: ArcPaceStatus
  completionPercent: number
  paceRequired?: number // Daily units needed to achieve target by end of arc
  isAchieved: boolean
  binding?: {
    source: string
    metric: string
  }
}

/** Derived overall runtime state computed in-memory */
export interface ArcRuntimeState {
  currentDay: number
  totalDays: number
  remainingDays: number
  percentElapsed: number
  temporalStatus: 'upcoming' | 'active' | 'completed'
  overallHealth: ArcPaceStatus
  currentPhase?: {
    id: string
    name: string
    focus?: string
    dayInPhase: number
    totalPhaseDays: number
  }
  checkpoints: ArcCheckpoint[]
  milestoneStates: ArcMilestoneState[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Compatibility Types (Kept to prevent breaking existing components)
// ─────────────────────────────────────────────────────────────────────────────

export interface ArcSeasonConfig {
  id: string
  title: string
  chapter: string
  year: number
  startDate: string
  endDate: string
  totalDays: number
  tagline?: string
  accentColor?: string
  icon?: string
  vow: {
    headline: string
    body: string
    attribution?: string
  }
  principles: string[]
  phases?: Array<{
    id?: string
    week?: number
    startDay?: number
    endDay?: number
    name: string
    focus?: string
  }>
  focusDomains?: ArcFocusDomain[]
  milestones?: ArcMilestoneConfig[]
  status?: ArcLifecycleStatus
  completedAt?: string | null
  plannedEndDate?: string | null
  milestoneProgress?: MilestoneProgressMap
  amendments?: ArcAmendment[]
  originalConfig?: ArcConfig | null
}

export type ArcSeasonStatus = 'upcoming' | 'active' | 'completed'

export interface ArcTemporalProgress {
  currentDay: number
  totalDays: number
  remainingDays: number
  percentElapsed: number
  status: ArcSeasonStatus
  asOfDateIST: string
}

export type CheckpointStatus = 'completed' | 'current' | 'upcoming'

export interface ArcCheckpoint {
  weekNumber: number
  label: string
  phaseName: string
  focus: string
  startDate: string
  endDate: string
  status: CheckpointStatus
  isCurrent: boolean
}

export type MilestoneDomain = 'deep-work' | 'tasks' | 'fitness' | 'habits' | 'general'

export interface ArcMilestone {
  id: string
  title: string
  domain?: MilestoneDomain
  kind?: 'telemetry' | 'manual'
  currentValue: number
  targetValue: number
  unit: string
  isAchieved: boolean
  description: string
  status?: ArcPaceStatus
  paceRequired?: number
}
