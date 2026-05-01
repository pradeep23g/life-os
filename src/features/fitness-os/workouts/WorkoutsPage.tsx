import { useMemo, useState } from 'react'

import ActiveWorkoutPanel from './ActiveWorkoutPanel'
import {
  useActiveWorkout,
  useEndWorkoutSession,
  useFitnessExercises,
  useStartWorkoutSession,
  useWorkouts,
} from '../api/useFitness'
import { formatIndiaDate } from '../utils/date'

const greenReplicaButtonClass =
  'border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2'

function WorkoutsPage() {
  const { data: activeWorkout, isLoading: isLoadingActive, error: activeError } = useActiveWorkout()
  const { data: exercises = [], isLoading: exercisesLoading } = useFitnessExercises()
  const { data: workouts = [], isLoading: workoutsLoading, error: workoutsError } = useWorkouts()

  const { mutate: startWorkoutSession, isPending: isStarting, error: startError } = useStartWorkoutSession()
  const { mutate: endWorkoutSession, isPending: isEnding, error: endError } = useEndWorkoutSession()
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionType, setSessionType] = useState('')

  const recentCompletedWorkouts = useMemo(() => workouts.slice(0, 8), [workouts])
  const hasActiveSession = Boolean(activeWorkout)

  return (
    <section className="space-y-4 bg-[#000000]">
      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Workout Sessions</h2>
            <p className="mt-1 text-sm text-slate-400">Run a live session and log sets in real time.</p>
          </div>

          <button
            type="button"
            disabled={hasActiveSession || isStarting || isLoadingActive}
            onClick={() =>
              startWorkoutSession({
                title: sessionTitle.trim() || 'Live Workout Session',
                sessionType: sessionType.trim() || 'Calisthenics',
              }, {
                onSuccess: () => {
                  setSessionTitle('')
                  setSessionType('')
                },
              })
            }
            className={`${greenReplicaButtonClass} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isStarting ? 'Starting...' : 'Start Workout'}
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            value={sessionTitle}
            onChange={(event) => setSessionTitle(event.target.value)}
            placeholder="Session title (e.g., Push Day)"
            className="rounded border border-[#222222] bg-black px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={sessionType}
            onChange={(event) => setSessionType(event.target.value)}
            placeholder="Session type (e.g., Strength / Calisthenics)"
            className="rounded border border-[#222222] bg-black px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </article>

      {activeError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Failed to load active session: {activeError instanceof Error ? activeError.message : 'Unknown error'}
        </article>
      ) : null}
      {startError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Failed to start workout: {startError instanceof Error ? startError.message : 'Unknown error'}
        </article>
      ) : null}
      {endError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Failed to end workout: {endError instanceof Error ? endError.message : 'Unknown error'}
        </article>
      ) : null}

      {hasActiveSession && activeWorkout ? (
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
        <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 text-sm text-slate-400">
          No active workout session. Start a workout to enter Live Session Mode.
        </article>
      )}

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h3 className="text-lg font-semibold text-slate-100">Recent Completed Sessions</h3>
        <p className="mt-1 text-sm text-slate-400">Latest saved sessions with duration and type.</p>

        {workoutsLoading ? <p className="mt-3 text-sm text-slate-400">Loading completed workouts...</p> : null}
        {workoutsError ? (
          <p className="mt-3 text-sm text-red-400">{workoutsError instanceof Error ? workoutsError.message : 'Failed to load workouts.'}</p>
        ) : null}
        {!workoutsLoading && !workoutsError && recentCompletedWorkouts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No completed workouts yet.</p>
        ) : null}

        {!workoutsLoading && !workoutsError && recentCompletedWorkouts.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {recentCompletedWorkouts.map((workout) => (
              <li key={workout.id} className="rounded-md border border-[#222222] bg-black p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
                  <p className="text-sm text-slate-200">{workout.duration_minutes} min</p>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {formatIndiaDate(workout.workout_date)} • {workout.session_type || 'General'}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      {exercisesLoading ? (
        <p className="text-xs text-slate-500">Loading exercise library for picker...</p>
      ) : null}
    </section>
  )
}

export default WorkoutsPage
