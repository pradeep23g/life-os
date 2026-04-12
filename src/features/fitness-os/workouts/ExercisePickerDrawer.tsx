import type { FitnessExercise } from '../api/useFitness'

type ExercisePickerDrawerProps = {
  isOpen: boolean
  exercises: FitnessExercise[]
  selectedMuscle: string
  onSelectMuscle: (value: string) => void
  onPickExercise: (exercise: FitnessExercise) => void
  onClose: () => void
}

const preferredMuscles = ['Chest', 'Back', 'Legs', 'Core', 'Shoulders', 'Arms']

function normalizeMuscle(value: string): string {
  return value.trim() || 'Other'
}

function ExercisePickerDrawer({
  isOpen,
  exercises,
  selectedMuscle,
  onSelectMuscle,
  onPickExercise,
  onClose,
}: ExercisePickerDrawerProps) {
  if (!isOpen) {
    return null
  }

  const groupedMuscles = new Set<string>()
  for (const exercise of exercises) {
    for (const rawMuscle of exercise.target_muscles ?? []) {
      groupedMuscles.add(normalizeMuscle(rawMuscle))
    }
  }

  const filterOptions = [
    'All',
    ...preferredMuscles.filter((item) => groupedMuscles.has(item)),
    ...[...groupedMuscles].filter((item) => !preferredMuscles.includes(item)),
  ]

  const filteredExercises =
    selectedMuscle === 'All'
      ? exercises
      : exercises.filter((exercise) => (exercise.target_muscles ?? []).includes(selectedMuscle))

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close exercise picker" />

      <aside className="absolute inset-y-0 right-0 w-full max-w-md border-l border-[#222222] bg-[#0a0a0a] p-4 shadow-2xl shadow-black/80">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Pick Exercise</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#222222] bg-black px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-900"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filterOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSelectMuscle(item)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                selectedMuscle === item
                  ? 'border-emerald-900 bg-emerald-950/30 text-emerald-400'
                  : 'border-[#222222] bg-black text-slate-300 hover:bg-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="mt-4 space-y-2 overflow-y-auto pb-4">
          {filteredExercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => onPickExercise(exercise)}
                className="w-full rounded-md border border-[#222222] bg-black p-3 text-left hover:bg-slate-900"
              >
                <p className="text-sm font-semibold text-slate-100">{exercise.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {exercise.target_muscles?.[0] ? normalizeMuscle(exercise.target_muscles[0]) : 'Other'} •{' '}
                  {exercise.category || 'General'}
                </p>
              </button>
            </li>
          ))}
          {filteredExercises.length === 0 ? (
            <li className="rounded-md border border-[#222222] bg-black p-3 text-sm text-slate-400">
              No exercises match this filter.
            </li>
          ) : null}
        </ul>
      </aside>
    </div>
  )
}

export default ExercisePickerDrawer
