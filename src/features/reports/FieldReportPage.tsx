import { useState, useMemo } from 'react'
import { getWeekStartDateISO, useWeeklyReview } from '../productivity-hub/api/usePlanning'
import { useTasks } from '../productivity-hub/api/useTasks'
import { useHabitWorkspace } from '../mind-os/api/useHabits'
import { useJournal } from '../mind-os/api/useJournal'
import { useAllExerciseLogs, useFitnessExercises } from '../fitness-os/api/useFitness'
import { toIndiaDateKey } from '../../lib/events'
import { ReportsIcon } from '../../components/icons'
import { LoadingView } from '../../components/LoadingView'

function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getPreviousWeek(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().split('T')[0]
}

function getNextWeek(dateISO: string) {
  const d = new Date(`${dateISO}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().split('T')[0]
}

function joinBulletItems(items: string | null): string[] {
  if (!items) return []
  return items.split('\n').filter(Boolean)
}

export default function FieldReportPage() {
  const [selectedWeek, setSelectedWeek] = useState(() => getWeekStartDateISO())
  
  const { data: review, isLoading: reviewLoading } = useWeeklyReview(selectedWeek)
  const { data: tasks = [] } = useTasks()
  const { data: habitData } = useHabitWorkspace()
  const { data: journals = [] } = useJournal()
  const { data: fitnessLogs = [] } = useAllExerciseLogs()
  const { data: exercises = [] } = useFitnessExercises()

  const currentWeekLabel = useMemo(() => {
    const d = parseISODate(selectedWeek)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }, [selectedWeek])
  
  // Dynamic recalculation
  const metrics = useMemo(() => {
    const weekStart = parseISODate(selectedWeek)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    // Tasks completed in this week
    const completedTasks = tasks.filter(t => 
      t.is_completed && 
      t.updated_at && 
      new Date(t.updated_at) >= weekStart && 
      new Date(t.updated_at) <= weekEnd
    )
    
    // Habit log counts in this week
    let habitsMet = 0
    let habitsFailed = 0
    const weekDateKeys = Array.from({length: 7}, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
    
    if (habitData?.logs) {
      const weekLogs = habitData.logs.filter(l => weekDateKeys.includes(l.log_date))
      habitsMet = weekLogs.filter(l => l.value >= 1).length
      habitsFailed = weekLogs.filter(l => l.value < 1).length
    }

    // Journal sentiments this week
    const weekJournals = journals.filter(j => weekDateKeys.includes(toIndiaDateKey(j.created_at)))
    const avgMood = weekJournals.length ? weekJournals.reduce((acc, j) => acc + (j.mood ?? 0), 0) / weekJournals.length : null

    // Fitness OS weekly metrics
    const weekFitnessLogs = fitnessLogs.filter(l => {
      const logDate = new Date(l.created_at)
      return logDate >= weekStart && logDate <= weekEnd
    })

    const workoutDays = new Set(weekFitnessLogs.map(l => l.created_at.split('T')[0])).size
    const consistencyScore = Math.round((workoutDays / 7) * 100)

    const muscleGroups = new Map<string, number>()
    let totalRpe = 0
    let rpeCount = 0

    weekFitnessLogs.forEach(log => {
      if (log.rpe) {
        totalRpe += log.rpe
        rpeCount++
      }
      const ex = exercises.find(e => e.id === log.exercise_id)
      if (ex && ex.target_muscles) {
        ex.target_muscles.forEach(m => {
          const current = muscleGroups.get(m) || 0
          muscleGroups.set(m, current + (log.rpe || 5)) // weighted by intensity, default 5
        })
      }
    })

    const topMuscles = Array.from(muscleGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0])

    const avgIntensity = rpeCount ? (totalRpe / rpeCount).toFixed(1) : '-'

    return {
      completedTasks: completedTasks.length,
      habitsMet,
      habitsFailed,
      avgMood,
      weekJournals,
      consistencyScore,
      avgIntensity,
      topMuscles: topMuscles.length ? topMuscles.join(', ') : 'None'
    }
  }, [selectedWeek, tasks, habitData, journals, fitnessLogs, exercises])

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 font-serif">
      {/* Navigation */}
      <header className="flex justify-between items-center mb-24 border-b border-border/20 pb-4">
        <button 
          onClick={() => setSelectedWeek(prev => getPreviousWeek(prev))}
          className="text-sm font-sans tracking-widest uppercase text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          &larr; Previous Week
        </button>
        <span className="font-mono text-xs text-text-secondary tracking-widest uppercase">
          W. {currentWeekLabel}
        </span>
        <button 
          onClick={() => setSelectedWeek(prev => getNextWeek(prev))}
          className="text-sm font-sans tracking-widest uppercase text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          Next Week &rarr;
        </button>
      </header>

      {/* Title */}
      <div className="mb-20">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-surface border border-border/80 text-text-primary shadow-sm">
            <ReportsIcon className="h-4 w-4" />
          </div>
          <p className="font-mono text-[10px] tracking-widest text-text-tertiary uppercase">Field Dossier</p>
        </div>
        <h1 className="text-5xl md:text-7xl font-normal tracking-tight text-text-primary leading-[1.1]">
          Weekly Report
        </h1>
      </div>

      {reviewLoading ? (
        <LoadingView
          variant="inline"
          label="Retrieving Field Dossier"
          sublabel="Compiling weekly ledger and habit telemetry..."
        />
      ) : (
        <div className="space-y-24">
          
          {/* Synthesis / Quotes */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2">
              <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-8 border-b border-border/20 pb-2">Wins & Breakthroughs</h2>
              <div className="space-y-6">
                {review ? (
                  joinBulletItems(review.wins).map((win, i) => (
                    <p key={i} className="text-xl leading-relaxed text-text-primary">
                      {win}
                    </p>
                  ))
                ) : (
                  <p className="text-text-tertiary italic">No manual review submitted for this week.</p>
                )}
                {review && !review.wins && <p className="text-text-tertiary italic">No wins recorded.</p>}
              </div>
            </div>
            
            <div className="border-l border-border/20 pl-8 space-y-8">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-4 border-b border-border/20 pb-2">Ledger</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-light">{metrics.completedTasks}</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Tasks Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-light">{metrics.habitsMet}</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Habit Hits</p>
                  </div>
                  <div>
                    <p className="text-2xl font-light">{metrics.avgMood ? metrics.avgMood.toFixed(1) : '-'}</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Avg Mood</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-4 border-b border-border/20 pb-2">Physical</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-light">{metrics.consistencyScore}%</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Consistency</p>
                  </div>
                  <div>
                    <p className="text-2xl font-light">{metrics.avgIntensity}</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Avg RPE</p>
                  </div>
                  <div>
                    <p className="text-sm font-sans uppercase tracking-widest text-text-primary leading-tight">{metrics.topMuscles}</p>
                    <p className="text-[10px] font-sans uppercase tracking-widest text-text-tertiary mt-1">Primary Vectors</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Blockers */}
          <section className="border-t border-border/20 pt-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-8">Friction & Blockers</h2>
            <div className="pl-6 border-l-2 border-red-900/30">
              <div className="space-y-4">
                {review ? (
                  joinBulletItems(review.blockers).map((blocker, i) => (
                    <p key={i} className="text-lg leading-relaxed text-text-secondary">
                      {blocker}
                    </p>
                  ))
                ) : (
                  <p className="text-text-tertiary italic">No blockers recorded.</p>
                )}
                {review && !review.blockers && <p className="text-text-tertiary italic">No blockers recorded.</p>}
              </div>
            </div>
          </section>

          {/* Next Adjustments */}
          <section className="border-t border-border/20 pt-16 pb-20">
            <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-8">Tactical Adjustments</h2>
            <ul className="space-y-4 font-sans text-sm text-text-secondary">
              {review ? (
                joinBulletItems(review.next_adjustments).map((adj, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="text-text-tertiary mt-1">&rarr;</span>
                    <span className="leading-relaxed">{adj}</span>
                  </li>
                ))
              ) : (
                <li className="text-text-tertiary italic">No adjustments recorded.</li>
              )}
              {review && !review.next_adjustments && <li className="text-text-tertiary italic">No adjustments recorded.</li>}
            </ul>
          </section>

        </div>
      )}
    </div>
  )
}
