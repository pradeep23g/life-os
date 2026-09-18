import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useActiveTimer, useStartTimer, TIME_BUCKETS } from '../../time-os/api/useTimeLogs'
import type { TimeBucket } from '../../time-os/api/useTimeLogs'
import {
  type Task,
  type TaskDeadlineType,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useToggleTaskCompletion,
} from '../api/useTasks'
import { LoadingView } from '../../../components/LoadingView'
import {
  buildMonthGrid,
  formatIndiaDate,
  formatIndiaDateTime,
  getMonthLabel,
  shiftMonth,
  toIndiaDateKey,
} from '../../mind-os/utils/date'
import { DeleteButton } from '../../../components/DeleteButton'

const weekdayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const deadlineOptions: Array<{ value: TaskDeadlineType; label: string }> = [
  { value: 'same_day', label: 'Same Day' },
  { value: 'no_deadline', label: 'No Deadline' },
  { value: 'specific_date', label: 'Specific Date' },
]

type DayActivity = {
  created: Task[]
  completed: Task[]
  duePending: Task[]
}

function getDateKeyFromIso(value: string): string {
  return toIndiaDateKey(value)
}

function isTaskActive(task: Task, todayKey: string) {
  if (task.is_completed) {
    return false
  }

  if (task.deadline_type === 'no_deadline') {
    return true
  }

  if (task.deadline_type === 'specific_date') {
    return task.deadline_date !== null && todayKey <= task.deadline_date
  }

  return getDateKeyFromIso(task.created_at) === todayKey
}

function getTaskTimelineLabel(task: Task) {
  if (task.deadline_type === 'same_day') {
    return 'Same day'
  }

  if (task.deadline_type === 'specific_date') {
    return task.deadline_date ? `Due ${formatIndiaDate(task.deadline_date)}` : 'Specific date'
  }

  return 'No deadline'
}

