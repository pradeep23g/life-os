import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { useHabits } from '../../mind-os/api/useHabits'
import {
  type GoalDomain,
  type GoalStatus,
  type PlanItemPriority,
  type PlanItemStatus,
  getWeekStartDateISO,
  useCreateGoal,
  useCreateWeeklyPlan,
  useCreateWeeklyPlanItem,
  useGoals,
  usePlanning,
  useUpdateGoalStatus,
  useUpdateWeeklyPlan,
  useUpdateWeeklyPlanItem,
  useUpsertWeeklyReview,
  useWeeklyPlanItems,
  useWeeklyReview,
} from '../api/usePlanning'
import { useTasks } from '../api/useTasks'

const planPriorities: PlanItemPriority[] = ['High', 'Medium', 'Low']
const planStatuses: PlanItemStatus[] = ['Planned', 'Doing', 'Done', 'Dropped']
const goalStatuses: GoalStatus[] = ['active', 'paused', 'completed']
const goalDomains: GoalDomain[] = ['productivity-hub', 'mind-os', 'progress-hub', 'fitness-os', 'finance-os']

function formatWeekDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString()
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

function PlanningPage() {
  const currentWeekStart = getWeekStartDateISO()
  const { data: plans = [], isLoading: isPlansLoading, isError: plansError, error: planningError } = usePlanning()
  const { data: goals = [], isError: goalsError, error: goalsQueryError } = useGoals()
  const { data: weeklyItems = [], isLoading: isItemsLoading, isError: itemsError, error: itemsQueryError } = useWeeklyPlanItems(currentWeekStart)
  const { data: weeklyReview, isError: reviewError, error: reviewQueryError } = useWeeklyReview(currentWeekStart)
  const { data: tasks = [] } = useTasks()
  const { data: habits = [] } = useHabits()

  const { mutate: createPlan, isPending: isCreatingPlan, error: createPlanError } = useCreateWeeklyPlan()
  const { mutate: updatePlan, isPending: isUpdatingPlan, error: updatePlanError } = useUpdateWeeklyPlan()
  const { mutate: createGoal, isPending: isCreatingGoal, error: createGoalError } = useCreateGoal()
  const { mutate: updateGoalStatus, isPending: isUpdatingGoalStatus, error: updateGoalStatusError } = useUpdateGoalStatus()
  const { mutate: createPlanItem, isPending: isCreatingItem, error: createPlanItemError } = useCreateWeeklyPlanItem(currentWeekStart)
  const { mutate: updatePlanItem, isPending: isUpdatingItem, error: updatePlanItemError } = useUpdateWeeklyPlanItem(currentWeekStart)
  const { mutate: upsertReview, isPending: isSavingReview, error: upsertReviewError } = useUpsertWeeklyReview(currentWeekStart)

  const [draftByWeek, setDraftByWeek] = useState<Record<string, string>>({})
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDomain, setGoalDomain] = useState<GoalDomain>('productivity-hub')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [goalNotes, setGoalNotes] = useState('')

  const [itemTitle, setItemTitle] = useState('')
  const [itemPriority, setItemPriority] = useState<PlanItemPriority>('Medium')
  const [itemStatus, setItemStatus] = useState<PlanItemStatus>('Planned')
  const [itemGoalId, setItemGoalId] = useState('')
  const [itemTaskId, setItemTaskId] = useState('')
  const [itemHabitId, setItemHabitId] = useState('')
  const [itemNotes, setItemNotes] = useState('')

  const [reviewDraft, setReviewDraft] = useState<{
    wins?: string
    blockers?: string
    nextAdjustments?: string
  }>({})

  const existingPlan = useMemo(() => {
    return plans.find((plan) => plan.week_start_date === currentWeekStart) ?? null
  }, [plans, currentWeekStart])

  const focusText = draftByWeek[currentWeekStart] ?? existingPlan?.focus_text ?? ''
  const linkedItemsCount = weeklyItems.filter((item) => Boolean(item.goal_id)).length
  const alignmentPercent = weeklyItems.length > 0 ? Math.round((linkedItemsCount / weeklyItems.length) * 100) : 0
  const reviewWins = reviewDraft.wins ?? weeklyReview?.wins ?? ''
  const reviewBlockers = reviewDraft.blockers ?? weeklyReview?.blockers ?? ''
  const reviewNextAdjustments = reviewDraft.nextAdjustments ?? weeklyReview?.next_adjustments ?? ''

  const handleWeeklyFocusSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = focusText.trim()

    if (!trimmed) {
      return
    }

    if (existingPlan) {
      updatePlan({
        id: existingPlan.id,
        focusText: trimmed,
        weekStartDate: currentWeekStart,
      })
      return
    }

    createPlan({
      focusText: trimmed,
      weekStartDate: currentWeekStart,
    })
  }

  const handleCreateGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = goalTitle.trim()

    if (!trimmedTitle) {
      return
    }

    createGoal(
      {
        title: trimmedTitle,
        domain: goalDomain,
        targetDate: goalTargetDate,
        notes: goalNotes,
      },
      {
        onSuccess: () => {
          setGoalTitle('')
          setGoalTargetDate('')
          setGoalNotes('')
        },
      },
    )
  }

  const handleCreatePlanItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = itemTitle.trim()

    if (!trimmedTitle) {
      return
    }

    createPlanItem(
      {
        weekStartDate: currentWeekStart,
        title: trimmedTitle,
        priority: itemPriority,
        status: itemStatus,
        goalId: itemGoalId || undefined,
        linkedTaskId: itemTaskId || undefined,
        linkedHabitId: itemHabitId || undefined,
        notes: itemNotes,
      },
      {
        onSuccess: () => {
          setItemTitle('')
          setItemPriority('Medium')
          setItemStatus('Planned')
          setItemGoalId('')
          setItemTaskId('')
          setItemHabitId('')
          setItemNotes('')
        },
      },
    )
  }

  const handleSaveWeeklyReview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    upsertReview(
      {
        weekStartDate: currentWeekStart,
        wins: reviewWins,
        blockers: reviewBlockers,
        nextAdjustments: reviewNextAdjustments,
      },
      {
        onSuccess: () => {
          setReviewDraft({})
        },
      },
    )
  }

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <h2 className="text-lg font-semibold text-slate-100">Planning Engine v1</h2>
        <p className="mt-1 text-sm text-slate-300">
          Week starting {formatWeekDate(currentWeekStart)} - Alignment health {alignmentPercent}% ({linkedItemsCount}/{weeklyItems.length})
        </p>
      </article>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-xl border border-slate-700 bg-surface p-4">
          <h3 className="text-lg font-semibold text-slate-100">Weekly Focus + Plan Items</h3>

          <form onSubmit={handleWeeklyFocusSubmit} className="mt-3 space-y-3">
            <textarea
              value={focusText}
              onChange={(event) =>
                setDraftByWeek((previous) => ({
                  ...previous,
                  [currentWeekStart]: event.target.value,
                }))
              }
              rows={5}
              placeholder="Define this week's primary execution focus..."
              className="w-full rounded-md border border-slate-700 bg-slate-800 p-3 text-slate-100"
            />
            <button
              type="submit"
              disabled={isCreatingPlan || isUpdatingPlan || !focusText.trim()}
              className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
            >
              {isCreatingPlan || isUpdatingPlan ? 'Saving...' : existingPlan ? 'Update Weekly Focus' : 'Save Weekly Focus'}
            </button>
          </form>

          <form onSubmit={handleCreatePlanItem} className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <h4 className="text-sm font-semibold text-slate-100">Add Prioritized Plan Item</h4>
            <input
              value={itemTitle}
              onChange={(event) => setItemTitle(event.target.value)}
              placeholder="Plan item title"
              className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />

            <div className="grid grid-cols-2 gap-2">
              <select
                value={itemPriority}
                onChange={(event) => setItemPriority(event.target.value as PlanItemPriority)}
                className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
              >
                {planPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    Priority: {priority}
                  </option>
                ))}
              </select>

              <select
                value={itemStatus}
                onChange={(event) => setItemStatus(event.target.value as PlanItemStatus)}
                className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
              >
                {planStatuses.map((status) => (
                  <option key={status} value={status}>
                    Status: {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <select
                value={itemGoalId}
                onChange={(event) => setItemGoalId(event.target.value)}
                className="rounded-md border border-slate-600 bg-slate-800 p-2 text-xs text-slate-100"
              >
                <option value="">Link goal (optional)</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>

              <select
                value={itemTaskId}
                onChange={(event) => setItemTaskId(event.target.value)}
                className="rounded-md border border-slate-600 bg-slate-800 p-2 text-xs text-slate-100"
              >
                <option value="">Link task (optional)</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>

              <select
                value={itemHabitId}
                onChange={(event) => setItemHabitId(event.target.value)}
                className="rounded-md border border-slate-600 bg-slate-800 p-2 text-xs text-slate-100"
              >
                <option value="">Link habit (optional)</option>
                {habits.map((habit) => (
                  <option key={habit.id} value={habit.id}>
                    {habit.title}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={itemNotes}
              onChange={(event) => setItemNotes(event.target.value)}
              rows={2}
              placeholder="Optional note"
              className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />

            <button
              type="submit"
              disabled={isCreatingItem || !itemTitle.trim()}
              className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
            >
              {isCreatingItem ? 'Adding...' : 'Add Plan Item'}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">This Week Items</h4>
            {isItemsLoading ? <p className="text-sm text-slate-400">Loading plan items...</p> : null}
            {!isItemsLoading && weeklyItems.length === 0 ? <p className="text-sm text-slate-400">No plan items yet.</p> : null}
            {weeklyItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="text-xs text-slate-400">
                      {item.priority} - order {item.order_index}
                    </p>
                    {item.goal_id ? <p className="text-xs text-slate-400">Linked goal enabled</p> : null}
                  </div>

                  <select
                    value={item.status}
                    onChange={(event) =>
                      updatePlanItem({
                        id: item.id,
                        status: event.target.value as PlanItemStatus,
                      })
                    }
                    disabled={isUpdatingItem}
                    className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                  >
                    {planStatuses.map((status) => (
                      <option key={`${item.id}-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {item.notes ? <p className="mt-2 text-xs text-slate-300">{item.notes}</p> : null}
              </article>
            ))}
          </div>
        </article>

        <section className="space-y-4">
          <article className="rounded-xl border border-slate-700 bg-surface p-4">
            <h3 className="text-lg font-semibold text-slate-100">Goal Alignment Panel</h3>
            <p className="mt-1 text-xs text-slate-400">Create and track goals linked to weekly planning items.</p>

            <form onSubmit={handleCreateGoal} className="mt-3 space-y-2">
              <input
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Goal title"
                className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={goalDomain}
                  onChange={(event) => setGoalDomain(event.target.value as GoalDomain)}
                  className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                >
                  {goalDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(event) => setGoalTargetDate(event.target.value)}
                  className="rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                />
              </div>

              <textarea
                value={goalNotes}
                onChange={(event) => setGoalNotes(event.target.value)}
                rows={2}
                placeholder="Optional goal notes"
                className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
              />

              <button
                type="submit"
                disabled={isCreatingGoal || !goalTitle.trim()}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {isCreatingGoal ? 'Adding...' : 'Add Goal'}
              </button>
            </form>

            <div className="mt-3 space-y-2">
              {goals.length === 0 ? <p className="text-sm text-slate-400">No goals yet.</p> : null}
              {goals.map((goal) => (
                <article key={goal.id} className="rounded-md border border-slate-700 bg-slate-900 p-2">
                  <p className="text-sm font-semibold text-slate-100">{goal.title}</p>
                  <p className="text-xs text-slate-400">{goal.domain}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      value={goal.status}
                      onChange={(event) =>
                        updateGoalStatus({
                          id: goal.id,
                          status: event.target.value as GoalStatus,
                        })
                      }
                      disabled={isUpdatingGoalStatus}
                      className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100"
                    >
                      {goalStatuses.map((status) => (
                        <option key={`${goal.id}-${status}`} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {goal.target_date ? <p className="text-xs text-slate-400">Target: {formatWeekDate(goal.target_date)}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-700 bg-surface p-4">
            <h3 className="text-lg font-semibold text-slate-100">End-of-Week Review</h3>
            <p className="mt-1 text-xs text-slate-400">Capture what worked, what blocked progress, and next adjustments.</p>

            <form onSubmit={handleSaveWeeklyReview} className="mt-3 space-y-3">
              <label className="block text-xs text-slate-300">
                Wins
                <textarea
                  value={reviewWins}
                  onChange={(event) =>
                    setReviewDraft((previous) => ({
                      ...previous,
                      wins: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                />
              </label>

              <label className="block text-xs text-slate-300">
                Blockers
                <textarea
                  value={reviewBlockers}
                  onChange={(event) =>
                    setReviewDraft((previous) => ({
                      ...previous,
                      blockers: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                />
              </label>

              <label className="block text-xs text-slate-300">
                Next adjustments
                <textarea
                  value={reviewNextAdjustments}
                  onChange={(event) =>
                    setReviewDraft((previous) => ({
                      ...previous,
                      nextAdjustments: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingReview}
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
              >
                {isSavingReview ? 'Saving...' : 'Save Weekly Review'}
              </button>
            </form>
          </article>
        </section>
      </section>

      {(createPlanError ||
        updatePlanError ||
        createGoalError ||
        updateGoalStatusError ||
        createPlanItemError ||
        updatePlanItemError ||
        upsertReviewError ||
        planningError ||
        goalsQueryError ||
        itemsQueryError ||
        reviewQueryError ||
        plansError ||
        goalsError ||
        itemsError ||
        reviewError) ? (
        <article className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-200">
          Planning error:{' '}
          {getReadableErrorMessage(
            createPlanError ||
              updatePlanError ||
              createGoalError ||
              updateGoalStatusError ||
              createPlanItemError ||
              updatePlanItemError ||
              upsertReviewError ||
              planningError ||
              goalsQueryError ||
              itemsQueryError ||
              reviewQueryError,
          )}
        </article>
      ) : null}

      <article className="rounded-xl border border-slate-700 bg-surface p-4">
        <h3 className="text-lg font-semibold text-slate-100">Recent Weekly Focus Entries</h3>
        {isPlansLoading ? <p className="mt-2 text-sm text-slate-400">Loading plans...</p> : null}
        {!isPlansLoading && plans.length === 0 ? <p className="mt-2 text-sm text-slate-400">No plans yet.</p> : null}
        <ul className="mt-2 space-y-2">
          {plans.slice(0, 6).map((plan) => (
            <li key={plan.id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <p className="text-xs text-slate-400">{formatWeekDate(plan.week_start_date)}</p>
              <p className="mt-1 text-sm text-slate-100">{plan.focus_text}</p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  )
}

export default PlanningPage
