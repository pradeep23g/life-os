import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { X, BookOpen, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useCreateSession } from '../api/useLearningOS'

export interface CreateSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  roadmapId: string
  stageId: string
  orderIndex?: number
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message
    if (typeof msg === 'string' && msg.trim().length > 0) {
      return msg
    }
  }
  return 'Failed to create session. Please try again.'
}

export function CreateSessionModal({
  isOpen,
  onClose,
  onSuccess,
  roadmapId,
  stageId,
  orderIndex,
}: CreateSessionModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [orderIndexState, setOrderIndexState] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [slot, setSlot] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutateAsync: createSession, isPending, error: mutationError } = useCreateSession()

  const handleClose = useCallback(() => {
    setTitle('')
    setDescription('')
    setEstimatedMinutes('')
    setOrderIndexState('')
    setTagsInput('')
    setSlot('')
    setTargetDate('')
    setValidationError(null)
    setIsSuccess(false)
    onClose()
  }, [onClose])

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  if (!isOpen) {
    return null
  }

  const validateForm = (): {
    isValid: boolean
    parsedEstimatedMinutes?: number
    parsedOrderIndex?: number
    parsedTags?: string[]
  } => {
    if (!title.trim()) {
      setValidationError('Session title is required.')
      return { isValid: false }
    }

    let parsedEstimatedMinutes: number | undefined = undefined
    if (estimatedMinutes.trim()) {
      const mins = Number(estimatedMinutes.trim())
      if (isNaN(mins) || mins < 0) {
        setValidationError('Estimated duration must be a valid positive number.')
        return { isValid: false }
      }
      parsedEstimatedMinutes = mins
    }

    let parsedOrderIndex: number | undefined = orderIndex
    if (orderIndexState.trim()) {
      const idx = Number(orderIndexState.trim())
      if (isNaN(idx)) {
        setValidationError('Order position must be a valid number.')
        return { isValid: false }
      }
      parsedOrderIndex = idx
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    setValidationError(null)
    return {
      isValid: true,
      parsedEstimatedMinutes,
      parsedOrderIndex,
      parsedTags: parsedTags.length > 0 ? parsedTags : undefined,
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isPending || isSuccess) return

    const { isValid, parsedEstimatedMinutes, parsedOrderIndex, parsedTags } = validateForm()
    if (!isValid) {
      return
    }

    try {
      await createSession({
        roadmapId,
        stageId,
        title: title.trim(),
        description: description.trim() || undefined,
        slot: slot.trim() || undefined,
        estimatedMinutes: parsedEstimatedMinutes,
        tags: parsedTags,
        orderIndex: parsedOrderIndex,
        targetDate: targetDate.trim() || undefined,
      })

      setIsSuccess(true)
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        handleClose()
      }, 800)
    } catch {
      // Mutation error handled via mutationError display in UI
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <article className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/40 text-purple-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create New Session</h2>
              <p className="text-xs text-slate-400">Add a learning session to this stage.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-[#111111] text-slate-400 hover:bg-[#222222] hover:text-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Session created successfully!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Session Title */}
          <div>
            <label htmlFor="session-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Session Title <span className="text-purple-400">*</span>
            </label>
            <input
              id="session-title"
              type="text"
              required
              disabled={isPending || isSuccess}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="e.g. 1.1 Ownership and Borrowing Rules"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="session-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="session-description"
              rows={3}
              disabled={isPending || isSuccess}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of goals, topics covered, or references for this session..."
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Estimated Duration & Order Index */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-duration" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Est. Duration (Minutes) <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="session-duration"
                type="number"
                min="0"
                step="1"
                disabled={isPending || isSuccess}
                value={estimatedMinutes}
                onChange={(e) => {
                  setEstimatedMinutes(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder="e.g. 45"
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="session-order" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Order Position <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="session-order"
                type="number"
                min="0"
                step="1"
                disabled={isPending || isSuccess}
                value={orderIndexState}
                onChange={(e) => {
                  setOrderIndexState(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder={orderIndex !== undefined ? String(orderIndex) : 'e.g. 0'}
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="session-tags" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tags <span className="text-slate-500 font-normal">(Optional, comma-separated)</span>
            </label>
            <input
              id="session-tags"
              type="text"
              disabled={isPending || isSuccess}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. fundamentals, memory, ownership"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Time Slot & Target Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-slot" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Time Slot <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="session-slot"
                type="text"
                disabled={isPending || isSuccess}
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="e.g. Morning / Deep Work"
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="session-target-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Date <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <input
                id="session-target-date"
                type="date"
                disabled={isPending || isSuccess}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error Banner */}
          {(validationError || mutationError) && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError || getErrorMessage(mutationError)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-[#111111] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || isSuccess || !title.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Created
                </>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
