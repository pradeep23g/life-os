import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { X, Layers, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useCreateStage } from '../api/useLearningOS'

export interface CreateStageModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  roadmapId: string
  orderIndex?: number
}

const COLOR_PRESETS = [
  { label: 'Emerald', value: '#10b981' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Sage', value: '#84cc16' },
  { label: 'Copper', value: '#ea580c' },
  { label: 'Monochrome', value: '#71717a' },
]

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
  return 'Failed to establish stage station. Please try again.'
}

export function CreateStageModal({
  isOpen,
  onClose,
  onSuccess,
  roadmapId,
  orderIndex,
}: CreateStageModalProps) {
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [note, setNote] = useState('')
  const [color, setColor] = useState('#10b981')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutateAsync: createStage, isPending, error: mutationError } = useCreateStage()

  const handleClose = useCallback(() => {
    setTitle('')
    setSubtitle('')
    setNote('')
    setColor('#10b981')
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

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setValidationError('Stage designation title is required.')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isPending || isSuccess) return

    if (!validateForm()) {
      return
    }

    try {
      await createStage({
        roadmapId,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        note: note.trim() || undefined,
        color: color || undefined,
        orderIndex,
      })

      setIsSuccess(true)
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        handleClose()
      }, 700)
    } catch {
      // Mutation error handled via mutationError in UI
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
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">Establish Knowledge Stage</h2>
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                Stage {orderIndex ?? 1} Traversal Checkpoint
              </p>
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
            <span>Stage station successfully established.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Stage Title */}
          <div>
            <label htmlFor="stage-title" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Stage Designation <span className="text-accent-primary">*</span>
            </label>
            <input
              id="stage-title"
              type="text"
              required
              disabled={isPending || isSuccess}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="e.g. Memory Models & Pointers"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="stage-subtitle" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Subtitle / Scope <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <input
              id="stage-subtitle"
              type="text"
              disabled={isPending || isSuccess}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Stack vs Heap, Pointer Arithmetic, and Ownership"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="stage-notes" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Scholarly Marginalia / Stage Note <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <textarea
              id="stage-notes"
              rows={3}
              disabled={isPending || isSuccess}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Essential references, foundational theorems, or synthesis questions to answer..."
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-serif text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Color Preset */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Station Accent Hue
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  disabled={isPending || isSuccess}
                  onClick={() => setColor(preset.value)}
                  title={preset.label}
                  className={`h-7 w-7 rounded transition-transform ${
                    color === preset.value
                      ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-surface scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
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
                  Establishing...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Established
                </>
              ) : (
                'Establish Stage'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
