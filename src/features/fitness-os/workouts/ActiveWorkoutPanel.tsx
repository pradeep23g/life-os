import { useEffect, useMemo, useState } from 'react'

import {
  type FitnessExercise,
  type Workout,
  useAddExerciseLog,
  useWorkoutDetail,
} from '../api/useFitness'
import ExercisePickerDrawer from './ExercisePickerDrawer'

type ActiveWorkoutPanelProps = {
  activeWorkout: Workout
  exercises: FitnessExercise[]
  onEndWorkout: () => void
  isEnding: boolean
}

type SetDraft = {
  reps: string
  weight: string
}

const greenReplicaButtonClass =
  'border border-emerald-900 text-emerald-500 hover:bg-emerald-950/30 transition-colors rounded px-4 py-2'

function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}

function isBodyweightExercise(exercise: FitnessExercise | undefined): boolean {
  if (!exercise) {
    return false
  }

  const category = (exercise.category ?? '').toLowerCase()
  const hasBodyweightEquipment = (exercise.equipment ?? []).some((item) => item.toLowerCase().includes('bodyweight'))
  return category.includes('bodyweight') || category.includes('calisthenics') || hasBodyweightEquipment
}

function ActiveWorkoutPanel({ activeWorkout, exercises, onEndWorkout, isEnding }: ActiveWorkoutPanelProps) {
  const { data: workoutDetail } = useWorkoutDetail(activeWorkout.id)
  const { mutate: addExerciseLog, isPending: isAddingSet, error: addSetError } = useAddExerciseLog()

  const [now, setNow] = useState(() => Date.now())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [manualSelectedExerciseIds, setManualSelectedExerciseIds] = useState<string[]>([])
  const [setDraftByExerciseId, setSetDraftByExerciseId] = useState<Record<string, SetDraft>>({})

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(timerId)
    }
  }, [])

  const elapsed = formatElapsed(now - new Date(activeWorkout.start_time ?? activeWorkout.created_at).getTime())
  const exerciseById = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises])
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
  const selectedExerciseIds = useMemo(() => {
    const fromLogs = (workoutDetail?.logs ?? []).map((log) => log.exercise_id)
    return [...new Set([...manualSelectedExerciseIds, ...fromLogs])]
  }, [manualSelectedExerciseIds, workoutDetail])

  const handlePickExercise = (exercise: FitnessExercise) => {
    setManualSelectedExerciseIds((previous) => {
      if (previous.includes(exercise.id)) {
        return previous
      }
      return [...previous, exercise.id]
    })
    setPickerOpen(false)
  }

  const handleAddSet = (exerciseId: string) => {
    const draft = setDraftByExerciseId[exerciseId] ?? { reps: '', weight: '' }
    const reps = Number.parseInt(draft.reps, 10)
    const exercise = exerciseById.get(exerciseId)
    const weight = isBodyweightExercise(exercise) ? undefined : Number.parseFloat(draft.weight)

    if (Number.isNaN(reps) || reps <= 0) {
      return
    }

    addExerciseLog(
      {
        workoutId: activeWorkout.id,
        exerciseId,
        sets: 1,
        repsTotal: reps,
        weightKg: Number.isNaN(weight ?? Number.NaN) ? undefined : weight,
      },
      {
        onSuccess: () => {
          setSetDraftByExerciseId((previous) => ({
            ...previous,
            [exerciseId]: {
              reps: '',
              weight: '',
            },
          }))
        },
      },
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Live Session</h2>
          <p className="mt-1 text-sm text-slate-300">{activeWorkout.title} - {elapsed}</p>
        </div>
        <button
          type="button"
          onClick={onEndWorkout}
          disabled={isEnding}
          className="rounded border border-rose-900 px-4 py-2 text-rose-400 transition-colors hover:bg-rose-950/30 disabled:opacity-60"
        >
          {isEnding ? 'Saving...' : 'End & Save Workout'}
        </button>
      </header>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Exercises in this session</p>
        <button type="button" onClick={() => setPickerOpen(true)} className={greenReplicaButtonClass}>
          + Add Exercise
        </button>
      </div>

      <div className="space-y-3">
        {selectedExerciseIds.length === 0 ? (
          <article className="rounded-md border border-[#222222] bg-black p-3 text-sm text-slate-400">
            No exercises added yet.
          </article>
        ) : null}

        {selectedExerciseIds.map((exerciseId) => {
          const exercise = exerciseById.get(exerciseId)
          const exerciseLogs = logsByExerciseId.get(exerciseId) ?? []
          const isBodyweight = isBodyweightExercise(exercise)
          const draft = setDraftByExerciseId[exerciseId] ?? { reps: '', weight: '' }
          const nextSetNumber = exerciseLogs.length + 1

          return (
            <article key={exerciseId} className="rounded-md border border-[#222222] bg-black p-3">
              <p className="text-sm font-semibold text-slate-100">{exercise?.name ?? 'Unknown Exercise'}</p>
              <p className="mt-1 text-xs text-slate-400">
                {exercise?.target_muscles?.[0] ?? 'General'} - {exercise?.category ?? 'General'}
              </p>

              <div className="mt-3 space-y-1">
                {exerciseLogs.map((log, index) => (
                  <p key={log.id} className="text-xs text-slate-300">
                    Set {index + 1}: {log.reps_total ?? 0} reps{log.weight_kg ? ` @ ${log.weight_kg} kg` : ''}
                  </p>
                ))}
                {exerciseLogs.length === 0 ? <p className="text-xs text-slate-500">No sets logged yet.</p> : null}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[90px_1fr_1fr_auto]">
                <input
                  value={`#${nextSetNumber}`}
                  readOnly
                  className="rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-slate-300"
                />
                <input
                  type="number"
                  min={1}
                  value={draft.reps}
                  onChange={(event) =>
                    setSetDraftByExerciseId((previous) => ({
                      ...previous,
                      [exerciseId]: {
                        ...draft,
                        reps: event.target.value,
                      },
                    }))
                  }
                  placeholder="Reps"
                  className="rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-slate-100"
                />
                {!isBodyweight ? (
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={draft.weight}
                    onChange={(event) =>
                      setSetDraftByExerciseId((previous) => ({
                        ...previous,
                        [exerciseId]: {
                          ...draft,
                          weight: event.target.value,
                        },
                      }))
                    }
                    placeholder="Weight (kg)"
                    className="rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-slate-100"
                  />
                ) : (
                  <div className="rounded border border-[#222222] bg-[#0a0a0a] px-3 py-2 text-sm text-slate-400">Bodyweight</div>
                )}
                <button
                  type="button"
                  onClick={() => handleAddSet(exerciseId)}
                  disabled={isAddingSet}
                  className={`${greenReplicaButtonClass} disabled:opacity-60`}
                >
                  Add Set
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {addSetError ? (
        <p className="text-sm text-red-400">{addSetError instanceof Error ? addSetError.message : 'Failed to add set.'}</p>
      ) : null}

      <ExercisePickerDrawer
        isOpen={pickerOpen}
        exercises={exercises}
        selectedMuscle={selectedMuscle}
        onSelectMuscle={setSelectedMuscle}
        onPickExercise={handlePickExercise}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  )
}

export default ActiveWorkoutPanel
