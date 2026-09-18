import type { FormEvent } from 'react'
import TagInput from '../components/TagInput'

export type ExerciseFormState = {
  name: string
  category: string
  movementPattern: string
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

export default function CreateExerciseForm({ value, onChange, onSubmit, submitLabel, isSubmitting }: CreateExerciseFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Exercise name
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          className="mt-1 w-full bg-background border border-threat-critical/30 p-2 text-sm font-mono text-text-primary focus:border-threat-critical focus:outline-none transition-colors"
        />
      </label>
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Movement Pattern
        <input
          value={value.movementPattern}
          onChange={(event) => onChange({ ...value, movementPattern: event.target.value })}
          placeholder="Push / Pull / Hinge / Squat"
          className="mt-1 w-full bg-background border border-threat-critical/30 p-2 text-sm font-mono text-text-primary focus:border-threat-critical focus:outline-none transition-colors"
        />
      </label>
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Category
        <input
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}
          placeholder="Strength / Cardio / Mobility"
          className="mt-1 w-full bg-background border border-threat-critical/30 p-2 text-sm font-mono text-text-primary focus:border-threat-critical focus:outline-none transition-colors"
        />
      </label>
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Default unit
        <input
          value={value.defaultUnit}
          onChange={(event) => onChange({ ...value, defaultUnit: event.target.value })}
          placeholder="reps, min, km, sec"
          className="mt-1 w-full bg-background border border-threat-critical/30 p-2 text-sm font-mono text-text-primary focus:border-threat-critical focus:outline-none transition-colors"
        />
      </label>
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Target muscles
        <TagInput
          value={value.targetMuscles}
          onChange={(targetMuscles) => onChange({ ...value, targetMuscles })}
          placeholder="Type then Enter (e.g. Chest)"
        />
      </label>
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase">
        Equipment tags
        <TagInput
          value={value.equipment}
          onChange={(equipment) => onChange({ ...value, equipment })}
          placeholder="Type then Enter (e.g. Barbell)"
        />
      </label>
      
      <label className="block text-[10px] text-text-tertiary font-mono tracking-widest uppercase md:col-span-2">
        Notes
        <textarea
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={2}
          className="mt-1 w-full bg-background border border-threat-critical/30 p-2 text-sm font-mono text-text-primary focus:border-threat-critical focus:outline-none transition-colors"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting || !value.name.trim()}
        className="w-full py-3 bg-threat-critical/10 border border-threat-critical text-threat-critical font-bold tracking-[0.2em] uppercase hover:bg-threat-critical hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2"
      >
        {isSubmitting ? 'SAVING...' : submitLabel.toUpperCase()}
      </button>
    </form>
  )
}
