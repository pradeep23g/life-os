import { Link } from 'react-router-dom'
import { ArrowUpRight, Compass, Plus, Clock, BookOpen } from 'lucide-react'
import type { LearningRoadmap, RoadmapProgress } from '../types/types'

interface StudyShelfProps {
 roadmaps: LearningRoadmap[]
 progressList: RoadmapProgress[]
 onOpenCreateModal: () => void
 onOpenLogModal: (roadmapId: string) => void
}

export function StudyShelf({
 roadmaps,
 progressList,
 onOpenCreateModal,
 onOpenLogModal,
}: StudyShelfProps) {
 const progressMap = new Map(progressList.map((p) => [p.roadmap_id, p]))
 const activeRoadmaps = roadmaps.filter((r) => r.status === 'active')
 const completedRoadmaps = roadmaps.filter((r) => r.status === 'completed')

 return (
 <section aria-label="Architectural Study Shelf" className="space-y-8 font-sans">
 {/* Section Header */}
 <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-border-subtle pb-4">
 <div>
 <div className="flex items-center gap-2">
 <BookOpen size={16} className="text-accent-primary" />
 <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
 Active Folios & Intellectual Trajectories
 </h2>
 </div>
 <p className="text-xs font-serif italic text-text-tertiary mt-0.5">
 Curated intellectual volumes under continuous traversal.
 </p>
 </div>

 <div className="flex items-center gap-4">
 <span className="text-xs font-mono tabular-nums text-text-tertiary">
 {activeRoadmaps.length} active • {completedRoadmaps.length} completed
 </span>
 <button
 type="button"
 onClick={onOpenCreateModal}
 className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent-primary hover:text-accent-primary/80 transition-colors"
 >
 <Plus size={12} />
 Chart New Trajectory
 </button>
 </div>
 </div>

 {activeRoadmaps.length === 0 ? (
 <div className="py-16 text-center border border-dashed border-border-subtle bg-surface/30 px-6">
 <Compass size={28} className="mx-auto text-text-tertiary mb-3 opacity-60" />
 <h3 className="text-base font-serif text-text-primary">
 The study shelf is quiet.
 </h3>
 <p className="text-xs text-text-secondary max-w-md mx-auto mt-1 mb-6 leading-relaxed">
 No active knowledge trajectories are currently under exploration. Inscribe a new custom curriculum or discover curated cartography tracks.
 </p>
 <div className="flex flex-wrap items-center justify-center gap-4">
 <button
 type="button"
 onClick={onOpenCreateModal}
 className="inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity"
 >
 <Plus size={14} />
 Chart Custom Trajectory
 </button>
 <Link
 to="/learning-os/explore"
 className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
 >
 Explore Curated Tracks
 </Link>
 </div>
 </div>
 ) : (
 /* Architectural Folio Shelf Grid */
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {activeRoadmaps.map((roadmap, index) => {
 const prog = progressMap.get(roadmap.id)
 const pct = prog?.pct_complete ?? 0
 const completedSessions = prog?.completed_sessions ?? 0
 const totalSessions = prog?.total_sessions ?? 0

 return (
 <article
 key={roadmap.id}
 className="group relative flex flex-col justify-between border border-border-subtle bg-surface hover:border-border transition-all duration-200"
 >
 {/* Top Folio Header Rule */}
 <div className="p-6 space-y-4 flex-1 flex flex-col">
 <div className="flex items-center justify-between gap-2">
 <span className="text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
 Folio {String(index + 1).padStart(2, '0')}
 </span>
 <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-accent-primary">
 <span className="h-1.5 w-1.5 rounded-full bg-accent-primary animate-pulse" />
 Active
 </span>
 </div>

 {/* Title & Thesis */}
 <div className="space-y-2 flex-1">
 <Link
 to={`/learning-os/roadmap/${roadmap.id}`}
 className="group/link flex items-start justify-between gap-2"
 >
 <h3 className="text-lg font-medium text-text-primary group-hover/link:text-accent-primary transition-colors text-balance leading-snug">
 {roadmap.title}
 </h3>
 <ArrowUpRight
 size={16}
 className="shrink-0 text-text-tertiary group-hover/link:text-accent-primary transition-colors mt-0.5"
 />
 </Link>

 {roadmap.description && (
 <p className="text-xs font-serif text-text-secondary leading-relaxed line-clamp-2">
 {roadmap.description}
 </p>
 )}
 </div>

 {/* Tabular Traversal Metric & Horizon Line */}
 <div className="space-y-2 pt-4 border-t border-border-subtle">
 <div className="flex items-baseline justify-between">
 <span className="text-2xl font-light font-mono tabular-nums text-text-primary">
 {pct}
 <span className="text-xs font-mono text-text-tertiary ml-0.5">%</span>
 </span>
 <span className="text-xs font-mono tabular-nums text-text-secondary uppercase">
 {completedSessions} / {totalSessions} Modules
 </span>
 </div>

 {/* Architectural Hairline Progress Line */}
 <div className="h-0.5 w-full bg-border-subtle overflow-hidden">
 <div
 className="h-full bg-accent-primary transition-all duration-700 ease-out"
 style={{ width: `${Math.min(100, Math.max(pct, totalSessions > 0 ? 3 : 0))}%` }}
 />
 </div>
 </div>
 </div>

 {/* Bottom Operational Action Bar */}
 <div className="flex items-center justify-between border-t border-border-subtle bg-elevated/40 px-6 py-3">
 <span className="text-[11px] font-mono text-text-tertiary">
 {roadmap.start_date ? (
 `Inception ${new Date(roadmap.start_date).toLocaleDateString('en-GB', {
 month: 'short',
 year: 'numeric',
 })}`
 ) : (
 'Continuous'
 )}
 </span>

 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => onOpenLogModal(roadmap.id)}
 className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
 title="Inscribe study session for this folio"
 >
 <Clock size={12} />
 Log
 </button>
 <Link
 to={`/learning-os/roadmap/${roadmap.id}`}
 className="text-xs font-mono uppercase tracking-wider text-accent-primary hover:underline underline-offset-4"
 >
 Traverse
 </Link>
 </div>
 </div>
 </article>
 )
 })}
 </div>
 )}
 </section>
 )
}