function TasksPage() {
  const { data: tasks = [], isLoading, isError, error } = useTasks()
  const { mutate: createTask, isPending: isCreating, error: createError } = useCreateTask()
  const { mutate: toggleCompletion, isPending: isUpdating, error: updateError } = useToggleTaskCompletion()
  const { mutate: deleteTask, error: deleteError } = useDeleteTask()
  const { data: activeTimer } = useActiveTimer()
  const { mutate: startTimer, isPending: isStartingTimer, error: startTimerError } = useStartTimer()

  const [title, setTitle] = useState('')
  const [deadlineType, setDeadlineType] = useState<TaskDeadlineType>('no_deadline')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null)
  const [focusBucket, setFocusBucket] = useState<TimeBucket>('Deep Work')
  const [focusDescription, setFocusDescription] = useState('')

  const todayKey = toIndiaDateKey(new Date())
  const monthCells = useMemo(() => buildMonthGrid(calendarMonth), [calendarMonth])

  const selectedDateLabel = selectedDateKey ? formatIndiaDate(selectedDateKey) : null

  const dayActivityByDate = useMemo(() => {
    const map = new Map<string, DayActivity>()

    for (const task of tasks) {
      const createdKey = getDateKeyFromIso(task.created_at)
      const createdDay = map.get(createdKey) ?? { created: [], completed: [], duePending: [] }
      createdDay.created.push(task)
      map.set(createdKey, createdDay)

      if (task.is_completed) {
        const completedKey = getDateKeyFromIso(task.updated_at)
        const completedDay = map.get(completedKey) ?? { created: [], completed: [], duePending: [] }
        completedDay.completed.push(task)
        map.set(completedKey, completedDay)
      }

      if (!task.is_completed && task.deadline_type === 'specific_date' && task.deadline_date) {
        const dueDay = map.get(task.deadline_date) ?? { created: [], completed: [], duePending: [] }
        dueDay.duePending.push(task)
        map.set(task.deadline_date, dueDay)
      }
    }

    return map
  }, [tasks])

  const activeTasks = useMemo(() => {
    return tasks.filter((task) => isTaskActive(task, todayKey))
  }, [tasks, todayKey])

  const selectedDayActivity = selectedDateKey
    ? dayActivityByDate.get(selectedDateKey) ?? { created: [], completed: [], duePending: [] }
    : null

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      return
    }

    createTask(
      {
        title: trimmedTitle,
        deadlineType,
        deadlineDate: deadlineType === 'specific_date' ? deadlineDate : null,
      },
      {
        onSuccess: () => {
          setTitle('')
          setDeadlineType('no_deadline')
          setDeadlineDate('')
        },
      },
    )
  }

  const handleStartFocus = (taskId: string) => {
    startTimer(
      {
        taskId,
        bucket: focusBucket,
        description: focusDescription,
      },
      {
        onSuccess: () => {
          setFocusTaskId(null)
          setFocusBucket('Deep Work')
          setFocusDescription('')
        },
      },
    )
  }

  return (
    <section className="space-y-8 pb-28 sm:pb-24 font-sans text-text-primary max-w-5xl mx-auto px-2 sm:px-4">
      {/* ─── Task Entry Ledger ─── */}
      <div className="border-b border-border/40 pb-6 space-y-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-baseline lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-tertiary">
              <span>Task Ledger</span>
              <span>•</span>
              <span className="tabular-nums">{tasks.length} Total Registered</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              Temporal Task Ledger
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Calendar-first execution tracking with historical visibility and active deadline pressure.
            </p>
          </div>
          <div className="rounded border border-border/40 bg-surface px-3 py-1.5 font-mono text-xs">
            <span className="text-text-tertiary">Active Queue: </span>
            <span className="tabular-nums font-semibold text-text-primary">
              {isLoading ? '--' : activeTasks.length}
            </span>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px_140px]">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Log a new task..."
            className="rounded border border-border/50 bg-surface p-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent-primary transition-colors"
          />

          <div className="rounded border border-border/50 bg-surface p-2">
            <p className="text-xs font-mono text-text-tertiary">Deadline Horizon</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {deadlineOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDeadlineType(option.value)}
                  className={`rounded border px-2 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                    deadlineType === option.value
                      ? 'border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                      : 'border-border/40 bg-surface text-text-secondary hover:bg-elevated'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {deadlineType === 'specific_date' ? (
              <input
                type="date"
                value={deadlineDate}
                onChange={(event) => setDeadlineDate(event.target.value)}
                className="mt-2 w-full rounded border border-border bg-background p-2 font-mono text-xs text-text-primary outline-none focus:border-accent-primary"
              />
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isCreating || !title.trim() || (deadlineType === 'specific_date' && !deadlineDate)}
            className="rounded border border-border bg-surface px-4 py-3 font-mono text-xs text-text-primary transition-all hover:bg-elevated active:scale-95 disabled:opacity-40 cursor-pointer"
          >
            {isCreating ? 'Logging...' : 'Queue Task ↵'}
          </button>
        </form>

        {createError ? <p className="text-xs font-mono text-threat-critical">{createError.message}</p> : null}
      </div>

      {isError ? <p className="text-xs font-mono text-threat-critical">{error.message}</p> : null}
      {updateError ? <p className="text-xs font-mono text-threat-critical">{updateError.message}</p> : null}
      {deleteError ? <p className="text-xs font-mono text-threat-critical">{deleteError.message}</p> : null}
      {startTimerError ? <p className="text-xs font-mono text-threat-critical">{startTimerError.message}</p> : null}

      {/* ─── Calendar Ledger & Active Focus Ledger ─── */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.35fr_0.95fr]">
        {/* Left Column: Monthly Calendar Ledger */}
        <section className="space-y-4" aria-label="Monthly Calendar Ledger">
          <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-3">
            <div>
              <h3 className="font-sans text-base font-semibold text-text-primary">Monthly Calendar Ledger</h3>
              <p className="mt-0.5 text-xs text-text-tertiary">
                Cells indicate deadlines, creation events, and completions for that exact date.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded border border-border/40 bg-surface px-2.5 py-1 text-text-secondary hover:bg-elevated cursor-pointer"
              >
                Prev
              </button>
              <p className="font-semibold tabular-nums text-text-primary min-w-[5rem] text-center">
                {getMonthLabel(calendarMonth)}
              </p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded border border-border/40 bg-surface px-2.5 py-1 text-text-secondary hover:bg-elevated cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-xs text-text-tertiary uppercase">
            {weekdayHeaders.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((day) => {
              const activity = dayActivityByDate.get(day.dateKey) ?? { created: [], completed: [], duePending: [] }
              const hasWarning = activity.duePending.length > 0
              const hasCreated = activity.created.length > 0
              const hasCompleted = activity.completed.length > 0
              const isSelected = selectedDateKey === day.dateKey

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDateKey((previous) => (previous === day.dateKey ? null : day.dateKey))}
                  className={`min-h-[100px] rounded border p-2 text-left transition-colors cursor-pointer ${
                    hasWarning
                      ? 'border-threat-warning/60 bg-threat-warning/10'
                      : hasCompleted
                        ? 'border-threat-healthy/40 bg-threat-healthy/10'
                        : hasCreated
                          ? 'border-accent-primary/40 bg-accent-primary/10'
                          : 'border-border/30 bg-surface/50'
                  } ${day.inCurrentMonth ? '' : 'opacity-30'} ${isSelected ? 'ring-1 ring-accent-primary' : ''}`}
                >
                  <p className="font-mono text-xs font-semibold tabular-nums text-text-primary">{day.day}</p>
                  <div className="mt-2 space-y-0.5 font-mono text-[11px] tabular-nums">
                    {activity.created.length > 0 && (
                      <p className="text-text-tertiary">
                        +<span className="text-text-secondary">{activity.created.length}</span>
                      </p>
                    )}
                    {activity.completed.length > 0 && (
                      <p className="text-threat-healthy">
                        ✓<span>{activity.completed.length}</span>
                      </p>
                    )}
                    {activity.duePending.length > 0 && (
                      <p className="text-threat-warning font-semibold">
                        !<span>{activity.duePending.length} due</span>
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected Date Activity Drawer */}
          {selectedDayActivity ? (
            <div className="border border-border/40 bg-surface/80 p-4 space-y-4 rounded">
              <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-2">
                <div>
                  <h4 className="font-sans text-sm font-semibold text-text-primary">{selectedDateLabel}</h4>
                  <p className="text-xs font-mono text-text-tertiary">Daily activity breakdown</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(null)}
                  className="rounded border border-border/40 bg-surface px-2 py-0.5 font-mono text-xs text-text-secondary hover:bg-elevated cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="font-mono text-xs font-semibold uppercase text-text-secondary">
                    Created ({selectedDayActivity.created.length})
                  </p>
                  {selectedDayActivity.created.length === 0 ? (
                    <p className="text-xs font-mono text-text-tertiary">None recorded.</p>
                  ) : null}
                  <ul className="space-y-1.5">
                    {selectedDayActivity.created.map((task) => (
                      <li key={`created-${task.id}`} className="rounded border border-border/30 bg-surface p-2 text-xs">
                        <p className="font-medium text-text-primary">{task.title}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-text-tertiary tabular-nums">
                          {getTaskTimelineLabel(task)} • {formatIndiaDateTime(task.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-xs font-semibold uppercase text-text-secondary">
                    Completed ({selectedDayActivity.completed.length})
                  </p>
                  {selectedDayActivity.completed.length === 0 ? (
                    <p className="text-xs font-mono text-text-tertiary">None recorded.</p>
                  ) : null}
                  <ul className="space-y-1.5">
                    {selectedDayActivity.completed.map((task) => (
                      <li key={`completed-${task.id}`} className="rounded border border-border/30 bg-surface p-2 text-xs">
                        <p className="font-medium text-text-primary line-through text-text-tertiary">{task.title}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-threat-healthy tabular-nums">
                          Done • {formatIndiaDateTime(task.updated_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Right Column: Active Focus Ledger */}
        <section className="space-y-4" aria-label="Active Focus Ledger">
          <div className="flex items-center justify-between gap-3 border-b border-border/30 pb-3">
            <div>
              <h3 className="font-sans text-base font-semibold text-text-primary">Active Focus Ledger</h3>
              <p className="mt-0.5 text-xs text-text-tertiary">Tasks currently actionable in this window.</p>
            </div>
            <span className="font-mono text-xs tabular-nums text-text-tertiary">
              {isLoading ? '--' : `${activeTasks.length} active`}
            </span>
          </div>

          {isLoading ? (
            <div className="py-6">
              <LoadingView
                variant="inline"
                label="Indexing Task Ledger"
                sublabel="Loading actionable assignments..."
              />
            </div>
          ) : null}
          {!isLoading && activeTasks.length === 0 ? (
            <p className="font-mono text-xs text-text-tertiary">No active tasks in current window.</p>
          ) : null}

          <ul className="divide-y divide-border/20 border-b border-border/30">
            {activeTasks.map((task) => (
              <li key={task.id} className="py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex min-w-0 flex-1 items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={(event) => toggleCompletion({ id: task.id, isCompleted: event.target.checked })}
                      disabled={isUpdating}
                      className="mt-0.5 h-4 w-4 rounded border-border bg-surface text-accent-primary focus:ring-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-medium text-text-primary leading-snug">{task.title}</p>
                      <p className="mt-0.5 font-mono text-xs text-text-tertiary tabular-nums">
                        {getTaskTimelineLabel(task)} • Created {formatIndiaDateTime(task.created_at)}
                      </p>
                    </div>
                  </label>

                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('Archive this task?')) {
                        deleteTask({ id: task.id })
                      }
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 pl-6">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusTaskId((previous) => (previous === task.id ? null : task.id))
                      setFocusBucket('Deep Work')
                      setFocusDescription('')
                    }}
                    disabled={Boolean(activeTimer) || isStartingTimer}
                    className="rounded border border-border/40 bg-surface px-2 py-0.5 font-mono text-xs text-text-secondary hover:bg-elevated hover:text-text-primary disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {activeTimer?.task_id === task.id ? 'Running' : 'Launch Focus'}
                  </button>
                </div>

                {focusTaskId === task.id ? (
                  <div className="ml-6 mt-2 rounded border border-border/40 bg-surface/90 p-3 space-y-2 text-xs">
                    <div>
                      <label className="font-mono text-[11px] text-text-tertiary">Focus Bucket</label>
                      <select
                        value={focusBucket}
                        onChange={(event) => setFocusBucket(event.target.value as TimeBucket)}
                        className="mt-1 w-full rounded border border-border bg-background p-1.5 font-sans text-xs text-text-primary"
                      >
                        {TIME_BUCKETS.map((bucket) => (
                          <option key={bucket} value={bucket}>
                            {bucket}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={focusDescription}
                      onChange={(event) => setFocusDescription(event.target.value)}
                      placeholder="Quick note (optional)"
                      className="w-full rounded border border-border bg-background p-1.5 font-sans text-xs text-text-primary outline-none focus:border-accent-primary"
                    />

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartFocus(task.id)}
                        disabled={isStartingTimer || Boolean(activeTimer)}
                        className="rounded border border-accent-primary bg-accent-primary px-3 py-1 font-sans text-xs font-medium text-background hover:opacity-90 disabled:opacity-40 cursor-pointer"
                      >
                        {isStartingTimer ? 'Initiating...' : 'Start Session'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusTaskId(null)}
                        className="rounded px-3 py-1 font-sans text-xs text-text-tertiary hover:text-text-secondary cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {activeTimer ? (
                      <p className="font-mono text-[11px] text-threat-warning">
                        Another focus session is currently active. Stop it first.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {isUpdating ? <p className="font-mono text-xs text-text-tertiary">Updating task completion...</p> : null}
    </section>
  )
}

export default TasksPage
