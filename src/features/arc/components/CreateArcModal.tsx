import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Compass,
  Calendar,
  Layers,
  Target,
  Shield,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { Json } from '../../../types/database.types'
import { useAuth } from '../../../lib/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import {
  parseAndValidateArcConfig,
  type ArcConfigInput,
} from '../../../lib/schemas/seasonConfigSchema'
import { ARC_PROMPT_TEMPLATE } from '../prompts/arcPromptTemplate'
import { ArcIcon } from './ArcIcon'

export interface CreateArcModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newArcId?: string) => void
}

export function CreateArcModal({ isOpen, onClose, onSuccess }: CreateArcModalProps) {
  const [rawJson, setRawJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const validation = useMemo(() => {
    if (!rawJson.trim()) return null
    return parseAndValidateArcConfig(rawJson)
  }, [rawJson])

  const validData: ArcConfigInput | undefined = validation?.success ? validation.data : undefined

  // Compute calculated duration
  const totalDays = useMemo(() => {
    if (!validData) return 90
    const startMs = new Date(validData.startDate).getTime()
    const endMs = new Date(validData.endDate).getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 90
    return Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
  }, [validData])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ARC_PROMPT_TEMPLATE)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  const handleClose = useCallback(() => {
    setRawJson('')
    setSubmitError(null)
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

  const handleExecuteActivation = async () => {
    if (!validData) return

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      if (!user?.id) {
        throw new Error('User authentication required to activate an Arc. Please sign in.')
      }

      // Check if user already has an active arc
      const { data: existingActive, error: checkError } = await supabase
        .from('life_seasons')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (checkError) {
        console.warn('Error checking existing active arc:', checkError)
      }

      if (existingActive) {
        throw new Error(
          `An active campaign ("${existingActive.name}") is already in progress. Conclude or archive your active Arc before activating a new one.`,
        )
      }

      const arcId = crypto.randomUUID()
      const payload = {
        id: arcId,
        user_id: user.id,
        name: validData.title.trim(),
        start_date: validData.startDate,
        end_date: validData.endDate,
        planned_end_date: validData.endDate,
        status: 'active' as const,
        original_config: (validData as unknown) as Json,
        vows: (validData as unknown) as Json,
        amendments: ([] as unknown) as Json,
        milestone_progress: ({} as unknown) as Json,
      }

      const { error: insertErr } = await supabase.from('life_seasons').insert(payload)

      if (insertErr) {
        throw new Error(`Failed to activate arc: ${insertErr.message}`)
      }

      // Invalidate queries for instant reactive reflection across Life OS
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['active-season'] }),
        queryClient.invalidateQueries({ queryKey: ['life-seasons'] }),
        queryClient.invalidateQueries({ queryKey: ['life-seasons-archive'] }),
      ])

      handleClose()
      onSuccess?.(arcId)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Arc activation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const accent = validData?.accentColor || '#22d3ee'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <article className="relative z-10 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl font-sans text-text-primary">
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
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-medium text-text-primary">
                  Initiate Seasonal Arc
                </h2>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider border"
                  style={{
                    backgroundColor: `${accent}15`,
                    borderColor: `${accent}30`,
                    color: accent,
                  }}
                >
                  ADR-030
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Paste structured Arc JSON generated from Claude, ChatGPT, or your strategic interrogation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded border border-border bg-elevated hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Interrogation</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Interrogation Prompt</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded border border-border-subtle text-text-tertiary hover:text-text-primary hover:bg-elevated transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content Body: Split View (JSON Input & Live Architectural Preview) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
          {/* Left Column: JSON Editor Area */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="arc-json-input"
                className="text-xs font-mono uppercase tracking-wider text-text-tertiary"
              >
                Arc Config JSON Payload
              </label>
              <span className="text-[11px] font-mono text-text-tertiary">
                Markdown ```json fences auto-stripped
              </span>
            </div>

            <textarea
              id="arc-json-input"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder="Paste JSON here: {&#10;  &quot;title&quot;: &quot;Spring Build 2027&quot;,&#10;  &quot;startDate&quot;: &quot;2027-03-01&quot;,&#10;  &quot;endDate&quot;: &quot;2027-05-29&quot;,&#10;  &quot;accentColor&quot;: &quot;#10b981&quot;,&#10;  &quot;icon&quot;: &quot;sprout&quot;,&#10;  &quot;vow&quot;: { ... }&#10;}"
              className="flex-1 w-full min-h-[320px] bg-background border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary resize-none hide-scrollbar selection:bg-accent-primary/20"
            />

            {/* Validation Feedback Banner */}
            {validation && (
              <div>
                {validation.success ? (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Schema Verified: Canonical Arc Campaign Structure</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Schema Validation Errors ({validation.errors?.length})</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 max-h-28 overflow-y-auto font-mono text-[11px] opacity-90">
                      {validation.errors?.map((err, i) => (
                        <li key={i} className="truncate">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Visual Campaign Preview */}
          <div className="flex flex-col space-y-4 rounded-lg border border-border bg-background/50 p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <Compass className="h-3.5 w-3.5" style={{ color: accent }} />
                Live Campaign Preview
              </span>
              {validData && (
                <span className="text-[11px] font-mono" style={{ color: accent }}>
                  Ready to Commit
                </span>
              )}
            </div>

            {!validData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-tertiary space-y-2">
                <Layers className="h-8 w-8 opacity-40" />
                <p className="text-sm font-serif italic text-text-secondary">
                  No valid Arc campaign detected yet.
                </p>
                <p className="text-xs max-w-xs leading-relaxed">
                  Paste JSON on the left to inspect the parsed vows, focus domains, strict telemetry milestones, and phased timeline.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
                {/* Hero Campaign Card */}
                <div className="p-4 rounded-lg border border-border bg-surface space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded bg-surface border border-border/80"
                          style={{ color: accent }}
                        >
                          <ArcIcon name={validData.icon} className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="font-serif text-lg font-light text-text-primary leading-tight">
                          {validData.title}
                        </h3>
                      </div>
                      {validData.tagline && (
                        <p className="text-xs text-text-secondary italic">
                          "{validData.tagline}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: accent }}
                        title={`Accent: ${accent}`}
                      />
                      <span className="text-[10px] font-mono text-text-tertiary uppercase">
                        {validData.icon || 'snowflake'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border-subtle/50 text-[11px] font-mono text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {validData.startDate} → {validData.endDate}
                    </span>
                    <span>•</span>
                    <span className="text-text-secondary font-medium">
                      {totalDays}-DAY CAMPAIGN
                    </span>
                  </div>
                </div>

                {/* Vow Card */}
                {validData.vow && (
                  <div className="p-3.5 rounded-lg border border-border-subtle bg-surface/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-text-tertiary">
                      <Shield className="h-3 w-3" style={{ color: accent }} />
                      <span>{validData.vow.attribution || 'Seasonal Vow'}</span>
                    </div>
                    <p className="text-sm font-serif font-medium text-text-primary">
                      {validData.vow.headline}
                    </p>
                    <p className="text-xs font-serif italic text-text-secondary leading-relaxed">
                      "{validData.vow.body}"
                    </p>
                  </div>
                )}

                {/* Operating Principles */}
                {validData.principles && validData.principles.length > 0 && (
                  <div className="p-3.5 rounded-lg border border-border-subtle bg-surface/60 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
                      Operating Principles ({validData.principles.length})
                    </span>
                    <ul className="space-y-1.5 text-xs text-text-secondary">
                      {validData.principles.map((pr, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="font-mono text-[10px] text-text-tertiary shrink-0 mt-0.5">
                            0{idx + 1}.
                          </span>
                          <span className="leading-snug">{pr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Focus Domains */}
                {validData.focusDomains && validData.focusDomains.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
                      Focus Domains ({validData.focusDomains.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {validData.focusDomains.map((fd, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded border border-border-subtle bg-surface/80 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs font-medium text-text-primary truncate">
                            {fd.name}
                          </span>
                          {fd.binding && (
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                              style={{
                                borderColor: `${accent}30`,
                                color: accent,
                                backgroundColor: `${accent}10`,
                              }}
                            >
                              {fd.binding.source}.{fd.binding.metric}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phased Horizon Progression */}
                {validData.phases && validData.phases.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary block">
                      Phased Progression ({validData.phases.length} Phases)
                    </span>
                    <div className="space-y-1.5">
                      {validData.phases.map((ph, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded border border-border-subtle bg-surface/80 flex items-center justify-between text-xs gap-2"
                        >
                          <div className="space-y-0.5 truncate">
                            <span className="font-medium text-text-primary block truncate">
                              {ph.name}
                            </span>
                            {ph.focus && (
                              <span className="text-[11px] text-text-secondary truncate block italic">
                                {ph.focus}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-text-tertiary shrink-0">
                            Days {ph.startDay}–{ph.endDay}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones Matrix */}
                {validData.milestones && validData.milestones.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                      <Target className="h-3 w-3" style={{ color: accent }} />
                      Milestones ({validData.milestones.length})
                    </span>
                    <div className="space-y-1.5">
                      {validData.milestones.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded border border-border-subtle bg-surface/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5 truncate">
                            <span className="font-medium text-text-primary block truncate">
                              {m.title}
                            </span>
                            {m.description && (
                              <span className="text-[11px] text-text-secondary truncate block">
                                {m.description}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {m.kind === 'telemetry' ? (
                              <div className="text-right">
                                <span className="font-mono text-xs font-semibold text-text-primary">
                                  {m.targetValue} {m.unit}
                                </span>
                                <span className="block text-[9px] font-mono text-text-tertiary">
                                  {m.binding?.source}.{m.binding?.metric}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-tertiary uppercase">
                                Manual Checkoff
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-5 sm:px-6 py-4 border-t border-border-subtle bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {submitError && (
              <span className="text-xs text-rose-400 flex items-center gap-1.5 font-mono">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {submitError}
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
              type="button"
              onClick={handleExecuteActivation}
              disabled={!validData || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
              style={{
                backgroundColor: accent,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Activating Campaign...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Activate Arc Campaign</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </article>
    </div>
  )
}
