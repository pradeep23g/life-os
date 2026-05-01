import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useActiveTimer } from '../api/useTimeLogs'

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

function GlobalTimerBar() {
  const navigate = useNavigate()
  const { data: activeTimer } = useActiveTimer()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!activeTimer) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [activeTimer])

  const elapsedLabel = useMemo(() => {
    if (!activeTimer) {
      return '00:00:00'
    }

    return formatElapsed(now - new Date(activeTimer.start_time).getTime())
  }, [activeTimer, now])

  if (!activeTimer) {
    return null
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/time-os')}
      className="fixed right-4 top-16 z-40 inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#222222] bg-[#0a0a0a] px-2 text-center text-[11px] font-semibold leading-tight text-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:bg-black"
      title={`${activeTimer.bucket} session`}
    >
      {elapsedLabel}
    </button>
  )
}

export default GlobalTimerBar
