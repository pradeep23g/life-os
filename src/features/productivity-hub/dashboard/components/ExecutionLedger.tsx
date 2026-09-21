import { useEffect, useRef } from 'react'
import type { Task } from '../../api/useTasks'
import type { TimeLog } from '../../../time-os/api/useTimeLogs'
import { toIndiaDateKey } from '../../../../lib/date'

interface ExecutionLedgerProps {
  tasks: Task[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  onToggleTask: (taskId: string, currentCompleted: boolean) => void
  onStartFocus: (task: Task) => void
  onStopFocus: () => void
  onDeleteTask: (taskId: string) => void
  activeTimer: TimeLog | null | undefined
  isUpdating: boolean
  isStartingTimer: boolean
}

export function ExecutionLedger({
  tasks,
  selectedIndex,
  onSelectIndex,
  onToggleTask,
  onStartFocus,
  onStopFocus,
  onDeleteTask,
  activeTimer,
  isUpdating,
  isStartingTimer,
}: ExecutionLedgerProps) {
  const rowRefs = useRef<(HTMLElement | null)[]>([])
  const todayKey = toIndiaDateKey(new Date())

  // Ensure rowRefs array is appropriately sized
  useEffect(() => {
    rowRefs.current = rowRefs.current.slice(0, tasks.length)
  }, [tasks.length])

  // Scroll selected row into view when navigating with keyboard
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < tasks.length) {
      const rowElement = rowRefs.current[selectedIndex]
      if (rowElement) {
        rowElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, tasks.length])

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center border-b border-border/30">
        <p className="font-sans text-sm text-text-secondary">
          Queue clear. No pending execution tasks.
        </p>
        <p className="mt-1 font-mono text-xs text-text-tertiary">
          Type above or press <kbd className="rounded border border-border bg-surface px-1 py-0.5">/</kbd> to queue your next task.
        </p>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Active task execution queue"
      className="divide-y divide-border/20 border-b border-border/30"
    >
      {/* ─── Desktop Header (Hairline Swiss Ledger) ─── */}
      <div className="hidden md:flex items-center gap-3 py-2 px-3 font-mono text-[11px] uppercase tracking-wider text-text-tertiary border-b border-border/40 select-none">
        <span className="w-8 text-center shrink-0">Idx</span>
        <span className="w-8 text-center shrink-0">Done</span>
        <span className="flex-1">Task Definition</span>
        <span className="w-28 text-right shrink-0">Deadline</span>
        <span className="w-36 text-right shrink-0">Focus Engine</span>
        <span className="w-8 text-center shrink-0">Del</span>
      </div>

