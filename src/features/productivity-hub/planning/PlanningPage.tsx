import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

type PlanningTab = 'plan' | 'goals' | 'review'

const planPriorities: PlanItemPriority[] = ['High', 'Medium', 'Low']
const planStatuses: PlanItemStatus[] = ['Planned', 'Doing', 'Done', 'Dropped']
const goalStatuses: GoalStatus[] = ['active', 'paused', 'completed']
const goalDomains: GoalDomain[] = ['productivity-hub', 'mind-os', 'learning-os', 'fitness-os', 'finance-os']

const domainLabels: Record<GoalDomain, string> = {
  'productivity-hub': 'Productivity',
  'mind-os': 'Mind',
  'learning-os': 'Learning',
  'fitness-os': 'Fitness',
  'finance-os': 'Finance',
  'progress-hub': 'Progress Hub',
}

const priorityColors: Record<PlanItemPriority, string> = {
  High: 'rounded bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 text-rose-400',
  Medium: 'rounded bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 text-amber-400',
  Low: 'rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-slate-400',
}

const statusColors: Record<PlanItemStatus, string> = {
  Planned: 'text-slate-400',
  Doing: 'text-blue-400',
  Done: 'text-emerald-400',
  Dropped: 'text-neutral-500',
}

function formatWeekDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
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

