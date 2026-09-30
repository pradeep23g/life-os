import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { X, BookOpen, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useCreateRoadmap } from '../api/useLearningOS'

export interface CreateRoadmapModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  onOpenImportModal?: () => void
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
  return 'Failed to chart roadmap trajectory. Please try again.'
}

export function CreateRoadmapModal({ isOpen, onClose, onSuccess, onOpenImportModal }: CreateRoadmapModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [targetEndDate, setTargetEndDate] = useState('')
  const [color, setColor] = useState('#10b981')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { mutateAsync: createRoadmap, isPending, error: mutationError } = useCreateRoadmap()

  const handleClose = useCallback(() => {
    setTitle('')
    setDescription('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setTargetEndDate('')
    setColor('#10b981')
    setValidationError(null)
    onClose()
  }, [onClose])

  // Escape key listener
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
      setValidationError('Roadmap title is required.')
      return false
    }

    if (startDate && targetEndDate && targetEndDate < startDate) {
      setValidationError('Target end date cannot precede the start date.')
      return false
    }

    setValidationError(null)
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (isPending) return

    if (!validateForm()) {
      return
    }

    try {
      await createRoadmap({
        title: title.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        startDate: startDate || undefined,
        targetEndDate: targetEndDate || undefined,
      })

      handleClose()
      if (onSuccess) {
        onSuccess()
      }
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
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">Chart Knowledge Trajectory</h2>
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wider">Define a new intellectual curriculum</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="roadmap-title" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Trajectory Title <span className="text-accent-primary">*</span>
            </label>
            <input
              id="roadmap-title"
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (validationError) setValidationError(null)
              }}
              placeholder="e.g. Distributed Systems & Consensus Protocols"
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="roadmap-description" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Curriculum Thesis / Scope <span className="text-text-tertiary font-normal">(Optional)</span>
            </label>
            <textarea
              id="roadmap-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Core principles, foundational papers, implementation projects, and mastery milestones..."
              className="w-full rounded border border-border bg-background px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors resize-none"
            />
          </div>

          {/* Start Date & Target End Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Inception Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                className="w-full rounded border border-border bg-background px-3.5 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="target-end-date" className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
                Target Horizon
              </label>
              <input
                id="target-end-date"
                type="date"
                value={targetEndDate}
                onChange={(e) => {
                  setTargetEndDate(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                className="w-full rounded border border-border bg-background px-3.5 py-2 text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary transition-colors"
              />
            </div>
          </div>

          {/* Color Preset */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-1.5">
              Folio Accent Hues
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  title={preset.label}
                  className={`h-7 w-7 rounded transition-transform ${
                    color === preset.value
                      ? 'ring-2 ring-accent-primary ring-offset-2 ring-offset-surface scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border-subtle mt-6">
            <div>
              {onOpenImportModal && (
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Import AI Curriculum (JSON)
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
                disabled={isPending || !title.trim()}
                className="flex items-center justify-center gap-2 rounded bg-accent-primary px-5 py-2 text-sm font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inscribing...
                  </>
                ) : (
                  'Chart Trajectory'
                )}
              </button>
            </div>
          </div>
        </form>
      </article>
    </div>
  )
}
