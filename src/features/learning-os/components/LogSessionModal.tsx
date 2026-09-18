import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { X, Clock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { useLogSession } from '../api/useLearningOS'

export interface LogSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  roadmapId: string
  sessionId?: string
  sessionTitle?: string
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
  return 'Failed to record study session. Please try again.'
}

export function LogSessionModal({
  isOpen,
  onClose,
  onSuccess,
  roadmapId,
  sessionId,
  sessionTitle,
}: LogSessionModalProps) {
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [metricsJson, setMetricsJson] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutateAsync: logSession, isPending, error: mutationError } = useLogSession()

  const handleClose = useCallback(() => {
    setDurationMinutes('')
    setNotes('')
    setMetricsJson('')
    setValidationError(null)
    setIsSuccess(false)
    onClose()
  }, [onClose])

  // Close modal on Escape key
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

  const validateForm = (): { isValid: boolean; parsedDuration?: number; parsedMetrics?: Record<string, unknown> } => {
    const trimmedDuration = durationMinutes.trim()
    if (!trimmedDuration) {
      setValidationError('Study duration is required.')
      return { isValid: false }
    }

    const parsedDuration = Number(trimmedDuration)
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setValidationError('Duration must be a positive integer greater than 0.')
      return { isValid: false }
    }

    let parsedMetrics: Record<string, unknown> | undefined = undefined
    const trimmedMetrics = metricsJson.trim()
    if (trimmedMetrics) {
      try {
        const parsed = JSON.parse(trimmedMetrics)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setValidationError('Metrics must be a valid JSON dictionary (e.g. {"pagesRead": 25}).')
          return { isValid: false }
        }
        parsedMetrics = parsed as Record<string, unknown>
      } catch {
        setValidationError('Invalid JSON format for metrics.')
        return { isValid: false }
      }
    }

    setValidationError(null)
    return { isValid: true, parsedDuration, parsedMetrics }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isPending || isSuccess) return

    const { isValid, parsedDuration, parsedMetrics } = validateForm()
    if (!isValid || parsedDuration === undefined) {
      return
    }

    try {
      await logSession({
        roadmapId,
        sessionId: sessionId || undefined,
        durationMinutes: parsedDuration,
        notes: notes.trim() || undefined,
        metrics: parsedMetrics,
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
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">Inscribe Study Session</h2>
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">
                {sessionTitle ? `Station: ${sessionTitle}` : 'Record completed study duration & telemetry'}
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
            <span>Study session inscribed into permanent ledger.</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Duration Minutes */}
          <div>
            <label htmlFor="log-duration" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Study Duration (Minutes) <span className="text-accent-primary">*</span>
            </label>
            <input
              id="log-duration"
              type="number"
              min="1"
              step="1"
              required
              disabled={isPending || isSuccess}
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="e.g. 50"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-mono tabular-nums text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors disabled:opacity-50"
            />
          </div>

          {/* Notes (Editorial Newsreader font for scholarly takeaways) */}
          <div>
            <label htmlFor="log-notes" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Scholarly Marginalia & Synthesis Notes <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <textarea
              id="log-notes"
              rows={3}
              disabled={isPending || isSuccess}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key insights discovered, proof synthesis, architectural realizations, or open questions..."
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm font-serif text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Metrics JSON */}
          <div>
            <label htmlFor="log-metrics" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Telemetry Parameters <span className="text-text-tertiary font-normal">(Optional JSON)</span>
            </label>
            <textarea
              id="log-metrics"
              rows={2}
              disabled={isPending || isSuccess}
              value={metricsJson}
              onChange={(e) => {
                setMetricsJson(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder='{"pagesRead": 35, "theoremsDerived": 3, "focusRating": 5}'
              className="font-mono text-xs w-full rounded border border-border bg-background px-3.5 py-2.5 text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors resize-none disabled:opacity-50"
            />
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
              disabled={isPending || !durationMinutes.trim() || isSuccess}
              className="flex items-center justify-center gap-2 rounded bg-accent-primary px-5 py-2 text-sm font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Inscribing...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Inscribed
                </>
              ) : (
                'Inscribe Session'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