function splitBulletItems(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function joinBulletItems(items: string[]): string {
  return items.join('\n')
}

function removeBulletItem(items: string[], indexToRemove: number): string[] {
  return items.filter((_, index) => index !== indexToRemove)
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// ─────────────────────────────────────────────
// Tab Button
// ─────────────────────────────────────────────
function TabButton({
  label,
  isActive,
  onClick,
  badge,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#111111] text-slate-100 ring-1 ring-border'
          : 'text-slate-400 hover:bg-[#111111] hover:text-slate-200'
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-2 inline-flex items-center rounded-full border border-border bg-black px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

// ─────────────────────────────────────────────
// Error Banner (prominent, at top)
// ─────────────────────────────────────────────
function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null

  return (
    <article className="rounded-lg border border-red-800/60 bg-red-950/30 px-4 py-2.5 text-sm text-red-200">
      <span className="mr-2 font-medium text-red-400">Error:</span>
      {getReadableErrorMessage(error)}
    </article>
  )
}

// ─────────────────────────────────────────────
// Alignment Health Badge
// ─────────────────────────────────────────────
function AlignmentBadge({ percent, linked, total }: { percent: number; linked: number; total: number }) {
  let color = 'bg-red-900/40 text-red-300 border-red-800/40'
  if (percent >= 80) color = 'bg-emerald-900/40 text-emerald-300 border-emerald-800/40'
  else if (percent >= 50) color = 'bg-yellow-900/40 text-yellow-300 border-yellow-800/40'
  else if (percent > 0) color = 'bg-orange-900/40 text-orange-300 border-orange-800/40'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}>
      {total === 0 ? 'No items' : `${percent}% aligned`}
      <span className="text-[10px] opacity-70">({linked}/{total})</span>
    </span>
  )
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
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

  const [activeTab, setActiveTab] = useState<PlanningTab>('plan')

  // Weekly Focus state
  const [draftByWeek, setDraftByWeek] = useState<Record<string, string>>({})
  const [focusInput, setFocusInput] = useState('')

  // Plan Item state
  const [itemTitle, setItemTitle] = useState('')
  const [itemPriority, setItemPriority] = useState<PlanItemPriority>('Medium')
  const [itemStatus, setItemStatus] = useState<PlanItemStatus>('Planned')
  const [itemGoalId, setItemGoalId] = useState('')
  const [itemTaskId, setItemTaskId] = useState('')
  const [itemHabitId, setItemHabitId] = useState('')
  const [itemNotes, setItemNotes] = useState('')
  const [showMoreOptions, setShowMoreOptions] = useState(false)

  // Goal state
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDomain, setGoalDomain] = useState<GoalDomain>('productivity-hub')
  const [goalTargetDate, setGoalTargetDate] = useState('')
  const [goalNotes, setGoalNotes] = useState('')

  // Review state
  const [reviewDraft, setReviewDraft] = useState<{
    wins?: string
    blockers?: string
    nextAdjustments?: string
  }>({})
  const [winsInput, setWinsInput] = useState('')
  const [blockersInput, setBlockersInput] = useState('')
  const [nextAdjustmentsInput, setNextAdjustmentsInput] = useState('')

  // Recent entries collapsible
  const [showRecentEntries, setShowRecentEntries] = useState(false)

  const existingPlan = useMemo(() => {
    return plans.find((plan) => plan.week_start_date === currentWeekStart) ?? null
  }, [plans, currentWeekStart])

  const focusText = draftByWeek[currentWeekStart] ?? existingPlan?.focus_text ?? ''
  const focusItems = useMemo(() => splitBulletItems(focusText), [focusText])
  const linkedItemsCount = weeklyItems.filter((item) => Boolean(item.goal_id)).length
  const alignmentPercent = weeklyItems.length > 0 ? Math.round((linkedItemsCount / weeklyItems.length) * 100) : 0

  const reviewWins = reviewDraft.wins ?? weeklyReview?.wins ?? ''
  const reviewBlockers = reviewDraft.blockers ?? weeklyReview?.blockers ?? ''
  const reviewNextAdjustments = reviewDraft.nextAdjustments ?? weeklyReview?.next_adjustments ?? ''
  const reviewWinsItems = useMemo(() => splitBulletItems(reviewWins), [reviewWins])
  const reviewBlockersItems = useMemo(() => splitBulletItems(reviewBlockers), [reviewBlockers])
  const reviewNextAdjustmentsItems = useMemo(() => splitBulletItems(reviewNextAdjustments), [reviewNextAdjustments])

  // ─── Auto-save weekly focus (debounced) ───
  const debouncedFocusText = useDebounce(focusText, 1200)
  const lastSavedFocusRef = useRef(existingPlan?.focus_text ?? '')

  useEffect(() => {
    if (existingPlan?.focus_text) {
      lastSavedFocusRef.current = existingPlan.focus_text
    }
  }, [existingPlan?.focus_text])

  const saveFocus = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return

      if (existingPlan) {
        updatePlan({ id: existingPlan.id, focusText: trimmed, weekStartDate: currentWeekStart })
      } else {
        createPlan({ focusText: trimmed, weekStartDate: currentWeekStart })
      }
    },
    [existingPlan, currentWeekStart, updatePlan, createPlan],
  )

  useEffect(() => {
    const trimmed = debouncedFocusText.trim()
    if (!trimmed || trimmed === lastSavedFocusRef.current) return
    if (isCreatingPlan || isUpdatingPlan) return

    lastSavedFocusRef.current = trimmed
    saveFocus(trimmed)
  }, [debouncedFocusText, saveFocus, isCreatingPlan, isUpdatingPlan])

  // ─── Error aggregation ───
  const activeError =
    createPlanError ||
    updatePlanError ||
    createGoalError ||
    updateGoalStatusError ||
    createPlanItemError ||
    updatePlanItemError ||
    upsertReviewError ||
    (plansError ? planningError : null) ||
    (goalsError ? goalsQueryError : null) ||
    (itemsError ? itemsQueryError : null) ||
    (reviewError ? reviewQueryError : null)

  // ─── Handlers ───
  const handleCreatePlanItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = itemTitle.trim()
    if (!trimmedTitle) return

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
          setShowMoreOptions(false)
        },
      },
    )
  }

  const handleCreateGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = goalTitle.trim()
    if (!trimmedTitle) return

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

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <section className="space-y-3 pb-28 sm:pb-24">
      {/* ── Header with week info + tabs ── */}
      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Planning Engine</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Week of {formatWeekDate(currentWeekStart)}
            </p>
          </div>
          <AlignmentBadge percent={alignmentPercent} linked={linkedItemsCount} total={weeklyItems.length} />
        </div>

        {/* Tab navigation */}
        <nav className="mt-3 flex gap-1 border-t border-border pt-3">
          <TabButton
            label="Weekly Plan"
            isActive={activeTab === 'plan'}
            onClick={() => setActiveTab('plan')}
            badge={weeklyItems.length > 0 ? String(weeklyItems.length) : undefined}
          />
          <TabButton
            label="Goals"
            isActive={activeTab === 'goals'}
            onClick={() => setActiveTab('goals')}
            badge={goals.length > 0 ? String(goals.length) : undefined}
          />
          <TabButton
            label="Review"
            isActive={activeTab === 'review'}
            onClick={() => setActiveTab('review')}
          />
        </nav>
      </article>

      {/* ── Error banner (prominent position) ── */}
      <ErrorBanner error={activeError} />

      {/* ── Tab: Weekly Plan ── */}
      {activeTab === 'plan' && (
        <section className="space-y-3">
          {/* Weekly Focus */}
          <article className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-base font-semibold text-slate-100">Weekly Focus</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isCreatingPlan || isUpdatingPlan ? 'Saving...' : 'Auto-saves as you add items'}
            </p>

            <div className="mt-3">
              <input
                value={focusInput}
                onChange={(event) => setFocusInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const nextItem = focusInput.trim()
                  if (!nextItem) return
                  setDraftByWeek((previous) => ({
                    ...previous,
                    [currentWeekStart]: joinBulletItems([...focusItems, nextItem]),
                  }))
                  setFocusInput('')
                }}
                placeholder="Add focus item and press Enter"
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>

            {focusItems.length > 0 && (
              <ul className="mt-3 space-y-1">
                {focusItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-[#111111]">
                    <span className="text-sm text-slate-200">
                      <span className="mr-2 text-slate-500">•</span>
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftByWeek((previous) => ({
                          ...previous,
                          [currentWeekStart]: joinBulletItems(removeBulletItem(focusItems, index)),
                        }))
                      }
                      className="shrink-0 cursor-pointer rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                      aria-label={`Remove focus item ${index + 1}`}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {/* Add Plan Item */}
          <article className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-base font-semibold text-slate-100">Plan Items</h3>

            <form onSubmit={handleCreatePlanItem} className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input
                  value={itemTitle}
                  onChange={(event) => setItemTitle(event.target.value)}
                  placeholder="What needs to get done?"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
                />
                <select
                  value={itemPriority}
                  onChange={(event) => setItemPriority(event.target.value as PlanItemPriority)}
                  className="shrink-0 rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
                >
                  {planPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expandable options */}
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showMoreOptions ? '− Less options' : '+ More options (status, links, notes)'}
              </button>

              {showMoreOptions && (
                <div className="space-y-2 rounded-lg border border-border bg-[#0d0d0d] p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={itemStatus}
                      onChange={(event) => setItemStatus(event.target.value as PlanItemStatus)}
                      className="rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100 focus:outline-none"
                    >
                      {planStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <select
                      value={itemGoalId}
                      onChange={(event) => setItemGoalId(event.target.value)}
                      className="rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100 focus:outline-none"
                    >
                      <option value="">Link goal</option>
                      {goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={itemTaskId}
                      onChange={(event) => setItemTaskId(event.target.value)}
                      className="rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100 focus:outline-none"
                    >
                      <option value="">Link task</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={itemHabitId}
                      onChange={(event) => setItemHabitId(event.target.value)}
                      className="rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100 focus:outline-none"
                    >
                      <option value="">Link habit</option>
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
                    className="w-full rounded-md border border-border bg-[#111111] p-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingItem || !itemTitle.trim()}
                className="rounded-lg border border-border bg-[#111111] px-4 py-2 text-sm text-slate-100 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingItem ? 'Adding...' : 'Add Plan Item'}
              </button>
            </form>

            {/* Current week items list */}
            <div className="mt-4">
              {isItemsLoading ? <p className="text-sm text-slate-500">Loading plan items...</p> : null}
              {!isItemsLoading && weeklyItems.length === 0 ? (
                <p className="text-sm text-slate-500">No plan items yet. Add one above.</p>
              ) : null}

              {weeklyItems.length > 0 && (
                <div className="space-y-2">
                  {weeklyItems.map((item) => (
                    <article
                      key={item.id}
                      className={`flex items-start justify-between gap-3 rounded-lg border border-border p-3 transition-colors ${
                        item.status === 'Done' ? 'bg-surface opacity-60' : 'bg-surface'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${item.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                          {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </span>
                          {item.goal_id && (
                            <span className="rounded-full bg-emerald-900/30 px-1.5 py-0.5 text-[10px] text-emerald-400">
                              Goal linked
                            </span>
                          )}
                          {item.notes && (
                            <span className="truncate text-xs text-slate-500" title={item.notes}>
                              {item.notes}
                            </span>
                          )}
                        </div>
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
                        className={`shrink-0 rounded-md border border-border bg-[#111111] px-2 py-1 text-xs font-medium focus:outline-none ${statusColors[item.status]}`}
                      >
                        {planStatuses.map((status) => (
                          <option key={`${item.id}-${status}`} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </article>

          {/* Recent entries - collapsible */}
          <article className="rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setShowRecentEntries(!showRecentEntries)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#111111] rounded-xl"
            >
              <h3 className="text-sm font-medium text-slate-400">Recent Weekly Focus Entries</h3>
              <span className="text-xs text-slate-500">{showRecentEntries ? '▲' : '▼'}</span>
            </button>
            {showRecentEntries && (
              <div className="border-t border-border px-4 pb-4 pt-2">
                {isPlansLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}
                {!isPlansLoading && plans.length === 0 ? <p className="text-sm text-slate-500">No plans yet.</p> : null}
                <ul className="space-y-2">
                  {plans.slice(0, 6).map((plan) => (
                    <li key={plan.id} className="rounded-lg border border-border bg-[#111111] p-3">
                      <p className="text-xs text-slate-500">{formatWeekDate(plan.week_start_date)}</p>
                      <p className="mt-1 text-sm text-slate-200">{plan.focus_text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </section>
      )}

      {/* ── Tab: Goals ── */}
      {activeTab === 'goals' && (
        <section className="space-y-3">
          <article className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-base font-semibold text-slate-100">Create Goal</h3>
            <p className="mt-0.5 text-xs text-slate-500">Goals anchor your weekly plan items to long-term outcomes.</p>

            <form onSubmit={handleCreateGoal} className="mt-3 space-y-3">
              <input
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Goal title"
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={goalDomain}
                  onChange={(event) => setGoalDomain(event.target.value as GoalDomain)}
                  className="rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
                >
                  {goalDomains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domainLabels[domain]}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(event) => setGoalTargetDate(event.target.value)}
                  className="rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 focus:outline-none"
                />
              </div>

              <textarea
                value={goalNotes}
                onChange={(event) => setGoalNotes(event.target.value)}
                rows={2}
                placeholder="Optional notes"
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={isCreatingGoal || !goalTitle.trim()}
                className="rounded-lg border border-border bg-[#111111] px-4 py-2 text-sm text-slate-100 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isCreatingGoal ? 'Adding...' : 'Add Goal'}
              </button>
            </form>
          </article>

          {/* Goals list */}
          {goals.length === 0 ? (
            <article className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm text-slate-500">No goals yet. Create one above to start aligning your weekly plans.</p>
            </article>
          ) : (
            <div className="space-y-2">
              {goals.map((goal) => (
                <article key={goal.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-100">{goal.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-border bg-[#111111] px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {domainLabels[goal.domain]}
                        </span>
                        {goal.target_date && (
                          <span className="text-xs text-slate-500">
                            Target: {formatWeekDate(goal.target_date)}
                          </span>
                        )}
                      </div>
                      {goal.notes && <p className="mt-1.5 text-xs text-slate-400">{goal.notes}</p>}
                    </div>

                    <select
                      value={goal.status}
                      onChange={(event) =>
                        updateGoalStatus({
                          id: goal.id,
                          status: event.target.value as GoalStatus,
                        })
                      }
                      disabled={isUpdatingGoalStatus}
                      className={`shrink-0 rounded-md border border-border bg-[#111111] px-2 py-1 text-xs font-medium focus:outline-none ${
                        goal.status === 'completed' ? 'text-emerald-400' : goal.status === 'paused' ? 'text-yellow-400' : 'text-slate-300'
                      }`}
                    >
                      {goalStatuses.map((status) => (
                        <option key={`${goal.id}-${status}`} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Review ── */}
      {activeTab === 'review' && (
        <article className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-base font-semibold text-slate-100">End-of-Week Review</h3>
          <p className="mt-0.5 text-xs text-slate-500">Capture what worked, what blocked progress, and next adjustments.</p>

          <form onSubmit={handleSaveWeeklyReview} className="mt-4 space-y-5">
            {/* Wins */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Wins</label>
              <input
                value={winsInput}
                onChange={(event) => setWinsInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const nextItem = winsInput.trim()
                  if (!nextItem) return
                  setReviewDraft((previous) => ({
                    ...previous,
                    wins: joinBulletItems([...reviewWinsItems, nextItem]),
                  }))
                  setWinsInput('')
                }}
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
                placeholder="Add win and press Enter"
              />
              {reviewWinsItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {reviewWinsItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-[#111111]">
                      <span className="text-sm text-emerald-300">
                        <span className="mr-2 text-emerald-600">•</span>
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewDraft((previous) => ({
                            ...previous,
                            wins: joinBulletItems(removeBulletItem(reviewWinsItems, index)),
                          }))
                        }
                        className="shrink-0 cursor-pointer rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                        aria-label={`Remove win item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Blockers */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Blockers</label>
              <input
                value={blockersInput}
                onChange={(event) => setBlockersInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const nextItem = blockersInput.trim()
                  if (!nextItem) return
                  setReviewDraft((previous) => ({
                    ...previous,
                    blockers: joinBulletItems([...reviewBlockersItems, nextItem]),
                  }))
                  setBlockersInput('')
                }}
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
                placeholder="Add blocker and press Enter"
              />
              {reviewBlockersItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {reviewBlockersItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-[#111111]">
                      <span className="text-sm text-red-300">
                        <span className="mr-2 text-red-600">•</span>
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewDraft((previous) => ({
                            ...previous,
                            blockers: joinBulletItems(removeBulletItem(reviewBlockersItems, index)),
                          }))
                        }
                        className="shrink-0 cursor-pointer rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                        aria-label={`Remove blocker item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Next Adjustments */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Next Adjustments</label>
              <input
                value={nextAdjustmentsInput}
                onChange={(event) => setNextAdjustmentsInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  const nextItem = nextAdjustmentsInput.trim()
                  if (!nextItem) return
                  setReviewDraft((previous) => ({
                    ...previous,
                    nextAdjustments: joinBulletItems([...reviewNextAdjustmentsItems, nextItem]),
                  }))
                  setNextAdjustmentsInput('')
                }}
                className="w-full rounded-lg border border-border bg-[#111111] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none"
                placeholder="Add adjustment and press Enter"
              />
              {reviewNextAdjustmentsItems.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {reviewNextAdjustmentsItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-[#111111]">
                      <span className="text-sm text-blue-300">
                        <span className="mr-2 text-blue-600">•</span>
                        {item}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewDraft((previous) => ({
                            ...previous,
                            nextAdjustments: joinBulletItems(removeBulletItem(reviewNextAdjustmentsItems, index)),
                          }))
                        }
                        className="shrink-0 cursor-pointer rounded p-1 text-neutral-600 opacity-0 transition-all hover:bg-red-950/40 hover:text-red-400 group-hover:opacity-100"
                        aria-label={`Remove adjustment item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={isSavingReview}
              className="rounded-lg border border-border bg-[#111111] px-4 py-2 text-sm text-slate-100 hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingReview ? 'Saving...' : 'Save Weekly Review'}
            </button>
          </form>
        </article>
      )}
    </section>
  )
}

export default PlanningPage
