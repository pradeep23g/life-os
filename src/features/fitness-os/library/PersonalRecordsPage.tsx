import { useMemo, useState } from 'react'


import { useAllExerciseLogs, type ExerciseLog } from '../api/useFitness'

// Types
type PRStats = {
  exerciseId: string
  exerciseName: string
  unit: string | null
  targetMuscles: string[] | null
  maxWeight: number | null
  maxReps: number | null
  dateAchieved: string
  logs: ExerciseLog[] 
}

function MuscleDropdown({ value, options, onChange }: { value: string | null, options: string[], onChange: (v: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-44 items-center justify-between rounded-lg border border-border bg-black/50 px-3 py-2 text-sm text-slate-200 hover:bg-black/70 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      >
        <span className="truncate">{value || 'All Muscles'}</span>
        <svg className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 z-20 mt-1 max-h-60 w-44 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-xl">
          <button
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className={`block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 ${
              value === null ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-300'
            }`}
          >
            All Muscles
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setIsOpen(false)
              }}
              className={`block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 truncate ${
                value === opt ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

function SortDropdown({ value, onChange }: { value: 'recent' | 'alphabetical' | 'weight', onChange: (v: 'recent' | 'alphabetical' | 'weight') => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const options = [
    { id: 'recent', label: 'Recently Achieved' },
    { id: 'alphabetical', label: 'Alphabetical' },
    { id: 'weight', label: 'Highest Weight' },
  ] as const
  const current = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-44 items-center justify-between rounded-lg border border-border bg-black/50 px-3 py-2 text-sm text-slate-200 hover:bg-black/70 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
      >
        <span>{current?.label}</span>
        <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id)
                setIsOpen(false)
              }}
              className={`block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 ${
                value === opt.id ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}

export default function PersonalRecordsPage() {
  const { data: logs, isLoading, error } = useAllExerciseLogs()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'weight'>('recent')
  const [selectedPR, setSelectedPR] = useState<PRStats | null>(null)

  // Calculate PRs
  const prs = useMemo(() => {
    if (!logs) return []

    const prMap = new Map<string, PRStats>()

    logs.forEach((log) => {
      const existing = prMap.get(log.exercise_id)
      
      const isWeightPR = log.weight_kg != null && (existing?.maxWeight == null || log.weight_kg > existing.maxWeight)
      const isRepsPR = log.weight_kg == null && log.reps_total != null && (existing?.maxReps == null || log.reps_total > existing.maxReps)
      const isBetter = isWeightPR || (!log.weight_kg && !existing?.maxWeight && isRepsPR)

      if (!existing) {
        prMap.set(log.exercise_id, {
          exerciseId: log.exercise_id,
          exerciseName: log.exercise_name,
          unit: log.exercise_default_unit,
          targetMuscles: log.exercise_target_muscles,
          maxWeight: log.weight_kg,
          maxReps: log.reps_total,
          dateAchieved: log.created_at,
          logs: [log],
        })
      } else {
        if (isBetter) {
          if (isWeightPR) {
             existing.maxWeight = log.weight_kg
             existing.dateAchieved = log.created_at
          } else if (isRepsPR) {
             existing.maxReps = log.reps_total
             existing.dateAchieved = log.created_at
          }
        }
        existing.logs.push(log)
      }
    })

    return Array.from(prMap.values())
  }, [logs])

  // Extract unique muscles
  const uniqueMuscles = useMemo(() => {
    const muscles = new Set<string>()
    prs.forEach(pr => {
      if (pr.targetMuscles) {
        pr.targetMuscles.forEach(m => muscles.add(m))
      }
    })
    return Array.from(muscles).sort()
  }, [prs])

  // Filter and Sort
  const filteredAndSortedPRs = useMemo(() => {
    let result = prs

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(pr => 
        pr.exerciseName.toLowerCase().includes(q) || 
        (pr.targetMuscles || []).some(m => m.toLowerCase().includes(q))
      )
    }

    if (selectedMuscle) {
      result = result.filter(pr => 
        (pr.targetMuscles || []).some(m => m.toLowerCase() === selectedMuscle.toLowerCase())
      )
    }

    return result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.dateAchieved).getTime() - new Date(a.dateAchieved).getTime()
      }
      if (sortBy === 'alphabetical') {
        return a.exerciseName.localeCompare(b.exerciseName)
      }
      if (sortBy === 'weight') {
        return (b.maxWeight ?? 0) - (a.maxWeight ?? 0)
      }
      return 0
    })
  }, [prs, searchQuery, selectedMuscle, sortBy])

  // Helpers for historical context
  const getHistoricalHighs = (stats: PRStats) => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    
    let prevMonth = thisMonth - 1
    let prevYear = thisYear
    if (prevMonth < 0) {
      prevMonth = 11
      prevYear--
    }

    let thisMonthHigh = 0
    let prevMonthHigh = 0
    const weeklyHighs = [0, 0, 0] // index 0 is this week, 1 is 1 week ago, 2 is 2 weeks ago

    stats.logs.forEach(log => {
      const logDate = new Date(log.created_at)
      const logMonth = logDate.getMonth()
      const logYear = logDate.getFullYear()
      const value = log.weight_kg ?? log.reps_total ?? 0

      if (logMonth === thisMonth && logYear === thisYear) {
        thisMonthHigh = Math.max(thisMonthHigh, value)
      } else if (logMonth === prevMonth && logYear === prevYear) {
        prevMonthHigh = Math.max(prevMonthHigh, value)
      }

      // Calculate weeks ago (rough estimate)
      const diffTime = Math.abs(now.getTime() - logDate.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const weeksAgo = Math.floor(diffDays / 7)
      
      if (weeksAgo < 3) {
        weeklyHighs[weeksAgo] = Math.max(weeklyHighs[weeksAgo], value)
      }
    })

    return { thisMonthHigh, prevMonthHigh, weeklyHighs }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-100">Personal Records</h2>
        <p className="mt-1 text-sm text-slate-400">Track your all-time highs across all exercises.</p>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search exercise or muscle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-black px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600 sm:max-w-xs"
            />

            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <MuscleDropdown 
              value={selectedMuscle} 
              options={uniqueMuscles} 
              onChange={setSelectedMuscle} 
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading your records...</p>
      ) : error ? (
        <p className="text-sm text-red-400">Failed to load records.</p>
      ) : filteredAndSortedPRs.length === 0 ? (
        <p className="text-sm text-slate-400">No records found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPRs.map((pr) => (
            <button
              key={pr.exerciseId}
              onClick={() => setSelectedPR(pr)}
              className="group flex flex-col items-start rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-slate-700 hover:bg-black"
            >
              <h3 className="truncate w-full font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                {pr.exerciseName}
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400">
                  {pr.maxWeight != null ? pr.maxWeight : pr.maxReps}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {pr.maxWeight != null ? 'kg' : 'reps'}
                </span>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                Achieved: {new Date(pr.dateAchieved).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h3 className="text-xl font-bold text-slate-100">{selectedPR.exerciseName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  First logged: {new Date(selectedPR.logs[selectedPR.logs.length - 1].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedPR(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-black/50 hover:text-slate-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Top PR */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-6 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]">
                <p className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">All Time High</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                    {selectedPR.maxWeight != null ? selectedPR.maxWeight : selectedPR.maxReps}
                  </span>
                  <span className="text-sm font-medium text-emerald-400/60">
                    {selectedPR.maxWeight != null ? 'kg' : 'reps'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(selectedPR.dateAchieved).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Historical Context */}
              {(() => {
                const { thisMonthHigh, prevMonthHigh, weeklyHighs } = getHistoricalHighs(selectedPR)
                const unit = selectedPR.maxWeight != null ? 'kg' : 'reps'
                
                return (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Weekly stacked */}
                    <div className="rounded-xl border border-border bg-[#111111] p-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Weekly Highs</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">This Week</span>
                          <span className="text-sm font-semibold text-slate-200">{weeklyHighs[0] || '-'} {unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">1 Wk Ago</span>
                          <span className="text-sm font-semibold text-slate-200">{weeklyHighs[1] || '-'} {unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">2 Wks Ago</span>
                          <span className="text-sm font-semibold text-slate-200">{weeklyHighs[2] || '-'} {unit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Monthly */}
                    <div className="rounded-xl border border-border bg-[#111111] p-4">
                      <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Month Highs</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">This Month</span>
                          <span className="text-sm font-semibold text-slate-200">{thisMonthHigh || '-'} {unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500">Prev Month</span>
                          <span className="text-sm font-semibold text-slate-200">{prevMonthHigh || '-'} {unit}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
