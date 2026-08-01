import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PlayCircle, Plus, CheckCircle2, MoreHorizontal, Clock } from 'lucide-react'
import { useRoadmapDetail, useSkipStage, useSkipSession } from '../api/useLearningOS'
import { CreateStageModal } from '../components/CreateStageModal'
import { CreateSessionModal } from '../components/CreateSessionModal'
import { LogSessionModal } from '../components/LogSessionModal'

export function RoadmapDetailView() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error, refetch } = useRoadmapDetail(id)
  const { mutate: skipStage } = useSkipStage()
  const { mutate: skipSession } = useSkipSession()

  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [isCreateStageModalOpen, setIsCreateStageModalOpen] = useState(false)
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] = useState(false)
  const [selectedStageIdForSession, setSelectedStageIdForSession] = useState<string | null>(null)

  const [isLogSessionModalOpen, setIsLogSessionModalOpen] = useState(false)
  const [selectedSessionForLog, setSelectedSessionForLog] = useState<{ id?: string; title?: string } | undefined>(undefined)

  if (isLoading) {
    return <div className="text-slate-400 py-12 text-center">Loading roadmap details...</div>
  }

  if (error || !data) {
    return <div className="text-red-400 py-12 text-center">Failed to load roadmap.</div>
  }

  const { roadmap, stages, sessions } = data

  const handleSkipStage = (stageId: string) => {
    if (confirm('Are you sure you want to skip this stage?')) {
      skipStage({ stageId, roadmapId: roadmap.id })
    }
  }

  const handleSkipSession = (sessionId: string) => {
    if (confirm('Are you sure you want to skip this session?')) {
      skipSession({ sessionId, roadmapId: roadmap.id })
    }
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

  return (
    <div className="space-y-6 pb-28 sm:pb-24">
      {/* Header */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <Link 
          to="/learning-os" 
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Roadmaps
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{roadmap.title}</h1>
            {roadmap.description && (
              <p className="mt-2 text-slate-400 max-w-2xl">{roadmap.description}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenLogSession()}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors shadow-sm"
            >
              <Clock size={14} /> Log Session
            </button>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
              roadmap.status === 'active' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
              roadmap.status === 'completed' ? 'bg-purple-950 border-purple-800 text-purple-400' :
              roadmap.status === 'paused' ? 'bg-yellow-950 border-yellow-800 text-yellow-400' :
              'bg-slate-900 border-slate-700 text-slate-400'
            }`}>
              {roadmap.status}
            </span>
          </div>
        </div>
      </div>

      {/* Curriculum View */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Curriculum</h2>
          <button 
            type="button"
            onClick={() => setIsCreateStageModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            <Plus size={16} /> Add Stage
          </button>
        </div>

        {stages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
            <p className="text-base font-medium text-slate-300">No stages yet</p>
            <p className="mt-1 text-sm text-slate-500">Break your roadmap down into logical stages.</p>
            <button
              type="button"
              onClick={() => setIsCreateStageModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} /> Add Stage
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage) => {
              const stageSessions = sessions.filter(s => s.stage_id === stage.id)
              const isExpanded = expandedStage === stage.id
              
              return (
                <div key={stage.id} className="rounded-xl border border-border bg-surface overflow-hidden">
                  {/* Stage Header */}
                  <div 
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-[#111111] transition-colors"
                    onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-slate-300">
                          {stage.order_index}
                        </span>
                        <h3 className={`text-base font-bold ${stage.is_skipped ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {stage.title}
                        </h3>
                        {stage.is_skipped && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">Skipped</span>
                        )}
                      </div>
                      {stage.subtitle && (
                        <p className="mt-1 ml-9 text-sm text-slate-400">{stage.subtitle}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">
                        {stageSessions.length} sessions
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSkipStage(stage.id) }}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                        title="Skip stage"
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Sessions List */}
                  {isExpanded && (
                    <div className="border-t border-border bg-[#0a0a0a] p-4 pl-12 space-y-3">
                      {stageSessions.length === 0 ? (
                        <p className="text-sm text-slate-500 py-2">No sessions in this stage.</p>
                      ) : (
                        stageSessions.map((session) => (
                          <div 
                            key={session.id} 
                            className="group flex items-center justify-between rounded-lg border border-border/50 bg-[#111111] p-3 hover:border-border"
                          >
                            <div className="flex items-center gap-3">
                              {session.is_skipped ? (
                                <CheckCircle2 size={18} className="text-slate-600" />
                              ) : (
                                <PlayCircle size={18} className="text-purple-400" />
                              )}
                              <div>
                                <h4 className={`text-sm font-medium ${session.is_skipped ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                  {session.title}
                                </h4>
                                {session.description && (
                                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{session.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                type="button"
                                onClick={() => handleSkipSession(session.id)}
                                className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1"
                              >
                                Skip
                              </button>
                              {!session.is_skipped && (
                                <button 
                                  type="button" 
                                  onClick={() => handleOpenLogSession(session.id, session.title)}
                                  className="rounded bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
                                >
                                  Log Session
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <button 
                        type="button"
                        onClick={() => handleOpenCreateSession(stage.id)}
                        className="mt-2 text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1.5"
                      >
                        <Plus size={14} /> Add Session
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {roadmap && (
        <>
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
        </>
      )}
    </div>
  )
}
