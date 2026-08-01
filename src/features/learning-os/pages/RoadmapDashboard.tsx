import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Clock, CalendarDays, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase'
import { useRoadmaps, useRecentSessionLogs, useUpdateRoadmapStatus, useRoadmapProgress } from '../api/useLearningOS'
import type { RoadmapStatus } from '../types/types'
import { CreateRoadmapModal } from '../components/CreateRoadmapModal'

export function RoadmapDashboard() {
  const { data: roadmaps = [], isLoading: roadmapsLoading } = useRoadmaps()
  const { data: recentLogs = [], isLoading: logsLoading } = useRecentSessionLogs()
  const { data: progressList = [] } = useRoadmapProgress()
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateRoadmapStatus()

  const { data: totalMinutes = 0 } = useQuery({
    queryKey: ['learning-os', 'session-logs', 'total-minutes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_session_logs')
        .select('duration_minutes')
        .is('deleted_at', null)

      if (error) return 0
      return (data ?? []).reduce((acc, log) => acc + (log.duration_minutes || 0), 0)
    },
  })
  
  const [filter, setFilter] = useState<RoadmapStatus | 'all'>('active')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const progressMap = new Map(progressList.map((p) => [p.roadmap_id, p.pct_complete]))

  const filteredRoadmaps = filter === 'all' 
    ? roadmaps 
    : roadmaps.filter((r) => r.status === filter)

  const activeCount = roadmaps.filter((r) => r.status === 'active').length
  const completedCount = roadmaps.filter((r) => r.status === 'completed').length

  const handleStatusChange = (id: string, status: RoadmapStatus) => {
    updateStatus({ id, status })
  }

  return (
    <div className="space-y-6 pb-28 sm:pb-24">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900/40">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Active Roadmaps</p>
              <p className="text-xl font-bold text-slate-100">{activeCount}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/40">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Completed</p>
              <p className="text-xl font-bold text-slate-100">{completedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/40">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Hours</p>
              <p className="text-xl font-bold text-slate-100">
                {Math.round(totalMinutes / 60)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Roadmaps */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Your Roadmaps</h2>
            <div className="flex items-center gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value as RoadmapStatus | 'all')}
                className="rounded-lg border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="all">All</option>
              </select>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
              >
                <Plus size={16} />
                New Roadmap
              </button>
            </div>
          </div>

          {roadmapsLoading ? (
            <p className="text-sm text-slate-400">Loading roadmaps...</p>
          ) : filteredRoadmaps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 p-12 text-center">
              <BookOpen className="mb-4 h-10 w-10 text-slate-600" />
              <p className="text-base font-medium text-slate-300">No roadmaps found</p>
              <p className="mt-1 text-sm text-slate-500">Create a learning roadmap to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRoadmaps.map((roadmap) => {
                const progressPct = roadmap.status === 'completed' ? 100 : (progressMap.get(roadmap.id) ?? 0)

                return (
                  <div key={roadmap.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/20">
                    {/* Color accent line */}
                    <div 
                      className="absolute inset-y-0 left-0 w-1" 
                      style={{ backgroundColor: roadmap.color || '#8b5cf6' }} 
                    />
                    
                    <div className="p-5 pl-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link to={`/learning-os/roadmap/${roadmap.id}`} className="inline-block">
                            <h3 className="text-lg font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                              {roadmap.title}
                            </h3>
                          </Link>
                          {roadmap.description && (
                            <p className="mt-1 text-sm text-slate-400 line-clamp-2 max-w-lg">
                              {roadmap.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <select
                            value={roadmap.status}
                            onChange={(e) => handleStatusChange(roadmap.id, e.target.value as RoadmapStatus)}
                            disabled={isUpdating}
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium focus:outline-none disabled:opacity-50 ${
                              roadmap.status === 'active' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                              roadmap.status === 'completed' ? 'bg-purple-950 border-purple-800 text-purple-400' :
                              roadmap.status === 'paused' ? 'bg-yellow-950 border-yellow-800 text-yellow-400' :
                              'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                            <option value="abandoned">Abandoned</option>
                          </select>
                          <Link 
                            to={`/learning-os/roadmap/${roadmap.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-300 transition-colors hover:bg-slate-700"
                          >
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={14} />
                          <span>Started {roadmap.start_date ? new Date(roadmap.start_date).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        
                        {/* Dynamic progress bar */}
                        <div className="flex flex-1 items-center gap-3 pl-4">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ 
                                width: `${progressPct}%`,
                                backgroundColor: roadmap.color || '#8b5cf6' 
                              }} 
                            />
                          </div>
                          <span className="text-slate-400">{progressPct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Recent Sessions</h2>
          
          <div className="rounded-xl border border-border bg-surface p-4">
            {logsLoading ? (
              <p className="text-sm text-slate-400">Loading activity...</p>
            ) : recentLogs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent learning sessions.</p>
            ) : (
              <div className="space-y-4">
                {recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex gap-3 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] border border-border">
                      <BookOpen size={14} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">
                        {log.duration_minutes ? `${log.duration_minutes}m session` : 'Logged session'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.logged_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                      </p>
                      {log.notes && (
                        <p className="mt-1 text-xs text-slate-400 bg-[#111111] p-2 rounded-md italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-[#111111] py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
              <ExternalLink size={14} />
              View Full History
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CreateRoadmapModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