      {/* ─── Task Rows ─── */}
      {tasks.map((task, index) => {
        const isSelected = index === selectedIndex
        const isTaskTimerActive = activeTimer?.task_id === task.id
        const isOverdue =
          !task.is_completed &&
          task.deadline_type === 'specific_date' &&
          task.deadline_date &&
          task.deadline_date < todayKey
        const isDueToday =
          !task.is_completed &&
          (task.deadline_type === 'same_day' ||
            (task.deadline_type === 'specific_date' && task.deadline_date === todayKey))

        return (
          <div
            key={task.id}
            ref={(el) => {
              rowRefs.current[index] = el
            }}
            role="option"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelectIndex(index)}
            className={`group flex flex-col md:flex-row md:items-center gap-2 md:gap-3 py-3 md:py-2.5 px-3 transition-colors cursor-pointer outline-none ${
              isSelected
                ? 'bg-elevated/70 border-l-2 border-l-accent-primary'
                : 'hover:bg-surface/50 border-l-2 border-l-transparent'
            }`}
          >
            {/* ── Desktop Row Layout ── */}
            <div className="hidden md:flex items-center gap-3 w-full">
              {/* Col 1: Index */}
              <span className="w-8 text-center shrink-0 font-mono text-xs tabular-nums text-text-tertiary">
                {String(index + 1).padStart(2, '0')}
              </span>

              {/* Col 2: Completion Checkbox */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.is_completed}
                  aria-label={`Mark "${task.title}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
                  disabled={isUpdating}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleTask(task.id, !task.is_completed)
                  }}
                  className={`h-4 w-4 rounded border flex items-center justify-center transition-all cursor-pointer ${
                    task.is_completed
                      ? 'border-accent-primary bg-accent-primary text-background'
                      : 'border-border bg-surface hover:border-text-secondary'
                  }`}
                >
                  {task.is_completed && (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Col 3: Task Title */}
              <div className="flex-1 min-w-0 pr-2">
                <span
                  className={`font-sans text-sm block truncate ${
                    task.is_completed
                      ? 'line-through text-text-tertiary'
                      : 'font-medium text-text-primary'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              {/* Col 4: Deadline Indicator */}
              <div className="w-28 text-right shrink-0 font-mono text-xs tabular-nums">
                {isOverdue ? (
                  <span className="text-threat-critical font-medium">
                    OVERDUE ({task.deadline_date})
                  </span>
                ) : isDueToday ? (
                  <span className="text-threat-warning font-medium">
                    DUE TODAY
                  </span>
                ) : task.deadline_type === 'specific_date' && task.deadline_date ? (
                  <span className="text-text-tertiary">{task.deadline_date}</span>
                ) : (
                  <span className="text-text-tertiary/40">---</span>
                )}
              </div>

              {/* Col 5: Direct Action Trigger / Focus Timer */}
              <div className="w-36 text-right shrink-0">
                {isTaskTimerActive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStopFocus()
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-accent-primary/40 bg-accent-primary/20 px-2 py-0.5 font-mono text-xs text-accent-primary hover:bg-accent-primary/30 transition-colors cursor-pointer"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
                    <span>STOP</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isStartingTimer || Boolean(activeTimer)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartFocus(task)
                    }}
                    className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-0.5 font-mono text-xs text-text-secondary hover:bg-elevated hover:text-text-primary transition-all active:scale-95 disabled:opacity-30 cursor-pointer"
                  >
                    <span>FOCUS</span>
                    <kbd className="hidden lg:inline text-[10px] text-text-tertiary">F</kbd>
                  </button>
                )}
              </div>

              {/* Col 6: Delete / Archive */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <button
                  type="button"
                  aria-label={`Delete task ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Delete this task from the queue?')) {
                      onDeleteTask(task.id)
                    }
                  }}
                  className="text-text-tertiary hover:text-threat-critical transition-colors opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Mobile Touch-First Execution Composition (< 768px) ── */}
            <div className="md:hidden flex items-start gap-3 w-full">
              {/* 44x44 Minimum Touch Target for Checkbox */}
              <div className="shrink-0 pt-0.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.is_completed}
                  aria-label={`Mark "${task.title}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
                  disabled={isUpdating}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleTask(task.id, !task.is_completed)
                  }}
                  className={`h-6 w-6 rounded border flex items-center justify-center transition-all ${
                    task.is_completed
                      ? 'border-accent-primary bg-accent-primary text-background'
                      : 'border-border bg-surface active:bg-elevated'
                  }`}
                >
                  {task.is_completed && (
                    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-sans text-sm leading-snug break-words ${
                    task.is_completed
                      ? 'line-through text-text-tertiary'
                      : 'font-medium text-text-primary'
                  }`}
                >
                  {task.title}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px] tabular-nums text-text-tertiary">
                  <span>#{String(index + 1).padStart(2, '0')}</span>
                  {isOverdue ? (
                    <span className="text-threat-critical font-medium">Overdue ({task.deadline_date})</span>
                  ) : isDueToday ? (
                    <span className="text-threat-warning font-medium">Due Today</span>
                  ) : task.deadline_type === 'specific_date' && task.deadline_date ? (
                    <span>Due {task.deadline_date}</span>
                  ) : null}
                </div>
              </div>

              {/* Mobile Focus & Delete Actions */}
              <div className="flex items-center gap-1 shrink-0 pt-0.5">
                {isTaskTimerActive ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onStopFocus()
                    }}
                    className="rounded border border-accent-primary/40 bg-accent-primary/20 px-2.5 py-1 font-mono text-xs text-accent-primary"
                  >
                    STOP
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isStartingTimer || Boolean(activeTimer)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartFocus(task)
                    }}
                    className="rounded border border-border bg-surface px-2.5 py-1 font-mono text-xs text-text-secondary active:bg-elevated disabled:opacity-30"
                  >
                    FOCUS
                  </button>
                )}

                <button
                  type="button"
                  aria-label={`Delete task ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm('Delete this task from the queue?')) {
                      onDeleteTask(task.id)
                    }
                  }}
                  className="p-1.5 text-text-tertiary hover:text-threat-critical transition-colors"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
