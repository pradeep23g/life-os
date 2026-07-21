import { useEffect, useMemo } from 'react'
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
  useEffect(() => {
    if (!isOpen) return
    const originalHtml = document.documentElement.style.overflow
    const originalBody = document.body.style.overflow
    
    // Check if body has scrollbar to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.documentElement.style.overflow = originalHtml
      document.body.style.overflow = originalBody
      document.body.style.paddingRight = ''
    }
  }, [isOpen])
  const filterOptions = useMemo(() => {
    const groupedMuscles = new Set<string>()
    for (const exercise of exercises) {
      for (const rawMuscle of exercise.target_muscles ?? []) {
        groupedMuscles.add(normalizeMuscle(rawMuscle))
      }
    }

    return [
      'All',
      ...preferredMuscles.filter((item) => groupedMuscles.has(item)),
      ...[...groupedMuscles].filter((item) => !preferredMuscles.includes(item)),
    ]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    return selectedMuscle === 'All'
      ? exercises
      : exercises.filter((exercise) => (exercise.target_muscles ?? []).includes(selectedMuscle))
  }, [exercises, selectedMuscle])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close exercise picker" />

      <aside className="absolute inset-y-0 right-0 w-full max-w-md border-l border-border bg-surface shadow-2xl shadow-black/80 flex flex-col">
        <div className="p-4 flex-none border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">Pick Exercise</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-[#111111] px-3 py-1.5 text-sm text-slate-200 hover:bg-[#222222]"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onSelectMuscle(item)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  selectedMuscle === item
                    ? 'border-green-900 bg-green-950/30 text-green-400'
                    : 'border-border bg-[#111111] text-slate-300 hover:bg-[#222222]'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredExercises.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => onPickExercise(exercise)}
                className="w-full rounded-md border border-border bg-[#111111] p-3 text-left hover:bg-[#222222] focus:outline-none focus:ring-1 focus:ring-green-500/50"
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
            <li className="rounded-md border border-border bg-[#111111] p-3 text-sm text-slate-400">
              No exercises match this filter.
            </li>
          ) : null}
        </ul>
      </aside>
    </div>
  )
}

export default ExercisePickerDrawer
