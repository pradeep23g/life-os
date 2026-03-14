import { useTasks } from '../api/useTasks'

function ProductivityHubDashboard() {
  const { data: tasks = [], isLoading } = useTasks()

  const todoCount = tasks.filter((task) => task.status === 'To Do').length
  const doingCount = tasks.filter((task) => task.status === 'Doing').length
  const doneCount = tasks.filter((task) => task.status === 'Done').length

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <p className="text-sm text-slate-300">Tasks in To Do</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : todoCount}</p>
      </article>

      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <p className="text-sm text-slate-300">Tasks in Doing</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : doingCount}</p>
      </article>

      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <p className="text-sm text-slate-300">Tasks Done</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : doneCount}</p>
      </article>
    </section>
  )
}

export default ProductivityHubDashboard
