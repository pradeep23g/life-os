import { useState, useId } from 'react'
import { BookOpen, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react'
import { validateArcRetrospective } from '../../../lib/schemas/seasonConfigSchema'

export interface ArcRetrospectiveAnswers {
  whatWentWell: string
  whatDidnt: string
  whatChanged: string
  whatLearned: string
  whatCarriesForward: string
}

export interface ArcRetrospectiveModalProps {
  isOpen: boolean
  onClose: () => void
  arcTitle: string
  arcId: string
  accentColor?: string
  onSubmit: (answers: ArcRetrospectiveAnswers) => Promise<void>
}

interface QuestionField {
  key: keyof ArcRetrospectiveAnswers
  number: string
  title: string
  subtitle: string
  placeholder: string
}

const QUESTIONS: QuestionField[] = [
  {
    key: 'whatWentWell',
    number: '01',
    title: 'What went well?',
    subtitle: 'Protocols upheld, goals reached, and high-water marks achieved during this campaign.',
    placeholder: 'e.g. Maintained 90% deep work consistency, completed the endurance block without missing a session...',
  },
  {
    key: 'whatDidnt',
    number: '02',
    title: "What didn't?",
    subtitle: 'Frictions encountered, commitments broken, and root causes of operational deficits.',
    placeholder: 'e.g. Weekend habit adherence degraded in phase 3, sleep consistency dipped during heavy travel...',
  },
  {
    key: 'whatChanged',
    number: '03',
    title: 'What changed?',
    subtitle: 'Assumptions invalidated, environment shifts, and audited amendments made mid-stream.',
    placeholder: 'e.g. Pivoted project scope from broad mobile app to focused telemetry CLI, revised target hours...',
  },
  {
    key: 'whatLearned',
    number: '04',
    title: 'What did you learn?',
    subtitle: 'Core operational insights discovered about your capacity, focus rhythms, or limits.',
    placeholder: 'e.g. 90-minute blocks produce 2x output compared to scattered 30-minute intervals...',
  },
  {
    key: 'whatCarriesForward',
    number: '05',
    title: 'What carries forward?',
    subtitle: 'Permanent habit baselines, non-negotiables, or strategic directives to seed your next Arc.',
    placeholder: 'e.g. Morning shutdown routine stays locked as default standard, carry forward hydration discipline...',
  },
]

export function ArcRetrospectiveModal({
  isOpen,
  onClose,
  arcTitle,
  accentColor = '#22d3ee',
  onSubmit,
}: ArcRetrospectiveModalProps) {
  const titleId = useId()
  const [answers, setAnswers] = useState<ArcRetrospectiveAnswers>({
    whatWentWell: '',
    whatDidnt: '',
    whatChanged: '',
    whatLearned: '',
    whatCarriesForward: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFieldChange = (key: keyof ArcRetrospectiveAnswers, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    if (error) setError(null)
  }

  const answeredCount = Object.values(answers).filter((v) => v.trim().length > 0).length
  const isComplete = answeredCount === 5

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validateArcRetrospective(answers)
    if (!validation.success) {
      setError(validation.errors?.[0] || 'Please complete all 5 questions before submitting.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await onSubmit(answers)
      setAnswers({
        whatWentWell: '',
        whatDidnt: '',
        whatChanged: '',
        whatLearned: '',
        whatCarriesForward: '',
      })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to seal retrospective archive.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop blur */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity"
        onClick={() => !submitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <header className="p-5 sm:p-6 border-b border-border bg-elevated/40 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="flex h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
              />
              <span className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
                Stage 2 · Structured Retrospective Archival
              </span>
            </div>
            <h2 id={titleId} className="font-serif font-light text-2xl text-text-primary">
              Seal & Archive &ldquo;{arcTitle}&rdquo;
            </h2>
            <p className="font-sans text-xs text-text-secondary">
              Author your 5-part reflective record. Submitting permanently transitions this campaign to <strong>ARCHIVED</strong>, freezing its ledger into sovereign history.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close retrospective modal"
            className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Progress Tracker Bar */}
        <div className="px-6 py-2.5 bg-background border-b border-border flex items-center justify-between font-mono text-xs">
          <span className="text-text-tertiary">
            REQUIREMENT: <strong className="text-text-primary font-medium">{answeredCount} of 5 Questions Answered</strong>
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((step, idx) => {
              const isAnswered = Object.values(answers)[idx]?.trim().length > 0
              return (
                <span
                  key={step}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    isAnswered ? 'bg-emerald-400' : 'bg-border'
                  }`}
                />
              )
            })}
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {QUESTIONS.map((q) => {
            const val = answers[q.key]
            const charCount = val.length
            const isAnswered = val.trim().length > 0

            return (
              <div
                key={q.key}
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  isAnswered
                    ? 'border-border bg-surface/80'
                    : 'border-border-subtle bg-surface/30 focus-within:border-border focus-within:bg-surface/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border"
                        style={{
                          borderColor: isAnswered ? `${accentColor}40` : 'oklch(var(--border-base))',
                          color: isAnswered ? accentColor : 'oklch(var(--text-tertiary))',
                          backgroundColor: isAnswered ? `${accentColor}10` : 'transparent',
                        }}
                      >
                        {q.number}
                      </span>
                      <label htmlFor={q.key} className="font-serif text-sm font-medium text-text-primary">
                        {q.title}
                      </label>
                      {isAnswered && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="font-sans text-xs text-text-tertiary">
                      {q.subtitle}
                    </p>
                  </div>

                  <span className="font-mono text-[10px] text-text-tertiary shrink-0">
                    {charCount} chars
                  </span>
                </div>

                <textarea
                  id={q.key}
                  rows={3}
                  value={val}
                  onChange={(e) => handleFieldChange(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  disabled={submitting}
                  className="w-full px-3 py-2 text-xs font-sans rounded-lg border border-border bg-background text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all resize-none leading-relaxed"
                />
              </div>
            )
          })}

          {/* Footer Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border">
            <p className="text-xs font-mono text-text-tertiary text-center sm:text-left">
              {isComplete ? (
                <span className="text-emerald-400">All 5 questions complete. Ready to archive.</span>
              ) : (
                <span>Complete all 5 questions to enable permanent archival.</span>
              )}
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-border text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isComplete || submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-cyan-400 text-background font-mono text-xs uppercase tracking-wider font-semibold hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sealing Archive...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" />
                    <span>Seal & Archive Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
