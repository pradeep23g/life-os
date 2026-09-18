import type { DossierDomain, ChronicleEvent } from '../types'

interface RawEventLike {
  id: string
  created_at?: string
  createdAt?: string
  event_type?: string
  type?: string
  domain?: string
  payload?: Record<string, unknown> | null
}

function resolveDomain(rawDomain?: string, eventType?: string): DossierDomain {
  const normDomain = (rawDomain ?? '').toLowerCase()
  const normType = (eventType ?? '').toLowerCase()

  if (normDomain.includes('mind') || normType.startsWith('mind.')) return 'mind'
  if (normDomain.includes('fitness') || normType.startsWith('fitness.') || normType === 'workout_completed') return 'body'
  if (normDomain.includes('learning') || normType.startsWith('learning.')) return 'intellect'
  if (
    normDomain.includes('productivity') ||
    normType.startsWith('productivity.') ||
    normType === 'task_toggled' ||
    normDomain.includes('time') ||
    normType.startsWith('time.') ||
    normType === 'deep_work_completed' ||
    normDomain.includes('finance') ||
    normType.startsWith('finance.') ||
    normType === 'want_expense_added'
  ) {
    return 'work'
  }
  if (normDomain.includes('system') || normType.startsWith('system.')) return 'system'

  return 'system'
}

function extractString(payload: Record<string, unknown> | null | undefined, keys: string[]): string | undefined {
  if (!payload) return undefined
  for (const k of keys) {
    const val = payload[k]
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim()
    }
  }
  return undefined
}

