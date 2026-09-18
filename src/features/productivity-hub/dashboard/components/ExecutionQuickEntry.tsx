import { forwardRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { TaskDeadlineType } from '../../api/useTasks'
import { toIndiaDateKey } from '../../../mind-os/utils/date'

interface ExecutionQuickEntryProps {
  onCreateTask: (params: {
    title: string
    deadlineType: TaskDeadlineType
    deadlineDate: string | null
  }) => Promise<void> | void
  isCreating: boolean
}

export const ExecutionQuickEntry = forwardRef<HTMLInputElement, ExecutionQuickEntryProps>(
  function ExecutionQuickEntry({ onCreateTask, isCreating }, ref) {
    const [title, setTitle] = useState('')
    const [deadlineType, setDeadlineType] = useState<TaskDeadlineType>('no_deadline')
    const [specificDate, setSpecificDate] = useState('')
    const [showOptions, setShowOptions] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault()
      const trimmed = title.trim()
      if (!trimmed || isCreating) {
        return
      }

      let resolvedDate: string | null = null
      if (deadlineType === 'same_day') {
        resolvedDate = toIndiaDateKey(new Date())
      } else if (deadlineType === 'specific_date') {
        resolvedDate = specificDate || toIndiaDateKey(new Date())
      }

      await onCreateTask({
        title: trimmed,
        deadlineType,
        deadlineDate: resolvedDate,
      })

      setTitle('')
      setDeadlineType('no_deadline')
      setSpecificDate('')
      setShowOptions(false)
    }

    return (
      <form
        onSubmit={handleSubmit}
        className="group relative flex flex-col sm:flex-row sm:items-center gap-2 border-b border-border/40 py-3 transition-colors focus-within:border-accent-primary"
      >
        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-sm font-bold text-accent-primary select-none pl-1" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={ref}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isCreating}
            placeholder="New task... (press Enter to commit, '/' to focus)"
            aria-label="New task input"
            className="w-full bg-transparent font-sans text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none disabled:opacity-60"
          />
        </div>

        {/* Quick deadline actions & submit button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pl-6 sm:pl-0">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="text-xs font-mono text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {deadlineType === 'same_day' ? 'Due Today' : deadlineType === 'specific_date' ? `Due ${specificDate || 'Date'}` : '+ Deadline'}
          </button>

          {showOptions && (
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setDeadlineType('no_deadline')
                  setShowOptions(false)
                }}
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  deadlineType === 'no_deadline'
                    ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                    : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeadlineType('same_day')
                  setShowOptions(false)
                }}
                className={`rounded px-1.5 py-0.5 border transition-colors ${
                  deadlineType === 'same_day'
                    ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                    : 'border-border bg-surface text-text-secondary hover:bg-elevated'
                }`}
              >
                Today
              </button>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value)
                  setDeadlineType('specific_date')
                }}
                className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!title.trim() || isCreating}
            className="inline-flex items-center rounded border border-border bg-surface px-3 py-1 font-mono text-xs text-text-secondary transition-all hover:bg-elevated hover:text-text-primary active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {isCreating ? 'Adding...' : 'Enter ↵'}
          </button>
        </div>
      </form>
    )
  },
)
