import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  type ExerciseLog,
  type FitnessExercise,
  type Workout,
  useAddExerciseLog,
  useCreateWorkout,
  useDeleteExerciseLog,
  useDeleteWorkout,
  useFitnessExercises,
  useUpdateExerciseLog,
  useUpdateWorkout,
  useWorkoutDetail,
  useWorkouts,
} from '../api/useFitness'
import { formatIndiaDate } from '../utils/date'

type WorkoutFormState = {
  workoutDate: string
  title: string
  sessionType: string
  durationMinutes: string
  notes: string
}

type ExerciseLogFormState = {
  exerciseId: string
  sets: string
  repsTotal: string
  weightKg: string
  durationMinutes: string
  distanceKm: string
  rpe: string
  notes: string
}

const emptyWorkoutForm: WorkoutFormState = {
  workoutDate: '',
  title: '',
  sessionType: '',
  durationMinutes: '45',
  notes: '',
}

const emptyLogForm: ExerciseLogFormState = {
  exerciseId: '',
  sets: '',
  repsTotal: '',
  weightKg: '',
  durationMinutes: '',
  distanceKm: '',
  rpe: '',
  notes: '',
}

function getReadableErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim().length > 0) {
      return message
    }
  }

  return 'Unknown error'
}

function toOptionalInteger(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const parsed = Number.parseInt(trimmed, 10)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

function toOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const parsed = Number.parseFloat(trimmed)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return parsed
}

function mapLogToForm(log: ExerciseLog): ExerciseLogFormState {
  return {
    exerciseId: log.exercise_id,
    sets: log.sets === null ? '' : String(log.sets),
    repsTotal: log.reps_total === null ? '' : String(log.reps_total),
    weightKg: log.weight_kg === null ? '' : String(log.weight_kg),
    durationMinutes: log.duration_minutes === null ? '' : String(log.duration_minutes),
    distanceKm: log.distance_km === null ? '' : String(log.distance_km),
    rpe: log.rpe === null ? '' : String(log.rpe),
    notes: log.notes ?? '',
  }
}

function getWorkoutLabel(workout: Workout) {
  return `${workout.title} • ${formatIndiaDate(workout.workout_date)}`
}

