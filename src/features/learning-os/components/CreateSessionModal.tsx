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
  return 'Failed to record study session checkpoint. Please try again.'
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
      }, 700)
    } catch {
      // Mutation error handled via mutationError display in UI
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <article className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-border bg-surface p-6 shadow-2xl font-sans">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-border-subtle bg-elevated text-accent-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">Add Curriculum Module</h2>
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Define a discrete study checkpoint</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-border-subtle bg-surface text-text-tertiary hover:bg-elevated hover:text-text-primary transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Banner */}
        {isSuccess && (
          <div className="mt-4 flex items-center gap-2.5 rounded border border-threat-healthy/40 bg-threat-healthy/10 p-3 text-xs text-threat-healthy">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Curriculum module established.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Session Title */}
          <div>
            <label htmlFor="session-title" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Module Title <span className="text-accent-primary">*</span>
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
              placeholder="e.g. 01. Virtual Memory & Paging Mechanisms"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="session-description" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Curriculum Notes <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <textarea
              id="session-description"
              rows={3}
              disabled={isPending || isSuccess}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Readings, proof requirements, code exercises, or core questions..."
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Estimated Duration & Order Index */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-duration" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Target Minutes
              </label>
              <input
                id="session-duration"
                type="number"
                min="0"
                step="5"
                disabled={isPending || isSuccess}
                value={estimatedMinutes}
                onChange={(e) => {
                  setEstimatedMinutes(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                placeholder="45"
                className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-mono tabular-nums text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="session-order" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Sequence Index
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
                placeholder={orderIndex !== undefined ? String(orderIndex) : '1'}
                className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-mono tabular-nums text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="session-tags" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Knowledge Tags <span className="text-text-tertiary font-normal">(comma-separated)</span>
            </label>
            <input
              id="session-tags"
              type="text"
              disabled={isPending || isSuccess}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. memory, kernel, paging, systems"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-mono text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
            />
          </div>

          {/* Time Slot & Target Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="session-slot" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Focus Window
              </label>
              <input
                id="session-slot"
                type="text"
                disabled={isPending || isSuccess}
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                placeholder="e.g. Morning Deep Work"
                className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="session-target-date" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Target Date
              </label>
              <input
                id="session-target-date"
                type="date"
                disabled={isPending || isSuccess}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded border border-border bg-background px-3.5 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error Banner */}
          {(validationError || mutationError) && (
            <div className="flex items-start gap-2.5 rounded border border-threat-critical/40 bg-threat-critical/10 p-3 text-xs text-threat-critical">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError || getErrorMessage(mutationError)}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="rounded border border-border bg-transparent px-4 py-2 text-sm font-mono uppercase tracking-wider text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending || isSuccess || !title.trim()}
              className="flex items-center justify-center gap-2 rounded bg-accent-primary px-5 py-2 text-sm font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Added
                </>
              ) : (
                'Add Module'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
