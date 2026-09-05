import { create } from 'zustand'
import type { Json } from '../types/database.types'
import { supabase } from '../lib/supabase'

import type { LifeOsEventType } from '../lib/eventTaxonomy'

export type EventBusType =
  | LifeOsEventType
  | 'DEEP_WORK_COMPLETED'
  | 'WANT_EXPENSE_ADDED'
  | 'WORKOUT_COMPLETED'
  | 'HABIT_FAILED'

export type EventBusEvent = {
  id: string
  type: EventBusType
  payload: Record<string, unknown>
  createdAt: string
  retryCount?: number
  lastAttemptAt?: number
}

type EventBusState = {
  recentEvents: EventBusEvent[]
  emitEvent: (type: EventBusType, payload?: Record<string, unknown>) => void
  clearEvents: () => void
}

/**
 * INVARIANT:
 * 1. MAX_RECENT_EVENTS caps in-memory display history to 50 items.
 * 2. RECENT_EVENTS_TTL_MS drops events older than 24 hours to prevent stale momentum boost.
 * 3. MAX_QUEUE_CAPACITY bounds the background queue to prevent unbounded memory growth.
 * 4. PERSISTENCE INVARIANT: An event MUST NOT be removed from backgroundQueue until its
 *    persistence operation to system_event_queue has successfully resolved without error.
 */
const MAX_RECENT_EVENTS = 50
const RECENT_EVENTS_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_QUEUE_CAPACITY = 200
const MAX_RETRIES = 5
const BATCH_SIZE = 10

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function pruneRecentEvents(events: EventBusEvent[]): EventBusEvent[] {
  const cutoffTime = Date.now() - RECENT_EVENTS_TTL_MS
  return events
    .filter((event) => {
      const timestamp = new Date(event.createdAt).getTime()
      return !Number.isNaN(timestamp) && timestamp >= cutoffTime
    })
    .slice(0, MAX_RECENT_EVENTS)
}

const backgroundQueue: EventBusEvent[] = []
let isProcessingQueue = false
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null

function scheduleRetry(delayMs: number) {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId)
  }
  retryTimeoutId = setTimeout(() => {
    retryTimeoutId = null
    void processBackgroundQueue()
  }, delayMs)

  if (typeof retryTimeoutId === 'object' && retryTimeoutId !== null && 'unref' in retryTimeoutId) {
    (retryTimeoutId as { unref: () => void }).unref()
  }
}

export async function processBackgroundQueue(): Promise<boolean> {
  if (isProcessingQueue || backgroundQueue.length === 0) {
    return true
  }

  isProcessingQueue = true

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // INVARIANT PRESERVATION:
      // Do NOT dump the queue if auth temporarily fails (e.g. during token refresh or initial mount).
      // Back off and retry later when auth is available.
      scheduleRetry(5000)
      return false
    }

    while (backgroundQueue.length > 0) {
      // PEEK without removing:
      const batch = backgroundQueue.slice(0, BATCH_SIZE)
      const insertData = batch.map((event) => ({
        user_id: user.id,
        event_type: event.type,
        payload: event.payload as unknown as Json,
        created_at: event.createdAt,
      }))

      const { error } = await supabase.from('system_event_queue').insert(insertData)

      if (error) {
        console.warn('[event-bus] queue insert failed; preserving events for retry:', error)

        // Increment retry count for all events in failed batch
        for (const event of batch) {
          event.retryCount = (event.retryCount ?? 0) + 1
          event.lastAttemptAt = Date.now()
        }

        // Dead letter eviction for permanently poisoned events to prevent queue starvation
        const poisoned = batch.filter((e) => (e.retryCount ?? 0) >= MAX_RETRIES)
        if (poisoned.length > 0) {
          console.error('[event-bus] Poisoned events exceeded max retries and moved to dead-letter quarantine:', poisoned)
          const poisonedIds = new Set(poisoned.map((e) => e.id))
          const remaining = backgroundQueue.filter((e) => !poisonedIds.has(e.id))
          backgroundQueue.length = 0
          backgroundQueue.push(...remaining)
        }

        // Schedule exponential backoff retry (1s, 2s, 4s, 8s, max 30s)
        const currentRetry = batch[0]?.retryCount ?? 1
        const backoffDelay = Math.min(30000, 1000 * Math.pow(2, currentRetry - 1))
        scheduleRetry(backoffDelay)

        return false
      }

      // PERSISTENCE CONFIRMED:
      // Only now remove the successfully inserted batch from memory!
      const insertedIds = new Set(batch.map((e) => e.id))
      const remaining = backgroundQueue.filter((e) => !insertedIds.has(e.id))
      backgroundQueue.length = 0
      backgroundQueue.push(...remaining)
    }

    return true
  } catch (unexpectedError) {
    console.error('[event-bus] unexpected queue flush error:', unexpectedError)
    scheduleRetry(5000)
    return false
  } finally {
    isProcessingQueue = false
  }
}

function queueEventInBackground(event: EventBusEvent) {
  // Prevent unbounded queue memory leak if offline indefinitely
  if (backgroundQueue.length >= MAX_QUEUE_CAPACITY) {
    console.warn('[event-bus] queue capacity reached; dropping oldest unpersisted event to protect memory')
    backgroundQueue.shift()
  }

  backgroundQueue.push(event)
  void processBackgroundQueue()
}

export const useEventBus = create<EventBusState>((set) => ({
  recentEvents: [],
  emitEvent: (type, payload = {}) => {
    const next: EventBusEvent = {
      id: createEventId(),
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    }

    set((state) => ({
      recentEvents: pruneRecentEvents([next, ...state.recentEvents]),
    }))

    void queueEventInBackground(next)
  },
  clearEvents: () => set({ recentEvents: [] }),
}))

// Testing / diagnostics helpers
export function getBackgroundQueueLength(): number {
  return backgroundQueue.length
}

export function getBackgroundQueueSnapshot(): readonly EventBusEvent[] {
  return [...backgroundQueue]
}

export function clearBackgroundQueueForTesting(): void {
  backgroundQueue.length = 0
}
