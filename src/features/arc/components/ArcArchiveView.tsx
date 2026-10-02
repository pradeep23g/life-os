import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Compass,
  Sparkles,
  Calendar,
  Shield,
  Target,
  History,
  Clock,
  Layers,
  Activity,
  Plus,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { ArcIcon } from './ArcIcon'
import type { ArcLifecycleStatus, ArcMilestoneConfig, ArcPaceStatus, MilestoneProgressMap } from '../types'
import { useDataLabDailyActivity } from '../../data-lab/api/useDataLab'
import {
  calculateOverallHealth,
  calculateTemporalHorizon,
  evaluateMilestonePace,
} from '../utils/paceEvaluator'
import { resolveBinding } from '../utils/telemetryRegistry'
import { getIndiaDateKey } from '../config'

export interface ArcArchiveViewProps {
  onInitiateArc: () => void
  hideHero?: boolean
}

interface HistoricalSeasonRecord {
  id: string
  name: string
  start_date: string
  end_date: string
  status: ArcLifecycleStatus
  completed_at?: string | null
  archived_at?: string | null
  planned_end_date?: string | null
  original_config?: Record<string, unknown> | null
  vows?: Record<string, unknown> | null
  amendments?: unknown[] | null
  milestone_progress?: Record<string, unknown> | null
  retrospective?: Record<string, unknown> | null
}

