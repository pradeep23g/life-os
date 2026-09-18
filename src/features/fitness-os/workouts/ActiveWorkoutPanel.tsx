import { useEffect, useMemo, useState } from 'react'
import { Terminal, Target, Clock } from 'lucide-react'

import {
  type FitnessExercise,
  type Workout,
  useAddExerciseLog,
  useAddExerciseLogsBatch,
  useWorkoutDetail,
} from '../api/useFitness'
import ExercisePickerDrawer from './ExercisePickerDrawer'

type ActiveWorkoutPanelProps = {
  activeWorkout: Workout
  exercises: FitnessExercise[]
  onEndWorkout: () => void
  isEnding: boolean
}

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

export default function ActiveWorkoutPanel({ activeWorkout, exercises, onEndWorkout, isEnding }: ActiveWorkoutPanelProps) {
  const { data: workoutDetail } = useWorkoutDetail(activeWorkout.id)
  const { mutate: addExerciseLog, isPending: isAddingSet } = useAddExerciseLog()
  const { mutate: addExerciseLogsBatch, isPending: isAddingBatch } = useAddExerciseLogsBatch()

  const [now, setNow] = useState(() => Date.now())
  const [commandInput, setCommandInput] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null)
  
  // Quick-entry state
  const [draftWeight, setDraftWeight] = useState('')
  const [draftReps, setDraftReps] = useState('')
  const [draftRpe, setDraftRpe] = useState<string>('')

  // Sidebar toggle
  const [sidebarView, setSidebarView] = useState<'timeline' | 'ledger'>('timeline')

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const elapsed = formatElapsed(now - new Date(activeWorkout.start_time ?? activeWorkout.created_at).getTime())
  
  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises])
  
  const logsByExerciseId = useMemo(() => {
    const logs = workoutDetail?.logs ?? []
    const map = new Map<string, Array<(typeof logs)[number]>>()
    for (const log of logs) {
      const list = map.get(log.exercise_id) ?? []
      list.push(log)
      map.set(log.exercise_id, list)
    }
    return map
  }, [workoutDetail])

  const chronologicalLogs = useMemo(() => {
    const logs = [...(workoutDetail?.logs ?? [])]
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [workoutDetail])

  const focusedExercise = focusedExerciseId ? exerciseById.get(focusedExerciseId) : null
  const focusedLogs = focusedExerciseId ? (logsByExerciseId.get(focusedExerciseId) ?? []) : []

  // Command Palette Parser (e.g., "Bench 3x10@225" or "Bench")
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim()) return

    const match = commandInput.match(/^([A-Za-z ]+?)(?:\s+(\d+)x(\d+)(?:@(\d+(?:\.\d+)?))?)?$/)
    if (match) {
      const [, exerciseName, sets, reps, weight] = match
      const matchedExercise = exercises.find(ex => ex.name.toLowerCase().includes(exerciseName.trim().toLowerCase()))
      
      if (matchedExercise) {
        setFocusedExerciseId(matchedExercise.id)
        if (sets && reps) {
          // Auto-log the sets if provided via command in a single batch
          const numSets = parseInt(sets, 10)
          const logsToCreate = Array.from({ length: numSets }, () => ({
            workoutId: activeWorkout.id,
            exerciseId: matchedExercise.id,
            sets: 1,
            repsTotal: parseInt(reps, 10),
            weightKg: weight ? parseFloat(weight) : undefined,
            rpe: draftRpe ? parseFloat(draftRpe) : undefined,
          }))
          addExerciseLogsBatch(logsToCreate)
        }
      }
    }
    setCommandInput('')
  }

  const handleSaveSet = () => {
    if (!focusedExerciseId || !draftReps) return
    
    addExerciseLog({
      workoutId: activeWorkout.id,
      exerciseId: focusedExerciseId,
      sets: 1,
      repsTotal: parseInt(draftReps, 10),
      weightKg: draftWeight ? parseFloat(draftWeight) : undefined,
      rpe: draftRpe ? parseFloat(draftRpe) : undefined
    }, {
      onSuccess: () => {
        setDraftReps('')
        setDraftRpe('')
        // intentionally keep weight for the next set
      }
    })
  }

  // Collapsible tactical numpad toggle
  const [isNumpadExpanded, setIsNumpadExpanded] = useState(true)
  const [activeInputFocus, setActiveInputFocus] = useState<'weight' | 'reps'>('reps')

  const currentSetNum = focusedLogs.length + 1
  const nextSetNum = focusedLogs.length + 2

  return (
    <div className="flex flex-col border border-threat-critical/30 bg-background overflow-hidden selection:bg-threat-critical/30">
      
      {/* Header Monolith Clock */}
      <header className="flex flex-wrap items-center justify-between p-4 border-b border-threat-critical/30 bg-threat-critical/5">
        <div>
          <h2 className="text-xs uppercase tracking-widest text-threat-critical/70 font-mono">Session Protocol</h2>
          <p className="mt-1 text-sm font-semibold text-text-primary tracking-wide uppercase">{activeWorkout.title}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-threat-critical/70 uppercase tracking-widest font-mono">T-Plus</p>
            <p className="text-2xl font-mono text-threat-critical font-bold tracking-tighter">{elapsed}</p>
          </div>
          <button
            onClick={onEndWorkout}
            disabled={isEnding}
            className="px-6 py-3 bg-threat-critical text-background font-bold tracking-widest uppercase text-xs hover:bg-threat-critical/90 transition-colors"
          >
            {isEnding ? 'Terminating...' : 'Terminate'}
          </button>
        </div>
      </header>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] min-h-[550px]">
        
        {/* Left Sidebar: Timeline & Ledger */}
        <aside className="border-r border-threat-critical/30 bg-surface/30 p-4 overflow-y-auto flex flex-col">
          <div className="mb-6 shrink-0">
            <form onSubmit={handleCommandSubmit} className="relative">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-threat-critical/50" />
              <input 
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                placeholder="> CMD (E.G. BENCH 3X10@225)"
                className="w-full bg-background border border-threat-critical/30 text-text-primary font-mono text-xs py-2 pl-9 pr-3 outline-none focus:border-threat-critical transition-colors uppercase placeholder:text-text-tertiary"
              />
            </form>
            <button 
              onClick={() => setPickerOpen(true)}
              className="mt-2 w-full text-center border border-dashed border-threat-critical/30 text-threat-critical/70 hover:bg-threat-critical/5 hover:text-threat-critical transition-colors py-1.5 text-[10px] uppercase font-mono tracking-widest"
            >
              [ Browse Catalog ]
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-threat-critical/10 pb-2 mb-2 shrink-0">
              <button onClick={() => setSidebarView('timeline')} className={`text-[10px] uppercase font-mono tracking-widest transition-colors ${sidebarView === 'timeline' ? 'text-threat-critical font-bold' : 'text-text-tertiary hover:text-text-secondary'}`}>Timeline</button>
              <span className="text-text-tertiary">/</span>
              <button onClick={() => setSidebarView('ledger')} className={`text-[10px] uppercase font-mono tracking-widest transition-colors ${sidebarView === 'ledger' ? 'text-threat-critical font-bold' : 'text-text-tertiary hover:text-text-secondary'}`}>Ledger</button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-2">
              {sidebarView === 'ledger' ? (
                Array.from(logsByExerciseId.entries()).map(([exId, logs]) => {
                  const ex = exerciseById.get(exId)
                  const isActive = focusedExerciseId === exId
                  return (
                    <div 
                      key={exId} 
                      onClick={() => setFocusedExerciseId(exId)}
                      className={`cursor-pointer border-l-2 p-2 transition-colors ${isActive ? 'border-threat-critical bg-threat-critical/10' : 'border-transparent hover:bg-surface'}`}
                    >
                      <p className="text-xs font-semibold text-text-primary uppercase tracking-wide">{ex?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-text-tertiary font-mono tracking-widest">{logs.length} Sets Logged</p>
                    </div>
                  )
                })
              ) : (
                chronologicalLogs.length === 0 ? (
                  <p className="text-[10px] text-text-tertiary font-mono tracking-widest text-center mt-4">NO SETS LOGGED YET</p>
                ) : (
                  chronologicalLogs.map((log) => {
                    const ex = exerciseById.get(log.exercise_id)
                    const time = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={log.id} onClick={() => setFocusedExerciseId(log.exercise_id)} className="cursor-pointer border border-threat-critical/10 bg-background p-2 hover:border-threat-critical/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[10px] font-bold text-text-primary uppercase truncate pr-2">{ex?.name}</span>
                          <span className="text-[9px] text-threat-critical/70 font-mono shrink-0 flex items-center gap-1"><Clock className="w-3 h-3" /> {time}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-text-tertiary">
                          <span>{log.weight_kg ? `${log.weight_kg}kg` : 'BW'} × {log.reps_total}</span>
                          {log.rpe && <span>RPE {log.rpe}</span>}
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </div>
          </div>
        </aside>

        {/* Right Main: Step-by-Step Focus Mode with Massive Geist Mono Numbers */}
        <main className="p-4 sm:p-8 flex flex-col justify-center relative">
          {!focusedExercise ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-threat-critical/20 font-mono uppercase tracking-[0.3em] pointer-events-none">
              <Target className="h-16 w-16 mb-4 opacity-50" />
              <span>Select Target</span>
            </div>
          ) : (
            <div className="max-w-xl w-full mx-auto space-y-8 animate-fade-in">
              <div className="text-center space-y-2 border-b border-threat-critical/20 pb-4">
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-threat-critical">
                  TARGET: {focusedExercise.primary_muscle || 'COMPOUND'} // {focusedExercise.movement_pattern || 'ISOLATION'}
                </span>
                <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-text-primary">{focusedExercise.name}</h2>
              </div>

              {/* Step-by-Step Sequence Horizon */}
              <div className="bg-surface/40 border border-threat-critical/20 p-4 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-threat-critical text-background font-bold text-[10px] uppercase tracking-wider">
                    CURRENT
                  </span>
                  <span className="text-text-primary font-bold tracking-wider">SET {currentSetNum}</span>
                </div>
                
                <div className="text-right text-[10px] text-text-tertiary tracking-widest uppercase">
                  <span>NEXT: SET {nextSetNum} (PROJECTION: {draftWeight || 'BW'} × {draftReps || '10'})</span>
                </div>
              </div>

              {/* Massive Monolith Geist Mono Numbers */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <label 
                  onClick={() => setActiveInputFocus('weight')}
                  className={`block cursor-pointer p-4 bg-background border transition-all ${
                    activeInputFocus === 'weight' 
                      ? 'border-threat-critical ring-1 ring-threat-critical/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
                      : 'border-border-subtle hover:border-threat-critical/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-tertiary block mb-1">
                    MASS LOAD (KG)
                  </span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="BW"
                    value={draftWeight}
                    onFocus={() => setActiveInputFocus('weight')}
                    onChange={(e) => setDraftWeight(e.target.value)}
                    className="w-full bg-transparent text-center text-5xl sm:text-7xl font-mono font-black tabular-nums tracking-tighter text-text-primary leading-none outline-none placeholder:text-text-tertiary/30"
                  />
                </label>

                <label 
                  onClick={() => setActiveInputFocus('reps')}
                  className={`block cursor-pointer p-4 bg-background border transition-all ${
                    activeInputFocus === 'reps' 
                      ? 'border-threat-critical ring-1 ring-threat-critical/50 shadow-[0_0_20px_rgba(220,38,38,0.15)]' 
                      : 'border-border-subtle hover:border-threat-critical/40'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-threat-critical block mb-1">
                    EXECUTION REPS
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="0"
                    value={draftReps}
                    onFocus={() => setActiveInputFocus('reps')}
                    onChange={(e) => setDraftReps(e.target.value)}
                    className="w-full bg-transparent text-center text-5xl sm:text-7xl font-mono font-black tabular-nums tracking-tighter text-threat-critical leading-none outline-none placeholder:text-threat-critical/30"
                  />
                </label>
              </div>

              {/* Optional Intensity RPE Selector */}
              <div className="bg-surface/30 border border-threat-critical/20 p-3">
                <div className="flex justify-between items-center mb-2 text-[10px] font-mono uppercase tracking-widest text-text-tertiary">
                  <span>Intensity Scale (RPE - Optional)</span>
                  {draftRpe && <span className="text-threat-critical font-bold">@ RPE {draftRpe}</span>}
                </div>
                <div className="flex gap-1">
                  {['6', '7', '8', '9', '10'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDraftRpe(prev => prev === val ? '' : val)}
                      className={`flex-1 py-1.5 text-[10px] font-mono border transition-colors ${
                        draftRpe === val 
                          ? 'bg-threat-critical border-threat-critical text-background font-bold' 
                          : 'bg-background border-threat-critical/20 text-text-secondary hover:border-threat-critical/50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Tactical Numpad Menu */}
              <div className="border border-threat-critical/30 bg-surface/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsNumpadExpanded(!isNumpadExpanded)}
                  className="w-full py-2 px-4 flex items-center justify-between bg-surface text-[10px] font-mono uppercase tracking-widest text-text-tertiary hover:text-threat-critical border-b border-threat-critical/20 transition-colors"
                >
                  <span>[ Tactical Numpad ]</span>
                  <span>{isNumpadExpanded ? '▲ COLLAPSE' : '▼ EXPAND'}</span>
                </button>

                {isNumpadExpanded && (
                  <div className="p-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-2">
                      {['1','2','3','4','5','6','7','8','9','0','.','CLR'].map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (key === 'CLR') {
                              if (activeInputFocus === 'weight') setDraftWeight('')
                              else setDraftReps('')
                            } else {
                              if (activeInputFocus === 'weight') setDraftWeight(prev => prev + key)
                              else setDraftReps(prev => prev + key)
                            }
                          }}
                          className="bg-background border border-threat-critical/10 py-3 text-lg font-mono hover:bg-threat-critical/10 hover:border-threat-critical/40 transition-colors text-text-secondary active:scale-95"
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Commit Action Button */}
              <button 
                onClick={handleSaveSet}
                disabled={!draftReps || isAddingSet || isAddingBatch}
                className="w-full py-4 bg-threat-critical text-background font-mono font-black tracking-[0.25em] uppercase hover:bg-threat-critical/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-[0.99]"
              >
                {isAddingSet || isAddingBatch ? 'LOGGING...' : `COMMIT SET ${currentSetNum}`}
              </button>
            </div>
          )}
        </main>
      </div>

      <ExercisePickerDrawer
        isOpen={pickerOpen}
        exercises={exercises}
        selectedMuscle="All"
        onSelectMuscle={() => {}}
        onPickExercise={(ex) => {
          setFocusedExerciseId(ex.id)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  )
}
