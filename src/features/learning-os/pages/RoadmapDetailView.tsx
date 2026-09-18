import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Play,
  Plus,
  Check,
  Milestone,
  Feather,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  useRoadmapDetail,
  useSkipStage,
  useSkipSession,
  useUpdateRoadmapStatus,
  useRoadmapMilestones,
  useToggleMilestone,
  useCreateMilestone,
  useReflections,
  useCreateReflection,
} from '../api/useLearningOS'
import { useStartTimer, useActiveTimer } from '../../time-os'
import { CreateStageModal } from '../components/CreateStageModal'
import { CreateSessionModal } from '../components/CreateSessionModal'
import { LogSessionModal } from '../components/LogSessionModal'
import type { RoadmapStatus } from '../types/types'

export function RoadmapDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useRoadmapDetail(id)
  const { mutate: skipStage } = useSkipStage()
  const { mutate: skipSession } = useSkipSession()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateRoadmapStatus()
  const { data: milestones = [] } = useRoadmapMilestones(id)
  const { mutate: toggleMilestone } = useToggleMilestone()
  const { mutate: createMilestone, isPending: isCreatingMilestone } = useCreateMilestone()
  const { data: reflections = [] } = useReflections(id)
  const { mutate: createReflection, isPending: isCreatingReflection } = useCreateReflection()

  const { data: activeTimer } = useActiveTimer()
  const { mutate: startTimer, isPending: isStartingTimer } = useStartTimer()

  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({})
  const [isCreateStageModalOpen, setIsCreateStageModalOpen] = useState(false)
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
  const [selectedStageIdForSession, setSelectedStageIdForSession] = useState<string | null>(null)

  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false)
  const [selectedSessionForLog, setSelectedSessionForLog] = useState<{ id?: string; title?: string } | undefined>(undefined)

  // Quick milestone input
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  // Quick reflection input
  const [newReflectionContent, setNewReflectionContent] = useState('')

  if (isLoading) {
    return (
      <div className="py-24 text-center font-mono text-xs uppercase tracking-wider text-text-tertiary">
        Retrieving folio blueprints from library archives...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="font-serif text-lg text-threat-critical">Failed to load roadmap trajectory.</p>
        <Link
          to="/learning-os"
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Return to Study Shelf
        </Link>
      </div>
    )
  }

  const { roadmap, stages, sessions, stageProgress } = data

  const toggleStageExpand = (stageId: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: prev[stageId] === undefined ? false : !prev[stageId],
    }))
  }

  // Default is expanded
  const isStageExpanded = (stageId: string) => expandedStages[stageId] !== false

  const totalSessions = sessions.length
  const completedSessions = sessions.filter(
    (s) => s.is_skipped || stageProgress.some((p) => p.stage_id === s.stage_id && p.completed_sessions > 0)
  ).length
  const overallPct =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  const isCurrentRoadmapTimerActive =
    activeTimer &&
    activeTimer.bucket === 'Learning' &&
    activeTimer.description?.includes(roadmap.title)

  const handleStartFocusTimer = () => {
    if (isStartingTimer || isCurrentRoadmapTimerActive) return
    startTimer({
      bucket: 'Learning',
      description: `${roadmap.title}: Study Focus`,
    })
  }

  const handleSkipStage = (stageId: string) => {
    if (window.confirm('Mark this stage and all its modules as skipped?')) {
      skipStage({ stageId, roadmapId: roadmap.id })
    }
  }

  const handleSkipSession = (sessionId: string) => {
    skipSession({ sessionId, roadmapId: roadmap.id })
  }

  const handleOpenCreateSession = (stageId: string) => {
    setSelectedStageIdForSession(stageId)
    setIsCreateSessionModalOpen(true)
  }

  const handleCloseCreateSession = () => {
    setIsCreateSessionModalOpen(false)
    setSelectedStageIdForSession(null)
  }

  const handleOpenLogSession = (sessionId?: string, sessionTitle?: string) => {
    setSelectedSessionForLog(sessionId ? { id: sessionId, title: sessionTitle } : undefined)
    setIsLogSessionModalOpen(true)
  }

  const handleCloseLogSession = () => {
    setIsLogSessionModalOpen(false)
    setSelectedSessionForLog(undefined)
  }

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestoneTitle.trim() || isCreatingMilestone) return
    createMilestone({
      roadmapId: roadmap.id,
      title: newMilestoneTitle.trim(),
    })
    setNewMilestoneTitle('')
  }

  const handleAddReflection = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReflectionContent.trim() || isCreatingReflection) return
    createReflection({
      roadmapId: roadmap.id,
      content: newReflectionContent.trim(),
      reflectionType: 'general',
    })
    setNewReflectionContent('')
  }

  return (
    <div className="space-y-16 font-sans text-text-primary">
      {/* 1. Folio Monograph Header */}
      <section aria-label="Folio Header" className="space-y-6">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <Link
            to="/learning-os"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Study Shelf
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono uppercase tracking-widest text-text-tertiary">
              Folio Status:
            </span>
            <select
              value={roadmap.status}
              disabled={isUpdatingStatus}
              onChange={(e) =>
                updateStatus({
                  id: roadmap.id,
                  status: e.target.value as RoadmapStatus,
                })
              }
              aria-label="Update roadmap status"
              className="h-7 rounded border border-border-subtle bg-surface px-2 text-xs font-mono uppercase tracking-wider text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-border-subtle">
          <div className="space-y-3 max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-accent-primary">
              Curriculum Folio Inscription
            </span>
            <h1 className="text-3xl sm:text-4xl font-light font-serif text-text-primary leading-tight text-balance">
              {roadmap.title}
            </h1>
            {roadmap.description && (
              <p className="text-sm sm:text-base font-serif text-text-secondary leading-relaxed max-w-2xl">
                {roadmap.description}
              </p>
            )}
          </div>

          {/* Folio Action Launchers */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleStartFocusTimer}
              disabled={isStartingTimer || !!isCurrentRoadmapTimerActive}
              className={`inline-flex items-center gap-2 rounded px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all ${
                isCurrentRoadmapTimerActive
                  ? 'border border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'bg-accent-primary text-background font-medium hover:opacity-90'
              }`}
            >
              <Play size={12} className="fill-current" />
              {isCurrentRoadmapTimerActive
                ? 'Focus Running'
                : isStartingTimer
                ? 'Initiating...'
                : 'Initiate Focus'}
            </button>

            <button
              type="button"
              onClick={() => handleOpenLogSession()}
              className="inline-flex items-center gap-2 rounded border border-border-subtle bg-surface px-4 py-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <Clock size={14} />
              Inscribe Session
            </button>

            <button
              type="button"
              onClick={() => setIsCreateStageModalOpen(true)}
              className="inline-flex items-center gap-2 rounded border border-border-subtle bg-transparent px-4 py-2 text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
            >
              <Plus size={14} />
              Add Station
            </button>
          </div>
        </div>

        {/* Traversal Datum Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4 border-b border-border-subtle">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
              Curriculum Traversal
            </span>
            <span className="text-2xl font-light font-mono tabular-nums text-accent-primary">
              {overallPct}
              <span className="text-xs font-mono text-text-tertiary ml-0.5">%</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
              Stations Formulated
            </span>
            <span className="text-2xl font-light font-mono tabular-nums text-text-primary">
              {stages.length}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
              Modules Defined
            </span>
            <span className="text-2xl font-light font-mono tabular-nums text-text-primary">
              {totalSessions}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-text-tertiary block">
              Inception Date
            </span>
            <span className="text-sm font-mono text-text-secondary pt-1.5 block">
              {roadmap.start_date
                ? new Date(roadmap.start_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Continuous'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. CURRICULUM TRAVERSAL STATIONS (Swiss Ledger) */}
      <section aria-label="Curriculum Stages" className="space-y-6">
        <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Curriculum Stations & Traversal Map
          </h2>
          <span className="text-xs font-mono text-text-tertiary">
            {stages.length} Structured Stations
          </span>
        </div>

        {stages.length === 0 ? (
          <div className="border border-dashed border-border-subtle bg-surface/30 p-12 text-center space-y-4">
            <p className="text-base font-serif text-text-primary">
              No stations formulated for this folio.
            </p>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Divide your curriculum into sequential stations of mastery, foundational readings, and verified checkpoints.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateStageModalOpen(true)}
              className="inline-flex items-center gap-2 rounded bg-accent-primary px-4 py-2 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              Add First Station
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {stages.map((stage) => {
              const stageSessions = sessions.filter((s) => s.stage_id === stage.id)
              const isExpanded = isStageExpanded(stage.id)
              const stageProg = stageProgress.find((p) => p.stage_id === stage.id)
              const completedCount = stageProg?.completed_sessions ?? 0

              return (
                <div
                  key={stage.id}
                  className="border border-border-subtle bg-surface transition-colors hover:border-border"
                >
                  {/* Station Header Bar */}
                  <div
                    onClick={() => toggleStageExpand(stage.id)}
                    className="flex cursor-pointer items-start justify-between p-6 gap-4 hover:bg-elevated/40 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tabular-nums text-accent-primary uppercase tracking-widest">
                          Station {String(stage.order_index).padStart(2, '0')}
                        </span>
                        <span className="text-text-tertiary">•</span>
                        <h3 className={`text-base font-medium ${stage.is_skipped ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                          {stage.title}
                        </h3>
                        {stage.is_skipped && (
                          <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[10px] font-mono uppercase text-text-tertiary">
                            Skipped
                          </span>
                        )}
                      </div>

                      {stage.subtitle && (
                        <p className="text-xs font-mono text-text-secondary">
                          {stage.subtitle}
                        </p>
                      )}

                      {/* Scholarly Marginalia Note */}
                      {stage.note && (
                        <blockquote className="font-serif text-sm italic text-text-secondary leading-relaxed pt-1 max-w-3xl">
                          "{stage.note}"
                        </blockquote>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-mono tabular-nums text-text-tertiary">
                        {completedCount} / {stageSessions.length} Modules
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSkipStage(stage.id)
                        }}
                        className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                        title="Skip Station"
                        aria-label="Skip Station"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {isExpanded ? (
                        <ChevronUp size={16} className="text-text-tertiary" />
                      ) : (
                        <ChevronDown size={16} className="text-text-tertiary" />
                      )}
                    </div>
                  </div>

                  {/* Modules Checkpoints List */}
                  {isExpanded && (
                    <div className="border-t border-border-subtle bg-background/50 p-6 space-y-4">
                      {stageSessions.length === 0 ? (
                        <p className="text-xs font-mono text-text-tertiary py-2">
                          No discrete modules established in this station.
                        </p>
                      ) : (
                        <div className="divide-y divide-border-subtle border border-border-subtle bg-surface">
                          {stageSessions.map((session, sIdx) => (
                            <div
                              key={session.id}
                              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-elevated/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xs font-mono tabular-nums text-text-tertiary w-6 shrink-0 mt-0.5">
                                  {String(session.order_index || sIdx + 1).padStart(2, '0')}
                                </span>
                                <div>
                                  <span className={`text-sm font-medium ${session.is_skipped ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                                    {session.title}
                                  </span>
                                  {session.description && (
                                    <p className="text-xs font-serif text-text-secondary mt-0.5 line-clamp-1">
                                      {session.description}
                                    </p>
                                  )}
                                  {session.tags && session.tags.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      {session.tags.map((t) => (
                                        <span
                                          key={t}
                                          className="text-[10px] font-mono text-text-tertiary border border-border-subtle px-1.5 py-0.2 rounded"
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
                                    <Clock size={11} />
                                    {session.estimated_minutes}m
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleSkipSession(session.id)}
                                  className="text-xs font-mono text-text-tertiary hover:text-text-secondary px-2 py-1 transition-colors"
                                >
                                  {session.is_skipped ? 'Unskip' : 'Skip'}
                                </button>

                                {!session.is_skipped && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLogSession(session.id, session.title)}
                                    className="rounded border border-border-subtle bg-elevated px-3 py-1 text-xs font-mono uppercase tracking-wider text-text-primary hover:bg-accent-primary hover:text-background transition-colors"
                                  >
                                    Log Session
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenCreateSession(stage.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-accent-primary hover:underline pt-2"
                      >
                        <Plus size={12} />
                        Add Module to Station
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 3. MILESTONES & WAYPOINTS */}
      <section aria-label="Milestones" className="space-y-6 border-t border-border-subtle pt-12">
        <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Milestone size={14} className="text-accent-primary" />
            Milestone Stations & Proof Thresholds
          </h2>
          <span className="text-xs font-mono tabular-nums text-text-tertiary">
            {milestones.filter((m) => m.achieved).length} / {milestones.length} Achieved
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {milestones.map((milestone) => (
            <div
              key={milestone.id}
              onClick={() =>
                toggleMilestone({
                  id: milestone.id,
                  roadmapId: roadmap.id,
                  achieved: !milestone.achieved,
                })
              }
              className={`flex items-start gap-3 p-4 border border-border-subtle cursor-pointer transition-colors ${
                milestone.achieved ? 'bg-surface/80 border-border' : 'bg-surface/30 hover:bg-surface'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full flex items-center justify-center border mt-0.5 shrink-0 ${
                  milestone.achieved
                    ? 'border-threat-healthy bg-threat-healthy/20 text-threat-healthy'
                    : 'border-border-subtle text-text-tertiary'
                }`}
              >
                {milestone.achieved && <Check size={12} />}
              </span>
              <div className="space-y-0.5">
                <span className={`text-sm font-medium ${milestone.achieved ? 'text-text-primary' : 'text-text-secondary'}`}>
                  {milestone.title}
                </span>
                {milestone.achieved_at && (
                  <span className="text-[10px] font-mono text-text-tertiary block">
                    Achieved {new Date(milestone.achieved_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Milestone Form */}
        <form onSubmit={handleAddMilestone} className="flex items-center gap-3 pt-2">
          <input
            type="text"
            value={newMilestoneTitle}
            onChange={(e) => setNewMilestoneTitle(e.target.value)}
            placeholder="Inscribe a milestone threshold (e.g. Implement Raft leader election)..."
            className="flex-1 rounded border border-border-subtle bg-surface px-3 py-2 text-xs font-sans text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary"
          />
          <button
            type="submit"
            disabled={isCreatingMilestone || !newMilestoneTitle.trim()}
            className="rounded bg-accent-primary px-4 py-2 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isCreatingMilestone ? 'Adding...' : 'Add Waypoint'}
          </button>
        </form>
      </section>

      {/* 4. SCHOLARLY MARGINALIA FOR THIS FOLIO */}
      <section aria-label="Folio Reflections" className="space-y-6 border-t border-border-subtle pt-12">
        <div className="flex items-baseline justify-between border-b border-border-subtle pb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Feather size={14} className="text-accent-primary" />
            Folio Marginalia & Synthesis Logs
          </h2>
          <span className="text-xs font-mono text-text-tertiary">
            {reflections.length} Inscriptions
          </span>
        </div>

        {reflections.length > 0 && (
          <div className="space-y-6 divide-y divide-border-subtle">
            {reflections.map((ref) => (
              <div key={ref.id} className="pt-6 first:pt-0 flex flex-col sm:flex-row gap-4">
                <span className="w-28 shrink-0 text-xs font-mono tabular-nums text-text-tertiary uppercase">
                  {new Date(ref.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <blockquote className="flex-1 font-serif text-base italic text-text-primary leading-relaxed">
                  "{ref.content}"
                </blockquote>
              </div>
            ))}
          </div>
        )}

        {/* Add Reflection Form */}
        <form onSubmit={handleAddReflection} className="space-y-3 pt-2">
          <textarea
            rows={2}
            value={newReflectionContent}
            onChange={(e) => setNewReflectionContent(e.target.value)}
            placeholder="Inscribe a synthesis observation, philosophical note, or theorem realization for this folio..."
            className="w-full rounded border border-border-subtle bg-surface p-3 font-serif text-sm text-text-primary placeholder-text-tertiary/60 focus:outline-none focus:ring-1 focus:ring-accent-primary resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingReflection || !newReflectionContent.trim()}
              className="rounded bg-accent-primary px-4 py-1.5 text-xs font-mono uppercase tracking-wider text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isCreatingReflection ? 'Inscribing...' : 'Inscribe Marginalia'}
            </button>
          </div>
        </form>
      </section>

      {/* Modals */}
      <CreateStageModal
        isOpen={isCreateStageModalOpen}
        onClose={() => setIsCreateStageModalOpen(false)}
        onSuccess={() => void refetch()}
        roadmapId={roadmap.id}
        orderIndex={stages.length + 1}
      />

      {selectedStageIdForSession && (
        <CreateSessionModal
          isOpen={isCreateSessionModalOpen}
          onClose={handleCloseCreateSession}
          onSuccess={() => void refetch()}
          roadmapId={roadmap.id}
          stageId={selectedStageIdForSession}
          orderIndex={
            (sessions.filter((s) => s.stage_id === selectedStageIdForSession).length || 0) + 1
          }
        />
      )}

      <LogSessionModal
        isOpen={isLogSessionModalOpen}
        onClose={handleCloseLogSession}
        onSuccess={() => void refetch()}
        roadmapId={roadmap.id}
        sessionId={selectedSessionForLog?.id}
        sessionTitle={selectedSessionForLog?.title}
      />
    </div>
  )
}
