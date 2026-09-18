import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  type FitnessExercise,
  useCreateFitnessExercise,
  useDeleteFitnessExercise,
  useFitnessExercises,
  useUpdateFitnessExercise,
  useAllExerciseLogs,
} from '../api/useFitness'
import { DeleteButton } from '../../../components/DeleteButton'
import { LoadingView } from '../../../components/LoadingView'
import AnatomyWireframe from '../components/AnatomyWireframe'
import CreateExerciseForm, { type ExerciseFormState } from './CreateExerciseForm'

const emptyExerciseForm: ExerciseFormState = {
  name: '',
  category: '',
  movementPattern: '',
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
    movementPattern: exercise.movement_pattern ?? '',
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
  const { data: allLogs = [] } = useAllExerciseLogs()
  const { mutate: createExercise, isPending: isCreating, error: createError } = useCreateFitnessExercise()
  const { mutate: updateExercise, isPending: isUpdating, error: updateError } = useUpdateFitnessExercise()
  const { mutate: deleteExercise, isPending: isDeleting, error: deleteError } = useDeleteFitnessExercise()

  const [form, setForm] = useState<ExerciseFormState>(emptyExerciseForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState<ExerciseFormState>(emptyExerciseForm)
  
  // Categorization mode: 'muscle' or 'pattern'
  const [filterMode, setFilterMode] = useState<'muscle' | 'pattern'>('muscle')
  const [selectedMuscle, setSelectedMuscle] = useState('All')
  const [selectedPattern, setSelectedPattern] = useState('All')
  const [moreOpen, setMoreOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Map of exerciseId -> historical stats
  const historyByExerciseId = useMemo(() => {
    const map = new Map<string, { maxWeight: number | null, maxReps: number | null, lastDate: string | null }>()
    for (const log of allLogs) {
      const existing = map.get(log.exercise_id)
      const currentMaxWeight = log.weight_kg ?? null
      const currentMaxReps = log.reps_total ?? null
      if (!existing) {
        map.set(log.exercise_id, {
          maxWeight: currentMaxWeight,
          maxReps: currentMaxReps,
          lastDate: log.created_at
        })
      } else {
        if (currentMaxWeight != null && (existing.maxWeight == null || currentMaxWeight > existing.maxWeight)) {
          existing.maxWeight = currentMaxWeight
        }
        if (currentMaxReps != null && (existing.maxReps == null || currentMaxReps > existing.maxReps)) {
          existing.maxReps = currentMaxReps
        }
        if (!existing.lastDate || new Date(log.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = log.created_at
        }
      }
    }
    return map
  }, [allLogs])

  const muscleStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const exercise of exercises) {
      for (const rawMuscle of exercise.target_muscles ?? []) {
        const muscle = rawMuscle.trim()
        if (!muscle) continue
        counts.set(muscle, (counts.get(muscle) ?? 0) + 1)
      }
    }

    const sorted = [...counts.entries()].sort((left, right) => {
      if (left[1] === right[1]) return left[0].localeCompare(right[0])
      return right[1] - left[1]
    })

    return {
      top5: sorted.slice(0, 5).map(([muscle]) => muscle),
      more: sorted.slice(5).map(([muscle]) => muscle),
    }
  }, [exercises])

  const patternStats = useMemo(() => {
    const counts = new Map<string, number>()
    for (const exercise of exercises) {
      const pattern = (exercise.movement_pattern || 'OTHER').trim().toUpperCase()
      counts.set(pattern, (counts.get(pattern) ?? 0) + 1)
    }
    return ['All', ...Array.from(counts.keys()).sort()]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    if (filterMode === 'muscle') {
      if (selectedMuscle === 'All') return exercises
      return exercises.filter((exercise) => (exercise.target_muscles ?? []).includes(selectedMuscle))
    } else {
      if (selectedPattern === 'All') return exercises
      return exercises.filter((exercise) => (exercise.movement_pattern || 'OTHER').toUpperCase() === selectedPattern.toUpperCase())
    }
  }, [exercises, filterMode, selectedMuscle, selectedPattern])

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim()) {
      return
    }

    createExercise(
      {
        name: form.name,
        category: form.category,
        movementPattern: form.movementPattern,
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
        movementPattern: editingForm.movementPattern,
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
    <section className="space-y-8 pb-24 max-w-5xl mx-auto px-4">
      {mutationError ? (
        <article className="border border-threat-critical bg-threat-critical/10 p-3 text-sm text-threat-critical font-mono uppercase tracking-widest">
          Library update failed: {getReadableErrorMessage(mutationError)}
        </article>
      ) : null}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-threat-critical/30 pb-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-text-primary">Architectural Catalog</h2>
          <p className="text-[10px] text-threat-critical font-mono tracking-widest uppercase">Movement & Muscle Blueprint</p>
        </div>

        {/* Dual Mode Switcher: Muscle vs Pattern */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-surface border border-threat-critical/30 rounded-full p-1">
            <button
              type="button"
              onClick={() => setFilterMode('muscle')}
              className={`px-3 py-1 rounded-full text-[9px] uppercase font-mono tracking-widest transition-all ${
                filterMode === 'muscle' ? 'bg-threat-critical text-background font-bold shadow' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Primary Muscle
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pattern')}
              className={`px-3 py-1 rounded-full text-[9px] uppercase font-mono tracking-widest transition-all ${
                filterMode === 'pattern' ? 'bg-threat-critical text-background font-bold shadow' : 'text-text-tertiary hover:text-text-primary'
              }`}
            >
              Movement Pattern
            </button>
          </div>
          
          {filterMode === 'muscle' ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMuscle('All')}
                className={`px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest border transition-colors ${
                  selectedMuscle === 'All' ? 'bg-threat-critical text-background border-threat-critical' : 'bg-transparent text-text-secondary border-threat-critical/30 hover:bg-threat-critical/10'
                }`}
              >
                GLOBAL
              </button>
              {muscleStats.top5.map((muscle) => (
                <button
                  key={muscle}
                  onClick={() => setSelectedMuscle(muscle)}
                  className={`px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest border transition-colors ${
                    selectedMuscle === muscle ? 'bg-threat-critical text-background border-threat-critical' : 'bg-transparent text-text-secondary border-threat-critical/30 hover:bg-threat-critical/10'
                  }`}
                >
                  {muscle}
                </button>
              ))}
              {muscleStats.more.length > 0 ? (
                <details className="relative" open={moreOpen} onToggle={(event) => setMoreOpen((event.currentTarget as HTMLDetailsElement).open)}>
                  <summary className="cursor-pointer list-none px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest border border-threat-critical/30 text-text-secondary hover:bg-threat-critical/10 transition-colors">
                    + MORE
                  </summary>
                  <div className="absolute right-0 z-10 mt-2 w-48 border border-threat-critical/50 bg-background shadow-2xl">
                    <div className="flex flex-col p-1">
                      {muscleStats.more.map((muscle) => (
                        <button
                          key={muscle}
                          onClick={() => {
                            setSelectedMuscle(muscle)
                            setMoreOpen(false)
                          }}
                          className={`px-3 py-2 text-left text-[10px] uppercase font-mono transition-colors ${
                            selectedMuscle === muscle ? 'bg-threat-critical/20 text-threat-critical' : 'text-text-secondary hover:bg-threat-critical/10'
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
          ) : (
            <div className="flex flex-wrap gap-2">
              {patternStats.map((pat) => (
                <button
                  key={pat}
                  onClick={() => setSelectedPattern(pat)}
                  className={`px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest border transition-colors ${
                    selectedPattern.toUpperCase() === pat.toUpperCase()
                      ? 'bg-threat-critical text-background border-threat-critical'
                      : 'bg-transparent text-text-secondary border-threat-critical/30 hover:bg-threat-critical/10'
                  }`}
                >
                  {pat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <LoadingView
            variant="inline"
            label="INDEXING CATALOG"
            sublabel="AWAITING MOVEMENT VECTORS..."
          />
        </div>
      ) : null}
      {isError ? <p className="text-xs font-mono text-threat-critical">ERR: FAILED TO LOAD ARCHIVES.</p> : null}
      
      {!isLoading && !isError && filteredExercises.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-threat-critical/30">
          <p className="text-xs font-mono tracking-widest uppercase text-text-tertiary">NO MATCHING BLUEPRINTS FOUND.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => {
          const hist = historyByExerciseId.get(exercise.id)
          return (
            <div key={exercise.id} className="relative group border border-threat-critical/20 bg-surface/30 hover:bg-surface/50 transition-colors overflow-hidden">
              {editingId === exercise.id ? (
                <div className="p-4 relative z-10 bg-background border border-threat-critical shadow-xl">
                  <CreateExerciseForm
                    value={editingForm}
                    onChange={setEditingForm}
                    onSubmit={handleUpdate}
                    submitLabel="Commit Alteration"
                    isSubmitting={isUpdating}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null)
                      setEditingForm(emptyExerciseForm)
                    }}
                    className="mt-3 w-full py-2 border border-text-tertiary text-text-secondary text-[10px] uppercase font-mono hover:bg-surface"
                  >
                    ABORT
                  </button>
                </div>
              ) : (
                <div className="p-4 flex flex-col h-full justify-between">
                  <div>
                    {/* Visual Aid: Wireframe Anatomy SVG */}
                    <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-all pointer-events-none group-hover:scale-105">
                      <AnatomyWireframe
                        muscle={exercise.primary_muscle || exercise.target_muscles?.[0]}
                        pattern={exercise.movement_pattern}
                        width={46}
                        height={58}
                      />
                    </div>

                    <div className="mb-4 pr-12">
                      <p className="text-[10px] text-threat-critical font-mono tracking-widest uppercase mb-1">
                        {exercise.movement_pattern || exercise.category || 'ISOLATION'}
                      </p>
                      <h3 className="text-base font-bold text-text-primary tracking-wide uppercase leading-tight">{exercise.name}</h3>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] text-text-tertiary uppercase font-mono tracking-widest w-16 shrink-0 pt-0.5">TARGET</span>
                        <span className="text-xs text-text-secondary">{formatTagList(exercise.target_muscles)}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] text-text-tertiary uppercase font-mono tracking-widest w-16 shrink-0 pt-0.5">GEAR</span>
                        <span className="text-xs text-text-secondary">{formatTagList(exercise.equipment)}</span>
                      </div>
                      {exercise.notes && (
                        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-threat-critical/10">
                          <span className="text-xs text-text-tertiary italic">"{exercise.notes}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historical Data & Progression Basis */}
                  <div className="mt-4 pt-3 border-t border-threat-critical/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-tertiary uppercase tracking-wider">Historical Peak:</span>
                      <span className="text-text-primary font-bold">
                        {hist?.maxWeight != null ? `${hist.maxWeight} KG` : hist?.maxReps != null ? `${hist.maxReps} REPS` : 'NO LOGS'}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => beginEdit(exercise)}
                        className="flex-1 py-1.5 border border-threat-critical/30 text-text-secondary text-[10px] font-mono uppercase tracking-widest hover:bg-threat-critical/10 hover:text-threat-critical transition-colors"
                      >
                        EDIT
                      </button>
                      <DeleteButton
                        onClick={() => deleteExercise({ id: exercise.id })}
                        disabled={isDeleting}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => setIsCreateModalOpen(true)}
        aria-label="Add new exercise"
        className="fixed bottom-8 right-8 h-16 w-16 bg-threat-critical text-background font-mono text-2xl flex items-center justify-center hover:bg-threat-critical/80 transition-colors z-40"
      >
        +
      </button>

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4 backdrop-blur-sm">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl border border-threat-critical bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3 mb-6 border-b border-threat-critical/30 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-text-primary">Initialize Blueprint</h2>
                <p className="text-[10px] font-mono tracking-widest uppercase text-threat-critical mt-1">Register new movement vector</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-text-tertiary hover:text-threat-critical transition-colors"
              >
                ✕
              </button>
            </div>

            <CreateExerciseForm
              value={form}
              onChange={setForm}
              onSubmit={handleCreate}
              submitLabel="Register Vector"
              isSubmitting={isCreating}
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default FitnessLibraryPage
