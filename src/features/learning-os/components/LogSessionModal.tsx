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
  return 'Failed to log session. Please try again.'
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
      setValidationError('Duration is required.')
      return { isValid: false }
    }

    const parsedDuration = Number(trimmedDuration)
    if (isNaN(parsedDuration) || parsedDuration <= 0) {
      setValidationError('Duration must be a positive number greater than 0.')
      return { isValid: false }
    }

    let parsedMetrics: Record<string, unknown> | undefined = undefined
    const trimmedMetrics = metricsJson.trim()
    if (trimmedMetrics) {
      try {
        const parsed = JSON.parse(trimmedMetrics)
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          setValidationError('Metrics must be a valid JSON object (e.g. {"score": 95}).')
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

      // Close modal after brief success feedback
      setTimeout(() => {
        handleClose()
      }, 800)
    } catch {
      // Mutation error is captured by React Query and displayed in UI
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
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Log Study Session</h2>
              <p className="text-xs text-slate-400">
                {sessionTitle ? `Session: ${sessionTitle}` : 'Record completed study duration, notes, and metrics.'}
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Duration Minutes */}
          <div>
            <label htmlFor="log-duration" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Duration (Minutes) <span className="text-purple-400">*</span>
            </label>
            <input
              id="log-duration"
              type="number"
              min="1"
              step="1"
              required
              value={durationMinutes}
              onChange={(e) => {
                setDurationMinutes(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="e.g. 45"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="log-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="log-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of topics covered, key insights, or questions to review..."
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Metrics JSON */}
          <div>
            <label htmlFor="log-metrics" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Metrics JSON <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="log-metrics"
              rows={2}
              value={metricsJson}
              onChange={(e) => {
                setMetricsJson(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder='e.g. {"focusRating": 5, "pagesRead": 20}'
              className="font-mono text-xs w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Error Banner */}
          {(validationError || mutationError) && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError || getErrorMessage(mutationError)}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Session logged successfully!</span>
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
              disabled={isPending || !durationMinutes.trim() || isSuccess}
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Logged!
                </>
              ) : (
                'Log Session'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
