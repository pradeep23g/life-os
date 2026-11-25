/**
 * Shared Arc Engine schema constants used by Zod validators and feature constants.
 * Lives in `src/lib/` so schema validators adhere to downward FSD layering.
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
  '#22d3ee',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#f43f5e',
  '#6366f1',
  '#0ea5e9',
  '#84cc16',
  '#f97316',
  '#14b8a6',
  '#71717a',
  '#94a3b8',
] as const

export type ArcAccentColor = (typeof ARC_ACCENT_COLORS)[number]

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
