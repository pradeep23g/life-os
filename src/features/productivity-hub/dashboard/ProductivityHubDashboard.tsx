import { getWeekStartDateISO, useWeeklyPlanItems } from '../api/usePlanning'
import { useTasks } from '../api/useTasks'

function ProductivityHubDashboard() {
  const { data: tasks = [], isLoading } = useTasks()
  const currentWeekStart = getWeekStartDateISO()
  const { data: weeklyItems = [] } = useWeeklyPlanItems(currentWeekStart)

  const pendingCount = tasks.filter((task) => !task.is_completed).length
  const dueCount = tasks.filter((task) => !task.is_completed && task.deadline_type === 'specific_date').length
  const completedCount = tasks.filter((task) => task.is_completed).length
  const linkedItems = weeklyItems.filter((item) => Boolean(item.goal_id)).length
  const alignmentRatio = weeklyItems.length > 0 ? `${linkedItems}/${weeklyItems.length}` : '0/0'
  const alignmentPercent = weeklyItems.length > 0 ? Math.round((linkedItems / weeklyItems.length) * 100) : 0

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
        <p className="text-sm font-medium text-slate-400">Pending Tasks</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : pendingCount}</p>
      </article>

      <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
        <p className="text-sm font-medium text-slate-400">Scheduled Deadlines</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : dueCount}</p>
      </article>

      <article className="min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4">
        <p className="text-sm font-medium text-slate-400">Tasks Completed</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{isLoading ? '--' : completedCount}</p>
      </article>

      <article className="col-span-2 min-h-[120px] rounded-xl border border-border bg-surface p-3 sm:p-4 md:col-span-1">
        <p className="text-sm font-medium text-slate-400">Alignment Health</p>
        <p className="mt-2 text-2xl font-semibold text-slate-100">{alignmentPercent}%</p>
        <p className="mt-1 text-xs text-slate-400">{alignmentRatio} weekly items linked to goals</p>
      </article>
    </section>
  )
}

export default ProductivityHubDashboard
