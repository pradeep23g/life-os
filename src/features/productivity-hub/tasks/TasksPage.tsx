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
    <section className="space-y-4 bg-black pb-24">
      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Task Ledger</h2>
            <p className="mt-1 text-sm text-slate-400">Calendar-first execution tracking with historical visibility and active task pressure.</p>
          </div>
          <div className="rounded-lg border border-border bg-black px-3 py-2">
            <p className="text-xs text-slate-400">Active Queue</p>
            <p className="mt-1 text-base font-semibold text-slate-100">{isLoading ? '--' : activeTasks.length}</p>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px_160px]">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Log a new task"
            className="rounded-lg border border-border bg-black p-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-600"
          />

          <div className="rounded-lg border border-border bg-black p-2">
            <p className="text-xs text-slate-400">Deadline Type</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {deadlineOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDeadlineType(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    deadlineType === option.value
                      ? 'border-green-900 bg-green-950/20 text-green-300'
                      : 'border-border bg-surface text-slate-300 hover:bg-[#111111]'
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
                className="mt-2 w-full rounded-lg border border-border bg-black p-2 text-sm text-slate-100 outline-none focus:border-slate-600"
              />
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isCreating || !title.trim() || (deadlineType === 'specific_date' && !deadlineDate)}
            className="rounded-lg border border-border bg-[#111111] px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-[#222222] disabled:opacity-60"
          >
            {isCreating ? 'Creating...' : 'Add Task'}
          </button>
        </form>

        {createError ? <p className="mt-3 text-sm text-red-400">{createError.message}</p> : null}
      </article>

      {isError ? <p className="text-sm text-red-400">{error.message}</p> : null}
      {updateError ? <p className="text-sm text-red-400">{updateError.message}</p> : null}
      {deleteError ? <p className="text-sm text-red-400">{deleteError.message}</p> : null}
      {startTimerError ? <p className="text-sm text-red-400">{startTimerError.message}</p> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Monthly Calendar Ledger</h3>
              <p className="mt-1 text-xs text-slate-400">Cells warn when pending specific-date tasks land on that exact day.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, -1))}
                className="rounded-md border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-100 hover:bg-[#222222]"
              >
                Previous
              </button>
              <p className="text-sm font-semibold text-slate-200">{getMonthLabel(calendarMonth)}</p>
              <button
                type="button"
                onClick={() => setCalendarMonth((previous) => shiftMonth(previous, 1))}
                className="rounded-md border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-100 hover:bg-[#222222]"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-slate-500">
            {weekdayHeaders.map((weekday) => (
              <p key={weekday}>{weekday}</p>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
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
                  className={`min-h-[118px] rounded-md border p-2 text-left transition-colors ${
                    hasWarning
                      ? 'border-amber-500/60 bg-amber-500/10'
                      : hasCompleted
                        ? 'border-green-500/35 bg-green-500/10'
                        : hasCreated
                          ? 'border-sky-500/35 bg-sky-500/10'
                          : 'border-border bg-black'
                  } ${day.inCurrentMonth ? '' : 'opacity-35'} ${isSelected ? 'ring-1 ring-slate-300/70' : ''}`}
                >
                  <p className="text-sm font-semibold text-slate-100">{day.day}</p>
                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-slate-400">Created: <span className="text-slate-200">{activity.created.length}</span></p>
                    <p className="text-slate-400">Done: <span className="text-slate-200">{activity.completed.length}</span></p>
                    <p className={`${hasWarning ? 'text-amber-300' : 'text-slate-500'}`}>Due: {activity.duePending.length}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedDayActivity ? (
            <div className="mt-4 rounded-xl border border-border bg-[#111111] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{selectedDateLabel}</h4>
                  <p className="mt-1 text-xs text-slate-400">Created tasks and completion events recorded for this exact day.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateKey(null)}
                  className="rounded-md border border-border px-3 py-1 text-sm text-slate-200 hover:bg-[#222222]"
                >
                  Collapse
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Created</p>
                  {selectedDayActivity.created.length === 0 ? <p className="mt-2 text-sm text-slate-500">No tasks created.</p> : null}
                  <ul className="mt-2 space-y-2">
                    {selectedDayActivity.created.map((task) => (
                      <li key={`created-${task.id}`} className="rounded-md border border-border bg-surface p-3">
                        <p className="text-sm font-medium text-slate-100">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {getTaskTimelineLabel(task)} • {formatIndiaDateTime(task.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Completed</p>
                  {selectedDayActivity.completed.length === 0 ? <p className="mt-2 text-sm text-slate-500">No tasks completed.</p> : null}
                  <ul className="mt-2 space-y-2">
                    {selectedDayActivity.completed.map((task) => (
                      <li key={`completed-${task.id}`} className="rounded-md border border-border bg-surface p-3">
                        <p className="text-sm font-medium text-slate-100">{task.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Completed • {formatIndiaDateTime(task.updated_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          ) : null}
        </article>

        <article className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Active Focus Ledger</h3>
              <p className="mt-1 text-xs text-slate-400">Pending tasks that are still actionable right now.</p>
            </div>
            <span className="rounded-md border border-border bg-black px-2 py-1 text-xs text-slate-300">
              {isLoading ? '--' : `${activeTasks.length} active`}
            </span>
          </div>

          {isLoading ? <p className="mt-4 text-sm text-slate-400">Loading tasks...</p> : null}
          {!isLoading && activeTasks.length === 0 ? <p className="mt-4 text-sm text-slate-400">No active tasks in the current window.</p> : null}

          <ul className="mt-4 space-y-3">
            {activeTasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-border bg-black p-3">
                <div className="flex items-start justify-between gap-3">
                  <label className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={(event) => toggleCompletion({ id: task.id, isCompleted: event.target.checked })}
                      disabled={isUpdating}
                      className="mt-1 h-4 w-4 rounded border-border bg-black text-green-500 focus:ring-green-900"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100">{task.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {getTaskTimelineLabel(task)} • Created {formatIndiaDateTime(task.created_at)}
                      </p>
                    </div>
                  </label>

                  <DeleteButton
                    onClick={(e) => {
                      e.stopPropagation()
                      const confirmed = window.confirm('Archive this task?')
                      if (!confirmed) {
                        return
                      }

                      deleteTask({ id: task.id })
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFocusTaskId((previous) => (previous === task.id ? null : task.id))
                      setFocusBucket('Deep Work')
                      setFocusDescription('')
                    }}
                    disabled={Boolean(activeTimer) || isStartingTimer}
                    className="rounded-md border border-border bg-[#111111] px-2 py-1 text-xs text-slate-300 hover:bg-[#222222] disabled:opacity-50 transition-colors"
                  >
                    {activeTimer?.task_id === task.id ? 'Running' : 'Start Focus'}
                  </button>
                </div>

                {focusTaskId === task.id ? (
                  <div className="mt-3 rounded-lg border border-border bg-surface p-3">
                    <label className="text-xs font-medium text-slate-300">Bucket</label>
                    <select
                      value={focusBucket}
                      onChange={(event) => setFocusBucket(event.target.value as TimeBucket)}
                      className="mt-1 w-full rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100"
                    >
                      {TIME_BUCKETS.map((bucket) => (
                        <option key={bucket} value={bucket}>
                          {bucket}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={focusDescription}
                      onChange={(event) => setFocusDescription(event.target.value)}
                      placeholder="Quick focus note (optional)"
                      className="mt-2 w-full rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100"
                    />

                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartFocus(task.id)}
                        disabled={isStartingTimer || Boolean(activeTimer)}
                        className="rounded-md border border-border bg-slate-100 px-3 py-1 text-xs font-medium text-black hover:bg-slate-200 disabled:opacity-50 transition-colors"
                      >
                        {isStartingTimer ? 'Starting...' : 'Start'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFocusTaskId(null)}
                        className="rounded-md border border-transparent bg-transparent px-3 py-1 text-xs text-slate-400 hover:bg-surface transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    {activeTimer ? (
                      <p className="mt-2 text-xs text-slate-400">A timer is already running. Stop it from the global timer bar first.</p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {isUpdating ? <p className="text-xs text-slate-400">Updating task completion...</p> : null}
    </section>
  )
}

export default TasksPage
