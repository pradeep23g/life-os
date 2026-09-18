import { useFitnessDashboard, useActiveWorkout, useStartWorkoutSession, useEndWorkoutSession } from '../api/useFitness'
import { LoadingView } from '../../../components/LoadingView'

export default function FitnessOsDashboard() {
  const { data, isLoading } = useFitnessDashboard()
  const { data: activeWorkout } = useActiveWorkout()
  const { mutate: startSession, isPending: isStarting } = useStartWorkoutSession()
  const { mutate: endSession, isPending: isEnding } = useEndWorkoutSession()

  // Calculate high-level state
  const thisWeekMinutes = data?.totalSessionMinutesThisWeek ?? 0
  const totalVolume = data?.workoutsThisWeek ?? 0
  const isRecovering = data?.totalSessionMinutesThisWeek === 0

  return (
    <section className="max-w-6xl mx-auto py-12 md:py-16 space-y-24 text-text-primary px-4">
      
      {/* Heavy, Physical Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-sans font-black tracking-tighter uppercase leading-none">
            KINETIC<br />REGISTER
          </h1>
          <p className="text-sm font-mono text-text-tertiary uppercase tracking-widest pl-2">
            State: {isRecovering ? 'RECOVERING' : 'ACTIVE'} // V: {totalVolume}
          </p>
        </div>
        
        {/* Live Session Launcher */}
        <div className="md:text-right shrink-0">
          {!activeWorkout ? (
            <button
              type="button"
              disabled={isStarting}
              onClick={() => startSession({ title: 'Ad-hoc Kinetic Session', sessionType: 'Hybrid' })}
              className="px-6 py-4 bg-accent-primary text-background font-sans font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 w-full md:w-auto"
            >
              {isStarting ? 'INITIATING...' : 'ENGAGE SESSION'}
            </button>
          ) : (
            <div className="bg-threat-warning/10 border border-threat-warning p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-threat-warning animate-pulse" />
                <span className="font-mono text-sm tracking-widest uppercase text-threat-warning">Session Active</span>
              </div>
              <button
                type="button"
                disabled={isEnding}
                onClick={() => {
                  if (activeWorkout.start_time) {
                    endSession({ workoutId: activeWorkout.id, startTime: activeWorkout.start_time })
                  }
                }}
                className="px-6 py-3 border border-threat-warning text-threat-warning font-sans font-bold uppercase tracking-wider hover:bg-threat-warning hover:text-background transition-colors disabled:opacity-50 w-full"
              >
                {isEnding ? 'TERMINATING...' : 'END SESSION'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Output & Volume Curve */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-end border-b-2 border-border-subtle pb-12">
        <div className="space-y-2">
          <span className="block text-xs font-mono uppercase tracking-widest text-text-secondary">Current Weekly Volume</span>
          <div className="flex items-baseline gap-2">
            <span className="text-8xl md:text-[10rem] font-sans font-black tracking-tighter leading-none text-text-primary">
              {isLoading ? '--' : thisWeekMinutes}
            </span>
            <span className="text-xl font-mono text-text-tertiary uppercase">MIN</span>
          </div>
        </div>

        <div className="space-y-8 pb-4">
          <div className="space-y-2">
            <span className="block text-xs font-mono uppercase tracking-widest text-text-secondary">Volume Progression (90 Days)</span>
            <div className="h-32 flex items-end gap-1">
              {data?.heatmapDays.slice(-90).map((day) => (
                <div 
                  key={day.date} 
                  className={`flex-1 transition-all ${day.minutes > 0 ? 'bg-threat-healthy' : 'bg-surface border border-border-subtle'}`}
                  style={{ height: day.minutes > 0 ? `${Math.max(10, (day.minutes / 120) * 100)}%` : '10%' }}
                  title={`${day.date}: ${day.minutes} mins`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Movement Log */}
      <section className="space-y-12">
        <h2 className="text-sm font-mono uppercase tracking-widest text-text-secondary">Recent Training Log</h2>
        
        {isLoading ? (
          <div className="py-6">
            <LoadingView
              variant="inline"
              label="Retrieving Movement Log"
              sublabel="Loading physical exertion history and sets..."
            />
          </div>
        ) : (data?.recentWorkouts.length ?? 0) > 0 ? (
          <ul className="space-y-6">
            {data?.recentWorkouts.slice(0, 5).map((workout) => {
              const dateObj = new Date(workout.workout_date);
              const dayStr = String(dateObj.getDate()).padStart(2, '0');
              const monthStr = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              
              return (
                <li key={workout.id} className="group relative flex items-baseline justify-between border-b border-border-subtle pb-6 transition-colors">
                  <div className="flex items-baseline gap-6">
                    <span className="text-xs font-mono text-text-tertiary w-16 tabular-nums">
                      {dayStr} {monthStr}
                    </span>
                    <span className="text-2xl md:text-3xl font-sans font-bold tracking-tight text-text-primary group-hover:text-accent-primary transition-colors">
                      {workout.title}
                    </span>
                  </div>
                  <span className="text-lg font-mono font-medium text-text-secondary">
                    {workout.duration_minutes}M
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="py-12 border-t border-b border-border-subtle text-text-tertiary font-mono uppercase tracking-widest text-sm text-center">
            NO RECENT MOVEMENT LOGGED
          </div>
        )}
      </section>

    </section>
  )
}
