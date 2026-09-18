import { useEffect, useMemo, useState } from 'react'
import { X, Search, Database } from 'lucide-react'
import type { FitnessExercise } from '../api/useFitness'

type ExercisePickerDrawerProps = {
  isOpen: boolean
  exercises: FitnessExercise[]
  selectedMuscle: string
  onSelectMuscle: (value: string) => void
  onPickExercise: (exercise: FitnessExercise) => void
  onClose: () => void
}

export default function ExercisePickerDrawer({
  isOpen,
  exercises,
  onPickExercise,
  onClose,
}: ExercisePickerDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activePattern, setActivePattern] = useState<string>('ALL')

  useEffect(() => {
    if (!isOpen) return
    const originalHtml = document.documentElement.style.overflow
    const originalBody = document.body.style.overflow
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.documentElement.style.overflow = originalHtml
      document.body.style.overflow = originalBody
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  const patterns = useMemo(() => {
    const set = new Set<string>()
    exercises.forEach(ex => {
      if (ex.movement_pattern) set.add(ex.movement_pattern.toUpperCase())
    })
    return ['ALL', ...Array.from(set).sort()]
  }, [exercises])

  const filteredExercises = useMemo(() => {
    let result = exercises

    if (activePattern !== 'ALL') {
      result = result.filter(ex => (ex.movement_pattern || 'OTHER').toUpperCase() === activePattern)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(ex => 
        ex.name.toLowerCase().includes(q) || 
        (ex.target_muscles || []).some(m => m.toLowerCase().includes(q))
      )
    }

    return result
  }, [exercises, activePattern, searchQuery])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 bg-background/90 backdrop-blur-sm animate-fade-in">
      <article className="w-full h-full max-w-5xl flex flex-col border border-threat-critical/30 bg-background shadow-2xl shadow-threat-critical/10 relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-10 text-threat-critical/50 hover:text-threat-critical transition-colors p-2 border border-transparent hover:border-threat-critical/30">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <header className="shrink-0 p-6 border-b border-threat-critical/30 bg-surface/50">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-threat-critical" />
            <h2 className="text-sm font-mono tracking-[0.2em] uppercase text-text-primary">Architectural Catalog</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-threat-critical/50" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="QUERY CATALOG (E.G. DEADLIFT)"
                className="w-full bg-background border border-threat-critical/30 py-3 pl-12 pr-4 text-sm font-mono text-text-primary uppercase placeholder:text-text-tertiary focus:outline-none focus:border-threat-critical transition-colors"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto hide-scrollbar shrink-0 border border-threat-critical/30 p-1 bg-background">
              {patterns.map(pattern => (
                <button
                  key={pattern}
                  onClick={() => setActivePattern(pattern)}
                  className={`px-4 py-2 text-[10px] font-mono tracking-widest uppercase transition-colors shrink-0 ${
                    activePattern === pattern 
                      ? 'bg-threat-critical text-background font-bold' 
                      : 'text-text-secondary hover:text-threat-critical hover:bg-threat-critical/10'
                  }`}
                >
                  {pattern}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Grid Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.03)_0%,transparent_100%)]">
          {filteredExercises.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-tertiary font-mono tracking-widest text-[10px] uppercase">
              NO VECTORS FOUND
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredExercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => onPickExercise(ex)}
                  className="group relative flex flex-col text-left border border-threat-critical/20 bg-surface/30 p-4 hover:border-threat-critical hover:bg-threat-critical/5 transition-all overflow-hidden"
                >
                  {/* Decorative background element */}
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 border border-threat-critical/10 rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none opacity-20" />
                  
                  <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-1 relative z-10">{ex.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-auto pt-4 relative z-10">
                    <span className="text-[9px] font-mono tracking-widest px-2 py-1 bg-background border border-threat-critical/30 text-threat-critical">
                      {ex.movement_pattern || 'ISO'}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest px-2 py-1 bg-surface text-text-secondary border border-border-subtle truncate max-w-[120px]">
                      {ex.primary_muscle || 'COMPOUND'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
