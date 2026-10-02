import { useState, useCallback, useEffect } from 'react'
import {
  X,
  AlertCircle,
  Loader2,
  FileEdit,
  Shield,
  Target,
  ListOrdered,
  History,
  Plus,
  Trash2,
} from 'lucide-react'
import type { ArcSeasonConfig, ArcMilestoneConfig } from '../types'

export interface AmendArcModalProps {
  isOpen: boolean
  onClose: () => void
  config: ArcSeasonConfig
  onAmend: (
    newCommitments: {
      vow?: ArcSeasonConfig['vow']
      principles?: string[]
      milestones?: ArcMilestoneConfig[]
    },
    reason: string,
  ) => Promise<void>
}

export function AmendArcModal({ isOpen, onClose, config, onAmend }: AmendArcModalProps) {
  const [headline, setHeadline] = useState(config.vow.headline)
  const [body, setBody] = useState(config.vow.body)
  const [attribution, setAttribution] = useState(config.vow.attribution || '')

  const [principles, setPrinciples] = useState<string[]>(config.principles || [])
  const [newPrincipleText, setNewPrincipleText] = useState('')

  const [milestones, setMilestones] = useState<ArcMilestoneConfig[]>(config.milestones || [])

  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'vow' | 'principles' | 'milestones' | 'history'>('vow')

  // Reset local state when modal opens with new config
  useEffect(() => {
    if (isOpen) {
      setHeadline(config.vow.headline)
      setBody(config.vow.body)
      setAttribution(config.vow.attribution || '')
      setPrinciples(config.principles || [])
      setMilestones(config.milestones || [])
      setReason('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [isOpen, config])

  const handleClose = useCallback(() => {
    setReason('')
    setError(null)
    setIsSubmitting(false)
    onClose()
  }, [onClose])

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

  // Principle helpers
  const handleAddPrinciple = () => {
    if (!newPrincipleText.trim()) return
    setPrinciples([...principles, newPrincipleText.trim()])
    setNewPrincipleText('')
  }

  const handleRemovePrinciple = (idx: number) => {
    setPrinciples(principles.filter((_, i) => i !== idx))
  }

  const handleUpdatePrinciple = (idx: number, text: string) => {
    const updated = [...principles]
    updated[idx] = text
    setPrinciples(updated)
  }

  // Milestone helpers
  const handleUpdateMilestoneTarget = (id: string, rawVal: string) => {
    const parsed = parseInt(rawVal, 10)
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, targetValue: Number.isNaN(parsed) ? 0 : parsed } : m)),
    )
  }

  const handleBlurMilestoneTarget = (id: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, targetValue: Math.max(1, m.targetValue || 1) } : m)),
    )
  }

  const isReasonValid = Boolean(reason.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReasonValid) {
      setError('A mandatory, non-empty justification reason is strictly required to amend commitments.')
      return
    }

    if (!headline.trim()) {
      setError('A headline oath is required for the seasonal vow.')
      return
    }

    if (!body.trim()) {
      setError('A covenant body is required for the seasonal vow.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const updatedVow = {
        headline: headline.trim(),
        body: body.trim(),
        attribution: attribution.trim(),
      }

      // Automatically include any uncommitted text from the new principle input field
      const finalPrinciples = newPrincipleText.trim()
        ? [...principles, newPrincipleText.trim()]
        : principles

      // Ensure all milestone target values are clamped to at least 1
      const finalMilestones = milestones.map((m) => ({
        ...m,
        targetValue: typeof m.targetValue === 'number' ? Math.max(1, m.targetValue || 1) : m.targetValue,
      }))

      await onAmend(
        {
          vow: updatedVow,
          principles: finalPrinciples,
          milestones: finalMilestones,
        },
        reason.trim(),
      )

      handleClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to commit amendment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const accent = config.accentColor || '#22d3ee'
  const pastAmendments = config.amendments || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <article className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl font-sans text-text-primary">
        {/* Header */}
        <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm transition-colors"
              style={{
                borderColor: `${accent}40`,
                backgroundColor: `${accent}15`,
                color: accent,
              }}
            >
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-medium text-text-primary">
                  Amend Active Commitments
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Audited
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Adjust vows, principles, or milestone targets for "{config.title}".
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 sm:px-6 py-2.5 border-b border-border-subtle bg-background/40 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('vow')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'vow'
                ? 'bg-elevated text-text-primary font-medium border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Shield className="h-3.5 w-3.5" style={{ color: activeTab === 'vow' ? accent : undefined }} />
            <span>Sovereign Vow</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('principles')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'principles'
                ? 'bg-elevated text-text-primary font-medium border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ListOrdered className="h-3.5 w-3.5" style={{ color: activeTab === 'principles' ? accent : undefined }} />
            <span>Principles ({principles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'milestones'
                ? 'bg-elevated text-text-primary font-medium border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Target className="h-3.5 w-3.5" style={{ color: activeTab === 'milestones' ? accent : undefined }} />
            <span>Milestone Targets ({milestones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === 'history'
                ? 'bg-elevated text-text-primary font-medium border border-border'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <History className="h-3.5 w-3.5" style={{ color: activeTab === 'history' ? accent : undefined }} />
            <span>Audit Trail ({pastAmendments.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="p-5 sm:p-6 space-y-6 flex-1">
            {/* TAB 1: VOW */}
            {activeTab === 'vow' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="amend-vow-headline" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                    Headline Oath
                  </label>
                  <input
                    id="amend-vow-headline"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2 font-serif text-base text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    placeholder="e.g. Silence and Relentless Velocity"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="amend-vow-body" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                    Covenant Body & Directives
                  </label>
                  <textarea
                    id="amend-vow-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg p-3 font-serif text-sm text-text-primary leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    placeholder="Enter the seasonal vow text..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="amend-vow-attribution" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                    Attribution / Directive Label
                  </label>
                  <input
                    id="amend-vow-attribution"
                    type="text"
                    value={attribution}
                    onChange={(e) => setAttribution(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3.5 py-2 font-mono text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    placeholder="e.g. Winter Covenant 2026"
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PRINCIPLES */}
            {activeTab === 'principles' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
                    Operating Principles
                  </label>

                  <div className="space-y-2">
                    {principles.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-tertiary w-6 shrink-0 text-right">
                          0{idx + 1}.
                        </span>
                        <input
                          type="text"
                          value={p}
                          onChange={(e) => handleUpdatePrinciple(idx, e.target.value)}
                          className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePrinciple(idx)}
                          className="p-1.5 rounded text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remove principle"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Principle */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
                  <input
                    type="text"
                    value={newPrincipleText}
                    onChange={(e) => setNewPrincipleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddPrinciple()
                      }
                    }}
                    placeholder="Add an immutable operating rule..."
                    className="flex-1 bg-background border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrinciple}
                    disabled={!newPrincipleText.trim()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-elevated hover:bg-surface text-xs font-mono uppercase tracking-wider text-text-primary disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: MILESTONES */}
            {activeTab === 'milestones' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
                    Milestone Target Calibration
                  </label>
                  <p className="text-xs text-text-secondary">
                    Modify target values for telemetry milestones. Pacing ratios and recovery math will adapt deterministically.
                  </p>
                </div>

                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-lg border border-border bg-surface/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-primary">
                            {m.title}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase text-text-tertiary">
                            {m.kind}
                          </span>
                        </div>
                        {m.description && (
                          <p className="text-[11px] text-text-secondary">
                            {m.description}
                          </p>
                        )}
                        {m.binding && (
                          <span className="text-[10px] font-mono text-text-tertiary block">
                            Bound: {m.binding.source}.{m.binding.metric}
                          </span>
                        )}
                      </div>

                      {m.kind === 'telemetry' && typeof m.targetValue === 'number' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <label htmlFor={`target-${m.id}`} className="text-xs font-mono text-text-tertiary">
                            Target:
                          </label>
                          <input
                            id={`target-${m.id}`}
                            type="number"
                            min={1}
                            value={m.targetValue === 0 ? '' : m.targetValue}
                            onChange={(e) => handleUpdateMilestoneTarget(m.id, e.target.value)}
                            onBlur={() => handleBlurMilestoneTarget(m.id)}
                            className="w-24 bg-background border border-border rounded px-2.5 py-1 text-xs font-mono text-text-primary text-right focus:outline-none focus:ring-1 focus:ring-accent-primary"
                          />
                          <span className="text-xs font-mono text-text-secondary uppercase">
                            {m.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: AUDIT TRAIL */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <label className="text-xs font-mono uppercase tracking-wider text-text-tertiary block">
                  Historical Amendment Log ({pastAmendments.length} Records)
                </label>

                {pastAmendments.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-border-subtle rounded-lg text-text-tertiary space-y-1">
                    <p className="text-xs font-serif italic text-text-secondary">
                      No amendments have been recorded for this Arc.
                    </p>
                    <p className="text-[11px]">
                      The campaign remains in its original frozen commitment state.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {pastAmendments.map((am, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-border-subtle bg-surface text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-text-tertiary">
                          <span className="text-accent-primary font-medium">{am.field}</span>
                          <span>{new Date(am.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-text-secondary italic">
                          "{am.reason}"
                        </p>
                        <div className="text-[10px] font-mono text-text-tertiary pt-1 border-t border-border-subtle/50 flex items-center gap-2">
                          <span className="truncate">Was: {JSON.stringify(am.previousValue)}</span>
                          <span>→</span>
                          <span className="truncate text-text-primary">Now: {JSON.stringify(am.newValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MANDATORY JUSTIFICATION FIELD */}
            <div className="pt-4 border-t border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="amendment-justification"
                  className="text-xs font-mono uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-medium"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  Mandatory Amendment Justification (Audited)
                </label>
                <span className="text-[11px] font-mono text-text-tertiary">
                  Strictly Required
                </span>
              </div>

              <textarea
                id="amendment-justification"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Declare the strategic or operational necessity for modifying declared commitments..."
                className="w-full bg-background border border-border rounded-lg p-3 font-mono text-xs text-text-primary leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-primary"
                required
              />
              <p className="text-[11px] text-text-tertiary">
                Every amendment appends an immutable audit record to the season's telemetry ledger with timestamp, diffs, and your reason.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="px-5 sm:px-6 py-4 border-t border-border-subtle bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div>
              {error && (
                <span className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-mono uppercase tracking-wider rounded border border-border text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isReasonValid || isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow"
                style={{
                  backgroundColor: accent,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Committing Audit...</span>
                  </>
                ) : (
                  <>
                    <FileEdit className="h-3.5 w-3.5" />
                    <span>Commit Amendment</span>
                  </>
                )}
              </button>
            </div>
          </footer>
        </form>
      </article>
    </div>
  )
}
