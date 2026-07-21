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
  value: string
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

function getValueInputLabel(exercise: FitnessExercise | undefined): string {
  const unit = (exercise?.default_unit ?? '').toLowerCase()
  if (unit.includes('sec')) {
    return 'Seconds'
  }
  if (unit.includes('min')) {
    return 'Minutes'
  }
  if (unit.includes('dist')) {
    return 'Distance'
  }
  return 'Reps'
}

function isDurationUnit(exercise: FitnessExercise | undefined): boolean {
  const unit = (exercise?.default_unit ?? '').toLowerCase()
  return unit.includes('sec') || unit.includes('min')
}

function ActiveWorkoutPanel({ activeWorkout, exercises, onEndWorkout, isEnding }: ActiveWorkoutPanelProps) {
  const { data: workoutDetail } = useWorkoutDetail(activeWorkout.id)
  const { mutate: addExerciseLog, isPending: isAddingSet, error: addSetError } = useAddExerciseLog()

  const [now, setNow] = useState(() => Date.now())
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [manualSelectedExerciseIds, setManualSelectedExerciseIds] = useState<string[]>([])
  const [openComposerExerciseId, setOpenComposerExerciseId] = useState<string | null>(null)
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
    const ids = new Set(manualSelectedExerciseIds)
    for (const id of logsByExerciseId.keys()) {
      ids.add(id)
    }
    return Array.from(ids)
  }, [manualSelectedExerciseIds, logsByExerciseId])

  const handlePickExercise = (exercise: FitnessExercise) => {
    setManualSelectedExerciseIds((previous) => {
      if (previous.includes(exercise.id)) {
        return previous
      }
      return [...previous, exercise.id]
    })
    setOpenComposerExerciseId(exercise.id)
    setPickerOpen(false)
  }

  const handleAddSet = (exerciseId: string) => {
    const draft = setDraftByExerciseId[exerciseId] ?? { value: '', weight: '' }
    const value = Number.parseFloat(draft.value)
    const exercise = exerciseById.get(exerciseId)
    const weight = isBodyweightExercise(exercise) ? undefined : Number.parseFloat(draft.weight)
    const valueLabel = getValueInputLabel(exercise)
    const durationBased = isDurationUnit(exercise)

    if (Number.isNaN(value) || value <= 0) {
      return
    }

    const normalizedDurationMinutes = durationBased
      ? Math.max(1, valueLabel === 'Seconds' ? Math.ceil(value / 60) : Math.ceil(value))
      : undefined

    addExerciseLog(
      {
        workoutId: activeWorkout.id,
        exerciseId,
        sets: 1,
        repsTotal: durationBased ? undefined : Math.floor(value),
        durationMinutes: normalizedDurationMinutes,
        weightKg: Number.isNaN(weight ?? Number.NaN) ? undefined : weight,
      },
      {
        onSuccess: () => {
          setSetDraftByExerciseId((previous) => ({
            ...previous,
            [exerciseId]: {
              value: '',
              weight: '',
            },
          }))
          // We no longer remove from manualSelectedExerciseIds here
          // so the user can easily continue adding sets.
          // Auto-scroll to ensure it stays in view
          setTimeout(() => {
            document.getElementById(`exercise-card-${exerciseId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
          }, 50)
        },
      },
    )
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Live Session</h2>
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
          <article className="rounded-md border border-border bg-black p-3 text-sm text-slate-400">
            No exercises added yet.
          </article>
        ) : null}

        {selectedExerciseIds.map((exerciseId) => {
          const exercise = exerciseById.get(exerciseId)
          const exerciseLogs = logsByExerciseId.get(exerciseId) ?? []
          const isBodyweight = isBodyweightExercise(exercise)
          const draft = setDraftByExerciseId[exerciseId] ?? { value: '', weight: '' }
          const nextSetNumber = exerciseLogs.length + 1
          const valueLabel = getValueInputLabel(exercise)
          const showComposer = openComposerExerciseId === exerciseId

          const lastLog = exerciseLogs.length > 0 ? exerciseLogs[exerciseLogs.length - 1] : null

          return (
            <article key={exerciseId} id={`exercise-card-${exerciseId}`} className="rounded-md border border-border bg-black p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-100">{exercise?.name ?? 'Unknown Exercise'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {exercise?.target_muscles?.[0] ?? 'General'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span>{exerciseLogs.length} Set{exerciseLogs.length !== 1 ? 's' : ''}</span>
                    {lastLog && (
                      <span className="opacity-75">
                        Last: {lastLog.weight_kg ? `${lastLog.weight_kg}kg × ` : ''}{lastLog.reps_total || lastLog.duration_minutes || '?'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenComposerExerciseId(showComposer ? null : exerciseId)}
                  className="rounded-md border border-border px-3 py-1 text-xs text-slate-200 hover:bg-[#111111]"
                >
                  {showComposer ? 'Hide' : 'Expand'}
                </button>
              </div>

              {showComposer ? (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  {exerciseLogs.map((log, index) => (
                    <div key={log.id} className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-12 text-slate-500">Set {index + 1}</span>
                      {log.weight_kg ? (
                        <span className="w-16">{log.weight_kg} kg</span>
                      ) : (
                        <span className="w-16">{isBodyweight ? 'BW' : '-'}</span>
                      )}
                      <span>× {log.reps_total || log.duration_minutes || '?'} {valueLabel}</span>
                    </div>
                  ))}

                  <div className="mt-3 grid grid-cols-1 gap-2 pt-2 md:grid-cols-[80px_1fr_1fr_auto]">
                    <input
                      value={`Set ${nextSetNumber}`}
                      readOnly
                      className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-400 focus:outline-none"
                    />
                    <input
                      type="number"
                      min={1}
                      step={valueLabel === 'Reps' ? '1' : '0.5'}
                      value={draft.value}
                      onChange={(event) =>
                        setSetDraftByExerciseId((previous) => ({
                          ...previous,
                          [exerciseId]: {
                            ...draft,
                            value: event.target.value,
                          },
                        }))
                      }
                      placeholder={valueLabel}
                      className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
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
                        className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-600"
                      />
                    ) : (
                      <div className="rounded-lg border border-border bg-[#111111] px-3 py-2 text-sm text-slate-400">Bodyweight</div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAddSet(exerciseId)}
                      disabled={isAddingSet}
                      className={`${greenReplicaButtonClass} disabled:opacity-60`}
                    >
                      Save Set
                    </button>
                  </div>
                </div>
              ) : null}
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
