import { create } from 'zustand'

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

export const useEventBus = create<EventBusState>((set) => ({
  recentEvents: [],
  emitEvent: (type, payload = {}) =>
    set((state) => {
      const next: EventBusEvent = {
        id: createEventId(),
        type,
        payload,
        createdAt: new Date().toISOString(),
      }

      return {
        recentEvents: [next, ...state.recentEvents].slice(0, MAX_RECENT_EVENTS),
      }
    }),
  clearEvents: () => set({ recentEvents: [] }),
}))

