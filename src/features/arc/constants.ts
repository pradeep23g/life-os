/**
 * Canonical Arc Engine Constants
 * Constrains icons, color palette, telemetry bindings, and pace evaluation thresholds.
 */

export const ARC_ICONS = [
  'snowflake',
  'sprout',
  'sun',
  'leaf',
  'mountain',
  'flame',
  'wave',
  'star',
] as const

export type ArcIconName = (typeof ARC_ICONS)[number]

export const ARC_ACCENT_COLORS = [
  '#22d3ee', // Cyan (Default Winter Arc)
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#0ea5e9', // Sky
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#71717a', // Zinc
  '#94a3b8', // Slate
] as const

export type ArcAccentColor = (typeof ARC_ACCENT_COLORS)[number]

export const DEFAULT_ARC_ACCENT_COLOR: ArcAccentColor = '#22d3ee'
export const DEFAULT_ARC_ICON: ArcIconName = 'snowflake'

export const PACE_THRESHOLDS = {
  ON_TRACK: 0.85,
  AT_RISK: 0.60,
} as const

export const ARC_HEALTH_COLORS = {
  complete: '#10b981', // emerald
  on_track: '#10b981', // emerald / cyan
  at_risk: '#f59e0b',  // amber
  behind: '#f43f5e',   // rose
  pending: '#94a3b8',  // slate
} as const

export type ArcHealthColorKey = keyof typeof ARC_HEALTH_COLORS

export function getArcHealthColor(health?: string | null): string {
  if (!health) return '#22d3ee'
  return (ARC_HEALTH_COLORS as Record<string, string>)[health] || '#22d3ee'
}

export const TELEMETRY_BINDING_KEYS = [
  'deep_work.total_minutes',
  'deep_work.total_hours',
  'focus.total_minutes',
  'focus.session_count',
  'tasks.completed_count',
  'tasks.created_count',
  'habits.completed_count',
  'habits.active_days',
  'fitness.session_count',
  'fitness.total_minutes',
  'fitness.active_days',
  'journal.entry_count',
  'learning.session_count',
  'active_days.total',
] as const

export type TelemetryBindingKey = (typeof TELEMETRY_BINDING_KEYS)[number]

export interface TelemetryBindingMetadata {
  key: TelemetryBindingKey
  source: string
  metric: string
  unit: string
  description: string
}

export const TELEMETRY_BINDING_REGISTRY: Record<TelemetryBindingKey, TelemetryBindingMetadata> = {
  'deep_work.total_minutes': {
    key: 'deep_work.total_minutes',
    source: 'deep_work',
    metric: 'total_minutes',
    unit: 'MINUTES',
    description: 'Total uninterrupted deep work minutes logged in Time OS',
  },
  'deep_work.total_hours': {
    key: 'deep_work.total_hours',
    source: 'deep_work',
    metric: 'total_hours',
    unit: 'HOURS',
    description: 'Total deep work hours logged in Time OS (minutes ÷ 60)',
  },
  'focus.total_minutes': {
    key: 'focus.total_minutes',
    source: 'focus',
    metric: 'total_minutes',
    unit: 'MINUTES',
    description: 'Total minutes across all focus sessions',
  },
  'focus.session_count': {
    key: 'focus.session_count',
    source: 'focus',
    metric: 'session_count',
    unit: 'SESSIONS',
    description: 'Number of discrete focus sessions completed',
  },
  'tasks.completed_count': {
    key: 'tasks.completed_count',
    source: 'tasks',
    metric: 'completed_count',
    unit: 'TASKS',
    description: 'Completed tasks recorded on the productivity ledger',
  },
  'tasks.created_count': {
    key: 'tasks.created_count',
    source: 'tasks',
    metric: 'created_count',
    unit: 'TASKS',
    description: 'Tasks created or planned in Productivity Hub',
  },
  'habits.completed_count': {
    key: 'habits.completed_count',
    source: 'habits',
    metric: 'completed_count',
    unit: 'COMPLETIONS',
    description: 'Daily habit checks fulfilled across Mind OS',
  },
  'habits.active_days': {
    key: 'habits.active_days',
    source: 'habits',
    metric: 'active_days',
    unit: 'DAYS',
    description: 'Days with at least 1 habit completed',
  },
  'fitness.session_count': {
    key: 'fitness.session_count',
    source: 'fitness',
    metric: 'session_count',
    unit: 'SESSIONS',
    description: 'Validated training workouts logged in Fitness OS',
  },
  'fitness.total_minutes': {
    key: 'fitness.total_minutes',
    source: 'fitness',
    metric: 'total_minutes',
    unit: 'MINUTES',
    description: 'Total minutes of physical training logged',
  },
  'fitness.active_days': {
    key: 'fitness.active_days',
    source: 'fitness',
    metric: 'active_days',
    unit: 'DAYS',
    description: 'Days with at least 1 workout completed',
  },
  'journal.entry_count': {
    key: 'journal.entry_count',
    source: 'journal',
    metric: 'entry_count',
    unit: 'ENTRIES',
    description: 'Reflective journal entries logged in Mind OS',
  },
  'learning.session_count': {
    key: 'learning.session_count',
    source: 'learning',
    metric: 'session_count',
    unit: 'SESSIONS',
    description: 'Study sessions logged in Learning OS',
  },
  'active_days.total': {
    key: 'active_days.total',
    source: 'active_days',
    metric: 'total',
    unit: 'DAYS',
    description: 'Days with at least 1 active telemetry event across Life OS',
  },
}
