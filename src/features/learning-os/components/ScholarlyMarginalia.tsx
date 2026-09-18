import { useState } from 'react'
import { Feather, Plus, Send, Quote, Loader2 } from 'lucide-react'
import { useRecentSessionLogs, useReflections, useCreateReflection } from '../api/useLearningOS'
import type { LearningRoadmap } from '../types/types'

interface ScholarlyMarginaliaProps {
  roadmaps: LearningRoadmap[]
  initialRoadmapId?: string
}

export function ScholarlyMarginalia({ roadmaps, initialRoadmapId }: ScholarlyMarginaliaProps) {
  const { data: recentLogs = [], isLoading: logsLoading } = useRecentSessionLogs()
  const { data: reflections = [], isLoading: reflectionsLoading } = useReflections()
  const { mutateAsync: createReflection, isPending: isSubmitting } = useCreateReflection()

  const [isComposing, setIsComposing] = useState(false)
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(() => {
    return initialRoadmapId || roadmaps[0]?.id || ''
  })
  const [reflectionContent, setReflectionContent] = useState('')
  const [reflectionType, setReflectionType] = useState<'general' | 'weekly_milestone' | 'teach_back_test'>('general')

  const roadmapMap = new Map(roadmaps.map((r) => [r.id, r]))

  const handlePostReflection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reflectionContent.trim() || !selectedRoadmapId || isSubmitting) return

    try {
      await createReflection({
        roadmapId: selectedRoadmapId,
        content: reflectionContent.trim(),
        reflectionType,
      })
      setReflectionContent('')
      setIsComposing(false)
    } catch {
      // Handled via React Query
    }
  }

  // Combine session logs that have notes with formal reflections
  const scholarlyEntries = [
    ...reflections.map((r) => ({
      id: `ref-${r.id}`,
      date: r.created_at,
      text: r.content,
      source: 'Scholarly Reflection' as const,
      roadmapTitle: roadmapMap.get(r.roadmap_id)?.title || 'Field Trajectory',
      type: r.reflection_type,
    })),
    ...recentLogs
      .filter((l) => l.notes && l.notes.trim().length > 0)
      .map((l) => ({
        id: `log-${l.id}`,
        date: l.logged_at,
        text: l.notes as string,
        source: 'Session Takeaway' as const,
        durationMinutes: l.duration_minutes,
        roadmapTitle: roadmapMap.get(l.roadmap_id)?.title || 'Study Session',
        type: 'log',
      })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const isLoading = logsLoading || reflectionsLoading

  return (
    <section aria-label="Scholarly Marginalia & Field Notes" className="space-y-8 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Feather size={16} className="text-accent-primary" />
            <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              Scholarly Marginalia & Field Takeaways
            </h2>
          </div>
          <p className="text-xs font-serif italic text-text-tertiary mt-0.5">
            Synthesis notes, conceptual marginalia, and verified study takeaways.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsComposing((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent-primary hover:text-accent-primary/80 transition-colors self-start sm:self-auto"
        >
          <Plus size={12} />
          {isComposing ? 'Close Inscriber' : 'Inscribe Marginalia'}
        </button>
      </div>

      {/* Inline Reflection Composer */}
      {isComposing && (
        <form
          onSubmit={handlePostReflection}
          className="border border-border-subtle bg-surface p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              Inscribe Synthesis Reflection
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedRoadmapId}
                onChange={(e) => setSelectedRoadmapId(e.target.value)}
                aria-label="Folio trajectory"
                className="h-7 rounded border border-border-subtle bg-background px-2 text-xs font-sans text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>

              <select
                value={reflectionType}
                onChange={(e) =>
                  setReflectionType(
                    e.target.value as 'general' | 'weekly_milestone' | 'teach_back_test'
                  )
                }
                aria-label="Reflection category"
                className="h-7 rounded border border-border-subtle bg-background px-2 text-xs font-mono uppercase text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="general">General Synthesis</option>
                <option value="weekly_milestone">Milestone Synthesis</option>
                <option value="teach_back_test">Teach-Back Proof</option>
              </select>
            </div>
          </div>

          <div>
            <textarea
              rows={4}
              required
              value={reflectionContent}
              onChange={(e) => setReflectionContent(e.target.value)}
              placeholder="Inscribe a definitive takeaway, proof realization, or scholarly commentary..."
              className="w-full rounded border border-border-subtle bg-background p-3 font-serif text-base text-text-primary placeholder-text-tertiary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="rounded px-3 py-1 text-xs font-mono uppercase tracking-wider text-text-secondary hover:bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reflectionContent.trim() || !selectedRoadmapId}
              className="inline-flex items-center gap-1.5 rounded bg-accent-primary px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Inscribing...
                </>
              ) : (
                <>
                  <Send size={11} />
                  Inscribe
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Chronicle Gutter + Marginalia Flow */}
      {isLoading ? (
        <div className="py-8 text-center text-xs font-mono text-text-tertiary">
          Reading field archives...
        </div>
      ) : scholarlyEntries.length === 0 ? (
        <div className="border border-dashed border-border-subtle bg-surface/20 p-8 text-center">
          <Quote size={24} className="mx-auto text-text-tertiary opacity-40 mb-2" />
          <p className="text-sm font-serif italic text-text-tertiary">
            No scholarly marginalia inscribed yet. Study notes and synthesis reflections will appear here as field chronicle entries.
          </p>
        </div>
      ) : (
        <div className="space-y-8 divide-y divide-border-subtle">
          {scholarlyEntries.slice(0, 8).map((entry) => (
            <article
              key={entry.id}
              className="pt-8 first:pt-0 flex flex-col md:flex-row gap-4 md:gap-8 items-start"
            >
              {/* Marginal Gutter Column */}
              <div className="w-full md:w-44 shrink-0 space-y-1">
                <span className="text-xs font-mono tabular-nums text-text-tertiary uppercase tracking-wider block">
                  {new Date(entry.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[11px] font-mono text-accent-primary uppercase tracking-wider block">
                  {'durationMinutes' in entry && entry.durationMinutes
                    ? `${entry.durationMinutes}m Session`
                    : entry.source}
                </span>
                <span className="text-[10px] font-mono text-text-tertiary line-clamp-1 block">
                  {entry.roadmapTitle}
                </span>
              </div>

              {/* Main Scholarly Monograph Text (Newsreader) */}
              <div className="flex-1 space-y-2">
                <blockquote className="font-serif text-lg font-light leading-relaxed text-text-primary text-balance">
                  "{entry.text}"
                </blockquote>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
