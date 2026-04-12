import type { FormEvent } from 'react'

import TagInput from '../components/TagInput'

export type ExerciseFormState = {
  name: string
  category: string
  equipment: string[]
  targetMuscles: string[]
  defaultUnit: string
  notes: string
}

type CreateExerciseFormProps = {
  value: ExerciseFormState
  onChange: (nextValue: ExerciseFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  submitLabel: string
  isSubmitting: boolean
}

function CreateExerciseForm({ value, onChange, onSubmit, submitLabel, isSubmitting }: CreateExerciseFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="block text-sm text-slate-300">
        Exercise name
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Category
        <input
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}
          placeholder="Strength / Cardio / Mobility"
          className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Equipment tags
        <TagInput
          value={value.equipment}
          onChange={(equipment) => onChange({ ...value, equipment })}
          placeholder="Type then Enter (e.g. Resistance Band)"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Target muscles
        <TagInput
          value={value.targetMuscles}
          onChange={(targetMuscles) => onChange({ ...value, targetMuscles })}
          placeholder="Type then Enter (e.g. Traps)"
        />
      </label>
      <label className="block text-sm text-slate-300">
        Default unit
        <input
          value={value.defaultUnit}
          onChange={(event) => onChange({ ...value, defaultUnit: event.target.value })}
          placeholder="reps, min, km"
          className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
        />
      </label>
      <label className="block text-sm text-slate-300 md:col-span-2">
        Notes
        <textarea
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={2}
          className="mt-1 w-full rounded-md border border-[#222222] bg-black p-2 text-sm text-slate-100"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting || !value.name.trim()}
        className="rounded-md border border-[#222222] bg-[#0a0a0a] px-4 py-2 text-sm text-slate-100 transition-colors hover:bg-slate-900 disabled:opacity-60 md:col-span-2"
      >
        {isSubmitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

export default CreateExerciseForm
