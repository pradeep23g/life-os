import { getWeekStartDateISO, useWeeklyPlanItems } from '../api/usePlanning'
import { useTasks } from '../api/useTasks'

function ProductivityHubDashboard() {
  const { data: tasks = [], isLoading } = useTasks()
  const currentWeekStart = getWeekStartDateISO()
  const { data: weeklyItems = [] } = useWeeklyPlanItems(currentWeekStart)

  const todoCount = tasks.filter((task) => task.status === 'To Do').length
  const doingCount = tasks.filter((task) => task.status === 'Doing').length
  const doneCount = tasks.filter((task) => task.status === 'Done').length
  const linkedItems = weeklyItems.filter((item) => Boolean(item.goal_id)).length
  const alignmentRatio = weeklyItems.length > 0 ? `${linkedItems}/${weeklyItems.length}` : '0/0'
  const alignmentPercent = weeklyItems.length > 0 ? Math.round((linkedItems / weeklyItems.length) * 100) : 0

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <article className="min-h-[120px] rounded-xl border border-slate-700 bg-surface p-3 sm:p-4">
        <p className="text-xs text-slate-300 sm:text-sm">Tasks in To Do</p>
        <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : todoCount}</p>
      </article>

      <article className="min-h-[120px] rounded-xl border border-slate-700 bg-surface p-3 sm:p-4">
        <p className="text-xs text-slate-300 sm:text-sm">Tasks in Doing</p>
        <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : doingCount}</p>
      </article>

      <article className="min-h-[120px] rounded-xl border border-slate-700 bg-surface p-3 sm:p-4">
        <p className="text-xs text-slate-300 sm:text-sm">Tasks Done</p>
        <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{isLoading ? '--' : doneCount}</p>
      </article>

      <article className="col-span-2 min-h-[120px] rounded-xl border border-slate-700 bg-surface p-3 sm:p-4 md:col-span-1">
        <p className="text-xs text-slate-300 sm:text-sm">Alignment Health</p>
        <p className="mt-2 text-xl font-semibold text-slate-100 sm:text-2xl">{alignmentPercent}%</p>
        <p className="mt-1 text-xs text-slate-400">{alignmentRatio} weekly items linked to goals</p>
      </article>
    </section>
  )
}

export default ProductivityHubDashboard
