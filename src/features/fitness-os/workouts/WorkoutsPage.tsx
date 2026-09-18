import { useMemo, useState } from 'react'
import { DeleteButton } from '../../../components/DeleteButton'
import { Activity, Terminal, Zap } from 'lucide-react'

import ActiveWorkoutPanel from './ActiveWorkoutPanel'
import {
  useActiveWorkout,
  useDeleteWorkout,
  useEndWorkoutSession,
  useFitnessExercises,
  useStartWorkoutSession,
  useWorkoutDetail,
  useWorkouts,
  type Workout,
} from '../api/useFitness'
import { formatIndiaDate } from '../utils/date'

function HistoricalWorkoutRow({ workout, onDelete }: { workout: Workout, onDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: detail, isLoading } = useWorkoutDetail(isExpanded ? workout.id : '')

  return (
    <>
      <tr 
        onClick={() => setIsExpanded(!isExpanded)}
        className="border-b border-border-subtle/50 hover:bg-surface/50 group transition-colors cursor-pointer"
      >
        <td className="py-3 pr-4 whitespace-nowrap text-text-secondary">
          {formatIndiaDate(workout.workout_date).toUpperCase()}
        </td>
        <td className="py-3 px-4 text-text-primary font-medium tracking-wide">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-threat-critical font-mono">{isExpanded ? '▼' : '►'}</span>
            <span>{workout.title}</span>
            {workout.session_type && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-threat-critical/10 border border-threat-critical/30 text-threat-critical uppercase">
                {workout.session_type}
              </span>
            )}
          </div>
        </td>
        <td className="py-3 px-4 text-right tabular-nums text-threat-critical font-bold">
          {workout.duration_minutes}m
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-threat-critical/20 bg-threat-critical/5">
          <td colSpan={3} className="p-4">
            {isLoading ? (
              <div className="text-[10px] font-mono text-text-tertiary animate-pulse">Loading protocol logs...</div>
            ) : detail?.logs && detail.logs.length > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest text-text-tertiary border-b border-threat-critical/20 pb-1">
                  <span>Session Timeline // {detail.logs.length} Sets Logged</span>
                  <DeleteButton onClick={() => onDelete(workout.id)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {detail.logs.map((log, idx) => (
                    <div key={log.id || idx} className="p-2 bg-background border border-threat-critical/20 font-mono text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[9px] text-text-tertiary uppercase block">Set {idx + 1}</span>
                        <span className="text-text-primary font-semibold">{log.exercise_name || 'Exercise'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-threat-critical font-bold">{log.weight_kg ? `${log.weight_kg}kg` : 'BW'} × {log.reps_total}</span>
                        {log.rpe && <span className="text-[9px] text-text-tertiary block">@ RPE {log.rpe}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[10px] font-mono text-text-tertiary uppercase">
                <span>No individual set vectors recorded for this session.</span>
                <DeleteButton onClick={() => onDelete(workout.id)} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function WorkoutsPage() {
  const { data: activeWorkout, isLoading: isLoadingActive } = useActiveWorkout()
  const { data: exercises = [] } = useFitnessExercises()
  const { data: workouts = [] } = useWorkouts()
  const { mutate: startWorkoutSession, isPending: isStarting } = useStartWorkoutSession()
  const { mutate: endWorkoutSession, isPending: isEnding } = useEndWorkoutSession()
  const { mutate: deleteWorkout } = useDeleteWorkout()
  
  const [commandInput, setCommandInput] = useState('')

  const recentCompletedWorkouts = useMemo(() => workouts.slice(0, 20), [workouts])
  const hasActiveSession = Boolean(activeWorkout)

  // Primary Metric Calculation: Consistency & Muscle Coverage
  const weeklyMetrics = useMemo(() => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const workoutsThisWeek = workouts.filter(w => new Date(w.workout_date) >= sevenDaysAgo)
    const activeDays = new Set(workoutsThisWeek.map(w => new Date(w.workout_date).toISOString().split('T')[0]))
    const consistencyScore = Math.round((activeDays.size / 7) * 100)
    const totalMinutes = workoutsThisWeek.reduce((acc, w) => acc + (w.duration_minutes || 0), 0)

    return {
      activeDaysCount: activeDays.size,
      consistencyScore,
      totalMinutes,
      totalSessions: workoutsThisWeek.length
    }
  }, [workouts])

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commandInput.trim() || hasActiveSession) return

    const input = commandInput.trim().toUpperCase()
    if (input.startsWith('> INITIALIZE WORKOUT') || input.startsWith('INITIALIZE')) {
      const parts = input.split(' ')
      let type = 'Kinetic Session'
      if (parts.length > 2) type = parts.slice(2).join(' ')
      else if (parts.length > 1 && !input.startsWith('>')) type = parts.slice(1).join(' ')
      
      startWorkoutSession({
        title: `Protocol: ${type}`,
        sessionType: type,
      }, {
        onSuccess: () => setCommandInput('')
      })
    } else {
      startWorkoutSession({
        title: commandInput,
        sessionType: 'Hybrid',
      }, {
        onSuccess: () => setCommandInput('')
      })
    }
  }

  return (
    <div className="space-y-12 pb-24">
      {/* Initialization & Active Region */}
      <section>
        {isLoadingActive ? (
          <div className="flex items-center gap-3 text-text-tertiary font-mono text-xs uppercase animate-pulse">
            <Activity className="h-4 w-4" />
            <span>Scanning telemetry...</span>
          </div>
        ) : hasActiveSession && activeWorkout ? (
          <ActiveWorkoutPanel
            activeWorkout={activeWorkout}
            exercises={exercises}
            isEnding={isEnding}
            onEndWorkout={() =>
              endWorkoutSession({
                workoutId: activeWorkout.id,
                startTime: activeWorkout.start_time ?? activeWorkout.created_at,
              })
            }
          />
        ) : (
          <div className="w-full flex flex-col items-center justify-center min-h-[35vh] border border-threat-critical/30 bg-background/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.06)_0%,transparent_70%)] pointer-events-none"></div>
            
            <form onSubmit={handleCommandSubmit} className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md px-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border border-threat-critical/30 bg-threat-critical/10 text-threat-critical mb-2 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                <Terminal className="h-5 w-5 animate-pulse" />
              </div>
              
              <div className="w-full relative flex items-center">
                <span className="absolute left-0 text-threat-critical font-mono font-bold text-lg animate-pulse">{'>'}</span>
                <input
                  autoFocus
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="INITIALIZE WORKOUT"
                  disabled={isStarting}
                  className="w-full bg-transparent border-b border-border-subtle focus:border-threat-critical py-2 pl-6 pr-4 font-mono text-text-primary text-center outline-none uppercase tracking-widest placeholder:text-text-tertiary transition-colors"
                />
                {!commandInput && (
                  <span className="absolute right-8 inline-block w-2.5 h-4 bg-threat-critical animate-pulse align-middle" />
                )}
              </div>
              <p className="text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
                {isStarting ? 'Allocating resources...' : 'Awaiting initialization command [Press Enter to Engage]'}
              </p>
            </form>
          </div>
        )}
      </section>

      {/* Historical Ledger & Weekly Primary Metrics */}
      {!hasActiveSession && (
        <section className="space-y-6">
          {/* Primary Metric Banner: Consistency & Coverage */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-threat-critical/20 bg-surface/20 p-4 font-mono">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-text-tertiary block mb-1">Consistency Vector [7D]</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-threat-critical">{weeklyMetrics.consistencyScore}%</span>
                <span className="text-[10px] text-text-secondary">({weeklyMetrics.activeDaysCount}/7 Days)</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-text-tertiary block mb-1">Cumulative Exertion</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-text-primary">{weeklyMetrics.totalMinutes}</span>
                <span className="text-[10px] text-text-tertiary">MINUTES</span>
              </div>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-text-tertiary block mb-1">Protocols Completed</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-text-primary">{weeklyMetrics.totalSessions}</span>
                <span className="text-[10px] text-text-tertiary">SESSIONS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-text-secondary border-b border-border-subtle pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-threat-critical" />
              <h2 className="text-xs uppercase tracking-widest font-mono">Historical Ledger // Timeline Details</h2>
            </div>
            <span className="text-[10px] font-mono text-text-tertiary uppercase">Click row to expand session timeline</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="py-3 pr-4 font-normal">DATE</th>
                  <th className="py-3 px-4 font-normal">PROTOCOL</th>
                  <th className="py-3 px-4 font-normal text-right">DUR</th>
                </tr>
              </thead>
              <tbody>
                {recentCompletedWorkouts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-text-tertiary">No historical records found.</td>
                  </tr>
                )}
                {recentCompletedWorkouts.map((workout) => (
                  <HistoricalWorkoutRow 
                    key={workout.id} 
                    workout={workout} 
                    onDelete={(id) => deleteWorkout({ id })} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
