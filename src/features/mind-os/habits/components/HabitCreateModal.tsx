import type { FormEvent } from 'react'
import type { HabitType } from '../../api/useHabits'

function CloseIcon({ className = 'h-5 w-5' }: { className?: string }) {
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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/85"
        aria-label="Close create habit modal"
      />

      <article className="relative z-10 h-[88vh] w-[96vw] max-w-4xl overflow-auto rounded-xl border border-border bg-surface p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Create Habit</h2>
            <p className="text-sm text-slate-400">Set up binary or target habits in a focused creation flow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[#333333] bg-[#111111] text-slate-100 hover:bg-[#222222]"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <label className="block text-sm text-slate-300">
            Habit title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Read 20 pages"
              className="mt-1 w-full rounded-md border border-[#333333] bg-[#111111] px-3 py-2 text-sm text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Habit type
            <select
              value={habitType}
              onChange={(event) => setHabitType(event.target.value as HabitType)}
              className="mt-1 w-full rounded-md border border-[#333333] bg-[#111111] px-3 py-2 text-sm text-slate-100"
            >
              <option value="binary">Binary (done / not done)</option>
              <option value="target">Target habit (count based)</option>
            </select>
          </label>

          {habitType === 'target' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Goal count
                <input
                  type="number"
                  min={1}
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                  className="mt-1 w-full rounded-md border border-[#333333] bg-[#111111] px-3 py-2 text-sm text-slate-100"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Unit (optional)
                <input
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="pages"
                  className="mt-1 w-full rounded-md border border-[#333333] bg-[#111111] px-3 py-2 text-sm text-slate-100"
                />
              </label>
            </div>
          ) : null}

          {createError ? (
            <p className="text-sm text-red-400">Failed to create habit: {getReadableErrorMessage(createError)}</p>
          ) : null}

          <button
            type="submit"
            disabled={isCreating || title.trim().length === 0}
            className="w-full rounded-md border border-[#333333] bg-[#111111] px-4 py-2 text-sm text-slate-100 hover:bg-[#222222] disabled:opacity-60"
          >
            {isCreating ? 'Creating...' : 'Create Habit'}
          </button>
        </form>
      </article>
    </div>
  )
}
