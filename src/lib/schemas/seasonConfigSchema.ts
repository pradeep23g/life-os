import { z } from 'zod'
import { cleanJsonString } from './curriculumSchema.ts'

export const seasonVowSchema = z.object({
  headline: z.string().min(1, 'Vow headline is required'),
  body: z.string().min(1, 'Vow body is required'),
  attribution: z.string().optional().default(''),
})

export const seasonPhaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required'),
  startDay: z.number().int().optional(),
  endDay: z.number().int().optional(),
  week: z.number().int().optional(),
  focus: z.string().optional(),
})

export const seasonVowsContainerSchema = z.object({
  vow: seasonVowSchema.optional(),
  principles: z.array(z.string()).default([]),
  phases: z.array(seasonPhaseSchema).default([]),
}).passthrough()

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

function normalizeSeasonKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeSeasonKeys)

  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    let normKey = key
    if (key === 'start_date') normKey = 'startDate'
    else if (key === 'end_date') normKey = 'endDate'
    else if (key === 'badge_id') normKey = 'badgeId'
    else if (key === 'unlocked_at') normKey = 'unlockedAt'
    normalized[normKey] = normalizeSeasonKeys(value)
  }
  return normalized
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
        errors: [`JSON Syntax Error: ${e instanceof Error ? e.message : 'Invalid JSON formatting.'}`]
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
    const errors = rawResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
    return { success: false, errors }
  }

  // 2. Check if canonical ADR-026 format { season: { ... } }
  if ('season' in obj) {
    const normalized = normalizeSeasonKeys(parsed)
    const canonicalResult = canonicalSeasonConfigSchema.safeParse(normalized)
    if (canonicalResult.success) {
      return {
        success: true,
        payload: { kind: 'canonical', data: canonicalResult.data },
      }
    }
    const errors = canonicalResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
    return { success: false, errors }
  }

  return {
    success: false,
    errors: [
      'Unrecognized payload format. Expected canonical Season Config ({ season: {...}, achievements: [...] }) or raw entity table payload ({ entity: "...", data: [...] }).'
    ]
  }
}
