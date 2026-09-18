import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Check, Clock, ChevronRight, Milestone, Sparkles } from 'lucide-react'
import { useRoadmapDetail, useRoadmapMilestones } from '../api/useLearningOS'
import type { LearningRoadmap } from '../types/types'

interface SpatialKnowledgeMapProps {
 roadmaps: LearningRoadmap[]
 initialRoadmapId?: string
 onOpenLogModal?: (roadmapId: string, sessionId?: string, sessionTitle?: string) => void
}

export function SpatialKnowledgeMap({
 roadmaps,
 initialRoadmapId,
 onOpenLogModal,
}: SpatialKnowledgeMapProps) {
 const activeRoadmaps = useMemo(
 () => roadmaps.filter((r) => r.status === 'active' || r.status === 'completed'),
 [roadmaps]
 )

 const [activeRoadmapId, setActiveRoadmapId] = useState<string>(() => {
 if (initialRoadmapId && activeRoadmaps.some((r) => r.id === initialRoadmapId)) {
 return initialRoadmapId
 }
 return activeRoadmaps[0]?.id ?? ''
 })

 // Synchronize if activeRoadmaps change
 const currentRoadmapId = activeRoadmapId || activeRoadmaps[0]?.id

 const { data: detailData, isLoading: detailLoading } = useRoadmapDetail(currentRoadmapId)
 const { data: milestones = [] } = useRoadmapMilestones(currentRoadmapId)

 if (activeRoadmaps.length === 0) {
 return null
 }

 const currentRoadmap = activeRoadmaps.find((r) => r.id === currentRoadmapId)

 return (
 <section aria-label="Spatial Atlas Knowledge Trajectory" className="space-y-8 font-sans">
 {/* Section Header */}
 <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
 <div>
 <div className="flex items-center gap-2">
 <Milestone size={16} className="text-accent-primary" />
 <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
 Spatial Knowledge Atlas
 </h2>
 </div>
 <p className="text-xs font-serif italic text-text-tertiary mt-0.5">
 Coordinate trajectories, station synthesis, and milestone checkpoints.
 </p>
 </div>

 {/* Trajectory Switcher */}
 {activeRoadmaps.length > 1 && (
 <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
 {activeRoadmaps.map((r, i) => (
 <button
 key={r.id}
 type="button"
 onClick={() => setActiveRoadmapId(r.id)}
 className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap rounded ${
 r.id === currentRoadmapId
 ? 'bg-elevated text-text-primary border border-border'
 : 'text-text-tertiary hover:text-text-secondary hover:bg-surface'
 }`}
 >
 Track {String(i + 1).padStart(2, '0')}: {r.title.slice(0, 20)}
 {r.title.length > 20 ? '…' : ''}
 </button>
 ))}
 </div>
 )}
 </div>

 {detailLoading ? (
 <div className="py-12 text-center text-xs font-mono text-text-tertiary">
 Calculating spatial trajectory coordinates...
 </div>
 ) : !detailData || detailData.stages.length === 0 ? (
 <div className="border border-border-subtle bg-surface/30 p-8 text-center">
 <p className="text-sm font-serif text-text-secondary">
 This trajectory has not yet been divided into stations.
 </p>
 {currentRoadmap && (
 <Link
 to={`/learning-os/roadmap/${currentRoadmap.id}`}
 className="mt-3 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent-primary hover:underline"
 >
 Establish Stages & Modules
 </Link>
 )}
 </div>
 ) : (
 /* Spatial Trajectory Map (Non-generic layout) */
 <div className="space-y-12">
 {/* Active Trajectory Context Bar */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-l-2 border-accent-primary pl-4 py-1">
 <div>
 <h3 className="text-xl font-medium text-text-primary">
 {detailData.roadmap.title}
 </h3>
 {detailData.roadmap.description && (
 <p className="text-xs font-serif text-text-secondary mt-0.5 max-w-2xl">
 {detailData.roadmap.description}
 </p>
 )}
 </div>
 <Link
 to={`/learning-os/roadmap/${detailData.roadmap.id}`}
 className="text-xs font-mono uppercase tracking-wider text-accent-primary hover:underline inline-flex items-center gap-1 shrink-0"
 >
 Inspect Folio Blueprint
 <ChevronRight size={14} />
 </Link>
 </div>

 {/* Spatial Station Nodes */}
 <div className="grid grid-cols-1 gap-8">
 {detailData.stages.map((stage, sIdx) => {
 const stageSessions = detailData.sessions.filter((s) => s.stage_id === stage.id)
 const stageProgress = detailData.stageProgress.find((p) => p.stage_id === stage.id)
 const completedCount = stageProgress?.completed_sessions ?? 0
 const totalCount = stageSessions.length
 const isStageDone = totalCount > 0 && completedCount === totalCount

 return (
 <div
 key={stage.id}
 className="relative border border-border-subtle bg-surface/40 p-6 transition-colors hover:border-border"
 >
 {/* Station Coordinate Bar */}
 <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-border-subtle">
 <div className="flex items-center gap-3">
 <span className="text-xs font-mono tabular-nums uppercase tracking-widest text-accent-primary">
 Station {String(stage.order_index || sIdx + 1).padStart(2, '0')}
 </span>
 <span className="text-text-tertiary">•</span>
 <h4 className={`text-base font-medium ${stage.is_skipped ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
 {stage.title}
 </h4>
 </div>

 <div className="flex items-center gap-3">
 <span className="text-xs font-mono tabular-nums text-text-secondary">
 {completedCount} / {totalCount} Completed
 </span>
 {isStageDone && (
 <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-threat-healthy">
 <Check size={12} /> Mastered
 </span>
 )}
 </div>
 </div>

 {/* Scholarly Marginalia for this Station */}
 {(stage.subtitle || stage.note) && (
 <div className="mt-3 pl-3 border-l border-border-subtle">
 {stage.subtitle && (
 <p className="text-xs font-mono text-text-secondary uppercase tracking-wider">
 Scope: {stage.subtitle}
 </p>
 )}
 {stage.note && (
 <blockquote className="mt-1 font-serif text-sm italic text-text-secondary leading-relaxed">
 "{stage.note}"
 </blockquote>
 )}
 </div>
 )}

 {/* Checkpoints Flow Grid (Swiss Ledger rows) */}
 {stageSessions.length > 0 && (
 <div className="mt-6 divide-y divide-border-subtle border-t border-border-subtle">
 {stageSessions.map((session, mIdx) => (
 <div
 key={session.id}
 className="group py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-elevated/40 px-2"
 >
 <div className="flex items-start gap-3">
 <span className="text-xs font-mono tabular-nums text-text-tertiary w-6 shrink-0 mt-0.5">
 {String(mIdx + 1).padStart(2, '0')}
 </span>
 <div>
 <span className={`text-sm ${session.is_skipped ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
 {session.title}
 </span>
 {session.description && (
 <p className="text-xs font-serif text-text-tertiary mt-0.5 line-clamp-1">
 {session.description}
 </p>
 )}
 {session.tags && session.tags.length > 0 && (
 <div className="flex items-center gap-1.5 mt-1.5">
 {session.tags.map((t) => (
 <span
 key={t}
 className="text-[10px] font-mono text-text-tertiary border border-border-subtle px-1.5 py-0.5 rounded"
 >
 #{t}
 </span>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
 {session.estimated_minutes && (
 <span className="text-xs font-mono tabular-nums text-text-tertiary flex items-center gap-1">
 <Clock size={12} />
 {session.estimated_minutes}m
 </span>
 )}

 {onOpenLogModal && !session.is_skipped && (
 <button
 type="button"
 onClick={() =>
 onOpenLogModal(
 detailData.roadmap.id,
 session.id,
 session.title
 )
 }
 className="opacity-80 group-hover:opacity-100 text-xs font-mono uppercase tracking-wider text-accent-primary hover:underline transition-opacity"
 >
 Log Logbook
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )
 })}
 </div>

 {/* Milestone Waypoints if defined */}
 {milestones.length > 0 && (
 <div className="border-t border-border-subtle pt-6">
 <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary mb-4 flex items-center gap-2">
 <Sparkles size={14} className="text-accent-primary" />
 Trajectory Milestone Waypoints
 </h4>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 {milestones.map((m) => (
 <div
 key={m.id}
 className="flex items-center gap-3 border border-border-subtle bg-surface/30 p-3"
 >
 <span
 className={`h-4 w-4 rounded-full flex items-center justify-center border ${
 m.achieved
 ? 'border-threat-healthy bg-threat-healthy/20 text-threat-healthy'
 : 'border-border-subtle text-text-tertiary'
 }`}
 >
 {m.achieved && <Check size={10} />}
 </span>
 <span className={`text-xs ${m.achieved ? 'text-text-primary' : 'text-text-secondary'}`}>
 {m.title}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </section>
 )
}
