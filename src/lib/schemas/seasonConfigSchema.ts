import { z } from 'zod'
import { cleanJsonString } from './curriculumSchema.ts'
import {
  ARC_ACCENT_COLORS,
  ARC_ICONS,
  TELEMETRY_BINDING_KEYS,
} from '../../features/arc/constants.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Canonical Arc Engine Schemas (ADR-030)
// ─────────────────────────────────────────────────────────────────────────────

export const arcFocusDomainSchema = z.object({
  id: z.string().min(1, 'Domain ID is required'),
  name: z.string().min(1, 'Domain name is required'),
  binding: z
    .object({
      source: z.string().min(1, 'Telemetry source is required'),
      metric: z.string().min(1, 'Telemetry metric is required'),
    })
    .optional(),
})

export const arcPhaseSchema = z.object({
  id: z.string().min(1, 'Phase ID is required'),
  name: z.string().min(1, 'Phase name is required'),
  startDay: z.number().int().min(1, 'startDay must be at least 1'),
  endDay: z.number().int().min(1, 'endDay must be at least 1'),
  focus: z.string().optional(),
})

export const arcMilestoneConfigSchema = z
  .object({
    id: z.string().min(1, 'Milestone ID is required'),
    title: z.string().min(1, 'Milestone title is required'),
    kind: z.enum(['telemetry', 'manual'], {
      message: 'Milestone kind must be either "telemetry" or "manual"',
    }),
    description: z.string().optional(),
    targetValue: z.number().positive('targetValue must be greater than zero').optional(),
    unit: z.string().optional(),
    binding: z
      .object({
        source: z.string().min(1, 'Binding source is required'),
        metric: z.string().min(1, 'Binding metric is required'),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.kind === 'telemetry') {
        return typeof data.targetValue === 'number' && data.targetValue > 0
      }
      return true
    },
    {
      message: 'Telemetry milestones require a positive targetValue',
      path: ['targetValue'],
    },
  )
  .refine(
    (data) => {
      if (data.kind === 'telemetry') {
        if (!data.binding) return false
        const key = `${data.binding.source}.${data.binding.metric}`
        return TELEMETRY_BINDING_KEYS.includes(key as (typeof TELEMETRY_BINDING_KEYS)[number])
      }
      return true
    },
    {
      message: `Telemetry binding must be one of the registered keys: ${TELEMETRY_BINDING_KEYS.join(', ')}`,
      path: ['binding'],
    },
  )

export const arcVowSchema = z.object({
  headline: z.string().min(1, 'Vow headline is required'),
  body: z.string().min(1, 'Vow body is required'),
  attribution: z.string().optional().default(''),
})

export const arcConfigSchema = z
  .object({
    title: z.string().min(1, 'Campaign title is required'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be in YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be in YYYY-MM-DD format'),
    tagline: z.string().optional(),
    accentColor: z
      .enum(ARC_ACCENT_COLORS, {
        message: `accentColor must be one of the curated colors: ${ARC_ACCENT_COLORS.join(', ')}`,
      })
      .optional(),
    icon: z
      .enum(ARC_ICONS, {
        message: `icon must be one of the approved icons: ${ARC_ICONS.join(', ')}`,
      })
      .optional(),
    vow: arcVowSchema.optional(),
    principles: z.array(z.string()).default([]),
    focusDomains: z.array(arcFocusDomainSchema).default([]),
    phases: z.array(arcPhaseSchema).default([]),
    milestones: z.array(arcMilestoneConfigSchema).default([]),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'startDate must be prior to or equal to endDate',
    path: ['endDate'],
  })
  .refine(
    (data) => {
      if (!data.phases || data.phases.length === 0) return true
      // Verify phases are contiguous, no gaps, no overlaps
      const sorted = [...data.phases].sort((a, b) => a.startDay - b.startDay)
      if (sorted[0].startDay !== 1) return false

      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].endDay < sorted[i].startDay) return false
        if (i > 0 && sorted[i].startDay !== sorted[i - 1].endDay + 1) {
          return false
        }
      }
      return true
    },
    {
      message: 'Phases must tile the duration contiguously starting at day 1 with no gaps or overlaps',
      path: ['phases'],
    },
  )

export type ArcConfigInput = z.infer<typeof arcConfigSchema>

export interface ArcValidationResult {
  success: boolean
  data?: ArcConfigInput
  errors?: string[]
}

export const arcRetrospectiveSchema = z.object({
  whatWentWell: z.string().trim().min(1, 'Response for "What went well?" is required.'),
  whatDidnt: z.string().trim().min(1, 'Response for "What didn\'t go well?" is required.'),
  whatChanged: z.string().trim().min(1, 'Response for "What changed?" is required.'),
  whatLearned: z.string().trim().min(1, 'Response for "What did you learn?" is required.'),
  whatCarriesForward: z.string().trim().min(1, 'Response for "What carries forward?" is required.'),
  submittedAt: z.string().optional(),
})

export type ArcRetrospectiveInput = z.infer<typeof arcRetrospectiveSchema>

export interface ArcRetrospectiveValidationResult {
  success: boolean
  data?: ArcRetrospectiveInput
  errors?: string[]
}

/**
 * Validates retrospective responses ensuring all 5 structured questions are answered.
 */
