import { create } from 'zustand'
import type { Json } from '../types/database.types'
import { supabase } from '../lib/supabase'

export type EventBusType =
  | 'DEEP_WORK_COMPLETED'
  | 'WANT_EXPENSE_ADDED'
  | 'WORKOUT_COMPLETED'
  | 'HABIT_FAILED'

export type EventBusEvent = {
  id: string
  type: EventBusType
  payload: Record<string, unknown>
  createdAt: string
}

type EventBusState = {
  recentEvents: EventBusEvent[]
  emitEvent: (type: EventBusType, payload?: Record<string, unknown>) => void
  clearEvents: () => void
}

const MAX_RECENT_EVENTS = 50

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const backgroundQueue: EventBusEvent[] = []
let isProcessingQueue = false

async function processBackgroundQueue() {
  if (isProcessingQueue || backgroundQueue.length === 0) {
    return
  }

  isProcessingQueue = true

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      backgroundQueue.length = 0 // Clear if not auth'd to prevent memory leak
      return
    }

    while (backgroundQueue.length > 0) {
      const batch = backgroundQueue.splice(0, 10)
      const insertData = batch.map((event) => ({
        user_id: user.id,
        event_type: event.type,
        payload: event.payload as unknown as Json,
        created_at: event.createdAt,
      }))

      const { error } = await supabase.from('system_event_queue').insert(insertData)

      if (error) {
        console.warn('[event-bus] queue insert failed', error)
      }
    }
  } finally {
    isProcessingQueue = false
  }
}

function queueEventInBackground(event: EventBusEvent) {
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
    }

    set((state) => ({
      recentEvents: [next, ...state.recentEvents].slice(0, MAX_RECENT_EVENTS),
    }))

    void queueEventInBackground(next)
  },
  clearEvents: () => set({ recentEvents: [] }),
}))
