import { useMemo, useRef, useState } from 'react'
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useToggleTaskCompletion,
  type Task,
  type TaskDeadlineType,
} from '../api/useTasks'
import {
  getWeekStartDateISO,
  usePlanning,
  useWeeklyPlanItems,
} from '../api/usePlanning'
import {
  useActiveTimer,
  useStartTimer,
  useStopTimer,
} from '../../time-os/api/useTimeLogs'
import { toIndiaDateKey } from '../../../lib/date'
import { ExecutionHeader } from './components/ExecutionHeader'
import { ExecutionQuickEntry } from './components/ExecutionQuickEntry'
import { ExecutionLedger } from './components/ExecutionLedger'
import { ExecutionSprintContext } from './components/ExecutionSprintContext'
import { useExecutionKeyboard } from './useExecutionKeyboard'

type FilterMode = 'active' | 'completed' | 'all'

export default function ProductivityHubDashboard() {
  const [filterMode, setFilterMode] = useState<FilterMode>('active')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const quickEntryInputRef = useRef<HTMLInputElement>(null)

  // ─── Data Hooks ───
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks()
  const { mutate: createTask, isPending: isCreatingTask } = useCreateTask()
  const { mutate: toggleCompletion, isPending: isUpdatingTask } = useToggleTaskCompletion()
  const { mutate: deleteTask } = useDeleteTask()

  // ─── Timer Hooks ───
  const { data: activeTimer } = useActiveTimer()
  const { mutate: startTimer, isPending: isStartingTimer } = useStartTimer()
  const { mutate: stopTimer, isPending: isStoppingTimer } = useStopTimer()

  // ─── Sprint / Planning Hooks ───
  const currentWeekStart = getWeekStartDateISO()
  const { data: plans = [] } = usePlanning()
  const { data: weeklyItems = [] } = useWeeklyPlanItems(currentWeekStart)

  const existingPlan = useMemo(() => {
    return plans.find((plan) => plan.week_start_date === currentWeekStart) ?? null
  }, [plans, currentWeekStart])

  const todayKey = toIndiaDateKey(new Date())

  // ─── Filtered & Sorted Tasks ───
  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => !t.is_completed)
  }, [tasks])

  const completedTodayTasks = useMemo(() => {
    return tasks.filter((t) => t.is_completed && toIndiaDateKey(t.updated_at) === todayKey)
  }, [tasks, todayKey])

  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        !t.is_completed &&
        t.deadline_type === 'specific_date' &&
        t.deadline_date &&
        t.deadline_date < todayKey,
    )
  }, [tasks, todayKey])

  // Sort: Overdue/Due Today first, then other specific dates, then same_day, then no_deadline
  const sortedActiveTasks = useMemo(() => {
    return [...pendingTasks].sort((a, b) => {
      // Overdue first
      const aOverdue = a.deadline_type === 'specific_date' && a.deadline_date && a.deadline_date < todayKey
      const bOverdue = b.deadline_type === 'specific_date' && b.deadline_date && b.deadline_date < todayKey
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1

      // Specific date before no_deadline
      if (a.deadline_type === 'specific_date' && b.deadline_type !== 'specific_date') return -1
      if (a.deadline_type !== 'specific_date' && b.deadline_type === 'specific_date') return 1

      // Same day before no deadline
      if (a.deadline_type === 'same_day' && b.deadline_type === 'no_deadline') return -1
      if (a.deadline_type === 'no_deadline' && b.deadline_type === 'same_day') return 1

      return 0
    })
  }, [pendingTasks, todayKey])

  const displayedTasks = useMemo(() => {
    if (filterMode === 'active') return sortedActiveTasks
    if (filterMode === 'completed') return tasks.filter((t) => t.is_completed)
    return tasks
  }, [filterMode, sortedActiveTasks, tasks])

  // Currently selected task in the list
  const currentSelectedTask = displayedTasks[selectedIndex] ?? null

  // Active task currently tracked by focus timer (if any)
  const activeFocusTaskTitle = useMemo(() => {
    if (!activeTimer?.task_id) return null
    const matched = tasks.find((t) => t.id === activeTimer.task_id)
    return matched ? matched.title : null
  }, [activeTimer, tasks])

  // ─── Actions ───
  const handleToggleCurrent = () => {
    if (!currentSelectedTask) return
    toggleCompletion({
      id: currentSelectedTask.id,
      isCompleted: !currentSelectedTask.is_completed,
    })
  }

  const handleStartFocusCurrent = (taskToFocus?: Task) => {
    const targetTask = taskToFocus || currentSelectedTask
    if (!targetTask) return

    // If this task is already running, stop it
    if (activeTimer?.task_id === targetTask.id) {
      stopTimer()
      return
    }

    // Start timer for this task
    startTimer({
      taskId: targetTask.id,
      bucket: 'Deep Work',
      description: targetTask.title,
    })
  }

  const handleStopFocus = () => {
    stopTimer()
  }

  const handleQuickEntryFocus = () => {
    quickEntryInputRef.current?.focus()
  }

  const handleCreateTask = ({
    title,
    deadlineType,
    deadlineDate,
  }: {
    title: string
    deadlineType: TaskDeadlineType
    deadlineDate: string | null
  }) => {
    createTask({
      title,
      deadlineType,
      deadlineDate,
    })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTask({ id: taskId })
  }

  // ─── Keyboard-first Navigation ───
  useExecutionKeyboard({
    itemCount: displayedTasks.length,
    selectedIndex,
    onSelectIndex: setSelectedIndex,
    onToggleCurrent: handleToggleCurrent,
    onFocusTimerCurrent: () => handleStartFocusCurrent(),
    onQuickEntryFocus: handleQuickEntryFocus,
    enabled: true,
  })

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-2 sm:px-4 space-y-8 font-sans text-text-primary">
      {/* ─── Operational Header & Live Focus Horizon ─── */}
      <ExecutionHeader
        pendingCount={pendingTasks.length}
        completedTodayCount={completedTodayTasks.length}
        overdueCount={overdueTasks.length}
        activeTimer={activeTimer}
        activeTaskTitle={activeFocusTaskTitle}
        onStopFocus={handleStopFocus}
        isStoppingFocus={isStoppingTimer}
      />

      {/* ─── Execution Queue Stage ─── */}
      <section className="space-y-4" aria-label="Execution Ledger">
        {/* Queue Filter Tabs & View Controls */}
        <div className="flex items-center justify-between gap-4 border-b border-border/30 pb-2">
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterMode('active')
                setSelectedIndex(0)
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                filterMode === 'active'
                  ? 'border border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              Active ({pendingTasks.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('completed')
                setSelectedIndex(0)
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                filterMode === 'completed'
                  ? 'border border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              Completed ({tasks.filter((t) => t.is_completed).length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('all')
                setSelectedIndex(0)
              }}
              className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'border border-accent-primary bg-accent-primary/10 text-accent-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              }`}
            >
              All ({tasks.length})
            </button>
          </div>

          <div className="font-mono text-xs tabular-nums text-text-tertiary">
            {displayedTasks.length > 0 ? (
              <span>
                Row {selectedIndex + 1} of {displayedTasks.length}
              </span>
            ) : null}
          </div>
        </div>

        {/* Inline Quick Task Entry (Borderless) */}
        <ExecutionQuickEntry
          ref={quickEntryInputRef}
          onCreateTask={handleCreateTask}
          isCreating={isCreatingTask}
        />

        {/* Interactive Execution Ledger Table */}
        {isTasksLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-tertiary animate-pulse">
            Loading execution ledger...
          </div>
        ) : (
          <ExecutionLedger
            tasks={displayedTasks}
            selectedIndex={selectedIndex}
            onSelectIndex={setSelectedIndex}
            onToggleTask={(taskId, currentCompleted) => {
              toggleCompletion({ id: taskId, isCompleted: currentCompleted })
            }}
            onStartFocus={handleStartFocusCurrent}
            onStopFocus={handleStopFocus}
            onDeleteTask={handleDeleteTask}
            activeTimer={activeTimer}
            isUpdating={isUpdatingTask}
            isStartingTimer={isStartingTimer}
          />
        )}
      </section>

      {/* ─── Sprint Alignment & Objectives (Asymmetric Swiss Datum) ─── */}
      <ExecutionSprintContext
        currentWeekStart={currentWeekStart}
        focusText={existingPlan?.focus_text}
        weeklyItems={weeklyItems}
      />
    </div>
  )
}
