import type { FormEvent } from 'react'
import type { HabitType } from '../../api/useHabits'

function CloseIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
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

type HabitCreateModalProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  setTitle: (title: string) => void
  habitType: HabitType
  setHabitType: (type: HabitType) => void
  targetValue: string
  setTargetValue: (val: string) => void
  unit: string
  setUnit: (unit: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  isCreating: boolean
  createError: unknown
}

export function HabitCreateModal({
  isOpen,
  onClose,
  title,
  setTitle,
  habitType,
  setHabitType,
  targetValue,
  setTargetValue,
  unit,
  setUnit,
  onSubmit,
  isCreating,
  createError,
}: HabitCreateModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label="Close create habit modal"
      />

      <div className="relative z-10 w-full max-w-lg rounded-sm border border-border bg-background p-5 sm:p-6 shadow-2xl space-y-4 text-text-primary">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3">
          <div>
            <h2 className="text-xl font-serif font-normal text-text-primary">Create Habit Rhythm</h2>
            <p className="text-xs font-sans text-text-secondary">Establish a binary or target rhythm for daily practice.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm border border-border-subtle text-text-secondary hover:text-text-primary hover:border-border transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-sans text-text-secondary mb-1">
              Habit title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. 20-minute reflection, 15 pages..."
              className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-sans text-text-secondary mb-1">
              Habit rhythm type
            </label>
            <select
              value={habitType}
              onChange={(event) => setHabitType(event.target.value as HabitType)}
              className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border"
            >
              <option value="binary">Binary (Completed / Open)</option>
              <option value="target">Target rhythm (Volume / Count)</option>
            </select>
          </div>

          {habitType === 'target' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-sans text-text-secondary mb-1">
                  Goal count
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm font-mono tabular-nums text-text-primary focus:outline-none focus:border-border"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-text-secondary mb-1">
                  Unit (optional)
                </label>
                <input
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="e.g. pages, minutes"
                  className="w-full rounded-sm border border-border-subtle bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-border"
                />
              </div>
            </div>
          ) : null}

          {createError ? (
            <p className="text-xs font-sans text-threat-critical">Failed to create habit: {getReadableErrorMessage(createError)}</p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-border-subtle px-3 py-1.5 text-xs font-sans text-text-secondary hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || title.trim().length === 0}
              className="px-4 py-1.5 text-xs font-sans rounded-sm bg-accent-primary/20 text-accent-primary border border-accent-primary/50 hover:bg-accent-primary/30 transition-colors font-medium disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Establish Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

