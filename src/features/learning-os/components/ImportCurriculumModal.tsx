import { useState, useMemo, useCallback, useEffect } from 'react'
import { 
  X, Copy, Check, AlertCircle, CheckCircle2, 
  Loader2, Sparkles, BookOpen, Layers, Clock, Target, FolderGit2
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { parseAndValidateCurriculum, type CurriculumInput } from '../../../lib/schemas/curriculumSchema'

export interface ImportCurriculumModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (newRoadmapId?: string) => void
}

const PROMPT_TEMPLATE_TEXT = `You are a Principal Curriculum Architect and Pedagogical Engineer. 
Design an exhaustive, mastery-oriented curriculum for the following topic:
<TOPIC_OR_DOMAIN>

Target Timeframe: <TIMEFRAME_E.G._12_WEEKS>
Intensity / Dedication: <HOURS_PER_WEEK>

Output MUST be strictly valid JSON conforming to the Life OS Curriculum Ingestion Protocol (ADR-028).
Do not include any conversational preamble or postscript outside of the JSON or markdown code fence.

### JSON Schema Contract

{
  "$schema": "https://life-os.system/schemas/v1/curriculum.json",
  "title": "<Canonical Title of Curriculum>",
  "slug": "<kebab-case-slug>",
  "description": "<Concise thesis on what capabilities will be mastered>",
  "startDate": "YYYY-MM-DD",
  "targetEndDate": "YYYY-MM-DD",
  "color": "#eab308",
  "stages": [
    {
      "orderIndex": 1,
      "title": "<Stage Title: e.g. Stage 1: Core Foundations>",
      "subtitle": "<Key conceptual mechanisms>",
      "note": "<Pedagogical directive or reference texts>",
      "sessions": [
        {
          "orderIndex": 1,
          "title": "<Session Title>",
          "estimatedMinutes": 60,
          "slot": "Deep Work",
          "description": "<Specific subtopics covered>",
          "tags": ["core", "theory", "practice"]
        }
      ]
    }
  ],
  "milestones": [
    {
      "title": "<Verifiable milestone or proof-of-work>"
    }
  ],
  "projects": [
    {
      "title": "<Artifact or Implementation Project Title>",
      "description": "<Technical specifications of the artifact>",
      "status": "not_started"
    }
  ]
}
`

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ImportCurriculumModal({ isOpen, onClose, onSuccess }: ImportCurriculumModalProps) {
  const [rawJson, setRawJson] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { user } = useAuth()
  const queryClient = useQueryClient()

  const validation = useMemo(() => {
    if (!rawJson.trim()) return null
    return parseAndValidateCurriculum(rawJson)
  }, [rawJson])

  const validData: CurriculumInput | undefined = validation?.success ? validation.data : undefined

  // Summary statistics calculation
  const totalStats = useMemo(() => {
    if (!validData) return null
    const stageCount = validData.stages.length
    let sessionCount = 0
    let totalMinutes = 0
    validData.stages.forEach(st => {
      sessionCount += st.sessions.length
      st.sessions.forEach(sess => {
        totalMinutes += sess.estimatedMinutes || 0
      })
    })
    const hours = Math.round(totalMinutes / 60 * 10) / 10
    const milestoneCount = validData.milestones.length
    const projectCount = validData.projects.length

    return { stageCount, sessionCount, totalMinutes, hours, milestoneCount, projectCount }
  }, [validData])

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE_TEXT)
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

  const handleExecuteImport = async () => {
    if (!validData) return

    let createdRoadmapId: string | null = null

    try {
      setIsSubmitting(true)
      setSubmitError(null)

      if (!user?.id) {
        throw new Error('User authentication required to import curriculum. Please sign in.')
      }

      // 1. Insert Roadmap
      const roadmapId = crypto.randomUUID()
      createdRoadmapId = roadmapId

      const roadmapPayload = {
        id: roadmapId,
        user_id: user.id,
        title: validData.title.trim(),
        slug: validData.slug?.trim() || slugify(validData.title),
        description: validData.description?.trim() || null,
        status: 'active' as const,
        start_date: validData.startDate || null,
        target_end_date: validData.targetEndDate || null,
        color: validData.color || '#eab308',
        metadata: {
          imported_from_ai: true,
          imported_at: new Date().toISOString(),
          source_schema: 'https://life-os.system/schemas/v1/curriculum.json'
        }
      }

      const { error: roadmapErr } = await supabase
        .from('learning_roadmaps')
        .insert(roadmapPayload)

      if (roadmapErr) {
        throw new Error(`Failed to create roadmap: ${roadmapErr.message}`)
      }

      // Pre-allocate UUIDs for stages so foreign-key relations are 100% deterministic
      const stageIds = validData.stages.map(() => crypto.randomUUID())

      // 2. Insert Stages
      const stageInsertPayloads = validData.stages.map((stage, idx) => ({
        id: stageIds[idx],
        user_id: user.id,
        roadmap_id: createdRoadmapId!,
        order_index: stage.orderIndex ?? (idx + 1),
        title: stage.title.trim(),
        subtitle: stage.subtitle?.trim() || null,
        note: stage.note?.trim() || null,
        color: stage.color || null,
        start_date: stage.startDate || null,
        end_date: stage.endDate || null,
        is_skipped: false
      }))

      const { error: stagesErr } = await supabase
        .from('learning_stages')
        .insert(stageInsertPayloads)

      if (stagesErr) {
        throw new Error(`Failed to create stages: ${stagesErr.message}`)
      }

      // 3. Insert Sessions
      const sessionInsertPayloads: Array<{
        id: string
        user_id: string
        stage_id: string
        order_index: number
        slot: string | null
        title: string
        description: string | null
        estimated_minutes: number | null
        tags: string[]
        target_date: string | null
        is_skipped: boolean
      }> = []

      validData.stages.forEach((stage, sIdx) => {
        const stageId = stageIds[sIdx]

        stage.sessions.forEach((sess, sessIdx) => {
          sessionInsertPayloads.push({
            id: crypto.randomUUID(),
            user_id: user.id,
            stage_id: stageId,
            order_index: sess.orderIndex ?? (sessIdx + 1),
            slot: sess.slot || null,
            title: sess.title.trim(),
            description: sess.description?.trim() || null,
            estimated_minutes: sess.estimatedMinutes ?? null,
            tags: sess.tags ?? [],
            target_date: sess.targetDate || null,
            is_skipped: false
          })
        })
      })

      if (sessionInsertPayloads.length > 0) {
        const { error: sessionsErr } = await supabase
          .from('learning_sessions')
          .insert(sessionInsertPayloads)

        if (sessionsErr) {
          throw new Error(`Failed to create sessions: ${sessionsErr.message}`)
        }
      }

      // 4. Insert Milestones
      if (validData.milestones && validData.milestones.length > 0) {
        const milestonePayloads = validData.milestones.map(m => {
          let stageId: string | null = null
          if (typeof m.stageIndex === 'number') {
            if (stageIds[m.stageIndex]) {
              // 0-indexed mapping
              stageId = stageIds[m.stageIndex]
            } else if (m.stageIndex >= 1 && stageIds[m.stageIndex - 1]) {
              // 1-indexed fallback
              stageId = stageIds[m.stageIndex - 1]
            }
          }

          return {
            id: crypto.randomUUID(),
            user_id: user.id,
            roadmap_id: createdRoadmapId!,
            stage_id: stageId,
            title: m.title.trim(),
            achieved: false
          }
        })

        const { error: milestonesErr } = await supabase
          .from('learning_milestones')
          .insert(milestonePayloads)

        if (milestonesErr) {
          throw new Error(`Failed to create milestones: ${milestonesErr.message}`)
        }
      }

      // 5. Insert Projects
      if (validData.projects && validData.projects.length > 0) {
        const projectPayloads = validData.projects.map(p => ({
          id: crypto.randomUUID(),
          user_id: user.id,
          roadmap_id: createdRoadmapId!,
          title: p.title.trim(),
          description: p.description?.trim() || null,
          status: p.status || 'not_started',
          repo_url: p.repoUrl?.trim() || null
        }))

        const { error: projectsErr } = await supabase
          .from('learning_projects')
          .insert(projectPayloads)

        if (projectsErr) {
          throw new Error(`Failed to create projects: ${projectsErr.message}`)
        }
      }

      // Invalidate queries for instant live reflection
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['learning-roadmaps'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-progress'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-stages'] }),
        queryClient.invalidateQueries({ queryKey: ['learning-sessions'] })
      ])

      const finalId = createdRoadmapId
      handleClose()
      onSuccess?.(finalId)
    } catch (err: unknown) {
      // Cascading rollback
      if (createdRoadmapId) {
        try {
          await supabase.from('learning_roadmaps').delete().eq('id', createdRoadmapId)
        } catch (rbErr) {
          console.error('Cascading rollback failed:', rbErr)
        }
      }
      setSubmitError(err instanceof Error ? err.message : 'Curriculum ingestion failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <article className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl font-sans text-text-primary">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-serif font-medium text-text-primary">Import AI Curriculum</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-primary/10 text-accent-primary border border-accent-primary/20 uppercase tracking-wider">
                  ADR-028
                </span>
              </div>
              <p className="text-xs text-text-secondary">
                Paste structured curriculum JSON generated from Claude, ChatGPT, or Gemini.
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
                  <Check className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-green-400">Copied Template</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Prompt Template</span>
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

        {/* Content Body: Split View (JSON Input & Live Preview) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
          {/* Left Column: JSON Editor Area */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="curriculum-json-input" className="text-xs font-mono uppercase tracking-wider text-text-tertiary">
                Curriculum JSON Payload
              </label>
              <span className="text-[11px] font-mono text-text-tertiary">
                Markdown ```json fences auto-stripped
              </span>
            </div>

            <textarea
              id="curriculum-json-input"
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              placeholder="Paste JSON here: {&#10;  &quot;title&quot;: &quot;Distributed Systems Engineering&quot;,&#10;  &quot;stages&quot;: [ ... ]&#10;}"
              className="flex-1 w-full min-h-[280px] bg-background border border-border rounded-lg p-3.5 font-mono text-xs text-text-primary leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent-primary focus:border-accent-primary resize-none hide-scrollbar selection:bg-accent-primary/20"
            />

            {/* Validation Feedback Banner */}
            {validation && (
              <div>
                {validation.success ? (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Schema Verified: Valid ADR-028 Curriculum Structure</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-threat-critical/10 border border-threat-critical/25 text-threat-critical text-xs space-y-1">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Schema Validation Errors ({validation.errors?.length})</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 pl-1 max-h-28 overflow-y-auto font-mono text-[11px] opacity-90">
                      {validation.errors?.map((err, i) => (
                        <li key={i} className="truncate">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Visual Preview Outline */}
          <div className="flex flex-col space-y-4 rounded-lg border border-border bg-background/50 p-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-text-tertiary flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-accent-primary" />
                Live Architectural Preview
              </span>
              {validData && (
                <span className="text-[11px] font-mono text-accent-primary">
                  Ready to Commit
                </span>
              )}
            </div>

            {!validData ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-tertiary space-y-2">
                <Layers className="h-8 w-8 opacity-40" />
                <p className="text-sm font-serif italic text-text-secondary">
                  No valid curriculum structure detected yet.
                </p>
                <p className="text-xs max-w-xs leading-relaxed">
                  Paste JSON in the left panel to inspect the parsed stages, study sessions, milestones, and projects.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 hide-scrollbar">
                {/* Header Card */}
                <div className="p-3.5 rounded-lg border border-border bg-surface space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-lg font-light text-text-primary leading-tight">
                      {validData.title}
                    </h3>
                    {validData.color && (
                      <span 
                        className="h-3 w-3 rounded-full shrink-0 mt-1 border border-border" 
                        style={{ backgroundColor: validData.color }} 
                      />
                    )}
                  </div>
                  {validData.description && (
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                      {validData.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-mono text-text-tertiary">
                    {validData.startDate && (
                      <span>Start: <span className="text-text-secondary">{validData.startDate}</span></span>
                    )}
                    {validData.targetEndDate && (
                      <span>Target: <span className="text-text-secondary">{validData.targetEndDate}</span></span>
                    )}
                  </div>
                </div>

                {/* Metrics Matrix */}
                {totalStats && (
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded bg-surface border border-border-subtle">
                      <span className="block text-base font-mono font-light text-text-primary">{totalStats.stageCount}</span>
                      <span className="text-[10px] font-mono uppercase text-text-tertiary">Stages</span>
                    </div>
                    <div className="p-2 rounded bg-surface border border-border-subtle">
                      <span className="block text-base font-mono font-light text-accent-primary">{totalStats.sessionCount}</span>
                      <span className="text-[10px] font-mono uppercase text-text-tertiary">Sessions</span>
                    </div>
                    <div className="p-2 rounded bg-surface border border-border-subtle">
                      <span className="block text-base font-mono font-light text-text-secondary">{totalStats.hours}h</span>
                      <span className="text-[10px] font-mono uppercase text-text-tertiary">Volume</span>
                    </div>
                    <div className="p-2 rounded bg-surface border border-border-subtle">
                      <span className="block text-base font-mono font-light text-text-primary">{totalStats.projectCount}</span>
                      <span className="text-[10px] font-mono uppercase text-text-tertiary">Projects</span>
                    </div>
                  </div>
                )}

                {/* Stages List */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
                    Curriculum Trajectory Breakdown ({validData.stages.length} Stages)
                  </span>

                  {validData.stages.map((st, sIdx) => (
                    <div key={sIdx} className="rounded-lg border border-border-subtle bg-surface/80 p-3 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-text-primary">
                          {st.orderIndex ? `${st.orderIndex}. ` : `${sIdx + 1}. `}{st.title}
                        </span>
                        <span className="text-[10px] font-mono text-text-tertiary shrink-0">
                          {st.sessions.length} sessions
                        </span>
                      </div>
                      {st.subtitle && (
                        <p className="text-[11px] font-serif italic text-text-secondary">
                          {st.subtitle}
                        </p>
                      )}

                      {/* Sessions Preview */}
                      <div className="space-y-1 pt-1">
                        {st.sessions.slice(0, 4).map((sess, sessIdx) => (
                          <div key={sessIdx} className="flex items-center justify-between text-[11px] pl-2 border-l border-border-subtle text-text-secondary py-0.5">
                            <span className="truncate pr-2">{sess.title}</span>
                            {sess.estimatedMinutes && (
                              <span className="text-[10px] font-mono text-text-tertiary shrink-0 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {sess.estimatedMinutes}m
                              </span>
                            )}
                          </div>
                        ))}
                        {st.sessions.length > 4 && (
                          <div className="text-[10px] font-mono text-text-tertiary pl-2 pt-0.5">
                            + {st.sessions.length - 4} more sessions
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Milestones & Projects if present */}
                {(validData.milestones.length > 0 || validData.projects.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {validData.milestones.length > 0 && (
                      <div className="p-3 rounded-lg border border-border-subtle bg-surface/60 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                          <Target className="h-3 w-3 text-accent-primary" />
                          Milestones ({validData.milestones.length})
                        </span>
                        <ul className="text-xs space-y-1 text-text-secondary">
                          {validData.milestones.map((m, idx) => (
                            <li key={idx} className="truncate">• {m.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validData.projects.length > 0 && (
                      <div className="p-3 rounded-lg border border-border-subtle bg-surface/60 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-text-tertiary flex items-center gap-1.5">
                          <FolderGit2 className="h-3 w-3 text-accent-primary" />
                          Artifacts ({validData.projects.length})
                        </span>
                        <ul className="text-xs space-y-1 text-text-secondary">
                          {validData.projects.map((p, idx) => (
                            <li key={idx} className="truncate">• {p.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-4 border-t border-border-subtle bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {submitError && (
              <span className="text-xs text-threat-critical flex items-center gap-1.5 font-mono">
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
              onClick={handleExecuteImport}
              disabled={!validData || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-wider font-semibold rounded bg-accent-primary text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Committing Atomic Batch...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execute Ingestion & Save</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </article>
    </div>
  )
}
