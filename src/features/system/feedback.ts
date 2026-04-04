export type SystemFeedbackPayload = {
  title: string
  description: string
}

const SYSTEM_FEEDBACK_EVENT = 'life-os:system-feedback'

export function emitSystemFeedback(payload: SystemFeedbackPayload) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent<SystemFeedbackPayload>(SYSTEM_FEEDBACK_EVENT, { detail: payload }))
}

export function subscribeSystemFeedback(listener: (payload: SystemFeedbackPayload) => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SystemFeedbackPayload>
    listener(customEvent.detail)
  }

  window.addEventListener(SYSTEM_FEEDBACK_EVENT, handler)

  return () => {
    window.removeEventListener(SYSTEM_FEEDBACK_EVENT, handler)
  }
}
