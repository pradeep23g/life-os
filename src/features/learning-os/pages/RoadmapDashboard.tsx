import { useState } from 'react'
import { useRoadmaps, useRoadmapProgress } from '../api/useLearningOS'
import { CreateRoadmapModal } from '../components/CreateRoadmapModal'
import { LogSessionModal } from '../components/LogSessionModal'
import { FocusStudySessionBar } from '../components/FocusStudySessionBar'
import { StudyShelf } from '../components/StudyShelf'
import { SpatialKnowledgeMap } from '../components/SpatialKnowledgeMap'
import { ScholarlyMarginalia } from '../components/ScholarlyMarginalia'

export default function RoadmapDashboard() {
  const { data: roadmaps = [] } = useRoadmaps()
  const { data: progressList = [] } = useRoadmapProgress()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [activeLogTarget, setActiveLogTarget] = useState<{
    roadmapId: string
    sessionId?: string
    sessionTitle?: string
  } | null>(null)

  const activeRoadmaps = roadmaps.filter((r) => r.status === 'active')

  // Total session completion summary
  const totalSessionsCompleted = progressList.reduce(
    (acc, p) => acc + (p.completed_sessions || 0),
    0
  )
  const totalSessionsOverall = progressList.reduce(
    (acc, p) => acc + (p.total_sessions || 0),
    0
  )
  const overallTraversalRatio =
    totalSessionsOverall > 0
      ? Math.round((totalSessionsCompleted / totalSessionsOverall) * 100)
      : 0

  const handleOpenLogModal = (roadmapId?: string, sessionId?: string, sessionTitle?: string) => {
    const targetId = roadmapId || activeRoadmaps[0]?.id || roadmaps[0]?.id
    if (!targetId) {
      setIsCreateModalOpen(true)
      return
    }
    setActiveLogTarget({
      roadmapId: targetId,
      sessionId,
      sessionTitle,
    })
    setIsLogModalOpen(true)
  }

  const handleCloseLogModal = () => {
    setIsLogModalOpen(false)
    setActiveLogTarget(null)
  }

  return (
    <div className="space-y-16 md:space-y-24 font-sans text-text-primary">
      {/* 1. STAGE: The Map Room Monograph Header (Asymmetric Swiss Composition) */}
      <section aria-label="Map Room Introduction" className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-widest text-accent-primary">
              Domain 06 • Spatial Atlas & Curated Knowledge
            </span>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-balance text-text-primary font-serif">
              The Library & Map Room
            </h1>
            <p className="text-sm md:text-base font-serif italic text-text-secondary leading-relaxed">
              "What knowledge territory am I currently traversing?"
            </p>
          </div>

          {/* Asymmetric Tabular Horizon Metrics */}
          <div className="flex items-baseline gap-8 shrink-0 self-start lg:self-auto">
            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Active Trajectories
              </span>
              <span className="text-2xl font-light font-mono tabular-nums text-text-primary">
                {activeRoadmaps.length}
                <span className="text-xs font-mono text-text-tertiary ml-1">folios</span>
              </span>
            </div>

            <div className="h-8 w-px bg-border-subtle" />

            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Overall Traversal
              </span>
              <span className="text-2xl font-light font-mono tabular-nums text-accent-primary">
                {overallTraversalRatio}
                <span className="text-xs font-mono text-text-tertiary ml-0.5">%</span>
              </span>
            </div>

            <div className="h-8 w-px bg-border-subtle" />

            <div>
              <span className="block text-[11px] font-mono uppercase tracking-wider text-text-tertiary">
                Modules Mastered
              </span>
              <span className="text-2xl font-light font-mono tabular-nums text-text-secondary">
                {totalSessionsCompleted}
                <span className="text-xs font-mono text-text-tertiary ml-1">
                  / {totalSessionsOverall}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* 2. Focus Study Session Integration Bar */}
        <FocusStudySessionBar
          roadmaps={roadmaps}
          onOpenLogModal={(rId) => handleOpenLogModal(rId)}
        />
      </section>

      {/* 3. THE ARCHITECTURAL STUDY SHELF */}
      <StudyShelf
        roadmaps={roadmaps}
        progressList={progressList}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenLogModal={(rId) => handleOpenLogModal(rId)}
      />

      {/* 4. THE SPATIAL KNOWLEDGE MAP (Branching trajectories replacing border-l) */}
      {activeRoadmaps.length > 0 && (
        <SpatialKnowledgeMap
          roadmaps={roadmaps}
          onOpenLogModal={(rId, sId, sTitle) => handleOpenLogModal(rId, sId, sTitle)}
        />
      )}

      {/* 5. SCHOLARLY MARGINALIA & FIELD NOTES (Chronicle Primitive) */}
      <ScholarlyMarginalia roadmaps={roadmaps} />

      {/* Modals */}
      <CreateRoadmapModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {activeLogTarget && (
        <LogSessionModal
          isOpen={isLogModalOpen}
          onClose={handleCloseLogModal}
          roadmapId={activeLogTarget.roadmapId}
          sessionId={activeLogTarget.sessionId}
          sessionTitle={activeLogTarget.sessionTitle}
        />
      )}
    </div>
  )
}
