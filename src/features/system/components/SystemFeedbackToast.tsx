import { useEffect, useState } from 'react'

import { subscribeSystemFeedback, type SystemFeedbackPayload } from '../feedback'

function SystemFeedbackToast() {
  const [payload, setPayload] = useState<SystemFeedbackPayload | null>(null)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = subscribeSystemFeedback((nextPayload) => {
      setPayload(nextPayload)

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        setPayload(null)
      }, 2200)
    })

    return () => {
      unsubscribe()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [])

  if (!payload) {
    return null
  }

  return (
    <aside className="pointer-events-none fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-[#222222] bg-[#0a0a0a] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <p className="text-sm font-semibold text-slate-100">{payload.title}</p>
      <p className="mt-1 text-xs text-slate-300">{payload.description}</p>
    </aside>
  )
}

export default SystemFeedbackToast
