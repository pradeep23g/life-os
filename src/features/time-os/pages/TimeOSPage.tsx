import { useEffect, useMemo, useState } from 'react'

import { useTasks } from '../../productivity-hub/api/useTasks'
import TimeInsights from '../components/TimeInsights'
import { TIME_BUCKETS, useActiveTimer, useCompletedTimeLogs, useManualLog, useStartTimer, useStopTimer } from '../api/useTimeLogs'
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

function TimeOSPage() {
  const { data: activeTimer } = useActiveTimer()
  const { data: completedLogs = [], isLoading: completedLoading } = useCompletedTimeLogs()
  const { data: tasks = [] } = useTasks()
  const { mutate: startTimer, isPending: isStarting, error: startError } = useStartTimer()
  const { mutate: stopTimer, isPending: isStopping, error: stopError } = useStopTimer()
  const { mutate: createManualLog, isPending: isSavingManual, error: manualError } = useManualLog()

  const [bucket, setBucket] = useState<TimeBucket>('Deep Work')
  const [taskId, setTaskId] = useState('')
  const [description, setDescription] = useState('')
  const [manualBucket, setManualBucket] = useState<TimeBucket>('Learning')
  const [manualStart, setManualStart] = useState(() => toDateTimeLocalValue(new Date(Date.now() - 30 * 60 * 1000)))
  const [manualEnd, setManualEnd] = useState(() => toDateTimeLocalValue(new Date()))
  const [now, setNow] = useState(() => Date.now())

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
      <TimeInsights />

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-slate-100">Time OS</h2>
        <p className="mt-1 text-sm text-slate-400">Track focused sessions and optionally link them to productivity tasks.</p>
      </article>

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">Active Session</h3>
        {activeTimer ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-200">
              {activeTimer.bucket} • {elapsedLabel}
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

      <article className="max-w-4xl rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">Start New Focus Session</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-[200px_1fr_220px]">
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
      </article>

      <article className="max-w-4xl rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-semibold text-slate-100">Manual Time Log</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
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
              <li key={log.id} className="rounded-lg border border-[#222222] bg-black p-3">
                <p className="text-sm font-medium text-slate-100">
                  {log.bucket} • {log.duration_minutes ?? 0} min
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(log.start_time).toLocaleString()} → {log.end_time ? new Date(log.end_time).toLocaleString() : '-'}
                </p>
                {log.task_title ? <p className="mt-1 text-xs text-slate-300">Task: {log.task_title}</p> : null}
                {log.description ? <p className="mt-1 text-xs text-slate-300">{log.description}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </section>
  )
}

export default TimeOSPage
