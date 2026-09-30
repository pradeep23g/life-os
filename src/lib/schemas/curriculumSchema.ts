import { z } from 'zod'

/**
 * Strips markdown code fences (e.g. ```json ... ``` or ``` ... ```)
 * and extracts valid JSON substring even if accompanied by conversational preamble/postscript.
 */
export function cleanJsonString(input: string): string {
  const cleaned = input.trim()

  // 1. If wrapped in markdown code fence (with or without surrounding text)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (fenceMatch) {
    return fenceMatch[1].trim()
  }

  // 2. If it already starts with { or [
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
    return cleaned
  }

  // 3. If there is conversational text before { or [
  const firstBrace = cleaned.indexOf('{')
  const firstBracket = cleaned.indexOf('[')

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    const lastBrace = cleaned.lastIndexOf('}')
    if (lastBrace > firstBrace) {
      return cleaned.slice(firstBrace, lastBrace + 1).trim()
    }
  } else if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = cleaned.lastIndexOf(']')
    if (lastBracket > firstBracket) {
      return cleaned.slice(firstBracket, lastBracket + 1).trim()
    }
  }

  return cleaned
}

/**
 * Normalizes common snake_case aliases to camelCase for robust ingestion
 */
function normalizeObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(normalizeObjectKeys)

  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    let normKey = key
    if (key === 'start_date') normKey = 'startDate'
    else if (key === 'end_date') normKey = 'endDate'
    else if (key === 'target_end_date') normKey = 'targetEndDate'
    else if (key === 'order_index') normKey = 'orderIndex'
    else if (key === 'estimated_minutes') normKey = 'estimatedMinutes'
    else if (key === 'target_date') normKey = 'targetDate'
    else if (key === 'stage_index') normKey = 'stageIndex'
    else if (key === 'repo_url') normKey = 'repoUrl'
    normalized[normKey] = normalizeObjectKeys(value)
  }
  return normalized
}

export const sessionSchema = z.object({
  orderIndex: z.number().int().positive().optional(),
  title: z.string().min(1, 'Session title is required'),
  slot: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  estimatedMinutes: z.number().int().nonnegative().optional().nullable(),
  tags: z.array(z.string()).default([]),
  targetDate: z.string().optional().nullable(),
})

export const stageSchema = z.object({
  orderIndex: z.number().int().positive().optional(),
  title: z.string().min(1, 'Stage title is required'),
  subtitle: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  targetEndDate: z.string().optional().nullable(),
  sessions: z.array(sessionSchema).default([]),
}).transform((stage) => ({
  ...stage,
  endDate: stage.endDate ?? stage.targetEndDate ?? null,
}))

export const milestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required'),
  stageIndex: z.number().int().nonnegative().optional().nullable(),
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(['not_started', 'in_progress', 'done']).default('not_started'),
  repoUrl: z.string().optional().nullable(),
})

export const curriculumSchema = z.object({
  $schema: z.string().optional(),
  title: z.string().min(1, 'Roadmap title is required'),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetEndDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  stages: z.array(stageSchema).min(1, 'At least one stage is required in curriculum'),
  milestones: z.array(milestoneSchema).default([]),
  projects: z.array(projectSchema).default([]),
}).transform((curriculum) => ({
  ...curriculum,
  targetEndDate: curriculum.targetEndDate ?? curriculum.endDate ?? null,
}))

export type SessionInput = z.infer<typeof sessionSchema>
export type StageInput = z.infer<typeof stageSchema>
export type MilestoneInput = z.infer<typeof milestoneSchema>
export type ProjectInput = z.infer<typeof projectSchema>
export type CurriculumInput = z.infer<typeof curriculumSchema>

export interface CurriculumValidationResult {
  success: boolean
  data?: CurriculumInput
  errors?: string[]
}

export function parseAndValidateCurriculum(raw: string | unknown): CurriculumValidationResult {
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

  const normalized = normalizeObjectKeys(parsed)
  const result = curriculumSchema.safeParse(normalized)

  if (!result.success) {
    const errors = result.error.issues.map((err) => {
      const path = err.path.join('.')
      return path ? `${path}: ${err.message}` : err.message
    })
    return { success: false, errors }
  }

  return { success: true, data: result.data }
}