function extractNumber(payload: Record<string, unknown> | null | undefined, keys: string[]): number | undefined {
  if (!payload) return undefined
  for (const k of keys) {
    const val = payload[k]
    if (typeof val === 'number' && !Number.isNaN(val)) {
      return val
    }
    if (typeof val === 'string') {
      const parsed = Number(val)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return undefined
}

export function translateEventToChronicle(event: RawEventLike): ChronicleEvent {
  const rawType = event.event_type || event.type || 'system.telemetry'
  const timestamp = event.created_at || event.createdAt || new Date().toISOString()
  const domain = resolveDomain(event.domain, rawType)
  const payload = event.payload ?? {}

  let headline = ''
  let detail: string | undefined
  let metadataSummary: string | undefined

  const title = extractString(payload, ['title', 'taskTitle', 'habitTitle', 'name', 'exercise_name'])
  const duration = extractNumber(payload, ['durationMinutes', 'duration_minutes', 'duration', 'minutes'])
  const amount = extractNumber(payload, ['amount'])
  const category = extractString(payload, ['category', 'bucket'])
  const mood = extractNumber(payload, ['mood', 'moodScore'])

  switch (rawType) {
    // Mind OS
    case 'mind.habit.completed':
    case 'MIND_HABIT_COMPLETED':
      headline = title ? `Completed habit: “${title}”` : 'Completed habit milestone'
      detail = 'Affirmed daily ritual in the mind ledger.'
      break

    case 'mind.habit.created':
    case 'MIND_HABIT_CREATED':
      headline = title ? `Formed new habit: “${title}”` : 'Formed new habit ritual'
      detail = 'Initiated tracking contract in Mind OS.'
      break

    case 'mind.habit.count_adjusted':
    case 'MIND_HABIT_COUNT_ADJUSTED':
      headline = title ? `Adjusted habit count for “${title}”` : 'Adjusted habit tally'
      break

    case 'mind.habit.uncompleted':
    case 'MIND_HABIT_UNCOMPLETED':
      headline = title ? `Revoked completion: “${title}”` : 'Revoked habit completion'
      break

    case 'mind.habit.deleted':
    case 'MIND_HABIT_DELETED':
      headline = title ? `Retired habit: “${title}”` : 'Retired habit from ledger'
      break

    case 'mind.habit_break.healed':
    case 'MIND_HABIT_BREAK_HEALED':
      headline = 'Healed habit streak break with token'
      detail = 'Applied monthly recovery token to preserve continuity.'
      break

    case 'mind.journal_entry.created':
    case 'MIND_JOURNAL_ENTRY_CREATED':
      headline = mood ? `Inscribed daily reflection (Mood: ${mood}/5)` : 'Inscribed daily reflection'
      detail = extractString(payload, ['brief_about_day', 'briefAboutDay', 'what_went_good', 'notes'])
      break

    case 'mind.journal_entry.deleted':
    case 'MIND_JOURNAL_ENTRY_DELETED':
      headline = 'Archived reflection entry'
      break

    // Productivity Hub
    case 'productivity.task.created':
    case 'PRODUCTIVITY_TASK_CREATED':
      headline = title ? `Inscribed task: “${title}”` : 'Inscribed task to execution queue'
      break

    case 'productivity.task.status_changed':
    case 'PRODUCTIVITY_TASK_STATUS_CHANGED':
    case 'TASK_TOGGLED': {
      const isCompleted = payload.isCompleted ?? payload.is_completed ?? true
      if (isCompleted) {
        headline = title ? `Completed execution task: “${title}”` : 'Completed execution task'
        detail = 'Executed and retired from active task queue.'
      } else {
        headline = title ? `Reopened task: “${title}”` : 'Reopened execution task'
      }
      break
    }

    case 'productivity.weekly_plan.created':
    case 'PRODUCTIVITY_WEEKLY_PLAN_CREATED':
      headline = 'Formulated weekly tactical plan'
      detail = 'Committed directional focus for the 7-day arc.'
      break

    case 'productivity.weekly_plan.updated':
    case 'PRODUCTIVITY_WEEKLY_PLAN_UPDATED':
      headline = 'Updated weekly tactical plan'
      break

    case 'productivity.weekly_review.upserted':
    case 'PRODUCTIVITY_WEEKLY_REVIEW_UPSERTED':
      headline = 'Executed Sunday strategic retrospective'
      detail = 'System metrics and longitudinal trajectory sealed.'
      break

    case 'productivity.goal.created':
    case 'PRODUCTIVITY_GOAL_CREATED':
      headline = title ? `Anchored strategic goal: “${title}”` : 'Anchored strategic goal'
      break

    case 'productivity.goal.status_changed':
    case 'PRODUCTIVITY_GOAL_STATUS_CHANGED':
      headline = title ? `Updated goal status: “${title}”` : 'Updated strategic goal status'
      break

    case 'productivity.weekly_plan_item.created':
    case 'PRODUCTIVITY_WEEKLY_PLAN_ITEM_CREATED':
      headline = title ? `Added plan directive: “${title}”` : 'Added strategic item to weekly plan'
      break

    case 'productivity.weekly_plan_item.updated':
    case 'PRODUCTIVITY_WEEKLY_PLAN_ITEM_UPDATED':
      headline = title ? `Updated plan item: “${title}”` : 'Updated weekly plan directive'
      break

    // Time OS
    case 'time.session.started':
    case 'TIME_TIME_LOG_STARTED':
      headline = category ? `Initiated focus block: ${category}` : 'Initiated focus session'
      detail = 'Single active timer constraint engaged.'
      break

    case 'time.session.logged':
    case 'DEEP_WORK_COMPLETED': {
      const durText = duration ? `${duration} min` : undefined
      const bucketText = category || 'Deep Work'
      headline = durText ? `Concluded focus session: ${bucketText} (${durText})` : `Concluded focus session: ${bucketText}`
      detail = 'Deep work minutes committed to the behavioral record.'
      break
    }

    case 'time.session.deleted':
    case 'TIME_TIME_LOG_DELETED':
      headline = 'Adjusted focus session record'
      break

    // Fitness OS
    case 'fitness.workout.started':
    case 'FITNESS_WORKOUT_STARTED':
      headline = title ? `Initiated training session: “${title}”` : 'Initiated physical training session'
      break

    case 'fitness.workout.completed':
    case 'FITNESS_WORKOUT_COMPLETED':
    case 'WORKOUT_COMPLETED': {
      const durText = duration ? `${duration} min` : undefined
      headline = title
        ? durText ? `Concluded physical training: “${title}” (${durText})` : `Concluded physical training: “${title}”`
        : 'Concluded physical training session'
      detail = 'Physical conditioning volume recorded in Fitness OS.'
      break
    }

    case 'fitness.workout.created':
    case 'FITNESS_WORKOUT_CREATED':
      headline = title ? `Chartered workout session: “${title}”` : 'Chartered workout session'
      break

    case 'fitness.workout.updated':
    case 'FITNESS_WORKOUT_UPDATED':
      headline = title ? `Updated workout: “${title}”` : 'Updated workout details'
      break

    case 'fitness.workout.deleted':
    case 'FITNESS_WORKOUT_DELETED':
      headline = title ? `Removed workout: “${title}”` : 'Removed workout from ledger'
      break

    case 'fitness.exercise_log.created':
    case 'FITNESS_EXERCISE_LOG_CREATED': {
      const sets = extractNumber(payload, ['sets'])
      const reps = extractNumber(payload, ['reps_total', 'reps'])
      const weight = extractNumber(payload, ['weight_kg', 'weight'])
      const setReps = sets && reps ? `${sets} sets × ${reps} reps` : undefined
      const weightStr = weight ? `${weight} kg` : undefined
      const specs = [setReps, weightStr].filter(Boolean).join(' @ ')

      headline = title ? `Logged set performance: ${title}` : 'Logged exercise movement set'
      detail = specs ? `Performance recorded: ${specs}` : undefined
      break
    }

    // Learning OS
    case 'learning.roadmap.created':
    case 'LEARNING_ROADMAP_CREATED':
      headline = title ? `Chartered curriculum roadmap: “${title}”` : 'Chartered curriculum roadmap'
      detail = 'Established structured learning syllabus in Learning OS.'
      break

    case 'learning.roadmap.status_changed':
    case 'LEARNING_ROADMAP_STATUS_CHANGED':
      headline = title ? `Curriculum status transitioned: “${title}”` : 'Curriculum roadmap status transitioned'
      break

    case 'learning.session.logged':
    case 'LEARNING_SESSION_LOGGED': {
      const durText = duration ? `${duration} min` : undefined
      headline = title
        ? durText ? `Completed curriculum study: “${title}” (${durText})` : `Completed curriculum study: “${title}”`
        : 'Completed curriculum study session'
      detail = 'Intellectual investment logged to Learning OS.'
      break
    }

    case 'learning.stage.skipped':
    case 'LEARNING_STAGE_SKIPPED':
      headline = title ? `Curriculum stage bypassed: “${title}”` : 'Curriculum stage bypassed'
      break

    case 'learning.session.skipped':
    case 'LEARNING_SESSION_SKIPPED':
      headline = title ? `Study unit bypassed: “${title}”` : 'Study unit bypassed'
      break

    case 'learning.milestone.achieved':
    case 'LEARNING_MILESTONE_ACHIEVED':
      headline = title ? `Achieved curriculum milestone: “${title}”` : 'Achieved curriculum milestone'
      detail = 'Proof-of-competence verified in learning archive.'
      break

    case 'learning.reflection.created':
    case 'LEARNING_REFLECTION_CREATED':
      headline = 'Inscribed conceptual study reflection'
      detail = extractString(payload, ['content', 'reflection'])
      break

    // Finance OS
    case 'finance.transaction.created':
    case 'FINANCE_TRANSACTION_CREATED':
    case 'WANT_EXPENSE_ADDED': {
      const typeStr = extractString(payload, ['type']) || 'Expenditure'
      const amtStr = amount != null ? `₹${amount.toLocaleString('en-IN')}` : undefined
      const catStr = category || extractString(payload, ['category'])
      const parts = [typeStr, amtStr, catStr].filter(Boolean).join(' • ')
      headline = `Logged financial transaction: ${parts}`
      break
    }

    case 'finance.transaction.deleted':
    case 'FINANCE_TRANSACTION_DELETED':
      headline = 'Removed transaction record'
      break

    // System
    case 'system.evening_sync.completed':
    case 'SYSTEM_EVENING_SYNC_COMPLETED':
      headline = 'Executed Evening Sync — System state sealed'
      detail = 'Momentum snapshot calculated and queue flushed.'
      break

    case 'HABIT_FAILED':
      headline = title ? `Observed streak break: “${title}”` : 'Habit streak break observed'
      detail = 'Recorded break event. Eligible for monthly healing token.'
      break

    default: {
      // Truthful generic fallback without ugly JSON or invented semantics
      const cleaned = rawType.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      headline = title ? `${cleaned}: “${title}”` : cleaned
      // Extract any simple human string from notes or reason if present
      const note = extractString(payload, ['note', 'notes', 'reason', 'message', 'description'])
      if (note && note.length > 0 && note.length < 150) {
        detail = note
      }
      break
    }
  }

  // Generate clean metadata summary for duration, amount, etc.
  const metaParts: string[] = []
  if (duration) metaParts.push(`${duration} min`)
  if (amount) metaParts.push(`₹${amount.toLocaleString('en-IN')}`)
  if (mood) metaParts.push(`Mood: ${mood}/5`)
  if (metaParts.length > 0) {
    metadataSummary = metaParts.join(' • ')
  }

  return {
    id: event.id,
    timestamp,
    domain,
    rawType,
    headline,
    detail,
    metadataSummary,
  }
}
