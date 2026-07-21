import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DeleteButton } from '../../../components/DeleteButton'

import ActiveWorkoutPanel from './ActiveWorkoutPanel'
import {
  useActiveWorkout,
  useDeleteWorkout,
  useEndWorkoutSession,
  useFitnessExercises,
  useStartWorkoutSession,
  useWorkoutDetail,
  useWorkouts,
} from '../api/useFitness'
import { formatIndiaDate } from '../utils/date'

const greenReplicaButtonClass =
  'border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2'

function WorkoutsPage() {
  const [searchParams] = useSearchParams()
  const { data: activeWorkout, isLoading: isLoadingActive, error: activeError } = useActiveWorkout()
  const { data: exercises = [], isLoading: exercisesLoading } = useFitnessExercises()
  const { data: workouts = [], isLoading: workoutsLoading, error: workoutsError } = useWorkouts()

  const { mutate: startWorkoutSession, isPending: isStarting, error: startError } = useStartWorkoutSession()
  const { mutate: endWorkoutSession, isPending: isEnding, error: endError } = useEndWorkoutSession()
  const { mutate: deleteWorkout, isPending: isDeletingWorkout } = useDeleteWorkout()
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionType, setSessionType] = useState('')
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { data: expandedWorkoutDetail } = useWorkoutDetail(expandedWorkoutId)

  const recentCompletedWorkouts = useMemo(() => workouts.slice(0, 8), [workouts])
  const selectedDate = searchParams.get('date') ?? ''
  const workoutsForSelectedDate = useMemo(
    () => (selectedDate ? workouts.filter((workout) => workout.workout_date === selectedDate) : []),
    [selectedDate, workouts],
  )
  const hasActiveSession = Boolean(activeWorkout)

  return (
    <section className="space-y-4 bg-black">
      <article className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Workout Sessions</h2>
            <p className="mt-1 text-sm text-slate-400">Run a live session and log sets in real time.</p>
          </div>

          <button
            type="button"
            disabled={hasActiveSession || isStarting || isLoadingActive}
            onClick={() =>
              startWorkoutSession(
                {
                  title: sessionTitle.trim() || 'Live Workout Session',
                  sessionType: sessionType.trim() || 'Calisthenics',
                },
                {
                  onSuccess: () => {
                    setSessionTitle('')
                    setSessionType('')
                  },
                },
              )
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
            className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
          />
          <input
            value={sessionType}
            onChange={(event) => setSessionType(event.target.value)}
            placeholder="Session type (e.g., Strength / Calisthenics)"
            className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
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
        <article className="rounded-xl border border-border bg-surface p-4 text-sm text-slate-400">
          No active workout session. Start a workout to enter Live Session Mode.
        </article>
      )}


      {selectedDate ? (
        <article className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-base font-semibold text-slate-100">Workouts on {formatIndiaDate(selectedDate)}</h3>
          {workoutsForSelectedDate.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">No workouts logged for this date.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {workoutsForSelectedDate.map((workout) => {
                const isExpanded = expandedWorkoutId === workout.id
                return (
                  <li key={`day-${workout.id}`} className="rounded-lg border border-border bg-[#111111] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-200">{workout.duration_minutes} min</p>
                        <button
                          type="button"
                          onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-slate-300 hover:bg-[#222222]"
                        >
                          {isExpanded ? 'Hide' : 'Details'}
                        </button>
                        {confirmDeleteId === workout.id ? (
                          <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1">
                            <span className="text-xs text-red-400">Sure?</span>
                            <button
                              type="button"
                              disabled={isDeletingWorkout}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                deleteWorkout({ id: workout.id })
                                setConfirmDeleteId(null)
                                if (expandedWorkoutId === workout.id) setExpandedWorkoutId(null)
                              }}
                              className="text-xs font-semibold text-red-400 hover:text-red-300"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setConfirmDeleteId(null)
                              }}
                              className="text-xs text-slate-400 hover:text-slate-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <DeleteButton
                            disabled={isDeletingWorkout}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setConfirmDeleteId(workout.id)
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {workout.session_type || 'General'}
                    </p>
                    {workout.notes ? <p className="mt-1 text-xs text-slate-300">{workout.notes}</p> : null}

                    {isExpanded ? (
                      <div className="mt-3 rounded-lg border border-border bg-black p-2">
                        {(expandedWorkoutDetail?.logs ?? []).length === 0 ? (
                          <p className="text-xs text-slate-400">No exercise logs captured.</p>
                        ) : (
                          <ul className="space-y-1">
                            {(expandedWorkoutDetail?.logs ?? []).map((log) => (
                              <li key={log.id} className="text-xs text-slate-300 flex flex-wrap items-center gap-1">
                                <span className="font-medium text-slate-200">{log.exercise_name}:</span>
                                <span className="font-semibold text-emerald-400/90 drop-shadow-[0_0_3px_rgba(16,185,129,0.2)]">{log.sets ?? 1} set</span>, 
                                <span className="font-semibold text-emerald-400/90 drop-shadow-[0_0_3px_rgba(16,185,129,0.2)]">{log.reps_total ?? 0} reps</span>
                                {log.weight_kg ? (
                                  <span className="font-bold text-cyan-400/90 drop-shadow-[0_0_3px_rgba(34,211,238,0.2)]">
                                    @ {log.weight_kg}kg
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </article>
      ) : null}
      <article className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-base font-semibold text-slate-100">Recent Completed Sessions</h3>
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
            {recentCompletedWorkouts.map((workout) => {
              const isExpanded = expandedWorkoutId === workout.id
              return (
                <li key={workout.id} className="rounded-lg border border-border bg-[#111111] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-slate-200">{workout.duration_minutes} min</p>
                      <button
                        type="button"
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-slate-300 hover:bg-[#222222]"
                      >
                        {isExpanded ? 'Hide' : 'Details'}
                      </button>
                      {confirmDeleteId === workout.id ? (
                        <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 px-2 py-1">
                          <span className="text-xs text-red-400">Sure?</span>
                          <button
                            type="button"
                            disabled={isDeletingWorkout}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              deleteWorkout({ id: workout.id })
                              setConfirmDeleteId(null)
                              if (expandedWorkoutId === workout.id) setExpandedWorkoutId(null)
                            }}
                            className="text-xs font-semibold text-red-400 hover:text-red-300"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setConfirmDeleteId(null)
                            }}
                            className="text-xs text-slate-400 hover:text-slate-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <DeleteButton
                          disabled={isDeletingWorkout}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setConfirmDeleteId(workout.id)
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatIndiaDate(workout.workout_date)} • {workout.session_type || 'General'}
                  </p>

                  {isExpanded ? (
                    <div className="mt-3 rounded-lg border border-border bg-black p-2">
                      {(expandedWorkoutDetail?.logs ?? []).length === 0 ? (
                        <p className="text-xs text-slate-400">No exercise logs captured.</p>
                      ) : (
                        <ul className="space-y-1">
                          {(expandedWorkoutDetail?.logs ?? []).map((log) => (
                            <li key={log.id} className="text-xs text-slate-300 flex flex-wrap items-center gap-1">
                              <span className="font-medium text-slate-200">{log.exercise_name}:</span>
                              <span className="font-semibold text-emerald-400/90 drop-shadow-[0_0_3px_rgba(16,185,129,0.2)]">{log.sets ?? 1} set</span>, 
                              <span className="font-semibold text-emerald-400/90 drop-shadow-[0_0_3px_rgba(16,185,129,0.2)]">{log.reps_total ?? 0} reps</span>
                              {log.weight_kg ? (
                                <span className="font-bold text-cyan-400/90 drop-shadow-[0_0_3px_rgba(34,211,238,0.2)]">
                                  @ {log.weight_kg}kg
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </li>
              )
            })}
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


