import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { X, BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import { useCreateRoadmap } from '../api/useLearningOS'

export interface CreateRoadmapModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
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
  return 'Failed to create roadmap. Please try again.'
}

export function CreateRoadmapModal({ isOpen, onClose, onSuccess }: CreateRoadmapModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [targetEndDate, setTargetEndDate] = useState('')
  const [color, setColor] = useState('#8b5cf6')
  const [validationError, setValidationError] = useState<string | null>(null)

  const { mutateAsync: createRoadmap, isPending, error: mutationError } = useCreateRoadmap()

  const handleClose = useCallback(() => {
    setTitle('')
    setDescription('')
    setStartDate(new Date().toISOString().slice(0, 10))
    setTargetEndDate('')
    setColor('#8b5cf6')
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
      setValidationError('Target end date cannot be earlier than start date.')
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
              <h2 className="text-lg font-bold text-slate-100">Create New Roadmap</h2>
              <p className="text-xs text-slate-400">Define a new learning trajectory with stages and goals.</p>
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
          {/* Title */}
          <div>
            <label htmlFor="roadmap-title" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Roadmap Title <span className="text-purple-400">*</span>
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
              placeholder="e.g. Systems Programming with Rust"
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="roadmap-description" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="roadmap-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Master low-level programming concepts, memory management, and concurrency..."
              className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Start Date & Target End Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Start Date
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="target-end-date" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target End Date
              </label>
              <input
                id="target-end-date"
                type="date"
                value={targetEndDate}
                onChange={(e) => {
                  setTargetEndDate(e.target.value)
                  if (validationError) setValidationError(null)
                }}
                className="w-full rounded-lg border border-border bg-[#111111] px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Theme Color
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  title={preset.label}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === preset.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
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
              disabled={isPending || !title.trim()}
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Roadmap'
              )}
            </button>
          </div>
        </form>
      </article>
    </div>
  )
}
