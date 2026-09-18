import { useMemo, useState } from 'react'

import { useAllExerciseLogs, type ExerciseLog } from '../api/useFitness'
import { LoadingView } from '../../../components/LoadingView'

// Types
type PRStats = {
  exerciseId: string
  exerciseName: string
  unit: string | null
  targetMuscles: string[] | null
  maxWeight: number | null
  maxReps: number | null
  maxDurationSeconds: number | null
  dateAchieved: string
  logs: ExerciseLog[] 
}

function MuscleDropdown({ value, options, onChange }: { value: string | null, options: string[], onChange: (v: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-44 items-center justify-between border border-threat-critical/30 bg-background px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-text-primary hover:bg-threat-critical/5 transition-colors"
      >
        <span className="truncate">{value || 'ALL TARGETS'}</span>
        <svg className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-threat-critical' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 z-20 mt-1 max-h-60 w-44 overflow-y-auto border border-threat-critical/50 bg-background shadow-[0_0_15px_rgba(220,38,38,0.2)]">
          <button
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className={`block w-full text-left px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-threat-critical/20 hover:text-threat-critical ${
              value === null ? 'text-threat-critical bg-threat-critical/10' : 'text-text-secondary'
            }`}
          >
            GLOBAL
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt)
                setIsOpen(false)
              }}
              className={`block w-full text-left px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-threat-critical/20 hover:text-threat-critical truncate ${
                value === opt ? 'text-threat-critical bg-threat-critical/10' : 'text-text-secondary'
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

function SortDropdown({ value, onChange }: { value: 'recent' | 'alphabetical' | 'weight' | 'duration', onChange: (v: 'recent' | 'alphabetical' | 'weight' | 'duration') => void }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const options = [
    { id: 'recent', label: 'MOST RECENT' },
    { id: 'alphabetical', label: 'ALPHABETICAL' },
    { id: 'weight', label: 'PEAK LOAD' },
    { id: 'duration', label: 'PEAK HOLD' },
  ] as const
  const current = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-44 items-center justify-between border border-threat-critical/30 bg-background px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-text-primary hover:bg-threat-critical/5 transition-colors"
      >
        <span>{current?.label}</span>
        <svg className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-threat-critical' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 mt-1 w-44 border border-threat-critical/50 bg-background shadow-[0_0_15px_rgba(220,38,38,0.2)]">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onChange(opt.id)
                setIsOpen(false)
              }}
              className={`block w-full text-left px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-threat-critical/20 hover:text-threat-critical ${
                value === opt.id ? 'text-threat-critical bg-threat-critical/10' : 'text-text-secondary'
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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default function PersonalRecordsPage() {
  const { data: logs, isLoading, error } = useAllExerciseLogs()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'weight' | 'duration'>('recent')
  const [selectedPR, setSelectedPR] = useState<PRStats | null>(null)

  // Calculate PRs
  const prs = useMemo(() => {
    if (!logs) return []

    // Sort chronologically ascending to accurately determine historical PR progression
    const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const prMap = new Map<string, PRStats>()

    sortedLogs.forEach((log) => {
      const existing = prMap.get(log.exercise_id)
      
      const isWeightPR = log.weight_kg != null && (existing?.maxWeight == null || log.weight_kg > existing.maxWeight)
      const isRepsPR = log.weight_kg == null && log.reps_total != null && (existing?.maxReps == null || log.reps_total > existing.maxReps)
      const isDurationPR = log.duration_seconds != null && (existing?.maxDurationSeconds == null || log.duration_seconds > existing.maxDurationSeconds)
      const isBetter = isWeightPR || (!log.weight_kg && !existing?.maxWeight && isRepsPR) || isDurationPR

      if (!existing) {
        prMap.set(log.exercise_id, {
          exerciseId: log.exercise_id,
          exerciseName: log.exercise_name,
          unit: log.exercise_default_unit,
          targetMuscles: log.exercise_target_muscles,
          maxWeight: log.weight_kg,
          maxReps: log.reps_total,
          maxDurationSeconds: log.duration_seconds,
          dateAchieved: log.created_at,
          logs: [log],
        })
      } else {
        if (isBetter) {
          if (isWeightPR) {
            existing.maxWeight = log.weight_kg
            existing.dateAchieved = log.created_at
          } 
          if (isRepsPR) {
            existing.maxReps = log.reps_total
            if (!isWeightPR && !existing.maxWeight) existing.dateAchieved = log.created_at
          }
          if (isDurationPR) {
            existing.maxDurationSeconds = log.duration_seconds
            if (!isWeightPR && !isRepsPR) existing.dateAchieved = log.created_at
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
      if (sortBy === 'duration') {
        return (b.maxDurationSeconds ?? 0) - (a.maxDurationSeconds ?? 0)
      }
      return 0
    })
  }, [prs, searchQuery, selectedMuscle, sortBy])

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-24 px-4">
      <header className="border border-threat-critical/30 bg-surface/30 p-6 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden">
        {/* Cybernetic accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-threat-critical/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-text-primary">Monument Trophies</h2>
          <p className="mt-1 text-[10px] font-mono tracking-widest text-threat-critical uppercase">Historical Peak Achievements</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 bg-background border border-threat-critical/30 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-text-primary placeholder:text-text-tertiary focus:border-threat-critical outline-none transition-colors"
          />
          <SortDropdown value={sortBy} onChange={setSortBy} />
          <MuscleDropdown value={selectedMuscle} options={uniqueMuscles} onChange={setSelectedMuscle} />
        </div>
      </header>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingView
            variant="inline"
            label="ANALYZING HISTORICAL TELEMETRY"
            sublabel="Extracting peak output vectors..."
          />
        </div>
      ) : error ? (
        <p className="text-[10px] font-mono text-threat-critical uppercase">ERR: Telemetry sync failed.</p>
      ) : filteredAndSortedPRs.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-threat-critical/30">
          <p className="text-[10px] font-mono tracking-widest uppercase text-text-tertiary">No peak records established.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPRs.map((pr) => {
            const hasWeight = pr.maxWeight != null
            const hasDuration = pr.maxDurationSeconds != null
            const hasReps = pr.maxReps != null

            return (
              <button
                key={pr.exerciseId}
                onClick={() => setSelectedPR(pr)}
                className="group relative flex flex-col items-start border border-threat-critical/20 bg-background p-5 text-left transition-all hover:border-threat-critical hover:bg-surface hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] overflow-hidden"
              >
                {/* Glowing Cybernetic Sigil / Badge */}
                <div className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                  <svg className="w-8 h-8 text-threat-critical group-hover:rotate-45 transition-transform duration-700" viewBox="0 0 100 100" fill="none">
                    <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1.5" />
                    <polygon points="50,22 68,50 50,78 32,50" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1" />
                    <circle cx="50" cy="50" r="4" fill="currentColor" className="animate-ping" style={{ animationDuration: '3s' }} />
                  </svg>
                </div>

                <h3 className="truncate w-3/4 font-black uppercase tracking-wide text-text-primary group-hover:text-threat-critical transition-colors relative z-10">
                  {pr.exerciseName}
                </h3>
                
                <div className="mt-4 flex items-baseline gap-2 relative z-10">
                  <span className="text-4xl font-black font-mono text-threat-critical drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]">
                    {hasWeight ? pr.maxWeight : hasDuration ? formatDuration(pr.maxDurationSeconds!) : hasReps ? pr.maxReps : '--'}
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-threat-critical/80 uppercase font-bold">
                    {hasWeight ? 'KG [1RM]' : hasDuration ? 'HOLD PEAK' : 'MAX REPS'}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[9px] font-mono tracking-widest uppercase text-text-tertiary relative z-10">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-threat-critical animate-pulse" />
                  <span>PEAK RECORD: {new Date(pr.dateAchieved).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Detail Modal with Screen Flash Celebration */}
      {selectedPR && (
        <>
          {/* Intense Accent Screen Flash */}
          <div className="fixed inset-0 z-50 bg-threat-critical/25 pointer-events-none animate-in fade-in zoom-in-95 duration-300" />
          
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md border-2 border-threat-critical bg-background shadow-[0_0_50px_rgba(220,38,38,0.3)] overflow-hidden relative animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-threat-critical animate-pulse" />
              
              <div className="flex items-start justify-between border-b border-threat-critical/30 p-6 bg-surface/30">
                <div>
                  <span className="text-[10px] font-mono text-threat-critical tracking-[0.3em] uppercase block mb-1">
                    PROTOCOL ASCENDANCY ESTABLISHED
                  </span>
                  <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">{selectedPR.exerciseName}</h3>
                </div>
                <button
                  onClick={() => setSelectedPR(null)}
                  className="text-text-tertiary hover:text-threat-critical transition-colors"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* PROTOCOL PEAK RECORD Terminal Banner */}
                <div className="border border-threat-critical bg-threat-critical/10 p-4 text-center font-mono">
                  <span className="text-xs font-black tracking-[0.25em] text-threat-critical uppercase block animate-pulse">
                    &gt; PROTOCOL PEAK RECORD // TELEMETRY ESTABLISHED
                  </span>
                  <span className="text-[9px] text-text-tertiary uppercase tracking-widest mt-1 block">
                    TIMESTAMP: {new Date(selectedPR.dateAchieved).toLocaleString()}
                  </span>
                </div>

                {/* Top PR Display */}
                <div className="flex flex-col items-center justify-center border border-threat-critical/40 bg-surface py-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.25)_0%,transparent_70%)] pointer-events-none" />
                  <p className="text-[10px] font-mono tracking-[0.3em] text-threat-critical/80 uppercase font-bold">ABSOLUTE PEAK</p>
                  <div className="mt-3 flex items-baseline gap-2 relative z-10">
                    <span className="text-6xl font-black font-mono text-threat-critical drop-shadow-[0_0_16px_rgba(220,38,38,0.7)]">
                      {selectedPR.maxWeight != null ? selectedPR.maxWeight : selectedPR.maxDurationSeconds != null ? formatDuration(selectedPR.maxDurationSeconds) : selectedPR.maxReps}
                    </span>
                    <span className="text-base font-mono tracking-widest text-threat-critical uppercase font-bold">
                      {selectedPR.maxWeight != null ? 'KG' : selectedPR.maxDurationSeconds != null ? '' : 'REPS'}
                    </span>
                  </div>
                  <p className="mt-4 text-[10px] font-mono text-text-tertiary uppercase tracking-widest">
                    HISTORICAL PEAK RECORD
                  </p>
                </div>

                <button
                  onClick={() => setSelectedPR(null)}
                  className="w-full py-3 border border-threat-critical text-threat-critical text-[10px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-threat-critical hover:text-background transition-colors"
                >
                  DISMISS PROMPT
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
