import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  type FitnessExercise,
  useCreateFitnessExercise,
  useDeleteFitnessExercise,
  useFitnessExercises,
  useUpdateFitnessExercise,
} from '../api/useFitness'

type ExerciseFormState = {
  name: string
  category: string
  equipment: string
  primaryMuscle: string
  defaultUnit: string
  notes: string
}

const emptyExerciseForm: ExerciseFormState = {
  name: '',
  category: '',
  equipment: '',
  primaryMuscle: '',
  defaultUnit: '',
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

function mapExerciseToForm(exercise: FitnessExercise): ExerciseFormState {
  return {
    name: exercise.name,
    category: exercise.category ?? '',
    equipment: exercise.equipment ?? '',
    primaryMuscle: exercise.primary_muscle ?? '',
    defaultUnit: exercise.default_unit ?? '',
    notes: exercise.notes ?? '',
  }
}

function FitnessLibraryPage() {
  const { data: exercises = [], isLoading, isError } = useFitnessExercises()
  const { mutate: createExercise, isPending: isCreating, error: createError } = useCreateFitnessExercise()
  const { mutate: updateExercise, isPending: isUpdating, error: updateError } = useUpdateFitnessExercise()
  const { mutate: deleteExercise, isPending: isDeleting, error: deleteError } = useDeleteFitnessExercise()

  const [form, setForm] = useState<ExerciseFormState>(emptyExerciseForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<ExerciseFormState>(emptyExerciseForm)

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    createExercise(
      {
        name: form.name,
        category: form.category,
        equipment: form.equipment,
        primaryMuscle: form.primaryMuscle,
        defaultUnit: form.defaultUnit,
        notes: form.notes,
      },
      {
        onSuccess: () => {
          setForm(emptyExerciseForm)
        },
      },
    )
  }

  const beginEdit = (exercise: FitnessExercise) => {
    setEditingId(exercise.id)
    setEditingForm(mapExerciseToForm(exercise))
  }

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!editingId || !editingForm.name.trim()) {
      return
    }

    updateExercise(
      {
        id: editingId,
        name: editingForm.name,
        category: editingForm.category,
        equipment: editingForm.equipment,
        primaryMuscle: editingForm.primaryMuscle,
        defaultUnit: editingForm.defaultUnit,
        notes: editingForm.notes,
      },
      {
        onSuccess: () => {
          setEditingId(null)
          setEditingForm(emptyExerciseForm)
        },
      },
    )
  }

  const mutationError = createError ?? updateError ?? deleteError

  return (
    <section className="space-y-4">
      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Create Exercise</h2>
        <p className="mt-1 text-xs text-slate-400">Custom-only exercise library for quick reuse in workout logs.</p>

        <form onSubmit={handleCreate} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Exercise name
            <input
              value={form.name}
              onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Category
            <input
              value={form.category}
              onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))}
              placeholder="Strength / Cardio / Mobility"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Equipment
            <input
              value={form.equipment}
              onChange={(event) => setForm((previous) => ({ ...previous, equipment: event.target.value }))}
              placeholder="Barbell, Dumbbell, Bodyweight"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Primary muscle
            <input
              value={form.primaryMuscle}
              onChange={(event) => setForm((previous) => ({ ...previous, primaryMuscle: event.target.value }))}
              placeholder="Chest, Back, Legs"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Default unit
            <input
              value={form.defaultUnit}
              onChange={(event) => setForm((previous) => ({ ...previous, defaultUnit: event.target.value }))}
              placeholder="reps, min, km"
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-sm text-slate-300 md:col-span-2">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={isCreating || !form.name.trim()}
            className="rounded-md border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60 md:col-span-2"
          >
            {isCreating ? 'Creating...' : 'Create Exercise'}
          </button>
        </form>
      </article>

      {mutationError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Library update failed: {getReadableErrorMessage(mutationError)}
        </article>
      ) : null}

      <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Exercise Library</h2>

        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading exercises...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">Failed to load exercises.</p> : null}
        {!isLoading && !isError && exercises.length === 0 ? <p className="mt-3 text-sm text-slate-400">No exercises yet.</p> : null}

        <ul className="mt-3 space-y-3">
          {exercises.map((exercise) => (
            <li key={exercise.id} className="rounded-lg border border-slate-700 bg-slate-800 p-3">
              {editingId === exercise.id ? (
                <form onSubmit={handleUpdate} className="space-y-2">
                  <input
                    value={editingForm.name}
                    onChange={(event) => setEditingForm((previous) => ({ ...previous, name: event.target.value }))}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={editingForm.category}
                      onChange={(event) => setEditingForm((previous) => ({ ...previous, category: event.target.value }))}
                      placeholder="Category"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={editingForm.equipment}
                      onChange={(event) => setEditingForm((previous) => ({ ...previous, equipment: event.target.value }))}
                      placeholder="Equipment"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={editingForm.primaryMuscle}
                      onChange={(event) => setEditingForm((previous) => ({ ...previous, primaryMuscle: event.target.value }))}
                      placeholder="Primary muscle"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                    <input
                      value={editingForm.defaultUnit}
                      onChange={(event) => setEditingForm((previous) => ({ ...previous, defaultUnit: event.target.value }))}
                      placeholder="Default unit"
                      className="rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                    />
                  </div>
                  <textarea
                    value={editingForm.notes}
                    onChange={(event) => setEditingForm((previous) => ({ ...previous, notes: event.target.value }))}
                    rows={2}
                    className="w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-sm text-slate-100"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-100 hover:bg-slate-700 disabled:opacity-60"
                    >
                      {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditingForm(emptyExerciseForm)
                      }}
                      className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-100">{exercise.name}</p>
                  <p className="text-xs text-slate-400">
                    {exercise.category || 'General'} • {exercise.equipment || 'No equipment'} • {exercise.primary_muscle || 'N/A'}
                  </p>
                  {exercise.default_unit ? <p className="text-xs text-slate-400">Default unit: {exercise.default_unit}</p> : null}
                  {exercise.notes ? <p className="mt-1 text-xs text-slate-300">{exercise.notes}</p> : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(exercise)}
                      className="rounded-md border border-slate-600 bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteExercise({ id: exercise.id })}
                      disabled={isDeleting}
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
    </section>
  )
}

export default FitnessLibraryPage
