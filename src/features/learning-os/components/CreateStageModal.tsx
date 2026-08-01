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
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Cyan', value: '#06b6d4' },
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
  return 'Failed to create stage. Please try again.'
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
  const [color, setColor] = useState('#8b5cf6')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const { mutateAsync: createStage, isPending, error: mutationError } = useCreateStage()

  const handleClose = useCallback(() => {
    setTitle('')
    setSubtitle('')
    setNote('')
    setColor('#8b5cf6')
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
      setValidationError('Stage title is required.')
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
      }, 800)
    } catch {
      // Mutation error handled via mutationError in UI
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
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Create New Stage</h2>
              <p className="text-xs text-slate-400">Add a stage to organize modules and topics.</p>
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
            <span>Stage created successfully!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Stage Title */}
          <div>
            <label htmlFor="stage-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Stage Title <span className="text-purple-400">*</span>
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
              placeholder="e.g. Stage 1: Core Fundamentals"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label htmlFor="stage-subtitle" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Subtitle <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              id="stage-subtitle"
              type="text"
              disabled={isPending || isSuccess}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Essential syntax, memory model, and borrowing"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="stage-notes" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="stage-notes"
              rows={3}
              disabled={isPending || isSuccess}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Key concepts, learning strategies, or resources for this stage..."
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none disabled:opacity-50"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Stage Color
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  disabled={isPending || isSuccess}
                  onClick={() => setColor(preset.value)}
                  title={preset.label}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === preset.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  style={{ backgroundColor: preset.value }}
                />
              ))}
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
                'Create Stage'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
