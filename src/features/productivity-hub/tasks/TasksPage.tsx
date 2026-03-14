import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useCreateTask, useTasks, useUpdateTaskStatus } from '../api/useTasks'
import type { Task, TaskPriority, TaskStatus } from '../api/useTasks'

const priorities: TaskPriority[] = ['Low', 'Medium', 'High']
const statuses: TaskStatus[] = ['To Do', 'Doing', 'Done']

function TasksPage() {
  const { data: tasks = [], isLoading, isError, error } = useTasks()
  const { mutate: createTask, isPending: isCreating, error: createError } = useCreateTask()
  const { mutate: updateStatus, isPending: isUpdating, error: updateError } = useUpdateTaskStatus()

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('Medium')

  const groupedTasks = useMemo(() => {
    return statuses.reduce<Record<TaskStatus, Task[]>>(
      (accumulator, status) => {
        accumulator[status] = tasks.filter((task) => task.status === status)
        return accumulator
      },
      {
        'To Do': [],
        Doing: [],
        Done: [],
      },
    )
  }, [tasks])

  const handleCreateTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      return
    }

    createTask(
      { title: trimmedTitle, priority },
      {
        onSuccess: () => {
          setTitle('')
          setPriority('Medium')
        },
      },
    )
  }

  const renderActions = (task: Task) => {
    if (task.status === 'To Do') {
      return (
        <button
          type="button"
          onClick={() => updateStatus({ id: task.id, status: 'Doing' })}
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
        >
          Move to Doing
        </button>
      )
    }

    if (task.status === 'Doing') {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateStatus({ id: task.id, status: 'Done' })}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
          >
            Move to Done
          </button>
          <button
            type="button"
            onClick={() => updateStatus({ id: task.id, status: 'To Do' })}
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            Move to To Do
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={() => updateStatus({ id: task.id, status: 'Doing' })}
        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100 hover:bg-slate-700"
      >
        Move to Doing
      </button>
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <h2 className="text-lg font-semibold text-slate-100">Create Task</h2>

        <form onSubmit={handleCreateTask} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px_140px]">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            className="rounded-md border border-slate-700 bg-slate-800 p-2 text-slate-100"
          />

          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="rounded-md border border-slate-700 bg-slate-800 p-2 text-slate-100"
          >
            {priorities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isCreating || !title.trim()}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
          >
            {isCreating ? 'Creating...' : 'Add Task'}
          </button>
        </form>

        {createError ? <p className="mt-3 text-sm text-red-400">{createError.message}</p> : null}
      </article>

      {isError ? <p className="text-sm text-red-400">{error.message}</p> : null}
      {updateError ? <p className="text-sm text-red-400">{updateError.message}</p> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {statuses.map((status) => (
          <article key={status} className="rounded-xl border border-slate-700 bg-surface p-4">
            <h3 className="text-lg font-semibold text-slate-100">{status}</h3>
            <p className="mt-1 text-sm text-slate-300">{groupedTasks[status].length} tasks</p>

            <div className="mt-3 space-y-3">
              {isLoading ? <p className="text-sm text-slate-400">Loading...</p> : null}

              {!isLoading && groupedTasks[status].length === 0 ? (
                <p className="text-sm text-slate-400">No tasks yet.</p>
              ) : null}

              {groupedTasks[status].map((task) => (
                <article key={task.id} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                  <p className="text-sm font-medium text-slate-100">{task.title}</p>
                  <span className="mt-2 inline-flex rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300">
                    Priority: {task.priority}
                  </span>
                  <div className="mt-3">{renderActions(task)}</div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>

      {isUpdating ? <p className="text-xs text-slate-400">Updating task status...</p> : null}
    </section>
  )
}

export default TasksPage
