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
}

const priorityColors: Record<PlanItemPriority, string> = {
  High: 'rounded bg-threat-critical/10 border border-threat-critical/40 px-1.5 py-0.5 text-threat-critical font-mono text-[11px]',
  Medium: 'rounded bg-threat-warning/10 border border-threat-warning/40 px-1.5 py-0.5 text-threat-warning font-mono text-[11px]',
  Low: 'rounded bg-surface border border-border/40 px-1.5 py-0.5 text-text-tertiary font-mono text-[11px]',
}

const statusColors: Record<PlanItemStatus, string> = {
  Planned: 'text-text-tertiary',
  Doing: 'text-accent-primary font-medium',
  Done: 'text-threat-healthy',
  Dropped: 'text-text-tertiary/40 line-through',
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
      className={`relative shrink-0 rounded px-3 py-1.5 font-mono text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? 'border border-accent-primary bg-accent-primary/10 text-accent-primary'
          : 'border border-border/30 bg-surface text-text-secondary hover:bg-elevated hover:text-text-primary'
      }`}
    >
      {label}
      {badge ? (
        <span className="ml-1.5 inline-flex items-center rounded-full bg-background px-1.5 py-0.2 text-[10px] font-mono tabular-nums text-text-tertiary">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

// ─────────────────────────────────────────────
// Error Banner
// ─────────────────────────────────────────────
function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null

  return (
    <div className="rounded border border-threat-critical/50 bg-threat-critical/10 px-4 py-2 text-xs font-mono text-threat-critical">
      <span className="mr-2 font-bold">ERROR:</span>
      {getReadableErrorMessage(error)}
    </div>
  )
}

// ─────────────────────────────────────────────
// Alignment Health Badge
// ─────────────────────────────────────────────
function AlignmentBadge({ percent, linked, total }: { percent: number; linked: number; total: number }) {
  let color = 'border-threat-critical/40 text-threat-critical bg-threat-critical/10'
  if (percent >= 80) color = 'border-threat-healthy/40 text-threat-healthy bg-threat-healthy/10'
  else if (percent >= 50) color = 'border-threat-warning/40 text-threat-warning bg-threat-warning/10'
  else if (percent > 0) color = 'border-accent-primary/40 text-accent-primary bg-accent-primary/10'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs ${color}`}>
      <span className="tabular-nums">{total === 0 ? 'No items' : `${percent}% aligned`}</span>
      <span className="text-[10px] tabular-nums opacity-70">({linked}/{total})</span>
    </span>
  )
}

// ─────────────────────────────────────────────
// Main Planning Engine Component
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

  return (
    <section className="space-y-6 pb-28 sm:pb-24 font-sans text-text-primary max-w-5xl mx-auto px-2 sm:px-4">
      {/* ── Header with week info & tab bar ── */}
      <div className="border-b border-border/40 pb-4 space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-text-tertiary">
              <span>Planning Engine</span>
              <span>•</span>
              <span className="tabular-nums">Week of {formatWeekDate(currentWeekStart)}</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
              Sprint & Alignment Architect
            </h2>
          </div>
          <AlignmentBadge percent={alignmentPercent} linked={linkedItemsCount} total={weeklyItems.length} />
        </div>

        {/* Tab Navigation */}
        <nav className="flex gap-2 pt-2 border-t border-border/20">
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
      </div>

      {/* ── Error Banner ── */}
      <ErrorBanner error={activeError} />

      {/* ── Tab: Weekly Plan ── */}
      {activeTab === 'plan' && (
        <section className="space-y-6">
          {/* Weekly Focus Section */}
          <div className="border-b border-border/30 pb-6 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-sans text-base font-semibold text-text-primary">Weekly Focus</h3>
              <span className="font-mono text-xs text-text-tertiary">
                {isCreatingPlan || isUpdatingPlan ? 'Saving...' : 'Auto-saves on commit'}
              </span>
            </div>

            <div>
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
                placeholder="Declare weekly focus anchor and press Enter..."
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors"
              />
            </div>

            {focusItems.length > 0 && (
              <ul className="space-y-1 pt-1">
                {focusItems.map((item, index) => (
                  <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-surface transition-colors">
                    <span className="font-sans text-sm text-text-secondary">
                      <span className="mr-2 font-mono text-accent-primary">•</span>
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
                      className="cursor-pointer text-text-tertiary opacity-0 transition-opacity hover:text-threat-critical group-hover:opacity-100 p-1"
                      aria-label={`Remove focus item ${index + 1}`}
                    >
                      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add Plan Item Form */}
          <div className="border-b border-border/30 pb-6 space-y-4">
            <h3 className="font-sans text-base font-semibold text-text-primary">Sprint Plan Items</h3>

            <form onSubmit={handleCreatePlanItem} className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={itemTitle}
                  onChange={(event) => setItemTitle(event.target.value)}
                  placeholder="What objective needs to land this week?"
                  className="min-w-0 flex-1 rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors"
                />
                <select
                  value={itemPriority}
                  onChange={(event) => setItemPriority(event.target.value as PlanItemPriority)}
                  className="shrink-0 rounded border border-border/40 bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:border-accent-primary focus:outline-none"
                >
                  {planPriorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority} Priority
                    </option>
                  ))}
                </select>
              </div>

              {/* Expandable options */}
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="font-mono text-xs text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
              >
                {showMoreOptions ? '− Less options' : '+ Link to Goal, Task, Habit, or Notes'}
              </button>

              {showMoreOptions && (
                <div className="space-y-2.5 rounded border border-border/30 bg-surface/50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={itemStatus}
                      onChange={(event) => setItemStatus(event.target.value as PlanItemStatus)}
                      className="rounded border border-border/40 bg-surface p-2 font-sans text-xs text-text-primary focus:outline-none"
                    >
                      {planStatuses.map((status) => (
                        <option key={status} value={status}>
                          Status: {status}
                        </option>
                      ))}
                    </select>

                    <select
                      value={itemGoalId}
                      onChange={(event) => setItemGoalId(event.target.value)}
                      className="rounded border border-border/40 bg-surface p-2 font-sans text-xs text-text-primary focus:outline-none"
                    >
                      <option value="">Link Long-term Goal</option>
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
                      className="rounded border border-border/40 bg-surface p-2 font-sans text-xs text-text-primary focus:outline-none"
                    >
                      <option value="">Link Execution Task</option>
                      {tasks.map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                    </select>

                    <select
                      value={itemHabitId}
                      onChange={(event) => setItemHabitId(event.target.value)}
                      className="rounded border border-border/40 bg-surface p-2 font-sans text-xs text-text-primary focus:outline-none"
                    >
                      <option value="">Link Habit Anchor</option>
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
                    placeholder="Optional implementation notes..."
                    className="w-full rounded border border-border/40 bg-surface p-2 font-sans text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingItem || !itemTitle.trim()}
                className="rounded border border-border/40 bg-surface px-4 py-2 font-mono text-xs text-text-primary hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {isCreatingItem ? 'Adding...' : 'Add Plan Item ↵'}
              </button>
            </form>

            {/* Current week items list */}
            <div className="pt-2">
              {isItemsLoading ? (
                <p className="font-mono text-xs text-text-tertiary animate-pulse">Loading plan items...</p>
              ) : null}
              {!isItemsLoading && weeklyItems.length === 0 ? (
                <p className="font-mono text-xs text-text-tertiary">No plan items defined for this week.</p>
              ) : null}

              {weeklyItems.length > 0 && (
                <div className="divide-y divide-border/20 border-b border-border/30">
                  {weeklyItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between gap-3 py-3 px-1 transition-colors ${
                        item.status === 'Done' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={`font-sans text-sm ${item.status === 'Done' ? 'line-through text-text-tertiary' : 'font-medium text-text-primary'}`}>
                          {item.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={priorityColors[item.priority]}>
                            {item.priority}
                          </span>
                          {item.goal_id && (
                            <span className="rounded border border-threat-healthy/40 bg-threat-healthy/10 px-1.5 py-0.2 font-mono text-[10px] text-threat-healthy">
                              Goal Linked
                            </span>
                          )}
                          {item.notes && (
                            <span className="truncate text-xs text-text-tertiary max-w-sm" title={item.notes}>
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
                        className={`shrink-0 rounded border border-border/40 bg-surface px-2 py-1 font-mono text-xs focus:outline-none cursor-pointer ${statusColors[item.status]}`}
                      >
                        {planStatuses.map((status) => (
                          <option key={`${item.id}-${status}`} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Recent Entries */}
          <div className="border-b border-border/30 pb-4">
            <button
              type="button"
              onClick={() => setShowRecentEntries(!showRecentEntries)}
              className="flex w-full items-center justify-between py-2 text-left transition-colors hover:text-text-primary cursor-pointer"
            >
              <h3 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
                Historical Weekly Focus Entries
              </h3>
              <span className="font-mono text-xs text-text-tertiary">{showRecentEntries ? '▲' : '▼'}</span>
            </button>
            {showRecentEntries && (
              <div className="pt-2 space-y-2">
                {isPlansLoading ? <p className="font-mono text-xs text-text-tertiary">Loading history...</p> : null}
                {!isPlansLoading && plans.length === 0 ? <p className="font-mono text-xs text-text-tertiary">No plans on record.</p> : null}
                <ul className="divide-y divide-border/20 border-b border-border/20">
                  {plans.slice(0, 6).map((plan) => (
                    <li key={plan.id} className="py-2.5">
                      <p className="font-mono text-xs tabular-nums text-text-tertiary">{formatWeekDate(plan.week_start_date)}</p>
                      <p className="mt-0.5 font-sans text-sm text-text-secondary">{plan.focus_text}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tab: Goals ── */}
      {activeTab === 'goals' && (
        <section className="space-y-6">
          <div className="border-b border-border/30 pb-6 space-y-4">
            <h3 className="font-sans text-base font-semibold text-text-primary">Declare Strategic Goal</h3>
            <p className="text-xs text-text-tertiary">Long-term anchors that connect to weekly sprint items.</p>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <input
                value={goalTitle}
                onChange={(event) => setGoalTitle(event.target.value)}
                placeholder="Strategic goal title..."
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={goalDomain}
                  onChange={(event) => setGoalDomain(event.target.value as GoalDomain)}
                  className="rounded border border-border/40 bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:outline-none cursor-pointer"
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
                  className="rounded border border-border/40 bg-surface px-3 py-2 font-mono text-xs text-text-primary focus:outline-none"
                />
              </div>

              <textarea
                value={goalNotes}
                onChange={(event) => setGoalNotes(event.target.value)}
                rows={2}
                placeholder="Strategic notes and success criteria..."
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 font-sans text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none"
              />

              <button
                type="submit"
                disabled={isCreatingGoal || !goalTitle.trim()}
                className="rounded border border-border/40 bg-surface px-4 py-2 font-mono text-xs text-text-primary hover:bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isCreatingGoal ? 'Registering...' : 'Register Goal ↵'}
              </button>
            </form>
          </div>

          {/* Goals List */}
          {goals.length === 0 ? (
            <div className="py-8 text-center font-mono text-xs text-text-tertiary">
              No long-term strategic goals registered yet.
            </div>
          ) : (
            <div className="divide-y divide-border/20 border-b border-border/30">
              {goals.map((goal) => (
                <div key={goal.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm font-semibold text-text-primary">{goal.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded border border-border/40 bg-surface px-2 py-0.2 font-mono text-[10px] text-text-secondary">
                        {domainLabels[goal.domain]}
                      </span>
                      {goal.target_date && (
                        <span className="font-mono text-xs tabular-nums text-text-tertiary">
                          Target: {formatWeekDate(goal.target_date)}
                        </span>
                      )}
                    </div>
                    {goal.notes && <p className="mt-1 text-xs text-text-secondary">{goal.notes}</p>}
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
                    className={`shrink-0 rounded border border-border/40 bg-surface px-2 py-1 font-mono text-xs focus:outline-none cursor-pointer ${
                      goal.status === 'completed'
                        ? 'text-threat-healthy'
                        : goal.status === 'paused'
                          ? 'text-threat-warning'
                          : 'text-text-primary'
                    }`}
                  >
                    {goalStatuses.map((status) => (
                      <option key={`${goal.id}-${status}`} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Tab: Review ── */}
      {activeTab === 'review' && (
        <section className="space-y-6">
          <div className="border-b border-border/30 pb-6 space-y-2">
            <h3 className="font-sans text-base font-semibold text-text-primary">End-of-Week Review</h3>
            <p className="text-xs text-text-tertiary">Honest synthesis of execution wins, friction blockers, and trajectory adjustments.</p>
          </div>

          <form onSubmit={handleSaveWeeklyReview} className="space-y-6">
            {/* Wins */}
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-wider text-threat-healthy">
                Execution Wins
              </label>
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
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-threat-healthy focus:outline-none transition-colors"
                placeholder="Log a win and press Enter..."
              />
              {reviewWinsItems.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {reviewWinsItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-surface">
                      <span className="font-sans text-sm text-threat-healthy">
                        <span className="mr-2 font-mono">•</span>
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
                        className="cursor-pointer text-text-tertiary opacity-0 transition-opacity hover:text-threat-critical group-hover:opacity-100 p-1"
                        aria-label={`Remove win item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Blockers */}
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-wider text-threat-critical">
                Blockers & Friction
              </label>
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
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-threat-critical focus:outline-none transition-colors"
                placeholder="Log a friction point and press Enter..."
              />
              {reviewBlockersItems.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {reviewBlockersItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-surface">
                      <span className="font-sans text-sm text-threat-critical">
                        <span className="mr-2 font-mono">•</span>
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
                        className="cursor-pointer text-text-tertiary opacity-0 transition-opacity hover:text-threat-critical group-hover:opacity-100 p-1"
                        aria-label={`Remove blocker item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Next Adjustments */}
            <div className="space-y-2">
              <label className="block font-mono text-xs uppercase tracking-wider text-accent-primary">
                Next Adjustments
              </label>
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
                className="w-full rounded border border-border/40 bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-primary focus:outline-none transition-colors"
                placeholder="Log a trajectory adjustment and press Enter..."
              />
              {reviewNextAdjustmentsItems.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {reviewNextAdjustmentsItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="group flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-surface">
                      <span className="font-sans text-sm text-accent-primary">
                        <span className="mr-2 font-mono">•</span>
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
                        className="cursor-pointer text-text-tertiary opacity-0 transition-opacity hover:text-threat-critical group-hover:opacity-100 p-1"
                        aria-label={`Remove adjustment item ${index + 1}`}
                      >
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
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
              className="rounded border border-accent-primary/40 bg-accent-primary/10 px-4 py-2 font-mono text-xs text-accent-primary hover:bg-accent-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isSavingReview ? 'Saving...' : 'Save Weekly Review ↵'}
            </button>
          </form>
        </section>
      )}
    </section>
  )
}

export default PlanningPage
