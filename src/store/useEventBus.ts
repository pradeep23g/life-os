import { create } from 'zustand'

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

async function queueEventInBackground(event: EventBusEvent) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return
  }

  const { error } = await supabase.from('system_event_queue').insert({
    user_id: user.id,
    event_type: event.type,
    payload: event.payload,
    created_at: event.createdAt,
  })

  if (error) {
    console.warn('[event-bus] queue insert failed', error)
  }
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