function WorkoutsPage() {
  const { data: workouts = [], isLoading: workoutsLoading, isError: workoutsError } = useWorkouts()
  const { data: exercises = [] } = useFitnessExercises()

  const { mutate: createWorkout, isPending: isCreatingWorkout, error: createWorkoutError } = useCreateWorkout()
  const { mutate: updateWorkout, isPending: isUpdatingWorkout, error: updateWorkoutError } = useUpdateWorkout()
  const { mutate: deleteWorkout, isPending: isDeletingWorkout, error: deleteWorkoutError } = useDeleteWorkout()

  const { mutate: addExerciseLog, isPending: isAddingLog, error: addLogError } = useAddExerciseLog()
  const { mutate: updateExerciseLog, isPending: isUpdatingLog, error: updateLogError } = useUpdateExerciseLog()
  const { mutate: deleteExerciseLog, isPending: isDeletingLog, error: deleteLogError } = useDeleteExerciseLog()

  const [createForm, setCreateForm] = useState<WorkoutFormState>(() => ({
    ...emptyWorkoutForm,
    workoutDate: new Date().toISOString().slice(0, 10),
  }))

  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)
  const [editingWorkoutForm, setEditingWorkoutForm] = useState<WorkoutFormState>(emptyWorkoutForm)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null)

  const [newLogForm, setNewLogForm] = useState<ExerciseLogFormState>(emptyLogForm)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editingLogForm, setEditingLogForm] = useState<ExerciseLogFormState>(emptyLogForm)

  const selectedWorkout = useMemo(() => workouts.find((workout) => workout.id === selectedWorkoutId) ?? null, [selectedWorkoutId, workouts])
  const { data: workoutDetail } = useWorkoutDetail(selectedWorkoutId)
  const selectedExerciseId = newLogForm.exerciseId || exercises[0]?.id || ''

  const handleCreateWorkout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const parsedDuration = Number.parseInt(createForm.durationMinutes, 10)
    if (!createForm.title.trim() || !createForm.workoutDate || Number.isNaN(parsedDuration)) {
      return
    }

    createWorkout(
      {
        workoutDate: createForm.workoutDate,
        title: createForm.title,
        sessionType: createForm.sessionType,
        durationMinutes: parsedDuration,
        notes: createForm.notes,
      },
      {
        onSuccess: () => {
          setCreateForm({
            ...emptyWorkoutForm,
            workoutDate: new Date().toISOString().slice(0, 10),
          })
        },
      },
    )
  }

  const beginWorkoutEdit = (workout: Workout) => {
    setEditingWorkoutId(workout.id)
    setEditingWorkoutForm({
      workoutDate: workout.workout_date,
      title: workout.title,
      sessionType: workout.session_type ?? '',
      durationMinutes: String(workout.duration_minutes),
      notes: workout.notes ?? '',
    })
  }

  const submitWorkoutEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingWorkoutId) {
      return
    }

    const parsedDuration = Number.parseInt(editingWorkoutForm.durationMinutes, 10)
    if (!editingWorkoutForm.title.trim() || !editingWorkoutForm.workoutDate || Number.isNaN(parsedDuration)) {
      return
    }

    updateWorkout(
      {
        id: editingWorkoutId,
        workoutDate: editingWorkoutForm.workoutDate,
        title: editingWorkoutForm.title,
        sessionType: editingWorkoutForm.sessionType,
        durationMinutes: parsedDuration,
        notes: editingWorkoutForm.notes,
      },
      {
        onSuccess: () => {
          setEditingWorkoutId(null)
          setEditingWorkoutForm(emptyWorkoutForm)
        },
      },
    )
  }

  const handleDeleteWorkout = (workoutId: string) => {
    deleteWorkout(
      { id: workoutId },
      {
        onSuccess: () => {
          if (selectedWorkoutId === workoutId) {
            setSelectedWorkoutId(null)
          }
        },
      },
    )
  }

  const handleAddLog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const resolvedExerciseId = selectedExerciseId || undefined

    if (!selectedWorkoutId || !resolvedExerciseId) {
      return
    }

    addExerciseLog(
      {
        workoutId: selectedWorkoutId,
        exerciseId: resolvedExerciseId,
        sets: toOptionalInteger(newLogForm.sets),
        repsTotal: toOptionalInteger(newLogForm.repsTotal),
        weightKg: toOptionalFloat(newLogForm.weightKg),
        durationMinutes: toOptionalInteger(newLogForm.durationMinutes),
        distanceKm: toOptionalFloat(newLogForm.distanceKm),
        rpe: toOptionalInteger(newLogForm.rpe),
        notes: newLogForm.notes,
      },
      {
        onSuccess: () => {
          setNewLogForm({
            ...emptyLogForm,
            exerciseId: resolvedExerciseId,
          })
        },
      },
    )
  }

  const beginLogEdit = (log: ExerciseLog) => {
    setEditingLogId(log.id)
    setEditingLogForm(mapLogToForm(log))
  }

  const submitLogEdit = (event: FormEvent<HTMLFormElement>, log: ExerciseLog) => {
    event.preventDefault()

    updateExerciseLog(
      {
        id: log.id,
        workoutId: log.workout_id,
        exerciseId: editingLogForm.exerciseId || log.exercise_id,
        orderIndex: log.order_index,
        sets: toOptionalInteger(editingLogForm.sets),
        repsTotal: toOptionalInteger(editingLogForm.repsTotal),
        weightKg: toOptionalFloat(editingLogForm.weightKg),
        durationMinutes: toOptionalInteger(editingLogForm.durationMinutes),
        distanceKm: toOptionalFloat(editingLogForm.distanceKm),
        rpe: toOptionalInteger(editingLogForm.rpe),
        notes: editingLogForm.notes,
      },
      {
        onSuccess: () => {
          setEditingLogId(null)
          setEditingLogForm(emptyLogForm)
        },
      },
    )
  }

  const handleDeleteLog = (log: ExerciseLog) => {
    deleteExerciseLog({
      id: log.id,
      workoutId: log.workout_id,
    })
  }

  const mutationError =
    createWorkoutError ??
    updateWorkoutError ??
    deleteWorkoutError ??
    addLogError ??
    updateLogError ??
    deleteLogError

  const selectedLogs = workoutDetail?.logs ?? []

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Create Workout Session</h2>
        <form onSubmit={handleCreateWorkout} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Workout date
            <input
              type="date"
              value={createForm.workoutDate}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, workoutDate: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Session title
            <input
              value={createForm.title}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, title: event.target.value }))}
              placeholder="Push day, Run session, Mobility"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Session type
            <input
              value={createForm.sessionType}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, sessionType: event.target.value }))}
              placeholder="Strength / Cardio / Mobility"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-300">
            Duration (minutes)
            <input
              type="number"
              min={0}
              value={createForm.durationMinutes}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, durationMinutes: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <label className="block text-sm text-slate-300 md:col-span-2">
            Notes (optional)
            <textarea
              value={createForm.notes}
              onChange={(event) => setCreateForm((previous) => ({ ...previous, notes: event.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={isCreatingWorkout}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60 md:col-span-2"
          >
            {isCreatingWorkout ? 'Creating...' : 'Create Workout'}
          </button>
        </form>
      </article>

      {mutationError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Fitness update failed: {getReadableErrorMessage(mutationError)}
        </article>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Workout Sessions</h2>

          {workoutsLoading ? <p className="mt-3 text-sm text-slate-400">Loading workouts...</p> : null}
          {workoutsError ? <p className="mt-3 text-sm text-red-400">Failed to load workouts.</p> : null}
          {!workoutsLoading && !workoutsError && workouts.length === 0 ? <p className="mt-3 text-sm text-slate-400">No workouts logged yet.</p> : null}

          <ul className="mt-3 space-y-3">
            {workouts.map((workout) => (
              <li key={workout.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
                {editingWorkoutId === workout.id ? (
                  <form onSubmit={submitWorkoutEdit} className="space-y-2">
                    <input
                      type="date"
                      value={editingWorkoutForm.workoutDate}
                      onChange={(event) => setEditingWorkoutForm((previous) => ({ ...previous, workoutDate: event.target.value }))}
                      className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={editingWorkoutForm.title}
                      onChange={(event) => setEditingWorkoutForm((previous) => ({ ...previous, title: event.target.value }))}
                      className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={editingWorkoutForm.sessionType}
                        onChange={(event) => setEditingWorkoutForm((previous) => ({ ...previous, sessionType: event.target.value }))}
                        placeholder="Session type"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                      />
                      <input
                        type="number"
                        min={0}
                        value={editingWorkoutForm.durationMinutes}
                        onChange={(event) => setEditingWorkoutForm((previous) => ({ ...previous, durationMinutes: event.target.value }))}
                        className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                      />
                    </div>
                    <textarea
                      value={editingWorkoutForm.notes}
                      onChange={(event) => setEditingWorkoutForm((previous) => ({ ...previous, notes: event.target.value }))}
                      rows={2}
                      className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isUpdatingWorkout}
                        className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                      >
                        {isUpdatingWorkout ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWorkoutId(null)
                          setEditingWorkoutForm(emptyWorkoutForm)
                        }}
                        className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-100">{workout.title}</p>
                    <p className="text-xs text-slate-400">{formatIndiaDate(workout.workout_date)}</p>
                    <p className="text-xs text-slate-400">{workout.session_type || 'General'} • {workout.duration_minutes} min</p>
                    {workout.notes ? <p className="mt-1 text-xs text-slate-300">{workout.notes}</p> : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => beginWorkoutEdit(workout)}
                        className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWorkoutId((previous) => (previous === workout.id ? null : workout.id))}
                        className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
                      >
                        {selectedWorkoutId === workout.id ? 'Hide Logs' : 'Manage Logs'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkout(workout.id)}
                        disabled={isDeletingWorkout}
                        className="rounded-md border border-red-700/80 bg-red-900/20 px-3 py-1 text-xs text-red-200 hover:bg-red-900/40 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="text-lg font-semibold text-slate-100">Workout Log Editor</h2>
          {!selectedWorkout ? <p className="mt-3 text-sm text-slate-400">Select a workout from the left panel to manage aggregate exercise logs.</p> : null}

          {selectedWorkout ? (
            <>
              <p className="mt-2 text-sm text-slate-300">{getWorkoutLabel(selectedWorkout)}</p>

              {exercises.length === 0 ? (
                <p className="mt-3 text-sm text-amber-300">No library exercises found. Add exercises in Library first.</p>
              ) : (
                <form onSubmit={handleAddLog} className="mt-3 space-y-2 rounded-lg border border-slate-700 bg-slate-800 p-3">
                  <p className="text-xs font-semibold text-slate-200">Add Exercise Log</p>

                  <select
                    value={selectedExerciseId}
                    onChange={(event) => setNewLogForm((previous) => ({ ...previous, exerciseId: event.target.value }))}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                  >
                    <option value="">Select exercise</option>
                    {exercises.map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={newLogForm.sets}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, sets: event.target.value }))}
                      placeholder="Sets"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={newLogForm.repsTotal}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, repsTotal: event.target.value }))}
                      placeholder="Reps total"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={newLogForm.weightKg}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, weightKg: event.target.value }))}
                      placeholder="Weight kg"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={newLogForm.durationMinutes}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, durationMinutes: event.target.value }))}
                      placeholder="Duration min"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={newLogForm.distanceKm}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, distanceKm: event.target.value }))}
                      placeholder="Distance km"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={newLogForm.rpe}
                      onChange={(event) => setNewLogForm((previous) => ({ ...previous, rpe: event.target.value }))}
                      placeholder="RPE 1-10"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                  </div>

                  <textarea
                    value={newLogForm.notes}
                    onChange={(event) => setNewLogForm((previous) => ({ ...previous, notes: event.target.value }))}
                    rows={2}
                    placeholder="Notes"
                    className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                  />

                  <button
                    type="submit"
                    disabled={isAddingLog || !selectedExerciseId}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                  >
                    {isAddingLog ? 'Adding...' : 'Add Log'}
                  </button>
                </form>
              )}

              <ul className="mt-3 space-y-2">
                {selectedLogs.length === 0 ? <li className="text-sm text-slate-400">No exercise logs yet.</li> : null}
                {selectedLogs.map((log) => (
                  <li key={log.id} className="rounded-md border border-slate-700 bg-slate-800 p-2">
                    {editingLogId === log.id ? (
                      <form onSubmit={(event) => submitLogEdit(event, log)} className="space-y-2">
                        <select
                          value={editingLogForm.exerciseId}
                          onChange={(event) => setEditingLogForm((previous) => ({ ...previous, exerciseId: event.target.value }))}
                          className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                        >
                          {exercises.map((exercise: FitnessExercise) => (
                            <option key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={editingLogForm.sets}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, sets: event.target.value }))}
                            placeholder="Sets"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                          <input
                            value={editingLogForm.repsTotal}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, repsTotal: event.target.value }))}
                            placeholder="Reps total"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                          <input
                            value={editingLogForm.weightKg}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, weightKg: event.target.value }))}
                            placeholder="Weight kg"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                          <input
                            value={editingLogForm.durationMinutes}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, durationMinutes: event.target.value }))}
                            placeholder="Duration min"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                          <input
                            value={editingLogForm.distanceKm}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, distanceKm: event.target.value }))}
                            placeholder="Distance km"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                          <input
                            value={editingLogForm.rpe}
                            onChange={(event) => setEditingLogForm((previous) => ({ ...previous, rpe: event.target.value }))}
                            placeholder="RPE 1-10"
                            className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                          />
                        </div>
                        <textarea
                          value={editingLogForm.notes}
                          onChange={(event) => setEditingLogForm((previous) => ({ ...previous, notes: event.target.value }))}
                          rows={2}
                          className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="submit"
                            disabled={isUpdatingLog}
                            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                          >
                            {isUpdatingLog ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLogId(null)
                              setEditingLogForm(emptyLogForm)
                            }}
                            className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-slate-100">{log.exercise_name}</p>
                        <p className="text-xs text-slate-400">
                          Sets {log.sets ?? '-'} • Reps {log.reps_total ?? '-'} • Weight {log.weight_kg ?? '-'} kg
                        </p>
                        <p className="text-xs text-slate-400">
                          Duration {log.duration_minutes ?? '-'} min • Distance {log.distance_km ?? '-'} km • RPE {log.rpe ?? '-'}
                        </p>
                        {log.notes ? <p className="mt-1 text-xs text-slate-300">{log.notes}</p> : null}

                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => beginLogEdit(log)}
                            className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log)}
                            disabled={isDeletingLog}
                            className="rounded-md border border-red-700/80 bg-red-900/20 px-3 py-1 text-xs text-red-200 hover:bg-red-900/40 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>
      </div>
    </section>
  )
}

export default WorkoutsPage
