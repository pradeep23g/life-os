import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  type FitnessExercise,
  useCreateFitnessExercise,
  useDeleteFitnessExercise,
  useFitnessExercises,
  useUpdateFitnessExercise,
} from '../api/useFitness'
import CreateExerciseForm, { type ExerciseFormState } from './CreateExerciseForm'

const emptyExerciseForm: ExerciseFormState = {
  name: '',
  category: '',
  equipment: [],
  targetMuscles: [],
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
    equipment: exercise.equipment ?? [],
    targetMuscles: exercise.target_muscles ?? [],
    defaultUnit: exercise.default_unit ?? '',
    notes: exercise.notes ?? '',
  }
}

function formatTagList(tags: string[] | null): string {
  if (!tags || tags.length === 0) {
    return 'N/A'
  }

  return tags.join(', ')
}

function FitnessLibraryPage() {
  const { data: exercises = [], isLoading, isError } = useFitnessExercises()
  const { mutate: createExercise, isPending: isCreating, error: createError } = useCreateFitnessExercise()
  const { mutate: updateExercise, isPending: isUpdating, error: updateError } = useUpdateFitnessExercise()
  const { mutate: deleteExercise, isPending: isDeleting, error: deleteError } = useDeleteFitnessExercise()

  const [form, setForm] = useState<ExerciseFormState>(emptyExerciseForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<ExerciseFormState>(emptyExerciseForm)
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [moreOpen, setMoreOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const muscleStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const exercise of exercises) {
      for (const rawMuscle of exercise.target_muscles ?? []) {
        const muscle = rawMuscle.trim()
        if (!muscle) {
          continue
        }
        counts.set(muscle, (counts.get(muscle) ?? 0) + 1)
      }
    }

    const sorted = [...counts.entries()].sort((left, right) => {
      if (left[1] === right[1]) {
        return left[0].localeCompare(right[0])
      }
      return right[1] - left[1]
    })

    return {
      top5: sorted.slice(0, 5).map(([muscle]) => muscle),
      more: sorted.slice(5).map(([muscle]) => muscle),
    }
  }, [exercises])

  const filteredExercises = useMemo(() => {
    if (selectedMuscle === 'All') {
      return exercises
    }

    return exercises.filter((exercise) => (exercise.target_muscles ?? []).includes(selectedMuscle))
  }, [exercises, selectedMuscle])

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
        targetMuscles: form.targetMuscles,
        defaultUnit: form.defaultUnit,
        notes: form.notes,
      },
      {
        onSuccess: () => {
          setForm(emptyExerciseForm)
          setIsCreateModalOpen(false)
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
        targetMuscles: editingForm.targetMuscles,
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
    <section className="space-y-4 pb-24">
      {mutationError ? (
        <article className="rounded-xl border border-red-800 bg-red-950/20 p-3 text-sm text-red-200">
          Library update failed: {getReadableErrorMessage(mutationError)}
        </article>
      ) : null}

      <article className="rounded-xl border border-[#222222] bg-[#0a0a0a] p-4">
        <h2 className="text-lg font-semibold text-slate-100">Exercise Library</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMuscle('All')}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              selectedMuscle === 'All'
                ? 'border-slate-500 bg-slate-800 text-slate-100'
                : 'border-[#222222] bg-black text-slate-300 hover:bg-slate-900'
            }`}
          >
            All
          </button>
          {muscleStats.top5.map((muscle) => (
            <button
              key={muscle}
              type="button"
              onClick={() => setSelectedMuscle(muscle)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedMuscle === muscle
                  ? 'border-slate-500 bg-slate-800 text-slate-100'
                  : 'border-[#222222] bg-black text-slate-300 hover:bg-slate-900'
              }`}
            >
              {muscle}
            </button>
          ))}
          {muscleStats.more.length > 0 ? (
            <details className="relative" open={moreOpen} onToggle={(event) => setMoreOpen((event.currentTarget as HTMLDetailsElement).open)}>
              <summary className="cursor-pointer list-none rounded-full border border-[#222222] bg-black px-3 py-1 text-xs text-slate-300 hover:bg-slate-900">
                More ▾
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-md border border-[#222222] bg-black p-2 shadow-2xl">
                <div className="flex flex-col gap-1">
                  {muscleStats.more.map((muscle) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => {
                        setSelectedMuscle(muscle)
                        setMoreOpen(false)
                      }}
                      className={`rounded px-2 py-1 text-left text-xs transition-colors ${
                        selectedMuscle === muscle ? 'bg-slate-800 text-slate-100' : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          ) : null}
        </div>

        {isLoading ? <p className="mt-3 text-sm text-slate-400">Loading exercises...</p> : null}
        {isError ? <p className="mt-3 text-sm text-red-400">Failed to load exercises.</p> : null}
        {!isLoading && !isError && filteredExercises.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">No exercises match this filter.</p>
        ) : null}

        <ul className="mt-3 space-y-3">
          {filteredExercises.map((exercise) => (
            <li key={exercise.id} className="rounded-lg border border-[#222222] bg-black p-3">
              {editingId === exercise.id ? (
                <CreateExerciseForm
                  value={editingForm}
                  onChange={setEditingForm}
                  onSubmit={handleUpdate}
                  submitLabel="Save Changes"
                  isSubmitting={isUpdating}
                />
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-100">{exercise.name}</p>
                  <p className="text-xs text-slate-400">
                    {exercise.category || 'General'} • Equipment: {formatTagList(exercise.equipment)} • Muscles:{' '}
                    {formatTagList(exercise.target_muscles)}
                  </p>
                  {exercise.default_unit ? <p className="text-xs text-slate-400">Default unit: {exercise.default_unit}</p> : null}
                  {exercise.notes ? <p className="mt-1 text-xs text-slate-300">{exercise.notes}</p> : null}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => beginEdit(exercise)}
                      className="rounded-md border border-[#222222] bg-[#0a0a0a] px-3 py-1 text-xs text-slate-100 transition-colors hover:bg-slate-900"
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
              {editingId === exercise.id ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditingForm(emptyExerciseForm)
                    }}
                    className="rounded-md border border-[#222222] px-3 py-1 text-sm text-slate-300 transition-colors hover:bg-slate-900"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </article>

      <button
        type="button"
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-slate-900 border border-emerald-900 text-emerald-500 text-2xl flex items-center justify-center hover:bg-slate-800 transition-colors z-50 shadow-lg"
      >
        +
      </button>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(false)}
            className="absolute inset-0"
            aria-label="Close create exercise modal"
          />
          <article className="relative z-10 w-full max-w-3xl rounded-xl border border-[#222222] bg-[#0a0a0a] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Create Exercise</h2>
                <p className="mt-1 text-xs text-slate-400">Custom-only exercise library for quick reuse in workout logs.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md border border-[#222222] bg-black px-3 py-1 text-sm text-slate-100 hover:bg-slate-900"
              >
                Close
              </button>
            </div>

            <CreateExerciseForm
              value={form}
              onChange={setForm}
              onSubmit={handleCreate}
              submitLabel="Create Exercise"
              isSubmitting={isCreating}
            />
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default FitnessLibraryPage