const HEALTH_BADGES: Record<ArcPaceStatus, { label: string; className: string }> = {
  complete: {
    label: 'Complete',
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  on_track: {
    label: 'On Track',
    className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
  at_risk: {
    label: 'At Risk',
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  behind: {
    label: 'Behind',
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  },
}

export function ArcArchiveView({ onInitiateArc, hideHero = false }: ArcArchiveViewProps) {
  const [expandedRetros, setExpandedRetros] = useState<Record<string, boolean>>({})
  const { data: dailyActivity = [] } = useDataLabDailyActivity()
  const today = getIndiaDateKey()

  const { data: historicalArcs = [], isLoading } = useQuery<HistoricalSeasonRecord[]>({
    queryKey: ['life-seasons-archive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_seasons')
        .select('*')
        .in('status', ['completed', 'archived'])
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Failed to load historical arcs:', error)
        return []
      }
      return (data || []) as HistoricalSeasonRecord[]
    },
  })

  return (
    <main className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 md:px-8 space-y-10">
      {/* Hero Idle Section (Rendered when no active arc exists) */}
      {!hideHero && (
        <section className="p-8 sm:p-12 rounded-2xl border border-border bg-surface/50 text-center space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-surface border border-border/80 mx-auto text-accent-primary shadow-inner">
            <Compass className="h-7 w-7 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif font-light text-3xl sm:text-4xl text-text-primary tracking-tight">
              No Active Arc Campaign
            </h1>
            <p className="font-sans text-sm text-text-secondary leading-relaxed max-w-lg mx-auto">
              The ledger is currently idle. Seasonal Arcs are prescriptive temporal campaigns that hold your daily execution accountable to declared vows, strict linear pacing, and verified telemetry invariants.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onInitiateArc}
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-cyan-400 text-background font-mono text-xs uppercase tracking-wider font-semibold hover:bg-cyan-300 transition-all shadow-lg hover:shadow-cyan-400/20 active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Initiate Seasonal Arc</span>
            </button>
          </div>
        </section>
      )}

      {/* Historical Campaigns Section */}
      <section className="space-y-6" aria-label="Historical Arc Campaigns">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-text-tertiary" />
            <h2 className="font-mono text-xs uppercase tracking-wider text-text-tertiary">
              Historical Arc Campaigns ({historicalArcs.length})
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {historicalArcs.length > 0 && (
              <span className="text-[11px] font-mono text-text-tertiary hidden sm:inline">
                Concluded & Archived
              </span>
            )}
            <button
              type="button"
              onClick={onInitiateArc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-elevated hover:bg-surface text-xs font-mono uppercase tracking-wider text-text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Initiate New Arc</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center font-mono text-xs text-text-tertiary">
            LOADING HISTORICAL ARCS...
          </div>
        ) : historicalArcs.length === 0 ? (
          <div className="p-10 rounded-xl border border-dashed border-border-subtle text-center space-y-2 text-text-tertiary">
            <Layers className="h-8 w-8 mx-auto opacity-30" />
            <p className="font-serif italic text-sm text-text-secondary">
              No historical campaigns recorded on the ledger.
            </p>
            <p className="text-xs max-w-sm mx-auto">
              When a seasonal arc completes or concludes, its final telemetry evaluations, milestone audits, and sovereign vows will be permanently preserved here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {historicalArcs.map((arc) => {
              const cfg = (arc.original_config || arc.vows || {}) as Record<string, unknown>
              const title = (cfg.title as string) || arc.name || 'Untitled Arc'
              const tagline = cfg.tagline as string | undefined
              const accentColor = (cfg.accentColor as string) || '#22d3ee'
              const iconName = cfg.icon as string | undefined
              const vow = (cfg.vow as { headline?: string; body?: string; attribution?: string }) || null
              const milestones = (cfg.milestones as ArcMilestoneConfig[]) || []
              const milestoneProgress = (arc.milestone_progress || {}) as MilestoneProgressMap
              const amendmentsCount = Array.isArray(arc.amendments) ? arc.amendments.length : 0

              const startMs = new Date(arc.start_date).getTime()
              const endMs = new Date(arc.end_date).getTime()
              const totalDays = (!Number.isNaN(startMs) && !Number.isNaN(endMs))
                ? Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
                : 90

              const isEarlyCompletion = Boolean(
                arc.completed_at &&
                arc.completed_at.slice(0, 10) < arc.end_date,
              )

              // Scope daily activity to the arc's actual active window
              const effectiveEndDate = arc.completed_at
                ? (arc.completed_at.slice(0, 10) < arc.end_date ? arc.completed_at.slice(0, 10) : arc.end_date)
                : arc.end_date
              const arcActivity = dailyActivity.filter(
                (r) => r.activity_date >= arc.start_date && r.activity_date <= effectiveEndDate,
              )

              const temporal = calculateTemporalHorizon(
                arc.start_date,
                arc.end_date,
                today,
                arc.completed_at || arc.end_date,
              )

              const milestoneStates = milestones.map((m) => {
                const actualValue = m.kind === 'telemetry' ? resolveBinding(m.binding, arcActivity) : 0
                return evaluateMilestonePace(m, actualValue, temporal, milestoneProgress)
              })

              const overallHealth: ArcPaceStatus = calculateOverallHealth(milestoneStates)
              const healthBadge = HEALTH_BADGES[overallHealth] || HEALTH_BADGES.on_track

              return (
                <article
                  key={arc.id}
                  className="rounded-xl border border-border bg-surface/60 hover:bg-surface/90 transition-all p-5 sm:p-6 space-y-4 shadow-sm"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: accentColor,
                  }}
                >
                  {/* Top Bar: Icon, Title, Overall Health & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex items-center justify-center w-6 h-6 rounded bg-surface border border-border/80 shadow-sm"
                          style={{ color: accentColor }}
                        >
                          <ArcIcon name={iconName} className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="font-serif text-lg text-text-primary leading-tight font-medium">
                          {title}
                        </h3>
                      </div>
                      {tagline && (
                        <p className="text-xs text-text-secondary italic line-clamp-1">
                          "{tagline}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider border font-medium ${healthBadge.className}`}
                        title={`Overall Campaign Health: ${healthBadge.label}`}
                      >
                        {healthBadge.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider border shrink-0 ${
                          arc.status === 'archived'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {arc.status}
                      </span>
                    </div>
                  </div>

                  {/* Vow Excerpt */}
                  {vow?.headline && (
                    <div className="p-3 rounded-lg bg-surface border border-border-subtle space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-text-tertiary">
                        <Shield className="h-3 w-3" style={{ color: accentColor }} />
                        <span>{vow.attribution || 'Sovereign Vow'}</span>
                      </div>
                      <p className="text-xs font-serif font-medium text-text-primary">
                        {vow.headline}
                      </p>
                      {vow.body && (
                        <p className="text-[11px] font-serif italic text-text-secondary line-clamp-2">
                          "{vow.body}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Dates & Duration Summary */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-text-tertiary pt-2 border-t border-border-subtle/60 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{arc.start_date} → {arc.end_date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary font-medium">
                        {totalDays}D
                      </span>
                      {isEarlyCompletion && (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          Concluded Day {Math.max(1, Math.round((new Date(arc.completed_at!).getTime() - startMs) / 86400000) + 1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Stats Pill Bar (Overall Health, Milestones, Amendments, Concluded) */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-text-tertiary pt-1 gap-2">
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-text-tertiary" />
                      {milestones.length} Milestones
                    </span>

                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-text-tertiary" />
                      <span>Health: <strong className={healthBadge.className.split(' ')[1]}>{healthBadge.label}</strong></span>
                    </span>

                    {amendmentsCount > 0 && (
                      <span>{amendmentsCount} Audited Amendments</span>
                    )}

                    {arc.completed_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Concluded {arc.completed_at.slice(0, 10)}
                      </span>
                    )}
                  </div>

                  {/* Structured Retrospective Archive Section */}
                  {arc.retrospective && (
                    <div className="pt-2 border-t border-border-subtle/60 space-y-2">
                      <button
                        type="button"
                        onClick={() => setExpandedRetros((prev) => ({ ...prev, [arc.id]: !prev[arc.id] }))}
                        className="flex items-center justify-between w-full text-[11px] font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors py-1"
                      >
                        <span className="flex items-center gap-1.5 text-purple-400">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Completion Retrospective</span>
                        </span>
                        {expandedRetros[arc.id] ? (
                          <ChevronUp className="h-3.5 w-3.5 text-text-tertiary" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
                        )}
                      </button>

                      {expandedRetros[arc.id] && (
                        <div className="p-3.5 rounded-lg bg-surface/90 border border-border space-y-3 font-sans text-xs animate-fade-in">
                          {Boolean(arc.retrospective.whatWentWell) && (
                            <div className="space-y-0.5">
                              <p className="font-serif font-medium text-emerald-400 text-[11px]">01 · What went well</p>
                              <p className="text-text-secondary leading-relaxed">{String(arc.retrospective.whatWentWell)}</p>
                            </div>
                          )}
                          {Boolean(arc.retrospective.whatDidnt) && (
                            <div className="space-y-0.5">
                              <p className="font-serif font-medium text-rose-400 text-[11px]">02 · What didn&apos;t</p>
                              <p className="text-text-secondary leading-relaxed">{String(arc.retrospective.whatDidnt)}</p>
                            </div>
                          )}
                          {Boolean(arc.retrospective.whatChanged) && (
                            <div className="space-y-0.5">
                              <p className="font-serif font-medium text-amber-400 text-[11px]">03 · What changed</p>
                              <p className="text-text-secondary leading-relaxed">{String(arc.retrospective.whatChanged)}</p>
                            </div>
                          )}
                          {Boolean(arc.retrospective.whatLearned) && (
                            <div className="space-y-0.5">
                              <p className="font-serif font-medium text-cyan-400 text-[11px]">04 · What did you learn</p>
                              <p className="text-text-secondary leading-relaxed">{String(arc.retrospective.whatLearned)}</p>
                            </div>
                          )}
                          {Boolean(arc.retrospective.whatCarriesForward) && (
                            <div className="space-y-0.5">
                              <p className="font-serif font-medium text-purple-400 text-[11px]">05 · What carries forward</p>
                              <p className="text-text-secondary leading-relaxed">{String(arc.retrospective.whatCarriesForward)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