export function validateArcRetrospective(data: unknown): ArcRetrospectiveValidationResult {
  const result = arcRetrospectiveSchema.safeParse(data)
  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
      return `${path}${issue.message}`
    }),
  }
}

/**
 * Validates a raw JSON string or object against canonical ArcConfig schema.
 */
export function parseAndValidateArcConfig(raw: string | unknown): ArcValidationResult {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const cleaned = cleanJsonString(raw)
    if (!cleaned) {
      return { success: false, errors: ['Input JSON is empty.'] }
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch (e: unknown) {
      return {
        success: false,
        errors: [`JSON Syntax Error: ${e instanceof Error ? e.message : 'Invalid JSON formatting.'}`],
      }
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, errors: ['Payload must be a valid JSON object.'] }
  }

  // Handle case where object is wrapped in { arc: { ... } } or { season: { ... } }
  let target = parsed as Record<string, unknown>
  if ('arc' in target && typeof target.arc === 'object' && target.arc !== null) {
    target = target.arc as Record<string, unknown>
  } else if ('season' in target && typeof target.season === 'object' && target.season !== null) {
    target = target.season as Record<string, unknown>
  }

  // Normalize snake_case keys if needed
  const normalized: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(target)) {
    if (k === 'start_date') normalized.startDate = v
    else if (k === 'end_date') normalized.endDate = v
    else if (k === 'accent_color') normalized.accentColor = v
    else if (k === 'focus_domains') normalized.focusDomains = v
    else normalized[k] = v
  }

  const result = arcConfigSchema.safeParse(normalized)
  if (result.success) {
    return {
      success: true,
      data: result.data,
    }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })
  return { success: false, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Admin Console Schemas (ADR-026 Compatibility)
// ─────────────────────────────────────────────────────────────────────────────

export const seasonVowSchema = arcVowSchema

export const seasonPhaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required'),
  startDay: z.number().int().optional(),
  endDay: z.number().int().optional(),
  week: z.number().int().optional(),
  focus: z.string().optional(),
})

export const seasonVowsContainerSchema = z
  .object({
    vow: seasonVowSchema.optional(),
    principles: z.array(z.string()).default([]),
    phases: z.array(seasonPhaseSchema).default([]),
  })
  .passthrough()

export const seasonDetailsSchema = z.object({
  name: z.string().min(1, 'Season name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  status: z.string().optional().default('active'),
  vows: seasonVowsContainerSchema.default({
    principles: [],
    phases: [],
  }),
})

export const achievementDefinitionSchema = z.object({
  badgeId: z.string().min(1, 'Badge ID is required'),
  name: z.string().min(1, 'Achievement name is required'),
  description: z.string().min(1, 'Achievement description is required'),
  tier: z.string().optional().default('bronze'),
  criteria: z.record(z.string(), z.unknown()).optional().default({}),
  unlockedAt: z.string().optional(),
})

export const canonicalSeasonConfigSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().optional(),
  season: seasonDetailsSchema,
  achievements: z.array(achievementDefinitionSchema).default([]),
})

export const rawEntityPayloadSchema = z.object({
  entity: z.string().min(1, 'Entity name is required'),
  data: z.array(z.record(z.string(), z.unknown())).min(1, 'Data array must contain at least 1 record'),
})

export type CanonicalSeasonConfig = z.infer<typeof canonicalSeasonConfigSchema>
export type RawEntityPayload = z.infer<typeof rawEntityPayloadSchema>

export type ParsedAdminPayload =
  | { kind: 'canonical'; data: CanonicalSeasonConfig }
  | { kind: 'raw'; data: RawEntityPayload }

export interface AdminValidationResult {
  success: boolean
  payload?: ParsedAdminPayload
  errors?: string[]
}

export function parseAndValidateAdminPayload(raw: string | unknown): AdminValidationResult {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    const cleaned = cleanJsonString(raw)
    if (!cleaned) {
      return { success: false, errors: ['Input payload is empty.'] }
    }
    try {
      parsed = JSON.parse(cleaned)
    } catch (e: unknown) {
      return {
        success: false,
        errors: [`JSON Syntax Error: ${e instanceof Error ? e.message : 'Invalid JSON formatting.'}`],
      }
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { success: false, errors: ['Payload must be a valid JSON object.'] }
  }

  const obj = parsed as Record<string, unknown>

  // 1. Check if raw entity format { entity: string, data: [...] }
  if ('entity' in obj && typeof obj.entity === 'string') {
    const rawResult = rawEntityPayloadSchema.safeParse(parsed)
    if (rawResult.success) {
      return {
        success: true,
        payload: { kind: 'raw', data: rawResult.data },
      }
    }
    const errors = rawResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    return { success: false, errors }
  }

  // 2. Check if canonical ADR-026 format { season: { ... } }
  if ('season' in obj) {
    const canonicalResult = canonicalSeasonConfigSchema.safeParse(parsed)
    if (canonicalResult.success) {
      return {
        success: true,
        payload: { kind: 'canonical', data: canonicalResult.data },
      }
    }
    const errors = canonicalResult.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`)
    return { success: false, errors }
  }

  return {
    success: false,
    errors: [
      'Unrecognized payload format. Expected canonical Season Config ({ season: {...}, achievements: [...] }) or raw entity table payload ({ entity: "...", data: [...] }).',
    ],
  }
}
