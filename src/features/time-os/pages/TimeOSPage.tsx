import { useEffect, useMemo, useState } from 'react'

import { useTasks } from '../../productivity-hub/api/useTasks'
import TimeInsights from '../components/TimeInsights'
import {
  TIME_BUCKETS,
  useActiveTimer,
  useCompletedTimeLogs,
  useDeleteTimeLog,
  useManualLog,
  useStartTimer,
  useStopTimer,
} from '../api/useTimeLogs'
import type { TimeBucket } from '../api/useTimeLogs'

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

function toDateTimeLocalValue(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  )
}

function TimeOSPage() {
  const { data: activeTimer } = useActiveTimer()
  const { data: completedLogs = [], isLoading: completedLoading } = useCompletedTimeLogs()
  const { data: tasks = [] } = useTasks()
  const { mutate: startTimer, isPending: isStarting, error: startError } = useStartTimer()
  const { mutate: stopTimer, isPending: isStopping, error: stopError } = useStopTimer()
  const { mutate: createManualLog, isPending: isSavingManual, error: manualError } = useManualLog()
  const { mutate: deleteTimeLog, isPending: isDeletingLog } = useDeleteTimeLog()

  const [bucket, setBucket] = useState<TimeBucket>('Deep Work')
  const [taskId, setTaskId] = useState('')
  const [description, setDescription] = useState('')
  const [manualBucket, setManualBucket] = useState<TimeBucket>('Learning')
  const [manualStart, setManualStart] = useState(() => toDateTimeLocalValue(new Date(Date.now() - 30 * 60 * 1000)))
  const [manualEnd, setManualEnd] = useState(() => toDateTimeLocalValue(new Date()))
  const [now, setNow] = useState(() => Date.now())
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logTab, setLogTab] = useState<'live' | 'manual'>('live')

  useEffect(() => {
    if (!activeTimer) {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [activeTimer])

  const elapsedLabel = useMemo(() => {
    if (!activeTimer) {
      return '00:00:00'
    }

    return formatElapsed(now - new Date(activeTimer.start_time).getTime())
  }, [activeTimer, now])

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-slate-100">Time OS</h2>
        <p className="mt-1 text-sm text-slate-400">Track focused sessions and optionally link them to productivity tasks.</p>
      </article>

      <TimeInsights />

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">Active Session</h3>
        {activeTimer ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-200">
              {activeTimer.bucket} | {elapsedLabel}
            </p>
            {activeTimer.description ? <p className="text-xs text-slate-400">{activeTimer.description}</p> : null}
            <button
              type="button"
              onClick={() => stopTimer()}
              disabled={isStopping}
              className="rounded-md border border-[#222222] bg-black px-3 py-2 text-sm text-slate-100 hover:bg-slate-950 disabled:opacity-60"
            >
              {isStopping ? 'Stopping...' : 'Stop Timer'}
            </button>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">No active timer running.</p>
        )}
        {stopError ? <p className="mt-2 text-xs text-red-400">{stopError.message}</p> : null}
      </article>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">Recent Sessions</h3>
        {completedLoading ? <p className="mt-2 text-sm text-slate-400">Loading session history...</p> : null}
        {!completedLoading && completedLogs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No completed sessions yet.</p>
        ) : null}

        {!completedLoading && completedLogs.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {completedLogs.slice(0, 12).map((log) => (
              <li key={log.id} className="group rounded-lg border border-[#222222] bg-black p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      {log.bucket} | {log.duration_minutes ?? 0} min
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(log.start_time).toLocaleString()} -&gt; {log.end_time ? new Date(log.end_time).toLocaleString() : '-'}
                    </p>
                    {log.task_title ? <p className="mt-1 text-xs text-slate-300">Task: {log.task_title}</p> : null}
                    {log.description ? <p className="mt-1 text-xs text-slate-300">{log.description}</p> : null}
                  </div>
                  <button
                    type="button"
                    disabled={isDeletingLog}
                    onClick={() => {
                      const confirmed = window.confirm('Delete this time log?')
                      if (!confirmed) return
                      deleteTimeLog({ id: log.id })
                    }}
                    className="p-3 text-neutral-600 opacity-100 transition-colors hover:text-red-500 sm:p-2 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Delete time log"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <button
        type="button"
        onClick={() => setIsLogModalOpen(true)}
        className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#222222] bg-[#0a0a0a] text-2xl text-slate-100 shadow-xl shadow-black/60 transition hover:bg-[#222222]"
        aria-label="Open time log actions"
      >
        +
      </button>

      {isLogModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
          <button
            type="button"
            onClick={() => setIsLogModalOpen(false)}
            className="absolute inset-0 bg-black/85"
            aria-label="Close time log modal"
          />
          <article className="relative z-10 max-h-[88vh] w-[90%] max-w-4xl overflow-y-auto rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-100">Log Focus Session</h3>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="rounded border border-[#222222] bg-black px-3 py-1 text-sm text-slate-200 hover:bg-[#222222]"
              >
                Close
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => setLogTab('live')}
                className={`rounded-md border px-3 py-1.5 text-sm ${logTab === 'live' ? 'border-emerald-900 text-emerald-400 bg-emerald-950/20' : 'border-[#222222] text-slate-300 hover:bg-[#222222]'}`}
              >
                Live Focus
              </button>
              <button
                type="button"
                onClick={() => setLogTab('manual')}
                className={`rounded-md border px-3 py-1.5 text-sm ${logTab === 'manual' ? 'border-emerald-900 text-emerald-400 bg-emerald-950/20' : 'border-[#222222] text-slate-300 hover:bg-[#222222]'}`}
              >
                Manual Log
              </button>
            </div>

            {logTab === 'live' ? (
              <>
                <div className="grid gap-2 md:grid-cols-[200px_1fr_220px]">
                  <select
                    value={bucket}
                    onChange={(event) => setBucket(event.target.value as TimeBucket)}
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  >
                    {TIME_BUCKETS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Description (optional)"
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  />

                  <select
                    value={taskId}
                    onChange={(event) => setTaskId(event.target.value)}
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  >
                    <option value="">Link task (optional)</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startTimer({
                      bucket,
                      taskId: taskId || null,
                      description,
                    })
                  }
                  disabled={Boolean(activeTimer) || isStarting}
                  className="mt-3 rounded-md border border-[#222222] bg-black px-3 py-2 text-sm text-slate-100 hover:bg-slate-950 disabled:opacity-60"
                >
                  {isStarting ? 'Starting...' : 'Start Timer'}
                </button>
                {startError ? <p className="mt-2 text-xs text-red-400">{startError.message}</p> : null}
              </>
            ) : (
              <>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    type="datetime-local"
                    value={manualStart}
                    onChange={(event) => setManualStart(event.target.value)}
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  />
                  <input
                    type="datetime-local"
                    value={manualEnd}
                    onChange={(event) => setManualEnd(event.target.value)}
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  />
                  <select
                    value={manualBucket}
                    onChange={(event) => setManualBucket(event.target.value as TimeBucket)}
                    className="rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
                  >
                    {TIME_BUCKETS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    createManualLog({
                      bucket: manualBucket,
                      startTime: manualStart,
                      endTime: manualEnd,
                      taskId: taskId || null,
                      description: description || undefined,
                    })
                  }
                  disabled={isSavingManual}
                  className="mt-3 rounded-md border border-[#222222] bg-black px-3 py-2 text-sm text-slate-100 hover:bg-slate-950 disabled:opacity-60"
                >
                  {isSavingManual ? 'Saving...' : 'Save Manual Log'}
                </button>
                {manualError ? <p className="mt-2 text-xs text-red-400">{manualError.message}</p> : null}
              </>
            )}
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default TimeOSPage
