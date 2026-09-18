export interface ArcSeasonConfig {
  id: string
  title: string
  chapter: string
  year: number
  startDate: string // YYYY-MM-DD (inclusive)
  endDate: string   // YYYY-MM-DD (inclusive)
  totalDays: number // e.g. 90
  vow: {
    headline: string
    body: string
    attribution: string
  }
  principles: string[]
  phases: Array<{
    week: number
    name: string
    focus: string
  }>
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

export type MilestoneDomain = 'deep-work' | 'tasks' | 'fitness' | 'habits'

export interface ArcMilestone {
  id: string
  title: string
  domain: MilestoneDomain
  currentValue: number
  targetValue: number
  unit: string
  isAchieved: boolean
  description: string
}
